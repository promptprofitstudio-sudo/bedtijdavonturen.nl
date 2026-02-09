"use strict";
/**
 * Partner Growth Engine v4.0
 * Quality-First B2B Outreach Pipeline
 *
 * 6-Phase System:
 * 1. Discover (DataForSEO)
 * 2. Verify (FitScore Gatekeeper)
 * 3. Enrich (3-Rail Contact + Fact Pack)
 * 4. Personalize (AI Message Kit)
 * 5. Sequence (Instantly.ai)
 * 6. Learn (Firestore)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerHunterV4 = void 0;
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
const instantlyCampaignKdv = (0, params_1.defineSecret)('INSTANTLY_CAMPAIGN_KDV'); // New: segment-specific campaigns
const instantlyCampaignSchool = (0, params_1.defineSecret)('INSTANTLY_CAMPAIGN_SCHOOL');
const instantlyCampaignPro = (0, params_1.defineSecret)('INSTANTLY_CAMPAIGN_PRO');
exports.partnerHunterV4 = functions.scheduler.onSchedule({
    schedule: 'every monday 09:00',
    timeZone: 'Europe/Amsterdam',
    secrets: [dataForSeoLogin, dataForSeoApiKey, hunterApiKey, openaiApiKey,
        instantlyApiKey, instantlyCampaignKdv, instantlyCampaignSchool, instantlyCampaignPro],
    memory: '1GiB',
    timeoutSeconds: 540
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
        errors: []
    };
    console.log('🚀 Partner Growth Engine v4.0 - STARTING');
    // Configuration
    const SEARCH_CONFIGS = [
        { city: 'Amsterdam', term: 'Kinderopvang' },
        { city: 'Rotterdam', term: 'Kinderopvang' },
        { city: 'Utrecht', term: 'Buitenschoolse opvang' },
        { city: 'Almere', term: 'Kinderopvang' },
    ];
    for (const config of SEARCH_CONFIGS) {
        try {
            await processSearch(config.city, config.term, db, log);
        }
        catch (err) {
            console.error(`❌ Search failed for ${config.city}:`, err.message);
            log.errors.push(`${config.city}: ${err.message}`);
        }
    }
    // Save run log to Firestore
    await db.collection('partner_runs').add(Object.assign(Object.assign({}, log), { completedAt: admin.firestore.FieldValue.serverTimestamp() }));
    console.log('✅ Partner Growth Engine v4.0 - COMPLETE', log);
});
/**
 * Process a single city/term search through the 6-phase pipeline
 */
async function processSearch(city, searchTerm, db, log) {
    var _a;
    console.log(`\n=== Processing: ${city} - ${searchTerm} ===`);
    // FASE 1: DISCOVER
    const discoveries = await fase1_discover(city, searchTerm);
    log.discovered += discoveries.length;
    console.log(`📍 Discovered ${discoveries.length} businesses`);
    for (const item of discoveries) {
        try {
            // FASE 2: VERIFY (FitScore Gatekeeper)
            const verification = fase2_verify(item, searchTerm);
            if (verification.status === 'rejected') {
                log.rejected++;
                console.log(`❌ Rejected: ${item.title} (FitScore: ${verification.fitScore})`);
                // Still save rejected leads for learning
                await saveLead(db, Object.assign(Object.assign({}, verification), { city,
                    searchTerm, status: 'rejected' }));
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
                console.log(`✍️  Personalized: ${(_a = personalized.messageKit) === null || _a === void 0 ? void 0 : _a.subjectA}`);
                // FASE 5: SEQUENCE
                await fase5_sequence(personalized);
                log.contacted++;
                personalized.status = 'contacted';
                personalized.contactedAt = admin.firestore.Timestamp.now();
                console.log(`📤 Sent to Instantly: ${personalized.email}`);
                // FASE 6: LEARN
                await saveLead(db, personalized);
            }
            else {
                // No email found - save for manual follow-up
                enriched.status = enriched.status || 'form_only';
                await saveLead(db, enriched);
                console.log(`📝 Saved for manual follow-up: ${enriched.companyName}`);
            }
        }
        catch (err) {
            console.error(`Error processing ${item.title}:`, err.message);
            log.errors.push(`${item.title}: ${err.message}`);
        }
    }
}
/**
 * FASE 1: Discover businesses via DataForSEO
 */
async function fase1_discover(city, searchTerm) {
    var _a, _b, _c, _d;
    const auth = Buffer.from(`${dataForSeoLogin.value()}:${dataForSeoApiKey.value()}`).toString('base64');
    // DataForSEO requires location_code, not location_name
    const LOCATION_CODES = {
        'Amsterdam': 20766,
        'Rotterdam': 20770,
        'Utrecht': 20768,
        'Almere': 20760
    };
    const locationCode = LOCATION_CODES[city];
    if (!locationCode) {
        throw new Error(`No location code configured for city: ${city}`);
    }
    const response = await axios_1.default.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{
            location_code: locationCode,
            keyword: searchTerm,
            language_code: "nl"
        }], {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        }
    });
    const items = ((_d = (_c = (_b = (_a = response.data.tasks) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.items) || [];
    return items.filter((item) => item.url && item.title);
}
/**
 * FASE 2: Verify with FitScore calculation
 */
function fase2_verify(item, searchTerm) {
    var _a, _b;
    const url = item.url || '';
    const snippet = (item.snippet || '').toLowerCase();
    const rating = ((_a = item.rating) === null || _a === void 0 ? void 0 : _a.value) || 0;
    const reviewCount = ((_b = item.rating) === null || _b === void 0 ? void 0 : _b.votes_count) || 0;
    // HARD KILL: Exclude directories and marketplaces
    const EXCLUDED_DOMAINS = ['marktplaats', 'telefoongids', 'facebook.com/pg', 'instagram.com'];
    if (EXCLUDED_DOMAINS.some(d => url.toLowerCase().includes(d))) {
        return {
            companyName: item.title,
            domain: url,
            fitScore: 0,
            status: 'rejected',
            segment: 'kdv_bso',
            enrichmentData: {
                source: 'hunter',
                contactType: 'form_only',
                facts: [],
                rating,
                reviewCount,
                snippet: item.snippet
            }
        };
    }
    // FITSCORE CALCULATION (0-100)
    let fitScore = 0;
    // +30: Segment Match
    const keywords = ['kinderopvang', 'kdv', 'bso', 'school', 'peuterspeelzaal', 'opvang'];
    if (keywords.some(kw => searchTerm.toLowerCase().includes(kw) || snippet.includes(kw))) {
        fitScore += 30;
    }
    //+20: High Rating
    if (rating > 4.2) {
        fitScore += 20;
    }
    // +20: Established (many reviews)
    if (reviewCount > 15) {
        fitScore += 20;
    }
    // +20: Parent-oriented content
    const parentKeywords = ['inschrijven', 'ouders', 'tarieven', 'wachtlijst', 'aanmelden'];
    if (parentKeywords.some(kw => snippet.includes(kw))) {
        fitScore += 20;
    }
    // +10: Professional website (HTTPS)
    if (url.startsWith('https://')) {
        fitScore += 10;
    }
    // Determine segment
    let segment = 'kdv_bso';
    if (snippet.includes('school') || snippet.includes('basisschool')) {
        segment = 'school';
    }
    else if (snippet.includes('coach') || snippet.includes('trainer')) {
        segment = 'pro';
    }
    return {
        companyName: item.title,
        domain: extractDomain(url),
        url,
        fitScore,
        status: fitScore >= 70 ? 'new' : 'rejected',
        segment,
        enrichmentData: {
            source: 'hunter',
            contactType: 'form_only',
            facts: [],
            rating,
            reviewCount,
            snippet: item.snippet
        }
    };
}
/**
 * FASE 3: Enrich with 3-Rail Contact Discovery + Fact Pack
 */
async function fase3_enrich(lead) {
    const enriched = Object.assign({}, lead);
    enriched.status = 'enriching';
    // Site Fetch + Fact Pack
    let html = '';
    try {
        const response = await axios_1.default.get(lead.url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BedtijdavonturenBot/1.0; +https://bedtijdavonturen.nl)'
            }
        });
        html = response.data;
        // Extract Facts
        const facts = extractFactPack(html);
        enriched.enrichmentData.facts = facts;
        // Refine Segment based on content
        const content = html.toLowerCase();
        if (content.includes('kinderopvang') || content.includes('buitenschoolse')) {
            enriched.segment = 'kdv_bso';
        }
        else if (content.includes('basisschool') || content.includes('onderwijs')) {
            enriched.segment = 'school';
        }
        else if (content.includes('coach') || content.includes('training')) {
            enriched.segment = 'pro';
        }
    }
    catch (err) {
        console.warn(`Scraping failed for ${lead.domain}, continuing with Hunter only`);
        enriched.enrichmentData.facts = [];
    }
    // 3-RAIL CONTACT DISCOVERY
    enriched.status = 'enriching';
    // Rail A: Hunter.io (Best: Personal emails)
    try {
        const hunterRes = await axios_1.default.get(`https://api.hunter.io/v2/domain-search?domain=${lead.domain}&api_key=${hunterApiKey.value()}`);
        if (hunterRes.data.data.emails && hunterRes.data.data.emails.length > 0) {
            const email = hunterRes.data.data.emails[0];
            enriched.email = email.value;
            enriched.firstName = email.first_name;
            enriched.lastName = email.last_name;
            enriched.enrichmentData.source = 'hunter';
            enriched.enrichmentData.contactType = email.type === 'personal' ? 'personal' : 'role_based';
            enriched.status = 'ready_for_email';
            console.log(`  [Rail A] Hunter.io: ${enriched.email}`);
            return enriched;
        }
    }
    catch (err) {
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
                enriched.email = email;
                enriched.enrichmentData.source = 'scrape';
                enriched.enrichmentData.contactType = 'generic';
                enriched.status = 'ready_for_email';
                console.log(`  [Rail B] Scraped: ${enriched.email}`);
                return enriched;
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
 * Extract "Fact Pack" from HTML content
 */
function extractFactPack(html) {
    const $ = cheerio.load(html);
    const facts = [];
    const FACT_KEYWORDS = ['visie', 'dagritme', 'peuterplus', 'vve', 'ouderportaal', 'pedagogisch', 'ontwikkeling'];
    // Search in paragraphs and list items
    $('p, li').each((_, elem) => {
        const text = $(elem).text().toLowerCase();
        for (const keyword of FACT_KEYWORDS) {
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
 * FASE 4: Personalize with AI Message Kit (V10 FINAL - Production Ready)
 */
async function fase4_personalize(lead) {
    var _a;
    const openai = new openai_1.default({ apiKey: openaiApiKey.value() });
    // V10: Extract clean org name (before comma or full name)
    const cleanOrgName = lead.companyName.split(',')[0].trim();
    const systemPrompt = `You write Dutch cold outreach emails for Bedtijdavonturen.nl to potential partners (KDV/BSO, schools, child professionals, parenting creators).

ABSOLUTE OUTPUT RULE
Return ONLY valid JSON. No markdown, no explanations, no extra text.

FACT SAFETY RULES (CRITICAL)
- Use ONLY the provided facts. Do not add interpretations or upgrade weak signals.
- FACT STRENGTH: If the only available facts are "social media links" or "Google rating", DO NOT use them in the opening line. Start neutral instead.
- If a fact is based on a keyword hit or link presence, you MUST phrase it as observation:
  → "Ik zag dat ... op jullie website"
  → "Op jullie website wordt ... genoemd"
  → "Er staan ... links op de website"
- Never upgrade weak signals into strong claims:
  → hasSocialMedia ≠ "actief op social media" (we only see links)
  → keyword "education" ≠ "focus op ontwikkeling" (we only see it mentioned)
  → keyword "parents" ≠ "jullie richten zich op ouders" (we only see it mentioned)

FORBIDDEN WORDS
Never mention: AI, artificial intelligence, generated, automation, tool, model, algorithm, magic, revolutionary, solution, gamechanger, screenfree, schermvrij.

HUMAN POLISH RULES (V10 - CRITICAL)
- NO postcodes or street addresses in email opener. City name ONLY.
- Use natural language, not policy-speak:
  → "hoe jullie ouders ondersteunen" (NOT "ouderbetrokkenheid")
  → "oudercommunicatie" is OK, but "ouders" is simpler
- Avoid passive helper phrases:
  → NOT: "Dit kan ouders helpen om..."
  → YES: Direct benefit statement or skip entirely
- Keep it tight. Remove unnecessary words. Shorter = higher reply rate.
- Target 60–90 words (body + cta), not 70–110.

PARENT-CENTRIC POSITIONING (CRITICAL)
- Describe Bedtijdavonturen.nl as something **ouders kunnen gebruiken** or **ouders kunnen voorlezen**.
- NEVER say "kinderen helpen ontspannen" or child-focused benefits.
- ALWAYS frame as: "ouders kunnen voorlezen als vast avondritueel" or similar parent action.

STYLE RULES
- No hype. Sound like a real person. Short sentences.
- Do not assume problems or feelings. Use questions instead of claims.
- Email #1 must be 60–90 words excluding closing and opt-out.
- No links in email #1.

GREETING RULES (CRITICAL - NO EXTRA DESCRIPTORS)
- If contact_type=="personal" AND first_name present: "Hoi {first_name},"
- Else: "Beste team van {org_name},"
- org_name = ONLY the primary name, NO extra descriptors like "Kindcentrum" or city names
- Example CORRECT: "Beste team van De Leertuin,"
- Example WRONG: "Beste team van De Leertuin, Kindcentrum Amsterdam,"

CTA RULES (CONTACT TYPE SPECIFIC - V10 TIGHTER)
- If contact_type=="personal": 
  → "Zal ik 2 korte voorbeelden sturen?"
- If contact_type in ["role_based", "generic", "form_only"]:
  → DUAL CTA: "Zal ik 2 korte voorbeelden sturen? Met wie kan ik dit het beste afstemmen?"
  → NOTE: "Met wie" (NOT "En met wie") for tighter, less conjunction-heavy phrasing
  → This combines micro-commitment (examples) + routing (who to contact)

REQUIRED JSON KEYS (ALL MANDATORY)
{
  "subjectA": "",
  "subjectB": "",
  "greeting": "",
  "body": "",
  "cta": "",
  "closing": "",
  "optout": "",
  "chosen_angle": "avondritueel|taal|community"
}

BODY STRUCTURE (TIGHT & NATURAL - V10 FINAL)
1) Neutral opener: "Ik kwam {org_name} in {city} tegen" + connector ("en had een korte vraag over hoe jullie ouders ondersteunen")
   → "kwam... tegen" feels more natural than "zag" (less scrape-signal)
   → City ONLY, NO postcode/street
   → Use "ouders ondersteunen" NOT "ouderbetrokkenheid"
   → Only use facts if strong (parents/education keywords). Skip weak facts (social/rating).

2) Product + parent benefit (TWO SHORT SENTENCES - cleaner flow):
   "Bedtijdavonturen.nl maakt gepersonaliseerde bedtijdverhalen die ouders kunnen voorlezen als vast avondritueel. Een rustige, leuke afsluiting van de dag."
   → Two separate sentences, NOT em dash
   → Simpler, more digestible

3) Concrete question (use this template):
   "Delen jullie weleens tips of materiaal met ouders voor het laatste stukje van de dag?"
   → Specific, actionable, easy to answer

4) CTA (TIGHTER PHRASING):
   - If contact_type=="personal": 
     "Zal ik 2 korte voorbeelden sturen?"
   - If contact_type in ["role_based", "generic", "form_only"]:
     "Zal ik 2 korte voorbeelden sturen? Met wie kan ik dit het beste afstemmen?"
     → NOTE: "Met wie" (NOT "En met wie") - tighter, less conjunction-heavy

FORMATTING RULES (DELIVERABILITY - CRITICAL)
- Body must have EXACTLY 2 blank lines (3 total paragraphs)
- Each paragraph: max 2-3 sentences
- This creates natural email flow and improves deliverability
- Avoids "template block" appearance

CLOSING must be exactly:
"Met vriendelijke groet,\\nMichel Korpershoek\\nBedtijdavonturen.nl"

OPTOUT must be present and friendly:
"Geen interesse? Laat het weten, dan stop ik."`;
    const city = lead.city || 'Nederland';
    const factsString = ((_a = lead.enrichmentData.facts) === null || _a === void 0 ? void 0 : _a.length) > 0
        ? lead.enrichmentData.facts.join(' | ')
        : 'geen facts beschikbaar';
    const contactType = lead.enrichmentData.contactType || 'generic';
    const firstName = lead.firstName || null;
    const userPrompt = `Create email #1 for partner outreach.

INPUT
- segment: ${lead.segment}
- org_name: ${cleanOrgName}  ← USE THIS EXACT NAME, NO ADDITIONS
- city: ${city}
- contact_type: ${contactType}
- first_name: ${firstName || '(none)'}
- rating: ${lead.enrichmentData.rating || 'N/A'}

FACTS (use 1-2 max, keep phrasing low-inference, skip if only weak facts):
${factsString}

REMINDERS
- 60-90 words total (body + cta only, excluding closing/optout) - SHORTER IS BETTER
- Greeting: ONLY "Beste team van ${cleanOrgName}," – NO extra descriptors
- Location: City ONLY (${city}), NO postcode or street address
- Facts: If only "social media links" or "rating" available, skip them. Use neutral opener.
- Language: Natural, conversational. NOT "ouderbetrokkenheid" → USE "hoe jullie ouders ondersteunen"
- Value prop: MUST be parent-centric ("ouders kunnen voorlezen als vast avondritueel. Een rustige, leuke afsluiting")
- Question: Use template "Delen jullie weleens tips of materiaal met ouders voor het laatste stukje van de dag?"
- CTA: ${contactType === 'personal' ? 'Single (examples only)' : 'Dual (examples + routing)'}
- Optout: REQUIRED in JSON output
- Keep it TIGHT. Remove filler words.
- Formatting: EXACTLY 2 blank lines (3 paragraphs total), max 2-3 sentences per paragraph.`;
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
        // V10: Validate optout presence
        if (!messageKit.optout || messageKit.optout.trim() === '') {
            console.warn('⚠️  Missing optout in GPT response, adding default');
            messageKit.optout = 'Geen interesse? Laat het weten, dan stop ik.';
        }
        lead.messageKit = {
            subjectA: messageKit.subjectA || 'Samenwerking Bedtijdavonturen',
            subjectB: messageKit.subjectB || 'Voor jullie ouders',
            greeting: messageKit.greeting || `Beste team van ${cleanOrgName},`,
            body: messageKit.body || '',
            cta: messageKit.cta || 'Zal ik 2 korte voorbeelden sturen?',
            closing: messageKit.closing || 'Met vriendelijke groet,\nMichel Korpershoek\nBedtijdavonturen.nl',
            optout: messageKit.optout,
            angle: messageKit.chosen_angle || 'partnership'
        };
        return lead;
    }
    catch (err) {
        console.error('OpenAI personalization failed:', err.message);
        // Fallback to V10-style template
        lead.messageKit = {
            subjectA: `Korte vraag voor ${cleanOrgName}`,
            subjectB: 'Ondersteuning voor ouders',
            greeting: `Beste team van ${cleanOrgName},`,
            body: `Ik kwam ${cleanOrgName} in ${city} tegen en had een korte vraag over hoe jullie ouders ondersteunen. Bedtijdavonturen.nl maakt gepersonaliseerde bedtijdverhalen die ouders kunnen voorlezen als vast avondritueel. Een rustige, leuke afsluiting van de dag. Delen jullie weleens tips of materiaal met ouders voor het laatste stukje van de dag?`,
            cta: contactType === 'personal' ? 'Zal ik 2 korte voorbeelden sturen?' : 'Zal ik 2 korte voorbeelden sturen? Met wie kan ik dit het beste afstemmen?',
            closing: 'Met vriendelijke groet,\nMichel Korpershoek\nBedtijdavonturen.nl',
            optout: 'Geen interesse? Laat het weten, dan stop ik.',
            angle: 'template'
        };
        return lead;
    }
}
/**
 * FASE 5: Sequence to Instantly.ai
 */
async function fase5_sequence(lead) {
    var _a;
    // Map segment to campaign
    const CAMPAIGN_MAP = {
        'kdv_bso': instantlyCampaignKdv,
        'school': instantlyCampaignSchool,
        'pro': instantlyCampaignPro,
        'creator': instantlyCampaignPro // Fallback
    };
    const campaignSecret = CAMPAIGN_MAP[lead.segment];
    if (!campaignSecret) {
        throw new Error(`No campaign configured for segment: ${lead.segment}`);
    }
    const payload = {
        campaign_id: campaignSecret.value(),
        skip_if_in_workspace: true,
        leads: [{
                email: lead.email,
                first_name: lead.firstName || 'Partner',
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
                    optout: lead.messageKit.optout,
                    angle: lead.messageKit.angle,
                    city: lead.city,
                    rating: ((_a = lead.enrichmentData.rating) === null || _a === void 0 ? void 0 : _a.toString()) || ''
                }
            }]
    };
    try {
        await axios_1.default.post('https://api.instantly.ai/api/v2/leads/add', payload, {
            headers: {
                'Authorization': `Bearer ${instantlyApiKey.value()}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        // Log full error for debugging
        if (err.response) {
            console.error('Instantly API Error:', {
                status: err.response.status,
                data: err.response.data
            });
        }
        throw new Error(`Instantly.ai push failed: ${err.message}`);
    }
}
/**
 * FASE 6: Learn - Save to Firestore
 */
async function saveLead(db, lead) {
    const leadId = `${lead.domain}_${lead.searchTerm}`.replace(/[^a-zA-Z0-9_]/g, '_');
    await db.collection('leads').doc(leadId).set(Object.assign(Object.assign({ id: leadId }, lead), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
}
/**
 * Extract clean domain from URL
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    }
    catch (_a) {
        return url;
    }
}
//# sourceMappingURL=partnerHunterV4.js.map