# DinkDay (PicklePal)

Mobile-first pickleball web app — live scoring, fair matchmaking, leaderboards, belts, and Game Day recaps for your crew. Live at [dinkday.site](https://dinkday.site).

Built with Next.js (App Router), React, TypeScript, Tailwind CSS, Clerk (auth), and Supabase (Postgres).

## Getting Started

```bash
pnpm install
cp .env.local.example .env.local   # fill in Supabase + Clerk keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev              # dev server
pnpm build            # production build
pnpm lint             # eslint
pnpm format           # prettier
pnpm test             # vitest unit tests
pnpm test:coverage    # coverage report
pnpm backup:baseline  # DB backup script
```

## Documentation

- `../AGENTS.md` — full project context: architecture, auth model, data model, scoring rules
- `../CLAUDE.md` — contributor/AI workflow rules
- `../docs/PICKLEPAL-V2-LAUNCH-PLAN.md` — V2 launch plan
- `../docs/DINKDAY-BRAND-KIT.md` — brand kit

## Deployment

Deployed on [Vercel](https://vercel.com). Database migrations live in `supabase/migrations/` and are applied manually to the Supabase project.
