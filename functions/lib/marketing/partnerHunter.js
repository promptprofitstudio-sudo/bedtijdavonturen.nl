"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerHunter = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const openai_1 = require("openai");
const retry_1 = require("./utils/retry");
// Secrets
const dataForSeoLogin = (0, params_1.defineSecret)('DATAFORSEO_LOGIN');
const dataForSeoApiKey = (0, params_1.defineSecret)('DATAFORSEO_API_KEY');
const hunterApiKey = (0, params_1.defineSecret)('HUNTER_API_KEY');
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
const instantlyApiKey = (0, params_1.defineSecret)('INSTANTLY_API_KEY');
const instantlyCampaignId = (0, params_1.defineSecret)('INSTANTLY_CAMPAIGN_ID');
const posthogApiKey = (0, params_1.defineSecret)('POSTHOG_PERSONAL_API_KEY');
// Safety: Dry-run mode (set to 'false' to enable production mode)
// Default behavior: DRY_RUN unless explicitly set to 'false'
const DRY_RUN = (0, params_1.defineBoolean)('PARTNER_HUNTER_DRY_RUN', {
    default: true,
    description: 'Enable dry-run mode (no actual API calls to Instantly). Set to false for production.'
});
const CITIES = ['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'];
const TERMS = ['Slaapcoach kind', 'Kinderopvang', 'Mommy blogger Nederland', 'Zwangerschapscoach', 'Baby spa'];
// Interface removed to clean up lint.
exports.partnerHunter = (0, scheduler_1.onSchedule)({
    schedule: "every monday 09:00",
    timeZone: "Europe/Amsterdam",
    secrets: [dataForSeoLogin, dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey, instantlyCampaignId, posthogApiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const runMode = DRY_RUN.value() ? 'DRY-RUN' : 'PRODUCTION';
    console.log(`🕵️‍♂️ Partner Hunter Started [${runMode}]`);
    if (DRY_RUN.value()) {
        console.log('⚠️  DRY RUN MODE: Will log actions but not send emails');
    }
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
                username: dataForSeoLogin.value(),
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
            // 4. Hunter.io (Enrichment) with Retry
            let emailObj = null;
            try {
                const hunterRes = await (0, retry_1.withRetry)(() => axios_1.default.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey.value()}&type=personal`), {
                    maxRetries: 3,
                    onRetry: (attempt, error) => {
                        console.log(`🔄 Hunter.io retry ${attempt} for ${domain}`);
                    }
                });
                const emails = ((_g = (_f = hunterRes.data) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.emails) || [];
                emailObj = emails.find((e) => e.type === 'personal') || emails[0];
            }
            catch (e) {
                console.warn(`❌ Hunter failed for ${domain} after retries`);
            }
            if (!emailObj)
                continue;
            // 5. OpenAI (Personalization) with Retry
            const openai = new openai_1.default({ apiKey: openaiApiKey.value() });
            const prompt = `
        Schrijf een korte, warme ijsbreker (1 zin) voor een koude mail aan ${item.title} in ${city}.
        Complimenteer ze specifiek met hun hoge Google score van ${item.rating} sterren en hun rol in de lokale gemeenschap.
        Taal: Nederlands. Tone: Warm, Professioneel.
      `;
            const gptRes = await (0, retry_1.withRetry)(() => openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 60
            }), {
                maxRetries: 2,
                initialDelay: 2000,
                onRetry: (attempt) => {
                    console.log(`🔄 OpenAI retry ${attempt}`);
                }
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
            // Apply dry-run conditional
            if (DRY_RUN.value()) {
                console.log(`[DRY RUN] Would send to Instantly:`);
                console.log(`  → Email: ${leadPayload.email}`);
                console.log(`  → Company: ${leadPayload.companyName}`);
                console.log(`  → Icebreaker: ${leadPayload.customVariables.icebreaker}`);
            }
            else {
                // Production: Actually send to Instantly
                await axios_1.default.post('https://api.instantly.ai/api/v1/lead/add', {
                    api_key: instantlyApiKey.value(),
                    campaign_id: instantlyCampaignId.value(),
                    skip_if_in_workspace: true,
                    leads: [leadPayload]
                });
                console.log(`✅ Sent to Instantly: ${leadPayload.email}`);
            }
            // Generate VIP code for partner (GAP 3)
            const vipCode = `${item.title
                .replace(/[^a-zA-Z0-9]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 20)
                .toUpperCase()}-VIP`;
            // Store VIP code in Firestore
            if (!DRY_RUN.value()) {
                await db.collection('referral_codes').doc(vipCode).set({
                    code: vipCode,
                    partnerName: item.title,
                    partnerDomain: domain,
                    partnerEmail: emailObj.value,
                    // Grant family plan equivalent (30 credits)
                    creditsGranted: 30,
                    maxRedemptions: 100,
                    redemptions: 0,
                    // Metadata
                    createdBy: 'partner_hunter',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    expiresAt: null // Never expires
                });
                console.log(`🎟️  VIP Code Created: ${vipCode}`);
            }
            // 7. Log
            await db.collection('leads').doc(domain.replace(/\./g, '_')).set({
                domain,
                companyName: item.title,
                city,
                email: emailObj.value,
                status: DRY_RUN.value() ? 'dry_run' : 'contacted',
                dryRun: DRY_RUN.value(),
                icebreaker,
                vipCode,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Processed: ${domain}`);
        }
    }
    catch (error) {
        console.error("Hunter Run Failed", error);
    }
    finally {
        // GAP 8: PostHog Monitoring
        try {
            const { PostHog } = await Promise.resolve().then(() => require('posthog-node'));
            const phClient = new PostHog(posthogApiKey.value(), {
                host: 'https://eu.i.posthog.com'
            });
            phClient.capture({
                distinctId: 'partner_hunter_system',
                event: 'partner_hunter_run',
                properties: {
                    city,
                    term,
                    dry_run: DRY_RUN.value(),
                    timestamp: new Date().toISOString()
                }
            });
            await phClient.shutdown();
            console.log('📊 Metrics logged to PostHog');
        }
        catch (e) {
            console.error('Failed to log to PostHog:', e);
        }
    }
});
//# sourceMappingURL=partnerHunter.js.map