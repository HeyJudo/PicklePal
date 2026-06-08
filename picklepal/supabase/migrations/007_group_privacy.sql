-- Phase 3c: Group Privacy
-- Adds privacy_mode column to groups table

CREATE TYPE privacy_mode AS ENUM ('public_link', 'private');

-- Add privacy_mode column with default public_link (existing groups stay accessible)
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS privacy_mode privacy_mode NOT NULL DEFAULT 'public_link';

-- Index for filtering by privacy mode
CREATE INDEX idx_groups_privacy ON public.groups (privacy_mode);
