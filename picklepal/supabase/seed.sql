-- PicklePal Real Data Seed
-- Real match history from the crew's pickleball sessions
-- Wipes existing data and inserts fresh

-- ============================================================
-- CLEAN SLATE (order matters due to foreign keys)
-- ============================================================
DELETE FROM public.rally_events;
DELETE FROM public.match_queue_items;
DELETE FROM public.matches;
DELETE FROM public.session_players;
DELETE FROM public.sessions;
DELETE FROM public.players;
DELETE FROM public.recap_cards;
DELETE FROM public.groups;

-- ============================================================
-- GROUP
-- ============================================================
INSERT INTO public.groups (id, slug, name, host_pin_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'default',
  'PicklePal Crew',
  -- PIN: 1234 (SHA-256 hash)
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
);

-- ============================================================
-- PLAYERS (8 real players)
-- ============================================================
INSERT INTO public.players (id, group_id, display_name, color, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Jude',    '#2D8B4E', true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Joaquin', '#2196F3', true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Janus',   '#F5C518', true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Nadz',    '#FF6B35', true),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Karol',   '#9C27B0', true),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Rick',    '#E53935', true),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Aaron',   '#00BCD4', true),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Sadie',   '#795548', true);

-- ============================================================
-- SESSION 1: May 27, 2026 — Game Day #1 (8 matches)
-- ============================================================
INSERT INTO public.sessions (id, group_id, title, status, default_match_type, target_score, win_by, started_at, ended_at)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Game Day #1',
  'completed',
  'doubles', 11, 2,
  '2026-05-27T10:00:00Z',
  '2026-05-27T12:00:00Z'
);

-- Match 1: Janus & Karol 15 – 13 Nadz & Jude (10:07 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001']::UUID[],
  15, 13, 'A', 'B',
  11, 2,
  '2026-05-27T10:07:00Z', '2026-05-27T10:20:00Z'
);

-- Match 2: Rick & Joaquin 10 – 12 Nadz & Jude (10:23 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001']::UUID[],
  10, 12, 'B', 'A',
  11, 2,
  '2026-05-27T10:23:00Z', '2026-05-27T10:35:00Z'
);

-- Match 3: Rick & Karol 11 – 7 Joaquin & Jude (10:37 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001']::UUID[],
  11, 7, 'A', 'B',
  11, 2,
  '2026-05-27T10:37:00Z', '2026-05-27T10:43:00Z'
);

-- Match 4: Joaquin & Janus 11 – 8 Nadz & Jude (10:45 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001']::UUID[],
  11, 8, 'A', 'B',
  11, 2,
  '2026-05-27T10:45:00Z', '2026-05-27T10:58:00Z'
);

-- Match 5: Jude & Karol 11 – 8 Nadz & Rick (11:01 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006']::UUID[],
  11, 8, 'A', 'B',
  11, 2,
  '2026-05-27T11:01:00Z', '2026-05-27T11:14:00Z'
);

-- Match 6: Karol & Joaquin 11 – 5 Janus & Rick (11:16 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006']::UUID[],
  11, 5, 'A', 'B',
  11, 2,
  '2026-05-27T11:16:00Z', '2026-05-27T11:24:00Z'
);

-- Match 7: Joaquin & Nadz 4 – 11 Janus & Jude (11:26 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000007',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001']::UUID[],
  4, 11, 'B', 'A',
  11, 2,
  '2026-05-27T11:26:00Z', '2026-05-27T11:37:00Z'
);

-- Match 8: Jude & Rick 12 – 14 Janus & Nadz (11:39 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000008',
  'c0000000-0000-0000-0000-000000000001',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004']::UUID[],
  12, 14, 'B', 'A',
  11, 2,
  '2026-05-27T11:39:00Z', '2026-05-27T11:55:00Z'
);

-- ============================================================
-- SESSION 2: May 28, 2026 — Game Day #2 (8 matches)
-- ============================================================
INSERT INTO public.sessions (id, group_id, title, status, default_match_type, target_score, win_by, started_at, ended_at)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Game Day #2',
  'completed',
  'doubles', 11, 2,
  '2026-05-28T10:00:00Z',
  '2026-05-28T12:00:00Z'
);

-- Match 9: Sadie & Joaquin 11 – 6 Jude & Karol (10:07 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000009',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005']::UUID[],
  11, 6, 'A', 'B',
  11, 2,
  '2026-05-28T10:07:00Z', '2026-05-28T10:18:00Z'
);

-- Match 10: Nadz & Janus 11 – 7 Aaron & Jude (10:20 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000010',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001']::UUID[],
  11, 7, 'A', 'B',
  11, 2,
  '2026-05-28T10:20:00Z', '2026-05-28T10:30:00Z'
);

-- Match 11: Sadie & Karol 8 – 11 Aaron & Joaquin (10:32 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000011',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000005']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002']::UUID[],
  8, 11, 'B', 'A',
  11, 2,
  '2026-05-28T10:32:00Z', '2026-05-28T10:46:00Z'
);

-- Match 12: Janus & Jude 11 – 6 Nadz & Aaron (10:48 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000012',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007']::UUID[],
  11, 6, 'A', 'B',
  11, 2,
  '2026-05-28T10:48:00Z', '2026-05-28T11:02:00Z'
);

-- Match 13: Joaquin & Karol 11 – 8 Sadie & Aaron (11:04 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000013',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007']::UUID[],
  11, 8, 'A', 'B',
  11, 2,
  '2026-05-28T11:04:00Z', '2026-05-28T11:16:00Z'
);

-- Match 14: Jude & Joaquin 11 – 8 Janus & Nadz (11:18 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000014',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004']::UUID[],
  11, 8, 'A', 'B',
  11, 2,
  '2026-05-28T11:18:00Z', '2026-05-28T11:33:00Z'
);

-- Match 15: Jude & Sadie 12 – 10 Janus & Karol (11:35 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000015',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005']::UUID[],
  12, 10, 'A', 'B',
  11, 2,
  '2026-05-28T11:35:00Z', '2026-05-28T11:49:00Z'
);

-- Match 16: Aaron & Sadie 11 – 8 Joaquin & Nadz (11:51 AM)
INSERT INTO public.matches (id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at)
VALUES (
  'd0000000-0000-0000-0000-000000000016',
  'c0000000-0000-0000-0000-000000000002',
  'doubles', 'completed',
  ARRAY['b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000008']::UUID[],
  ARRAY['b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004']::UUID[],
  11, 8, 'A', 'B',
  11, 2,
  '2026-05-28T11:51:00Z', '2026-05-28T12:00:00Z'
);
