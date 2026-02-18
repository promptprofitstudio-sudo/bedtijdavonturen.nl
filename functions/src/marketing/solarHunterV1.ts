import * as functions from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

// Secrets (Proper Secret Manager integration)
const dataForSeoLogin = defineSecret('DATAFORSEO_LOGIN');
const dataForSeoApiKey = defineSecret('DATAFORSEO_API_KEY');
const hunterApiKey = defineSecret('HUNTER_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const instantlyApiKey = defineSecret('INSTANTLY_API_KEY');
const instantlyCampaignSolar = defineSecret('INSTANTLY_CAMPAIGN_SOLAR');

// Safety Gate: Default to DRY_RUN unless explicitly disabled
const DRY_RUN = { value: () => process.env.SOLAR_HUNTER_DRY_RUN !== 'false' };

export const solarHunterV1 = functions.scheduler.onSchedule({
    schedule: '0 10 * * *',
    timeZone: 'UTC',
    secrets: [dataForSeoLogin, dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey, instantlyCampaignSolar],
    memory: '1GiB',
    timeoutSeconds: 900
}, async (event) => {
    timeoutSeconds: 900
}, async (event) => {
    const db = admin.firestore();
    const log = {
        timestamp: new Date().toISOString(),
        discovered: 0,
        verified: 0,
        enriched: 0,
        personalized: 0,
        contacted: 0,
        rejected: 0,
        errors: [] as string[],
        dryRun: DRY_RUN.value()
    };

    const runMode = DRY_RUN.value() ? '🧪 DRY-RUN' : '🚀 PRODUCTION';
    console.log(`☀️ Solar Hunter V1 - ${runMode} MODE - STARTING`);

    // US Solar Installer Search Configs
    const SEARCH_CONFIGS = [
        { state: 'California', location: 'California, USA', query: 'solar installer' },
        { state: 'California', location: 'Los Angeles, California, USA', query: 'solar panel installation' },
        { state: 'California', location: 'San Diego, California, USA', query: 'solar company' },
        { state: 'California', location: 'San Jose, California, USA', query: 'residential solar' },
        
        { state: 'Arizona', location: 'Arizona, USA', query: 'solar installer' },
        { state: 'Arizona', location: 'Phoenix, Arizona, USA', query: 'solar panel company' },
        { state: 'Arizona', location: 'Tucson, Arizona, USA', query: 'residential solar' },
        
        { state: 'Texas', location: 'Texas, USA', query: 'solar installer' },
        { state: 'Texas', location: 'Houston, Texas, USA', query: 'solar company' },
        { state: 'Texas', location: 'Dallas, Texas, USA', query: 'solar panel installation' },
        { state: 'Texas', location: 'Austin, Texas, USA', query: 'residential solar' },
        
        { state: 'Nevada', location: 'Nevada, USA', query: 'solar installer' },
        { state: 'Nevada', location: 'Las Vegas, Nevada, USA', query: 'solar company' },
        
        { state: 'Florida', location: 'Florida, USA', query: 'solar installer' },
        { state: 'Florida', location: 'Miami, Florida, USA', query: 'solar panel company' },
        { state: 'Florida', location: 'Orlando, Florida, USA', query: 'residential solar' },
    ];

    for (const config of SEARCH_CONFIGS) {
        try {
            await processSearch(config.location, config.query, config.state, db, log);
        } catch (err: any) {
            console.error(`❌ Search failed for ${config.location}:`, err.message);
            log.errors.push(`${config.location}: ${err.message}`);
        }
    }

    // Save run log to Firestore
    await db.collection('solar_hunter_runs').add({
        ...log,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Solar Hunter V1 - COMPLETE', log);
});

/**
 * Process a single location/query search through the 6-phase pipeline
 */
async function processSearch(
    location: string,
    searchQuery: string,
    state: string,
    db: admin.firestore.Firestore,
    log: any
) {
    console.log(`\n=== Processing: ${location} - ${searchQuery} ===`);

    // FASE 1: DISCOVER
    const discoveries = await fase1_discover(location, searchQuery);
    log.discovered += discoveries.length;
    console.log(`📍 Discovered ${discoveries.length} solar businesses`);

    for (const item of discoveries) {
        try {
            // FASE 2: VERIFY (FitScore Gatekeeper - threshold 60)
            const verification = fase2_verify(item, searchQuery);

            if (verification.status === 'rejected') {
                log.rejected++;
                console.log(`❌ Rejected: ${item.title} (FitScore: ${verification.fitScore})`);

                // Still save rejected leads for learning
                await saveLead(db, {
                    ...verification,
                    location,
                    state,
                    searchQuery,
                    status: 'rejected'
                });
                continue;
            }

            log.verified++;
            console.log(`✅ Verified: ${item.title} (FitScore: ${verification.fitScore})`);

            // FASE 3: ENRICH
            const enriched = await fase3_enrich(verification);
            log.enriched++;
            console.log(`🔍 Enriched: ${enriched.enrichmentData.contactType} email, ${enriched.enrichmentData.facts.length} facts`);

            // FASE 4: PERSONALIZE
            if (enriched.email && enriched.status !== 'form_only') {
                const personalized = await fase4_personalize(enriched);
                log.personalized++;
                console.log(`✍️  Personalized: ${personalized.messageKit?.subjectA}`);

                // FASE 5: SEQUENCE
                await fase5_sequence(personalized);
                log.contacted++;
                personalized.status = 'contacted';
                personalized.contactedAt = admin.firestore.Timestamp.now();
                console.log(`📤 Sent to Instantly: ${personalized.email}`);

                // FASE 6: LEARN
                await saveLead(db, personalized);
            } else {
                // No email found - save for manual follow-up
                enriched.status = enriched.status || 'form_only';
                await saveLead(db, enriched);
                console.log(`📝 Saved for manual follow-up: ${enriched.companyName}`);
            }

        } catch (err: any) {
            console.error(`Error processing ${item.title}:`, err.message);
            log.errors.push(`${item.title}: ${err.message}`);
        }
    }
}

/**
 * FASE 1: Discover solar businesses via DataForSEO
 */
async function fase1_discover(location: string, searchQuery: string) {
    const auth = Buffer.from(`${dataForSeoLogin.value()}:${dataForSeoApiKey.value()}`).toString('base64');

    // DataForSEO location codes for US states and cities
    const LOCATION_CODES: Record<string, number> = {
        'California, USA': 2840,
        'Los Angeles, California, USA': 1023191,
        'San Diego, California, USA': 1023768,
        'San Jose, California, USA': 1023782,
        'Arizona, USA': 2840,
        'Phoenix, Arizona, USA': 1023511,
        'Tucson, Arizona, USA': 1026044,
        'Texas, USA': 2840,
        'Houston, Texas, USA': 1023815,
        'Dallas, Texas, USA': 1023191,
        'Austin, Texas, USA': 1023108,
        'Nevada, USA': 2840,
        'Las Vegas, Nevada, USA': 1023829,
        'Florida, USA': 2840,
        'Miami, Florida, USA': 1015164,
        'Orlando, Florida, USA': 1023509
    };

    const locationCode = LOCATION_CODES[location] || 2840; // Default to USA

    const response = await axios.post(
        'https://api.dataforseo.com/v3/serp/google/maps/live/advanced',
        [{
            location_code: locationCode,
            keyword: searchQuery,
            language_code: "en"
        }],
        {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        }
    );

    const items = response.data.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`DataForSEO returned ${items.length} items for ${location} - ${searchQuery}`);
    return items.filter((item: any) => item.url && item.title);
}

/**
 * FASE 2: Verify with Solar-Specific FitScore calculation (Threshold: 60)
 */
function fase2_verify(item: any, searchQuery: string) {
    const url = item.url || '';
    const snippet = (item.snippet || '').toLowerCase();
    const rating = item.rating?.value || 0;
    const reviewCount = item.rating?.votes_count || 0;

    // HARD KILL: Exclude directories, marketplaces, lead generation sites
    const EXCLUDED_DOMAINS = ['yelp.com', 'thumbtack', 'homeadvisor', 'angi.com', 'energysage', 'solarreviews'];
    if (EXCLUDED_DOMAINS.some(d => url.toLowerCase().includes(d))) {
        return {
            companyName: item.title,
            domain: url,
            fitScore: 0,
            status: 'rejected' as const,
            enrichmentData: {
                source: 'hunter' as const,
                contactType: 'form_only' as const,
                facts: [],
                rating,
                reviewCount,
                snippet: item.snippet
            }
        };
    }

    // SOLAR FITSCORE CALCULATION (0-110 possible, threshold 60)
    let fitScore = 0;

    // +30: Personal email (will be checked in enrichment phase, placeholder here)
    // This will be added during fase3_enrich if Hunter finds personal email

    // +20: Active website (HTTPS and proper domain)
    if (url.startsWith('https://') && !url.includes('facebook.com') && !url.includes('instagram.com')) {
        fitScore += 20;
    }

    // +20: Has reviews (Google/Yelp indicator)
    if (reviewCount >= 5) {
        fitScore += 20;
    }

    // +20: Years in business (≥5) - will check in website scraping
    // Placeholder - will be refined in fase3

    // +20: NABCEP certified - will check in website scraping
    // Placeholder - will be refined in fase3

    // +10: Residential service keywords
    const residentialKeywords = ['residential', 'home solar', 'homeowner', 'rooftop solar', 'home energy'];
    if (residentialKeywords.some(kw => snippet.includes(kw))) {
        fitScore += 10;
    }

    // +10: Multiple service areas (franchise/multi-location indicator)
    if (snippet.includes('serving') || snippet.includes('service area') || reviewCount > 50) {
        fitScore += 10;
    }

    // High rating bonus
    if (rating >= 4.5) {
        fitScore += 10;
    }

    return {
        companyName: item.title,
        domain: extractDomain(url),
        url,
        fitScore,
        status: fitScore >= 60 ? ('new' as const) : ('rejected' as const),
        enrichmentData: {
            source: 'hunter' as const,
            contactType: 'form_only' as const,
            facts: [],
            rating,
            reviewCount,
            snippet: item.snippet
        }
    };
}

/**
 * FASE 3: Enrich with 3-Rail Contact Discovery + Solar Fact Pack
 */
async function fase3_enrich(lead: any) {
    const enriched = { ...lead };
    enriched.status = 'enriching';

    // Site Fetch + Solar Fact Pack
    let html = '';
    try {
        const response = await axios.get(lead.url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SolarQuoteBot/1.0)'
            }
        });
        html = response.data;

        // Extract Solar-Specific Facts
        const facts = extractSolarFactPack(html);
        enriched.enrichmentData.facts = facts;

        // Refine FitScore based on website content
        const content = html.toLowerCase();
        
        // +20: Years in business (≥5)
        const yearsMatch = content.match(/since\s+(19|20)\d{2}|established\s+(19|20)\d{2}|founded\s+(19|20)\d{2}/i);
        if (yearsMatch) {
            const year = parseInt(yearsMatch[1] || yearsMatch[2] || yearsMatch[3]);
            const currentYear = new Date().getFullYear();
            if (currentYear - year >= 5) {
                enriched.fitScore += 20;
                facts.push(`In business since ${year}`);
            }
        }

        // +20: NABCEP certified
        if (content.includes('nabcep') || content.includes('north american board of certified energy practitioners')) {
            enriched.fitScore += 20;
            facts.push('NABCEP certified installer');
        }

        // Update facts
        enriched.enrichmentData.facts = facts;

    } catch (err) {
        console.warn(`Scraping failed for ${lead.domain}, continuing with Hunter only`);
        enriched.enrichmentData.facts = [];
    }

    // 3-RAIL CONTACT DISCOVERY
    enriched.status = 'enriching';

    // Rail A: Hunter.io (Best: Personal emails)
    try {
        const hunterRes = await axios.get(
            `https://api.hunter.io/v2/domain-search?domain=${lead.domain}&api_key=${hunterApiKey.value()}`
        );

        if (hunterRes.data.data.emails && hunterRes.data.data.emails.length > 0) {
            const email = hunterRes.data.data.emails[0];
            
            // Verify email quality via Hunter
            const verifyRes = await axios.get(
                `https://api.hunter.io/v2/email-verifier?email=${email.value}&api_key=${hunterApiKey.value()}`
            );
            
            const hunterScore = verifyRes.data.data.score || 0;
            
            if (hunterScore >= 70) {
                enriched.email = email.value;
                enriched.firstName = email.first_name;
                enriched.lastName = email.last_name;
                enriched.enrichmentData.source = 'hunter';
                enriched.enrichmentData.hunterScore = hunterScore;
                
                // +30 for personal email
                if (email.type === 'personal') {
                    enriched.fitScore += 30;
                    enriched.enrichmentData.contactType = 'personal';
                } else {
                    enriched.enrichmentData.contactType = 'role_based';
                }
                
                enriched.status = 'ready_for_email';
                console.log(`  [Rail A] Hunter.io: ${enriched.email} (score: ${hunterScore})`);
                
                // Re-check threshold after personal email bonus
                if (enriched.fitScore < 60) {
                    enriched.status = 'rejected';
                    console.log(`  ⚠️  FitScore ${enriched.fitScore} below threshold after enrichment`);
                }
                
                return enriched;
            } else {
                console.log(`  [Rail A] Hunter.io email score too low: ${hunterScore}`);
            }
        }
    } catch (err: any) {
        console.warn(`Hunter.io failed for ${lead.domain}:`, err.message);
    }

    // Rail B: Scrape mailto links
    if (html) {
        const $ = cheerio.load(html);
        const mailtoLinks = $('a[href^="mailto:"]');

        if (mailtoLinks.length > 0) {
            const emailHref = mailtoLinks.first().attr('href') || '';
            const email = emailHref.replace('mailto:', '').split('?')[0];

            if (email && email.includes('@')) {
                // Verify scraped email via Hunter
                try {
                    const verifyRes = await axios.get(
                        `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${hunterApiKey.value()}`
                    );
                    
                    const hunterScore = verifyRes.data.data.score || 0;
                    
                    if (hunterScore >= 70) {
                        enriched.email = email;
                        enriched.enrichmentData.source = 'scrape';
                        enriched.enrichmentData.contactType = 'generic';
                        enriched.enrichmentData.hunterScore = hunterScore;
                        enriched.status = 'ready_for_email';
                        console.log(`  [Rail B] Scraped: ${enriched.email} (verified score: ${hunterScore})`);
                        
                        // Re-check threshold
                        if (enriched.fitScore < 60) {
                            enriched.status = 'rejected';
                            console.log(`  ⚠️  FitScore ${enriched.fitScore} below threshold after enrichment`);
                        }
                        
                        return enriched;
                    } else {
                        console.log(`  [Rail B] Scraped email score too low: ${hunterScore}`);
                    }
                } catch (err) {
                    console.warn('Failed to verify scraped email');
                }
            }
        }
    }

    // Rail C: No email found
    enriched.status = 'form_only';
    enriched.enrichmentData.contactType = 'form_only';
    console.log(`  [Rail C] No email - form only`);

    return enriched;
}

/**
 * Extract Solar-Specific "Fact Pack" from HTML content
 */
function extractSolarFactPack(html: string): string[] {
    const $ = cheerio.load(html);
    const facts: string[] = [];

    const SOLAR_KEYWORDS = [
        'residential solar', 'home solar', 'rooftop', 'panel installation',
        'solar financing', 'tax credit', 'warranty', 'monitoring',
        'battery storage', 'powerwall', 'backup power', 'energy independence',
        'nabcep', 'certified', 'licensed', 'insured', 'years of experience'
    ];

    // Search in paragraphs and list items
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

    return facts.slice(0, 5); // Max 5 facts
}

/**
 * FASE 4: Personalize with AI Message Kit - Solar Edition
 */
async function fase4_personalize(lead: any) {
    const openai = new OpenAI({ apiKey: openaiApiKey.value() });

    const cleanCompanyName = lead.companyName.split(',')[0].trim();

    const systemPrompt = `You write US cold outreach emails for a solar quote engine to solar installers.

ABSOLUTE OUTPUT RULE
Return ONLY valid JSON. No markdown, no explanations, no extra text.

TONE & STYLE
- Professional but friendly
- Short and direct (60-90 words)
- No hype, no buzzwords
- Sound like a real person reaching out about a business opportunity

PURPOSE
We connect homeowners seeking solar quotes with qualified installers. This is B2B partnership outreach.

VALUE PROPOSITION
- Pre-qualified solar leads in their service area
- Homeowners actively requesting quotes
- No upfront cost, pay per qualified lead
- Integration with their existing sales process

GREETING RULES
- If contact_type=="personal" AND first_name present: "Hi {first_name},"
- Else: "Hi {company_name} team,"
- Keep it simple and clean

BODY STRUCTURE (3 short paragraphs)
1) Opener: Brief intro about who we are and why reaching out
   "I run a solar quote platform that connects homeowners with local installers."

2) Value: What's in it for them
   "We have homeowners in {location} actively requesting solar quotes. Interested in receiving these leads?"

3) CTA: Simple, clear next step
   "Happy to share how it works. Would that be helpful?"

FORBIDDEN WORDS
Never mention: AI, algorithm, automation, revolutionary, gamechanger, disruptive, leverage, synergy, cutting-edge.

REQUIRED JSON KEYS
{
  "subjectA": "",
  "subjectB": "",
  "greeting": "",
  "body": "",
  "cta": "",
  "closing": ""
}

CLOSING must be:
"Best,\\nSolar Quote Engine Team"

Keep subject lines simple:
- "Solar leads in {city}"
- "Homeowner quotes in {location}"
- No clickbait, no emojis`;

    const location = lead.location || lead.state || 'your area';
    const factsString = lead.enrichmentData.facts?.length > 0
        ? lead.enrichmentData.facts.join(' | ')
        : 'no specific facts available';

    const contactType = lead.enrichmentData.contactType || 'generic';
    const firstName = lead.firstName || null;

    const userPrompt = `Create email #1 for solar installer partnership outreach.

INPUT
- company_name: ${cleanCompanyName}
- location: ${location}
- contact_type: ${contactType}
- first_name: ${firstName || '(none)'}
- rating: ${lead.enrichmentData.rating || 'N/A'}
- hunter_score: ${lead.enrichmentData.hunterScore || 'N/A'}

FACTS:
${factsString}

REMINDERS
- 60-90 words total
- Keep it professional and direct
- Focus on the business opportunity (qualified leads)
- Don't oversell, just offer to explain how it works
- CTA: Ask if they want to learn more`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.6
        });

        const messageKit = JSON.parse(response.choices[0].message.content || '{}');

        lead.messageKit = {
            subjectA: messageKit.subjectA || `Solar leads in ${location}`,
            subjectB: messageKit.subjectB || 'Homeowner quote requests',
            greeting: messageKit.greeting || `Hi ${cleanCompanyName} team,`,
            body: messageKit.body || '',
            cta: messageKit.cta || 'Happy to share how it works. Would that be helpful?',
            closing: messageKit.closing || 'Best,\nSolar Quote Engine Team'
        };

        return lead;
    } catch (err: any) {
        console.error('OpenAI personalization failed:', err.message);
        // Fallback template
        lead.messageKit = {
            subjectA: `Solar leads in ${location}`,
            subjectB: 'Homeowner quote requests',
            greeting: `Hi ${cleanCompanyName} team,`,
            body: `I run a solar quote platform that connects homeowners with local installers. We have homeowners in ${location} actively requesting solar quotes. Interested in receiving these leads?`,
            cta: 'Happy to share how it works. Would that be helpful?',
            closing: 'Best,\nSolar Quote Engine Team'
        };
        return lead;
    }
}

/**
 * FASE 5: Sequence to Instantly.ai Solar Campaign
 */
async function fase5_sequence(lead: any) {
    const payload = {
        campaign_id: instantlyCampaignSolar.value(),
        skip_if_in_workspace: true,
        leads: [{
            email: lead.email,
            first_name: lead.firstName || 'Solar Team',
            last_name: lead.lastName || '',
            company_name: lead.companyName,
            website: lead.domain,
            custom_variables: {
                subject_a: lead.messageKit.subjectA,
                subject_b: lead.messageKit.subjectB,
                greeting: lead.messageKit.greeting,
                body: lead.messageKit.body,
                cta: lead.messageKit.cta,
                closing: lead.messageKit.closing,
                location: lead.location || lead.state,
                rating: lead.enrichmentData.rating?.toString() || '',
                hunter_score: lead.enrichmentData.hunterScore?.toString() || '',
                fit_score: lead.fitScore.toString()
            }
        }]
    };

    if (DRY_RUN.value()) {
        console.log(`🧪 DRY-RUN: Would add solar lead to campaign`);
        console.log(`   📧 Email: ${lead.email}`);
        console.log(`   🏢 Company: ${lead.companyName}`);
        console.log(`   ⭐ FitScore: ${lead.fitScore}`);
        console.log(`   🎯 Hunter Score: ${lead.enrichmentData.hunterScore}`);
    } else {
        try {
            await axios.post('https://api.instantly.ai/api/v2/leads/add', payload, {
                headers: {
                    'Authorization': `Bearer ${instantlyApiKey.value()}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Solar lead added to campaign: ${lead.email}`);
        } catch (err: any) {
            if (err.response) {
                console.error('Instantly API Error:', {
                    status: err.response.status,
                    data: err.response.data
                });
            }
            throw new Error(`Instantly.ai push failed: ${err.message}`);
        }
    }
}

/**
 * FASE 6: Learn - Save to Firestore
 */
async function saveLead(db: admin.firestore.Firestore, lead: any) {
    const leadId = `${lead.domain}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '_');

    await db.collection('solar_leads').doc(leadId).set({
        id: leadId,
        ...lead,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

/**
 * Extract clean domain from URL
 */
function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
}
