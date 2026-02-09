# ADR 0009: AI Message Kit Generation with GPT-4o

**Status:** Accepted  
**Date:** 2026-02-02  
**Deciders:** Michel Korpershoek, Antigravity AI  
**Tags:** `ai`, `personalization`, `cold-email`, `gpt-4o`, `prompt-engineering`

---

## Context

Partner Growth Engine v4.0 requires **truly personalized cold emails** at scale (10-20 per week). Traditional approaches fail:

1. **Templates**: Generic, obvious automation → low response rates
2. **Manual writing**: Time-consuming, inconsistent quality
3. **Mail merge**: Superficial personalization (just first name)

**Requirements**:
- Unique content per lead (not templates)
- Segment-specific messaging (KDV vs School vs Pro)
- Consistent quality and tone
- PAS (Problem-Agitation-Solution) framework
- Max 130 words (attention span)
- Low-friction CTA
- Fast generation (<5 seconds per lead)

---

## Decision

Use **GPT-4o with JSON mode** to generate structured "Message Kits" containing all email components. Each kit is unique, contextually aware, and segment-optimized.

---

## Message Kit Structure

```typescript
interface MessageKit {
  subject_a: string;      // Primary subject (<60 chars)
  subject_b: string;      // Alternative (for A/B testing)
  opening: string;        // Personalized greeting
  body: string;           // Main content (max 130 words)
  ps: string;             // Personal touch
  cta_question: string;   // Low-friction open question
  angle: 'partnership' | 'value' | 'community';
}
```

### Component Breakdown

**subject_a/b**: Subject lines
- Max 60 characters
- Emoji allowed (🎁, 📚, ✨)
- Curiosity-driven, not salesy
- Example: `"Iets leuks voor de ouders? 🎁"`

**opening**: Personalized greeting
- Always includes company name
- Warm, professional tone
- Example: `"Beste team van Kindergarden Amsterdam,"`

**body**: Main email (PAS framework)
- **Problem**: Parent's bedtime struggle
- **Agitation**: Specific to segment
- **Solution**: Bedtijdavonturen value prop
- Max 130 words
- Natural, conversational Dutch

**ps**: Personal addition
- Humanizes email
- Offers bonus/alternative
- Example: `"P.S. Als je team het zelf eerst wilt testen, mail me dan."`

**cta_question**: Call-to-action
- Open-ended question
- Low commitment
- Not pushy
- Example: `"Lijkt dit jullie interessant?"`

**angle**: Strategic approach
- `partnership`: Mutual benefit, co-marketing
- `value`: Direct utility for their audience
- `community`: Local impact, shared mission

---

## Implementation

### Prompt Engineering

#### System Prompt
```
Je bent een B2B copywriter die emails schrijft voor Bedtijdavonturen.nl.

Doel: Partnerships met {segment} (kinderopvang/scholen/professionals).

Propositie: Schermvrije, AI-gegenereerde slaapverhalen die ouders helpen 
met het avondritueel.

Tone: Warm, professioneel, niet-opdringerig, Nederlands.
```

#### User Prompt Template
```
Genereer een gepersonaliseerde email voor:

Bedrijf: {business.name}
Rating: {business.rating}⭐ ({business.reviewCount} reviews)
Segment: {segment}
Locatie: {business.address}
Website facts: {enrichment.factPack}

Vereisten:
- Subject A: Max 60 tekens, nieuwsgierig makend
- Subject B: Alternatieve variant
- Opening: Persoonlijke begroeting met bedrijfsnaam
- Body: Max 130 woorden, Problem-Agitation-Solution, specifiek voor {segment}
- CTA Question: Open vraag, lage frictie
- PS: Persoonlijke toevoeging
- Angle: partnership, value, of community

Retourneer ALLEEN geldige JSON (geen markdown):
{
  "subject_a": "...",
  "subject_b": "...",
  "opening": "...",
  "body": "...",
  "ps": "...",
  "cta_question": "...",
  "angle": "partnership"
}
```

### Code Implementation

```typescript
async function generateMessageKit(
  business: Business,
  enrichment: EnrichmentData,
  segment: 'kdv_bso' | 'school' | 'pro',
  openaiKey: string
): Promise<MessageKit> {
  const openai = new OpenAI({ apiKey: openaiKey });

  const systemPrompt = `Je bent een B2B copywriter die emails schrijft voor Bedtijdavonturen.nl.
Doel: Partnerships met ${segment === 'kdv_bso' ? 'kinderopvang centra' : segment === 'school' ? 'scholen' : 'kindercoaches'}.
Propositie: Schermvrije, AI-gegenereerde slaapverhalen die ouders helpen met het avondritueel.
Tone: Warm, professioneel, niet-opdringerig.`;

  const userPrompt = `Genereer een gepersonaliseerde email voor:

Bedrijf: ${business.name}
Rating: ${business.rating}⭐ (${business.reviewCount} reviews)
Segment: ${segment}
Locatie: ${business.address}
Website facts: ${JSON.stringify(enrichment.factPack || {})}

Vereisten:
- Subject A: Max 60 tekens, nieuwsgierig makend
- Subject B: Alternatieve variant
- Opening: Persoonlijke begroeting met bedrijfsnaam
- Body: Max 130 woorden, Problem-Agitation-Solution, specifiek voor ${segment}
- CTA Question: Open vraag, lage frictie
- PS: Persoonlijke toevoeging
- Angle: partnership, value, of community

Retourneer ALLEEN geldige JSON (geen markdown):
{
  "subject_a": "...",
  "subject_b": "...",
  "opening": "...",
  "body": "...",
  "ps": "...",
  "cta_question": "...",
  "angle": "partnership"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8, // Creative but consistent
    max_tokens: 500
  });

  const jsonStr = completion.choices[0].message.content || '{}';
  const messageKit: MessageKit = JSON.parse(jsonStr);

  // Validate structure
  if (!messageKit.subject_a || !messageKit.body || !messageKit.cta_question) {
    throw new Error('Invalid message kit structure');
  }

  return messageKit;
}
```

---

## Segment-Specific Strategies

### KDV/BSO (Kinderopvang)

**Target Audience**: Directors, pedagogical staff  
**Pain Point**: Parent engagement, differentiation  
**Angle**: Partnership (exclusive offer for parents)

**Example**:
```
Subject: Iets leuks voor de ouders bij Happy Kids? 🎁

Opening: Beste team van Happy Kids Amsterdam,

Body: Ik zie dat jullie een fantastische reputatie hebben (4.8⭐!). 
Vast omdat jullie echt om de ouders geven.

Veel ouders worstelen met het avondritueel. Wij hebben met 
Bedtijdavonturen.nl iets ontwikkeld dat daarbij helpt: 
AI-gegenereerde slaapverhalen, schermvrij.

Ik wil jullie ouders graag 7 dagen gratis toegang geven. 
Geen creditcard nodig, gewoon als extraatje.

CTA: Mag ik een VIP-code aanmaken die je kunt delen?

PS: Als je team het zelf eerst wilt testen, mail me dan - 
ik regel accounts voor jullie.

Angle: partnership
```

### School (Basisschool)

**Target Audience**: Directors, teachers, parent councils  
**Pain Point**: Screen time concerns, literacy  
**Angle**: Value (educational tool)

**Example**:
```
Subject: Hulp bij het avondritueel voor jullie gezinnen? 📚

Opening: Beste directie van De Regenboog,

Body: Veel ouders van jullie leerlingen vragen zich af: hoe lees ik 
elke avond voor zonder dat mijn tablet erbij komt kijken?

Bedtijdavonturen.nl lost dat op. Gepersonaliseerde slaapverhalen, 
gegenereerd door AI, compleet schermvrij. Kinderen kunnen zelfs iets 
leren (geschiedenis, wetenschap, creativiteit).

We zien dat scholen dit aanbevelen in nieuwsbrieven. Mag ik jullie 
ouders een 7-daagse trial aanbieden?

CTA: Lijkt dit waardevol voor jullie community?

PS: We maken ook Sinterklaas- en Kerstverhalen. Perfect voor december!

Angle: value
```

### Pro (Professionals)

**Target Audience**: Kindercoaches, pedagogisch adviseurs  
**Pain Point**: Client retention, modern solutions  
**Angle**: Community (shared mission)

**Example**:
```
Subject: Tools voor jouw klanten met slaapproblemen? ✨

Opening: Beste {firstName},

Body: Als coach werk je met ouders die alles al geprobeerd hebben. 
Ze zijn moe. Kinderen slapen slecht.

Bedtijdavonturen.nl is een tool die ik je klanten kan aanraden: 
gepersonaliseerde verhalen, schermvrij, die het avondritueel rustiger 
maken. Het werkt omdat het ritueel + AI combineert.

Interesse om dit in je toolkit te hebben? Ik kan een referral-deal 
opzetten.

CTA: Zou dit voor jouw klanten interessant zijn?

PS: We zijn lokaal (NL), geen Amerikaanse big tech :)

Angle: community
```

---

## Quality Controls

### Post-Generation Validation

```typescript
function validateMessageKit(kit: MessageKit): boolean {
  // Subject length
  if (kit.subject_a.length > 60) return false;
  if (kit.subject_b.length > 60) return false;

  // Body word count
  const wordCount = kit.body.split(/\s+/).length;
  if (wordCount > 130) return false;

  // Required fields
  if (!kit.opening.includes(business.name)) return false;
  if (!kit.cta_question.includes('?')) return false;

  // Angle enum
  if (!['partnership', 'value', 'community'].includes(kit.angle)) {
    return false;
  }

  return true;
}
```

### Regeneration Logic

```typescript
let attempts = 0;
let messageKit;

while (attempts < 3) {
  messageKit = await generateMessageKit(...);
  if (validateMessageKit(messageKit)) break;
  attempts++;
  console.warn(`Regenerating message kit (attempt ${attempts})`);
}

if (attempts === 3) {
  throw new Error('Failed to generate valid message kit');
}
```

---

## Consequences

### Positive

✅ **True Personalization**: Each email is unique, context-aware  
✅ **Scalable Quality**: AI maintains consistent tone/structure  
✅ **Segment Optimization**: Different strategies per audience  
✅ **Fast Generation**: ~3-5 seconds per message kit  
✅ **A/B Testing Ready**: subject_a vs subject_b  
✅ **Data-Driven**: Capture angle/approach for analytics  
✅ **Low Maintenance**: No template management  

### Negative

⚠️ **API Cost**: ~$0.02 per message kit (GPT-4o)  
⚠️ **Non-Deterministic**: Same input ≠ same output  
⚠️ **Requires Validation**: AI can hallucinate or break schema  
⚠️ **Latency**: 3-5s per lead (vs instant templates)  
⚠️ **OpenAI Dependency**: Service downtime impacts pipeline  

### Mitigations

- **Cost**: Acceptable at 10-20 leads/week (~$0.40/week)
- **Non-Deterministic**: Temperature 0.8 balances creativity & consistency
- **Validation**: Automated checks + regeneration logic
- **Latency**: Parallel generation (bulk processing)
- **Dependency**: Retry logic, fallback to human-written templates

---

## Metrics & Optimization

### Track Performance

```typescript
await db.collection('leads').doc(leadId).update({
  'messageKit.generatedAt': admin.firestore.FieldValue.serverTimestamp(),
  'messageKit.model': 'gpt-4o',
  'messageKit.temperature': 0.8,
  'messageKit.angle': kit.angle,
  'messageKit.wordCount': kit.body.split(/\s+/).length
});
```

### Analyze Effectiveness

**Monthly Review**:
- Open rates by subject line style
- Reply rates by angle (partnership vs value vs community)
- Conversion by segment
- A/B test subject_a vs subject_b

**Refinements**:
- Adjust system prompt based on feedback
- Add/remove constraints (word count, emoji usage)
- Fine-tune temperature
- Consider GPT-4o fine-tuning on successful emails

---

## Future Enhancements

### V2: Reply Analysis

```typescript
// Classify replies
const replyAnalysis = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{
    role: "user",
    content: `Classify this reply: "${reply}"\n\nPositive/Negative/Neutral?`
  }]
});

// Feed back into prompt engineering
if (replyAnalysis === 'Positive') {
  successfulAngles[messageKit.angle]++;
}
```

### V3: Dynamic Prompts

```typescript
// Update system prompt based on conversion data
const systemPrompt = generateDynamicPrompt({
  segment,
  topPerformingAngles: ['partnership', 'community'],
  avgSuccessfulWordCount: 118,
  effectiveEmojis: ['🎁', '✨']
});
```

---

## References

- [OpenAI JSON Mode Documentation](https://platform.openai.com/docs/guides/structured-outputs)
- [Partner Engine v4.0](./0006-partner-growth-engine-v4.md)
- [Implementation Code](../../functions/src/marketing/partnerHunterV4.ts)

---

**Supersedes**: Template-based email generation  
**Related**: ADR 0006 (Architecture), ADR 0008 (FitScore)

---

**Last Updated:** 2026-02-02  
**Next Review:** After 50 production emails (Q1 2026)
