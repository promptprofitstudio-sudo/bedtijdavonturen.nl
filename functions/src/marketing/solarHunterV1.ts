import * as functions from 'firebase-functions/v2';
import { defineSecret, defineBoolean, defineNumber } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

// Secrets
const dataForSeoLogin = defineSecret('DATAFORSEO_LOGIN');
const dataForSeoApiKey = defineSecret('DATAFORSEO_API_KEY');
const hunterApiKey = defineSecret('HUNTER_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const instantlyApiKey = defineSecret('INSTANTLY_API_KEY');
const instantlyCampaignSolar = defineSecret('INSTANTLY_CAMPAIGN_SOLAR');

// Config
const DRY_RUN = defineBoolean('SOLAR_HUNTER_DRY_RUN', { default: true });
const FIT_SCORE_THRESHOLD = defineNumber('SOLAR_HUNTER_FIT_SCORE_THRESHOLD', { default: 35 });

export const solarHunterV1 = functions.scheduler.onSchedule({
    schedule: '0 10 * * *',
    timeZone: 'UTC',
    secrets: [dataForSeoLogin, dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey, instantlyCampaignSolar],
    memory: '1GiB',
    timeoutSeconds: 900
}, async (event) => {
    const db = admin.firestore();
    const log = {
        timestamp: new Date().toISOString(),
        discovered: 0,
        verified: 0,
        rejected: 0,
        contacted: 0,
        errors: [] as string[],
        dryRun: DRY_RUN.value()
    };
    console.log(`☀️ Solar Hunter V1 - ${DRY_RUN.value() ? 'DRY-RUN' : 'PRODUCTION'} MODE - STARTING`);
    
    const SEARCH_CONFIGS = [
        { state: 'California', location: 'California, USA', query: 'solar installer' },
        { state: 'Texas', location: 'Texas, USA', query: 'solar installer' },
        { state: 'Arizona', location: 'Arizona, USA', query: 'solar installer' },
        { state: 'Florida', location: 'Florida, USA', query: 'solar installer' },
    ];

    for (const config of SEARCH_CONFIGS) {
        try {
            await processSearch(config.location, config.query, config.state, db, log);
        } catch (err: any) {
            log.errors.push(`${config.location}: ${err.message}`);
        }
    }

    await db.collection('solar_hunter_runs').add({ ...log, completedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('✅ Solar Hunter V1 - COMPLETE', log);
});

async function processSearch(location: string, searchQuery: string, state: string, db: admin.firestore.Firestore, log: any) {
    console.log(`\n=== Processing: ${location} - ${searchQuery} ===`);
    const discoveries = await fase1_discover(location, searchQuery);
    log.discovered += discoveries.length;
    console.log(`📍 Discovered ${discoveries.length} businesses`);

    for (const item of discoveries) {
        try {
            const verification = fase2_verify(item);
            if (verification.status === 'rejected') {
                log.rejected++;
                console.log(`❌ Rejected (Excluded Domain): ${item.title}`);
                await saveLead(db, { ...verification, location, state, searchQuery });
                continue;
            }

            const enriched = await fase3_enrich(verification);
            if (enriched.status === 'rejected') {
                log.rejected++;
                console.log(`❌ Rejected (Low FitScore): ${enriched.companyName} (FitScore: ${enriched.fitScore})`);
                await saveLead(db, { ...enriched, location, state, searchQuery });
                continue;
            }

            log.verified++;
            console.log(`✅ Verified: ${enriched.companyName} (FitScore: ${enriched.fitScore})`);

            if (enriched.email) {
                const personalized = await fase4_personalize(enriched);
                await fase5_sequence(personalized, db);
                log.contacted++;
                console.log(`📤 Sent to Instantly: ${personalized.email}`);
                await saveLead(db, { ...personalized, status: 'contacted', contactedAt: admin.firestore.Timestamp.now() });
            } else {
                await saveLead(db, { ...enriched, status: 'form_only' });
                console.log(`📝 Saved for manual follow-up: ${enriched.companyName}`);
            }
        } catch (err: any) {
            console.error(`Error processing ${item.title}:`, err.message);
            log.errors.push(`${item.title}: ${err.message}`);
        }
    }
}

async function fase1_discover(location: string, searchQuery: string) {
    const auth = Buffer.from(`${dataForSeoLogin.value()}:${dataForSeoApiKey.value()}`).toString('base64');
    const response = await axios.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced',
        [{ location_name: location.split(',')[0], keyword: searchQuery, language_code: "en" }],
        { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    return response.data.tasks?.[0]?.result?.[0]?.items?.filter((item: any) => item.url && item.title) || [];
}

function fase2_verify(item: any) {
    const url = item.url || '';
    const EXCLUDED_DOMAINS = ['yelp.com', 'thumbtack.com', 'homeadvisor.com', 'angi.com', 'energysage.com', 'solarreviews.com'];
    if (EXCLUDED_DOMAINS.some(d => url.toLowerCase().includes(d))) {
        return { companyName: item.title, domain: url, fitScore: 0, status: 'rejected' as const };
    }
    return {
        companyName: item.title,
        domain: extractDomain(url),
        url,
        fitScore: 0,
        status: 'new' as const,
        enrichmentData: {
            rating: item.rating?.value || 0,
            reviewCount: item.rating?.votes_count || 0,
            snippet: item.snippet || ''
        }
    };
}

async function fase3_enrich(lead: any) {
    const enriched = { ...lead };
    let html = '';
    let isPersonalEmail = false;
    try {
        const response = await axios.get(lead.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        html = response.data;
    } catch (err) { console.warn(`Scraping failed for ${lead.domain}`); }

    try {
        const hunterRes = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${lead.domain}&api_key=${hunterApiKey.value()}`);
        const emailInfo = hunterRes.data.data.emails?.[0];
        if (emailInfo) {
            const verifyRes = await axios.get(`https://api.hunter.io/v2/email-verifier?email=${emailInfo.value}&api_key=${hunterApiKey.value()}`);
            if ((verifyRes.data.data.score || 0) >= 70) {
                enriched.email = emailInfo.value;
                enriched.firstName = emailInfo.first_name;
                isPersonalEmail = emailInfo.type === 'personal';
            }
        }
    } catch (err) { console.warn(`Hunter.io failed for ${lead.domain}`); }

    let fitScore = 0;
    const content = html.toLowerCase();
    const snippet = enriched.enrichmentData.snippet.toLowerCase();
    
    if (lead.url.startsWith('https://') && !lead.url.includes('facebook.com')) fitScore += 15;
    if (enriched.enrichmentData.reviewCount >= 5) fitScore += 10;
    if (content.includes('nabcep')) fitScore += 20;
    
    const yearMatch = content.match(/since\s*(19|20)\d{2}|established\s*(19|20)\d{2}/i);
    if (yearMatch) {
        const year = parseInt(yearMatch[0].replace(/[^0-9]/g, ''));
        if (new Date().getFullYear() - year >= 5) fitScore += 15;
    }
    
    const solarKeywords = ['residential solar', 'home solar', 'rooftop solar', 'panel installation'];
    if (solarKeywords.some(kw => content.includes(kw) || snippet.includes(kw))) fitScore += 15;
    
    if (snippet.includes('serving') || snippet.includes('service area')) fitScore += 10;
    if (enriched.enrichmentData.rating >= 4.5) fitScore += 10;
    if (isPersonalEmail) fitScore += 10;

    enriched.fitScore = fitScore;
    enriched.status = fitScore >= FIT_SCORE_THRESHOLD.value() ? 'enriched' : 'rejected';
    return enriched;
}

function extractSolarFactPack(html: string): string[] {
    const $ = cheerio.load(html);
    const facts: string[] = [];
    const SOLAR_KEYWORDS = ['residential solar', 'home solar', 'rooftop', 'panel installation', 'solar financing', 'tax credit', 'warranty', 'monitoring', 'battery storage', 'powerwall', 'nabcep', 'certified', 'licensed', 'insured'];
    $('p, li, div.service, div.feature').each((_, elem) => {
        const text = $(elem).text().toLowerCase();
        for (const keyword of SOLAR_KEYWORDS) {
            if (text.includes(keyword) && facts.length < 5) {
                const context = $(elem).text().trim().substring(0, 120);
                if (!facts.some(f => f.includes(context.substring(0, 30)))) {
                    facts.push(context);
                }
            }
        }
    });
    return facts.slice(0, 5);
}

async function fase4_personalize(lead: any) {
    const openai = new OpenAI({ apiKey: openaiApiKey.value() });
    const cleanCompanyName = lead.companyName.split(',')[0].trim();
    const location = lead.location || lead.state || 'your area';
    const systemPrompt = `You write US cold outreach emails for a solar quote engine to solar installers. Return ONLY valid JSON.`;
    const userPrompt = `Create email #1 for solar installer partnership outreach. INPUT - company_name: ${cleanCompanyName}, location: ${location}`;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.6
        });
        lead.messageKit = JSON.parse(response.choices[0].message.content || '{}');
    } catch (err: any) {
        console.error('OpenAI personalization failed:', err.message);
        lead.messageKit = { subjectA: `Solar leads in ${location}` }; // Fallback
    }
    return lead;
}

async function fase5_sequence(lead: any, db?: admin.firestore.Firestore) {
    if (db) {
        const existingLead = await db.collection('solar_leads').where('domain', '==', lead.domain).where('status', '==', 'contacted').limit(1).get();
        if (!existingLead.empty) {
            throw new Error(`Duplicate lead: ${lead.domain} already contacted`);
        }
    }
    const payload = {
        campaign_id: instantlyCampaignSolar.value(),
        skip_if_in_workspace: true,
        leads: [{
            email: lead.email,
            first_name: lead.firstName || 'Solar Team',
            company_name: lead.companyName,
            website: lead.domain,
            custom_variables: { fit_score: lead.fitScore.toString(), ...lead.messageKit }
        }]
    };
    if (DRY_RUN.value()) {
        console.log(`🧪 DRY-RUN: Would add ${lead.email} to campaign`);
    } else {
        await axios.post('https://api.instantly.ai/api/v2/leads/add', payload, {
            headers: { 'Authorization': `Bearer ${instantlyApiKey.value()}` }
        });
    }
}

async function saveLead(db: admin.firestore.Firestore, lead: any) {
    const leadId = `${lead.domain}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '_');
    await db.collection('solar_leads').doc(leadId).set({
        id: leadId,
        ...lead,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}
