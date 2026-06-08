-- Phase 3a: Profiles and Group Memberships
-- Bridges Clerk auth users to the app's group ownership model

-- ============================================================
-- PROFILES
-- Maps Clerk user IDs to app-level identity
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_clerk_user_id ON public.profiles (clerk_user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are readable by authenticated users (for membership lookups)
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);

-- ============================================================
-- GROUP MEMBERSHIPS
-- Links profiles to groups with role-based access
-- ============================================================
CREATE TYPE group_role AS ENUM ('owner', 'admin');

CREATE TABLE IF NOT EXISTS public.group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each profile can only have one membership per group
CREATE UNIQUE INDEX idx_group_memberships_unique
  ON public.group_memberships (group_id, profile_id);

CREATE INDEX idx_group_memberships_profile ON public.group_memberships (profile_id);
CREATE INDEX idx_group_memberships_group ON public.group_memberships (group_id);

ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- Memberships are readable by anyone (needed for public group pages)
CREATE POLICY "Group memberships are publicly readable"
  ON public.group_memberships FOR SELECT USING (true);
