# ADR 0008: FitScore Quality Gate

**Status:** Accepted  
**Date:** 2026-02-02  
**Deciders:** Michel Korpershoek, Antigravity AI  
**Tags:** `quality-gate`, `lead-scoring`, `automation`, `roi`

---

## Context

Partner Growth Engine v4.0 discovers 20-40 businesses per run via DataForSEO. Not all businesses are worth contacting:
- Some have poor ratings (<3.5 stars)
- Some lack contact information
- Some have minimal online presence
- Some are too small/unstable

Sending cold emails to **low-quality leads** has negative consequences:
- Wastes API credits (Hunter.io, OpenAI)
- Damages sender reputation (spam complaints)
- Low ROI (time spent on unqualified leads)
- Dilutes analytics (noise in conversion metrics)

**We need an objective, automated quality gate** to filter leads before enrichment.

---

## Decision

Implement a **FitScore algorithm** (0-100) that evaluates business quality based on publicly available data. Only leads scoring **70 or higher** proceed to enrichment.

---

## FitScore Algorithm

### Scoring Matrix

| Factor | Max Points | Criteria |
|--------|------------|----------|
| **Rating** | 30 | Google Maps star rating |
| **Review Count** | 20 | Number of customer reviews |
| **Website** | 25 | Has functional website URL |
| **Phone Number** | 15 | Has listed phone number |
| **Address** | 10 | Has complete street address |
| **TOTAL** | **100** | Sum of all factors |

### Detailed Breakdown

#### 1. Rating (30 points)
```typescript
if (rating >= 4.5) score += 30;      // Excellent
else if (rating >= 4.0) score += 20; // Good
else if (rating >= 3.5) score += 10; // Acceptable
else score += 0;                      // Poor
```

**Rationale**: High ratings indicate established, customer-approved businesses that are more likely to be professional partners.

#### 2. Review Count (20 points)
```typescript
if (reviewCount >= 50) score += 20;  // Many
else if (reviewCount >= 20) score += 15; // Good
else if (reviewCount >= 10) score += 10; // Some
else score += 5;                          // Few
```

**Rationale**: More reviews = more established presence, lower risk of business instability.

#### 3. Website (25 points)
```typescript
if (website && website.length > 10) score += 25;
else score += 0;
```

**Rationale**: 
- Website is **required** for enrichment (Hunter.io needs domain)
- Indicates professionalism and digital presence
- Enables fact pack extraction

#### 4. Phone Number (15 points)
```typescript
if (phone) score += 15;
else score += 0;
```

**Rationale**: Listed phone = easier to reach, more transparent business.

#### 5. Address (10 points)
```typescript
if (address && address.length > 10) score += 10; // Full
else score += 5;                                   // Partial
```

**Rationale**: Complete address = legitimate physical location.

---

## Threshold Justification

### Why 70?

**Score Distribution Analysis** (estimated):

```
Score Range | Businesses | Pass Rate
------------|-----------|----------
90-100      | 10-15%    | ✅ Elite
80-89       | 20-25%    | ✅ High
70-79       | 25-30%    | ✅ Good (threshold)
60-69       | 20-25%    | ❌ Medium
50-59       | 15-20%    | ❌ Low
< 50        | 5-10%     | ❌ Very Low
```

**Expected Pass Rate**: 55-70% of discovered leads

**Why not higher (e.g., 80)?**
- Would reject too many viable partners
- 70-79 businesses are still professional and reachable

**Why not lower (e.g., 60)?**
- Increased API costs for marginal quality
- Higher spam risk
- Lower conversion potential

---

## Implementation

### Code Example

```typescript
interface FitScoreResult {
  score: number;
  reasons: string[];
}

function calculateFitScore(business: {
  rating: number;
  reviewCount: number;
  website: string;
  phone: string;
  address: string;
}): FitScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // Rating (30 pts)
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

  // Review Count (20 pts)
  if (business.reviewCount >= 50) {
    score += 20;
    reasons.push(`+20: Many reviews (${business.reviewCount})`);
  } else if (business.reviewCount >= 20) {
    score += 15;
    reasons.push(`+15: Good reviews (${business.reviewCount})`);
  } else if (business.reviewCount >= 10) {
    score += 10;
    reasons.push(`+10: Some reviews (${business.reviewCount})`);
  } else {
    score += 5;
    reasons.push(`+5: Few reviews (${business.reviewCount})`);
  }

  // Website (25 pts)
  if (business.website && business.website.length > 10) {
    score += 25;
    reasons.push(`+25: Has website`);
  } else {
    reasons.push(`+0: No website`);
  }

  // Phone (15 pts)
  if (business.phone) {
    score += 15;
    reasons.push(`+15: Has phone`);
  } else {
    reasons.push(`+0: No phone`);
  }

  // Address (10 pts)
  if (business.address && business.address.length > 10) {
    score += 10;
    reasons.push(`+10: Full address`);
  } else {
    score += 5;
    reasons.push(`+5: Partial address`);
  }

  return { score, reasons };
}

// Usage in pipeline
const fitScore = calculateFitScore(business);
if (fitScore.score < 70) {
  console.log(`❌ REJECTED: ${business.name} (Score: ${fitScore.score})`);
  await saveRejectedLead(business, fitScore);
  continue; // Skip to next lead
}

console.log(`✅ PASSED: ${business.name} (Score: ${fitScore.score})`);
```

---

## Consequences

### Positive

✅ **ROI Protection**: API credits spent only on qualified leads  
✅ **Deliverability**: Lower spam complaints from high-quality targets  
✅ **Analytics Clarity**: Clean conversion funnel (no noise from bad leads)  
✅ **Transparent**: Score breakdown explains rejection reasons  
✅ **Deterministic**: Same business = same score (reproducible)  
✅ **Early Filtering**: Stop pipeline at Phase 2 (before expensive enrichment)  

### Negative

⚠️ **False Negatives**: Some good prospects might score 65-69  
⚠️ **Static Weights**: Doesn't learn from actual conversion data  
⚠️ **Limited Factors**: Only public data (no financial/employee data)  

### Mitigations

- **False Negatives**: Log 60-69 scores for manual review
- **Static Weights**: Version 2 will use ML-based scoring with feedback loop
- **Limited Factors**: Sufficient for B2B parental services (our niche)

---

## Example Scenarios

### Scenario 1: Elite Daycare (Score: 95)
```
Business: Happy Kids Amsterdam
Rating: 4.8⭐ (82 reviews)
Website: https://happykids.nl
Phone: +31 20 123 4567
Address: Hoofdstraat 45, 1011 AB Amsterdam

FitScore Breakdown:
+30: Excellent rating (4.8⭐)
+20: Many reviews (82)
+25: Has website
+15: Has phone
+10: Full address
= 100 ✅ PASS
```

### Scenario 2: Small Startup (Score: 55)
```
Business: TinyTots Opvang
Rating: 4.2⭐ (7 reviews)
Website: (none)
Phone: (none)
Address: Amsterdam (partial)

FitScore Breakdown:
+20: Good rating (4.2⭐)
+5: Few reviews (7)
+0: No website
+0: No phone
+5: Partial address
= 30 ❌ REJECT
```

### Scenario 3: Borderline School (Score: 70)
```
Business: De Regenboog Basisschool
Rating: 4.1⭐ (15 reviews)
Website: https://regenboog.nl
Phone: +31 30 555 1234
Address: (none listed)

FitScore Breakdown:
+20: Good rating (4.1⭐)
+10: Some reviews (15)
+25: Has website
+15: Has phone
+5: Partial address
= 75 ✅ PASS (threshold met)
```

---

## Monitoring & Refinement

### Metrics to Track

```typescript
// Save in Firestore
await db.collection('partner_runs').add({
  fitScoreDistribution: {
    '90-100': 12,
    '80-89': 18,
    '70-79': 15, // Threshold zone
    '60-69': 8,  // Review for false negatives
    '<60': 4
  },
  passRate: 0.67, // 45 passed / 67 discovered
  avgPassingScore: 82,
  avgRejectedScore: 58
});
```

### Review Process

**Weekly**:
- Review 60-69 scoreblogs for good prospects
- Adjust threshold if pass rate < 50% or > 80%

**Monthly**:
- Correlate FitScore with actual responses/conversions
- Identify prediction errors
- Refine weights (e.g., increase website importance to 30pts)

---

## Future Enhancements

### V2: Machine Learning Scoring

```typescript
// ML model trained on conversion data
const fitScore = await mlModel.predict({
  rating, reviews, hasWebsite, hasPhone, hasAddress,
  // New features:
  websiteLoadTime, socialMediaPresence, 
  businessAge, employeeCount, brandSentiment
});

if (fitScore.probability > 0.7) { // 70% conversion likelihood
  proceed();
}
```

### V3: Dynamic Thresholds

```typescript
// Adjust threshold based on weekly quota
const threshold = calculateDynamicThreshold({
  targetLeadsPerWeek: 50,
  currentPassRate: 0.65,
  apiCreditBudget: 100
});
```

---

## References

- [Partner Growth Engine v4.0](./0006-partner-growth-engine-v4.md)
- [Implementation Code](../../functions/src/marketing/partnerHunterV4.ts)
- [Test Function](../../functions/src/marketing/testFlow.ts)

---

**Supersedes**: None (new feature)  
**Related**: ADR 0006 (Partner Engine Architecture)

---

**Last Updated:** 2026-02-02  
**Next Review:** After 100 production leads (Q1 2026)
