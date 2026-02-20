# Form Validation UX Improvements Audit (A-006)
**Date:** 2026-02-19  
**Sprint:** 2  
**Phase:** 1 - Audit (COMPLETE)

---

## PHASE 1: AUDIT FINDINGS

### Forms Identified

#### 1. **EmailLoginForm** (`src/components/EmailLoginForm.tsx`)
**Purpose:** Email login/signup  
**Fields:**
- Name (register only)
- Email (text)
- Password (password)

**Current Validation:**
- ❌ NO inline validation on blur
- ❌ NO field-level error states
- ✅ Basic required validation on submit
- ✅ Generic error message display ("Er ging iets mis")
- ❌ NO success indicators
- ❌ NO focus management
- ❌ NO ARIA error announcements

**Issues:**
- Users don't know if email format is valid until submit
- Password requirements unclear (min 6 chars mentioned in placeholder, not validated)
- No visual feedback during validation
- Toggle button styling doesn't meet 48px target (V-006 accessibility fix needed)

---

#### 2. **AddProfileForm** (`src/components/AddProfileForm.tsx`)
**Purpose:** Create/edit child profile  
**Fields:**
- Name (text)
- Age Group (chip selection)
- Theme Preference (select dropdown)
- Avatar (button selection)

**Current Validation:**
- ❌ NO inline validation
- ✅ Name required validation on submit
- ❌ NO field-level error states
- ❌ NO success indicators
- ❌ NO focus management
- ❌ Avatar buttons are 40x40px (need 48x48px - V-006 fix)
- ❌ NO ARIA labels on avatar buttons

**Issues:**
- Limited validation (only name)
- Age group is required but users might not notice the selection requirement
- No visual feedback for invalid selections
- Avatar buttons are too small (accessibility issue)

---

#### 3. **RedeemCouponForm** (`src/components/RedeemCouponForm.tsx`)
**Purpose:** Redeem partner/school codes  
**Fields:**
- Code (text)

**Current Validation:**
- ❌ NO inline validation on blur
- ✅ Empty check on submit
- ✅ Server-side validation with error feedback
- ✅ Success message display
- ❌ NO field-level error states
- ❌ NO loading state visibility on input field
- ❌ Uppercase auto-conversion but no user feedback

**Issues:**
- Users don't know if code format is valid until submit
- Loading spinner on button but input stays active (confusing)
- Success/error messages are small and easy to miss

---

#### 4. **WizardPage** (`src/app/wizard/page.tsx`)
**Purpose:** Multi-step story generation  
**Fields:**
- Child Name (text)
- Age Group (chip selection)
- Story Mood (chip selection)
- Story Length (chip selection)
- Theme (text, optional)
- Context (text, optional)

**Current Validation:**
- ✅ Step 1: Name required (`canNext` logic)
- ❌ NO inline validation
- ❌ NO field-level error states
- ✅ Autofocus on step 1
- ❌ NO success indicators
- ❌ NO ARIA announcements for step changes
- ❌ Large input fields but no error state styling

**Issues:**
- Only child name validated; other fields silently optional
- No feedback if theme/context are invalid
- Multi-step complexity without inline validation is risky
- No visual indicator of which fields are required

---

### Current Issues Summary

**Validation Behavior:**
- ❌ NO inline validation (blur/change events)
- ❌ NO field-level error states (border color, icon, message)
- ❌ NO success indicators (green checkmark, border)
- ❌ NO focus management (auto-focus first error)
- ❌ NO dynamic error message clearing

**Error Messages:**
- ❌ Generic ("Er ging iets mis", "Ongeldige code")
- ❌ Not actionable (no guidance on how to fix)
- ❌ No field-specific context
- ⚠️ Some messages are in small text (hard to see)

**Accessibility:**
- ❌ NO `aria-invalid` or `aria-describedby`
- ❌ NO role announcements for inline errors
- ❌ Inconsistent input sizing (some 40px, some 56px)
- ❌ Avatar buttons lack accessible labels
- ⚠️ Some interactive elements below 48px minimum

**Loading States:**
- ⚠️ Button disabled but input remains active (confusion)
- ❌ NO visual feedback on input field during loading
- ❌ Loading text ("Laden..") but no spinner

**User Experience:**
- ❌ No clear visual distinction between valid/invalid fields
- ❌ Users must submit to see most errors
- ❌ No confirmation of successful entry
- ❌ Focus doesn't move to error fields
- ❌ Error messages don't clear until user types again

---

## PHASE 2: Standardization Plan

### 2.1 Field Validation States (CSS Classes)

```
Input States:
- .input-base: Default state
- .input-focus: Focus state (border-teal-500)
- .input-valid: Valid state (border-green-500)
- .input-error: Error state (border-red-500)
- .input-loading: Loading state (border-amber-500)
- .input-disabled: Disabled state
```

### 2.2 Inline Validation Rules

**When to validate:**
- **onBlur:** Check format, required fields
- **onChange:** Clear error if input becomes valid
- **onSubmit:** Final validation before submission

**When to show errors:**
- **Immediately on blur** if field is invalid
- **Clear immediately on change** if input becomes valid
- **Persist during loading** but disable field

### 2.3 Error Message Standards

**Format:** `[Field Name]: [Specific Error]`

Examples:
- ❌ "E-mailadres: Ongeldig formaat (voorbeeld@domein.nl)"
- ❌ "Wachtwoord: Minimaal 6 tekens nodig"
- ❌ "Naam: Dit veld is verplicht"
- ❌ "Code: Format onbekend (voorbeeld: KDV-ZON)"

### 2.4 ARIA Implementation

```jsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${name}-error` : undefined}
/>
{error && <span id={`${name}-error`}>{error}</span>}
```

### 2.5 Focus Management

- Auto-focus first field on form load
- On submit: Move focus to first error field
- Show focus ring visible with 2px outline

---

## PHASE 2: Implementation Order

1. ✅ Create FormField component with validation states
2. ✅ Create validation utilities (email, password, required, etc.)
3. ✅ Update EmailLoginForm (highest impact)
4. ✅ Update AddProfileForm
5. ✅ Update RedeemCouponForm
6. ✅ Update WizardPage
7. ✅ Create form validation guidelines

---

## ACCEPTANCE CRITERIA CHECKLIST

- [ ] EmailLoginForm has inline validation
- [ ] AddProfileForm has inline validation
- [ ] RedeemCouponForm has inline validation
- [ ] WizardPage has step-level validation
- [ ] All error messages are specific and actionable
- [ ] Success states visible (green borders/checkmarks)
- [ ] Loading states clear (input disabled, button shows spinner)
- [ ] Focus management works (auto-focus errors on submit)
- [ ] ARIA labels and descriptions present
- [ ] All forms tested with keyboard navigation
- [ ] All forms tested with screen reader (NVDA/JAWS)
- [ ] Documentation complete
- [ ] WCAG 2.1 AA compliant

---

## Next Steps

→ **Phase 2:** Implement standardized validation (1.5 hours)
→ **Phase 3:** Testing (0.5 hours)
→ **Phase 4:** Documentation (0.5 hours)

