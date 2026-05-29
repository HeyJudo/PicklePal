-- Phase 2b: Seed data for PicklePal
-- Idempotent: uses ON CONFLICT DO NOTHING or checks before insert
-- Creates: 1 group (default), 8 players, 1 completed session, 5 matches

-- ============================================================
-- GROUP (already exists from migration 001, ensure it's there)
-- ============================================================
INSERT INTO public.groups (slug, name, host_pin_hash)
VALUES (
  'default',
  'PicklePal Crew',
  -- PIN: 1234 (SHA-256 hash)
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
)
ON CONFLICT (slug) DO UPDATE SET
  host_pin_hash = EXCLUDED.host_pin_hash;

-- ============================================================
-- PLAYERS (8 players for the crew)
-- ============================================================
-- Use fixed UUIDs so the script is idempotent
INSERT INTO public.players (id, group_id, display_name, color, is_active)
VALUES
  ('a1000000-0000-0000-0000-000000000001', (SELECT id FROM public.groups WHERE slug = 'default'), 'Jude', '#2D8B4E', true),
  ('a1000000-0000-0000-0000-000000000002', (SELECT id FROM public.groups WHERE slug = 'default'), 'Andre', '#2196F3', true),
  ('a1000000-0000-0000-0000-000000000003', (SELECT id FROM public.groups WHERE slug = 'default'), 'Mark', '#F5C518', true),
  ('a1000000-0000-0000-0000-000000000004', (SELECT id FROM public.groups WHERE slug = 'default'), 'Gio', '#FF6B35', true),
  ('a1000000-0000-0000-0000-000000000005', (SELECT id FROM public.groups WHERE slug = 'default'), 'Paolo', '#E53935', true),
  ('a1000000-0000-0000-0000-000000000006', (SELECT id FROM public.groups WHERE slug = 'default'), 'Miguel', '#9C27B0', true),
  ('a1000000-0000-0000-0000-000000000007', (SELECT id FROM public.groups WHERE slug = 'default'), 'Carlos', '#00BCD4', true),
  ('a1000000-0000-0000-0000-000000000008', (SELECT id FROM public.groups WHERE slug = 'default'), 'Diego', '#795548', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SESSION (1 completed Game Day)
-- ============================================================
INSERT INTO public.sessions (id, group_id, title, status, default_match_type, target_score, win_by, started_at, ended_at)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.groups WHERE slug = 'default'),
  'Game Day #1',
  'completed',
  'doubles',
  11,
  2,
  '2026-05-28T14:00:00Z',
  '2026-05-28T17:30:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MATCHES (5 completed doubles matches)
-- ============================================================

-- Match 1: Jude+Andre vs Mark+Gio → 11-7
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, starting_server_player_id, target_score, win_by, started_at, completed_at)
VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002']::UUID[],
  ARRAY['a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004']::UUID[],
  11, 7, 'A', 'B',
  'a1000000-0000-0000-0000-000000000001',
  11, 2,
  '2026-05-28T14:05:00Z', '2026-05-28T14:35:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Match 2: Paolo+Miguel vs Carlos+Diego → 11-9
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, starting_server_player_id, target_score, win_by, started_at, completed_at)
VALUES (
  'c1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000006']::UUID[],
  ARRAY['a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000008']::UUID[],
  11, 9, 'A', 'B',
  'a1000000-0000-0000-0000-000000000005',
  11, 2,
  '2026-05-28T14:40:00Z', '2026-05-28T15:15:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Match 3: Jude+Gio vs Paolo+Carlos → 11-5
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, starting_server_player_id, target_score, win_by, started_at, completed_at)
VALUES (
  'c1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004']::UUID[],
  ARRAY['a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007']::UUID[],
  11, 5, 'A', 'B',
  'a1000000-0000-0000-0000-000000000004',
  11, 2,
  '2026-05-28T15:20:00Z', '2026-05-28T15:45:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Match 4: Andre+Miguel vs Mark+Diego → 9-11
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, starting_server_player_id, target_score, win_by, started_at, completed_at)
VALUES (
  'c1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006']::UUID[],
  ARRAY['a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000008']::UUID[],
  9, 11, 'B', 'A',
  'a1000000-0000-0000-0000-000000000002',
  11, 2,
  '2026-05-28T15:50:00Z', '2026-05-28T16:20:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Match 5: Jude+Miguel vs Andre+Mark → 12-10 (close game!)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, starting_server_player_id, target_score, win_by, started_at, completed_at)
VALUES (
  'c1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006']::UUID[],
  ARRAY['a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003']::UUID[],
  12, 10, 'A', 'B',
  'a1000000-0000-0000-0000-000000000006',
  11, 2,
  '2026-05-28T16:25:00Z', '2026-05-28T17:00:00Z'
)
ON CONFLICT (id) DO NOTHING;
