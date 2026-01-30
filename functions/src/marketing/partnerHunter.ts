import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import axios from 'axios';
import OpenAI from 'openai';

// Secrets
const dataForSeoApiKey = defineSecret('DATAFORSEO_API_KEY');
const hunterApiKey = defineSecret('HUNTER_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const instantlyApiKey = defineSecret('INSTANTLY_API_KEY');

const CITIES = ['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'];
const TERMS = ['Slaapcoach kind', 'Kinderopvang', 'Mommy blogger Nederland', 'Zwangerschapscoach', 'Baby spa'];

// Interface removed to clean up lint.

export const partnerHunter = onSchedule({
    schedule: "every monday 09:00",
    timeZone: "Europe/Amsterdam",
    secrets: [dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
}, async (event) => {
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
        const searchRes = await axios.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{
            keyword: `${term} ${city}`,
            location_code: 2528, // Netherlands
            language_code: "nl",
            depth: 20
        }], {
            auth: {
                username: "system", // Placeholder
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

            // 4. Hunter.io (Enrichment)
            let emailObj = null;
            try {
                const hunterRes = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey.value()}&type=personal`);
                // Prefer personal, fallback to generic?
                const emails = hunterRes.data?.data?.emails || [];
                emailObj = emails.find((e: any) => e.type === 'personal') || emails[0];
            } catch (e) {
                console.warn(`Hunter failed for ${domain}`);
            }

            if (!emailObj) continue;

            // 5. OpenAI (Personalization)
            const openai = new OpenAI({ apiKey: openaiApiKey.value() });
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

            await axios.post('https://api.instantly.ai/api/v1/lead/add', {
                api_key: instantlyApiKey.value(),
                campaign_id: 'YOUR_CAMPAIGN_ID', // Needs to be configured or passed
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

    } catch (error) {
        console.error("Hunter Run Failed", error);
    }
});
