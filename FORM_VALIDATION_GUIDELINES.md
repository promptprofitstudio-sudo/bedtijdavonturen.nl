# Form Validation Guidelines
**Version:** 1.0  
**Last Updated:** 2026-02-19  
**Status:** SPRINT 2 - Form Validation UX Improvements (A-006)

---

## Overview

This document provides guidelines for implementing accessible, user-friendly form validation across bedtijdavonturen.

### Key Principles
1. **Show errors on blur** - Not during typing (too disruptive)
2. **Clear errors on change** - Once user starts fixing, show they're on the right track
3. **Validate on submit** - Final check before sending data
4. **Focus first error** - Auto-focus first invalid field
5. **Accessibility first** - ARIA labels, error announcements, keyboard navigation
6. **Clear messaging** - Specific, actionable, error messages in Dutch

---

## Core Concepts

### Validation Lifecycle

```
User Fills Field
    ↓
Field Blurs (onBlur)
    ├─ Show Error Message (if invalid)
    └─ Mark Field as Touched
        ↓
User Edits (onChange)
    ├─ If now valid → Clear error
    └─ If still invalid → Keep error
        ↓
User Submits (onSubmit)
    ├─ Validate all fields
    ├─ If errors → Mark all as touched, focus first error
    └─ If valid → Submit
```

### Field States

| State | When | Visual | Input Disabled |
|-------|------|--------|---|
| **Default** | Not touched | `border-moon-200` | No |
| **Focused** | Active input | `ring-2 ring-teal-500` | No |
| **Valid** | No errors, touched | `border-green-500 bg-green-50` + ✓ | No |
| **Error** | Has error, touched | `border-red-500 bg-red-50` | No* |
| **Loading** | Submitting | `border-amber-500 bg-amber-50` | **Yes** |

*Don't disable during validation errors; only during form submission

### Visual Indicators

```
✓ Green checkmark (right side) → Field is valid
⚠️ Error message below → Field has error
⟳ Spinner (right side) → Loading/validation in progress
* Asterisk after label → Field is required
```

---

## Implementation Guide

### 1. Creating a Form

#### Structure
```tsx
'use client'
import { useState } from 'react'
import { FormField } from '@/components/FormField'
import { validateEmail, validatePassword } from '@/lib/formValidation'

export function MyForm() {
  // State
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [emailTouched, setEmailTouched] = useState(false)
  
  // Handlers
  const handleEmailBlur = () => {
    setEmailTouched(true)
    const result = validateEmail(email)
    setEmailError(result.error)
  }
  
  // Render
  return (
    <FormField
      label="E-mailadres"
      error={emailTouched ? emailError : undefined}
      isValid={emailTouched && email && !emailError}
      required
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleEmailBlur}
        placeholder="naam@domein.nl"
      />
    </FormField>
  )
}
```

### 2. Using FormField Component

The `FormField` component wraps inputs with:
- Label with required indicator
- Error message with ARIA support
- Valid/loading indicators
- Proper spacing and styling

```tsx
<FormField
  label="Wachtwoord"           // Field label
  error={passwordError}         // Error message (if any)
  isValid={isValid}            // Show green checkmark
  isLoading={isSubmitting}     // Show spinner, disable input
  hint="Min. 6 tekens"         // Optional hint text
  required={true}              // Shows * on label
>
  <input
    type="password"
    value={password}
    onChange={handlePasswordChange}
    onBlur={handlePasswordBlur}
    placeholder="Wachtwoord"
  />
</FormField>
```

### 3. Validation Rules

#### Available Validators

```tsx
import {
  validateEmail,           // Email format + length
  validatePassword,        // Min 6 chars
  validateName,           // 2-50 chars
  validateRequired,       // Non-empty string
  validateCode,           // Alphanumeric + hyphens
  validateTheme,          // Optional, 3-100 chars
  validateContext,        // Optional, 2-200 chars
  validateField          // Composite validation
} from '@/lib/formValidation'

// Single rule
const result = validateEmail('test@example.com')
// { isValid: true }

// Multiple rules
const result = validateField(password, [
  (v) => validatePassword(v),
  (v) => validateLength(v, 8) // Custom rule
])
```

#### Custom Validators

```tsx
import { ValidationResult } from '@/lib/formValidation'

const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Telefoonnummer is verplicht' }
  }
  
  const phoneRegex = /^\+?[\d\s\-()]{9,}$/
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Telefoonnummer: Ongeldig formaat' }
  }
  
  return { isValid: true }
}
```

---

## Error Messages

### Message Format

```
[Field Name]: [Specific Error]
```

### Examples

✅ Good:
- "E-mailadres: Ongeldig formaat (voorbeeld@domein.nl)"
- "Wachtwoord: Minimaal 6 tekens nodig"
- "Naam: Dit veld is verplicht"

❌ Bad:
- "Invalid input"
- "Error"
- "Wrong"
- "Check this field"

### Message Guidelines

1. **Field Name** - What field is this about?
2. **Specific Error** - What's wrong?
3. **Example/Hint** - How to fix it (optional)
4. **Language** - Always Dutch (NL)
5. **Tone** - Helpful, not blaming

### Common Error Messages

| Issue | Message |
|-------|---------|
| Empty required | `{Field}: Dit veld is verplicht` |
| Too short | `{Field}: Minimaal X tekens nodig` |
| Too long | `{Field}: Maximaal X tekens toegestaan` |
| Invalid format | `{Field}: Ongeldig formaat (voorbeeld: ...)` |
| Already exists | `{Field}: Bestaat al (kies een ander)` |
| Server error | `Er ging iets mis. Probeer het opnieuw.` |

---

## Accessibility (WCAG 2.1 AA)

### ARIA Attributes

```tsx
<FormField
  label="E-mailadres"
  error={error}  // Automatically handled
  isValid={isValid}
>
  <input
    // FormField adds these automatically:
    // aria-invalid={!!error}
    // aria-describedby="field-error"
    // disabled={isLoading}
  />
</FormField>
```

### Required Fields

```tsx
<FormField
  label="Voornaam"
  required={true}  // Shows red * on label
>
  <input required />
</FormField>
```

### Error Announcements

```tsx
{error && (
  <p
    id="email-error"
    role="alert"              // Announces to screen readers
    aria-live="polite"        // Non-intrusive announcement
  >
    {error}
  </p>
)}
```

### Keyboard Navigation

- **Tab** - Move between fields (in order)
- **Shift+Tab** - Move backwards
- **Enter** - Submit form (on button or in textarea)
- **Escape** - Close modals/overlays (implement separately)
- **Arrow keys** - For toggles/chips

All interactive elements must be accessible via keyboard.

---

## Focus Management

### Auto-Focus on Load

```tsx
<input
  autoFocus  // Focus first field on mount
  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
/>
```

### Focus First Error on Submit

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validate all fields
  const isValid = validateAll()
  
  if (!isValid) {
    // Focus first error
    const firstError = document.querySelector('[aria-invalid="true"]')
    firstError?.focus()
    return
  }
  
  // Submit...
}
```

---

## Loading States

### During Form Submission

```tsx
<FormField
  label="E-mailadres"
  isLoading={isSubmitting}  // Input gets spinner + disabled
>
  <input disabled={isSubmitting} />
</FormField>

<Button
  disabled={isSubmitting}
>
  {isSubmitting ? '⟳ Laden...' : 'Inloggen'}
</Button>
```

### Server Error Handling

```tsx
const [serverError, setServerError] = useState<string>()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setServerError('')
  
  try {
    await submitForm(data)
  } catch (err) {
    setServerError(err.message || 'Er ging iets mis.')
  }
}

// Render
{serverError && (
  <p role="alert" className="text-red-600 bg-red-50 p-3 rounded">
    {serverError}
  </p>
)}
```

---

## Multi-Step Forms

### Step Validation

Validate current step before proceeding:

```tsx
const next = () => {
  // Mark fields as touched
  setFieldTouched(true)
  
  // Validate
  if (!isStepValid()) {
    // Auto-focus first error
    document.querySelector('[aria-invalid]')?.focus()
    return
  }
  
  // Move to next step
  setStep((s) => s + 1)
}
```

### Persisting State

Keep form data when navigating:

```tsx
useEffect(() => {
  // Save to localStorage or state manager
  localStorage.setItem('formData', JSON.stringify({
    step, email, name, ...
  }))
}, [step, email, name])
```

---

## Testing Checklist

### Functional Testing
- [ ] Error shows on blur (if invalid)
- [ ] Error clears on change (if now valid)
- [ ] Success indicator shows (green checkmark)
- [ ] Submit button disabled while loading
- [ ] Server errors display properly
- [ ] Focus moves to first error on submit

### Accessibility Testing
- [ ] All fields accessible via Tab key
- [ ] Focus ring visible on all inputs
- [ ] Labels associated with inputs (id matching)
- [ ] Error messages announced by screen reader
- [ ] `aria-invalid` toggles correctly
- [ ] `aria-describedby` linked to error id
- [ ] All buttons have accessible labels
- [ ] Required indicators visible

### Edge Cases
- [ ] Very long input text (overflow)
- [ ] Network timeout (show error)
- [ ] Duplicate submission (disable on click)
- [ ] Browser auto-fill (styling preserved)
- [ ] Mobile keyboard (no overlap)
- [ ] Small screens (all fields visible)

---

## Common Mistakes

❌ **Validating onChange**
- Too noisy, interrupts typing
- Fix: Validate onBlur instead

❌ **Generic error messages**
- "Invalid input" doesn't help
- Fix: "E-mailadres: Ongeldig formaat"

❌ **Not clearing errors**
- User fixes field but error stays
- Fix: Clear on change if now valid

❌ **No focus management**
- User doesn't know where error is
- Fix: Auto-focus first error field

❌ **Disabling input during validation**
- User can't edit the field
- Fix: Only disable during submission

❌ **No ARIA labels**
- Screen reader doesn't announce errors
- Fix: Use FormField component (handles it)

---

## Examples

### Basic Login Form
See: `src/components/EmailLoginForm.tsx`

### Profile Form
See: `src/components/AddProfileForm.tsx`

### Code Redemption
See: `src/components/RedeemCouponForm.tsx`

### Multi-Step Wizard
See: `src/app/wizard/page.tsx`

---

## Resources

- [WCAG 2.1 Form Validation](https://www.w3.org/WAI/tutorials/forms/)
- [MDN: HTML Form Validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
- [FormField Component](./src/components/FormField.tsx)
- [Validation Utilities](./src/lib/formValidation.ts)
- [Best Practices](./FORM_VALIDATION_AUDIT.md)

