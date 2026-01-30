"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerHunter = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const openai_1 = require("openai");
// Secrets
const dataForSeoApiKey = (0, params_1.defineSecret)('DATAFORSEO_API_KEY');
const hunterApiKey = (0, params_1.defineSecret)('HUNTER_API_KEY');
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
const instantlyApiKey = (0, params_1.defineSecret)('INSTANTLY_API_KEY');
const CITIES = ['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'];
const TERMS = ['Slaapcoach kind', 'Kinderopvang', 'Mommy blogger Nederland', 'Zwangerschapscoach', 'Baby spa'];
// Interface removed to clean up lint.
exports.partnerHunter = (0, scheduler_1.onSchedule)({
    schedule: "every monday 09:00",
    timeZone: "Europe/Amsterdam",
    secrets: [dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    console.log("🕵️‍♂️ Partner Hunter Started");
    const db = admin.firestore();
    // 1. Random Selection Strategy to avoid same search every week
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const term = TERMS[Math.floor(Math.random() * TERMS.length)];
    console.log(`🎯 Target: "${term}" in ${city}`);
    try {
        // 2. DataForSEO (Using Google Maps API for reliable local results or their Maps Endpoint)
        // Note: Assuming Google Places API or DataForSEO Google Maps endpoint structure.
        // Simplifying to a mock-like structure for the implementation unless API is strictly known.
        // Using a generic Axios call which user can adapt to specific endpoint logic.
        const searchRes = await axios_1.default.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{
                keyword: `${term} ${city}`,
                location_code: 2528,
                language_code: "nl",
                depth: 20
            }], {
            auth: {
                username: "system",
                password: dataForSeoApiKey.value()
            }
        });
        // NOTE: DataForSEO logic heavily depends on the specific endpoint. 
        // Adapting to a generic Google Maps Places API style if DataForSEO complex:
        // Actually, let's write clean logic that iterates found items.
        // MOCKING the extraction for safety as DataForSEO response structure is complex.
        const items = ((_e = (_d = (_c = (_b = (_a = searchRes.data) === null || _a === void 0 ? void 0 : _a.tasks) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.result) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.items) || [];
        for (const item of items) {
            // [UPDATED v3.1] Stricter Quality Filter (Trust-Based)
            // Rating must be very high (> 4.5) AND have significant social proof (> 20 reviews)
            if (!item.url || item.rating <= 4.5 || (item.reviews_count || 0) < 20)
                continue;
            const domain = new URL(item.url).hostname.replace('www.', '');
            // 3. Deduplication
            const existing = await db.collection('leads').doc(domain.replace(/\./g, '_')).get();
            if (existing.exists)
                continue;
            console.log(`🔎 Analyzing: ${domain}`);
            // 4. Hunter.io (Enrichment)
            let emailObj = null;
            try {
                const hunterRes = await axios_1.default.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey.value()}&type=personal`);
                // Prefer personal, fallback to generic?
                const emails = ((_g = (_f = hunterRes.data) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.emails) || [];
                emailObj = emails.find((e) => e.type === 'personal') || emails[0];
            }
            catch (e) {
                console.warn(`Hunter failed for ${domain}`);
            }
            if (!emailObj)
                continue;
            // 5. OpenAI (Personalization)
            const openai = new openai_1.default({ apiKey: openaiApiKey.value() });
            const prompt = `
        Schrijf een korte, warme ijsbreker (1 zin) voor een koude mail aan ${item.title} in ${city}.
        Complimenteer ze specifiek met hun hoge Google score van ${item.rating} sterren en hun rol in de lokale gemeenschap.
        Taal: Nederlands. Tone: Warm, Professioneel.
      `;
            const gptRes = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 60
            });
            const icebreaker = ((_k = (_j = (_h = gptRes.choices[0]) === null || _h === void 0 ? void 0 : _h.message) === null || _j === void 0 ? void 0 : _j.content) === null || _k === void 0 ? void 0 : _k.trim()) || "Wat goed dat jullie zo'n mooie score hebben!";
            // 6. Instantly.ai (Outreach)
            const leadPayload = {
                email: emailObj.value,
                firstName: emailObj.first_name || 'Partner',
                lastName: emailObj.last_name || '',
                companyName: item.title,
                website: item.url,
                customVariables: {
                    icebreaker: icebreaker
                }
            };
            await axios_1.default.post('https://api.instantly.ai/api/v1/lead/add', {
                api_key: instantlyApiKey.value(),
                campaign_id: 'YOUR_CAMPAIGN_ID',
                skip_if_in_workspace: true,
                leads: [leadPayload]
            });
            // 7. Log
            await db.collection('leads').doc(domain.replace(/\./g, '_')).set({
                domain,
                companyName: item.title,
                city,
                email: emailObj.value,
                status: 'contacted',
                icebreaker,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Processed: ${domain}`);
        }
    }
    catch (error) {
        console.error("Hunter Run Failed", error);
    }
});
//# sourceMappingURL=partnerHunter.js.map