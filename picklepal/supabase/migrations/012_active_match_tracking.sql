-- Phase 6a: Active DB Match At Scoring Start
-- Adds scorer identity and live snapshot columns to matches table.
-- Allows match record to exist in 'active' status during scoring.

-- Scorer identity: which Clerk user is actively scoring this match
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS scorer_clerk_user_id TEXT;

-- Live snapshot: JSONB storing current score, server state, positions
-- Updated periodically during scoring for viewer pages
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS current_snapshot JSONB;

-- Index for enforcing only one active match per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_session_active
  ON public.matches (session_id)
  WHERE status = 'active';

-- Comment for documentation
COMMENT ON COLUMN public.matches.scorer_clerk_user_id IS 'Clerk user ID of the admin currently scoring this match';
COMMENT ON COLUMN public.matches.current_snapshot IS 'Live scoring snapshot: { teamAScore, teamBScore, servingTeam, serverPlayerId, serverNumber, rallyCount }';
