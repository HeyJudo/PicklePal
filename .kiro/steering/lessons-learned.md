---
inclusion: auto
description: Project-specific patterns, preferences, and lessons learned over time (user-editable)
---

# Lessons Learned

This file captures project-specific patterns, coding preferences, common pitfalls, and architectural decisions that emerge during development. It serves as a workaround for continuous learning by allowing you to document patterns manually.

**How to use this file:**
1. The `extract-patterns` hook will suggest patterns after agent sessions
2. Review suggestions and add genuinely useful patterns below
3. Edit this file directly to capture team conventions
4. Keep it focused on project-specific insights, not general best practices

---

## Project-Specific Patterns

*Document patterns unique to this project that the team should follow.*

### Example: API Error Handling
```typescript
// Always use our custom ApiError class for consistent error responses
throw new ApiError(404, 'Resource not found', { resourceId });
```

---

## Code Style Preferences

*Document team preferences that go beyond standard linting rules.*

### Example: Import Organization
```typescript
// Group imports: external, internal, types
import { useState } from 'react';
import { Button } from '@/components/ui';
import type { User } from '@/types';
```

---

## Kiro Hooks

### `install.sh` is additive-only — it won't update existing installations
The installer skips any file that already exists in the target (`if [ ! -f ... ]`). Running it against a folder that already has `.kiro/` will not overwrite or update hooks, agents, or steering files. To push updates to an existing project, manually copy the changed files or remove the target files first before re-running the installer.

### README.md mirrors hook configurations — keep them in sync
The hooks table and Example 5 in README.md document the action type (`runCommand` vs `askAgent`) and behavior of each hook. When changing a hook's `then.type` or behavior, update both the hook file and the corresponding README entries to avoid misleading documentation.

### Prefer `askAgent` over `runCommand` for file-event hooks
`runCommand` hooks on `fileEdited` or `fileCreated` events spawn a new terminal session every time they fire, creating friction. Use `askAgent` instead so the agent handles the task inline. Reserve `runCommand` for `userTriggered` hooks where a manual, isolated terminal run is intentional (e.g., `quality-gate`).

---

## Common Pitfalls

*Document mistakes that have been made and how to avoid them.*

### Tailwind Custom Color Tokens Must Be Defined Before Use
The `@theme inline` block in `globals.css` defines available color tokens. Using `bg-primary`, `text-primary`, or `border-primary` in components requires `--color-primary` to exist in the theme. If a component uses a semantic color class (e.g., `bg-secondary`, `bg-accent`) that isn't defined, the element renders transparent/invisible with no build error. Always verify new semantic tokens exist in `globals.css` before using them in components.

### Supabase Client Requires `as any` Cast for `.from()` Queries
The manually-defined `Database` type in `src/lib/supabase/types.ts` doesn't fully satisfy the Supabase client's generic inference, causing `never` type errors on `.from("table")` calls. The established workaround is:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data } = await (supabase as any)
  .from("sessions")
  .select("id, title")
  .eq("group_id", groupId)
  .single();
```
This applies to all server actions that query Supabase. A future fix: use `supabase gen types` to auto-generate proper types.

### Verify with `next build`, Not Just `tsc --noEmit`
Local `tsc --noEmit` can pass while `next build` (what Vercel runs) fails. Next.js has its own type-checking pass that catches issues `tsc` misses — particularly unused/missing type imports in `.tsx` files and server/client component boundary violations. Always run `npx next build` as the final verification before pushing, especially after removing or reorganizing imports.

### State-Changing Callbacks Must Call Server Actions Before Resetting Local State
When a UI callback represents a state change (e.g., ending a session, cancelling a match), it must call the corresponding server action **before** resetting local state or reloading. If the callback is shared across multiple components (e.g., `onSessionEnded` used by both `ActiveSession` and `MatchResult`), the callback itself should own the server call — don't rely on each caller to do it. The `endSession` bug happened because `ActiveSession` called the action before the callback, but `MatchResult` didn't. Pattern: centralize the server action call in the shared callback handler.

### Example: Database Transactions
- Always wrap multiple database operations in a transaction
- Remember to handle rollback on errors
- Don't forget to close connections in finally blocks

### Rally Events Are Reconstructed by Replay, Not Stored During Scoring
The `LiveScoring` component only tracks `MatchHistory` (rally winners + current state). When saving to DB, `buildRallyEvents()` in `LivePageClient` replays the match from the initial input to capture server state, scores, and side-outs at each rally. This avoids duplicating engine logic in the UI and guarantees saved events are consistent with the engine's rules. Pattern: UI stores minimal data (rally winners), reconstruct full event data at save time.

### Shared Action Files: Read Before Overwriting
`src/app/g/[slug]/actions.ts` is a shared server actions file imported by multiple components (PIN modal, live session, start form). When adding new server actions, always **read the existing file first** or append to it — never overwrite with `fs_write`. Multiple features share the same `actions.ts` at each route level. Use `git show HEAD:<path>` to recover if accidentally overwritten.

### Fixed UUIDs in Seed Data Must Use Valid Hex Characters Only
PostgreSQL UUID type only accepts hex characters (0-9, a-f). When creating readable fixed UUIDs for seed scripts, use hex-only prefixes like `a0`, `b0`, `c0`, `d0` — NOT mnemonic letters like `g` (group), `p` (player), `s` (session), `m` (match). Pattern:
```sql
-- ✅ Good: hex-only prefixes
'a0000000-0000-0000-0000-000000000001'  -- group
'b0000000-0000-0000-0000-000000000001'  -- player

-- ❌ Bad: non-hex letters
'g0000000-0000-0000-0000-000000000001'  -- invalid!
'p0000000-0000-0000-0000-000000000001'  -- invalid!
```

### html2canvas Requires Inline Styles for Reliable Export
When rendering HTML to canvas/PNG via html2canvas, use **inline `style={{}}` props** instead of Tailwind utility classes. html2canvas doesn't reliably resolve Tailwind's generated CSS classes, especially for custom theme tokens. The `OverlayContent` component in `src/components/share/OverlayRenderer.tsx` demonstrates this pattern — Tailwind is used for the surrounding UI (preview container, buttons) but the exportable content uses pure inline styles.

### PIN Gate Pattern: Gate the Action, Not the Visibility
Write-action buttons (End Game Day, Start Session, correct scores) should always be **visible** to all users. The PIN prompt triggers only when clicked and the user isn't authenticated. Hiding buttons behind `{isHost && ...}` creates confusion — users don't know the feature exists. Pattern:
```tsx
// ✅ Good: always show, gate on click
<button onClick={handleAction}>End Game Day</button>
// In handleAction: if (!isHost) { showPinPrompt(); return; }

// ❌ Bad: hide entirely
{isHost && <button onClick={handleAction}>End Game Day</button>}
```

**Exception:** For actions that are purely local state (no server write), like swapping players in a generated matchup, skip the PIN gate entirely. The PIN is only meaningful for actions that persist to the database. Server actions use service-role key and execute regardless of client-side `isHost` state — so `isHost` is purely a UX hint, not a security boundary.

### `MatchQueue` Uses `useState` Initializer — Reset with `key` Prop on Player Changes
The `MatchQueue` component initializes its `MatchmakingState` via `useState(() => createMatchmakingState(...))`. This means if the player list changes (bench/activate/add), the internal state won't update. The fix is to pass a `key` prop derived from the active player IDs so React remounts the component with fresh state:
```tsx
<MatchQueue
  key={activePlayers.map((p) => p.id).join(",")}
  players={activePlayers}
  matchType={matchType}
  onMatchSelected={onMatchConfirmed}
/>
```
This pattern applies to any component that derives initial state from props via `useState` initializer and needs to reset when those props change structurally.

### Court Position Labels Must Account for Team Facing Direction
In a top-down bird's-eye court view with the net as a vertical center line, the two teams face **opposite directions**. This means "Right" and "Left" are **mirrored** for Team A vs Team B:
- **Team B** (right side, facing left): Top = Right, Bottom = Left
- **Team A** (left side, facing right): Top = Left, Bottom = Right

When rendering court positions or labels, always invert the spatial mapping for the team on the left side of the net. The engine's `DoublesPositions` type uses `{ right, left }` — map these to screen positions differently per team:
```tsx
// Team A (left side of court, facing right)
const teamATop = positions.teamA.left;   // their left is screen-top
const teamABot = positions.teamA.right;  // their right is screen-bottom

// Team B (right side of court, facing left)  
const teamBTop = positions.teamB.right;  // their right is screen-top
const teamBBot = positions.teamB.left;   // their left is screen-bottom
```

### `setX(prev => ...)` Callbacks Must Exclude the Item Being Mutated from Aggregate Counts
When computing derived counts inside a functional state updater (`setX(prev => ...)`), exclude the item currently being changed from those counts. Otherwise the count includes the item's *old* assignment, making capacity checks stale. This came up in `ManualMatchupPicker`'s `cycleAssignment`:
```typescript
// ❌ Bad: teamACount includes the player being cycled
const teamACount = players.filter(p => prev.get(p.id) === "teamA").length;

// ✅ Good: exclude the player being mutated
const teamACount = players.filter(
  p => p.id !== playerId && prev.get(p.id) === "teamA"
).length;
```
Applies anywhere you check "is there room?" before assigning an item to a slot, inside a state updater that also changes that item.

### Admin-Only UI Must Appear in Both Empty and Populated States
The group dashboard has two render paths: `EmptyDashboard` (0 games) and `HeroSection` (1+ games). Any admin-visible UI (settings gear, admin badges, management links) must be added to **both** components, not just the populated one. New groups spend their entire early life in the empty state, so admins will never see settings if it's only in `HeroSection`. Pattern: when adding admin-conditional UI to a page with an empty/populated split, always check both branches.

### Desktop 3-Column Layouts: Split Monolithic Components, Don't Nest Them
When adapting a mobile-first component (like `ActiveSession`) into a multi-column desktop layout, **don't render the monolithic component in one column** and leave others empty. Instead, render its sub-components (`MatchQueue`, `SessionPlayerList`, etc.) directly into their appropriate columns at the parent level. Keep the monolithic component for mobile only via `lg:hidden`. Pattern:
```tsx
// ✅ Good: split sub-components across columns on desktop
<div className="hidden lg:grid lg:grid-cols-[260px_1fr_260px]">
  <aside><SessionPlayerList /></aside>
  <main><MatchQueue /></main>
  <aside><Leaderboard /></aside>
</div>
<div className="lg:hidden">
  <ActiveSession /> {/* monolithic mobile view */}
</div>

// ❌ Bad: jam the monolithic component into one column
<div className="hidden lg:grid lg:grid-cols-3">
  <aside><ActiveSession /></aside> {/* crammed + duplicate UI */}
  <main>{/* empty placeholder */}</main>
</div>
```
This avoids duplicate UI elements and puts the right content in the right column as the focal point.

### Manual Matchup Flows Into Existing Pipelines Without Schema Changes
When adding an alternative entry path to an existing flow (e.g., "Pick Teams" as an alternative to auto-generate), design the alternative to produce the **same output type** as the original path. `ManualMatchupPicker` produces a `Matchup` object identical to `generateNextMatchup()`'s output — so Position Confirmation, LiveScoring, and MatchResult required zero changes. Pattern: identify the "handoff type" at the boundary between the new entry point and the existing pipeline, and build to that type exactly.

---

### Clerk v7 `UserButton` Has No `afterSignOutUrl` Prop
In `@clerk/nextjs` v7+, the `UserButton` component no longer accepts `afterSignOutUrl` as a prop (it did in v5/v6). Sign-out redirect behavior is configured either in the Clerk dashboard or via `ClerkProvider`'s `afterSignOutUrl` prop at the layout level. When checking Clerk component APIs, always verify against the installed major version — their API surface changes significantly between majors.

### Next.js 16 Deprecates `middleware.ts` in Favor of `proxy.ts`
Next.js 16 shows a warning: `The "middleware" file convention is deprecated. Please use "proxy" instead.` The current `src/middleware.ts` with Clerk's `clerkMiddleware` still works but will need migration to the `proxy` convention in a future pass. When that happens, check Clerk's docs for their updated Next.js 16+ integration pattern before renaming the file — the API surface may change.

## Architecture Decisions

*Document key architectural decisions and their rationale.*

### Membership Queries Need a Fallback for Pre-Migration Data
When switching from "show all groups" to "show groups by membership," always include a fallback path for the pre-migration state where the `group_memberships` table exists but has no rows for the current user. The pattern in `src/app/app/actions.ts`:
```typescript
const userGroups = await getUserGroups(clerkUserId);
if (userGroups.length > 0) {
  // Use membership-based filtering
} else {
  // Fallback: show all groups (pre-migration compatibility)
}
```
This prevents the dashboard from appearing empty for the existing friend group until Phase 4 migration assigns ownership. Remove the fallback after Phase 4 is complete.

### Clerk Auth Is Separate From Supabase — Bridge via `profiles` Table
Clerk handles organizer/admin authentication (sign-up, sign-in, session tokens). Supabase remains the database. They are **not coupled** — Clerk doesn't write to Supabase directly. The bridge is a `profiles` table (Phase 3a) that maps `clerk_user_id` → app identity. Server actions use `currentUser()` from Clerk to identify the caller, then query Supabase with the service role key. RLS policies will later use Clerk's JWT claims for row-level access, but that's Phase 3d.

### Token-Based Invite Pattern: Hash in DB, Raw in URL
For invite/reset/verification tokens, generate with `crypto.randomBytes(32).toString("base64url")`, store only the SHA-256 hash in the database, and put the raw token in the shareable URL. This means:
- DB leak doesn't compromise active tokens
- Lookup is still fast via unique index on `token_hash`
- Token validation: hash the URL param and query by hash
- Use `base64url` encoding (not `hex`) for shorter URLs
```typescript
import { randomBytes, createHash } from "crypto";
const token = randomBytes(32).toString("base64url");        // share this
const tokenHash = createHash("sha256").update(token).digest("hex"); // store this
```
This pattern applies to any feature that needs secure, one-time-use links (invites, password resets, email verification).

### Example: State Management
- **Decision**: Use Zustand for global state, React Context for component trees
- **Rationale**: Zustand provides better performance and simpler API than Redux
- **Trade-offs**: Less ecosystem tooling than Redux, but sufficient for our needs

---

## Notes

- Keep entries concise and actionable
- Remove patterns that are no longer relevant
- Update patterns as the project evolves
- Focus on what's unique to this project
