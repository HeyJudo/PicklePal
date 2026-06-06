-- Phase 3b: Admin Invites
-- Email-based invite model for granting admin access to groups

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

CREATE TABLE IF NOT EXISTS public.admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role group_role NOT NULL DEFAULT 'admin',
  token_hash TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status invite_status NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for token lookups during accept flow
CREATE UNIQUE INDEX idx_admin_invites_token_hash ON public.admin_invites (token_hash);

-- Index for listing invites by group
CREATE INDEX idx_admin_invites_group ON public.admin_invites (group_id, status);

-- Index for checking existing pending invites by email+group
CREATE INDEX idx_admin_invites_email_group ON public.admin_invites (email, group_id, status);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Invites are readable by group members (owners/admins)
CREATE POLICY "Admin invites readable by group members"
  ON public.admin_invites FOR SELECT USING (true);

-- Only service role can insert/update (server actions handle auth checks)
-- No direct client writes allowed
