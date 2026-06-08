# Phase 7 — DinkDay UI/UX Refresh ("Fresh Court Day")

## Context

Users say the app currently "looks like a grade dashboard or LMS." It should feel like a
bright, sporty, social **pickleball** app that lives up to the DinkDay brand
("Game day, handled. From first serve to final recap.").

The surprising finding: **the design system already exists and is good** — it's documented in
`picklepal/DESIGN.md` ("Athletic Editorial") and `docs/DINKDAY-BRAND-KIT.md` ("Fresh Court Day"),
with a full palette (court green / sky blue / warm gold), type scale (Anton / Outfit / Archivo
Narrow), and component patterns (scoreboard cards, color blocking, lists-not-boxes). **The code
just doesn't follow it.** Two problems compound:

1. **Token conflict in `globals.css`.** There are two `@theme` blocks. The first (lines 4–36)
   defines a generic **slate-gray SaaS palette** (`--color-surface: #FFFFFF`, `--color-border:
   #E2E8F0`, slate text) and sets `--font-sans: var(--font-geist-sans)`. So the body renders in
   **Geist, not Outfit**, on white-with-gray-borders — the literal LMS look. The sporty tokens
   (Outfit/Archivo, court-tinted surfaces) live in the second block but are rarely referenced.
2. **Screens default to "safe SaaS" patterns.** Every data view is `rounded-xl border
   border-border bg-surface p-4`; the leaderboard is a dense 7-column `<table>` with `uppercase
   tracking-wide` labels; match rows are monochrome with no team colors or win celebration; depth
   is flat; the energetic hero is the only place brand shows.

**Intended outcome:** a sporty-but-balanced refresh with a real pickleball vibe, on-brand DinkDay
styling, and tasteful animation — phone + tablet co-primary, desktop for review. We fix the token
foundation, build a small reusable primitive set, then re-skin every Phase 7 screen against it.

**Decisions (confirmed with user):**
- **Boldness:** Sporty but balanced. Energetic palette, team colors, scoreboard styling,
  celebration moments, and good animation — but cleaner/more conventional layouts (no heavy
  diagonals/asymmetry except on a few hero/recap moments).
- **Scope:** Foundation + all of Phase 7 (a–e).
- **Device:** Balanced phone + tablet co-primary; desktop = admin/review.

---

## Guiding visual principles (the "anti-LMS" rules)

Apply these everywhere; they're the difference between SaaS and sporty:

1. **Fewer boxes, more blocking.** Replace stacks of bordered white cards with grouped sections,
   colored accent bars, and lists with dividers (per DESIGN.md "lists, no boxes").
2. **Color with intent.** Use court green / sky blue / gold as *content* color (winner
   highlights, rank medals, team colors, section accents), not just on buttons.
3. **Scoreboard energy.** Scores use `font-score` (Archivo Narrow), large; winners get a gold
   left-accent and emphasis; losers de-emphasized.
4. **Type hierarchy.** Outfit for everything UI; Anton reserved for big hero/recap moments;
   Archivo Narrow for all numerals (scores, ranks, stats, %).
5. **Motion = feedback, not decoration.** Use the existing `motion` lib + CSS keyframes for score
   ticks, win reveals, list entrance, tab transitions, streak fire. Respect
   `prefers-reduced-motion`.
6. **Outdoor-readable.** High contrast, large tap targets (min 44px, larger on tablet courtside),
   bright surfaces.

---

## Workstream A — Foundation (do first; everything depends on it)

### A1. Fix the token system in `picklepal/src/app/globals.css`
- Collapse the two conflicting `@theme` blocks into one coherent token set. Keep the **DinkDay**
  values as the winners: court-tinted surfaces (`#f8fff9`), Outfit/Archivo/Anton fonts.
- **Set `--font-sans` to Outfit** (or change `body` font-family to `var(--font-body)`) so the
  whole app stops rendering in Geist.
- Reconcile duplicated tokens that resolve to different values: `--color-primary`
  (`#2D8B4E` vs `#087a45`), `--color-surface` (`#FFFFFF` vs `#f8fff9`), and the slate neutral
  ramp (`--color-border`, `--color-text-*`). Decide one source of truth that matches
  `DESIGN.md`/brand kit, and re-tint borders/text away from cold slate toward warm
  green-neutral (e.g. `--color-border` from `#E2E8F0` → an `outline-variant` green-gray).
- Keep `court-green`, `sky-blue`, `ball-yellow`, `hype-orange` named tokens (used by existing
  animations) and add `celebration`/gold as a first-class content color.
- Add a `team-a` / `team-b` color pair token for match displays.

### A2. Add shared utilities/animations (in `globals.css` `@layer utilities`)
- Keep `court-lines`, `clip-diagonal`, fire/streak/bounce keyframes (already good).
- Add: `score-tick` (count-up emphasis), `win-pop`, `fade-rise` (list entrance), a gold
  `winner-accent` bar helper, and a `prefers-reduced-motion` guard that disables nonessential
  keyframes.

### A3. Build a small reusable primitive set in `picklepal/src/components/ui/`
(None exist today — no shadcn/Radix. Build custom, Tailwind-only, matching DESIGN.md.)
- `Button.tsx` — court-green primary w/ trailing icon, sky-blue secondary, ghost, sizes
  (incl. a large "courtside" size for tablet).
- `Card.tsx` / `Section.tsx` — replaces the ad-hoc `rounded-xl border border-border bg-surface`
  pattern; variants: plain, accented (left color bar), color-blocked (green/blue), elevated.
- `SectionHeader.tsx` — replaces the bureaucratic `uppercase tracking-wide text-text-muted`
  headers with a friendlier sporty header (Outfit, optional icon, optional action).
- `ScoreboardCard.tsx` — dark high-contrast scoreboard with Archivo Narrow numerals + gold
  winner accent (DESIGN.md pattern); used in history, results, live, profile.
- `StatTile.tsx` — replaces the LMS `StatBox` 4-up grid with a sportier stat display (big
  Archivo numeral, colored label, optional trend/medal).
- `Chip.tsx` / `Pill.tsx` — sky-blue tinted filter/status chips.
- `RankBadge.tsx` — consolidate the medal/number badge logic used in several files.
- `AnimatedNumber.tsx` — count-up wrapper (uses `motion`) for scores/stats.
- Reuse existing `PlayerAvatar.tsx` (already solid) and `icons/NavIcons.tsx`.

Add a short `picklepal/src/components/ui/README` or extend `DESIGN.md` with usage examples so
later screens compose primitives instead of re-inventing classes.

---

## Workstream B — 7a: App shell & navigation

Files: `src/app/g/[slug]/layout.tsx`, `src/components/navigation/DesktopNav.tsx`,
`src/components/navigation/BottomNav.tsx`, `src/app/layout.tsx`.
- Rebrand the header: DinkDay wordmark treatment (Anton/Outfit), court-line motif, not a plain
  text link. Mobile sticky header + desktop sidebar share the brand block.
- Sporty active-state for nav: court-green pill with subtle animation on the active item
  (motion layout transition between tabs); larger touch targets on tablet.
- Bottom nav: animated active indicator, safe-area padding (already present), icon+label polish.
- "Game Day Active" indicator → make it a lively pulsing court-green pill (it exists; restyle).
- Ensure clarity at 375px / tablet / desktop; current route obvious (AC from launch plan §7a).

---

## Workstream C — 7b: Group home / dashboard

Files: `src/app/g/[slug]/page.tsx` and `dashboard/` (`HeroSection.tsx`, `StatsHighlights.tsx`,
`LeaderboardPreview.tsx`, `RecentMatches.tsx`, `EmptyDashboard.tsx`, `DashboardSkeleton.tsx`).
- Keep the hero but make it the brand anchor (color-blocked, court-line texture, Anton wordline,
  "Start Game Day" primary CTA with trailing icon). Carry that energy *below the fold*.
- `StatsHighlights` (Top player / Hottest duo / Latest MVP) → celebratory tiles using gold
  accent, medal/trophy icons, player avatars, and entrance animation — these are the
  "personality" moments the brand kit calls out.
- `LeaderboardPreview` + `RecentMatches` → rebuild on `Section`/`ScoreboardCard`; show team
  colors and winner emphasis instead of monochrome rows.
- `EmptyDashboard` → friendly, on-brand empty state (see Workstream G).

---

## Workstream D — 7c: Live flow (tablet-courtside priority within balanced target)

Files in `src/app/g/[slug]/live/`: `LivePageClient.tsx` (3-col desktop shell, actively edited),
`LiveScoring.tsx`, `MatchQueue.tsx`, `PositionConfirmation.tsx`, `MatchResult.tsx`,
`ActiveSession.tsx`, `ActiveMatchBanner.tsx`, `GameDayRecap.tsx`, `StartSessionForm.tsx`,
`SessionPlayerList.tsx`, `ViewOnlyScoring.tsx`.
- **Scoring screen:** big outdoor-readable score using `ScoreboardCard`/`AnimatedNumber`; large
  courtside tap targets; clear server indicator; court visualization with players on court
  (court-lines bg). Score changes animate (tick + bounce — reuse `scorer-bounce`).
- **Result screen / recap:** the celebration peak — allow a bolder editorial moment (color
  blocking, win-pop, gold MVP crown, shareable overlay via existing `share/OverlayRenderer.tsx`).
- **Queue / position confirm / session setup:** list-not-box styling, team colors, clear CTAs.
- Preserve all existing scoring logic and server actions (`*-actions.ts`) — **visual/layout only**.
- Don't regress the in-progress edits in `LivePageClient.tsx`; review current diff first.

---

## Workstream E — 7d: Board, history, players, sessions

- **Board** (`board/page.tsx`, `LeaderboardTable.tsx`): keep a table on desktop (dense review is
  fine there) but re-skin — sporty header, `RankBadge` medals, win% as a colored bar/figure,
  +/− color-coded, winner-tinted top rows. **Mobile: replace the table with stacked rank cards**
  (avatar + big rank + key stats) so it scans like a sports app, not a spreadsheet.
- **History** (`history/page.tsx`, `MatchHistory.tsx`): session-grouped feed of
  `ScoreboardCard`s with team colors + winner gold accent + match-type chip; relative time.
- **Players** (`players/page.tsx`, `PlayerCard.tsx`, `AddPlayerForm.tsx`): roster as lively player
  chips/cards (avatar identity, quick stat, team color), not plain bordered rows.
- **Player profile** (`players/[id]/PlayerProfile.tsx`): replace the 4-up `StatBox` grid with
  `StatTile`s; recent matches + partner stats as `ScoreboardCard`s; a small profile hero.
- **Sessions** (`sessions/`): session detail rebuilt on the same primitives.

## Workstream F — Animation pass (cross-cutting, sporty-but-tasteful)

- Use the installed `motion@12` lib. Patterns: list/card entrance (`fade-rise`, staggered), score
  count-up, win reveal/pop on results, nav active-indicator layout animation, tab/page
  transitions, streak fire on hot players (reuse existing fire classes).
- Centralize timings/easings as tokens or a tiny `lib/motion.ts` so motion feels consistent.
- Gate nonessential motion behind `prefers-reduced-motion`.

## Workstream G — 7e: Loading, empty, error states

Files: `g/[slug]/loading.tsx`, `dashboard/DashboardSkeleton.tsx`, `EmptyDashboard.tsx`,
`g/[slug]/not-found.tsx`, plus add error boundaries + a toast pattern.
- Branded skeletons (court-tinted shimmer, not gray) reusing the new primitives' shapes.
- Friendly on-brand empty states with a clear next action ("Create Your Group", "Start Game Day")
  per brand voice — not blank panels.
- Error boundaries + toasts that say what to do next (AC §7e).

---

## Suggested execution order

1. **A** (tokens + utilities + primitives) — unblocks everything; immediately makes the app feel
   different once the font/palette conflict is resolved.
2. **B** (shell/nav) — sets the frame the user sees on every screen.
3. **C** (group home) — highest first-impression impact.
4. **D** (live flow) — the core game-day experience.
5. **E** (board/history/players/sessions).
6. **F + G** (animation polish + states) — layered in as screens land.

Workstreams C/D/E can be parallelized across screens once A is done, since they all compose the
same primitives.

---

## Critical files

- `picklepal/src/app/globals.css` — **token consolidation + font fix + utilities** (root cause).
- `picklepal/src/components/ui/*` — **new** primitive set (Button, Card/Section, SectionHeader,
  ScoreboardCard, StatTile, Chip, RankBadge, AnimatedNumber).
- `picklepal/src/components/navigation/{DesktopNav,BottomNav}.tsx`, `src/app/g/[slug]/layout.tsx`,
  `src/app/layout.tsx` — shell/nav.
- `picklepal/src/app/g/[slug]/dashboard/*` — group home.
- `picklepal/src/app/g/[slug]/live/*` — live flow (logic untouched; visual only).
- `picklepal/src/app/g/[slug]/{board,history,players,sessions}/*` — data screens.
- `picklepal/DESIGN.md` — extend with primitive usage examples as the living spec.

Reuse, don't rebuild: `PlayerAvatar.tsx`, `icons/NavIcons.tsx`, `share/OverlayRenderer.tsx`,
existing fire/bounce keyframes, the `motion` and `lucide-react` deps already installed.

---

## Verification

- **Visual/manual (primary):** run `pnpm dev` in `picklepal/`; walk each refreshed route at three
  widths — **375px phone, ~820px tablet, desktop** — confirming: Outfit/Archivo render (no Geist),
  no cold gray-border SaaS cards, team colors + winner emphasis show, nav active state + score/win
  animations work, courtside controls are large/readable. Screenshot before/after per screen.
- **Brand check:** compare against `DINKDAY-BRAND-KIT.md` guardrails (no SaaS admin feel, no gray
  card stacks, bright/social/courtside-ready) and `DESIGN.md` patterns.
- **Reduced motion:** toggle OS "reduce motion" and confirm nonessential animation stops.
- **Regression:** existing Vitest unit tests (scoring engine) must still pass — `pnpm test`. This
  refresh must not touch scoring logic or server actions. Run Playwright E2E (`pnpm e2e` or
  configured script) to confirm flows (start session → score → result → save) still work.
- **Accessibility/contrast:** spot-check contrast on color-blocked sections and gold-on-light.

## Risks / notes

- The in-progress edit to `LivePageClient.tsx` (and `docs/PICKLEPAL-V2-LAUNCH-PLAN.md`) is
  uncommitted — review/coordinate with that diff before refactoring live.
- Tailwind v4 (no `tailwind.config.js`) means all tokens live in `globals.css` `@theme`; changing
  a token name ripples through `bg-*`/`text-*`/`border-*` usages — grep before renaming.
- Keep scope visual: do not alter data models, server actions, or the pure scoring engine.
