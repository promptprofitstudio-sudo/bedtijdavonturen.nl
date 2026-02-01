import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import axios from 'axios';
import OpenAI from 'openai';

// Secrets
const dataForSeoApiKey = defineSecret('DATAFORSEO_API_KEY');
const hunterApiKey = defineSecret('HUNTER_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const instantlyApiKey = defineSecret('INSTANTLY_API_KEY');

export const testPartnerFlow = onRequest({
    secrets: [dataForSeoApiKey, hunterApiKey, openaiApiKey, instantlyApiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
}, async (req, res) => {
    const testEmail = req.query.testEmail as string;

    if (!testEmail) {
        res.status(400).json({ error: "Missing 'testEmail' query parameter." });
        return;
    }

    const log: any = { steps: [] };
    const term = "Kinderopvang Almere";

    try {
        // --- STAP A: DataForSEO ---
        log.steps.push("Starting DataForSEO search...");
        const searchRes = await axios.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{
            keyword: term,
            location_code: 2528, // Netherlands
            language_code: "nl",
            depth: 20
        }], {
            auth: {
                username: "system", // Using placeholder as per existing pattern
                password: dataForSeoApiKey.value()
            }
        });

        const items = searchRes.data?.tasks?.[0]?.result?.[0]?.items || [];
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
        } catch (e) {
            // Fallback strategy if URL is missing or invalid, though unlikely for top result
            log.steps.push("⚠ URL invalid, skipping Hunter");
            res.status(400).json({ error: "Invalid URL for Hunter", item, log });
            return;
        }

        log.steps.push(`Running Hunter for: ${domain}`);

        const hunterRes = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey.value()}&type=personal`);
        const emails = hunterRes.data?.data?.emails || [];
        // Prefer personal
        const emailObj = emails.find((e: any) => e.type === 'personal') || emails[0];

        if (!emailObj) {
            res.status(404).json({ error: "No email found by Hunter.", log });
            return;
        }

        log.foundEmail = emailObj.value;
        log.steps.push(`✅ Gevonden email: ${emailObj.value}`);

        // --- STAP C: OpenAI ---
        log.steps.push("Generating Icebreaker...");
        const openai = new OpenAI({ apiKey: openaiApiKey.value() });
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

        const icebreaker = gptRes.choices[0]?.message?.content?.trim();
        log.icebreaker = icebreaker;
        log.steps.push(`✅ Icebreaker: ${icebreaker}`);

        // --- STAP D: Instantly (Safety Override) ---
        log.steps.push(`Pushing to Instantly (Override destination: ${testEmail})...`);

        const leadPayload = {
            email: testEmail, // OVERRIDE
            firstName: emailObj.first_name || 'Partner',
            lastName: emailObj.last_name || '',
            companyName: item.title,
            website: item.url,
            customVariables: {
                icebreaker: icebreaker,
                original_email: emailObj.value // TRACKING
            }
        };

        const instantlyRes = await axios.post('https://api.instantly.ai/api/v1/lead/add', {
            api_key: instantlyApiKey.value(),
            campaign_id: 'YOUR_CAMPAIGN_ID', // Placeholder retained from partnerHunter.ts
            skip_if_in_workspace: false, // For testing, maybe we want to allow duplicates or not? "skip_if_in_workspace"
            leads: [leadPayload]
        });

        log.instantlyStatus = instantlyRes.status;
        log.instantlyData = instantlyRes.data;
        log.steps.push("✅ Instantly Push Complete");

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

    } catch (error: any) {
        console.error("Test Flow Failed", error);
        res.status(500).json({
            error: error.message || "Internal Error",
            stack: error.stack,
            log
        });
    }
});
