-- Phase 4a: Current Group Ownership Migration
-- Assigns the existing friend-group to the primary Clerk user as Owner.
-- Renames slug from 'default' to 'picklepal'.
-- Idempotent: safe to run multiple times.

BEGIN;

-- ============================================================
-- 1. Rename group slug: default → picklepal
-- ============================================================
UPDATE public.groups
SET slug = 'picklepal', updated_at = now()
WHERE slug = 'default'
  AND id = 'a0000000-0000-0000-0000-000000000001';

-- ============================================================
-- 2. Assign ownership to the first profile (primary Clerk user)
-- Uses ON CONFLICT to be idempotent.
-- ============================================================
INSERT INTO public.group_memberships (group_id, profile_id, role)
SELECT
  'a0000000-0000-0000-0000-000000000001' AS group_id,
  p.id AS profile_id,
  'owner'::group_role AS role
FROM public.profiles p
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (group_id, profile_id)
DO UPDATE SET role = 'owner'::group_role;

-- ============================================================
-- 3. Verify migration (will raise notice, not fail)
-- ============================================================
DO $$
DECLARE
  v_slug TEXT;
  v_owner_count INT;
BEGIN
  SELECT slug INTO v_slug FROM public.groups WHERE id = 'a0000000-0000-0000-0000-000000000001';
  SELECT count(*) INTO v_owner_count
    FROM public.group_memberships
    WHERE group_id = 'a0000000-0000-0000-0000-000000000001'
      AND role = 'owner';

  IF v_slug != 'picklepal' THEN
    RAISE WARNING 'Migration check: slug is "%" instead of "picklepal"', v_slug;
  END IF;

  IF v_owner_count = 0 THEN
    RAISE WARNING 'Migration check: no owner assigned to group';
  ELSE
    RAISE NOTICE 'Migration OK: group slug=%, owner_count=%', v_slug, v_owner_count;
  END IF;
END $$;

COMMIT;
