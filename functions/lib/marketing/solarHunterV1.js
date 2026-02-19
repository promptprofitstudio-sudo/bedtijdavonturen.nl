"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solarHunterV1 = void 0;
const functions = require("firebase-functions/v2");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const cheerio = require("cheerio");
const openai_1 = require("openai");
// Secrets
const dataForSeoLogin = (0, params_1.defineSecret)('DATAFORSEO_LOGIN');
const dataForSeoApiKey = (0, params_1.defineSecret)('DATAFORSEO_API_KEY');
const hunterApiKey = (0, params_1.defineSecret)('HUNTER_API_KEY');
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
const instantlyApiKey = (0, params_1.defineSecret)('INSTANTLY_API_KEY');
const instantlyCampaignSolar = (0, params_1.defineSecret)('INSTANTLY_CAMPAIGN_SOLAR');
// Config
const DRY_RUN = (0, params_1.defineBoolean)('SOLAR_HUNTER_DRY_RUN', { default: true });
const FIT_SCORE_THRESHOLD = 25; // Lowered from 35 to match actual legitimate installer scores
exports.solarHunterV1 = functions.scheduler.onSchedule({
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
        errors: [],
        dryRun: DRY_RUN.value()
    };
    console.log(`☀️ Solar Hunter V1 - ${DRY_RUN.value() ? 'DRY-RUN' : 'PRODUCTION'} MODE - STARTING`);
    const SEARCH_CONFIGS = [
        { state: 'California', locationCode: 21137, query: 'solar installer' },
        { state: 'Texas', locationCode: 21176, query: 'solar installer' },
        { state: 'Arizona', locationCode: 21136, query: 'solar installer' },
        { state: 'Florida', locationCode: 21142, query: 'solar installer' },
    ];
    for (const config of SEARCH_CONFIGS) {
        try {
            await processSearch(config.locationCode, config.query, config.state, db, log);
        }
        catch (err) {
            log.errors.push(`${config.state}: ${err.message}`);
        }
    }
    await db.collection('solar_hunter_runs').add(Object.assign(Object.assign({}, log), { completedAt: admin.firestore.FieldValue.serverTimestamp() }));
    console.log('✅ Solar Hunter V1 - COMPLETE', log);
});
async function processSearch(locationCode, searchQuery, state, db, log) {
    console.log(`\n=== Processing: ${state} (${locationCode}) - ${searchQuery} ===`);
    const discoveries = await fase1_discover(locationCode, searchQuery);
    log.discovered += discoveries.length;
    console.log(`📍 Discovered ${discoveries.length} businesses`);
    for (const item of discoveries) {
        try {
            const verification = fase2_verify(item);
            if (verification.status === 'rejected') {
                log.rejected++;
                console.log(`❌ Rejected (Excluded Domain): ${item.title}`);
                await saveLead(db, Object.assign(Object.assign({}, verification), { state, searchQuery }));
                continue;
            }
            const enriched = await fase3_enrich(verification);
            if (enriched.status === 'rejected') {
                log.rejected++;
                console.log(`❌ Rejected (Low FitScore): ${enriched.companyName} (FitScore: ${enriched.fitScore})`);
                await saveLead(db, Object.assign(Object.assign({}, enriched), { state, searchQuery }));
                continue;
            }
            log.verified++;
            console.log(`✅ Verified: ${enriched.companyName} (FitScore: ${enriched.fitScore})`);
            if (enriched.email) {
                const personalized = await fase4_personalize(enriched);
                await fase5_sequence(personalized, db);
                log.contacted++;
                console.log(`📤 Sent to Instantly: ${personalized.email}`);
                await saveLead(db, Object.assign(Object.assign({}, personalized), { status: 'contacted', contactedAt: admin.firestore.Timestamp.now() }));
            }
            else {
                await saveLead(db, Object.assign(Object.assign({}, enriched), { status: 'form_only' }));
                console.log(`📝 Saved for manual follow-up: ${enriched.companyName}`);
            }
        }
        catch (err) {
            console.error(`Error processing ${item.title}:`, err.message);
            log.errors.push(`${item.title}: ${err.message}`);
        }
    }
}
async function fase1_discover(locationCode, searchQuery) {
    var _a, _b, _c, _d, _e;
    const auth = Buffer.from(`${dataForSeoLogin.value()}:${dataForSeoApiKey.value()}`).toString('base64');
    const response = await axios_1.default.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{ location_code: locationCode, keyword: searchQuery, language_code: "en" }], { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } });
    return ((_e = (_d = (_c = (_b = (_a = response.data.tasks) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.items) === null || _e === void 0 ? void 0 : _e.filter((item) => item.url && item.title)) || [];
}
function fase2_verify(item) {
    var _a, _b;
    const url = item.url || '';
    const EXCLUDED_DOMAINS = ['yelp.com', 'thumbtack.com', 'homeadvisor.com', 'angi.com', 'energysage.com', 'solarreviews.com'];
    if (EXCLUDED_DOMAINS.some(d => url.toLowerCase().includes(d))) {
        return { companyName: item.title, domain: url, fitScore: 0, status: 'rejected' };
    }
    return {
        companyName: item.title,
        domain: extractDomain(url),
        url,
        fitScore: 0,
        status: 'new',
        enrichmentData: {
            rating: ((_a = item.rating) === null || _a === void 0 ? void 0 : _a.value) || 0,
            reviewCount: ((_b = item.rating) === null || _b === void 0 ? void 0 : _b.votes_count) || 0,
            snippet: item.snippet || ''
        }
    };
}
async function fase3_enrich(lead) {
    var _a;
    const enriched = Object.assign({}, lead);
    let html = '';
    let isPersonalEmail = false;
    try {
        const response = await axios_1.default.get(lead.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        html = response.data;
        console.log(`🔍 [DIAGNOSTIC] ${lead.domain} - HTML length: ${html.length} chars`);
    }
    catch (err) {
        console.warn(`Scraping failed for ${lead.domain}`);
        console.log(`🔍 [DIAGNOSTIC] ${lead.domain} - Scraping FAILED, HTML length: 0`);
    }
    try {
        const hunterRes = await axios_1.default.get(`https://api.hunter.io/v2/domain-search?domain=${lead.domain}&api_key=${hunterApiKey.value()}`);
        const emailInfo = (_a = hunterRes.data.data.emails) === null || _a === void 0 ? void 0 : _a[0];
        if (emailInfo) {
            const verifyRes = await axios_1.default.get(`https://api.hunter.io/v2/email-verifier?email=${emailInfo.value}&api_key=${hunterApiKey.value()}`);
            if ((verifyRes.data.data.score || 0) >= 70) {
                enriched.email = emailInfo.value;
                enriched.firstName = emailInfo.first_name;
                isPersonalEmail = emailInfo.type === 'personal';
            }
        }
    }
    catch (err) {
        console.warn(`Hunter.io failed for ${lead.domain}`);
    }
    let fitScore = 0;
    const scoreBreakdown = [];
    const content = html.toLowerCase();
    const snippet = enriched.enrichmentData.snippet.toLowerCase();
    const combined = content + ' ' + snippet;
    console.log(`🔍 [DIAGNOSTIC] ${lead.domain} - Snippet length: ${snippet.length} chars, Combined length: ${combined.length} chars`);
    // +15: HTTPS website (legitimate business)
    if (lead.url.startsWith('https://') && !lead.url.includes('facebook.com')) {
        fitScore += 15;
        scoreBreakdown.push('+15 HTTPS');
    }
    // +10: Has reviews (active business)
    if (enriched.enrichmentData.reviewCount >= 5) {
        fitScore += 10;
        scoreBreakdown.push(`+10 Reviews (${enriched.enrichmentData.reviewCount})`);
    }
    // +20: Certified/Licensed (NABCEP or general certification)
    const certPatterns = ['nabcep', 'certified installer', 'licensed contractor', 'accredited', 'bonded and insured'];
    const certMatch = certPatterns.find(p => combined.includes(p));
    if (certMatch) {
        fitScore += 20;
        scoreBreakdown.push(`+20 Cert (${certMatch})`);
    }
    // +15: Years in business (5+ years) - LOOSER patterns
    const yearPatterns = [
        /since\s*(19|20)\d{2}/i,
        /established\s*(19|20)\d{2}/i,
        /founded\s*(19|20)\d{2}/i,
        /(\d{1,2})\+?\s*years\s*(of\s*)?(experience|in business)/i,
        /over\s*(\d{1,2})\s*years/i,
        /family\s*owned\s*since\s*(19|20)\d{2}/i
    ];
    for (const pattern of yearPatterns) {
        const match = combined.match(pattern);
        if (match) {
            const yearOrDuration = match[1];
            let years = 0;
            if (yearOrDuration && yearOrDuration.length === 4) {
                // It's a year (e.g., 2010)
                years = new Date().getFullYear() - parseInt(yearOrDuration);
            }
            else if (yearOrDuration) {
                // It's a duration (e.g., "15 years")
                years = parseInt(yearOrDuration);
            }
            if (years >= 5) {
                fitScore += 15;
                scoreBreakdown.push(`+15 Years (${years}y)`);
                break;
            }
        }
    }
    // +15: Solar focus (LOOSER - any solar installation/service mention)
    const solarPatterns = [
        'residential solar', 'home solar', 'rooftop solar', 'panel installation',
        'solar installer', 'solar installation', 'solar panels', 'solar energy',
        'solar system', 'solar power', 'photovoltaic', 'pv system'
    ];
    const solarMatch = solarPatterns.find(kw => combined.includes(kw));
    if (solarMatch) {
        fitScore += 15;
        scoreBreakdown.push(`+15 Solar (${solarMatch})`);
    }
    // +10: Service area mentioned (LOCAL business indicator)
    const servicePatterns = [
        'serving', 'service area', 'we serve', 'areas served',
        'counties', 'cities', 'locations', 'coverage area'
    ];
    const serviceMatch = servicePatterns.find(p => combined.includes(p));
    if (serviceMatch) {
        fitScore += 10;
        scoreBreakdown.push(`+10 Service (${serviceMatch})`);
    }
    // +10: High rating (quality indicator)
    if (enriched.enrichmentData.rating >= 4.5) {
        fitScore += 10;
        scoreBreakdown.push(`+10 Rating (${enriched.enrichmentData.rating})`);
    }
    // +10: Personal email found (decision-maker access)
    if (isPersonalEmail) {
        fitScore += 10;
        scoreBreakdown.push('+10 Personal Email');
    }
    // Log final score breakdown
    const passStatus = fitScore >= FIT_SCORE_THRESHOLD ? '✅ PASS' : '❌ FAIL';
    console.log(`🔍 [DIAGNOSTIC] ${lead.domain} - FitScore: ${fitScore}/${FIT_SCORE_THRESHOLD} ${passStatus}`);
    console.log(`🔍 [DIAGNOSTIC] ${lead.domain} - Breakdown: ${scoreBreakdown.length > 0 ? scoreBreakdown.join(', ') : 'NO POINTS AWARDED'}`);
    enriched.fitScore = fitScore;
    enriched.status = fitScore >= FIT_SCORE_THRESHOLD ? 'enriched' : 'rejected';
    return enriched;
}
// @ts-ignore - Reserved for future use
function _extractSolarFactPack(html) {
    const $ = cheerio.load(html);
    const facts = [];
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
async function fase4_personalize(lead) {
    const openai = new openai_1.default({ apiKey: openaiApiKey.value() });
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
    }
    catch (err) {
        console.error('OpenAI personalization failed:', err.message);
        lead.messageKit = { subjectA: `Solar leads in ${location}` }; // Fallback
    }
    return lead;
}
async function fase5_sequence(lead, db) {
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
                custom_variables: Object.assign({ fit_score: lead.fitScore.toString() }, lead.messageKit)
            }]
    };
    if (DRY_RUN.value()) {
        console.log(`🧪 DRY-RUN: Would add ${lead.email} to campaign`);
    }
    else {
        await axios_1.default.post('https://api.instantly.ai/api/v2/leads/add', payload, {
            headers: { 'Authorization': `Bearer ${instantlyApiKey.value()}` }
        });
    }
}
async function saveLead(db, lead) {
    const leadId = `${lead.domain}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '_');
    await db.collection('solar_leads').doc(leadId).set(Object.assign(Object.assign({ id: leadId }, lead), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
}
function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    }
    catch (_a) {
        return url;
    }
}
//# sourceMappingURL=solarHunterV1.js.map