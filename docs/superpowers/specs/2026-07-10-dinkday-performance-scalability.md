# DinkDay Performance and Scalability

## Problem Statement

DinkDay users report that core pages do not feel immediate. Match History can take approximately six seconds to load, which interrupts the courtside experience and makes the product feel unreliable even when the requested data eventually appears.

The current read architecture performs several sequential remote operations before useful content can render. Public group routes wait for Clerk identity resolution and group privacy checks, and individual pages can repeat viewer-access work. Match History resolves a group, fetches sessions and players, then fetches matches. It also serializes the full player lookup dictionaries into every returned match, causing the response payload to grow much faster than the number of matches displayed.

Caching has been introduced, but invalidation is currently broad. A group write can evict unrelated cached views together, causing predictable cold-cache latency after Game Day activity. A cache hit also does not remove identity and access checks from the critical rendering path.

The dashboard and leaderboard fetch all sessions and completed matches for a group and recompute all-time statistics in the application process. This makes cache misses progressively more expensive as a group's history grows. Several core routes are also implemented as large client-component boundaries, so users pay JavaScript download, parsing, and hydration costs for read-only content and unopened admin features.

DinkDay needs an architecture that meets a measurable user-facing performance target, remains secure for public-link and private groups, preserves live-scoring correctness and offline resilience, and scales without introducing infrastructure that the product does not yet need.

## Solution

DinkDay will adopt a measured, incremental performance architecture centered on fast server-rendered reads, precise caching, compact data contracts, and rebuildable Postgres read models.

The first reference implementation will be Match History. It will show useful content within one second at p75 and two seconds at p95 for real mobile users in the Philippines. The page will use a compact, cursor-paginated summary response, render read-only content as Server Components, and stream or lazy-load secondary admin controls. The implementation will remove repeated access checks and duplicated player dictionaries from the critical response.

Public-link group content will render without waiting for Clerk identity resolution. Admin identity and controls may appear progressively after public content. Private groups will continue to require blocking authentication and membership verification before protected content is revealed. Every mutation will continue to use the existing owner/admin write authorization boundary.

The Next.js Data Cache will use domain-specific tags instead of a single broad group tag. Read-oriented pages may be up to 30 seconds stale for ordinary viewers, while the administrator who completes a write receives an immediate optimistic or refreshed result. Live scoring and access-control decisions will not use this stale shared-read policy.

Dashboard, leaderboard, player, duo, and session summaries will be served from rebuildable Postgres read models. Completed matches remain the source of truth. Summary rows will be updated transactionally when matches change and can be regenerated through reconciliation or backfill tooling.

Vercel server functions and Supabase Postgres will be co-located in Singapore if measurements confirm that they are currently separated. Static assets and cacheable responses will continue to use Vercel's edge network. Redis, microservices, and distributed job infrastructure will not be introduced at the agreed scale.

Production performance telemetry, synthetic datasets, route-level Playwright journeys, database query-plan checks, and bundle budgets will make performance a release criterion rather than a one-time optimization exercise.

## User Stories

1. As a DinkDay visitor in the Philippines, I want core group content to appear within one second in typical conditions, so that the site feels immediate on a mobile connection.
2. As a DinkDay visitor on a slower mobile connection, I want core group content to appear within two seconds for nearly all visits, so that navigation does not feel broken.
3. As a group member, I want Match History to show useful recent results quickly, so that I can review Game Day without waiting for the full archive.
4. As a group member, I want older History results to load incrementally, so that a large archive does not slow the initial page.
5. As a group member, I want pagination to remain stable while new matches are recorded, so that I do not see duplicate or skipped sessions.
6. As a group member, I want player names, colors, and avatars to remain correct in History, so that compact responses do not reduce clarity.
7. As a group member, I want detailed match information to load when I request it, so that unopened details do not slow ordinary browsing.
8. As a visitor to a public-link group, I want public content to render without waiting for account detection, so that anonymous navigation remains fast.
9. As an organizer viewing a public-link group, I want admin controls to appear shortly after public content, so that identity detection does not delay the information I came to see.
10. As a member of a private group, I want content hidden until my membership is verified, so that performance work does not weaken privacy.
11. As an organizer, I want write permissions checked on every mutation, so that cached or streamed reads cannot bypass the owner/admin security boundary.
12. As an organizer recording a match, I want my screen to reflect the completed match immediately, so that the interface confirms the write succeeded.
13. As another viewer, I accept read-oriented statistics being up to 30 seconds behind, so that DinkDay can serve consistently fast cached pages.
14. As a scorer, I want score-button interactions to respond locally within 100 milliseconds, so that courtside scoring feels instantaneous.
15. As a scorer with an unstable connection, I want rally entry to remain locally responsive and synchronize later, so that performance improvements preserve offline resilience.
16. As a scorer, I want scorer locking and takeover behavior to remain correct, so that caching never exposes stale ownership of an active match.
17. As a group member, I want the dashboard to load summaries without recomputing the group's entire match archive, so that performance remains stable as history grows.
18. As a group member, I want the leaderboard to load from current derived standings, so that large groups remain fast.
19. As a group member, I want belt holders and recaps to load independently, so that a slower secondary section does not block primary content.
20. As a player-profile visitor, I want profile summaries to load without downloading every historical match, so that profiles remain fast for long-running groups.
21. As a DinkDay user, I want navigation to display the persistent application shell immediately, so that the app responds visibly to my tap.
22. As a DinkDay user, I want likely destinations prefetched when appropriate, so that common navigation paths feel immediate.
23. As a DinkDay user, I want loading placeholders to preserve the final layout, so that streamed content does not cause disruptive movement.
24. As a DinkDay user, I want read-only cards to work without unnecessary hydration, so that low-powered phones remain responsive.
25. As an organizer, I want admin forms and dialogs loaded only when opened, so that management features do not slow ordinary browsing.
26. As a user sharing a recap, I want image-generation dependencies loaded only when I request sharing, so that `html2canvas` does not affect initial route performance.
27. As a DinkDay operator, I want p50, p75, and p95 navigation latency by route, so that performance decisions use real distributions rather than anecdotes.
28. As a DinkDay operator, I want Philippine mobile traffic segmented in performance reports, so that the primary audience determines success.
29. As a DinkDay operator, I want traces for identity, privacy, database, cache, and rendering stages, so that a slow request can be diagnosed precisely.
30. As a DinkDay operator, I want cache hits and misses observable, so that broad invalidation or low hit rates are visible.
31. As a DinkDay operator, I want slow-route alerts tied to the agreed SLOs, so that regressions are detected before complaints accumulate.
32. As a privacy-conscious organizer, I want performance traces to exclude player names, group names, invite tokens, and sensitive identifiers, so that observability does not leak private data.
33. As a DinkDay operator, I want application compute and Postgres located near each other, so that server-to-database round trips remain low latency.
34. As a DinkDay operator, I want regional latency measured before migration, so that infrastructure changes are evidence-based.
35. As a DinkDay operator, I want a controlled database-region migration plan if services are separated, so that downtime and data risk are managed.
36. As a developer, I want group metadata and access results reused within a request, so that layouts and pages do not repeat the same work.
37. As a developer, I want cache dependencies declared by domain, so that an unrelated group edit does not evict History or leaderboard data.
38. As a developer, I want new mutations to declare affected cache domains, so that derived views remain correct after writes.
39. As a developer, I want summary data rebuildable from completed matches, so that derived tables never replace the source of truth.
40. As a developer, I want summary updates performed transactionally with match state changes, so that reads do not expose partially updated statistics.
41. As a developer, I want a reconciliation operation to detect and repair summary drift, so that operational failures are recoverable.
42. As a developer, I want query-specific indexes validated against actual plans, so that indexes are driven by access patterns rather than guesswork.
43. As a developer, I want History responses to return one player dictionary per page, so that payload size grows approximately with displayed data.
44. As a developer, I want display-summary and full-detail contracts separated, so that routes request only what their UI needs.
45. As a developer, I want route-level performance budgets, so that adding a dependency cannot silently degrade core navigation.
46. As a developer, I want tests at 100, 1,000, and 10,000 matches per group, so that behavior and performance are verified across the intended scale range.
47. As a developer, I want a seeded non-production Playwright group, so that core navigation is tested without accessing production data.
48. As a developer, I want lightweight performance checks on pull requests, so that regressions are caught during review.
49. As a release owner, I want larger load tests before releases, so that traffic spikes during simultaneous Game Days are understood.
50. As a release owner, I want performance work delivered route by route, so that improvements ship safely without a site-wide rewrite.
51. As a release owner, I want Match History to prove the shared patterns first, so that later routes reuse measured solutions.
52. As a product owner, I want the architecture to support 10,000 monthly active visitors, 100 simultaneous live matches, one million total matches, and 10,000 matches in a large group, so that near-term growth does not require another redesign.
53. As a product owner, I want rare settings and export operations to show immediate progress even when completion takes longer, so that they remain understandable without receiving the same budget as Game Day routes.
54. As a product owner, I want infrastructure complexity introduced only when monitoring proves it is needed, so that the team can maintain the system confidently.

## Implementation Decisions

- The primary performance SLO for dashboard, History, leaderboard, and players is useful content within one second at p75 and two seconds at p95 for real mobile users in the Philippines.
- Useful content means meaningful route data, not only a blank shell or loading spinner.
- Live-scoring interactions have a separate local-response target of less than 100 milliseconds. Network synchronization may complete asynchronously.
- Recaps, belts, session details, and settings target useful content within two seconds at p75 and three seconds at p95.
- Rare admin operations and exports may exceed those targets but must acknowledge the action immediately and show progress.
- The 12–24 month scale target is 10,000 monthly active visitors, 100 simultaneous live-scoring matches, one million total matches, up to 10,000 matches in a large group, and short Game Day traffic spikes.
- DinkDay remains a modular Next.js monolith using Vercel and Supabase. Microservices and Redis are not required for the target scale.
- Redis will be reconsidered only if telemetry demonstrates sustained thousands of concurrent live sessions, high-frequency shared reads that overload Postgres, or a concrete need for distributed rate limiting, queues, presence, or cross-instance coordination.
- Vercel server compute and Supabase Postgres should be co-located in Singapore. Current regions and regional latency must be measured before any migration.
- Static assets and cacheable responses continue to use Vercel's edge delivery. Database-backed application queries remain on the Node runtime near Postgres rather than being moved indiscriminately to Edge Runtime.
- Production monitoring will record route-level p50, p75, and p95 navigation latency, Core Web Vitals, cache outcomes, and server spans for Clerk, privacy checks, Supabase operations, and rendering.
- Sentry performance tracing will use sampling, beginning near 10% for ordinary traffic, with enhanced capture for slow or failed requests where supported.
- Telemetry must not record player names, group names, email addresses, invite tokens, service credentials, or raw sensitive payloads.
- Public-link group metadata may be cached. Public content must not wait for Clerk identity resolution.
- Admin identity and controls for public-link groups may render in an independent streamed boundary after public content.
- Private groups require blocking identity and membership checks before protected content renders.
- Access resolution will be memoized within a request so layouts and pages share the result rather than issuing duplicate checks.
- All writes continue to begin at the established owner/admin group-write authorization boundary. Shared caching must never be used to authorize a mutation.
- Ordinary read views such as History, leaderboard, player profiles, belts, and recaps may be up to 30 seconds stale.
- Live match state, scorer ownership, privacy decisions, and mutation authorization are excluded from stale shared caching.
- The writer receives immediate confirmation through optimistic state or targeted refresh after a successful mutation.
- Cache tags will be domain-specific. Initial domains include group metadata, History, leaderboard, players, sessions, belts, and individual session recaps.
- Every mutation will declare its affected cache domains. Completing a match affects History, leaderboard, belts, the session, and recap data; editing group metadata does not evict match-derived data.
- Cache dependency declarations will be centralized and tested as an explicit domain map.
- Match History is the first vertical-slice reference implementation.
- History uses cursor pagination ordered by session start time plus a unique identifier. Offset pagination will be retired for the optimized contract.
- History returns a compact page of session and match summaries plus one normalized player dictionary. It does not attach the entire player dictionary to every match.
- Full match detail is loaded separately when the user opens a match or detail route.
- Read contracts select only fields required for the visible UI.
- Group slug resolution will be shared or cached rather than repeated by every read operation.
- Database calls that form one read model should be consolidated where this reduces network round trips and preserves understandable contracts.
- Query indexes will match filter and ordering patterns, including group-scoped session ordering and session/status/match-date access. Final index definitions must be validated with query plans rather than assumed.
- Server Components are the default for read-only content.
- Client Components are limited to small interactive islands such as pagination, action menus, dialogs, and live-scoring controls.
- Admin forms, correction and cancellation dialogs, recap sharing, and browser-only image generation will be dynamically loaded when requested.
- The live workflow will be code-split by setup, active scoring, and recap states where doing so does not compromise local state or offline recovery.
- Persistent navigation and route loading UI render immediately. Independent route sections use Suspense boundaries when they can provide meaningful progressive rendering.
- DinkDay will define route-tier JavaScript and response-payload budgets and inspect them during builds.
- Completed matches remain the source of truth for rankings, awards, streaks, duo statistics, recaps, and belts.
- Rebuildable Postgres summary tables will hold group totals, player standings, duo standings, and session summaries needed by frequent reads.
- Summary rows will update when a match is completed, corrected, cancelled, or restored.
- Match state and corresponding summary changes should commit transactionally to prevent partial derived state.
- A reconciliation/backfill operation will rebuild summaries from completed matches and support deployment of the initial schema migration.
- Belt reigns remain a rebuildable derived cache and should participate in the new targeted invalidation dependency map.
- Summary reads use small indexed queries; they do not fetch an entire group's match archive into the Next.js process.
- The rollout is incremental: baseline instrumentation and region verification; History optimization; extraction of shared access/cache/pagination patterns; adoption across core reads; derived summary tables and backfill; live-scoring optimization; and enforcement of budgets.
- Each phase must be measured against the SLO before its pattern is generalized.
- Schema changes use new numbered migrations and update the generated application database types.
- Production migrations, backfills, or region changes require explicit operational approval and rollback planning.

## Testing Decisions

- Tests should assert externally observable behavior and domain contracts rather than internal function calls or framework implementation details.
- The primary acceptance seam is production user telemetry. Route-level p75 and p95 for Philippine mobile users determines whether the SLO is met.
- A narrow exception is approved to the repository's current no-integration-test policy: core Playwright performance journeys may use a seeded non-production database. They must never use production data.
- Playwright will cover navigation to History, dashboard, leaderboard, players, and the live-scoring entry path at a mobile viewport with controlled network and CPU conditions.
- Playwright timing will measure the appearance of meaningful route content rather than only the browser load event or disappearance of a spinner.
- Synthetic fixtures will represent groups with approximately 100, 1,000, and 10,000 matches.
- Vitest will cover normalized History result behavior, cursor ordering and page boundaries, cache dependency mapping, and deterministic reconstruction of derived summary rows.
- Existing pure stats functions provide prior art for deterministic summary tests. Existing History session-summary tests provide prior art for History-domain behavior.
- The scoring engine and matchmaking modules remain pure and continue to use their existing high-coverage unit-test seams.
- Database index and query changes will be verified in staging with representative `EXPLAIN ANALYZE` plans at each dataset size.
- Backfill and reconciliation results will be compared against statistics derived directly from completed matches before read traffic switches to summary tables.
- Load tests will cover cached and cold History reads, leaderboard reads, match completion, summary updates, and live-score synchronization around the target of 100 concurrent live matches.
- Lightweight navigation, bundle, and payload checks run for pull requests. Larger load tests run before releases or major data-access changes.
- CI will enforce agreed JavaScript and response-payload budgets for performance-tier routes.
- Production monitoring will alert when a core route exceeds the two-second p95 target for a sustained window.
- Performance tests must distinguish cache hits, cache misses, anonymous public reads, signed-in admin reads, and private-group reads.
- Security tests must verify that progressive public rendering does not reveal private-group content and that mutations still reject unauthorized users.
- Offline and scorer-lock regression coverage must remain green while live-scoring code is split or optimized.

## Out of Scope

- Redis, Memcached, or another external distributed cache at the agreed scale.
- A microservice decomposition of the Next.js application.
- A general-purpose background-job platform before synchronous summary updates demonstrate a measured write-latency problem.
- Player accounts or changes to the account-less player model.
- Clerk Organizations, billing, tournaments, Elo/DUPR ratings, or a public group directory.
- Full offline-first browsing of History, leaderboards, or profiles.
- Multi-device scoring of the same match.
- Replacing Supabase Postgres as the system of record.
- Weakening private-group access controls or the server-action write boundary for performance.
- Migrating production regions or running production schema changes without a separate approved operational plan.
- Treating a loading skeleton alone as successful achievement of the user-facing SLO.

## Further Notes

- The present six-second History report is the motivating symptom, not yet a fully attributed root cause. Instrumentation and regional measurements are the first deliverables.
- Existing Vercel Analytics and Speed Insights provide a foundation, while Sentry performance tracing and application spans supply server-side attribution.
- Cache busting alone cannot meet the goal because broad invalidation creates cold paths and identity/access checks remain outside the cached History result.
- The current repeated player dictionaries in Match History and all-match recomputation on dashboard and leaderboard are concrete scaling risks found during repository inspection.
- The current project already treats belt reigns as a rebuildable cache. The proposed statistics read models generalize that established architectural principle.
- The specification intentionally favors a measured modular monolith. The agreed workload is comfortably within a well-indexed Supabase database and co-located Vercel application.
- The required issue-tracker triage label is `ready-for-agent`.
