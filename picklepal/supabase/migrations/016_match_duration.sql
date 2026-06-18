-- Migration 016: Match duration tracking
-- Adds duration_seconds to matches and backfills from started_at/completed_at.

-- ─── matches.duration_seconds ────────────────────────────────────────────────

ALTER TABLE public.matches ADD COLUMN duration_seconds INTEGER;

UPDATE public.matches
SET duration_seconds = EXTRACT(EPOCH FROM (completed_at - started_at))::int
WHERE completed_at IS NOT NULL
  AND started_at IS NOT NULL
  AND duration_seconds IS NULL;
