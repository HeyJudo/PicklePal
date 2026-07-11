# Belts Phase 4 — Hall of Fame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "Hall of Fame" page that immortalizes every belt reign (current + historical) per belt type, showing who held each belt and for how long, plus nav + discoverability links to it.

**Architecture:** A new server action (`getBeltHistory`) resolves the group from the slug, calls the existing `getBeltReigns(groupId)`, builds an id→name map from ALL the group's players, and returns a display-ready structure grouped by belt type. A new server-component page renders it with the existing `BeltMedallion` and `getBeltMeta` design pieces. Nav components and the belt legend get a "Titles"/"Hall of Fame" link. Optionally, the player profile gains a "Titles" section fed reign data through the existing prop chain.

**Tech Stack:** Next.js App Router (server components + `"use server"` actions), Tailwind v4, Supabase (service-role via existing helpers), lucide-react, motion (already installed). No new npm deps.

## Global Constraints

- All paths are under `picklepal/`. Run all commands from `picklepal/`.
- Reuse existing belt logic — DO NOT modify belt computation, migration `017_belt_reigns.sql`, or the recompute hooks.
- Reuse design tokens only: `court-green`, `court-green-dark`, `ball-yellow`, `sky-blue`, `sky-blue-dark`, `hype-red`, `surface`, `surface-elevated`, `surface-muted`, `text-primary`, `text-secondary`, `text-muted`, `border`, `border-muted`.
- Fonts: Outfit (body, default), `font-display` (Anton) ONLY for the big hero H1, `font-label`/`font-score` (Archivo Narrow) for tiny uppercase labels & numbers.
- REUSE these — do not rewrite: `getBeltReigns(groupId)` and types `BeltReign`/`BeltType` from `@/lib/belts/recomputeBelts`; `BeltMedallion` from `@/components/belts/BeltMedallion`; `getBeltMeta(beltType)` from `@/components/belts/BeltBadge` (returns `{ emoji, label, description }`).
- Belt order everywhere: King → Poacher → Pickler, i.e. `["king_of_the_kitchen", "poacher", "pickler"]`.
- Server components for pages; `"use server"` for action files. Match conventions in `board/page.tsx` and `board/actions.ts`.
- Mobile-first; both nav variants (`DesktopNav` w-5 h-5 icons, `BottomNav` w-[22px] h-[22px] icons) must stay clean. 6 bottom tabs use `flex-1` each.
- "now" is resolved on the server with `new Date()` (this is a server action, not a workflow script — `Date.now()` is fine).
- Actions must be resilient: return an empty structure on error, never throw.
- IMPORTANT player-name nuance: `getBeltReigns` returns reigns that may reference players who are no longer `is_active`. The name map MUST query players WITHOUT the `is_active=true` filter, and fall back to `"Unknown player"` for any id not found.

---

## File Structure

- `picklepal/src/lib/belts/formatReignDuration.ts` (Create) — pure duration→string helper, unit-tested.
- `picklepal/src/app/g/[slug]/belts/actions.ts` (Create) — `getBeltHistory(slug)` server action + exported types.
- `picklepal/src/app/g/[slug]/belts/page.tsx` (Create) — Hall of Fame server-component page.
- `picklepal/src/components/navigation/DesktopNav.tsx` (Modify) — add "Titles" nav item (Crown icon).
- `picklepal/src/components/navigation/BottomNav.tsx` (Modify) — add "Titles" nav item (Crown icon).
- `picklepal/src/components/belts/BeltLegend.tsx` (Modify) — add a "View Hall of Fame →" footer link (accepts `hallOfFameHref` prop).
- `picklepal/src/app/g/[slug]/board/page.tsx` (Modify) — pass `hallOfFameHref` to `BeltLegend`.
- (Optional, Task 8) `picklepal/src/app/g/[slug]/players/actions.ts`, `players/[id]/page.tsx`, `players/[id]/PlayerProfile.tsx` — player-profile "Titles" section.

Note on testing: this project has no established test runner wired for `.ts` units (server actions use Supabase service-role and aren't unit-testable without a DB). Only the **pure** duration helper (Task 1) gets a real failing-test-first cycle, run via `npx tsx`. Everything else is verified by `npx tsc --noEmit` + `npm run lint` + a described manual render check, which is the project's actual verification path (per the spec's "Verify when done").

---

### Task 1: `formatReignDuration` duration helper (TDD)

**Files:**
- Create: `picklepal/src/lib/belts/formatReignDuration.ts`
- Test: `picklepal/src/lib/belts/formatReignDuration.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function formatReignDuration(ms: number): string`. Rules: `< 1h` → `"under an hour"`; `< 24h` → `"Nh"`; `< 7d` → `"Nd"`; `< 8w` → `"Nw"`; else `"Nmo"`. N is a floor-rounded integer of the largest fitting unit. Negative/NaN input → `"under an hour"`.

- [ ] **Step 1: Write the failing test**

Create `picklepal/src/lib/belts/formatReignDuration.test.ts`:

```ts
import assert from "node:assert/strict";
import { formatReignDuration } from "./formatReignDuration";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

assert.equal(formatReignDuration(30 * MIN), "under an hour");
assert.equal(formatReignDuration(0), "under an hour");
assert.equal(formatReignDuration(-5), "under an hour");
assert.equal(formatReignDuration(Number.NaN), "under an hour");
assert.equal(formatReignDuration(HOUR), "1h");
assert.equal(formatReignDuration(5 * HOUR), "5h");
assert.equal(formatReignDuration(23 * HOUR + 59 * MIN), "23h");
assert.equal(formatReignDuration(DAY), "1d");
assert.equal(formatReignDuration(6 * DAY), "6d");
assert.equal(formatReignDuration(WEEK), "1w");
assert.equal(formatReignDuration(7 * WEEK + DAY), "7w");
assert.equal(formatReignDuration(8 * WEEK), "2mo"); // 8w = 56d ≈ 1.86mo -> floor on 30d months
assert.equal(formatReignDuration(365 * DAY), "12mo");

console.log("formatReignDuration: all assertions passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd picklepal && npx tsx src/lib/belts/formatReignDuration.test.ts`
Expected: FAIL — `Cannot find module './formatReignDuration'` (or similar import error).

- [ ] **Step 3: Write minimal implementation**

Create `picklepal/src/lib/belts/formatReignDuration.ts`:

```ts
// Human-friendly belt-reign duration formatting.
// Tiers: <1h -> "under an hour"; <24h -> "Nh"; <7d -> "Nd"; <8w -> "Nw"; else "Nmo".
// Months are approximated as 30-day blocks (reigns are not calendar-precise).

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const EIGHT_WEEKS = 8 * WEEK;

export function formatReignDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < HOUR) return "under an hour";
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h`;
  if (ms < WEEK) return `${Math.floor(ms / DAY)}d`;
  if (ms < EIGHT_WEEKS) return `${Math.floor(ms / WEEK)}w`;
  return `${Math.floor(ms / MONTH)}mo`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd picklepal && npx tsx src/lib/belts/formatReignDuration.test.ts`
Expected: PASS — prints `formatReignDuration: all assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add picklepal/src/lib/belts/formatReignDuration.ts picklepal/src/lib/belts/formatReignDuration.test.ts
git commit -m "feat(belts): add formatReignDuration helper with tests"
```

---

### Task 2: `getBeltHistory` server action

**Files:**
- Create: `picklepal/src/app/g/[slug]/belts/actions.ts`

**Interfaces:**
- Consumes: `getBeltReigns(groupId)` and types `BeltReign`, `BeltType` from `@/lib/belts/recomputeBelts`; `createServerClient` from `@/lib/supabase`; `formatReignDuration` from `@/lib/belts/formatReignDuration`.
- Produces (exported types + function — later tasks rely on these EXACT names):

```ts
export interface ReignView {
  readonly id: string;
  readonly beltType: BeltType;
  readonly holderName: string;
  readonly subjectName: string | null; // Pickler only, else null
  readonly isCurrent: boolean;         // ended_at === null
  readonly startedAt: string;          // ISO
  readonly endedAt: string | null;     // ISO or null
  readonly durationMs: number;         // (endedAt ?? now) - startedAt
}

export interface BeltSection {
  readonly beltType: BeltType;
  readonly current: readonly ReignView[];  // active reigns (Pickler can have many)
  readonly past: readonly ReignView[];      // ended reigns, newest first
  readonly longest: ReignView | null;       // longest reign across current+past
}

export interface BeltHistory {
  readonly sections: readonly BeltSection[]; // always exactly 3, King→Poacher→Pickler order
  readonly totalReigns: number;              // count across all belt types
}

export async function getBeltHistory(slug: string): Promise<BeltHistory>;
```

- [ ] **Step 1: Create the action file**

Create `picklepal/src/app/g/[slug]/belts/actions.ts`:

```ts
"use server";

import { createServerClient } from "@/lib/supabase";
import { getBeltReigns } from "@/lib/belts/recomputeBelts";
import type { BeltReign, BeltType } from "@/lib/belts/recomputeBelts";

const BELT_ORDER: readonly BeltType[] = [
  "king_of_the_kitchen",
  "poacher",
  "pickler",
];

export interface ReignView {
  readonly id: string;
  readonly beltType: BeltType;
  readonly holderName: string;
  readonly subjectName: string | null;
  readonly isCurrent: boolean;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly durationMs: number;
}

export interface BeltSection {
  readonly beltType: BeltType;
  readonly current: readonly ReignView[];
  readonly past: readonly ReignView[];
  readonly longest: ReignView | null;
}

export interface BeltHistory {
  readonly sections: readonly BeltSection[];
  readonly totalReigns: number;
}

function emptyHistory(): BeltHistory {
  return {
    sections: BELT_ORDER.map((beltType) => ({
      beltType,
      current: [],
      past: [],
      longest: null,
    })),
    totalReigns: 0,
  };
}

/**
 * Hall of Fame data: every belt reign (current + historical) for a group,
 * grouped by belt type and enriched with player names + durations.
 * Resilient: returns an empty (3-section) structure on any error, never throws.
 */
export async function getBeltHistory(slug: string): Promise<BeltHistory> {
  try {
    const supabase = createServerClient();

    // Resolve group id from slug (same pattern as board/actions.ts).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: group, error: groupError } = await (supabase as any)
      .from("groups")
      .select("id")
      .eq("slug", slug)
      .single();

    if (groupError || !group) return emptyHistory();

    // Fetch ALL players (NOT just is_active) so historical reigns held by
    // deactivated players still resolve to a name.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: players } = await (supabase as any)
      .from("players")
      .select("id, display_name")
      .eq("group_id", group.id);

    const nameById = new Map<string, string>();
    for (const p of (players ?? []) as { id: string; display_name: string }[]) {
      nameById.set(p.id, p.display_name);
    }
    const nameOf = (id: string | null): string =>
      (id && nameById.get(id)) || "Unknown player";

    const reigns = await getBeltReigns(group.id);
    const now = new Date().getTime();

    const toView = (r: BeltReign): ReignView => {
      const startedMs = new Date(r.started_at).getTime();
      const endMs = r.ended_at ? new Date(r.ended_at).getTime() : now;
      return {
        id: r.id,
        beltType: r.belt_type,
        holderName: nameOf(r.holder_player_id),
        subjectName: r.subject_player_id ? nameOf(r.subject_player_id) : null,
        isCurrent: r.ended_at === null,
        startedAt: r.started_at,
        endedAt: r.ended_at,
        durationMs: Math.max(0, endMs - startedMs),
      };
    };

    const sections: BeltSection[] = BELT_ORDER.map((beltType) => {
      // getBeltReigns is already newest-first; preserve that order.
      const views = reigns.filter((r) => r.belt_type === beltType).map(toView);
      const current = views.filter((v) => v.isCurrent);
      const past = views.filter((v) => !v.isCurrent);
      const longest = views.reduce<ReignView | null>(
        (best, v) => (best === null || v.durationMs > best.durationMs ? v : best),
        null,
      );
      return { beltType, current, past, longest };
    });

    return { sections, totalReigns: reigns.length };
  } catch (err) {
    console.error("[belts] getBeltHistory: error (returning empty)", err);
    return emptyHistory();
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd picklepal && npx tsc --noEmit`
Expected: no NEW errors referencing `belts/actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add picklepal/src/app/g/[slug]/belts/actions.ts
git commit -m "feat(belts): add getBeltHistory hall-of-fame server action"
```

---

### Task 3: Hall of Fame page

**Files:**
- Create: `picklepal/src/app/g/[slug]/belts/page.tsx`

**Interfaces:**
- Consumes: `getBeltHistory`, and types `BeltHistory`, `BeltSection`, `ReignView` from `./actions`; `BeltMedallion` from `@/components/belts/BeltMedallion`; `getBeltMeta` from `@/components/belts/BeltBadge`; `formatReignDuration` from `@/lib/belts/formatReignDuration`.
- Produces: default-exported async `BeltsPage({ params })` server component.

- [ ] **Step 1: Create the page**

Create `picklepal/src/app/g/[slug]/belts/page.tsx`:

```tsx
import { getBeltHistory } from "./actions";
import type { BeltSection, ReignView } from "./actions";
import { BeltMedallion } from "@/components/belts/BeltMedallion";
import { getBeltMeta } from "@/components/belts/BeltBadge";
import { formatReignDuration } from "@/lib/belts/formatReignDuration";
import type { BeltType } from "@/lib/belts/recomputeBelts";

interface BeltsPageProps {
  readonly params: Promise<{ slug: string }>;
}

// Per-belt accent classes (match the medallion identity: gold / sky / red).
const ACCENT: Record<
  BeltType,
  { card: string; tag: string; name: string }
> = {
  king_of_the_kitchen: {
    card: "border-ball-yellow/50 bg-ball-yellow/10",
    tag: "bg-ball-yellow text-court-green-dark",
    name: "text-court-green-dark",
  },
  poacher: {
    card: "border-sky-blue/50 bg-sky-blue/10",
    tag: "bg-sky-blue text-white",
    name: "text-sky-blue-dark",
  },
  pickler: {
    card: "border-hype-red/50 bg-hype-red/10",
    tag: "bg-hype-red text-white",
    name: "text-hype-red",
  },
};

function formatDateRange(startedAt: string, endedAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const start = fmt(startedAt);
  return endedAt ? `${start} – ${fmt(endedAt)}` : `Since ${start}`;
}

// Render the holder line: Pickler shows "<holder> owns <subject>".
function holderLine(reign: ReignView): string {
  if (reign.beltType === "pickler" && reign.subjectName) {
    return `${reign.holderName} owns ${reign.subjectName}`;
  }
  return reign.holderName;
}

function CurrentHolderCard({ reign }: { readonly reign: ReignView }) {
  const accent = ACCENT[reign.beltType];
  return (
    <div className={`rounded-xl border p-4 ${accent.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-block rounded-full px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-widest ${accent.tag}`}
          >
            Current
          </span>
          <p className="mt-2 text-base font-semibold text-text-primary leading-tight truncate">
            {holderLine(reign)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {formatDateRange(reign.startedAt, reign.endedAt)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-score text-lg font-bold tabular-nums text-text-primary leading-none">
            {formatReignDuration(reign.durationMs)}
          </p>
          <p className="text-[10px] font-label uppercase tracking-widest text-text-muted mt-1">
            held · ongoing
          </p>
        </div>
      </div>
    </div>
  );
}

function PastReignRow({ reign }: { readonly reign: ReignView }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 border-b border-border-muted last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {holderLine(reign)}
        </p>
        <p className="text-xs text-text-muted">
          {formatDateRange(reign.startedAt, reign.endedAt)}
        </p>
      </div>
      <span className="font-score text-sm font-bold tabular-nums text-text-secondary shrink-0">
        {formatReignDuration(reign.durationMs)}
      </span>
    </li>
  );
}

function BeltSectionBlock({ section }: { readonly section: BeltSection }) {
  const meta = getBeltMeta(section.beltType);
  const accent = ACCENT[section.beltType];
  const hasAny = section.current.length > 0 || section.past.length > 0;

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-start gap-3">
        <BeltMedallion beltType={section.beltType} size="md" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={`text-base font-semibold leading-tight ${accent.name}`}>
              {meta.label}
            </h2>
            {section.longest && (
              <span className="text-[11px] text-text-muted shrink-0 whitespace-nowrap">
                Longest: {section.longest.holderName} ·{" "}
                {formatReignDuration(section.longest.durationMs)}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-snug">{meta.description}</p>
        </div>
      </div>

      {/* Body */}
      {!hasAny ? (
        <div className="rounded-xl border border-border bg-surface-muted p-5 text-center">
          <p className="text-sm text-text-muted">No reigns yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {section.current.map((reign) => (
            <CurrentHolderCard key={reign.id} reign={reign} />
          ))}
          {section.past.length > 0 && (
            <div className="rounded-xl border border-border bg-surface px-4">
              <p className="pt-3 font-label text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Past reigns
              </p>
              <ul>
                {section.past.map((reign) => (
                  <PastReignRow key={reign.id} reign={reign} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default async function BeltsPage({ params }: BeltsPageProps) {
  const { slug } = await params;
  const history = await getBeltHistory(slug);

  return (
    <div className="space-y-6">
      {/* Branded hero header (mirrors board/page.tsx) */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green-dark to-court-green px-5 py-5 sm:px-6">
        {/* Crown watermark */}
        <div
          className="absolute -right-4 -top-4 opacity-10 pointer-events-none"
          aria-hidden="true"
        >
          <svg className="w-36 h-36 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z" />
          </svg>
        </div>

        <div className="relative">
          <p className="text-white/55 text-[11px] font-label font-semibold uppercase tracking-widest mb-1">
            Belts
          </p>
          <h1 className="font-display text-3xl text-white leading-tight">Hall of Fame</h1>
          <p className="text-white/65 text-sm mt-1">
            Every belt reign, immortalized.
          </p>
        </div>
      </header>

      {history.totalReigns === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-muted p-10 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">🏆</p>
          <p className="text-text-primary font-semibold">No titles won yet</p>
          <p className="text-text-muted text-sm mt-1">
            Play some matches — belts will start changing hands and show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {history.sections.map((section) => (
            <BeltSectionBlock key={section.beltType} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd picklepal && npx tsc --noEmit`
Expected: no NEW errors referencing `belts/page.tsx`.

- [ ] **Step 3: Lint**

Run: `cd picklepal && npm run lint`
Expected: no NEW errors in `belts/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add picklepal/src/app/g/[slug]/belts/page.tsx
git commit -m "feat(belts): add Hall of Fame page"
```

---

### Task 4: Add "Titles" item to DesktopNav

**Files:**
- Modify: `picklepal/src/components/navigation/DesktopNav.tsx`

**Interfaces:**
- Consumes: `Crown` from `lucide-react` (alongside existing `ChevronLeft`).
- Produces: a 6th nav item `{ label: "Titles", href: \`${base}/belts\`, icon: <Crown className="w-5 h-5" /> }` appended after Players.

- [ ] **Step 1: Add the `Crown` import**

In `picklepal/src/components/navigation/DesktopNav.tsx`, change line 6:

```tsx
import { ChevronLeft } from "lucide-react";
```

to:

```tsx
import { ChevronLeft, Crown } from "lucide-react";
```

- [ ] **Step 2: Add the nav item**

In the same file, the `getNavItems` array currently ends:

```tsx
    { label: "Players", href: `${base}/players`, icon: <PlayersIcon className="w-5 h-5" /> },
  ] as const;
```

Change it to:

```tsx
    { label: "Players", href: `${base}/players`, icon: <PlayersIcon className="w-5 h-5" /> },
    { label: "Titles", href: `${base}/belts`, icon: <Crown className="w-5 h-5" /> },
  ] as const;
```

- [ ] **Step 3: Typecheck + lint**

Run: `cd picklepal && npx tsc --noEmit && npm run lint`
Expected: no NEW errors in `DesktopNav.tsx`.

- [ ] **Step 4: Commit**

```bash
git add picklepal/src/components/navigation/DesktopNav.tsx
git commit -m "feat(belts): add Titles item to desktop nav"
```

---

### Task 5: Add "Titles" item to BottomNav

**Files:**
- Modify: `picklepal/src/components/navigation/BottomNav.tsx`

**Interfaces:**
- Consumes: `Crown` from `lucide-react` (new import; this file currently imports no lucide icons).
- Produces: a 6th nav item `{ label: "Titles", href: \`${base}/belts\`, icon: <Crown className="w-[22px] h-[22px]" /> }` appended after Players. Bottom bar `<li>`s are `flex-1`, so 6 tabs divide evenly with no layout change.

- [ ] **Step 1: Add the `Crown` import**

In `picklepal/src/components/navigation/BottomNav.tsx`, after the existing icon import block (the `} from "@/components/icons";` line, around line 12), add:

```tsx
import { Crown } from "lucide-react";
```

- [ ] **Step 2: Add the nav item**

In `getNavItems`, the array currently ends:

```tsx
    { label: "Players", href: `${base}/players`, icon: <PlayersIcon className="w-[22px] h-[22px]" /> },
  ] as const;
```

Change it to:

```tsx
    { label: "Players", href: `${base}/players`, icon: <PlayersIcon className="w-[22px] h-[22px]" /> },
    { label: "Titles", href: `${base}/belts`, icon: <Crown className="w-[22px] h-[22px]" /> },
  ] as const;
```

- [ ] **Step 3: Typecheck + lint**

Run: `cd picklepal && npx tsc --noEmit && npm run lint`
Expected: no NEW errors in `BottomNav.tsx`.

- [ ] **Step 4: Commit**

```bash
git add picklepal/src/components/navigation/BottomNav.tsx
git commit -m "feat(belts): add Titles item to bottom nav"
```

---

### Task 6: Add "View Hall of Fame →" link to BeltLegend

**Files:**
- Modify: `picklepal/src/components/belts/BeltLegend.tsx`

**Interfaces:**
- Consumes: nothing new (uses a plain anchor; the legend is a client component, a regular `<a>` is fine and avoids a new import).
- Produces: `BeltLegend` now accepts an optional `hallOfFameHref?: string` prop. When provided, a footer link "View Hall of Fame →" renders at the bottom of the open popover.

- [ ] **Step 1: Extend the props signature**

In `picklepal/src/components/belts/BeltLegend.tsx`, change the component signature (currently):

```tsx
export function BeltLegend({ className = "" }: { readonly className?: string }) {
```

to:

```tsx
export function BeltLegend({
  className = "",
  hallOfFameHref,
}: {
  readonly className?: string;
  readonly hallOfFameHref?: string;
}) {
```

- [ ] **Step 2: Add the footer link inside the popover**

In the same file, find the closing of the belt list `</ul>` followed by the popover-closing `</div>` (around lines 95–96):

```tsx
        </ul>
      </div>
```

Change it to:

```tsx
        </ul>

        {hallOfFameHref && (
          <a
            href={hallOfFameHref}
            className="mt-3 block border-t border-border-muted pt-2.5 text-right text-xs font-semibold text-court-green transition-colors hover:text-court-green-dark"
          >
            View Hall of Fame →
          </a>
        )}
      </div>
```

- [ ] **Step 3: Typecheck + lint**

Run: `cd picklepal && npx tsc --noEmit && npm run lint`
Expected: no NEW errors in `BeltLegend.tsx`.

- [ ] **Step 4: Commit**

```bash
git add picklepal/src/components/belts/BeltLegend.tsx
git commit -m "feat(belts): add Hall of Fame link to belt legend"
```

---

### Task 7: Wire `hallOfFameHref` from board page

**Files:**
- Modify: `picklepal/src/app/g/[slug]/board/page.tsx`

**Interfaces:**
- Consumes: `BeltLegend`'s new `hallOfFameHref` prop (Task 6). `slug` is already available in this server component.
- Produces: nothing downstream.

- [ ] **Step 1: Pass the prop**

In `picklepal/src/app/g/[slug]/board/page.tsx`, change (around line 61):

```tsx
              <BeltLegend />
```

to:

```tsx
              <BeltLegend hallOfFameHref={`/g/${slug}/belts`} />
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd picklepal && npx tsc --noEmit && npm run lint`
Expected: no NEW errors in `board/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add picklepal/src/app/g/[slug]/board/page.tsx
git commit -m "feat(belts): link belt legend to Hall of Fame from board"
```

---

### Task 8 (OPTIONAL — do only if it stays clean): Player-profile "Titles" section

This wires per-player reign data through the existing `getPlayerDetail` → `page.tsx` → `PlayerProfile` prop chain. If at any step it gets messy or risks breaking the profile, STOP, revert the partial change (`git checkout -- <files>`), and note it as skipped in the report.

**Files:**
- Modify: `picklepal/src/app/g/[slug]/players/actions.ts`
- Modify: `picklepal/src/app/g/[slug]/players/[id]/page.tsx`
- Modify: `picklepal/src/app/g/[slug]/players/[id]/PlayerProfile.tsx`

**Interfaces:**
- Consumes: `getBeltReigns` from `@/lib/belts/recomputeBelts`; `formatReignDuration`; `BeltMedallion`; `getBeltMeta`.
- Produces: a `PlayerReignView` type and `playerReigns: readonly PlayerReignView[]` threaded into `PlayerProfile`.

- [ ] **Step 1: Add a focused helper to players/actions.ts**

In `picklepal/src/app/g/[slug]/players/actions.ts`, add to the imports near the top:

```ts
import { getBeltReigns } from "@/lib/belts/recomputeBelts";
import type { BeltType } from "@/lib/belts/recomputeBelts";
```

Add this exported type after the existing `PlayerDetailResult` interface:

```ts
export interface PlayerReignView {
  readonly id: string;
  readonly beltType: BeltType;
  readonly subjectName: string | null;
  readonly isCurrent: boolean;
  readonly durationMs: number;
}
```

Add `readonly playerReigns: readonly PlayerReignView[];` to the `PlayerDetailResult` interface.

- [ ] **Step 2: Populate playerReigns inside getPlayerDetail**

Read the existing `getPlayerDetail` body (`picklepal/src/app/g/[slug]/players/actions.ts:57+`). It already resolves the group id and player. After the stats are computed and before the final successful `return`, add a block that:
1. Calls `await getBeltReigns(group.id)` (use whatever the group-id variable is named in that function — confirm by reading it).
2. Filters to reigns where `holder_player_id === playerId`.
3. Builds a name map from the already-fetched players list (or fetch `id, display_name` for the group WITHOUT `is_active` filter if no full list is in scope) for subject names.
4. Maps to `PlayerReignView[]` (newest-first is already guaranteed by `getBeltReigns`), computing `durationMs` with `now = new Date().getTime()` and `isCurrent = ended_at === null`.

Then add `playerReigns` to every `return` in the function. On the error/not-found returns, use `playerReigns: []`.

If the existing function's structure makes step 3 (name map) awkward (e.g. players aren't in scope), it is acceptable to set `subjectName: null` for all and skip subject resolution — note that in the report. If even that is messy, ABORT this task per the guard above.

- [ ] **Step 3: Pass playerReigns through the page**

In `picklepal/src/app/g/[slug]/players/[id]/page.tsx`, destructure `playerReigns` from `getPlayerDetail` and pass it to `<PlayerProfile ... playerReigns={playerReigns} />`. The destructure (line 12) becomes:

```tsx
  const [{ player, stats, duos, rivalries, playerReigns, error }, viewerAccess] = await Promise.all([
```

and the JSX (line 23):

```tsx
      <PlayerProfile stats={stats} duos={duos} rivalries={rivalries ?? []} groupSlug={slug} player={player} isAdmin={viewerAccess.isAdmin} playerReigns={playerReigns ?? []} />
```

- [ ] **Step 4: Render the Titles section in PlayerProfile**

In `picklepal/src/app/g/[slug]/players/[id]/PlayerProfile.tsx`:

Add imports at the top (the file already imports lucide icons and motion):

```tsx
import { BeltMedallion } from "@/components/belts/BeltMedallion";
import { getBeltMeta } from "@/components/belts/BeltBadge";
import { formatReignDuration } from "@/lib/belts/formatReignDuration";
import type { PlayerReignView } from "../actions";
```

Add `playerReigns` to `PlayerProfileProps`:

```tsx
  readonly playerReigns: readonly PlayerReignView[];
```

Destructure it in the component params alongside the other props.

Insert this section just BEFORE the closing `</div>` of the component (i.e. directly after the Rivalries `</section>` at the file's end, around line 735), so Titles renders as the last section:

```tsx
      {/* ── Titles ── */}
      {playerReigns.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-label font-semibold text-text-muted uppercase tracking-widest px-1">
            Titles
          </h2>
          <div className="rounded-xl border border-border bg-surface px-4">
            <ul>
              {playerReigns.map((reign) => {
                const meta = getBeltMeta(reign.beltType);
                return (
                  <li
                    key={reign.id}
                    className="flex items-center gap-3 py-3 border-b border-border-muted last:border-0"
                  >
                    <BeltMedallion beltType={reign.beltType} size="md" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary leading-tight">
                        {meta.label}
                        {reign.subjectName && (
                          <span className="text-text-muted font-normal"> · owns {reign.subjectName}</span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">
                        {reign.isCurrent ? "Current holder" : "Past reign"}
                      </p>
                    </div>
                    <span className="font-score text-sm font-bold tabular-nums text-text-secondary shrink-0">
                      {formatReignDuration(reign.durationMs)}
                      {reign.isCurrent && (
                        <span className="ml-1 text-[10px] font-label uppercase text-court-green">
                          · live
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
```

- [ ] **Step 5: Typecheck + lint**

Run: `cd picklepal && npx tsc --noEmit && npm run lint`
Expected: no NEW errors in the three modified files.

- [ ] **Step 6: Commit**

```bash
git add picklepal/src/app/g/[slug]/players/actions.ts picklepal/src/app/g/[slug]/players/[id]/page.tsx picklepal/src/app/g/[slug]/players/[id]/PlayerProfile.tsx
git commit -m "feat(belts): add Titles section to player profile"
```

---

### Task 9: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck**

Run: `cd picklepal && npx tsc --noEmit`
Expected: no NEW errors introduced by any task (pre-existing errors in untouched files are acceptable — confirm by comparing against a pre-change baseline if unsure).

- [ ] **Step 2: Full lint**

Run: `cd picklepal && npm run lint`
Expected: no NEW errors introduced by any task.

- [ ] **Step 3: Mental render review**

Confirm, by re-reading `belts/page.tsx`:
- Hero header uses green gradient + Anton H1 + crown watermark.
- Three sections render King → Poacher → Pickler.
- Current holders show a colored accent card with a "CURRENT" tag + "held · ongoing".
- Pickler current/past rows read "\<holder\> owns \<subject\>".
- Past reigns render as a divided list (newest first), with a date range and duration.
- Per-belt "No reigns yet" empty state and whole-page "No titles won yet" empty state both exist.
- 6 bottom-nav tabs are `flex-1` (even fit); desktop nav stacks vertically (always fits).

- [ ] **Step 4: Confirm done**

No commit (verification task).

---

## Self-Review

**Spec coverage:**
1. `getBeltHistory(slug)` server action — Task 2 ✓ (group-by-slug, name map without is_active, enriched ReignView with holderName/subjectName/isCurrent/durationMs, per-belt current + longest, resilient empty on error).
2. Hall of Fame page — Task 3 ✓ (branded green hero, Anton H1, crown watermark, eyebrow "Belts", 3 sections King→Poacher→Pickler, medallion + name + description + longest stat, current-holder accent card, past-reign divided list with date range, per-belt + whole-page empty states).
3. `formatReignDuration(ms)` — Task 1 ✓ (under an hour / Nh / Nd / Nw / Nmo) with tests.
4. Nav "Titles" entries — Tasks 4 & 5 ✓ (Crown icon, correct per-file sizing, 6 flex-1 tabs).
5. BeltLegend discoverability link — Tasks 6 & 7 ✓ ("View Hall of Fame →", via `hallOfFameHref` prop from board page).
6. Player profile Titles section — Task 8 ✓ (optional, with explicit abort/skip guard).
7. Verify (tsc + lint) — Task 9 ✓.

**Placeholder scan:** No TBD/TODO/"add error handling" placeholders — all code blocks are complete. Task 8 Step 2 intentionally describes an in-place edit to an unread function body (rather than reproducing it) and gives an explicit fallback + abort path; this is the one judgment step and is bounded.

**Type consistency:** `ReignView`/`BeltSection`/`BeltHistory` defined in Task 2 are consumed by exact name in Task 3. `formatReignDuration(ms: number): string` defined in Task 1, used in Tasks 3 & 8. `hallOfFameHref` prop defined in Task 6, passed in Task 7. `PlayerReignView` defined in Task 8 Step 1, used in Steps 3–4. Belt order array identical across files. `getBeltMeta` returns `{ emoji, label, description }` — used as `.label`/`.description` only. ✓
