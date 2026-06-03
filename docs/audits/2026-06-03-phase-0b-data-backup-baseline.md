# Phase 0b Data Backup And Baseline Verification

Date: 2026-06-03
Status: Implemented
Scope: V1 data backup and pre-migration baseline capture for V2.0.0 public beta

## Deliverables

- Added `pnpm backup:baseline` in `picklepal/package.json`.
- Added `picklepal/scripts/backup-baseline.mjs`.
- Added `picklepal/backups/` to `.gitignore` so exported production data stays local.
- Documented the rollback path generated with each backup run.

## Backup Command

From `picklepal/`:

```bash
pnpm backup:baseline
```

The command reads:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Values are loaded from `.env.local` or the process environment. The script does not print secrets.

## Backup Output

Each run creates:

```text
picklepal/backups/phase-0b-<timestamp>/
  data/
    groups.json
    players.json
    sessions.json
    matches.json
    rally_events.json
    match_queue_items.json
    recap_cards.json
    session_players.json
  baseline-summary.json
  ROLLBACK.md
```

The `data/` JSON files are raw table snapshots. `baseline-summary.json` is the post-migration comparison target.

## Initial Backup Run

The first Phase 0b export completed on 2026-06-03.

```text
groups: 1
players: 11
sessions: 5
matches: 33
rally_events: 630
match_queue_items: 0
recap_cards: 0
session_players: 33
```

Backup directory:

```text
picklepal/backups/phase-0b-2026-06-03T15-52-58-758Z/
```

## Baseline Captured

The baseline summary records:

- Total row counts for all V1 tables.
- Per-group row counts for groups, players, sessions, matches, rally events, match queue items, recap cards, and session players.
- Per-group leaderboard.
- Per-player stats and recent player history.
- Recent session summaries.
- Session awards: MVP, Hottest Duo, Best Match.
- Recent completed match history.

## Rollback Path

Each backup includes `ROLLBACK.md` with the restore order and verification step.

Recommended rollback order for manual JSON restore:

1. `groups`
2. `players`
3. `sessions`
4. `matches`
5. `rally_events`
6. `match_queue_items`
7. `recap_cards`
8. `session_players`

After restore, run `pnpm backup:baseline` again and compare the new `baseline-summary.json` with the pre-migration backup.

## Acceptance Status

- Backup path exists before migrations run: satisfied by `pnpm backup:baseline`.
- Baseline stats recorded for post-migration comparison: satisfied by `baseline-summary.json`.
- Rollback path documented: satisfied by generated `ROLLBACK.md` and this audit.

## Notes

- Backups are intentionally ignored by git because they contain real group data.
- This script uses the Supabase service-role key for read-only export. Keep it server-side/local only.
- Phase 4 migration should not remove PIN fields or rewrite membership data until a fresh Phase 0b backup has been generated.
