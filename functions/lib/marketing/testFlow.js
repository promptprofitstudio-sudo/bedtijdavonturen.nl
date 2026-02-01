"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPartnerFlow = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const openai_1 = require("openai");
// Secrets
const dataForSeoLogin = (0, params_1.defineSecret)('DATAFORSEO_LOGIN');
const dataForSeoApiKey = (0, params_1.defineSecret)('DATAFORSEO_API_KEY');
const hunterApiKey = (0, params_1.defineSecret)('HUNTER_API_KEY');
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
const instantlyApiKey = (0, params_1.defineSecret)('INSTANTLY_API_KEY');
const instantlyCampaignId = (0, params_1.defineSecret)('INSTANTLY_CAMPAIGN_ID');
exports.testPartnerFlow = (0, https_1.onRequest)({
    secrets: [dataForSeoLogin, dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey, instantlyCampaignId],
    timeoutSeconds: 300,
    memory: "512MiB",
}, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    // Default test email (can be overridden via query param)
    const testEmail = req.query.testEmail || 'michel@korpershoek-management.nl';
    const city = req.query.city || 'Almere';
    const searchTerm = req.query.term || 'Kinderopvang';
    const term = `${searchTerm} ${city}`;
    console.log(`🧪 Test Parameters:`);
    console.log(`  → Test Email: ${testEmail}`);
    console.log(`  → Search Term: ${term}`);
    const startTime = Date.now();
    const log = { steps: [] };
    try {
        // --- STAP A: DataForSEO ---
        log.steps.push("Starting DataForSEO search...");
        const searchRes = await axios_1.default.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{
                keyword: term,
                location_code: 2528,
                language_code: "nl",
                depth: 20
            }], {
            auth: {
                username: dataForSeoLogin.value(),
                password: dataForSeoApiKey.value()
            }
        });
        const items = ((_e = (_d = (_c = (_b = (_a = searchRes.data) === null || _a === void 0 ? void 0 : _a.tasks) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.result) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.items) || [];
        const item = items[0]; // LIMIT: Take only the first result
        if (!item) {
            res.status(404).json({ error: "No results found in DataForSEO.", log });
            return;
        }
        log.foundCompany = {
            title: item.title,
            rating: item.rating,
            reviews: item.reviews_count,
            url: item.url
        };
        log.steps.push(`✅ Gevonden bedrijf: ${item.title}`);
        // --- STAP B: Hunter.io ---
        let domain = "";
        try {
            domain = new URL(item.url).hostname.replace('www.', '');
        }
        catch (e) {
            // Fallback strategy if URL is missing or invalid, though unlikely for top result
            log.steps.push("⚠ URL invalid, skipping Hunter");
            res.status(400).json({ error: "Invalid URL for Hunter", item, log });
            return;
        }
        log.steps.push(`Running Hunter for: ${domain}`);
        const hunterRes = await axios_1.default.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey.value()}&type=personal`);
        const emails = ((_g = (_f = hunterRes.data) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.emails) || [];
        // Prefer personal
        const emailObj = emails.find((e) => e.type === 'personal') || emails[0];
        if (!emailObj) {
            res.status(404).json({ error: "No email found by Hunter.", log });
            return;
        }
        log.foundEmail = emailObj.value;
        log.steps.push(`✅ Gevonden email: ${emailObj.value}`);
        // --- STAP C: OpenAI ---
        log.steps.push("Generating Icebreaker...");
        const openai = new openai_1.default({ apiKey: openaiApiKey.value() });
        const prompt = `
            Schrijf een korte, warme ijsbreker (1 zin) voor een koude mail aan ${item.title}.
            Complimenteer ze specifiek met hun hoge Google score van ${item.rating} sterren en hun rol in de lokale gemeenschap.
            Taal: Nederlands. Tone: Warm, Professioneel.
        `;
        const gptRes = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 60
        });
        const icebreaker = (_k = (_j = (_h = gptRes.choices[0]) === null || _h === void 0 ? void 0 : _h.message) === null || _j === void 0 ? void 0 : _j.content) === null || _k === void 0 ? void 0 : _k.trim();
        log.icebreaker = icebreaker;
        log.steps.push(`✅ Icebreaker: ${icebreaker}`);
        // --- STAP D: Instantly (Safety Override) ---
        log.steps.push(`Pushing to Instantly (Override destination: ${testEmail})...`);
        const leadPayload = {
            email: testEmail,
            firstName: emailObj.first_name || 'Partner',
            lastName: emailObj.last_name || '',
            companyName: item.title,
            website: item.url,
            customVariables: {
                icebreaker: icebreaker,
                original_email: emailObj.value // TRACKING
            }
        };
        const instantlyRes = await axios_1.default.post('https://api.instantly.ai/api/v1/lead/add', {
            api_key: instantlyApiKey.value(),
            campaign_id: instantlyCampaignId.value(),
            skip_if_in_workspace: false,
            leads: [leadPayload]
        });
        log.instantlyStatus = instantlyRes.status;
        log.instantlyData = instantlyRes.data;
        log.steps.push("✅ Instantly Push Complete");
        // Log test run to Firestore for audit trail
        const db = admin.firestore();
        await db.collection('partner_test_runs').add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            testEmail,
            searchTerm: term,
            city,
            // Results
            dataForSeo: {
                found: ((_l = log.items) === null || _l === void 0 ? void 0 : _l.length) || 0,
                topResult: log.foundCompany || null
            },
            hunter: {
                domain: log.hunterDomain,
                emailFound: !!log.foundEmail,
                email: log.foundEmail
            },
            openai: {
                icebreaker: log.icebreaker
            },
            instantly: {
                success: !!log.instantlyData,
                response: log.instantlyData
            },
            // Metadata
            success: true,
            duration: Date.now() - startTime
        });
        console.log('✅ Test run logged to Firestore');
        // Response
        res.status(200).json({
            success: true,
            data: {
                company: log.foundCompany,
                email_original: log.foundEmail,
                email_sent_to: testEmail,
                icebreaker: log.icebreaker,
                instantly_response: log.instantlyData
            },
            log: log.steps
        });
    }
    catch (error) {
        console.error("Test Flow Failed", error);
        res.status(500).json({
            error: error.message || "Internal Error",
            stack: error.stack,
            log
        });
    }
});
//# sourceMappingURL=testFlow.js.map