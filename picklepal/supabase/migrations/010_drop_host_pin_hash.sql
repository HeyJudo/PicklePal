-- Phase 4c: Drop legacy host_pin_hash column
-- PIN authentication replaced by Clerk-based Owner/Admin auth
ALTER TABLE public.groups DROP COLUMN IF EXISTS host_pin_hash;
