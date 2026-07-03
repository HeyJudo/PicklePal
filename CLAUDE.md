# CLAUDE.md

Guidance for Claude Code when working in this repository.

**Project context lives in `AGENTS.md`** — read it first for architecture, auth model, data model, scoring rules, and current status. This file covers workflow rules and commands.

## Project Layout

The Next.js app is in `picklepal/` — run all package commands from there. Docs and planning live at the repo root (`docs/`, `AGENTS.md`).

## Commands

```bash
cd picklepal
pnpm dev              # dev server (localhost:3000)
pnpm build            # production build
pnpm lint             # eslint
pnpm format           # prettier --write on src/**
pnpm test             # vitest run (unit tests)
pnpm test:watch       # vitest watch mode
pnpm test:coverage    # coverage report
```

Package manager is **pnpm** — never npm or yarn.

## Planning

- Present the plan/approach before making any code changes — unless explicitly told to just do it.
- Explain plans from the user's perspective: what actually changes for them, not just internal implementation detail.
- Default to Sonnet agents for codebase scans / exploration.

## Communication

- Be direct. Give a recommendation, not an exhaustive survey of options.
- Only ask about things that genuinely need a decision (architecture and similar) — not trivial choices.

## Git

- **Never auto-commit.** Make the changes, then wait for an explicit "go" / commit command.
- Before committing, run and confirm checks pass (prettier, lint, tests) — only commit once green.
- Commit messages: `type(scope): message` (feat, fix, refactor, test, docs, chore).
- Branch names: `type/scope` (e.g. `feat/smarter-matchmaking`).
- No co-author trailer (already disabled in settings — keep it off).
- Feature branches off `main`; never push directly to `main`.

## Code Quality

- Follow best practices: maintainable, scalable, DRY.
- TypeScript strict; immutability throughout — never mutate, return new objects (critical in `src/lib/engine/` and `src/lib/matchmaking/`).
- `src/lib/engine/` and `src/lib/matchmaking/` stay pure TypeScript — no React, no Supabase, no framework imports.
- Every write server action must start with `authorizeGroupWrite()` from `src/lib/auth` — server actions use the service-role Supabase client, so this check is the security boundary.
- Validate at boundaries (user input, external data); never swallow errors silently.
- Small files (200–400 lines typical), small functions (<50 lines), max 4 nesting levels.

## Testing

- Framework: Vitest, colocated in `__tests__/` dirs. Run with `pnpm test` from `picklepal/`.
- **No integration tests** — especially none that touch a database or external API.
- **No tests for pure UI / visual frontend changes** that contain no logic.
- For straightforward changes (button tweaks, minor logic): update the existing test if there is one; if there's none, leave it as-is.
- Domain logic (engine, matchmaking, stats, validation) does warrant unit tests — keep the scoring engine's coverage high.

## Database

- Schema changes = new numbered migration in `picklepal/supabase/migrations/` (currently at 017) + update `src/lib/supabase/types.ts`.
- Never run migrations against production without explicit approval.
- RLS handles public reads; writes go through server actions only.

## UI

- Mobile-first — test at 375px minimum. High contrast for outdoor readability.
- DinkDay brand: court green + sky blue, warm-yellow celebration accent — see `docs/DINKDAY-BRAND-KIT.md`.
- Tailwind 4; animations via `motion` (Framer Motion).
