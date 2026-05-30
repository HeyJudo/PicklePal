# PicklePal Development Plan

Date: 2026-05-29  
Status: Planning

## Status Legend

| Icon | Meaning |
|------|---------|
| 🔲 | Not started |
| 🟡 | In progress |
| ✅ | Complete |
| ⏸️ | Blocked/paused |

## Overview

PicklePal is a mobile/tablet-first pickleball web app for a friend group. This plan breaks the build into 8 phases with 34 granular subphases, each completable in 1–3 focused sessions. The scoring engine is treated as the highest-risk piece and is proven early. UI work follows once logic is solid.

**First Checkpoint Goal:** Host can create players → start a session → generate one match → score it live → save the result → see the leaderboard update.

---

## Phase Map & Dependencies

```
Phase 1: Project Foundation
  └─> Phase 2: Data Model
        ├─> Phase 3: Scoring Rules Engine (highest risk, no UI dependency)
        │     └─> Phase 4: Game Day Loop (combines 2 + 3)
        │           └─> ★ FIRST CHECKPOINT ★
        │                 └─> Phase 5: Stats & History
        │                       ├─> Phase 6B: Home Dashboard (sporty group landing page)
        │                       └─> Phase 7: Share Cards
        └─> Phase 6: Offline-Resilient Scoring (can start after Phase 4)
Phase 8: Visual Polish & QA (runs last, touches everything)
```

---

## Phase 1: Project Foundation

### 1a. Next.js + TypeScript + Tailwind Scaffold

**Status:** ✅ Complete 
**Effort:** Small  
**Dependencies:** None  
**Deliverables:**
- Next.js 14+ app with App Router, TypeScript strict mode
- Tailwind CSS configured with custom sport-themed color palette
- ESLint + Prettier configured
- Project folder structure established:
  ```
  src/
    app/           # Next.js routes
    components/    # Shared UI components
    lib/           # Utilities, engine, types
    hooks/         # Custom React hooks
    styles/        # Global styles
  ```
- `pnpm dev` runs without errors
- Deployed to Vercel (empty shell)

**Acceptance Criteria:**
- [ ] `pnpm dev` starts successfully
- [ ] TypeScript strict mode enabled, no errors
- [ ] Tailwind classes render correctly
- [ ] Vercel preview deployment works

---

### 1b. App Shell & Navigation

**Status:** ✅ Complete  
**Effort:** Small  
**Dependencies:** 1a  
**Deliverables:**
- Mobile bottom navigation: Home | Live | Board | History | Players
- Basic page stubs for each route
- Responsive layout wrapper (mobile-first, tablet, desktop)
- App metadata (title, favicon, viewport)

**Acceptance Criteria:**
- [ ] Bottom nav visible on mobile, adapts on desktop
- [ ] All 5 routes render their stub pages
- [ ] Navigation highlights active route
- [ ] Viewport meta tag set for mobile

---

### 1c. Supabase Setup & Public Group Route

**Status:** ✅ Complete 
**Effort:** Small  
**Dependencies:** 1a  
**Deliverables:**
- Supabase project created
- Supabase client configured (server + client)
- Environment variables set up (`.env.local`)
- Single default group seeded
- Public route: `/g/[slug]` resolves to group

**Acceptance Criteria:**
- [ ] Supabase connection works from server actions
- [ ] `/g/default` returns group data
- [ ] Environment variables not exposed to client bundle

---

### 1d. Host PIN Write Protection

**Status:** ✅ Complete  
**Effort:** Medium  
**Dependencies:** 1c  
**Deliverables:**
- PIN entry modal component
- Server-side PIN verification (compare hashed PIN)
- Browser session storage of host permission (cookie or localStorage with expiry)
- Middleware or wrapper that gates write actions
- PIN only requested on first write attempt per browser session

**Acceptance Criteria:**
- [ ] Incorrect PIN shows error, blocks action
- [ ] Correct PIN grants access, remembered for session
- [ ] PIN hash stored in DB, never plaintext
- [ ] After clearing storage, PIN is re-requested

---

## Phase 2: Data Model

### 2a. Core Tables & RLS

**Status:** ✅ Complete
**Effort:** Medium  
**Dependencies:** 1c  
**Deliverables:**
- Supabase migrations for all tables: groups, players, sessions, matches, rally_events, match_queue_items, recap_cards
- Row Level Security: public read, write requires authenticated service role
- TypeScript types generated or manually defined for all tables

**Acceptance Criteria:**
- [ ] All tables created with correct columns and constraints
- [ ] Foreign keys enforce referential integrity
- [ ] RLS policies allow public SELECT, restrict INSERT/UPDATE/DELETE
- [ ] TypeScript types match DB schema exactly

---

### 2b. Seed Data & Demo Group 

**Status:** ✅ Complete 
**Effort:** Small  
**Dependencies:** 2a  
**Deliverables:**
- Seed script: 1 group, 6–8 players, 1 completed session with 4–5 matches
- Script is idempotent (can re-run safely)

**Acceptance Criteria:**
- [ ] Seed script runs without errors
- [ ] Data visible in Supabase dashboard
- [ ] Re-running doesn't duplicate data

---

### 2c. Derived Stats Functions

**Status:** 🔲✅ Complete  
**Effort:** Medium  
**Dependencies:** 2a  
**Deliverables:**
- `getLeaderboard(groupId)` — win rate, games, point diff, min-games filter
- `getPlayerStats(playerId)` — wins, losses, win rate, point diff, recent form
- `getDuoStats(groupId)` — all duo pairings with win rate together
- `getSessionSummary(sessionId)` — games played, players, duration

**Acceptance Criteria:**
- [ ] Leaderboard correctly ranks by win rate with tiebreakers
- [ ] Players below 3 games marked as unqualified
- [ ] Duo stats correctly pair players and calculate shared record
- [ ] Functions return correct results against seed data

---

### 2d. Match Correction & Deletion

**Status:** ✅ Complete  
**Effort:** Small  
**Dependencies:** 2a, 1d  
**Deliverables:**
- Server action: correct match scores
- Server action: delete/cancel match (soft delete)
- Server action: re-derive stats after correction
- All behind host PIN protection

**Acceptance Criteria:**
- [ ] Correcting a match updates leaderboard
- [ ] Cancelling a match removes it from stats
- [ ] Only host-authenticated requests succeed

---

## Phase 3: Scoring Rules Engine

> **Highest-risk phase.** Pure TypeScript, no UI, no DB. Proven with unit tests before integration.

### 3a. Core Types & State Machine

**Status:** ✅ Complete  
**Effort:** Medium  
**Dependencies:** None (pure TS, can start alongside Phase 2)  
**Deliverables:**
- `src/lib/engine/types.ts` — MatchState, MatchConfig, RallyResult, Team, ServerState
- `src/lib/engine/engine.ts` — createMatch, processRally, isMatchComplete, getMatchResult
- Immutable state transitions (no mutation)

**Acceptance Criteria:**
- [ ] `createMatch` returns valid initial state for singles and doubles
- [ ] `processRally` returns new state without mutating input
- [ ] State includes all required fields (scores, server, positions)

---

### 3b. Doubles Scoring Logic

**Status:** ✅ Complete  
**Effort:** Large  
**Dependencies:** 3a  
**Deliverables:**
- First-service-sequence exception (game starts at 0-0-2)
- Side-out scoring: only serving team scores
- Server rotation: server 1 → server 2 → side-out
- Court position swaps on scoring
- Win condition: target score + win-by-2

**Acceptance Criteria:**
- [ ] First rally: if serving team loses, side-out (no server 2)
- [ ] Serving team wins → score increments, server switches court side
- [ ] Server 1 loses → advance to server 2
- [ ] Server 2 loses → side-out
- [ ] Game ends at target with 2+ point lead
- [ ] All transitions produce correct `currentServerPlayerId`

---

### 3c. Singles Scoring Logic

**Status:** ✅ Completed  
**Effort:** Medium  
**Dependencies:** 3a  
**Deliverables:**
- Side-out scoring for singles
- Server determined by score parity (even = right, odd = left)
- Win condition same as doubles

**Acceptance Criteria:**
- [ ] Server scores → point + stays, switches court side
- [ ] Server loses → side-out, receiver becomes server
- [ ] Court side follows server's score parity
- [ ] Game ends correctly at target with win-by margin

---

### 3d. Undo Support

**Status:** ✅ Completed  
**Effort:** Small  
**Dependencies:** 3b, 3c  
**Deliverables:**
- `undoRally(history)` — pops last rally, returns previous state
- Multiple undos supported (back to start)

**Acceptance Criteria:**
- [ ] Undo after 1 rally returns to initial state
- [ ] Undo after N rallies returns to state N-1
- [ ] Undo at initial state is a no-op

---

### 3e. Comprehensive Unit Tests

**Status:** ✅ Completed  
**Effort:** Medium  
**Dependencies:** 3b, 3c, 3d  
**Deliverables:**
- Test files for doubles, singles, and undo
- Cases: shutout, first-service-sequence, deuce, server rotation, position correctness, custom targets

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Coverage > 95% on engine files
- [ ] Edge cases verified
- [ ] No test relies on mutation

---

## Phase 4: Game Day Loop

### 4a. Start Session & Player Selection

**Status:** ✅ Completed  
**Effort:** Medium  
**Dependencies:** 2a, 1d  
**Deliverables:**
- "Start Game Day" button (PIN-protected)
- Session creation, present-player selection, mode selector, settings

**Acceptance Criteria:**
- [ ] Only one active session per group at a time
- [ ] Mode defaults to doubles, target 11, win-by 2
- [ ] Host can change settings before first match

---

### 4b. Matchup Generation & Bench Queue

**Status:** ✅ Completed 
**Effort:** Medium  
**Dependencies:** 4a  
**Deliverables:**
- Fair random matchup generator (balances games, minimizes repeats, rotates sit-outs)
- Bench queue display
- Regenerate option for host

**Acceptance Criteria:**
- [ ] With 6 players in doubles: 4 play, 2 sit
- [ ] No player sits twice before all have sat once
- [ ] Queue displays clearly who plays next

---

### 4c. Position Confirmation & Server Selection

**Status:** ✅ Completed  
**Effort:** Small  
**Dependencies:** 4b  
**Deliverables:**
- Pre-match screen: teams, positions, starting server
- Host can swap positions and change server
- "Start Match" creates match record

**Acceptance Criteria:**
- [ ] All players shown in position
- [ ] Positions swappable
- [ ] Match record created on confirmation

---

### 4d. Live Court Scoring Screen

**Status:** ✅ Completed   
**Effort:** Large  
**Dependencies:** 4c, 3b, 3c  
**Deliverables:**
- Court visualization with players in position
- Large score display, server indicator
- Rally-winner buttons + undo
- Real-time state updates via engine

**Acceptance Criteria:**
- [ ] Rally winner updates score correctly
- [ ] Server indicator moves correctly
- [ ] Undo reverts last rally
- [ ] Score is large and readable outdoors

---

### 4e. Match Completion & Result Screen

**Status:** ✅ Completed   
**Effort:** Medium  
**Dependencies:** 4d  
**Deliverables:**
- Auto-detect match complete → Winner/Loser screen
- Save match + rally events to DB
- "Next Match" advances queue

**Acceptance Criteria:**
- [ ] Match auto-ends when win condition met
- [ ] Result screen clearly shows winner
- [ ] Data persisted to Supabase
- [ ] Leaderboard reflects new result

---

### 4f. End Session

**Status:** ✅ Completed   
**Effort:** Small  
**Dependencies:** 4e  
**Deliverables:**
- "End Game Day" button (PIN-protected)
- Session → completed, basic summary
- Game Day Recap slideshow (Spotify Wrapped-style) on session end

**Acceptance Criteria:**
- [ ] Session marked completed
- [ ] No new matches can start
- [ ] Summary data accessible
- [ ] Recap slideshow shows after ending (tap-to-advance slides: summary, MVP, Hottest Duo, Best Match)
- [ ] Skip button available to bypass recap

---

### ★ FIRST CHECKPOINT ★

After Phase 4f:
```
Create players → Start session → Generate match → Score live → Save → Leaderboard updates
```

---

## Phase 5: Stats & History

### 5a. Persistent Leaderboard Page

**Status:** ✅ Completed   
**Effort:** Medium | **Dependencies:** 2c, 4e  
- Full leaderboard table with rank, W, L, GP, Win%, +/-
- Min-games qualifier, tiebreaker logic, responsive layout

### 5b. Player Stats Pages

**Status:** ✅ Completed 
**Effort:** Medium | **Dependencies:** 2c  
- Player profile, overall record, recent matches, partner stats

### 5c. Match History Page

**Status:** ✅ Completed 
**Effort:** Small | **Dependencies:** 2a  
- Chronological match list grouped by session, filterable

### 5d. Session Summaries & Awards

**Status:** ✅ Completed  
**Effort:** Medium | **Dependencies:** 2c, 4f  
- MVP of the Day, Hottest Duo, Best Match calculations and display
- Session detail page at `/g/[slug]/sessions/[id]` with awards cards
- Awards computation in `src/lib/stats/awards.ts`
- Game Day Recap slideshow triggered on "End Game Day" (see 4f)

---

## Phase 6: Offline-Resilient Scoring

### 6a. Local Rally Event Queue

**Status:** ✅ Complete  
**Effort:** Medium | **Dependencies:** 4d  
- Rally events saved locally first, scoring continues without network

### 6b. Sync Status & Retry

**Status:** ✅ Complete  
**Effort:** Medium | **Dependencies:** 6a  
- Visual sync indicator, background sync, retry with backoff

### 6c. Recovery After Reload

**Status:** ✅ Complete  
**Effort:** Medium | **Dependencies:** 6a, 6b  
- Rebuild match state from local events on reload, handle offline reload

---

## Phase 6B: Home Dashboard

> The group landing page — a sporty, at-a-glance dashboard that surfaces the most important data.  
> Contextual: shows active Game Day status when a session is live, otherwise shows group stats.

### 6B-a. Data Fetching & Server Actions

**Status:** ✅ Completed  
**Effort:** Small | **Dependencies:** 5a, 5d  
**Deliverables:**
- Server action to fetch dashboard data in one round-trip:
  - Active session status (if any)
  - Current #1 player (from leaderboard)
  - Hottest Duo (from duo stats)
  - Latest MVP of the Day (from most recent completed session awards)
  - Recent match results (last 5 matches)
  - Leaderboard top 5 preview
- Types for dashboard response

**Acceptance Criteria:**
- [ ] Single server action returns all dashboard data
- [ ] Handles empty state (no matches yet, no sessions)
- [ ] Handles active session state vs. idle state

---

### 6B-b. Hero Section & Active Session Banner

**Status:** 🔲 Not started  
**Effort:** Medium | **Dependencies:** 6B-a  
**Deliverables:**
- Sporty hero section with group name and tagline
- Active Game Day banner (when session is live):
  - Current match score or "Match in progress"
  - Quick-link to `/live`
  - Pulsing live indicator
- Idle state: "Start a Game Day" CTA for host

**Acceptance Criteria:**
- [ ] Hero feels sporty and energetic (bold typography, sport palette)
- [ ] Active session banner is prominent and links to Live
- [ ] Idle state shows inviting CTA
- [ ] Responsive on mobile (375px+)

---

### 6B-c. Stats Highlight Cards

**Status:** 🔲 Not started  
**Effort:** Medium | **Dependencies:** 6B-a  
**Deliverables:**
- #1 Player card (rank badge, name, win rate, games played)
- Hottest Duo card (two player names, duo win rate)
- Latest MVP card (player name, session date, MVP score)
- Card design: sporty with subtle gradients, player colors, trophy/medal icons

**Acceptance Criteria:**
- [ ] Cards are visually distinct and scannable
- [ ] Empty states handled gracefully (e.g., "Play 3+ games to unlock")
- [ ] Player colors used as accent
- [ ] No emoji icons — use SVG (Lucide)

---

### 6B-d. Leaderboard Preview & Recent Matches

**Status:** 🔲 Not started  
**Effort:** Medium | **Dependencies:** 6B-a  
**Deliverables:**
- Compact leaderboard (top 5) with "View Full Board →" link
- Recent matches list (last 5) with scores, players, time ago
- Match cards: winner highlighted, score prominent

**Acceptance Criteria:**
- [ ] Leaderboard preview matches full leaderboard styling
- [ ] Recent matches show enough context (who played, score, when)
- [ ] "View all" links navigate to respective pages
- [ ] Responsive grid layout (stacks on mobile, side-by-side on tablet+)

---

### 6B-e. Polish & Empty States

**Status:** 🔲 Not started  
**Effort:** Small | **Dependencies:** 6B-b, 6B-c, 6B-d  
**Deliverables:**
- Empty state for brand-new group (no matches, no sessions)
- Loading skeleton for dashboard
- Smooth transitions and micro-interactions
- High-contrast outdoor readability check

**Acceptance Criteria:**
- [ ] New group sees welcoming onboarding-style empty state
- [ ] Loading state doesn't flash or jump
- [ ] Passes contrast check for outdoor use
- [ ] Desktop layout uses available width well

---

## Phase 7: Share Cards

### 7a. Recap Card Layout & Rendering

**Status:** 🔲 Not started  
**Effort:** Large | **Dependencies:** 5d  
- 9:16 ratio, HTML → Canvas → PNG, all awards displayed

### 7b. Download & Share

**Status:** 🔲 Not started  
**Effort:** Small | **Dependencies:** 7a  
- Download PNG, Web Share API, fallback copy link

### 7c. Public Recap Page

**Status:** 🔲 Not started  
**Effort:** Small | **Dependencies:** 7a, 5d  
- Public URL with OG meta tags for link previews

---

## Phase 8: Visual Polish & QA

### 8a. Mobile/Tablet Court UI

**Status:** 🔲 Not started  
**Effort:** Large | **Dependencies:** 4d  
- Refined court, touch-optimized buttons, high-contrast outdoor readability

### 8b. Desktop Responsive Layout

**Status:** 🔲 Not started  
**Effort:** Medium | **Dependencies:** 8a  
- 3-column desktop Live view, all pages responsive

### 8c. Loading, Empty & Error States

**Status:** 🔲 Not started  
**Effort:** Medium | **Dependencies:** All previous  
- Skeletons, empty states with CTAs, error boundaries, toasts

### 8d. Browser Testing & Accessibility

**Status:** 🔲 Not started  
**Effort:** Medium | **Dependencies:** 8a, 8b, 8c  
- Cross-browser testing, WCAG AA compliance, keyboard nav

### 8e. Test Coverage & E2E

**Status:** 🔲 Not started  
**Effort:** Large | **Dependencies:** All previous  
- Unit + integration + Playwright E2E, 80%+ engine coverage

---

## Effort Summary

| Phase | Subphases | Effort |
|-------|-----------|--------|
| 1. Foundation | 4 | Small–Medium |
| 2. Data Model | 4 | Medium |
| 3. Scoring Engine | 5 | Large (highest risk) |
| 4. Game Day Loop | 6 | Large |
| 5. Stats & History | 4 | Medium |
| 6. Offline Scoring | 3 | Medium |
| 7. Share Cards | 3 | Medium |
| 8. Polish & QA | 5 | Large |

**Total subphases:** 34  
**First checkpoint after:** 15 subphases (Phases 1–4)

---

## Recommended Build Order

```
Week 1:  1a → 1b → 1c → 1d (Foundation complete)
Week 2:  3a → 3b → 3c (Engine core) + 2a → 2b (Tables, parallel)
Week 3:  3d → 3e (Undo + tests) + 2c → 2d (Stats + corrections, parallel)
Week 4:  4a → 4b → 4c (Session + matchups + confirmation)
Week 5:  4d → 4e → 4f (Live scoring + save + end)
         ★ FIRST CHECKPOINT ★
Week 6:  5a → 5b → 5c → 5d (Stats + awards)
Week 7:  6a → 6b → 6c (Offline resilience)
Week 8:  7a → 7b → 7c (Share cards)
Week 9:  8a → 8b → 8c (Visual polish)
Week 10: 8d → 8e (Testing + QA)
```

---

## Tech Decisions

| Decision | Rationale |
|----------|-----------|
| Pure TS engine, no React/DB coupling | Testable in isolation, portable |
| Append-only rally events | Enables undo, replay, audit, offline queue |
| Derived stats (not stored) | Single source of truth in matches |
| localStorage for offline queue | Simple, sufficient for single-device |
| HTML/Canvas for share cards | No server-side image generation needed |
| Host PIN (not full auth) | Minimal friction for friend group |
| Supabase RLS for access control | Public reads free, writes gated at DB level |

---

## File Structure

```
src/
├── app/g/[slug]/
│   ├── page.tsx              # Home/Dashboard
│   ├── live/page.tsx         # Game Day loop
│   ├── board/page.tsx        # Leaderboard
│   ├── history/page.tsx      # Match history
│   ├── players/[id]/page.tsx # Player detail
│   └── sessions/[id]/
│       ├── page.tsx          # Session detail
│       └── recap/page.tsx    # Public recap
├── components/
│   ├── court/                # Court visualization
│   ├── scoring/              # Rally buttons, score
│   ├── navigation/           # Bottom nav, layout
│   ├── leaderboard/          # Table, cards
│   ├── pin/                  # PIN modal
│   └── share/                # Recap card renderer
├── lib/
│   ├── engine/               # Scoring engine (pure TS)
│   ├── matchmaking/          # Fair random generator
│   ├── stats/                # Leaderboard, awards
│   ├── supabase/             # Client, server, types
│   ├── offline/              # Queue, sync
│   └── utils/                # PIN, helpers
├── hooks/                    # useMatch, useOfflineQueue, useHostAuth
└── styles/globals.css
```

---

*Living document — update phase statuses as work progresses.*
