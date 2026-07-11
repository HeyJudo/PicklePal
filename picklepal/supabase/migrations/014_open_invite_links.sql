-- Migration 014: Open invite links
-- Makes admin_invites.email nullable and adds a kind column to distinguish
-- email invites (targeted) from open link invites (reusable).

-- 1. Create the invite kind enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_kind') THEN
    CREATE TYPE invite_kind AS ENUM ('email', 'link');
  END IF;
END$$;

-- 2. Make email nullable
ALTER TABLE admin_invites
  ALTER COLUMN email DROP NOT NULL;

-- 3. Add kind column (default 'email' so existing rows are unaffected)
ALTER TABLE admin_invites
  ADD COLUMN IF NOT EXISTS kind invite_kind NOT NULL DEFAULT 'email';

-- 4. Index to quickly find the active link invite for a group
CREATE INDEX IF NOT EXISTS idx_admin_invites_group_link
  ON admin_invites (group_id, kind, status)
  WHERE kind = 'link' AND status = 'pending';
