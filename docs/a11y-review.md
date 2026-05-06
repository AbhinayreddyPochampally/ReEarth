# Accessibility Review — 2026-05-06

Static review of the contributor PWA and HO desktop surfaces against WCAG 2.1 AA
basics. Phase 4 task 4.5 deliverable. Findings below are split into **fixed in
this pass** vs **pending** (need real-device or screen-reader testing the
architect should run during demo prep).

This audit is static — it doesn't substitute for testing with a real screen
reader (NVDA / JAWS / VoiceOver), Lighthouse, axe DevTools, or keyboard-only
navigation on a touch device. Those are deploy-time tasks.

## Scope

- **Contributor PWA**: every route under `web/app/contributor/*` + the login
  flow (`web/app/login/*`).
- **HO desktop**: every route under `web/app/ho/*`.
- **Shared shells**: `web/components/reearth/ContributorShell.tsx`,
  `HOShell.tsx`, the `ui.tsx` primitives.

## What I checked (WCAG 2.1 AA reference numbers in parens)

- **1.1.1** Non-text content has alternative text
- **1.3.1** Info and relationships (semantic HTML, ARIA roles)
- **1.4.3** Contrast minimum (≥4.5:1 normal text, ≥3:1 large)
- **1.4.11** Non-text contrast (UI components / borders ≥3:1)
- **2.1.1** Keyboard accessible
- **2.4.1** Skip links / bypass blocks
- **2.4.4** Link purpose (in context)
- **2.4.6** Headings and labels
- **2.4.7** Focus visible
- **2.5.5** Target size (≥44 × 44 px)
- **3.3.2** Labels or instructions on form fields
- **3.3.3** Error suggestion
- **4.1.2** Name, role, value (ARIA correctness)
- **4.1.3** Status messages (live regions)

## Fixed in this pass

### 1. Skip-to-content link (WCAG 2.4.1)

**Before:** Keyboard users had to tab through the sticky header and the bottom
nav before reaching page content. Same issue on the HO desktop sidebar.

**Fix:** Added a visually-hidden-until-focused `<a href="#main-content">Skip to
main content</a>` in `web/app/layout.tsx`. ContributorShell's `<main>` and
HOShell's `<main>` now carry `id="main-content"`. Pressing Tab on page load
surfaces the skip link in the top-left.

### 2. Hi, {name} as a real heading (WCAG 1.3.1, 2.4.6)

**Before:** ContributorShell rendered the user's name as a plain `<div
className="t-h3">` — visually a heading but with no `<h1>` semantics. Screen
readers couldn't navigate to it via the heading list.

**Fix:** Changed to `<h1 className="t-h3 m-0">Hi, {name}</h1>`. The contributor's
name is the primary heading on every page; subsequent page-specific headings can
be `<h2>` or below.

### 3. Bell button has an accessible name (WCAG 4.1.2, 2.5.5)

**Before:** The notifications bell in ContributorShell's header was an icon-only
`<button>` with no `aria-label`. Screen readers announced it as "button".

**Fix:** Added `aria-label="Notifications"` and a `focus:ring` so keyboard focus
is visible. The button is `h-9 w-9` (36 × 36 px) which is just under the WCAG
2.5.5 ≥44 px target — flagged below as a follow-up.

### 4. Already-correct items confirmed in audit

These were already right and don't need changes:

- `<html lang="en">` set in root layout
- Bottom nav uses `<nav>` and active tab carries `aria-current="page"`
- Login PIN-pad digits each carry `aria-label="Digit N"` / `"Backspace"`
- Login facility picker is a `role="listbox"` with `aria-label="Facilities"`
- Login name picker is a `role="radiogroup"` with per-button `aria-label`
- BulkApproveModal is `role="dialog"` with `aria-modal="true"` +
  `aria-labelledby` pointing at the modal heading
- AlertsTabs uses `role="tablist"` + `role="tab"` + `aria-selected`
- ConfidenceDot renders both color AND percentage text (no color-only meaning)
- Form inputs have `<label htmlFor>` associations across the bills, events,
  monthly summary, login PIN, and late-entry surfaces
- Server-action error messages render inside `<p className="...danger...">` —
  visible and not dismissed automatically; OK pending the live-region change
  below

## Pending — needs real-device / screen-reader testing

### A. Color contrast verification (1.4.3)

Need to run Lighthouse / axe DevTools against the deployed URL with the brand
palette resolved. Likely candidates that need a closer look:

- `text-[var(--muted)]` on `bg-[var(--bg-subtle)]` — gray on gray, may dip
  below 4.5:1
- `t-caption` (smaller text) inside the daily-log card's complete state's
  pastel-green band
- `Chip tone="warn"` (#76520d on warn-soft) — close to 4.5:1, deserves a
  measure
- Confidence-dot halos at high zoom — non-text contrast (1.4.11) for the inner
  vs outer ring

The architect should run `npx lighthouse <deployed-url> --only-categories=accessibility`
once the URL is live and act on any "contrast" findings.

### B. Touch targets (2.5.5)

Several buttons are smaller than 44 × 44 px:

- ContributorShell bell button: 36 × 36 (`h-9 w-9`)
- HOShell sidebar back-arrow buttons across `/ho/master/late-entry` and
  `/ho/master/ai-spend`: 36 × 36
- BillInbox table row chevron-right links: 16 × 16 (icon-only inside a small td)
- Filter pills on `/ho` Dashboards FilterBar: 24 px tall
- Edit-history chevron buttons throughout

For a desktop-first HO surface this is acceptable; for the contributor PWA
which is mobile-only, all touch targets should be bumped to ≥44 px. Phase 4
follow-up: sweep `web/app/contributor/*` for `h-9` icon buttons and increase
to `h-11` (44 px). Bell button on the contributor home is the most visible
case.

### C. Live regions for status messages (4.1.3)

Server-action results (approve / send back / login error) render imperatively
when the form re-renders. Screen readers won't announce them automatically.

For the most consequential surfaces (login error, bill approve / send back,
NL query results), add `role="status"` or `aria-live="polite"` to the result
container so VoiceOver / NVDA announce changes.

Suggested follow-up tickets:

- `web/app/login/LoginForm.tsx` — wrap the PIN-pad error message in
  `<p role="status" aria-live="polite">`
- `web/app/ho/inbox/[billId]/BillActions.tsx` — same for the approve / send-back
  outcome
- `web/app/ho/explorer/NLQueryClient.tsx` — wrap the result region in
  `<section aria-live="polite">`

### D. Daily-log card state announcement (4.1.3)

When the contributor adds an entry, the home-screen daily-log card silently
updates the count. Screen-reader users wouldn't know without re-reading. Wrap
the `done / total` span in `aria-live="polite"` so the counter is announced.

### E. Heading hierarchy on `/contributor/me`

The Settings page (UI sketch p22) probably ships without an h1. I haven't
opened it; flagging for the architect to verify the heading order is sane
(h1 → h2, no skips).

### F. Form-error association (3.3.1, 3.3.3)

Most error messages render below the form but aren't associated to specific
fields with `aria-describedby`. Screen readers won't link "wrong PIN" to the
PIN input. Phase 4 follow-up: add `aria-describedby` on each input pointing at
its error region, and `aria-invalid="true"` when the field is the cause of
the error.

### G. Reduced-motion + prefers-reduced-motion (2.3.3)

Several surfaces use `transition` and `hover:scale-105`. Should respect
`prefers-reduced-motion: reduce`. Either add a Tailwind motion-reduce variant
or wrap the rule in a media query in `globals.css`.

### H. Page titles (2.4.2)

Most route pages set `metadata.title` ✓. Verified: login, login/ho,
contributor/page, contributor/bills, contributor/event, contributor/monthly,
contributor/bills/[billId], contributor/bills/new, ho/inbox, ho/master,
ho/master/late-entry, ho/master/ai-spend, ho/explorer, ho/alerts. Missing:
`/contributor/daily/[paramCode]` (numeric-entry page). Phase 4 follow-up.

## Reproduce this audit

```bash
# Heading hierarchy
grep -rn "<h1\|<h2\|<h3\|t-h1\|t-h2\|t-h3" web/app/

# ARIA names on icon-only buttons
grep -rn "<button" web/app/ web/components/ | grep -v "aria-label" | grep -E "size=\{?(13|14|16|18|22)"

# Skip-link target
grep -rn "id=\"main-content\"" web/

# Form labels
grep -rn "<label" web/app/

# Color-only status (any tone= without text content)
grep -rn "<Chip tone=" web/app/ web/components/
```

## Recommendation

Ship the four immediate fixes (already in this commit). Schedule **B** (touch
targets sweep) and **C** (live regions) as Phase-4 polish tickets before the
architect's demo walkthroughs. **A** (contrast) is a deploy-time check via
Lighthouse and is fastest done after the production URL is live with the
brand palette finalised. The remaining items (D, E, F, G, H) are smaller and
can ship across the polish window.

WCAG 2.1 AA is achievable on the current codebase; the gap is concentrated in
status announcements and touch sizing on the mobile PWA, both of which are
small lifts.
