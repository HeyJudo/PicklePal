-- Phase 7.5e: Point Scorer Tracking
-- Adds scorer_player_id to rally_events and track_scorers setting to sessions.

ALTER TABLE public.rally_events
  ADD COLUMN scorer_player_id UUID REFERENCES public.players(id);

ALTER TABLE public.sessions
  ADD COLUMN track_scorers BOOLEAN NOT NULL DEFAULT false;
