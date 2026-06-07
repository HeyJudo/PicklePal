-- Phase 5b: Group-level default settings
-- Adds a settings JSONB column for game defaults and leaderboard configuration.
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{
  "default_match_type": "doubles",
  "default_target_score": 11,
  "default_win_by": 2,
  "qualification_threshold": 3
}'::jsonb;
