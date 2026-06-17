# DinkDay — Review & Prioritized Recommendations

## Context

DinkDay (internal codename PicklePal) is a Next.js 16 / Supabase / Clerk pickleball game-day manager deployed at dinkday.site. It's deep into its V2 public-beta launch plan: Phases 0–8 are largely done (auth, groups, privacy, migration, UX refresh, manual past matches). The brand is well-defined — *"Game day, handled."*, personality "Friendly Game-Day Organizer", visual direction "Fresh Court Day" (court green + sky blue, bright/daylight, large readable scores, celebration accents earned sparingly).

This document is a **full review (landing + app)** with **prioritized, on-brand, shippable recommendations** — no code changes yet. It's grounded in the current codebase (verified file-by-file), the brand kit (`docs/DINKDAY-BRAND-KIT.md`), and the launch plan (`docs/PICKLEPAL-V2-LAUNCH-PLAN.md`). The goal: pick what to build next.

The single biggest theme: **the product is feature-complete but launch-soft.** The two unfinished launch phases — 9c (SEO/social metadata) and 10c (observability) — are exactly the things that determine whether a public beta converts and whether you can see what's breaking. Those should lead.

**Two explicit user priorities for this pass** (added after first review):
- **Make the design more engaging and clearly on-brand with DinkDay** (landing + app) — see "Design glow-up" section below, promoted to P0.
- **Ship a downloadable MVP-of-the-session sticker for sharing** — see Feature A2 below.

---

## What's already strong (don't touch)

- Clean stack, strict TS, 146 green tests, pure-TS scoring/matchmaking/awards engines.
- Coherent design system in `globals.css` (single source of truth), real brand tokens, motion that respects `prefers-reduced-motion`.
- Landing page is a server component wrapping a client `LandingPage`; images use `next/image` with `priority` on the LCP hero; alt text and heading order are solid (WCAG AA basics covered).

---

## Design glow-up (P0 — user priority)

Goal: the product should feel **engaging and unmistakably DinkDay** — bright "Fresh Court Day" energy, court-line structure, large readable scores, celebration accents that feel *earned*. Two surfaces:

**Landing page.** It's structurally complete but reads as competent rather than exciting. On-brand moves that fit the existing system (no redesign-from-scratch):
- Stronger hero motion + a real "game day" feel: animated live-score ticker / MVP chip, court-line texture or diagonal `clip-path` section breaks (the brand kit explicitly calls for crisp court-line structure and diagonals — `globals.css` already has the tokens).
- Tighten visual rhythm: more decisive use of court-green/sky-blue bands, the warm-gold accent reserved for one or two celebration moments, and the `Anton` display font for impact headlines.
- Replace heavy static screenshots with a couple of subtly animated/interactive UI previews so the page *moves* like the product does.
- Consider the `design-taste-frontend` skill for an audit-first pass when we implement, to avoid templated/"slop" output.

**In-app brand consistency.** Verify the Phase 7 refresh landed evenly — the recap, share, and award surfaces are the brand's showcase and should be the most polished. **Known leak to fix:** `src/components/share/OverlayRenderer.tsx` still renders "PicklePal" and "picklepal.app" — stale pre-rename branding on the one asset users share publicly. Sweep for other `PicklePal`/`picklepal` strings in user-facing UI.

*Impact: High (it's the brand's first impression and its growth surface) · Effort: Med.* This pairs naturally with Feature A/A2 below — design the recap/sticker visuals and the landing glow-up as one cohesive brand pass.

---

## Optimizations (ranked by impact ÷ effort)

### P0 — Launch blockers / near-blockers

**1. Social & SEO metadata (Phase 9c — 37% done).** `layout.tsx` has only title + description. Missing: OpenGraph + Twitter card tags, a 1200×630 OG share image, `sitemap.ts`, `robots.ts`, apple-touch-icon, and `manifest.json`. For a product whose entire growth loop is *sharing recap cards and group links in chats*, links that render as bare URLs in iMessage/WhatsApp is the highest-leverage miss on the board.
- *Impact: High · Effort: Low–Med.* Files: `src/app/layout.tsx`, new `src/app/sitemap.ts`, `src/app/robots.ts`, `public/og-image.png`, per-route `generateMetadata` for `/g/[slug]` and public recaps (respecting privacy — private groups must not leak via metadata).

**2. Analytics + error tracking (Phase 10c — 0% done).** No Vercel Analytics, PostHog, GA, or Sentry. You're about to open a public beta with zero visibility into funnel drop-off or server-action failures. At minimum: Vercel Analytics + Speed Insights (near-zero effort) and Sentry for server actions.
- *Impact: High · Effort: Low.* Without this you can't measure whether any of the below works.

### P1 — Performance & scale

**3. Compress/convert landing screenshots.** `next/image` serves them well, but source PNGs are heavy (`group-home-phone.png` 442 KB, `leaderboard-phone.png` 413 KB, `history-phone.png` 349 KB). Convert to WebP/AVIF + re-export at display resolution → ~40–60% smaller, faster LCP/mobile.
- *Impact: Med · Effort: Low.* Dir: `public/screenshots/`.

**4. Paginate match history.** `getMatchHistory()` (`src/app/g/[slug]/history/actions.ts`) fetches **all** sessions and **all** matches with no `.limit()`. Fine today; degrades for any group with months of play. Add cursor/limit + "load more" or infinite scroll.
- *Impact: Med (grows with usage) · Effort: Med.*

**5. Live viewer freshness.** Public view-only live updates (Phase 6d) currently rely on server actions + manual refetch — there are **no Supabase realtime subscriptions** anywhere in `/src`. The launch plan only promised 3–5s polling, so this is acceptable for beta, but document it and add lightweight polling to the viewer banner so spectators aren't stuck on stale scores until refresh.
- *Impact: Med · Effort: Med.* File: `LivePageClient.tsx` / `ActiveMatchBanner`.

### P2 — Polish

**6. Code-split the motion library on landing.** `motion/react` (~20 KB gz) loads for every visitor via the client `LandingPage`. Consider lazy-loading below-the-fold animated sections so the hero paints without the full animation bundle.
- *Impact: Low–Med · Effort: Med.*

**7. Finish Phase 7e feedback states.** Per memory, error boundaries / toasts for failed server actions were still inline text, and PlayerProfile + Live loading states were pending. Verify current state; ship toasts so failed writes (score save, add player) tell the user what to do next.
- *Impact: Med · Effort: Low–Med.*

---

## New feature ideas (on-brand, shippable)

Filtered to fit "Friendly Game-Day Organizer", the current stack, and V2 non-goals (no player accounts, no Elo/DUPR, no tournament brackets, no social feed). Ordered by fit × payoff.

**A. Recap share-card glow-up + one-tap share.** The recap (MVP / Hottest Duo / Best Match) is the brand's emotional payoff and its only organic growth loop. Pair with #1 above: branded 9:16 cards, reliable mobile download, Web Share API ("Share today's recap"), and public recap permalinks (`/g/[slug]/sessions/[id]/recap`) that render rich previews. Directly advances Phase 9a/9b. *Highest brand alignment.*

**A2. Downloadable "MVP of the Session" sticker (user priority).** A dedicated, share-ready sticker celebrating the session MVP — separate from the full recap overlay so it can be dropped straight into the group chat or a story.
- *Reuse what exists:* the export pipeline in `src/components/share/OverlayRenderer.tsx` (html2canvas → transparent PNG, 9:16 @ 2x, blob download) is the template — generalize it or add a sibling `MvpStickerRenderer`. Pull data from the existing `MvpAward` interface (`src/lib/stats/awards.ts`: `displayName`, `color`, `wins`, `gamesPlayed`, `pointDifferential`). Reuse `PlayerAvatar` (image-or-colored-initials), `RankBadge`/trophy iconography, the `Logo` wordmark, and brand tokens from `globals.css`.
- *Design:* a tight, celebratory card — player avatar in their personal color, "MVP of the Day" in the warm-gold celebration accent (`--color-ball-yellow`, exactly the "earned" accent the brand kit prescribes), wins/games + point differential in the `Archivo Narrow` score font, DinkDay wordmark + group name footer. Crucially **fix the branding** so it says DinkDay, not PicklePal.
- *Integration:* surface a "Download MVP sticker" / Web Share button in the MVP recap slide (`GameDayRecap.tsx`) and on the session detail/recap page so it's retrievable later. Optionally persist config to the unused `recap_cards` table (`generated_config` / `image_url`) for permalink previews — but local html2canvas download works without any backend, so ship that first.
- *Impact: High (on-brand, directly shareable, user-requested) · Effort: Low–Med* given the export pipeline already exists.

**B. "Game Day Invite" link.** A shareable link an organizer drops in the group chat before a session: shows who's in, lets the crew see today's matchups/queue, and (for public groups) the live score — no account needed. Leans on existing public-link infrastructure; turns the spectator into a viral surface. On-brand: keeps the day moving for everyone, not just the scorer.

**C. Streaks & "on fire" moments, surfaced.** The `fireFlicker`/`avatarFireRing` CSS already exists and a streak feature was recently committed. Lean in: win-streak badges on the board, a "🔥 3 in a row" callout in live and recap, longest-streak in player profiles. Pure stats over existing match data — no schema risk — and it's the "earned celebration accent" the brand kit explicitly calls for.

**D. Head-to-head & "rivalries".** On a player profile, show record vs each other player ("You vs Sam: 7–4") and a partner chemistry stat ("With Maya: 80% win rate"). All derivable from existing `matches` data. High personal-engagement, very on-brand ("hottest duo" already exists conceptually), no new tables.

**E. Game Day summary push/notification-free recap.** Since there's no notification system (and that's a non-goal), instead generate a copy-pasteable text recap ("📋 Today: 12 games, MVP Alex, Hottest duo Sam+Maya…") the organizer pastes into the group chat. Cheap, useful, fits the "before the group chat asks" voice.

**F. Quick re-run / "same crew" session start.** One tap to start a new session pre-loaded with last session's active players and settings. Removes setup friction for recurring weekly crews — the exact target user. Builds on Phase 8c session-setup work.

**Deferred (good, but bump V2 non-goals or need more scope):** in-app player ratings/Elo, native push notifications, public group discovery, multi-device simultaneous scoring. Note them, don't build them for the beta.

---

## Recommended next 3

If you want a sequence rather than a menu:

1. **Design glow-up + Feature A2 (MVP sticker)** — your two stated priorities, designed together as one cohesive on-brand pass. Fix the PicklePal→DinkDay leak here.
2. **#1 + #2 (metadata + analytics/Sentry)** — unblocks launch and measurement; the OG-image work pairs with the share-card visuals from step 1.
3. **Feature A (full recap share cards + permalinks)**, then **#3 + #4 (image compression + history pagination)**.

Streaks (C) and head-to-head (D) are the best "delight" follow-ups once the above land.

---

## Verification (when we build any of these)

- **Metadata/SEO:** validate OG/Twitter cards with the Facebook Sharing Debugger and Twitter Card Validator; confirm private groups expose **no** sensitive metadata; check `sitemap.xml` and `robots.txt` resolve; Lighthouse SEO ≥ 95.
- **Analytics/Sentry:** trigger a deliberate server-action error and confirm it lands in Sentry; confirm pageviews/web-vitals report in Vercel.
- **Images:** Lighthouse mobile performance before/after; confirm LCP image is WebP/AVIF and visually unchanged.
- **History pagination:** seed a group with 200+ matches; confirm initial load is bounded and "load more" works; existing history tests stay green.
- **Recap cards / MVP sticker:** export on real iOS Safari + Android Chrome; confirm Web Share + download both work and the PNG is transparent at 2x; confirm the card says **DinkDay** (no "PicklePal"/"picklepal.app" anywhere); verify MVP name/avatar/stats match the recap; open a public recap permalink in an incognito window and in a chat preview.
- **Design glow-up:** visual QA at 375px / tablet / desktop; confirm animations respect `prefers-reduced-motion`; grep for residual `PicklePal`/`picklepal` in user-facing UI; Lighthouse performance not regressed by added motion.
- Run `pnpm test`, `pnpm build`, and `tsc` green before any ship.
