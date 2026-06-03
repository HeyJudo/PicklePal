# PicklePal V2.0.0 Public Beta Launch Plan

Date: 2026-06-03
Status: Planning
Baseline: Current PicklePal friend-group app, treated as V1 production baseline

> Note: "PicklePal" remains the internal project codename until the V2 rename phase chooses the public launch name.

---

## V2 Goal

V2.0.0 turns the current friend-group pickleball tracker into a public beta product for pickleball friend groups and casual clubs.

Product promise:

```text
Run pickleball game day without spreadsheets, group chats, or messy scorekeeping.
```

V2 keeps the working core of the app: scoring engine, matchmaking, sessions, leaderboards, history, awards, recap cards, and offline-resilient active scoring. It replaces the friend-group PIN model with organizer accounts, multi-group ownership, public launch onboarding, stronger branding, and production-ready UX.

---

## Scope Summary

### Included In V2.0.0

- New public brand/name selection before launch.
- Public landing page at `/`.
- Clerk authentication for organizers/admins.
- Organizer dashboard at `/app`.
- First-group onboarding.
- Multiple groups per signed-in organizer.
- Owner/Admin group roles.
- Email-based admin invites.
- Public Link and Private group privacy modes.
- Public-by-link group pages for public groups.
- Preservation and migration of the current friend-group data.
- Removal of host PIN flows after auth migration.
- Mobile/tablet-first UX refresh across the product.
- Live scoring route persistence and same-device auto-resume.
- One active scorer device per live match, with clear lock/takeover UX.
- Public view-only live match updates for Public Link groups.
- Historical manual match entry with past played dates.
- Redesigned recaps, share cards, and public metadata.
- Launch hardening: tests, accessibility, error states, observability, env docs, release checklist.

### Explicit Non-Goals For V2.0.0

- Player accounts or required player sign-up.
- Clerk Organizations.
- Billing, subscriptions, or paid plans.
- Elo, internal ratings, or official DUPR integration.
- Tournament brackets.
- Public group discovery/directory.
- Multi-device simultaneous scoring.
- Full offline-first app launch.
- Advanced social feed or notifications.

---

## Product Model

### Target Users

V2 targets friend groups and casual clubs where one or more organizers run recurring pickleball sessions.

Players in a pickleball run should not need accounts. The organizer creates a group, adds roster entries, runs sessions, and manages match history. Players and friends can view public-by-link pages if the group allows it.

### Auth Model

Clerk handles organizer/admin sign-in and user profile UI.

Only organizers/admins are authenticated app users. Players remain group roster records.

Former PIN-protected actions become Owner/Admin-only actions:

- Start/end sessions.
- Score matches.
- Generate or manually override matchups.
- Add/edit players.
- Upload player avatars.
- Record historical matches.
- Correct/delete matches.
- Change group settings.
- Invite admins.

### Group Privacy

Groups support two privacy modes:

```text
public_link
private
```

Public Link groups can be viewed by anyone with the group URL. Private groups require signed-in Owner/Admin access.

No public directory is included in V2.0.0.

---

## Route Structure

Recommended V2 routes:

```text
/                         Public marketing landing page
/app                      Signed-in My Groups dashboard
/onboarding               First-group setup
/g/[slug]                 Group home
/g/[slug]/live            Live session, scoring, view-only active match
/g/[slug]/board           Leaderboard
/g/[slug]/history         Match history
/g/[slug]/players         Roster
/g/[slug]/players/[id]    Player profile
/g/[slug]/sessions/[id]   Session detail
/g/[slug]/sessions/[id]/recap
/g/[slug]/settings        Group settings, privacy, admins, defaults
```

The existing `/g/[slug]` product surface stays group-scoped. The root `/` changes from app entry to public landing page.

---

## Architecture Direction

### Core Architecture

- Next.js App Router remains the application framework.
- Supabase remains the database and storage layer.
- Clerk becomes the auth provider for organizer/admin accounts.
- Server actions remain the main write boundary.
- Supabase RLS is updated to match group privacy and group membership rules.
- Current pure TypeScript engine, stats, matchmaking, and offline modules are preserved unless a launch requirement forces a targeted change.

### Data Model Changes

New or changed concepts:

```text
profiles
- clerk_user_id
- display_name
- created_at

group_memberships
- group_id
- clerk_user_id
- role: owner | admin
- invited_by
- accepted_at
- created_at

admin_invites
- group_id
- email
- role
- token_hash
- status: pending | accepted | revoked | expired
- expires_at
- created_at

groups
- keep id, name, slug, settings
- add privacy_mode: public_link | private
- retire host_pin_hash after migration

matches
- support active DB match at scoring start
- source: live | manual
- played_at
- scorer_clerk_user_id
- scorer_lock_status / heartbeat fields
- current score and server snapshot for viewer pages
```

### Auth And RLS Rules

Server actions must enforce Owner/Admin role checks before writes.

RLS should support:

- Public reads for Public Link groups.
- Authenticated Owner/Admin reads for Private groups.
- Owner/Admin writes for group-owned records.
- Service-role access only for trusted server maintenance, migrations, and controlled server-only operations.

### Current Data Preservation

The current default/friend group must be migrated into a real production group owned by the primary Clerk user.

Migration must preserve:

- Group record and slug, or a chosen replacement slug.
- Players.
- Player avatars/colors.
- Sessions.
- Matches.
- Rally events.
- Match queue items where still relevant.
- Recap cards/configs.
- Derived stats behavior.

Before removing PIN code, verify leaderboards, player stats, history, session summaries, and awards match the pre-migration baseline.

---

## UX And Brand Direction

V2 requires a full visual system refresh on the existing product architecture.

The current UI leans too much toward bordered panels, admin cards, tables, and small text. V2 should feel like a consumer sports product: energetic, social, courtside-ready, and clearly branded.

### Brand Requirements

- Choose a new public name before landing page and redesign work.
- Keep PicklePal as internal codename until rename is complete.
- Check domain, social handle, and obvious trademark/name collisions before committing to a public name.
- Build a coherent identity across landing page, app shell, score UI, recaps, and share assets.

### Device Priority

```text
1. Phone: onboarding, viewing, sharing, quick management
2. Tablet/iPad: courtside scoring and session operation
3. Desktop: admin review, stats, history, settings
```

Every core flow must have mobile-first acceptance criteria, then tablet and desktop checks.

### UX Surfaces

- Landing page: sell the game day workflow, with Create Group and View Demo Group CTAs.
- Onboarding: sign in, create group, choose slug, add starter players.
- My Groups: owned/admin groups, active sessions, recent activity, create group.
- Group home: public/private scoreboard and activity snapshot.
- Live: persistent scoring, active match viewer, scorer lock, strong tablet layout.
- Leaderboard/history/players: more visual on mobile, still scannable on desktop.
- Recaps/share cards: stronger end-of-session payoff and mobile share reliability.

---

## V2 Phase Plan

## Phase 0: Baseline Audit And Backup

Purpose: establish a safe baseline before auth, migration, and redesign work.

### 0a. Current App Audit

Deliverables: DONE

- Audit current routes, server actions, Supabase schema, RLS policies, storage buckets, and environment variables.
- Identify every PIN dependency.
- Identify every write action and classify required Owner/Admin permissions.
- Audit current mobile/tablet/desktop UX gaps.
- Audit live scoring persistence and local recovery behavior.

Acceptance criteria:

- All write actions are listed with future role requirements.
- All PIN-dependent files and flows are identified.
- All current schema tables and policies are documented.
- Current high-risk UX and data risks are captured.

### 0b. Data Backup And Baseline Verification

Deliverables:DONE

- Export/backup current Supabase data.
- Capture baseline counts for groups, players, sessions, matches, rally events, and recap records.
- Capture baseline derived outputs: leaderboard, player stats, session awards, and recent history.

Acceptance criteria:

- Backup exists before migrations run.
- Baseline stats are recorded for post-migration comparison.
- Rollback path is documented.

---

## Phase 1: Rename, Brand, And Landing Foundation

Purpose: choose a public identity before public launch UI and metadata work.

### 1a. Public Name Selection

Deliverables:

- Shortlist 5-10 candidate names.
- Check domain availability.
- Check social/app handle availability where relevant.
- Check obvious web and trademark collisions.
- Choose final public launch name.

Acceptance criteria:

- Final name is approved before landing page implementation.
- Internal codename vs public brand is documented.

### 1b. Brand System

Deliverables:

- Logo direction.
- Typography direction.
- Sporty color system.
- Icon/motion guidance.
- Voice and copy principles.

Acceptance criteria:

- Brand system supports mobile/tablet-first UI.
- Visual language avoids the current portal/table-first feeling.
- Share cards and landing page can use the same identity.

### 1c. Landing Page Plan

Deliverables:

- Landing sections and copy outline.
- Create Group CTA.
- View Demo Group CTA.
- Demo group content strategy with safe fake data.

Acceptance criteria:

- Landing page communicates live scoring, fair rotations, leaderboards, and recaps.
- Demo path does not expose the real friend-group data.

---

## Phase 2: Clerk Auth And App Dashboard

Purpose: add account-based entry without changing player roster behavior.

### 2a. Clerk Integration

Deliverables:

- Clerk SDK setup for Next.js.
- Sign-in/sign-up routes or Clerk components.
- User profile access.
- Middleware/protection for authenticated app routes.
- Environment documentation.

Acceptance criteria:

- Organizer can sign up and sign in.
- Anonymous visitors can still view allowed public routes.
- Auth state is available in server actions.

### 2b. My Groups Dashboard

Deliverables:

- `/app` route.
- Groups owned/admined by signed-in user.
- Active session shortcuts.
- Recent group activity.
- Create Group CTA.

Acceptance criteria:

- User can see multiple owned/admin groups.
- User with no groups is directed into onboarding/create group.
- Desktop and mobile layouts are usable.

### 2c. First-Group Onboarding Shell

Deliverables:

- `/onboarding` route.
- Group name step.
- Slug step.
- Starter player step.

Acceptance criteria:

- New signed-in organizer can create a first group without touching Supabase directly.
- Onboarding lands the organizer on the new group dashboard.

---

## Phase 3: Groups, Memberships, Invites, And Privacy

Purpose: define public-launch ownership and access control.

### 3a. Profiles And Memberships

Deliverables:

- `profiles` table or equivalent Clerk user mapping.
- `group_memberships` table.
- Owner/Admin role model.
- Membership helper functions.

Acceptance criteria:

- Group owner is recorded when a group is created.
- Owner/Admin checks are reusable in server actions.
- Players remain roster records, not users.

### 3b. Admin Invites

Deliverables:

- Email-based admin invite model.
- Invite creation by Owner/Admin.
- Invite accept flow after Clerk sign-in.
- Invite revoke/expire handling.

Acceptance criteria:

- Owner can invite another admin by email.
- Invited admin can sign in and gain group admin access.
- Players are not invited as app users.

### 3c. Group Privacy

Deliverables:

- `public_link` and `private` privacy modes.
- Public read behavior for Public Link groups.
- Authenticated-only read behavior for Private groups.
- Settings UI control.

Acceptance criteria:

- Public Link group pages are viewable anonymously.
- Private group pages block anonymous visitors.
- Owner/Admin write permissions are unchanged by privacy mode.

### 3d. RLS And Server Action Authorization

Deliverables:

- RLS policies aligned with Clerk identity and group memberships.
- Server-action role checks for all writes.
- Tests for public/private access decisions.

Acceptance criteria:

- Unauthorized writes fail.
- Anonymous reads respect group privacy.
- Owner/Admin writes succeed.
- Service role is not used as a broad bypass for normal product writes.

---

## Phase 4: Data Migration And PIN Removal

Purpose: preserve the current group while removing the PIN model.

### 4a. Current Group Ownership Migration

Deliverables:

- Migration script or manual migration steps.
- Assign current group to primary Clerk user as Owner.
- Optional slug rename for the real group.

Acceptance criteria:

- Current group appears in the Owner's My Groups dashboard.
- Historical data remains attached to the group.
- Counts match the baseline backup.

### 4b. Post-Migration Stats Verification

Deliverables:

- Compare leaderboard, player stats, history, session summaries, awards, and recaps before/after migration.
- Document differences if any are expected.

Acceptance criteria:

- Derived outputs match baseline.
- No completed match data is lost.

### 4c. PIN Flow Removal

Deliverables:

- Remove PIN modal/write gates from product flows.
- Remove or retire host PIN utilities and hooks.
- Remove `host_pin_hash` dependency from groups.
- Replace all PIN checks with role checks.

Acceptance criteria:

- No write flow asks for a PIN.
- Former PIN-protected actions require Owner/Admin auth.
- Current friend-group data is still usable after PIN removal.

---

## Phase 5: Multi-Group Onboarding And Settings

Purpose: make multi-group creation and management first-class.

### 5a. Create Group Flow

Deliverables:

- Create group from `/app`.
- Group name and slug validation.
- Starter roster entry.
- Default settings.

Acceptance criteria:

- One user can create multiple groups.
- Slugs are unique and validated.
- Created group is immediately usable.

### 5b. Group Settings

Deliverables:

- `/g/[slug]/settings`.
- Name/slug management.
- Privacy mode.
- Default match type.
- Target score.
- Win-by setting.
- Qualification threshold.
- Admin management.

Acceptance criteria:

- Settings are Owner/Admin-only.
- Changes affect future sessions without rewriting historical matches.
- Mobile settings UI is clear and not cramped.

### 5c. Player Avatar Rules

Deliverables:

- Optional organizer-managed avatars.
- Image size limits.
- Upload/crop/compression approach.
- Storage bucket policy.
- Polished initials/color fallback.

Acceptance criteria:

- Admin can add/edit player avatar.
- Public pages render avatars safely.
- Missing avatars still look intentional.

---

## Phase 6: Live Scoring Resilience And Viewer Mode

Purpose: make live scoring reliable across navigation, auth, and public viewing.

### 6a. Active DB Match At Scoring Start

Deliverables:

- Create an active match record when scoring starts.
- Store teams, starting server, scorer identity, status, and current snapshot.
- Keep local rally queue as offline fallback.

Acceptance criteria:

- Active match exists before completion.
- Group home/live page can show active match state.
- Offline local scoring still works if the screen is already open.

### 6b. Same-Device Auto-Resume

Deliverables:

- Returning to Live after visiting Board/Players/History restores the active scoring screen.
- Score, server, positions, rally history, undo stack, and sync state restore.
- Ambiguous cases show a Resume prompt.

Acceptance criteria:

- Same scorer device auto-resumes during an active match.
- Completed/stale/taken-over matches do not incorrectly resume.
- Mobile and tablet navigation are tested.

### 6c. Scorer Lock And Takeover UX

Deliverables:

- One active scorer device per live match.
- Scorer heartbeat or lock timestamp.
- View-only mode for non-scoring users.
- Intentional takeover flow for admins.

Acceptance criteria:

- Two admins cannot accidentally score the same match at once.
- If scorer device dies, another admin can intentionally take over.
- Public viewers never see scoring controls.

### 6d. Public View-Only Live Updates

Deliverables:

- Public Link groups show active match score, teams, server, and status.
- Polling every 3-5 seconds for viewers.
- Private groups require auth to view.

Acceptance criteria:

- Public viewers see near-real-time synced state.
- Offline unsynced rallies do not expose incorrect future state.
- Viewer UI is distinct from scorer UI.

---

## Phase 7: Core UX Refresh

Purpose: replace the portal feel with a branded sports product experience.

### 7a. App Shell And Navigation

Deliverables:

- New brand header/navigation.
- Mobile bottom navigation refinement.
- Tablet scoring layout.
- Desktop responsive shell.

Acceptance criteria:

- Navigation is clear at 375px, tablet, and desktop widths.
- Current route is obvious.
- Admin controls do not clutter public viewing.

### 7b. Group Home Refresh

Deliverables:

- Sporty group dashboard.
- Active Game Day emphasis.
- Top players/duos/recent matches.
- Empty state for new groups.

Acceptance criteria:

- Public group page feels branded and social.
- Empty group guides organizer toward first session.
- Mobile page is not a stack of generic cards.

### 7c. Live Flow Refresh

Deliverables:

- Session setup.
- Player selection.
- Match queue.
- Position confirmation.
- Court scoring.
- Result screen.
- End-session flow.

Acceptance criteria:

- Core scoring controls are large and outdoor-readable.
- Tablet scoring is optimized for courtside use.
- Flow remains fast for repeated games.

### 7d. Board, History, Players, Sessions Refresh

Deliverables:

- Leaderboard mobile-first layout.
- History cards/list.
- Player roster/profile redesign.
- Session detail redesign.
- Inline admin controls where appropriate.

Acceptance criteria:

- Mobile pages are visual and scannable.
- Desktop still supports dense review.
- Tables are used only where they are the best interaction.

### 7e. Loading, Empty, And Error States

Deliverables:

- Skeletons.
- Empty states.
- Error boundaries.
- Toasts or clear action feedback.

Acceptance criteria:

- Missing data, failed actions, and loading states do not feel broken.
- Error messages tell users what to do next.

---

## Phase 8: Manual Past Matches And Session Improvements

Purpose: support real-world scorekeeping when matches were not scored live.

### 8a. Standalone Historical Match Entry

Deliverables:

- Admin can record a match outside an active session.
- Played date supports yesterday, last week, or older historical dates.
- Optional session assignment.
- If no session is selected, create/use a manual session bucket for that date.

Acceptance criteria:

- Historical match appears in history with the correct played date.
- Match counts toward leaderboard/stats by default.
- Future dates are blocked unless a later feature explicitly supports them.

### 8b. Manual Entry Source Labeling

Deliverables:

- `source: manual | live`.
- History/session/player stat labels.
- Correction and deletion for manual matches.

Acceptance criteria:

- Manual and live matches count equally in stats.
- Users can tell which matches were manually entered.
- Admin can correct/delete manual entries.

### 8c. Session Setup Improvements

Deliverables:

- Reusable default match settings.
- Cleaner player selection.
- Refined late arrival/temporary bench controls.
- Manual matchup override polish.

Acceptance criteria:

- Admin can run common game day setup quickly.
- Existing late arrival and manual override behavior is preserved or improved.

---

## Phase 9: Recaps, Share Cards, And Public Metadata

Purpose: make the social payoff launch-ready.

### 9a. Recap Ceremony Refresh

Deliverables:

- MVP of the Day.
- Hottest Duo.
- Best Match.
- Session summary.
- Improved transitions and mobile flow.

Acceptance criteria:

- Existing award formulas remain correct.
- End-session recap feels celebratory.
- Skip path remains available.

### 9b. Share Card And Overlay Refresh

Deliverables:

- Branded 9:16 share templates.
- Transparent overlay export retained.
- Mobile download/share reliability pass.
- Public recap access after session completion.

Acceptance criteria:

- Share output uses final V2 brand.
- Export works on mobile and desktop test devices/browsers.
- Recaps are accessible later from session detail.

### 9c. SEO And Social Metadata

Deliverables:

- Landing page metadata.
- Group page metadata where appropriate.
- Public recap metadata.
- Open Graph/Twitter preview image.
- Favicon/app icons.
- Sitemap/robots.

Acceptance criteria:

- Shared links look intentional in chat/social previews.
- Private groups do not expose private details through metadata.

---

## Phase 10: Launch Hardening And V2.0.0 Release

Purpose: prepare the public beta release.

### 10a. Test Coverage

Deliverables:

- Vitest coverage for auth helpers, permissions, stats, matchmaking, manual entry validation, migration helpers where practical.
- Playwright E2E for onboarding, group creation, admin invite, start session, score match, navigate away/resume live scoring, manual past match, public group view.

Acceptance criteria:

- Core public beta flows pass locally.
- Existing scoring engine tests remain green.
- Permission regressions are covered.

### 10b. Accessibility And Responsive QA

Deliverables:

- Mobile 375px check.
- Tablet/iPad scoring check.
- Desktop responsive check.
- Keyboard navigation for core routes.
- WCAG AA contrast review for key text/actions.

Acceptance criteria:

- No critical layout overlap.
- Core actions are reachable and readable.
- Live scoring remains usable outdoors.

### 10c. Observability And Error Handling

Deliverables:

- Basic analytics/observability choice.
- Error logging for server actions.
- Clear user-facing failure states.
- Sync/recovery diagnostics for live scoring.

Acceptance criteria:

- Common production failures are visible to the maintainer.
- Users get clear feedback when actions fail.

### 10d. Release Checklist

Deliverables:

- Production environment checklist.
- Clerk production setup checklist.
- Supabase migration checklist.
- Data backup checklist.
- Rollback plan.
- Package/app version updated to `2.0.0`.
- Public beta launch notes.

Acceptance criteria:

- V2 can be deployed without relying on undocumented local knowledge.
- Rollback path is understood before launch.
- Public beta release is labeled clearly.

---

## Recommended Build Order

```text
1. Phase 0  Audit and backup
2. Phase 1  Rename and brand foundation
3. Phase 2  Clerk auth and My Groups dashboard
4. Phase 3  Memberships, invites, privacy, RLS
5. Phase 4  Current group migration and PIN removal
6. Phase 5  Multi-group onboarding and settings
7. Phase 6  Live scoring resilience and viewer mode
8. Phase 7  Core UX refresh
9. Phase 8  Manual past matches and session improvements
10. Phase 9 Recaps, share cards, public metadata
11. Phase 10 Launch hardening and release
```

The first major checkpoint is after Phase 5:

```text
Sign up -> create/manage group -> migrated current group preserved -> no PIN writes -> multiple groups work
```

The second major checkpoint is after Phase 8:

```text
Start session -> score live -> navigate away/back -> resume scoring -> save result -> manual past match -> stats update
```

The final checkpoint is after Phase 10:

```text
Public landing -> create group -> run game day -> view public live/board/history -> share recap -> release as V2.0.0 public beta
```

---

## Key Decisions Captured

- V2.0.0 is a public beta, not a paid stable SaaS launch.
- Clerk is used for organizer/admin auth.
- Supabase remains the database.
- Players do not need accounts.
- One organizer can create/manage multiple groups.
- Public group discovery is excluded.
- Current friend-group data must be preserved.
- PIN is removed after migration.
- Mobile/tablet UX is prioritized over desktop.
- Active scoring must persist across route navigation.
- Manual matches can be entered for past dates.
- Ratings and DUPR are skipped for V2.0.0.
- Branding/name must change before public launch.

---

## Open Follow-Up Items

These are not blockers for the plan, but must be resolved during execution:

- Final public product name.
- Production domain.
- Clerk production pricing/features verification at implementation time.
- Exact Supabase RLS policy implementation for Clerk claims.
- Whether the current friend group keeps `/g/default` or moves to a cleaner slug.
- Analytics/error tracking provider.
- Demo group names/photos/content.

