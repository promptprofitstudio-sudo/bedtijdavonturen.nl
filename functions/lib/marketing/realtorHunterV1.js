"use strict";
/**
 * Realtor Growth Engine v1.0
 * US Real Estate Market Outreach Pipeline
 *
 * 6-Phase System:
 * 1. Discover (DataForSEO Google Maps - US metro areas)
 * 2. Verify (FitScore Gatekeeper - realtor relevance)
 * 3. Enrich (Hunter.io + scrape - contact discovery)
 * 4. Personalize (GPT-4o-mini US English email gen)
 * 5. Sequence (Instantly.ai - RE AI campaign)
 * 6. Learn (Firestore)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtorHunterV1 = void 0;
const functions = require("firebase-functions/v2");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const cheerio = require("cheerio");
const openai_1 = require("openai");
const dataForSeoLogin = (0, params_1.defineSecret)('DATAFORSEO_LOGIN');
const dataForSeoApiKey = (0, params_1.defineSecret)('DATAFORSEO_API_KEY');
const hunterApiKey = (0, params_1.defineSecret)('HUNTER_API_KEY');
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
const instantlyApiKey = (0, params_1.defineSecret)('INSTANTLY_API_KEY');
const instantlyCampaignRealtors = (0, params_1.defineSecret)('INSTANTLY_CAMPAIGN_REALTORS');
const DRY_RUN = (0, params_1.defineBoolean)('REALTOR_HUNTER_DRY_RUN', { default: true });
exports.realtorHunterV1 = functions.scheduler.onSchedule({
    schedule: 'every day 09:00',
    timeZone: 'America/New_York',
    secrets: [dataForSeoLogin, dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey],
    memory: '1GiB',
    timeoutSeconds: 900
}, async (event) => {
    const db = admin.firestore();
    const log = {
        timestamp: new Date().toISOString(),
        discovered: 0, verified: 0, enriched: 0, personalized: 0,
        contacted: 0, rejected: 0, errors: [],
        dryRun: DRY_RUN.value()
    };
    const runMode = DRY_RUN.value() ? '🧪 DRY-RUN' : '🚀 PRODUCTION';
    console.log(`🏠 Realtor Growth Engine v1.0 - ${runMode} MODE`);
    const SEARCH_CONFIGS = [
        { city: 'Miami', state: 'FL', term: 'Real estate agent' },
        { city: 'Houston', state: 'TX', term: 'Real estate agent' },
        { city: 'Dallas', state: 'TX', term: 'Realtor' },
        { city: 'Atlanta', state: 'GA', term: 'Real estate agent' },
        { city: 'Phoenix', state: 'AZ', term: 'Realtor' },
        { city: 'Tampa', state: 'FL', term: 'Real estate agent' },
        { city: 'Charlotte', state: 'NC', term: 'Realtor' },
        { city: 'Nashville', state: 'TN', term: 'Real estate agent' },
        { city: 'Austin', state: 'TX', term: 'Realtor' },
        { city: 'Denver', state: 'CO', term: 'Real estate agent' },
        { city: 'Raleigh', state: 'NC', term: 'Real estate agent' },
        { city: 'San Antonio', state: 'TX', term: 'Realtor' },
        { city: 'Orlando', state: 'FL', term: 'Real estate agent' },
        { city: 'Jacksonville', state: 'FL', term: 'Realtor' },
        { city: 'Las Vegas', state: 'NV', term: 'Real estate agent' },
        { city: 'Boise', state: 'ID', term: 'Realtor' },
        { city: 'Salt Lake City', state: 'UT', term: 'Real estate agent' },
        { city: 'Scottsdale', state: 'AZ', term: 'Luxury real estate agent' },
        { city: 'Los Angeles', state: 'CA', term: 'Real estate broker' },
        { city: 'New York', state: 'NY', term: 'Real estate broker' },
        { city: 'Chicago', state: 'IL', term: 'Real estate agent' },
        { city: 'Seattle', state: 'WA', term: 'Real estate agent' },
        { city: 'Portland', state: 'OR', term: 'Realtor' },
        { city: 'San Diego', state: 'CA', term: 'Realtor' },
        { city: 'Sarasota', state: 'FL', term: 'Real estate agent' },
        { city: 'Charleston', state: 'SC', term: 'Realtor' },
    ];
    // Process 6 cities per day in rotation (manages API costs)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const BATCH_SIZE = 6;
    const startIdx = (dayOfYear * BATCH_SIZE) % SEARCH_CONFIGS.length;
    const todayConfigs = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        todayConfigs.push(SEARCH_CONFIGS[(startIdx + i) % SEARCH_CONFIGS.length]);
    }
    console.log(`📍 Today's batch: ${todayConfigs.map(c => `${c.city}, ${c.state}`).join(' | ')}`);
    for (const config of todayConfigs) {
        try {
            await processSearch(config.city, config.state, config.term, db, log);
        }
        catch (err) {
            console.error(`❌ ${config.city}: ${err.message}`);
            log.errors.push(`${config.city}: ${err.message}`);
        }
    }
    await db.collection('realtor_hunter_runs').add(Object.assign(Object.assign({}, log), { completedAt: admin.firestore.FieldValue.serverTimestamp() }));
    console.log('✅ Realtor Growth Engine v1.0 - COMPLETE', log);
});
async function processSearch(city, state, searchTerm, db, log) {
    console.log(`\n=== ${city}, ${state} — "${searchTerm}" ===`);
    const discoveries = await phase1_discover(city, state, searchTerm);
    log.discovered += discoveries.length;
    console.log(`📍 Discovered ${discoveries.length} businesses`);
    for (const item of discoveries) {
        try {
            const leadId = `realtor_${extractDomain(item.url || '')}_${city}`.replace(/[^a-zA-Z0-9_]/g, '_');
            const existing = await db.collection('realtor_leads').doc(leadId).get();
            if (existing.exists) {
                continue;
            }
            const verification = phase2_verify(item, searchTerm, city, state);
            if (verification.status === 'rejected') {
                log.rejected++;
                await saveLead(db, Object.assign(Object.assign({}, verification), { city, state, searchTerm, status: 'rejected' }));
                continue;
            }
            log.verified++;
            console.log(`✅ ${item.title} (FitScore: ${verification.fitScore})`);
            const enriched = await phase3_enrich(verification);
            log.enriched++;
            if (enriched.email && enriched.status !== 'form_only') {
                const personalized = await phase4_personalize(enriched);
                log.personalized++;
                await phase5_sequence(personalized);
                log.contacted++;
                personalized.status = 'contacted';
                personalized.contactedAt = admin.firestore.Timestamp.now();
                console.log(`📤 ${personalized.email}`);
                await saveLead(db, personalized);
            }
            else {
                enriched.status = enriched.status || 'form_only';
                await saveLead(db, enriched);
            }
        }
        catch (err) {
            log.errors.push(`${item.title}: ${err.message}`);
        }
    }
}
async function phase1_discover(city, state, searchTerm) {
    var _a, _b, _c, _d;
    const auth = Buffer.from(`${dataForSeoLogin.value()}:${dataForSeoApiKey.value()}`).toString('base64');
    // DataForSEO requires full state names, not abbreviations
    const STATE_NAMES = {
        'FL': 'Florida', 'TX': 'Texas', 'GA': 'Georgia', 'AZ': 'Arizona',
        'NC': 'North Carolina', 'TN': 'Tennessee', 'CO': 'Colorado',
        'NV': 'Nevada', 'ID': 'Idaho', 'UT': 'Utah', 'CA': 'California',
        'NY': 'New York', 'IL': 'Illinois', 'WA': 'Washington', 'OR': 'Oregon',
        'SC': 'South Carolina', 'NM': 'New Mexico', 'VA': 'Virginia', 'KY': 'Kentucky'
    };
    const fullState = STATE_NAMES[state] || state;
    const response = await axios_1.default.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{ keyword: `${searchTerm} ${city} ${fullState}`, location_name: `${city},${fullState},United States`, language_code: "en" }], { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } });
    return (((_d = (_c = (_b = (_a = response.data.tasks) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.items) || []).filter((i) => i.url && i.title);
}
function phase2_verify(item, searchTerm, city, state) {
    var _a, _b;
    const url = item.url || '';
    const snippet = (item.snippet || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const rating = ((_a = item.rating) === null || _a === void 0 ? void 0 : _a.value) || 0;
    const reviewCount = ((_b = item.rating) === null || _b === void 0 ? void 0 : _b.votes_count) || 0;
    const EXCLUDED = ['zillow.com', 'realtor.com', 'redfin.com', 'trulia.com', 'homes.com',
        'coldwellbanker.com', 'century21.com', 'sothebysrealty.com', 'facebook.com', 'instagram.com',
        'linkedin.com', 'yelp.com', 'yellowpages.com', 'bbb.org', 'google.com'];
    if (EXCLUDED.some(d => url.toLowerCase().includes(d))) {
        return { companyName: item.title, domain: url, fitScore: 0, status: 'rejected', segment: 'agent',
            enrichmentData: { source: 'hunter', contactType: 'form_only', facts: [], rating, reviewCount, snippet: item.snippet } };
    }
    let fitScore = 0;
    const agentKw = ['realtor', 'real estate', 'broker', 'realty', 'property', 'homes', 'listings'];
    if (agentKw.some(kw => title.includes(kw) || snippet.includes(kw)))
        fitScore += 25;
    const bigFranchise = ['keller williams', 'remax', 're/max', 'berkshire', 'compass'];
    if (!bigFranchise.some(kw => title.includes(kw)))
        fitScore += 15;
    if (rating >= 4.5 && reviewCount >= 10)
        fitScore += 20;
    else if (rating >= 4.0)
        fitScore += 10;
    if (url.startsWith('https://') && !EXCLUDED.some(d => url.includes(d)))
        fitScore += 15;
    if (reviewCount >= 20)
        fitScore += 10;
    const premium = ['luxury', 'million', 'premium', 'exclusive', 'top producer', 'award'];
    if (premium.some(kw => snippet.includes(kw) || title.includes(kw)))
        fitScore += 10;
    let segment = 'agent';
    if (title.includes('broker') || title.includes('brokerage'))
        segment = 'broker';
    else if (title.includes('team') || title.includes('group'))
        segment = 'team';
    else if (title.includes('management'))
        segment = 'property_mgmt';
    return {
        companyName: item.title, domain: extractDomain(url), url, fitScore,
        status: fitScore >= 45 ? 'new' : 'rejected',
        segment, city, state,
        enrichmentData: { source: 'hunter', contactType: 'form_only', facts: [], rating, reviewCount, snippet: item.snippet }
    };
}
async function phase3_enrich(lead) {
    const enriched = Object.assign({}, lead);
    let html = '';
    try {
        const r = await axios_1.default.get(lead.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } });
        html = r.data;
        const $ = cheerio.load(html);
        const facts = [];
        const KEYWORDS = ['sold', 'listings', 'closed', 'million', 'experience', 'years', 'specializ', 'luxury', 'first-time', 'investor', 'award', 'top producer', 'certified', 'buyer', 'seller'];
        $('p, li, h2, h3').each((_, el) => {
            const t = $(el).text().toLowerCase();
            for (const kw of KEYWORDS) {
                if (t.includes(kw) && facts.length < 5) {
                    const ctx = $(el).text().trim().substring(0, 150);
                    if (ctx.length > 20 && !facts.some(f => f.includes(ctx.substring(0, 30))))
                        facts.push(ctx);
                }
            }
        });
        enriched.enrichmentData.facts = facts.slice(0, 5);
    }
    catch (_a) {
        enriched.enrichmentData.facts = [];
    }
    // Rail A: Hunter
    try {
        const h = await axios_1.default.get(`https://api.hunter.io/v2/domain-search?domain=${lead.domain}&api_key=${hunterApiKey.value()}`);
        const emails = h.data.data.emails;
        if ((emails === null || emails === void 0 ? void 0 : emails.length) > 0) {
            const personal = emails.find((e) => e.type === 'personal');
            const email = personal || emails[0];
            // Validate Hunter.io email score
            const hunterScore = email.score || 0;
            if (hunterScore < 70) {
                // Skip low-quality emails
                enriched.status = 'low_quality_email';
                return enriched;
            }
            enriched.email = email.value;
            enriched.firstName = email.first_name;
            enriched.lastName = email.last_name;
            enriched.enrichmentData.source = 'hunter';
            enriched.enrichmentData.contactType = email.type === 'personal' ? 'personal' : 'role_based';
            enriched.status = 'ready_for_email';
            return enriched;
        }
    }
    catch (_b) { }
    // Rail B: Scrape mailto
    if (html) {
        const $ = cheerio.load(html);
        const mailto = $('a[href^="mailto:"]').first().attr('href');
        if (mailto) {
            const email = mailto.replace('mailto:', '').split('?')[0];
            if (email === null || email === void 0 ? void 0 : email.includes('@')) {
                // Verify scraped email with Hunter.io
                try {
                    const verifyResult = await axios_1.default.get(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${hunterApiKey.value()}`);
                    const verifyData = verifyResult.data;
                    if (verifyData.data.status !== 'valid' || (verifyData.data.score || 0) < 70) {
                        // Skip unverified or low-quality scraped emails
                        enriched.status = 'unverified_email';
                        return enriched;
                    }
                }
                catch (_c) {
                    // If verification fails, skip this email
                    enriched.status = 'verification_failed';
                    return enriched;
                }
                enriched.email = email;
                enriched.enrichmentData.source = 'scrape';
                enriched.enrichmentData.contactType = 'generic';
                enriched.status = 'ready_for_email';
                return enriched;
            }
        }
    }
    enriched.status = 'form_only';
    enriched.enrichmentData.contactType = 'form_only';
    return enriched;
}
async function phase4_personalize(lead) {
    var _a;
    const openai = new openai_1.default({ apiKey: openaiApiKey.value() });
    const cleanName = lead.companyName.split(',')[0].split('-')[0].trim();
    const firstName = lead.firstName || null;
    const systemPrompt = `You write US English cold outreach emails for Real Estate AI Pro (realestate.promptprofitstudio.com) — an AI tool that generates professional listing descriptions and social media posts for real estate agents at $29/month.

Return ONLY valid JSON with keys: subjectA, subjectB, greeting, body, cta, closing, optout.

VALUE PROP: MLS-ready listing descriptions in 60 seconds + social media posts (IG, FB, LinkedIn) + buyer-persona targeting + Fair Housing compliance. 5 free/month, $29/mo unlimited.

RULES:
- 60-90 words body + CTA
- Casual professional tone
- Never say: AI, GPT, automation, algorithm, magic, revolutionary
- Focus on TIME SAVED (30-45 min → 60 seconds)
- Reference their market ({city})
- CTA: "Want me to run a sample listing through it? Just send me an address."
- If first_name: "Hi {first_name}," else "Hi there,"
- CLOSING: "Best,\\nMichel Korpershoek\\nReal Estate AI Pro\\nrealestate.promptprofitstudio.com"
- OPTOUT: "Not interested? No worries — just let me know."
- Use facts sparingly — only if strong. Skip weak/generic facts.`;
    const facts = ((_a = lead.enrichmentData.facts) === null || _a === void 0 ? void 0 : _a.length) > 0 ? lead.enrichmentData.facts.join(' | ') : 'None';
    const userPrompt = `Outreach email for: ${cleanName} in ${lead.city}, ${lead.state}. Segment: ${lead.segment}. Contact: ${lead.enrichmentData.contactType}. First name: ${firstName || 'none'}. Rating: ${lead.enrichmentData.rating || 'N/A'}. Facts: ${facts}`;
    try {
        const r = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7
        });
        const kit = JSON.parse(r.choices[0].message.content || '{}');
        if (!kit.optout)
            kit.optout = "Not interested? No worries — just let me know.";
        lead.messageKit = kit;
    }
    catch (_b) {
        lead.messageKit = {
            subjectA: `Quick question about your ${lead.city} listings`,
            subjectB: 'Listing descriptions in 60 seconds',
            greeting: firstName ? `Hi ${firstName},` : 'Hi there,',
            body: `I came across your listings in ${lead.city} and wanted to share something that might save you time. I built a tool that generates MLS-ready listing descriptions and social media posts from basic property details — takes about 60 seconds instead of 30-45 minutes.`,
            cta: 'Want me to run a sample listing through it? Just send me an address.',
            closing: 'Best,\nMichel Korpershoek\nReal Estate AI Pro\nrealestate.promptprofitstudio.com',
            optout: "Not interested? No worries — just let me know."
        };
    }
    return lead;
}
async function phase5_sequence(lead) {
    const payload = {
        campaign_id: instantlyCampaignRealtors.value(),
        skip_if_in_workspace: true,
        leads: [{
                email: lead.email,
                first_name: lead.firstName || '',
                last_name: lead.lastName || '',
                company_name: lead.companyName,
                website: lead.domain,
                custom_variables: {
                    subject_a: lead.messageKit.subjectA, subject_b: lead.messageKit.subjectB,
                    greeting: lead.messageKit.greeting, body: lead.messageKit.body,
                    cta: lead.messageKit.cta, closing: lead.messageKit.closing,
                    optout: lead.messageKit.optout, city: lead.city, state: lead.state
                }
            }]
    };
    if (DRY_RUN.value()) {
        console.log(`🧪 DRY-RUN: Would add ${lead.email} to realtor campaign`);
    }
    else {
        await axios_1.default.post('https://api.instantly.ai/api/v2/leads/add', payload, {
            headers: { 'Authorization': `Bearer ${instantlyApiKey.value()}`, 'Content-Type': 'application/json' }
        });
    }
}
async function saveLead(db, lead) {
    const id = `realtor_${lead.domain}_${lead.city}`.replace(/[^a-zA-Z0-9_]/g, '_');
    await db.collection('realtor_leads').doc(id).set(Object.assign(Object.assign({ id }, lead), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
}
function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    }
    catch (_a) {
        return url;
    }
}
//# sourceMappingURL=realtorHunterV1.js.map