-- Migration 018: Match History cursor and filtered-match query indexes.
-- Supports stable newest-first session pagination and bounded match reads.

CREATE INDEX IF NOT EXISTS idx_sessions_group_started_id
  ON public.sessions (group_id, started_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_matches_session_status_played
  ON public.matches (session_id, status, played_at DESC);
