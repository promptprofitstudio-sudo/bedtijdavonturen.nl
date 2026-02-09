import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import axios from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

// Secrets
const dataForSeoLogin = defineSecret('DATAFORSEO_LOGIN');
const dataForSeoApiKey = defineSecret('DATAFORSEO_API_KEY');
const hunterApiKey = defineSecret('HUNTER_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const instantlyApiKey = defineSecret('INSTANTLY_API_KEY');
const kdvCampaignId = defineSecret('INSTANTLY_CAMPAIGN_KDV');
const schoolCampaignId = defineSecret('INSTANTLY_CAMPAIGN_SCHOOL');
const proCampaignId = defineSecret('INSTANTLY_CAMPAIGN_PRO');

interface FitScoreResult {
    score: number;
    reasons: string[];
}

interface EnrichmentData {
    email?: string;
    phone?: string;
    website: string;
    factPack?: Record<string, any>;
    source: 'hunter' | 'scraped' | 'form-only';
}

interface MessageKit {
    subjectA: string;
    subjectB: string;
    greeting: string;
    body: string;  // Now contains: opener + what is it + question (prescribed structure)
    cta: string;
    closing: string;
    optout: string;
    chosen_angle: 'avondritueel' | 'taal' | 'community';
}

/**
 * Test Partner Flow V4.0 - 6-Phase Pipeline
 * 
 * Usage: 
 * GET /testPartnerFlow?testEmail=your@email.com&city=Amsterdam&term=kinderdagverblijf
 */
export const testPartnerFlow = onRequest({
    secrets: [
        dataForSeoLogin,
        dataForSeoApiKey,
        hunterApiKey,
        openaiApiKey,
        instantlyApiKey,
        kdvCampaignId,
        schoolCampaignId,
        proCampaignId
    ],
    timeoutSeconds: 540,
    memory: "1GiB",
}, async (req, res) => {
    const testEmail = (req.query.testEmail as string) || 'michel@korpershoek-management.nl';
    const city = (req.query.city as string) || 'Amsterdam';
    const searchTerm = (req.query.term as string) || 'kinderdagverblijf';

    const term = `${searchTerm} ${city}`;
    const startTime = Date.now();
    const log: any = { phases: [] };

    console.log(`🧪 Testing Partner Growth Engine v4.0`);
    console.log(`  → Test Email: ${testEmail}`);
    console.log(`  → Search: ${term}`);

    try {
        // ===== PHASE 1: DISCOVER =====
        log.phases.push({ phase: 1, name: 'DISCOVER', status: 'starting' });
        console.log('\n📍 PHASE 1: DISCOVER (DataForSEO)');

        const searchRes = await axios.post('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', [{
            keyword: term,
            location_code: 2528,
            language_code: "nl",
            depth: 5 // Test with just 5 results
        }], {
            auth: {
                username: dataForSeoLogin.value(),
                password: dataForSeoApiKey.value()
            }
        });

        const items = searchRes.data?.tasks?.[0]?.result?.[0]?.items || [];
        const business = items[0]; // Test with first result only

        if (!business) {
            throw new Error('No businesses found');
        }

        const discovered = {
            name: business.title,
            rating: business.rating?.value || 0,
            reviewCount: business.reviews_count || 0,
            address: business.address || '',
            phone: business.phone || '',
            website: business.url || '',
            category: business.category || ''
        };

        log.phases[0].status = 'complete';
        log.phases[0].result = discovered;
        log.discovered = discovered;
        console.log(`  ✅ Found: ${discovered.name} (${discovered.rating}⭐)`);

        // ===== PHASE 2: VERIFY (FitScore) =====
        log.phases.push({ phase: 2, name: 'VERIFY', status: 'starting' });
        console.log('\n🎯 PHASE 2: VERIFY (FitScore Calculation)');

        const fitScore = calculateFitScore(discovered);
        log.phases[1].status = 'complete';
        log.phases[1].result = fitScore;
        log.fitScore = fitScore;

        console.log(`  📊 FitScore: ${fitScore.score}/100`);
        fitScore.reasons.forEach(r => console.log(`     - ${r}`));

        if (fitScore.score < 70) {
            log.phases[1].rejected = true;
            console.log(`  ❌ REJECTED: Score ${fitScore.score} < 70`);

            await saveTestRun(log, startTime, false, 'fit_score_rejected');

            res.status(200).json({
                success: false,
                reason: 'fit_score_rejected',
                fitScore,
                log
            });
            return;
        }

        console.log(`  ✅ PASSED: Score ${fitScore.score} >= 70`);

        // ===== PHASE 3: ENRICH =====
        log.phases.push({ phase: 3, name: 'ENRICH', status: 'starting' });
        console.log('\n🔍 PHASE 3: ENRICH (3-Rail Contact Discovery + Fact Pack)');

        const enrichment = await enrichLead(discovered, hunterApiKey.value());
        log.phases[2].status = 'complete';
        log.phases[2].result = enrichment;
        log.enrichment = enrichment;

        console.log(`  📧 Email: ${enrichment.email || 'NOT FOUND'} (via ${enrichment.source})`);
        console.log(`  📞 Phone: ${enrichment.phone || 'NOT FOUND'}`);
        console.log(`  📦 Fact Pack: ${Object.keys(enrichment.factPack || {}).length} facts`);

        if (!enrichment.email) {
            log.phases[2].warning = 'no_email_found';
            console.log(`  ⚠️  No email found - would skip in production`);
        }

        // ===== PHASE 4: PERSONALIZE (AI Message Kit) =====
        log.phases.push({ phase: 4, name: 'PERSONALIZE', status: 'starting' });
        console.log('\n🤖 PHASE 4: PERSONALIZE (GPT-4o Message Kit)');

        const segment = detectSegment(discovered.name, discovered.category);
        log.segment = segment;
        console.log(`  🏷️  Segment: ${segment}`);

        // GATE A: Determine contact type from email
        const contactType: 'personal' | 'role_based' | 'generic' | 'form_only' =
            !enrichment.email ? 'form_only'
                : enrichment.email.match(/^[a-z]+\.[a-z]+@/) ? 'personal'
                    : enrichment.email.match(/^(info|contact|hallo|admin|sales|support)@/) ? 'generic'
                        : 'role_based';

        // Extract first name ONLY if personal email
        const firstName = contactType === 'personal' && enrichment.email
            ? enrichment.email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ')
            : null;

        console.log(`  👤 Contact type: ${contactType}`);
        if (firstName) console.log(`  📛 First name: ${firstName}`);

        // GATE B: Extract LOW-INFERENCE facts with evidence types (V7)
        // Priority: parents keyword > concrete > social media > rating
        interface Fact {
            label: string;
            evidence: 'keyword_hit' | 'link_present' | 'google_maps' | 'data_point';
            priority: number;
        }

        const factsWithEvidence: Fact[] = [];

        // Priority 1: Parents keyword (strongest signal - direct audience match)
        if (enrichment.factPack?.mentionedKeywords?.parents) {
            factsWithEvidence.push({
                label: 'Op de website wordt "ouders" genoemd',
                evidence: 'keyword_hit',
                priority: 1
            });
        }

        // Priority 2: Education keyword (segment-relevant)
        if (enrichment.factPack?.mentionedKeywords?.education) {
            factsWithEvidence.push({
                label: 'Op de website wordt ontwikkeling/educatie genoemd',
                evidence: 'keyword_hit',
                priority: 2
            });
        }

        // Priority 3: Social media (only state what we see, not activity level)
        if (enrichment.factPack?.hasSocialMedia) {
            factsWithEvidence.push({
                label: 'Er staan social media links op de website',
                evidence: 'link_present',
                priority: 3
            });
        }

        // Priority 4: Rating (use as supporting fact only)
        if (discovered.rating && discovered.rating >= 4.0) {
            factsWithEvidence.push({
                label: `Google rating: ${discovered.rating}⭐`,
                evidence: 'google_maps',
                priority: 4
            });
        }

        // Priority 5: Review count (only if substantial)
        if (discovered.reviewCount > 10) {
            factsWithEvidence.push({
                label: `${discovered.reviewCount} Google reviews`,
                evidence: 'google_maps',
                priority: 5
            });
        }

        // Sort by priority and take top 3 (max)
        const sortedFacts = factsWithEvidence.sort((a, b) => a.priority - b.priority);
        const topFacts = sortedFacts.slice(0, 3);
        const hasFacts = topFacts.length > 0;

        // Format for prompt (include evidence type for GPT safety)
        const factsForPrompt = topFacts.map(f => `${f.label} (bron: ${f.evidence})`);

        console.log(`  📊 Facts available: ${topFacts.length}`);
        if (hasFacts) {
            topFacts.forEach(f => console.log(`     → [P${f.priority}] ${f.label} (${f.evidence})`));
        }


        // Determine offer type based on segment
        const offerType = segment === 'kdv_bso'
            ? 'voorbeeldverhalen'
            : segment === 'school'
                ? 'ouderflyer'
                : 'pilot';

        // CTA type based on contact type
        const ctaType = contactType === 'personal' ? 'examples' : 'forward';

        console.log(`  🎁 Offer type: ${offerType}`);
        console.log(`  🎯 CTA type: ${ctaType}`);

        const messageKit = await generateMessageKit(
            discovered,
            enrichment,
            segment,
            contactType,
            firstName,
            factsForPrompt,  // V7: Pass formatted facts with evidence types
            offerType,
            ctaType,
            openaiApiKey.value()
        );


        log.phases[3].status = 'complete';
        log.phases[3].result = messageKit;
        log.messageKit = messageKit;

        console.log(`  ✅ Generated Message Kit:`);
        console.log(`     Subject: ${messageKit.subjectA.substring(0, 50)}...`);
        console.log(`     Greeting: ${messageKit.greeting}`);
        console.log(`     Angle: ${messageKit.chosen_angle}`);
        console.log(`     Opt-out: ${messageKit.optout ? 'YES' : 'NO'}`);

        // ===== PHASE 5: SEQUENCE (Instantly) =====
        log.phases.push({ phase: 5, name: 'SEQUENCE', status: 'starting' });
        console.log('\n📨 PHASE 5: SEQUENCE (Instantly.ai)');

        // Route to correct campaign based on segment
        let campaignId: string;
        switch (segment) {
            case 'kdv_bso':
                campaignId = kdvCampaignId.value();
                break;
            case 'school':
                campaignId = schoolCampaignId.value();
                break;
            case 'pro':
                campaignId = proCampaignId.value();
                break;
            default:
                campaignId = kdvCampaignId.value();
        }

        console.log(`  🎯 Routing to: ${segment.toUpperCase()} campaign (${campaignId.substring(0, 8)}...)`);

        const leadPayload = {
            email: testEmail, // TEST OVERRIDE
            first_name: firstName || 'Team',
            last_name: business.name,
            company_name: discovered.name,
            website: discovered.website,
            custom_variables: {
                // V6 Granular Email Components (opening merged into body)
                subject_a: messageKit.subjectA,        // For Instantly template compatibility
                subject_b: messageKit.subjectB,
                subjectA: messageKit.subjectA,          // New naming
                subjectB: messageKit.subjectB,
                greeting: messageKit.greeting,
                body: messageKit.body,  // V6: Contains opener + product + question + cta
                cta: messageKit.cta,
                closing: messageKit.closing,
                optout: messageKit.optout,

                // Metadata
                chosen_angle: messageKit.chosen_angle,
                contact_type: contactType,
                offer_type: offerType,
                has_facts: hasFacts.toString(),
                facts_count: topFacts.length.toString(),

                // Context
                city: city,
                rating: discovered.rating?.toString() || 'N/A',

                // Tracking
                original_email: enrichment.email || 'none',
                fit_score: fitScore.score.toString(),
                test_run: 'true',
                version: 'v6.0'
            }
        };


        const instantlyRes = await axios.post('https://api.instantly.ai/api/v2/leads', {
            campaign: campaignId,
            skip_if_in_workspace: false,
            leads: [leadPayload]
        }, {
            headers: {
                'Authorization': `Bearer ${instantlyApiKey.value()}`,
                'Content-Type': 'application/json'
            }
        });

        log.phases[4].status = 'complete';
        log.phases[4].result = {
            status: instantlyRes.status,
            data: instantlyRes.data,
            campaign: segment
        };

        console.log(`  ✅ Pushed to Instantly (${instantlyRes.status})`);

        // ===== PHASE 6: LEARN (Firestore) =====
        log.phases.push({ phase: 6, name: 'LEARN', status: 'starting' });
        console.log('\n💾 PHASE 6: LEARN (Firestore Storage)');

        await saveTestRun(log, startTime, true, 'complete');

        log.phases[5].status = 'complete';
        console.log(`  ✅ Saved to Firestore`);

        // ===== RESPONSE =====
        const duration = Date.now() - startTime;
        console.log(`\n✅ Test Complete in ${(duration / 1000).toFixed(1)}s`);

        res.status(200).json({
            success: true,
            summary: {
                business: discovered.name,
                fitScore: fitScore.score,
                segment,
                emailFound: !!enrichment.email,
                emailSource: enrichment.source,
                sentTo: testEmail,
                campaign: segment,
                duration: `${(duration / 1000).toFixed(1)}s`
            },
            details: {
                discovered,
                fitScore,
                enrichment,
                messageKit,
                instantly: log.phases[4].result
            },
            phases: log.phases
        });

    } catch (err: any) {
        console.error('❌ Test failed:', err.message);

        if (err.response) {
            console.error('API Error:', {
                status: err.response.status,
                data: err.response.data
            });
        }

        await saveTestRun(log, startTime, false, err.message);

        res.status(500).json({
            error: err.message,
            stack: err.stack,
            log
        });
    }
});

/**
 * Calculate FitScore (0-100)
 */
function calculateFitScore(business: any): FitScoreResult {
    let score = 0;
    const reasons: string[] = [];

    // Rating (30 points)
    if (business.rating >= 4.5) {
        score += 30;
        reasons.push(`+30: Excellent rating (${business.rating}⭐)`);
    } else if (business.rating >= 4.0) {
        score += 20;
        reasons.push(`+20: Good rating (${business.rating}⭐)`);
    } else if (business.rating >= 3.5) {
        score += 10;
        reasons.push(`+10: Decent rating (${business.rating}⭐)`);
    } else {
        reasons.push(`+0: Low rating (${business.rating}⭐)`);
    }

    // Review count (20 points)
    if (business.reviewCount >= 50) {
        score += 20;
        reasons.push(`+20: Many reviews (${business.reviewCount})`);
    } else if (business.reviewCount >= 20) {
        score += 15;
        reasons.push(`+15: Good review count (${business.reviewCount})`);
    } else if (business.reviewCount >= 10) {
        score += 10;
        reasons.push(`+10: Some reviews (${business.reviewCount})`);
    } else {
        score += 5;
        reasons.push(`+5: Few reviews (${business.reviewCount})`);
    }

    // Has website (25 points)
    if (business.website && business.website.length > 10) {
        score += 25;
        reasons.push(`+25: Has website`);
    } else {
        reasons.push(`+0: No website`);
    }

    // Has phone (15 points)
    if (business.phone) {
        score += 15;
        reasons.push(`+15: Has phone number`);
    } else {
        reasons.push(`+0: No phone number`);
    }

    // Location quality (10 points) - has address
    if (business.address && business.address.length > 10) {
        score += 10;
        reasons.push(`+10: Has full address`);
    } else {
        score += 5;
        reasons.push(`+5: Partial address`);
    }

    return { score, reasons };
}

/**
 * Detect business segment
 */
function detectSegment(name: string, category: string): 'kdv_bso' | 'school' | 'pro' {
    const text = `${name} ${category}`.toLowerCase();

    if (text.includes('school') || text.includes('basisschool')) {
        return 'school';
    }

    if (text.includes('kinderopvang') || text.includes('kinderdagverblijf') ||
        text.includes('bso') || text.includes('opvang') || text.includes('kdv')) {
        return 'kdv_bso';
    }

    return 'pro'; // Default: professionals
}

/**
 * 3-Rail Contact Discovery + Fact Pack Extraction
 */
async function enrichLead(business: any, hunterKey: string): Promise<EnrichmentData> {
    const result: EnrichmentData = {
        website: business.website,
        phone: business.phone,
        source: 'form-only'
    };

    if (!business.website) {
        return result;
    }

    try {
        // Extract domain
        const domain = new URL(business.website).hostname.replace('www.', '');

        // RAIL 1: Hunter.io
        try {
            const hunterRes = await axios.get(
                `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}&type=personal`
            );
            const emails = hunterRes.data?.data?.emails || [];
            const emailObj = emails.find((e: any) => e.type === 'personal') || emails[0];

            if (emailObj) {
                result.email = emailObj.value;
                result.source = 'hunter';
                console.log(`    ✅ Rail 1 (Hunter): ${emailObj.value}`);
            }
        } catch (e: any) {
            console.log(`    ⚠️  Rail 1 (Hunter) failed: ${e.message}`);
        }

        // RAIL 2: Website Scraping (if Hunter failed)
        if (!result.email) {
            try {
                const pageRes = await axios.get(business.website, {
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const $ = cheerio.load(pageRes.data);

                // Find mailto: links
                const mailtoLinks = $('a[href^="mailto:"]');
                if (mailtoLinks.length > 0) {
                    const email = mailtoLinks.first().attr('href')?.replace('mailto:', '');
                    if (email && email.includes('@')) {
                        result.email = email;
                        result.source = 'scraped';
                        console.log(`    ✅ Rail 2 (Scraping): ${email}`);
                    }
                }

                // Extract fact pack
                const text = $('body').text();
                result.factPack = {
                    hasContactForm: $('form').length > 0,
                    hasSocialMedia: !!($('a[href*="facebook"]').length || $('a[href*="instagram"]').length),
                    mentionedKeywords: {
                        parents: text.toLowerCase().includes('ouder'),
                        children: text.toLowerCase().includes('kind'),
                        education: text.toLowerCase().includes('onderwijs') || text.toLowerCase().includes('leren')
                    }
                };

            } catch (e: any) {
                console.log(`    ⚠️  Rail 2 (Scraping) failed: ${e.message}`);
            }
        }

        // RAIL 3: Form-only fallback (already set as default)
        if (!result.email) {
            console.log(`    ⚠️  Rail 3: Form-only (no email found)`);
        }

    } catch (e: any) {
        console.log(`    ❌ Enrichment error: ${e.message}`);
    }

    return result;
}

/**
 * Generate AI Message Kit with GPT-4o (V10 FINAL - Production Ready)
 */
async function generateMessageKit(
    business: any,
    enrichment: EnrichmentData,
    segment: string,
    contactType: 'personal' | 'role_based' | 'generic' | 'form_only',
    firstName: string | null,
    factsWithEvidence: string[],  // V7: Facts with evidence type labels
    offerType: string,
    ctaType: string,
    openaiKey: string
): Promise<MessageKit> {
    const openai = new OpenAI({ apiKey: openaiKey });

    // V8: Extract clean org name (before comma or full name)
    const cleanOrgName = business.name.split(',')[0].trim();

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
- When using facts, acknowledge the source:
  → For keyword_hit: "Op de website wordt X genoemd" or "Ik zag dat jullie X noemen"
  → For link_present: "Er staan X links op de website"
  → For google_maps: Can state directly "Google rating: X⭐" (factual data point)

FORBIDDEN WORDS
Never mention: AI, artificial intelligence, generated, automation, tool, model, algorithm, magic, revolutionary, solution, gamechanger, screenfree, schermvrij.

HUMAN POLISH RULES (V9 - CRITICAL)
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

    const city = business.address?.split(',').pop()?.trim() || 'Nederland';
    const factsString = factsWithEvidence.length > 0
        ? factsWithEvidence.join(' | ')
        : 'geen facts beschikbaar';

    const userPrompt = `Create email #1 for partner outreach.

INPUT
- segment: ${segment}
- org_name: ${cleanOrgName}  ← USE THIS EXACT NAME, NO ADDITIONS
- city: ${city}
- contact_type: ${contactType}
- first_name: ${firstName || '(none)'}
- preferred_cta: ${ctaType}
- offer_type: ${offerType}

FACTS (use 1-2 max, keep phrasing low-inference, skip if only weak facts):
${factsString}

REMINDERS
- 60-90 words total (body + cta only, excluding closing/optout) - SHORTER IS BETTER
- Greeting: ONLY "Beste team van ${cleanOrgName}," – NO extra descriptors
- Location: City ONLY (${city}), NO postcode or street address
- Facts: If only "social media links" or "rating" available, skip them. Use neutral opener.
- Language: Natural, conversational. NOT "ouderbetrokkenheid" → USE "hoe jullie ouders ondersteunen"
- Value prop: MUST be parent-centric ("ouders kunnen voorlezen als vast avondritueel—rustige, leuke afsluiting")
- Question: Use template "Delen jullie weleens tips of materiaal met ouders voor het laatste stukje van de dag?"
- CTA: ${contactType === 'personal' ? 'Single (examples only)' : 'Dual (examples + routing)'}
- Optout: REQUIRED in JSON output
- Keep it TIGHT. Remove filler words.
- Formatting: EXACTLY 2 blank lines (3 paragraphs total), max 2-3 sentences per paragraph.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
    });

    const jsonStr = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(jsonStr);

    // V8: Validate optout presence
    if (!parsed.optout || parsed.optout.trim() === '') {
        console.warn('⚠️  Missing optout in GPT response, adding default');
        parsed.optout = 'Geen interesse? Laat het weten, dan stop ik.';
    }

    return parsed;
}

/**
 * Save test run to Firestore
 */
async function saveTestRun(log: any, startTime: number, success: boolean, status: string) {
    const db = admin.firestore();
    await db.collection('partner_test_runs').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        version: 'v4.0',
        success,
        status,
        duration: Date.now() - startTime,
        discovered: log.discovered || null,
        fitScore: log.fitScore || null,
        enrichment: log.enrichment || null,
        messageKit: log.messageKit || null,
        segment: log.segment || null,
        phases: log.phases || []
    });
}
