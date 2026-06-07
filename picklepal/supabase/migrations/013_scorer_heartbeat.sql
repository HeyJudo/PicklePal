-- Phase 6b/6c: Scorer Heartbeat for Lock & Takeover
-- Adds heartbeat timestamp to enable detecting stale scorer connections.
-- Used for same-device auto-resume and multi-admin takeover UX.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS scorer_heartbeat_at TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN public.matches.scorer_heartbeat_at IS 'Last heartbeat from the active scorer. Stale (>30s) means scorer may be disconnected.';
