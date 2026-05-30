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

### PIN Gate Pattern: Gate the Action, Not the Visibility
Write-action buttons (End Game Day, Start Session, correct scores) should always be **visible** to all users. The PIN prompt triggers only when clicked and the user isn't authenticated. Hiding buttons behind `{isHost && ...}` creates confusion — users don't know the feature exists. Pattern:
```tsx
// ✅ Good: always show, gate on click
<button onClick={handleAction}>End Game Day</button>
// In handleAction: if (!isHost) { showPinPrompt(); return; }

// ❌ Bad: hide entirely
{isHost && <button onClick={handleAction}>End Game Day</button>}
```

---

## Architecture Decisions

*Document key architectural decisions and their rationale.*

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
