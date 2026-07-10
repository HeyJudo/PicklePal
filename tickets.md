# Tickets: Tab Navigation Performance — Server-Side Caching & Query Optimization

Adds persistent server-side caching and DB query optimisations to eliminate the lag users
experience when switching between tabs in the group section (Dashboard, History, Leaderboard,
Belts). Source spec: `spec-tab-navigation-performance.md` in the Antigravity brain folder.

Work the **frontier**: any ticket whose blockers are all done. Tickets 3a–3d can all start in
parallel once Ticket 2 is merged.

---

## Ticket 1 — Optimise group section DB queries

**What to build:** Every group-section data-fetching function (Dashboard, History, Leaderboard,
Board belts, and Belts) runs its database queries in parallel where data dependencies allow, rather
than sequentially. All queries select only the columns they actually use instead of `select("*")`.
The Dashboard's "recent matches" preview fetches exactly 5 rows directly from the database (ordered
by completion date descending) rather than loading every completed match and slicing in JavaScript.
No change to the data returned or to the page UI — this is a pure performance prefactor.

**Blocked by:** None — can start immediately.

- [ ] Dashboard data fetch runs players and sessions queries in parallel after the group ID resolves
- [ ] Dashboard recent matches query fetches exactly 5 rows from the DB, not all matches sliced in JS
- [ ] History data fetch runs players and matches queries in parallel where possible
- [ ] Leaderboard data fetch runs players and sessions queries in parallel after group ID resolves
- [ ] Belts data fetch runs players and reigns queries in parallel after group ID resolves
- [ ] All affected queries use explicit column lists — no `select("*")` in the group section fetch functions
- [ ] `pnpm test` passes with no regressions

---

## Ticket 2 — Add persistent server-side caching to group section read functions

**What to build:** The five page-level data-fetching functions — Dashboard, History (first page
only), Leaderboard, Board belts, and Belts — are each wrapped in `unstable_cache` with a
`group-{slug}` cache tag and a 5-minute TTL. After a user's first visit to any tab, repeat visits
return instantly from the cache with no skeleton loading state shown. Paginated "load more" history
calls are not cached (they are user-triggered, append to client state, and are parameterised by
offset). The privacy gate (`canViewGroup`) in the group layout is left uncached.

**Blocked by:** Ticket 1 — so the cached functions already use the optimised parallel queries and
column selects.

- [ ] Dashboard data-fetching function is wrapped in `unstable_cache` tagged `group-{slug}` with 5-minute TTL
- [ ] History first-page fetch is wrapped in `unstable_cache` tagged `group-{slug}` with 5-minute TTL
- [ ] Leaderboard fetch is wrapped in `unstable_cache` tagged `group-{slug}` with 5-minute TTL
- [ ] Board belts fetch is wrapped in `unstable_cache` tagged `group-{slug}` with 5-minute TTL
- [ ] Belts history fetch is wrapped in `unstable_cache` tagged `group-{slug}` with 5-minute TTL
- [ ] Paginated "load more" history calls are NOT cached
- [ ] `canViewGroup` in the group layout is NOT cached
- [ ] Repeat tab visits return content without the skeleton loading state appearing
- [ ] `pnpm test` passes with no regressions

---

## Ticket 3a — Revalidate cache in match write actions

**What to build:** The four match-level write actions that correct or change match state each call
`revalidateTag("group-{slug}")` after a successful database write. After this ticket, any admin
action that modifies an existing match immediately causes the next tab navigation to show fresh
data rather than the cached (now-stale) state. The slug is resolved from the group ID that these
actions already look up for authorization.

**Blocked by:** Ticket 2 — the cache tag must exist before it can be invalidated.

- [ ] `correctMatchScores` calls `revalidateTag("group-{slug}")` on success
- [ ] `cancelMatch` calls `revalidateTag("group-{slug}")` on success
- [ ] `updateManualMatch` calls `revalidateTag("group-{slug}")` on success
- [ ] `restoreMatch` calls `revalidateTag("group-{slug}")` on success
- [ ] Revalidation is only called on success — failed writes do not invalidate the cache
- [ ] After correcting a match score, the next Dashboard/Board visit shows updated rankings
- [ ] `pnpm test` passes with no regressions

---

## Ticket 3b — Revalidate cache in live session write actions

**What to build:** The three live-session write actions that create or transition sessions and
matches each call `revalidateTag("group-{slug}")` after a successful database write. After this
ticket, starting a session, completing a live match, or ending a session causes the next tab
navigation to show fresh data — e.g., the active session banner on the Dashboard appears and
disappears correctly.

**Blocked by:** Ticket 2 — the cache tag must exist before it can be invalidated.

- [ ] `saveCompletedMatch` calls `revalidateTag("group-{slug}")` on success
- [ ] `endSession` calls `revalidateTag("group-{slug}")` on success
- [ ] `startSession` calls `revalidateTag("group-{slug}")` on success
- [ ] Revalidation is only called on success — failed writes do not invalidate the cache
- [ ] After ending a session, the next Dashboard visit shows no active session banner
- [ ] After a live match completes, the next Leaderboard visit reflects the new result
- [ ] `pnpm test` passes with no regressions

---

## Ticket 3c — Revalidate cache in manual match record actions

**What to build:** The two actions for recording manually-logged matches each call
`revalidateTag("group-{slug}")` after a successful database write. After this ticket, logging a
match during a live session or adding a past match from the History tab causes the next tab
navigation to show the new match in history and updated rankings.

**Blocked by:** Ticket 2 — the cache tag must exist before it can be invalidated.

- [ ] `recordManualMatch` calls `revalidateTag("group-{slug}")` on success
- [ ] `recordPastMatch` calls `revalidateTag("group-{slug}")` on success
- [ ] Revalidation is only called on success — failed writes do not invalidate the cache
- [ ] After recording a past match, the next History visit shows the new entry
- [ ] After recording a past match, the next Board visit reflects the updated leaderboard
- [ ] `pnpm test` passes with no regressions

---

## Ticket 3d — Revalidate cache in session delete action

**What to build:** The session deletion action calls `revalidateTag("group-{slug}")` after
successfully deleting a session and its matches. After this ticket, deleting a session from the
History tab causes the next tab navigation to show the session gone from history and rankings
updated to exclude its matches.

**Blocked by:** Ticket 2 — the cache tag must exist before it can be invalidated.

- [ ] `deleteSession` calls `revalidateTag("group-{slug}")` on success
- [ ] Revalidation is only called on success — failed deletes do not invalidate the cache
- [ ] After deleting a session, the next History visit no longer shows that session
- [ ] After deleting a session, the next Board visit reflects rankings without the deleted matches
- [ ] `pnpm test` passes with no regressions

---

# Tickets: DinkDay Performance and Scalability

Builds the measured, scalable read architecture defined in
`docs/superpowers/specs/2026-07-10-dinkday-performance-scalability.md`. These tickets supersede the
broad-cache design above through an expand-and-contract migration; the existing cache remains in
place until DD-PERF-12 retires it.

Work the **frontier**: any ticket whose blockers are all done. DD-PERF-01 and DD-PERF-02 can start
immediately. Complete one frontier ticket at a time with `/implement`, clearing context between
tickets.

## DD-PERF-01 — Instrument core-route latency and establish the baseline

**What to build:** DinkDay operators can see where time is spent when users navigate to core group
routes. Production telemetry reports meaningful-content latency distributions and attributes slow
requests to identity, access, cache, database, or rendering work without recording sensitive group
or player data. The ticket also records the current Vercel and Supabase regions and their measured
server-to-database latency.

**Blocked by:** None — can start immediately.

- [ ] Dashboard, History, leaderboard, players, and live-entry navigation expose p50, p75, and p95 meaningful-content latency
- [ ] Reports can isolate mobile traffic from the Philippines
- [ ] Server traces distinguish Clerk identity, group access, cache outcome, Supabase operations, and rendering
- [ ] Cache hits and misses are visible per read domain
- [ ] Traces exclude player names, group names, emails, invite tokens, credentials, and raw sensitive payloads
- [ ] Sustained breaches of the core-route two-second p95 target can trigger an alert
- [ ] Current Vercel execution region, Supabase region, and representative round-trip latency are documented
- [ ] A before-change baseline is captured for anonymous public, signed-in admin, private-group, cache-hit, and cache-miss History reads

## DD-PERF-02 — Introduce the domain cache contract alongside legacy invalidation

**What to build:** Developers can declare exactly which group read domains a successful mutation
changes. The new contract supports group metadata, History, leaderboard, players, sessions, belts,
and per-session recaps while the existing broad group invalidation remains available during the
migration. Ordinary read domains may be up to 30 seconds stale, but access decisions, scorer state,
and mutation authorization are never included.

**Blocked by:** None — can start immediately.

- [ ] The cache contract defines stable keys or tags for group metadata, History, leaderboard, players, sessions, belts, and individual session recaps
- [ ] A centralized dependency map declares the domains affected by each class of mutation
- [ ] Completing, correcting, cancelling, restoring, and deleting matches declare all affected derived domains
- [ ] Group metadata edits do not evict match-derived domains
- [ ] Private access, mutation authorization, active scoring state, scorer ownership, and heartbeat data cannot use the stale shared-read policy
- [ ] Dependency-map tests assert externally visible freshness behavior for representative mutations
- [ ] Existing broad invalidation continues to work until all callers migrate
- [ ] Cache invalidation failures remain observable and do not silently leave writers believing stale data was refreshed

## DD-PERF-03 — Co-locate DinkDay compute with Supabase

**What to build:** Database-backed DinkDay requests execute near Supabase so repeated server-to-
database round trips do not cross distant regions. Operators receive before-and-after evidence. If
Supabase itself must move, the production change occurs only through an explicitly approved
maintenance, backup, validation, rollback, and cutover procedure.

**Blocked by:** DD-PERF-01 — Instrument core-route latency and establish the baseline.

- [ ] Vercel database-backed server execution is explicitly configured for the region nearest the Supabase project
- [ ] Static assets and cacheable responses continue to use edge delivery
- [ ] Database reads remain on a supported Node runtime rather than being moved indiscriminately to Edge Runtime
- [ ] Representative server-to-database latency is measured before and after the region change
- [ ] If Supabase is already appropriately located, the no-migration decision and evidence are recorded
- [ ] If a Supabase move is required, backup, maintenance window, validation, rollback, and DNS/environment cutover steps are approved before production mutation
- [ ] Post-change production telemetry shows no access, write, or live-scoring regression

## DD-PERF-04 — Remove Clerk from the public-link critical path

**What to build:** Visitors to a public-link group see public content without waiting for Clerk.
Signed-in organizers receive admin controls progressively, while private-group content remains
hidden until identity and membership are verified. Layouts and pages reuse one access result within
a request, and every write retains the established owner/admin authorization boundary.

**Blocked by:** DD-PERF-01 — Instrument core-route latency and establish the baseline.

- [ ] Anonymous public-link group content can render before Clerk identity resolution completes
- [ ] Signed-in admin controls appear in an independent streamed boundary without blocking public content
- [ ] Private groups reveal no protected content before identity and membership checks pass
- [ ] Layout and page access consumers reuse one request-scoped access result
- [ ] Public group metadata caching cannot grant write access or reveal private group data
- [ ] Every affected mutation still begins at the owner/admin group-write authorization boundary
- [ ] Route-level security coverage distinguishes anonymous public, unauthorized private, member private, and admin views
- [ ] Baseline traces demonstrate that Clerk is absent from the anonymous public-content critical path

## DD-PERF-05 — Make Match History the fast reference route

**What to build:** A user navigating to Match History receives meaningful recent match content within
the core-route SLO without downloading the group's entire archive or hydrating unopened admin
features. History uses stable cursor pagination, one normalized player dictionary per page,
query-specific indexes, Server Component summaries, targeted caching, and on-demand detail or admin
interactions.

**Blocked by:** DD-PERF-01 — Instrument core-route latency and establish the baseline; DD-PERF-02 —
Introduce the domain cache contract alongside legacy invalidation; DD-PERF-03 — Co-locate DinkDay
compute with Supabase; DD-PERF-04 — Remove Clerk from the public-link critical path.

- [ ] Initial History data contains only display-ready session and match summaries plus one normalized player dictionary
- [ ] The response does not repeat the full player lookup inside every match
- [ ] Older sessions use a stable cursor based on session ordering plus a unique tie-breaker
- [ ] New matches recorded between page requests do not create duplicate or skipped cursor pages
- [ ] Query plans use validated group/session/status/date indexes for representative large groups
- [ ] Read-only History cards render as Server Components
- [ ] Load-more interaction, admin actions, edit forms, and destructive confirmations hydrate or load only when needed
- [ ] Full detail fields are requested only when a user opens the corresponding detail interaction or route
- [ ] Successful writes show the initiating admin an immediate result and invalidate only affected domains
- [ ] Anonymous, admin, and private-group History behavior remains correct
- [ ] Production measurements meet one second p75 and two seconds p95 for useful History content on the target audience segment

## DD-PERF-06 — Build the seeded performance acceptance harness

**What to build:** Developers can reproduce DinkDay's intended scale in a safe non-production
environment and automatically measure when meaningful mobile content appears. The harness protects
the optimized History route against pagination, payload, JavaScript, cache, and access-path
regressions without touching production data.

**Blocked by:** DD-PERF-05 — Make Match History the fast reference route.

- [ ] Deterministic non-production seed data supports groups with approximately 100, 1,000, and 10,000 matches
- [ ] Playwright runs History navigation at a mobile viewport with controlled network and CPU conditions
- [ ] Timing ends when meaningful History content appears, not when only a shell or spinner renders
- [ ] Scenarios cover anonymous public, signed-in admin, private member, cache hit, and cold cache
- [ ] Cursor traversal assertions detect duplicate or skipped sessions
- [ ] Initial History response-payload and route-JavaScript budgets are explicit and machine checked
- [ ] Tests never connect to or mutate production data
- [ ] The approved narrow Playwright exception to the repository's no-integration-test policy is documented with the harness

## DD-PERF-07 — Serve the leaderboard from rebuildable player summaries

**What to build:** Group members receive current leaderboard standings through a small indexed read
instead of making the application download and recompute the complete match archive. Completed
matches remain the source of truth; player standings and group totals update transactionally and can
be regenerated deterministically.

**Blocked by:** DD-PERF-01 — Instrument core-route latency and establish the baseline; DD-PERF-02 —
Introduce the domain cache contract alongside legacy invalidation.

- [ ] Rebuildable player-standing and group-total records represent the existing leaderboard formula exactly
- [ ] Completing, correcting, cancelling, restoring, and deleting a match update affected standings atomically with the match change
- [ ] A deterministic backfill rebuilds standings and totals from completed matches
- [ ] A reconciliation operation detects and repairs drift from the match source of truth
- [ ] Backfilled results match the existing pure leaderboard computation on representative fixtures
- [ ] The leaderboard reads only compact indexed summary data and required player presentation fields
- [ ] Leaderboard caching uses the new domain tag and respects the 30-second read-staleness policy
- [ ] The initiating admin sees a completed match reflected immediately
- [ ] Schema and generated application database types remain synchronized
- [ ] Production or staging query measurements no longer scale with the number of raw matches returned to Next.js

## DD-PERF-08 — Serve the dashboard from compact summaries

**What to build:** The dashboard presents group totals, leaderboard preview, top player, recent
matches, active-session state, hottest duo, and latest MVP without fetching every historical session
and match. Primary content can render independently of slower secondary highlights.

**Blocked by:** DD-PERF-07 — Serve the leaderboard from rebuildable player summaries.

- [ ] Group totals, leaderboard preview, and top player reuse compact rebuildable summaries
- [ ] Recent matches use a bounded indexed query rather than a second full-history read
- [ ] Active-session information reads only the current session and relevant match state
- [ ] Latest MVP and hottest-duo content use bounded or derived reads and can stream independently
- [ ] A missing or slow secondary highlight does not block primary dashboard content
- [ ] Dashboard read-only sections default to Server Components
- [ ] Dashboard writes invalidate only their declared domains and provide immediate writer feedback
- [ ] Existing dashboard values remain behaviorally equivalent on deterministic fixtures
- [ ] Production measurements meet the core-route SLO for the target audience segment

## DD-PERF-09 — Serve player profiles and duo rankings from rebuildable summaries

**What to build:** Player profiles and duo rankings remain fast for long-running groups by reading
compact rebuildable statistics. Match changes update only affected players and duos, while a full
reconciliation can regenerate every value from completed matches.

**Blocked by:** DD-PERF-07 — Serve the leaderboard from rebuildable player summaries.

- [ ] Player summaries preserve existing wins, losses, point differential, streak, rivalry, and other displayed formulas
- [ ] Duo summaries preserve the existing minimum-game, win-rate, wins, and point-differential ordering
- [ ] Match completion, correction, cancellation, restoration, and deletion update affected player and duo records transactionally
- [ ] Backfill and reconciliation regenerate profile and duo summaries from completed matches
- [ ] Rebuilt values match existing pure-stat computations on representative fixtures
- [ ] Profile and duo routes no longer transfer a group's complete raw match history for summary display
- [ ] Read-only profile sections render without hydrating unopened editing or sharing features
- [ ] Player and leaderboard-domain invalidation remains precise after writes
- [ ] Profile navigation meets the core-route SLO at the intended large-group size

## DD-PERF-10 — Optimize session details, belts, recaps, and share tooling

**What to build:** Secondary DinkDay routes show their primary information promptly and load
independent awards, belts, recap visuals, admin controls, and image-export tooling only when needed.
These reads use bounded contracts and precise invalidation rather than participating in unrelated
group-wide cold-cache events.

**Blocked by:** DD-PERF-02 — Introduce the domain cache contract alongside legacy invalidation;
DD-PERF-08 — Serve the dashboard from compact summaries.

- [ ] Session details fetch only the selected session, its bounded matches, and required player presentation data
- [ ] Belt history and current holders use the belts domain cache and remain rebuildable from matches
- [ ] Recap data is cached and invalidated per session where practical
- [ ] Primary session, belt, and recap content can render independently of slower secondary sections
- [ ] Read-only content defaults to Server Components with small interactive islands
- [ ] Admin forms and dialogs load only when invoked
- [ ] Recap rendering, browser-only sharing code, and `html2canvas` are absent from initial route JavaScript until requested
- [ ] Match and session mutations invalidate the correct session, belt, and recap domains
- [ ] These routes meet their two-second p75 and three-second p95 performance tier

## DD-PERF-11 — Optimize the live Game Day workflow without stale scoring state

**What to build:** Organizers can enter Game Day, set up players, score rallies, and view the recap
without downloading every workflow state upfront. Rally taps remain locally instantaneous and sync
efficiently, while offline recovery, scorer locking, heartbeat, and takeover continue to use fresh
state rather than the ordinary read cache.

**Blocked by:** DD-PERF-01 — Instrument core-route latency and establish the baseline; DD-PERF-02 —
Introduce the domain cache contract alongside legacy invalidation.

- [ ] Setup, active scoring, and recap code are split so unopened workflow states do not inflate initial JavaScript
- [ ] Rally interactions respond locally within 100 milliseconds under the target mobile test conditions
- [ ] Rally synchronization traces expose batching, retry, and database latency without recording sensitive payloads
- [ ] Offline rally queue and crash-recovery behavior remain correct through navigation and reload
- [ ] Scorer lock, heartbeat freshness, and takeover never use the 30-second shared-read cache
- [ ] A second scorer cannot mutate a match without the established lock or takeover path
- [ ] Completing a match updates the scorer immediately and invalidates the declared History, leaderboard, session, belt, and recap domains
- [ ] A load scenario validates approximately 100 simultaneous live matches without correctness loss
- [ ] Existing scoring-engine, offline, and scorer-state regression suites remain green

## DD-PERF-12 — Retire broad group cache invalidation

**What to build:** Every DinkDay mutation uses the explicit domain dependency contract, so a small
write no longer evicts unrelated group reads. Once all consumers have migrated, the legacy broad
group cache tag and its compatibility helpers are removed without changing visible freshness or
authorization behavior.

**Blocked by:** DD-PERF-05 — Make Match History the fast reference route; DD-PERF-07 — Serve the
leaderboard from rebuildable player summaries; DD-PERF-08 — Serve the dashboard from compact
summaries; DD-PERF-09 — Serve player profiles and duo rankings from rebuildable summaries;
DD-PERF-10 — Optimize session details, belts, recaps, and share tooling; DD-PERF-11 — Optimize the
live Game Day workflow without stale scoring state.

- [ ] All group mutations use explicit domain invalidation rather than the legacy broad tag
- [ ] A repository-wide check finds no remaining broad group-tag producer, consumer, or compatibility call
- [ ] The dependency-map tests cover every migrated mutation class
- [ ] Editing group metadata does not make History, leaderboard, belts, or recaps cold
- [ ] Completing a match refreshes every affected derived view and no unrelated view
- [ ] The writer retains immediate feedback while other viewers remain within the allowed 30-second staleness window
- [ ] Authorization, privacy, active scoring state, and scorer ownership remain outside shared stale caching
- [ ] Cache telemetry confirms improved domain hit rates after the contract step

## DD-PERF-13 — Enforce DinkDay performance release gates

**What to build:** Pull requests and releases cannot silently reintroduce the six-second navigation
problem. Lightweight route, payload, JavaScript, and correctness checks run during review; larger
query-plan and concurrency tests run before releases; production alerts remain tied to the agreed
route tiers.

**Blocked by:** DD-PERF-06 — Build the seeded performance acceptance harness; DD-PERF-08 — Serve the
dashboard from compact summaries; DD-PERF-09 — Serve player profiles and duo rankings from
rebuildable summaries; DD-PERF-10 — Optimize session details, belts, recaps, and share tooling;
DD-PERF-11 — Optimize the live Game Day workflow without stale scoring state; DD-PERF-12 — Retire
broad group cache invalidation.

- [ ] Pull requests run lightweight mobile navigation checks for History, dashboard, leaderboard, players, and live entry
- [ ] CI enforces route-tier JavaScript and initial-response payload budgets
- [ ] CI timing uses meaningful content rather than only browser load events or loading-shell visibility
- [ ] Release checks validate representative query plans at 100, 1,000, and 10,000 matches per group
- [ ] Release load tests cover cold and cached reads, summary-writing match completion, and approximately 100 simultaneous live matches
- [ ] Security checks cover anonymous public, unauthorized private, private member, and admin paths
- [ ] Offline recovery and scorer-lock regression checks remain part of the release gate
- [ ] Production alerts use the one-second p75/two-second p95 core tier and two-second p75/three-second p95 secondary tier
- [ ] Release documentation explains how to investigate and waive a failed budget with evidence and explicit approval
