# Phase 0a Current App Audit

Date: 2026-06-03
Branch: `phase-0a-current-app-audit`
Plan: `docs/PICKLEPAL-V2-LAUNCH-PLAN.md` Phase 0a

## Summary

Phase 0a is complete as an audit deliverable. The current app is a functional V1 friend-group product with strong pure scoring coverage, but its write security is still a V1 PIN/client-gated model backed by service-role server actions. V2 implementation should start by replacing that model with Clerk Owner/Admin authorization and matching Supabase RLS before expanding public launch features.

No product-code fixes were made during this audit. Findings are captured so later phases can change the security model deliberately instead of patching V1 behavior piecemeal.

## Verification

Commands run from `picklepal/` in the isolated worktree:

```text
pnpm install
pnpm test
pnpm lint
pnpm build
```

Results:

- `pnpm install`: passed after approved network access. Initial sandboxed run failed with npm registry `ECONNREFUSED`.
- `pnpm test`: passed outside sandbox, `8` test files and `124` tests passing. Initial sandboxed run failed with Windows `spawn EPERM`, not test failures.
- `pnpm lint`: failed with `4` errors and `10` warnings.
- `pnpm build`: passed with Next.js `16.2.6`.

Lint failures:

- `src/components/pin/PinModal.tsx:27` calls `setState` synchronously inside an effect.
- `src/lib/engine/__tests__/undo.test.ts:66` and `src/lib/engine/__tests__/undo.test.ts:250` should use `const`.
- `src/lib/matchmaking/__tests__/matchmaking.test.ts:210` should use `const`.

Lint warnings include unused values in live/session components and tests, including `GameDayRecap`, `LiveScoring`, `MatchQueue`, `SessionPlayerList`, `HostAuthGate`, and engine tests.

## Route Inventory

Current app routes:

```text
/                         redirects to /g/default
/g/[slug]                 group dashboard
/g/[slug]/board           leaderboard
/g/[slug]/history         match history
/g/[slug]/live            session setup, queue, scoring, recap, manual match entry
/g/[slug]/players         roster
/g/[slug]/players/[id]    player profile/edit
/g/[slug]/sessions/[id]   session detail
```

Launch gap:

- `src/app/page.tsx:8` redirects root traffic to `/g/default`; V2 needs a marketing landing page at `/` and signed-in dashboard at `/app`.
- There is no `/app`, `/onboarding`, `/g/[slug]/settings`, or public recap route yet.

## Environment Inventory

Current required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Evidence:

- `src/lib/supabase/server.ts:10` reads `NEXT_PUBLIC_SUPABASE_URL`.
- `src/lib/supabase/server.ts:11` reads `SUPABASE_SERVICE_ROLE_KEY`.
- `src/lib/supabase/browser.ts:9` reads `NEXT_PUBLIC_SUPABASE_URL`.
- `src/lib/supabase/browser.ts:10` reads `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

V2 additions expected:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
```

Launch gap:

- `README.md` is still the default Next.js scaffold guide and does not document project setup, Supabase envs, migrations, storage, test commands, or V2 launch prerequisites.

## Supabase Schema And RLS Inventory

Current migrations define these tables:

```text
groups
players
sessions
matches
rally_events
match_queue_items
recap_cards
session_players
```

Current enum/types:

```text
session_status: active | completed | cancelled
match_status: queued | active | completed | cancelled
match_type: singles | doubles
queue_item_status: pending | active | completed | skipped
session_player_status: active | benched | removed
```

Current V1 auth-related schema:

- `supabase/migrations/001_create_groups.sql:8` defines `groups.host_pin_hash`.

Current RLS posture:

- RLS is enabled on all core tables.
- Every policy currently found is public `SELECT USING (true)`.
- There are no INSERT/UPDATE/DELETE policies in migrations.
- Server actions write through `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS.

Evidence:

- `supabase/migrations/001_create_groups.sql:17` enables RLS for `groups`; line `19` adds public read.
- `supabase/migrations/002_core_tables.sql:21`, `48`, `82`, `109`, `130`, and `148` enable RLS on core tables.
- `supabase/migrations/002_core_tables.sql:23`, `50`, `84`, `111`, `132`, and `150` add public read policies.
- `supabase/migrations/003_session_players.sql:21` enables RLS for `session_players`; line `23` adds public read.

Storage gap:

- `src/app/g/[slug]/players/manage-actions.ts:219` and `:232` use a Supabase Storage bucket named `player-avatars`.
- No migration or setup script creates `player-avatars` or storage object policies.

V2 schema gaps:

- No `profiles`.
- No `group_memberships`.
- No `admin_invites`.
- No `groups.privacy_mode`.
- No Clerk user ID mapping.
- No active-match scorer lock fields.
- No `matches.played_at` for historical manual entry.
- No current-score/server snapshot fields for public live viewing.

## PIN Dependency Inventory

Current PIN modules:

- `src/components/pin/PinModal.tsx`
- `src/components/pin/HostAuthGate.tsx`
- `src/hooks/useHostAuth.ts`
- `src/lib/utils/pin.ts`
- `src/app/g/[slug]/actions.ts`

Evidence:

- `src/components/pin/PinModal.tsx:4` imports `verifyHostPin`.
- `src/components/pin/PinModal.tsx:41` calls `verifyHostPin`.
- `src/components/pin/HostAuthGate.tsx:25` exports the host auth gate.
- `src/hooks/useHostAuth.ts:5` stores host sessions under `picklepal_host_auth_`.
- `src/lib/utils/pin.ts:10` defines `hashPin`.
- `src/lib/utils/pin.ts:22` defines `verifyPin`.
- `src/app/g/[slug]/actions.ts:25` selects `host_pin_hash`.
- `src/app/g/[slug]/actions.ts:36` exports `verifyHostPin`.

Components still using PIN/host state:

- `src/app/g/[slug]/live/StartSessionForm.tsx`
- `src/app/g/[slug]/live/ActiveSession.tsx`
- `src/app/g/[slug]/live/LivePageClient.tsx`
- `src/app/g/[slug]/players/AddPlayerForm.tsx`
- `src/app/g/[slug]/players/[id]/EditPlayerForm.tsx`

V2 action:

- Remove PIN UI and localStorage host sessions after Clerk role checks are active.
- Retire `groups.host_pin_hash` only after the current group is assigned an Owner membership and post-migration stats are verified.

## Write Action Inventory

All write actions should become Owner/Admin-only in V2.

| Action | Current file | Current gate | V2 role |
| --- | --- | --- | --- |
| Start session | `src/app/g/[slug]/live/actions.ts:71` | Client PIN UI only | Owner/Admin |
| End session | `src/app/g/[slug]/live/actions.ts:154` | Client PIN/host UI only | Owner/Admin |
| Save completed live match | `src/app/g/[slug]/live/actions.ts:228` | Scoring flow only | Owner/Admin scorer lock |
| Add player | `src/app/g/[slug]/players/manage-actions.ts:61` | Comment says client-side PIN | Owner/Admin |
| Update player | `src/app/g/[slug]/players/manage-actions.ts:100` | Comment says client-side PIN | Owner/Admin |
| Toggle player active | `src/app/g/[slug]/players/manage-actions.ts:156` | Comment says client-side PIN | Owner/Admin |
| Upload avatar | `src/app/g/[slug]/players/manage-actions.ts:186` | Comment says client-side PIN | Owner/Admin |
| Correct match scores | `src/app/g/[slug]/match-actions.ts:41` | No server auth | Owner/Admin |
| Cancel match | `src/app/g/[slug]/match-actions.ts:86` | No server auth | Owner/Admin |
| Restore match | `src/app/g/[slug]/match-actions.ts:112` | No server auth | Owner/Admin |
| Record manual match | `src/app/g/[slug]/live/record-match-actions.ts:66` | Client PIN UI only | Owner/Admin |
| Create session players | `src/app/g/[slug]/live/session-player-actions.ts:45` | No server auth | Owner/Admin |
| Bench player | `src/app/g/[slug]/live/session-player-actions.ts:75` | No server auth | Owner/Admin |
| Activate player | `src/app/g/[slug]/live/session-player-actions.ts:100` | No server auth | Owner/Admin |
| Remove player from session | `src/app/g/[slug]/live/session-player-actions.ts:150` | No server auth | Owner/Admin |

Critical security finding:

- Several server actions explicitly rely on client-side PIN checks. For example, `src/app/g/[slug]/players/manage-actions.ts:59` states that PIN verification happens client-side before calling `addPlayer`. Since server actions use the service role, V2 must add server-side Clerk membership checks before or during PIN removal.

Correctness findings:

- `src/app/g/[slug]/live/actions.ts:146` logs failed `session_players` creation but still returns a successful session start. This can create an active session with missing session roster rows.
- `src/app/g/[slug]/live/actions.ts:283` logs failed rally event inserts but still returns a successful match save. This can save a completed match without its audit/replay trail.
- `src/app/g/[slug]/live/record-match-actions.ts:14` has no played date field; line `120` always uses `new Date().toISOString()`. This confirms V2 needs `played_at` and historical manual-match handling.

## Live Scoring Persistence Audit

Current behavior:

- `src/app/g/[slug]/live/LivePageClient.tsx:172` saves a recoverable match when positions are confirmed.
- `src/app/g/[slug]/live/LiveScoring.tsx:118` appends each rally to local storage.
- `src/lib/offline/recovery.ts:27` writes recoverable match metadata.
- `src/lib/offline/recovery.ts:35` reads recoverable match metadata.
- `src/lib/offline/recovery.ts:53` rebuilds match history from local rally events.
- `src/app/g/[slug]/live/LivePageClient.tsx:458` shows a desktop recovery banner.
- `src/app/g/[slug]/live/MatchResult.tsx:128` clears recoverable local state after a successful save.

Gap against V2:

- Recovery is local-first and prompt-based, not a database-backed active match.
- No active match is created when scoring starts.
- No scorer identity, scorer lock, lock heartbeat, or takeover flow exists.
- Public viewers cannot reliably see active score state.
- Same-device route return can recover, but V2 requires auto-resume when unambiguous.

## UX/DX Audit

Primary UX gaps:

- Root route is not a landing page; it redirects to `/g/default`.
- Current visual system is table/card/panel heavy and still reads as admin dashboard in many places.
- PIN prompts are embedded in multiple flows and need replacement with consistent Clerk/admin states.
- Empty/loading/error states are uneven; `loading.tsx` exists for group route, but broader action failures are mostly inline strings.
- Mobile and tablet scoring are present, but V2 needs explicit mobile-first QA and same-device live navigation persistence.
- Public/private privacy states do not exist yet, so anonymous view UX is not designed.

Primary DX gaps:

- README does not document this project.
- Storage bucket setup is not codified.
- Service-role usage is broad, making future RLS confidence harder without a dedicated auth helper layer.
- Many server actions use `as any`, suggesting generated Supabase types are not fully aligned with migrations or query shapes.

## Performance And Data Risks

- Dashboard and stats derive from completed matches, which matches the product model, but V2 public launch should revisit query size and pagination as group data grows.
- History, leaderboard, and session detail are currently server-side reads and should be reviewed for N+1 or broad select patterns in later phases.
- Active live viewing via polling will need current-score snapshots to avoid expensive replay reads for spectators.
- Avatar upload accepts base64 from the client, which is simple but can be memory-heavy. V2 should consider direct upload or explicit compression/cropping before server action upload.

## Ops Readiness Gaps

- No documented production environment checklist.
- No documented Supabase migration/storage setup flow.
- No analytics or error tracking provider.
- Server actions often return generic errors and log details only to console.
- No rollback/runbook for data migration.
- No automated backup or baseline export yet; this belongs to Phase 0b.

## Phase 0a Acceptance Criteria Status

| Acceptance criterion | Status |
| --- | --- |
| All write actions are listed with future role requirements | Complete |
| All PIN-dependent files and flows are identified | Complete |
| All current schema tables and policies are documented | Complete |
| Current high-risk UX and data risks are captured | Complete |

## Recommended Next Step

Proceed to Phase 0b: data backup and baseline verification.

Before Phase 4 migration, also create a small auth authorization helper design so all V2 server actions use one clear Owner/Admin check instead of ad hoc Clerk checks spread across files.

