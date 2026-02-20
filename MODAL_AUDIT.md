# Modal/Dialog UX Audit Report (A-005)
**Date:** 2026-02-19
**Status:** ✅ PHASE 1 COMPLETE

## Executive Summary
Identified **2 modal components** and **1 modal-style banner** currently implemented with significant inconsistencies. 21+ uses of native browser alerts/confirms throughout the codebase require replacement with accessible modal dialogs.

---

## 📊 Current Modal/Dialog Usage

### 1. **ShareModal** ✅ (src/components/ShareModal.tsx)
**Type:** Share/Distribution Modal
**Current Implementation:**
- ✅ Has backdrop overlay with blur
- ✅ Click-outside to close
- ✅ Mobile responsive (items-end on mobile, items-center on sm+)
- ✅ Animation (fade-in, slide-in-from-bottom on mobile)
- ❌ **NO focus trapping** - focus can leave modal
- ❌ **NO ESC key handler** - cannot close with keyboard
- ❌ **MISSING ARIA attributes** - no role, no aria-modal, no aria-labelledby
- ❌ **NO aria-label on backdrop** - generic div
- ❌ **Manual focus management needed** - no focus restoration after close

**Z-index:** 50
**Backdrop:** `bg-black/60 backdrop-blur-sm`
**Animation:** `animate-in fade-in duration-200`
**Position:** `fixed inset-0 flex items-end sm:items-center`

**Accessibility Issues:**
- Screen readers don't announce modal
- Keyboard users trapped in document
- Tab order not managed
- No inert attribute on background

---

### 2. **CookieBanner** ✅ (src/components/CookieBanner.tsx)
**Type:** Consent Banner/Modal
**Current Implementation:**
- ✅ Has overlay backdrop
- ✅ Centered position
- ✅ Animation (fade-in, zoom-in)
- ✅ Good color contrast
- ❌ **NO focus management** - focus not trapped
- ❌ **NO ESC key handler**
- ❌ **NO proper ARIA** - missing role, aria-modal, etc.
- ❌ **SEMANTIC ISSUE** - uses generic div, not semantic element
- ❌ **TAB TRAPPING NOT IMPLEMENTED** - can tab out of modal
- ❌ **NO aria-labelledby** for title

**Z-index:** 60 ⚠️ (higher than ShareModal - inconsistent hierarchy)
**Backdrop:** `bg-navy-950/40 backdrop-blur-sm`
**Animation:** `animate-in fade-in duration-300 | zoom-in-95 duration-300`
**Position:** `fixed inset-0 flex items-center justify-center`

**Accessibility Issues:**
- Not announced as modal dialog to screen readers
- Cannot close with ESC
- Focus management missing
- Document in background not inert

---

### 3. **AudioPlayer - Screen Off** ✅ (src/components/AudioPlayer.tsx)
**Type:** Full-screen Overlay Dialog
**Current Implementation:**
- ✅ Has backdrop (black)
- ✅ Click to close
- ✅ Semantic `role="dialog"`
- ❌ **NO aria-label on close trigger** (only on container)
- ❌ **NO focus trapping** - can escape with Tab
- ❌ **NO ESC key support**
- ❌ **IMPROPER IMPLEMENTATION** - role="dialog" on overlay div instead of focused element
- ❌ **NO aria-modal="true"`
- ❌ **NO aria-labelledby or aria-describedby`

**Z-index:** 100 (highest - correct separation)
**Backdrop:** `bg-black`
**Animation:** `animate-in fade-in duration-700`
**Position:** `fixed inset-0`

**Accessibility Issues:**
- Incorrect semantic usage of role="dialog"
- No focus management
- Screen reader context unclear
- Missing proper modal attributes

---

## 🚨 Browser Alert/Confirm Replacements Needed

**Locations with native browser dialogs (21 occurrences):**

1. **src/app/wizard/page.tsx** (3x)
   - "Je moet ingelogd zijn..." - should be info modal
   - "Er ging iets mis." - should be error modal
   - "CRITICAL: Wrote to wrong project" - should be error modal

2. **src/app/profiles/page.tsx** (1x)
   - "Weet je zeker dat je dit profiel wilt verwijderen?" - destructive action modal

3. **src/app/account/page.tsx** (3x)
   - Google login errors - error modal
   - "Weet u zeker dat u uw account wilt verwijderen?" - destructive action modal
   - Account deletion errors - error modal

**Impact:** Low accessibility, poor UX, inconsistent styling with brand

---

## 🎨 Inconsistencies Found

| Aspect | ShareModal | CookieBanner | Screen Off | Issue |
|--------|-----------|--------------|------------|-------|
| **Z-index** | 50 | 60 | 100 | No consistent hierarchy |
| **Backdrop Color** | `black/60` | `navy-950/40` | `black` | Inconsistent opacity |
| **Backdrop Blur** | Yes | Yes | No | Inconsistent treatment |
| **ESC Key** | ❌ No | ❌ No | ❌ No | Missing universally |
| **Focus Trap** | ❌ No | ❌ No | ❌ No | Missing universally |
| **ARIA Modal** | ❌ No | ❌ No | ❌ No | Not accessible |
| **Animation Enter** | fade + slide | fade + zoom | fade | Inconsistent patterns |
| **Animation Duration** | 200ms | 300ms | 700ms | Inconsistent timing |
| **Click-outside close** | ✅ Yes | ✅ Yes | ✅ Yes | Consistent good pattern |
| **Mobile responsive** | ✅ Yes (items-end) | ✅ Yes (centered) | ✅ Yes | Consistent approach |

---

## ✅ What's Working Well

1. ✅ **Backdrop click to close** - all modals support this
2. ✅ **Mobile responsiveness** - responsive positioning used
3. ✅ **Visual treatment** - backdrop blur + semi-transparent overlay consistent
4. ✅ **Animation entry** - smooth fade/scale animations
5. ✅ **Color scheme** - uses navy/teal palette from design system

---

## ❌ Critical Accessibility Gaps

### WCAG 2.1 AA Non-Compliance Issues:

1. **Focus Management (Level A)**
   - No focus trap within modal
   - No focus restoration on close
   - Focus can escape modal entirely

2. **Keyboard Navigation (Level A)**
   - ESC key not implemented
   - Tab trap not implemented
   - No keyboard focus visible indicators

3. **Semantic HTML (Level A)**
   - No `role="dialog"` on proper element (ShareModal, CookieBanner)
   - No `aria-modal="true"`
   - No `aria-labelledby` linking to heading
   - No `aria-describedby` where applicable

4. **Screen Reader (Level A)**
   - Modal not announced
   - Dialog purpose unclear
   - Backdrop not hidden from readers

5. **Inert Background (Level AAA)**
   - Document behind modal not inert
   - Screen reader focus not trapped
   - Can still interact with background content

---

## 📋 Standardization Recommendations

### Z-Index Hierarchy (PROPOSAL)
```
Modal Z-indexes (standardize):
- Low modals (confirmations): z-50
- Standard modals (ShareModal, CookieBanner): z-60
- High priority (Screen off, alerts): z-70
- Toasts/Notifications: z-80
```

### Backdrop Specification
```css
Standard Backdrop:
- Color: bg-black/50 (consistent neutral)
- Blur: backdrop-blur-sm (consistent)
- Animation: animate-in fade-in duration-200ms
- Click behavior: Always close modal
```

### Focus Management Pattern
```jsx
// On mount:
- Save previous focus
- Find first focusable element in modal
- Focus it (preferably first button)

// On unmount:
- Restore previous focus
- Set inert on body/main content

// Tab behavior:
- Trap focus within modal
- Loop from last to first element
```

### Keyboard Handlers
```javascript
- ESC → close modal
- Tab → cycle through focusable elements
- Shift+Tab → reverse cycle
- Enter → confirm action (on primary button)
```

### ARIA Attributes (REQUIRED)
```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Description text</p>
</div>
```

---

## 🔧 Implementation Readiness

### Dependencies Status:
- ⏳ **V-001 (Icon/Emoji Removal)** - NOT STARTED
  - Impact: ShareModal, CookieBanner have emojis
  - Should be removed before final standardization
  
- ⏳ **V-002 (Color System)** - NOT STARTED
  - Impact: Backdrop colors may need adjustment to new system
  - Z-index strategy should align with new color scheme

### Blockers Before Phase 2:
1. **Wait for V-001** - to remove emojis from modals
2. **Wait for V-002** - to finalize backdrop colors

### Can Begin Immediately:
- ✅ Create StandardModal component (will use V-002 colors)
- ✅ Create ModalProvider for focus/keyboard management
- ✅ Write focus trap utilities
- ✅ Write keyboard handler utilities
- ✅ Create documentation

---

## 📐 Component Types to Create

1. **StandardModal** - Base component with all accessibility features
2. **ConfirmModal** - Yes/No confirmation pattern
3. **AlertModal** - Info/Warning/Error patterns
4. **FormModal** - Modals with form inputs
5. **ModalProvider** - Context for nested modals + focus management

---

## 🎯 Files to Modify

### Phase 1 (Completed):
- ✅ Audit all modal usage
- ✅ Document inconsistencies
- ✅ Check accessibility

### Phase 2 (Waiting for V-001, V-002):
- [ ] src/components/Modal.tsx (create)
- [ ] src/components/ConfirmModal.tsx (create)
- [ ] src/components/AlertModal.tsx (create)
- [ ] src/hooks/useModal.ts (create)
- [ ] src/lib/focusTrap.ts (create)
- [ ] src/components/ShareModal.tsx (refactor)
- [ ] src/components/CookieBanner.tsx (refactor)
- [ ] src/components/AudioPlayer.tsx (refactor screen-off overlay)
- [ ] src/app/wizard/page.tsx (replace alerts)
- [ ] src/app/profiles/page.tsx (replace confirm)
- [ ] src/app/account/page.tsx (replace alerts/confirms)

### Phase 3 (Testing):
- [ ] Manual accessibility testing (keyboard only)
- [ ] Screen reader testing (NVDA, JAWS)
- [ ] Mobile/tablet testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Phase 4 (Documentation):
- [ ] Modal usage guide
- [ ] Accessibility best practices
- [ ] Component API documentation
- [ ] Implementation examples

---

## 📝 Notes for Implementation Team

1. **Focus Restoration:** Use React ref or state to track previously focused element
2. **Tab Trapping:** Consider using `react-focus-lock` or custom implementation
3. **ESC Key:** Use `useEffect` with `addEventListener` for `Escape` key
4. **Testing:** Use jest + react-testing-library with accessibility assertions
5. **Mobile:** Ensure modals don't get cut off on small screens
6. **Animations:** Keep entry animations <300ms, exit animations >200ms for smooth UX

---

## 🚀 Expected Outcomes

After Phase 2-4 completion:
- ✅ All modals WCAG 2.1 AA compliant
- ✅ Keyboard navigation fully supported
- ✅ Screen reader accessible
- ✅ Consistent visual design
- ✅ Responsive across all devices
- ✅ Documented and tested
- ✅ Improved user experience

---

**Audit conducted by:** Subagent Aura (Sprint 2)
**Next step:** Await V-001 and V-002 completion before Phase 2 implementation
