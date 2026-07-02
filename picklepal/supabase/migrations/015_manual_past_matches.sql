-- Migration 015: Manual past matches support
-- Adds played_at to matches and source/bucket_date to sessions.

-- ─── matches.played_at ───────────────────────────────────────────────────────

ALTER TABLE public.matches ADD COLUMN played_at TIMESTAMPTZ;
UPDATE public.matches SET played_at = COALESCE(completed_at, created_at);
ALTER TABLE public.matches ALTER COLUMN played_at SET NOT NULL,
                           ALTER COLUMN played_at SET DEFAULT now();
CREATE INDEX idx_matches_session_played ON public.matches (session_id, played_at DESC);

-- ─── sessions.source / sessions.bucket_date ──────────────────────────────────

ALTER TABLE public.sessions ADD COLUMN source TEXT NOT NULL DEFAULT 'live';
ALTER TABLE public.sessions ADD COLUMN bucket_date DATE;
CREATE UNIQUE INDEX uniq_manual_bucket_per_group_date
  ON public.sessions (group_id, bucket_date) WHERE source = 'manual_bucket';
