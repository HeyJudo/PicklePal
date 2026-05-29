-- Create groups table
-- Phase 1c: Initial table for group-scoped routing

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  host_pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for slug lookups (used on every page load)
CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.groups (slug);

-- Row Level Security: public read, no anonymous writes
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are publicly readable"
  ON public.groups
  FOR SELECT
  USING (true);

-- Seed the default group
INSERT INTO public.groups (slug, name)
VALUES ('default', 'PicklePal Crew')
ON CONFLICT (slug) DO NOTHING;
