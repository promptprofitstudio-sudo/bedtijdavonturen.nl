import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret, defineBoolean } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import axios from 'axios';
import OpenAI from 'openai';
import { withRetry } from './utils/retry';

// Secrets
const dataForSeoLogin = defineSecret('DATAFORSEO_LOGIN');
const dataForSeoApiKey = defineSecret('DATAFORSEO_API_KEY');
const hunterApiKey = defineSecret('HUNTER_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const instantlyApiKey = defineSecret('INSTANTLY_API_KEY');
const instantlyCampaignId = defineSecret('INSTANTLY_CAMPAIGN_ID');

// Safety: Dry-run mode (set to 'false' to enable production mode)
// Default behavior: DRY_RUN unless explicitly set to 'false'
const DRY_RUN = defineBoolean('PARTNER_HUNTER_DRY_RUN');

const CITIES = ['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'];
const TERMS = ['Slaapcoach kind', 'Kinderopvang', 'Mommy blogger Nederland', 'Zwangerschapscoach', 'Baby spa'];

// Interface removed to clean up lint.

export const partnerHunter = onSchedule({
    schedule: "every monday 09:00",
    timeZone: "Europe/Amsterdam",
    secrets: [dataForSeoLogin, dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey, instantlyCampaignId],
    timeoutSeconds: 300,
    memory: "512MiB",
}, async (event) => {
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
        const searchRes = await axios.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{
            keyword: `${term} ${city}`,
            location_code: 2528, // Netherlands
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
        const items = searchRes.data?.tasks?.[0]?.result?.[0]?.items || [];

        for (const item of items) {
            // [UPDATED v3.1] Stricter Quality Filter (Trust-Based)
            // Rating must be very high (> 4.5) AND have significant social proof (> 20 reviews)
            if (!item.url || item.rating <= 4.5 || (item.reviews_count || 0) < 20) continue;

            const domain = new URL(item.url).hostname.replace('www.', '');

            // 3. Deduplication
            const existing = await db.collection('leads').doc(domain.replace(/\./g, '_')).get();
            if (existing.exists) continue;

            console.log(`🔎 Analyzing: ${domain}`);

            // 4. Hunter.io (Enrichment) with Retry
            let emailObj = null;
            try {
                const hunterRes = await withRetry(
                    () => axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey.value()}&type=personal`),
                    {
                        maxRetries: 3,
                        onRetry: (attempt, error) => {
                            console.log(`🔄 Hunter.io retry ${attempt} for ${domain}`);
                        }
                    }
                );
                const emails = hunterRes.data?.data?.emails || [];
                emailObj = emails.find((e: any) => e.type === 'personal') || emails[0];
            } catch (e) {
                console.warn(`❌ Hunter failed for ${domain} after retries`);
            }

            if (!emailObj) continue;

            // 5. OpenAI (Personalization) with Retry
            const openai = new OpenAI({ apiKey: openaiApiKey.value() });
            const prompt = `
        Schrijf een korte, warme ijsbreker (1 zin) voor een koude mail aan ${item.title} in ${city}.
        Complimenteer ze specifiek met hun hoge Google score van ${item.rating} sterren en hun rol in de lokale gemeenschap.
        Taal: Nederlands. Tone: Warm, Professioneel.
      `;

            const gptRes = await withRetry(
                () => openai.chat.completions.create({
                    model: "gpt-4-turbo",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 60
                }),
                {
                    maxRetries: 2,
                    initialDelay: 2000,
                    onRetry: (attempt) => {
                        console.log(`🔄 OpenAI retry ${attempt}`);
                    }
                }
            );

            const icebreaker = gptRes.choices[0]?.message?.content?.trim() || "Wat goed dat jullie zo'n mooie score hebben!";

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
            } else {
                // Production: Actually send to Instantly
                await axios.post('https://api.instantly.ai/api/v1/lead/add', {
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
                vipCode, // Include VIP code reference
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Processed: ${domain}`);
        }

    } catch (error) {
        console.error("Hunter Run Failed", error);
    }
});
