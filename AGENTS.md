# AGENTS.md — PicklePal Project Context

> This file gives any AI agent or chat session full context to work on this project effectively.
> Read this first before making changes.

---

## What Is PicklePal?

**PicklePal** is a mobile/tablet-first pickleball web app for a friend group. It provides:

- **Live scoring** — official traditional pickleball side-out scoring, operated courtside
- **Fair rotations** — balanced matchup generation with sit-out rotation
- **Persistent rankings** — leaderboard derived from all completed matches
- **Session awards** — MVP of the Day, Hottest Duo, Best Match
- **Share cards** — Instagram-story-style Game Day recap images

**Identity:** "PicklePal — The scoreboard for your pickleball crew."

**Target users:** One friend group (V1), with a `Group` boundary in the data model for future multi-group support.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) + React + TypeScript (strict) |
| Styling | Tailwind CSS + shadcn-style component patterns |
| Database | Supabase Postgres |
| Backend | Next.js server actions / route handlers |
| Deployment | Vercel |
| Image generation | Browser-rendered HTML/Canvas → PNG export |
| Auth model | Public read, host PIN for writes (no user accounts) |
| Offline support | Active-game local event queue + sync retry |
| Package manager | pnpm |
| Testing | Vitest (unit), Playwright (E2E) |

---

## Project Structure

```
pickleball/
├── AGENTS.md                    # ← You are here
├── docs/
│   ├── DEVELOPMENT-PLAN.md      # Detailed 8-phase build plan with subphases
│   └── superpowers/specs/
│       └── 2026-05-29-picklepal-v1-design.md  # Full product design spec
├── .kiro/
│   └── steering/                # AI steering files (coding style, patterns, etc.)
│       ├── coding-style.md
│       ├── development-workflow.md
│       ├── git-workflow.md
│       ├── patterns.md
│       ├── testing.md
│       ├── security.md
│       ├── lessons-learned.md
│       ├── typescript-patterns.md
│       └── ui-ux-pro-max/       # Design intelligence skill (styles, colors, typography)
└── src/                         # (to be created in Phase 1a)
    ├── app/g/[slug]/            # Next.js routes (group-scoped)
    ├── components/              # Shared UI components
    ├── lib/
    │   ├── engine/              # Pure TS scoring engine (NO React, NO DB)
    │   ├── matchmaking/         # Fair random matchup generator
    │   ├── stats/               # Derived leaderboard, awards
    │   ├── supabase/            # DB client (server + browser)
    │   └── offline/             # Local event queue + sync
    ├── hooks/                   # React hooks
    └── styles/                  # Global CSS
```

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/superpowers/specs/2026-05-29-picklepal-v1-design.md` | **Full product spec** — scope, data model, scoring rules, UI direction, access model |
| `docs/DEVELOPMENT-PLAN.md` | **Build plan** — 8 phases, 34 subphases, dependencies, acceptance criteria |
| `.kiro/steering/coding-style.md` | Immutability rules, file organization, error handling |
| `.kiro/steering/patterns.md` | Repository pattern, API response format, skeleton approach |
| `.kiro/steering/testing.md` | Testing requirements (80% coverage, TDD workflow) |
| `.kiro/steering/security.md` | Security practices |

---

## Architecture Principles

### 1. Scoring Engine Is Pure TypeScript

The scoring engine (`src/lib/engine/`) has **zero dependencies** on React, the database, or any framework. It is:

- **Pure functions** — `processRally(state, rallyWinner) → newState`
- **Immutable** — never mutates input state, always returns new objects
- **Testable in isolation** — unit tests run without any infrastructure
- **The highest-risk piece** — must be proven correct before UI work

### 2. Matches Are the Source of Truth

- Leaderboards, player stats, duo stats, and awards are **derived** from completed matches
- Nothing is stored as "permanent truth" except match records and rally events
- If performance requires caching later, caches must be rebuildable from matches

### 3. Append-Only Rally Events

- Every rally produces a `RallyEvent` appended to the match history
- Undo = pop the last event and recompute state
- Enables: undo, replay, audit trail, offline queue, future analytics

### 4. Public Read, PIN-Protected Write

- All viewing is frictionless (no login)
- Write actions (scoring, session management, player edits) require a host PIN
- PIN is verified server-side against a hash, then remembered in the browser for a session

### 5. Offline-Resilient (Not Offline-First)

- If the scoring screen is already open, it continues working when internet drops
- Rally events queue locally and sync when connection returns
- One device is the scorer — no multi-device conflict resolution in V1

---

## Data Model (Key Entities)

```
Group → Players → Sessions → Matches → RallyEvents
                                     → MatchQueueItems
                           → RecapCards
```

- **Group** — the friend group (has `hostPinHash`)
- **Player** — roster entry (not a user account), has `displayName`, `color`, `isActive`
- **Session** — a Game Day (status: active/completed/cancelled)
- **Match** — singles or doubles game (status: queued/active/completed/cancelled)
- **RallyEvent** — append-only record of each rally (sequence number, scores, server state)
- **MatchQueueItem** — upcoming match queue for a session
- **RecapCard** — generated share card config for a completed session

---

## Scoring Rules (Critical Domain Logic)

### Doubles (Default)

- **Side-out scoring** — only the serving team can score
- **First-service-sequence** — game starts at 0-0-2 (only one server before first side-out)
- **Server rotation** — server 1 → server 2 → side-out → other team's server 1
- **Position swaps** — serving team players swap sides when they score
- **Win condition** — first to target (default 11), must win by 2

### Singles

- **Side-out scoring** — only server scores
- **Court side** — determined by server's score parity (even = right, odd = left)
- **No server number** — always one server per side
- **Win condition** — same as doubles

### Game Settings (Host-Configurable)

- Match type: singles/doubles (default: doubles)
- Target score: 11 (configurable to 15, 21)
- Win by: 2 (configurable)
- Starting server: selectable

---

## Awards & Stats Formulas

### Leaderboard Ranking
```
Primary: win rate (qualified players only, min 3 games)
Tiebreaker 1: more games played
Tiebreaker 2: point differential
```

### MVP of the Day (Per Session)
```
MVP score = (session wins × 3) + session point differential + session games played
Eligibility: min 2 games in session
```

### Hottest Duo
```
Primary: duo win rate together (min 3 games together)
Tiebreaker 1: more wins together
Tiebreaker 2: duo point differential
```

### Best Match
```
Primary: lowest absolute score difference
Tiebreaker: highest combined score
```

---

## Matchmaking Rules

For **doubles** (4 players per match, rest sit):
- Balance games played during the session
- Minimize repeated teammates
- Minimize repeated opponent pairings
- Rotate sit-outs fairly (no one sits twice before everyone has sat once)

For **singles** (2 players per match):
- Avoid immediate rematches
- Balance games played
- Rotate sit-outs fairly

---

## Current Build Status

**Phase:** Planning (not yet started)  
**Next step:** Phase 1a — Next.js + TypeScript + Tailwind scaffold

See `docs/DEVELOPMENT-PLAN.md` for the full phase breakdown and recommended build order.

---

## Development Conventions

### Code Style (from steering files)

- **Immutability is critical** — never mutate, always return new objects
- **Small files** — 200–400 lines typical, 800 max
- **Small functions** — under 50 lines
- **No deep nesting** — max 4 levels
- **Explicit error handling** — never swallow errors silently
- **Validate at boundaries** — all user input, all external data

### Git Workflow

- Feature branches off `main`
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- PR required for merge to main
- Never push directly to main

### Testing

- Scoring engine: 95%+ coverage (unit tests, Vitest)
- Overall target: 80%+ coverage
- E2E: Playwright for the full Game Day flow
- Tests must pass before merge

---

## UI/UX Design Direction

- **Mobile/tablet-first**, responsive on desktop
- **Sporty, clean, social** — friendly at its core, competitive energy layered in
- **Court visualization** for live scoring with players in position
- **High-contrast** for outdoor readability (direct sunlight)
- **Green/blue sport palette** with white/light surfaces
- **Celebratory** post-game and recap screens
- **Desktop Live layout:** 3 columns (queue | court | leaderboard)

### Design System Tool

The project has **UI UX Pro Max** installed (`.kiro/steering/ui-ux-pro-max/`). Before building UI components, generate a design system:

```bash
python3 .kiro/steering/ui-ux-pro-max/scripts/search.py "pickleball sport social mobile scoring" --design-system -p "PicklePal"
```

---

## Navigation Structure

Mobile bottom nav:
```
Home | Live | Board | History | Players
```

Routes (all under `/g/[slug]/`):
- `/` — Home/Dashboard
- `/live` — Game Day loop (session, scoring)
- `/board` — Leaderboard
- `/history` — Match history
- `/players` — Roster
- `/players/[id]` — Player detail
- `/sessions/[id]` — Session detail
- `/sessions/[id]/recap` — Public recap page

---

## What's NOT in V1

- Individual user accounts / login wall
- Elo, DUPR, or skill ratings
- Tournament brackets
- Full offline-first (app launch without internet)
- Direct Instagram API posting
- Multi-device scoring for same match
- Advanced charts and social feeds

---

## Quick Reference for Common Tasks

### "I need to work on the scoring engine"
→ Read `docs/superpowers/specs/2026-05-29-picklepal-v1-design.md` § Scoring Rules  
→ Work in `src/lib/engine/` — pure TypeScript, no imports from React or Supabase  
→ Run tests with `pnpm test`

### "I need to add a new page/route"
→ Add under `src/app/g/[slug]/`  
→ Public pages need no auth gate  
→ Write actions need the PIN wrapper from `src/lib/utils/pin.ts`

### "I need to update the database schema"
→ Create a Supabase migration  
→ Update TypeScript types in `src/lib/supabase/types.ts`  
→ Ensure RLS: public SELECT, restricted writes

### "I need to work on the UI"
→ Run the design system generator first (see UI/UX section above)  
→ Use Tailwind + shadcn patterns  
→ Mobile-first, test at 375px minimum  
→ High contrast for outdoor use

### "I need to understand the Game Day flow"
→ Read the Core Game Day Flow in the design spec  
→ The Live screen owns the entire loop: start → select players → matchups → score → save → next

---

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `CourtView.tsx`, `RallyButton.tsx`)
- Utilities/lib: `camelCase.ts` (e.g., `engine.ts`, `leaderboard.ts`)
- Test files: `*.test.ts` colocated in `__tests__/` directories
- Types: colocated `types.ts` per module

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Server-only, for write operations
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle.

---

*Last updated: 2026-05-29*
