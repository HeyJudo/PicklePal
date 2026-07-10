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
