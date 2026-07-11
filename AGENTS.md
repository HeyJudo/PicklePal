# AGENTS.md — DinkDay (PicklePal) Project Context

> Full project context for any AI agent or chat session. Read this before making changes.
> For workflow rules (git, planning, testing policy), see `CLAUDE.md`.

---

## What Is This?

**DinkDay** (internal codename: PicklePal) is a mobile/tablet-first pickleball web app, live at **dinkday.site**. Tagline: *"Game day, handled."*

- **Live scoring** — official traditional pickleball side-out scoring, operated courtside, with scorer lock/takeover and offline rally queue
- **Fair matchmaking** — deterministic, balanced matchup generation with sit-out rotation
- **Persistent rankings** — leaderboard derived from all completed matches
- **Belts** — title-holder reign system (King of the Kitchen, Poacher, Pickler)
- **Session recaps & awards** — MVP of the Day, Hottest Duo, Best Match, animated Game Day recap
- **Manual past matches** — admins can log matches played without live scoring
- **Groups** — organizers own one or more groups; groups are public-link or private

**Users:** organizers/admins have Clerk accounts; players are account-less roster records.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS 4, motion (Framer Motion) for animation |
| Auth | Clerk (`@clerk/nextjs`) — organizer/admin accounts only |
| Database | Supabase Postgres (service-role client server-side; RLS for public reads) |
| Backend | Next.js server actions (the write boundary) |
| Deployment | Vercel (production: dinkday.site) |
| Monitoring | Sentry (opt-in via env), Vercel Analytics + Speed Insights |
| Share images | html2canvas → PNG export |
| Package manager | pnpm |
| Testing | Vitest (unit). Playwright is a devDependency but has no config/specs yet |

---

## Project Structure

```
pickleball/
├── AGENTS.md                        # ← You are here
├── CLAUDE.md                        # Workflow rules for Claude Code
├── docs/
│   ├── PICKLEPAL-V2-LAUNCH-PLAN.md  # V2 launch plan (Phases 0–10)
│   ├── DINKDAY-BRAND-KIT.md         # Brand: naming, palette, voice
│   ├── audits/                      # Phase 0 baseline audits
│   └── superpowers/specs/           # Original V1 product design spec
├── .kiro/steering/                  # AI steering files (style, patterns, testing)
└── picklepal/                       # The Next.js app
    ├── supabase/migrations/         # 001–017 (numbered SQL migrations)
    ├── scripts/backup-baseline.mjs  # DB backup script
    └── src/
        ├── middleware.ts            # clerkMiddleware — protects /app and /onboarding only
        ├── app/                     # Routes (see Route Map below)
        ├── components/              # Shared UI components
        ├── hooks/                   # React hooks
        └── lib/                     # Domain logic (see Modules below)
```

### `src/lib/` Modules

| Module | Purpose |
|--------|---------|
| `engine/` | Pure scoring state machine (`createMatch`, `processRally`, `undo`) — no React, no DB |
| `matchmaking/` | Pure, deterministic matchup + sit-out generator (hash-seeded, replayable) |
| `stats/` | Derived leaderboard, player/duo/rivalry stats, streaks, awards |
| `belts/` | Belt reign computation (`recomputeBelts.ts`) into `belt_reigns` table |
| `auth/` | `authorizeGroupWrite` / `authorizeGroupRead` / `getViewerAccess` — the write gate |
| `membership/` | Clerk profile ↔ `group_memberships` CRUD, owner/admin checks |
| `invites/` | Admin invites (email + open link, hashed tokens, accept/revoke/expire) |
| `privacy/` | Group `privacy_mode` (`public_link` \| `private`) + view checks |
| `matches/` | Manual match score/date validation |
| `sessions/` | Manual-bucket session creation for past matches (one per group per date) |
| `offline/` | localStorage rally queue, sync status, crash recovery for live scoring |
| `format/` | Shared duration/clock formatting |
| `supabase/` | Client factories (server + browser) and generated `Database` types |

---

## Route Map

```
/                         Public landing page
/sign-in, /sign-up        Clerk
/onboarding               First-group creation flow (protected)
/app                      "My Groups" dashboard (protected)
/invite/[token]           Invite acceptance
/g/[slug]/                Group home (public read, gated by privacy mode)
  /dashboard              Hero, leaderboard preview, recent matches
  /live                   Game Day loop: session → players → matchups → scoring → recap
  /board                  Leaderboard
  /history                Match history + "Add Match" (manual past matches)
  /players, /players/[id] Roster and player profiles
  /sessions/[id]          Session detail
  /belts                  Belt reigns
  /settings               Group info, game defaults, privacy, members, invites
/api/belts/backfill       Belt backfill endpoint
```

---

## Auth & Access Model (V2 — replaced the V1 host PIN)

- **Middleware** only protects `/app` and `/onboarding`. Group pages are open at the middleware layer.
- **Reads:** gated in-app per group `privacy_mode` — `public_link` groups are viewable by anyone with the URL; `private` groups require membership (`getViewerAccess`, `PrivateGroupGate`).
- **Writes:** every write server action starts with `authorizeGroupWrite()` from `src/lib/auth` — resolves the group, checks Clerk `currentUser()`, requires `owner` or `admin` membership. The old `host_pin_hash` was dropped in migration 010.
- **Roles:** `owner` and `admin` only. Players are not users.
- Server actions use the Supabase service-role client (bypasses RLS), so **the auth check in the action is the security boundary** — never skip it.

---

## Architecture Principles

1. **Scoring engine is pure TypeScript** — `src/lib/engine/` has zero React/DB dependencies. Pure, immutable functions; the highest-risk domain logic; keep coverage high.
2. **Matches are the source of truth** — leaderboards, stats, awards, and belts are all derived from completed matches. Belt reigns are a rebuildable cache (`recomputeBelts` + backfill route).
3. **Append-only rally events** — every rally appends a `RallyEvent`; undo pops and recomputes. Enables replay, audit, and the offline queue.
4. **Deterministic matchmaking** — seeded by hash (`sessionId:round:playerId`), never `Math.random()`, so matchups are reproducible from state.
5. **Offline-resilient, not offline-first** — an open scoring screen keeps working through connection drops (localStorage queue + sync retry). One scorer device at a time, enforced by scorer lock + heartbeat (stale after ~30s → takeover allowed).

---

## Data Model (Key Entities)

```
profiles (Clerk users) → group_memberships (owner|admin) → groups
groups → players → sessions → matches → rally events
      → admin_invites                 → belt_reigns
```

- **Group** — has `slug`, `privacy_mode`, game-default settings
- **Player** — roster entry (not an account): `displayName`, `color`, `isActive`
- **Session** — a Game Day; `source` may be `manual_bucket` (auto-created per group/date for manual matches)
- **Match** — singles/doubles; `played_at`, `duration_seconds`, active-match snapshot + `scorer_clerk_user_id` + `scorer_heartbeat_at` for live scoring
- **BeltReign** — time-ranged title holds per belt type

Migrations live in `picklepal/supabase/migrations/` (numbered, currently 001–017). Schema changes = new numbered migration + update `src/lib/supabase/types.ts`.

---

## Scoring Rules (Critical Domain Logic)

### Doubles (default)
- Side-out scoring — only the serving team scores
- First-service sequence — game starts 0-0-2
- Server rotation: server 1 → server 2 → side-out → other team's server 1
- Serving team players swap sides when they score
- Win: first to target (default 11), win by 2

### Singles
- Side-out scoring; server's score parity determines court side (even = right)
- Win condition same as doubles

Host-configurable per group/match: singles/doubles, target score (11/15/21), win-by, starting server.

---

## Stats & Awards Formulas

- **Leaderboard:** win rate (min 3 games) → games played → point differential
- **MVP of the Day:** `(session wins × 3) + point diff + games played`, min 2 games
- **Hottest Duo:** duo win rate (min 3 games together) → wins → point diff
- **Best Match:** lowest score difference → highest combined score
- **Belts:** King of the Kitchen, Poacher, Pickler — derived title reigns, see `src/lib/belts/`

---

## Current Status (as of 2026-07-03)

V2 launch plan (`docs/PICKLEPAL-V2-LAUNCH-PLAN.md`) Phases 0–5 are **done** (brand, Clerk auth, memberships/invites/privacy, PIN removal, multi-group). Phases 6–8 (live-scoring resilience, UX refresh, manual past matches) are **largely implemented** — the plan doc's checkmarks lag the code. Phases 9–10 (recap/SEO refresh, launch hardening incl. Playwright E2E) are **pending**.

Active branch: `feat/smarter-matchmaking` — rewritten matchmaking engine for smarter sit-out rotation and queueing.

---

## Testing (Actual State)

- Vitest unit tests, colocated in `__tests__/` dirs (~11 files, ~146 tests)
- Well covered: `engine/` (doubles, singles, undo, edge cases), `offline/`, `matchmaking/`, `matches/validation`, history session summary
- Thin: `stats/` (only `rivalryStats` has direct tests)
- Playwright: installed but **no config or specs exist yet** (planned for Phase 10)
- Run: `pnpm test` (from `picklepal/`)

---

## Environment Variables

See `picklepal/.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never in client bundle
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
# Optional — Sentry disabled when unset:
NEXT_PUBLIC_SENTRY_DSN= / SENTRY_DSN= / SENTRY_ORG= / SENTRY_PROJECT= / SENTRY_AUTH_TOKEN=
```

---

## Quick Reference for Common Tasks

- **Scoring engine** → `src/lib/engine/`, pure TS only, no React/Supabase imports. `pnpm test` must stay green.
- **New group page/route** → under `src/app/g/[slug]/`. Reads: check `getViewerAccess`. Writes: server action starting with `authorizeGroupWrite()`.
- **Schema change** → new numbered migration in `picklepal/supabase/migrations/` + update `src/lib/supabase/types.ts`. Public read via RLS; writes go through service-role server actions.
- **UI work** → Tailwind, mobile-first (test at 375px), high contrast for outdoor use, DinkDay palette per `docs/DINKDAY-BRAND-KIT.md` (court green + sky blue, warm-yellow celebration accent).
- **Stats/awards change** → `src/lib/stats/`; remember belts may need `recomputeBelts`/backfill after formula changes.

---

## What's NOT in Scope (V2 non-goals)

- Player accounts (players stay roster records)
- Clerk Organizations, billing
- Elo/DUPR ratings, tournament brackets
- Full offline-first app launch
- Multi-device scoring of the same match
- Public group directory

---

## File Naming Conventions

- Components: `PascalCase.tsx` — Utilities/lib: `camelCase.ts`
- Tests: `*.test.ts` in colocated `__tests__/` dirs
- Types: colocated `types.ts` per module

---

*Last updated: 2026-07-03*
