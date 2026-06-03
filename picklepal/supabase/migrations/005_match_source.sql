-- Phase 7.5d: Record Past Match (Manual Entry)
-- Adds source column to distinguish live-scored vs manually entered matches.

ALTER TABLE public.matches
  ADD COLUMN source TEXT NOT NULL DEFAULT 'live';

COMMENT ON COLUMN public.matches.source IS 'Origin of the match: live (scored in real-time) or manual (entered after the fact)';
