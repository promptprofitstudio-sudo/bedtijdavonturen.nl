# Icon Audit Preparation - Bedtijdavonturen Design System
## Phase 2 Analysis: Emoji Inventory & Material Symbols Migration Plan

**Date:** 2026-02-19  
**Status:** PREP FOR SPRINT 2  
**Objective:** Document emoji usage and prepare Material Symbols migration strategy  
**Scope:** Replace all decorative emoji with Material Design Symbols 3 icons

---

## Current Emoji Inventory

### Emoji Usage by Component

#### Priority 1: Interactive UI Emojis (Visible to Users)

| Icon | Component | Count | Usage | Status |
|------|-----------|-------|-------|--------|
| 🧸 | AddProfileForm.tsx | 1 | Avatar option | REVIEW |
| 🚀 | AddProfileForm.tsx, home | 2+ | Avatar option, age group | REVIEW |
| 🎧 | Multiple | 3+ | Audio/listen actions | MIGRATE |
| 🎁 | GenerateAudioButton.tsx | 2+ | Gift badge, partner gift | MIGRATE |
| ✨ | AddProfileForm.tsx, home, wizard | 5+ | Sparkles, magic moments | MIGRATE |
| 🌟 | ShareModal.tsx | 1 | Share text | REVIEW |
| 🗺️ | AddProfileForm.tsx | 1 | Adventure theme | REVIEW |
| 🌙 | AddProfileForm.tsx | 1 | Calm theme | REVIEW |
| 🐾 | AddProfileForm.tsx | 1 | Animals theme | REVIEW |
| 🍪 | CookieBanner.tsx | 1 | Cookies banner | MIGRATE |
| 🔗 | ShareButton.tsx | 1 | Share/link action | MIGRATE |
| 📱 | InstallPwaButton.tsx | 1 | Install app | MIGRATE |
| 🎙️ | VoiceRecorder.tsx | 1 | Voice recording | MIGRATE |
| 🎤 | GenerateAudioButton.tsx | 1 | Generate audio button | MIGRATE |
| 🗣️ | VoiceRecorder.tsx | 1 | Voice clone feature | REVIEW |

#### Priority 2: Text-Based Emojis (Content/Copy)

| Icon | File | Usage | Context | Status |
|------|------|-------|---------|--------|
| 🧸 | page.tsx | Multiple | Age group label (2-4 years) | REVIEW |
| 🚀 | page.tsx | Multiple | Age group label (4-7 years) | REVIEW |
| 👤 | Multiple components | 5+ | Avatar placeholder | REVIEW |
| ❤️ | page.tsx, modals | 2+ | Love/heart emoji | REVIEW |
| ⭐ | page.tsx | Multiple | Star rating | REVIEW |
| ✏️ | account/page.tsx | 1 | Edit action | REVIEW |
| 🗑️ | account/page.tsx | 1 | Delete action | REVIEW |
| ✅ | Multiple | 2+ | Checkmark/success | MIGRATE |
| 🔐 | page.tsx | 1 | Security/privacy | MIGRATE |
| 📖 | VoiceRecorder.tsx | 1 | Reading | MIGRATE |
| 🌈 | Color-related | 1 | Rainbow/variety | REVIEW |

#### Priority 3: Decorative/Contextual Emojis

| Icon | File | Usage | Context | Status |
|------|------|-------|---------|--------|
| ✨ | Titles, sections | 10+ | Decorative sparkles | REVIEW |
| 🎵 | Audio sections | 2+ | Music/audio indicator | MIGRATE |
| 💬 | Dialogs | 2+ | Chat/conversation | REVIEW |
| ✉️ | Email share | 1 | Email action | MIGRATE |
| 🔥 | Badges/highlights | 1+ | Hot/trending | REVIEW |
| 🌙 | Night/bedtime | 2+ | Sleep theme | REVIEW |
| 💤 | Sleep-related | 0 (not found) | Sleep indicator | MISSING |

---

## Emoji-to-Material Symbols Mapping

### Material Design Symbols 3 (Google's Icon Library)

**Installation:** Already using Material Symbols in some components (BottomNav.tsx uses `material-symbols-outlined`)

**Current Implementation:**
```tsx
<span className="material-symbols-outlined">{item.icon}</span>
```

### Recommended Icon Mapping

#### Audio/Media Icons
| Emoji | Material Symbol | Code | Use Case |
|-------|-----------------|------|----------|
| 🎧 | headphones | `<span className="material-symbols-outlined">headphones</span>` | Audio/listening |
| 🎤 | mic | `<span className="material-symbols-outlined">mic</span>` | Recording/voice |
| 🔊 | volume_up | `<span className="material-symbols-outlined">volume_up</span>` | Audio playback |
| 🎵 | music_note | `<span className="material-symbols-outlined">music_note</span>` | Music/audio |
| ⏯️ | play_arrow | `<span className="material-symbols-outlined">play_arrow</span>` | Play button |
| ⏸️ | pause | `<span className="material-symbols-outlined">pause</span>` | Pause button |
| 🔄 | refresh | `<span className="material-symbols-outlined">refresh</span>` | Retry/refresh |

#### Navigation/Action Icons
| Emoji | Material Symbol | Code | Use Case |
|-------|-----------------|------|----------|
| 🏠 | home | `<span className="material-symbols-outlined">home</span>` | Home button |
| 📚 | library_books | `<span className="material-symbols-outlined">library_books</span>` | Library |
| ⚙️ | settings | `<span className="material-symbols-outlined">settings</span>` | Settings |
| 🔗 | link | `<span className="material-symbols-outlined">link</span>` | Share/link |
| 📤 | share | `<span className="material-symbols-outlined">share</span>` | Share action |
| ✏️ | edit | `<span className="material-symbols-outlined">edit</span>` | Edit |
| 🗑️ | delete | `<span className="material-symbols-outlined">delete</span>` | Delete |
| ➕ | add | `<span className="material-symbols-outlined">add</span>` | Add |
| ❌ | close | `<span className="material-symbols-outlined">close</span>` | Close |
| ⬅️ | arrow_back | `<span className="material-symbols-outlined">arrow_back</span>` | Back |
| ➡️ | arrow_forward | `<span className="material-symbols-outlined">arrow_forward</span>` | Forward |

#### Content/Feature Icons
| Emoji | Material Symbol | Code | Use Case |
|-------|-----------------|------|----------|
| 📖 | auto_stories | `<span className="material-symbols-outlined">auto_stories</span>` | Stories |
| 👤 | person | `<span className="material-symbols-outlined">person</span>` | Profile |
| 👥 | groups | `<span className="material-symbols-outlined">groups</span>` | Family |
| 🔐 | lock | `<span className="material-symbols-outlined">lock</span>` | Security/privacy |
| ✓ | check_circle | `<span className="material-symbols-outlined">check_circle</span>` | Verified/success |
| ⚠️ | warning | `<span className="material-symbols-outlined">warning</span>` | Warning |
| ❌ | error | `<span className="material-symbols-outlined">error</span>` | Error |
| 💾 | save | `<span className="material-symbols-outlined">save</span>` | Save |
| 🔍 | search | `<span className="material-symbols-outlined">search</span>` | Search |
| 📱 | smartphone | `<span className="material-symbols-outlined">smartphone</span>` | Mobile/app |

#### Special/Decorative Icons
| Emoji | Material Symbol | Code | Use Case |
|-------|-----------------|------|----------|
| ✨ | star | `<span className="material-symbols-outlined">star</span>` | Star/sparkle |
| 🌟 | star_circle | `<span className="material-symbols-outlined">star_circle</span>` | Featured |
| ⭐ | star_filled | `<span className="material-symbols-outlined">star</span>` | Rating |
| 💙 | favorite | `<span className="material-symbols-outlined">favorite</span>` | Like/favorite |
| 🎁 | card_giftcard | `<span className="material-symbols-outlined">card_giftcard</span>` | Gift |
| 🌙 | nights_stay | `<span className="material-symbols-outlined">nights_stay</span>` | Night/sleep |
| ☀️ | wb_sunny | `<span className="material-symbols-outlined">wb_sunny</span>` | Day |

### Emojis to KEEP (as-is)

**Rationale:** These are content/branding elements, not UI controls. Keeping them adds charm and cultural flavor.

1. **Avatar Selection Emojis** (User choice):
   - 🧸 (bear/toys - for young children)
   - 🦊 (fox)
   - 🦁 (lion)
   - 🐰 (bunny)
   - 🚀 (rocket - adventure theme)
   - 👸 (princess)
   - 🧙‍♂️ (wizard)
   - 🦖 (dinosaur)
   - 🦄 (unicorn)
   - 🤖 (robot)

   **Reasoning:** These are part of the brand personality and user experience. Users specifically choose these avatars. Changing to generic icons would lose brand magic.

2. **Theme/Mood Emojis**:
   - ✨ Fantasie (fantasy)
   - 🗺️ Avontuur (adventure)
   - 🌙 Rustig (calm)
   - 🐾 Dieren (animals)

   **Reasoning:** These are semantic labels that help Dutch-speaking parents quickly understand content categories. Replacing with Material Symbols would be less intuitive.

3. **Story/Content Decorative Emojis**:
   - Various story/adventure emojis in titles
   - Age group badges (🧸 for 2-4, 🚀 for 4-7)

   **Reasoning:** These are part of the storytelling experience and brand voice. They make the app feel warm and approachable.

---

## Icon Update Checklist (Priority Order)

### Phase 1: Action Button Icons (HIGH PRIORITY)

**Files:** ShareButton.tsx, GenerateAudioButton.tsx, AudioPlayer.tsx, VoiceRecorder.tsx

| Emoji | Component | Replacement | Effort | Status |
|-------|-----------|-------------|--------|--------|
| 🔗 | ShareButton | `share` Material Symbol | 5 min | ⏳ TODO |
| 🎤 | GenerateAudioButton | `mic` Material Symbol | 5 min | ⏳ TODO |
| 🎙️ | VoiceRecorder | `mic` Material Symbol | 5 min | ⏳ TODO |
| 📱 | InstallPwaButton | `smartphone` Material Symbol | 5 min | ⏳ TODO |
| 🍪 | CookieBanner | `info` Material Symbol | 5 min | ⏳ TODO |

**Total Effort:** 25 minutes

---

### Phase 2: Content Icons (MEDIUM PRIORITY)

**Files:** BottomNav.tsx, account/page.tsx, library/page.tsx

| Emoji | Component | Replacement | Effort | Status |
|-------|-----------|-------------|--------|--------|
| ✏️ | account/page (edit button) | `edit` Material Symbol | 5 min | ⏳ TODO |
| 🗑️ | account/page (delete button) | `delete` Material Symbol | 5 min | ⏳ TODO |
| 📖 | Text references | `auto_stories` Material Symbol | 5 min | ⏳ TODO |
| 🎧 | Audio section labels | `headphones` Material Symbol | 5 min | ⏳ TODO |

**Total Effort:** 20 minutes

---

### Phase 3: Decorative Icons (LOW PRIORITY - OPTIONAL)

**Files:** Multiple pages, titles, badges

| Emoji | Usage | Recommendation | Status |
|-------|-------|-----------------|--------|
| ✨ | Decorative sparkles | Convert to `star` Material Symbol or **KEEP** for brand | ⏳ DECISION |
| 🌟 | Featured/highlight | Convert to `star_circle` or **KEEP** | ⏳ DECISION |
| ⭐ | Ratings | Convert to `star` filled or **KEEP** | ⏳ DECISION |

**Decision Needed:** Should decorative emojis be replaced or kept for brand personality?

**Recommendation:** KEEP decorative emojis - they're part of the brand voice and don't affect accessibility.

---

## Files Requiring Updates

### Must Update (Action Icons)
1. `src/components/ShareButton.tsx` - Replace 🔗
2. `src/components/GenerateAudioButton.tsx` - Replace 🎤, potentially 🎁
3. `src/components/VoiceRecorder.tsx` - Replace 🎤, 📖
4. `src/components/InstallPwaButton.tsx` - Replace 📱
5. `src/components/CookieBanner.tsx` - Replace 🍪

### Should Update (Content Icons)
6. `src/app/account/page.tsx` - Replace ✏️, 🗑️ (if used)
7. `src/app/library/page.tsx` - Replace 📖, 🎧 (if used)
8. `src/components/BottomNav.tsx` - Already uses Material Symbols ✅

### Can Keep (Branding/Content)
- Avatar selection emojis (user choice)
- Theme/mood emojis (🗺️, 🌙, 🐾, ✨)
- Age group badges (🧸, 🚀)
- Decorative emojis in titles/copy

---

## Accessibility Considerations

### Current Issues
1. **Emoji are screen-reader unfriendly** - VoiceOver/TalkBack may read emoji names that don't match intent
2. **No alt-text on emoji** - Decorative emojis should have `role="img" aria-hidden="true"`
3. **Color contrast** - Some emoji don't have sufficient contrast in context

### Material Symbols Advantages
- ✅ Clear semantic meaning
- ✅ Better screen reader support (when properly labeled)
- ✅ Consistent sizing and styling
- ✅ Accessible via `aria-label`
- ✅ Built for UI systems

### Implementation Notes

**For action icons (migrate to Material Symbols):**
```tsx
// Before
<Button onClick={share}>
  🔗 Deel
</Button>

// After
<Button onClick={share}>
  <span className="material-symbols-outlined">share</span>
  Deel
</Button>
```

**For decorative emoji (keep, but add accessibility):**
```tsx
// Before
<h2>✨ Bedtijdavonturen</h2>

// After
<h2>
  <span role="img" aria-hidden="true">✨</span>
  Bedtijdavonturen
</h2>
```

---

## Migration Strategy

### Step 1: Audit & Document (DONE ✅)
- [x] Inventory all emoji usage
- [x] Categorize by type (action, content, decorative)
- [x] Create mapping to Material Symbols

### Step 2: Prepare Material Symbols Setup (VERIFY)
- [x] Check if Material Symbols CSS is loaded
- [ ] Verify icon font is accessible in all environments
- [ ] Test on mobile devices

### Step 3: Update Action Buttons (SPRINT 2)
- [ ] ShareButton: 🔗 → `share`
- [ ] GenerateAudioButton: 🎤 → `mic`
- [ ] VoiceRecorder: 🎙️ → `mic`, 📖 → `auto_stories`
- [ ] InstallPwaButton: 📱 → `smartphone`
- [ ] CookieBanner: 🍪 → optional `info`

### Step 4: Update Content Labels (SPRINT 2)
- [ ] account/page: ✏️ → `edit`, 🗑️ → `delete`
- [ ] library/page: 📖 → `auto_stories` (if used)
- [ ] home/page: 🎧 → `headphones` (in labels only)

### Step 5: QA & Testing (SPRINT 2)
- [ ] Verify icons render on all browsers
- [ ] Test responsive sizing (desktop, tablet, mobile)
- [ ] Screen reader testing (iOS VoiceOver, Android TalkBack)
- [ ] Dark mode testing (if applicable)

### Step 6: Documentation (SPRINT 2)
- [ ] Create icon style guide
- [ ] Document all replacements
- [ ] Add emoji-to-Material Symbols mapping to design system

---

## Testing Checklist

### Desktop Testing
- [ ] All Material Symbols render clearly
- [ ] Icons scale smoothly with text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Hover states visible
- [ ] Active states clear

### Mobile Testing
- [ ] Icons render on iOS Safari
- [ ] Icons render on Android Chrome
- [ ] Touch targets adequate (48x48px minimum)
- [ ] VoiceOver announces icons correctly
- [ ] TalkBack announces icons correctly

### Accessibility Testing
- [ ] Screen readers announce button purpose (icon + text)
- [ ] Decorative icons properly hidden (`aria-hidden="true"`)
- [ ] Tab order preserved
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## Known Limitations

### Material Symbols Limitations
1. Limited to Google's icon set (vs. thousands of emoji)
2. Style must be "outlined" or "filled" (not always matching)
3. Font weight affects sizing (may need adjustment)
4. Not supported in older browsers (IE11)

### Emoji Advantages Kept
1. User recognition (avatars are well-understood)
2. Brand personality (adds warmth)
3. Cultural/language-specific meaning (Dutch context)
4. Variety (10+ avatar options maintain)

---

## Recommendations

### DO Migrate (Action Icons)
- All interactive button icons (share, delete, edit, etc.)
- Accessibility-critical icons
- System icons where clarity is needed

### DO NOT Migrate (Content/Branding)
- Avatar selection emojis
- Theme/mood category emojis
- Age group badges
- Decorative narrative elements
- Story/adventure themed emojis

### CONSIDER Migrating (Medium Priority)
- Decorative sparkles (✨) → could be `star` Material Symbol
- Ratings (⭐) → `star` Material Symbol
- Section headers if consistency is important

---

## Files Reference

### Icon Locations in Components

```
src/components/
├── AddProfileForm.tsx
│   ├── Avatar options: ✨🗺️🌙🐾 (KEEP)
│   └── Theme labels: ✨🗺️🌙🐾 (KEEP)
├── ShareButton.tsx
│   └── 🔗 (MIGRATE → share)
├── GenerateAudioButton.tsx
│   ├── 🎤 (MIGRATE → mic)
│   └── 🎁 (KEEP or migrate to card_giftcard)
├── VoiceRecorder.tsx
│   ├── 🎤 (MIGRATE → mic)
│   ├── 📖 (MIGRATE → auto_stories)
│   └── 🗣️ (REVIEW)
├── InstallPwaButton.tsx
│   └── 📱 (MIGRATE → smartphone)
├── CookieBanner.tsx
│   └── 🍪 (MIGRATE → info, optional)
└── BottomNav.tsx
    └── Already uses Material Symbols ✅

src/app/
├── page.tsx
│   ├── 🧸🚀 (Age badges - KEEP)
│   ├── ✨ (Decorative - KEEP or convert)
│   └── 🎁 (Gift badge - KEEP)
├── account/page.tsx
│   ├── ✏️ (MIGRATE → edit)
│   └── 🗑️ (MIGRATE → delete)
├── wizard/page.tsx
│   └── Avatar emojis (KEEP)
└── library/page.tsx
    └── Check for icons (REVIEW)
```

---

## Estimated Effort Summary

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1 | Migrate action buttons | 30 min | HIGH |
| 2 | Migrate content labels | 20 min | MEDIUM |
| 3 | Optional decorative updates | 15 min | LOW |
| 4 | Testing & QA | 1 hour | HIGH |
| 5 | Documentation | 30 min | MEDIUM |
| **Total** | **Complete Icon Migration** | **~3 hours** | - |

---

## Next Steps (Sprint 2)

1. **Confirm Material Symbols Setup**
   - Verify font is loaded in production build
   - Test on real devices (iOS/Android)

2. **Execute Phase 1 (Action Icons)**
   - 30 minutes coding work
   - Update 5 components
   - Merge to main branch

3. **Execute Phase 2 (Content Icons)**
   - 20 minutes coding work
   - Update account/library pages
   - Test thoroughly

4. **QA & Documentation**
   - Screenshot all updated icons
   - Create icon style guide
   - Add to design system docs

5. **Consider Phase 3 (Optional)**
   - Get design team feedback on decorative emoji
   - Decide if any decorative icons should be standardized

---

## Handoff Status

**Audit Complete:** ✅  
**Emoji Inventory Done:** ✅  
**Material Symbols Mapping:** ✅  
**Migration Plan Ready:** ✅  
**Ready for Sprint 2 Development:** ✅  

---

**Prepared by:** Subagent (SPRINT 1 PHASE 2 - Bonus Work)  
**Date:** 2026-02-19 21:00 UTC  
**Next Review:** Sprint 2 Kickoff  
**Repository:** ~/workspace/bedtijdavonturen-repo
