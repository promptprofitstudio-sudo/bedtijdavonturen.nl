#!/usr/bin/env tsx
/**
 * Instantly.ai Campaign Automation Script
 * 
 * Purpose: Automatically create Partner Growth email campaigns
 * Usage: tsx scripts/create-instantly-campaign.ts
 */

import axios from 'axios';

// API Key from GSM (passed via environment or directly)
const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY || 'NWY2ZDUxMDItZjEwMS00MGVkLTk4ZTItZGU4N2Q1NjhkNTUyOmZSS1JhR3dEeVZaZQ==';

interface CampaignConfig {
    name: string;
    campaign_schedule: {
        schedules: Array<{
            name: string;
            timing: {
                from: string;
                to: string;
            };
            days: Record<string, boolean>;
            timezone: string;
        }>;
        start_date?: string;
        end_date?: string;
    };
    sequences: Array<{
        email_gap?: number;
        random_wait_max?: number;
        text_only?: boolean;
        first_email_text_only?: boolean;
        email_list: string[];
        daily_limit?: number;
        stop_on_reply?: boolean;
        steps: Array<{
            type: 'email';
            delay: number; // Days
            variants: Array<{
                subject: string;
                body: string;
            }>;
        }>;
    }>;
}

async function createCampaign(config: CampaignConfig) {
    try {
        console.log(`📧 Creating campaign: ${config.name}`);

        const response = await axios.post(
            'https://api.instantly.ai/api/v2/campaigns',
            config,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${INSTANTLY_API_KEY}`
                }
            }
        );

        console.log(`✅ Campaign created successfully!`);
        console.log(`📋 Campaign ID: ${response.data.id}`);
        console.log(`🔗 Full Response:`, JSON.stringify(response.data, null, 2));

        return response.data;
    } catch (error: any) {
        console.error(`❌ Failed to create campaign: ${config.name}`);
        console.error(`Error:`, error.response?.data || error.message);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting Instantly.ai Campaign Automation\n');

    // Email 1: Het Cadeautje 🎁 (Day 0)
    const email1Subject = "Iets leuks voor de ouders bij {{companyName}}? 🎁";
    const email1Body = `Hoi {{firstName}},

{{icebreaker}}

Ik weet dat veel ouders die bij jullie komen, worstelen met het avondritueel (of het gebrek daaraan 😉).

Wij hebben met **Bedtijdavonturen.nl** iets ontwikkeld dat daarbij helpt: schermvrije, gepersonaliseerde slaapverhalen. De AI leest ze voor met een rustige stem, zodat ouders even hun handen vrij hebben.

Ik wil jullie cliënten graag **7 dagen gratis toegang** tot het Familie Abonnement geven (normaal betaald). Geen addertjes, geen creditcard nodig, gewoon een week rust.

Mag ik een **VIP-code** voor jullie aanmaken (bijv. \`{{companyName}}-VIP\`) die je in je nieuwsbrief of tijdens gesprekken kunt delen?

Lijkt me leuk om de ouders bij {{companyName}} hiermee te verrassen.

Warme groet,
Michel
*Bedtijdavonturen.nl*`;

    // Email 2: De Follow-up (Value) 🌙 (Day 3)
    const email2Subject = "Geen druk!";
    const email2Body = `Hoi {{firstName}},

Geen druk hoor! Ik dacht alleen: in deze drukke tijden is een stukje rust voor ouders goud waard.

We zien dat kinderen door het luisteren naar een rustig verhaal (zonder blauw licht) sneller melatonine aanmaken dan bij filmpjes. Misschien een leuk inzicht om te delen?

Als je het eerst zelf even wilt testen (zonder account aan te maken), klik dan hier om een verhaaltje te maken: https://bedtijdavonturen.nl

Fijne week!
Michel`;

    // Email 3: The Break-up (Day 7)
    const email3Subject = "Succes met {{companyName}}";
    const email3Body = `Hoi {{firstName}},

Ik ga ervan uit dat je het razend druk hebt (goed teken!).

Ik haal je van mijn lijstje. Mocht je in de toekomst toch een tool zoeken om ouders te ondersteunen bij het bedtijdritueel, je weet ons te vinden.

Veel succes met de zaak!

Michel`;

    const campaignConfig: CampaignConfig = {
        name: "Bedtijdavonturen Partner Outreach (Automated)",
        campaign_schedule: {
            schedules: [
                {
                    name: "Business Hours (NL)",
                    timing: {
                        from: "09:00",
                        to: "17:00"
                    },
                    days: {
                        "0": false, // Sunday
                        "1": true,  // Monday
                        "2": true,  // Tuesday
                        "3": true,  // Wednesday
                        "4": true,  // Thursday
                        "5": true,  // Friday
                        "6": false  // Saturday
                    },
                    timezone: "UTC" // Using UTC (will adjust schedule to 08:00-16:00 UTC for 09:00-17:00 CET)
                }
            ]
        },
        sequences: [
            {
                email_gap: 30, // 30 minutes between sends
                random_wait_max: 60, // Random delay up to 1 hour
                text_only: false,
                first_email_text_only: false,
                email_list: [], // Will be populated with your sending accounts
                daily_limit: 50, // Conservative limit
                stop_on_reply: true,
                steps: [
                    {
                        type: 'email',
                        delay: 0, // Immediate (Day 0)
                        variants: [
                            {
                                subject: email1Subject,
                                body: email1Body
                            }
                        ]
                    },
                    {
                        type: 'email',
                        delay: 3, // Day 3
                        variants: [
                            {
                                subject: email2Subject,
                                body: email2Body
                            }
                        ]
                    },
                    {
                        type: 'email',
                        delay: 7, // Day 7 (4 days after email 2)
                        variants: [
                            {
                                subject: email3Subject,
                                body: email3Body
                            }
                        ]
                    }
                ]
            }
        ]
    };

    try {
        const result = await createCampaign(campaignConfig);

        console.log('\n🎉 SUCCESS! Campaign created.');
        console.log('\n📝 Next Steps:');
        console.log(`1. Save this Campaign ID: ${result.id}`);
        console.log(`2. Add to Google Secret Manager:`);
        console.log(`   echo -n "${result.id}" | gcloud secrets create INSTANTLY_CAMPAIGN_ID --data-file=- --project=bedtijdavonturen-prod`);
        console.log('3. Update functions to use the campaign ID');
        console.log('4. Configure your sending email accounts in Instantly dashboard');

    } catch (error) {
        console.error('\n💥 Campaign creation failed. See errors above.');
        process.exit(1);
    }
}

main();
