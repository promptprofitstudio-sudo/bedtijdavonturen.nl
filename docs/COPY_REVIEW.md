# Copy & UX Review: Landing Page & Wizard

## 1. 🚨 Critical Observation: The "Void" Input
In the Wizard (Step 3), you ask:
> **"Vandaag gebeurde..."** (Bijv. eerste schooldag)

**Observation:**
Looking at the code (`src/app/wizard/page.tsx`), this input `contextInput` is captured in React state, but **it is never sent to the Server Action**.
```typescript
// src/app/wizard/page.tsx:87
// contextInput is ignored for now. Correct.
```
**Impact:** Parents think they are customizing the story with their child's day, but the AI never sees this text. This leads to disappointment when the story ignores their input.

**Recommendation:**
**IMMEDIATELY FIX.** Pass `context` to the `generateStoryAction` and include it in the OpenAI prompt.

## 2. Landing Page (`/`)
### Positive
- **Hero:** "Vanavond een verhaal in 60 sec" is punchy and excellent.
- **Tone:** "Rustig • Persoonlijk" sets the right expectation.

### Improvements
- **"Bedtijd-safe":** A bit "Dunglish".
    - *Better:* "100% Kindvriendelijk" or "Veilig voor bedtijd".
- **"Serie-universum" (Button):**
    - The text claims "Terugkerende vriendjes", but the button just says "Start een serie". Does this actually link to a series logic? Currently it seems static or links to wizard?
    - *Action:* If the backend logic for "Memory/Series" isn't built, hide this section to avoid overpromising.

## 3. Wizard Page (`/wizard`)
### Positive
- **Microcopy:** "Bedtijd = liever rustig. Wij houden het veilig." (Step 2) is very reassuring for parents.
- **Progress:** The dots and "Stap X/4" are clear.

### Improvements
- **Step 4 (Summary):**
    - "Je kind & het avontuur" is generic.
    - *Better:* Use the actual name dynamically (e.g., "Noor's Avontuur in de Ruimte"). (Note: Code does try to use `childName`, good).
- **Loading State:**
    - "Avontuur schrijven..." is okay.
    - *Better:* "De magie wordt gestart..." or "Noor's verhaal wordt geschreven..." (Perfceives shorter wait).

## 4. Summary of Recommendations
1.  **FIX:** Wiring of `contextInput` in Wizard. (High Priority).
2.  **REPHRASE:** "Bedtijd-safe" -> "Veilig".
3.  **REMOVE/FIX:** "Serie-universum" section if not functional.
