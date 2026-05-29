-- Phase 2a: Core tables for PicklePal
-- Tables: players, sessions, matches, rally_events, match_queue_items, recap_cards

-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_group_id ON public.players (group_id);
CREATE INDEX idx_players_group_active ON public.players (group_id, is_active);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are publicly readable"
  ON public.players FOR SELECT USING (true);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TYPE session_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT,
  status session_status NOT NULL DEFAULT 'active',
  default_match_type TEXT NOT NULL DEFAULT 'doubles',
  target_score INTEGER NOT NULL DEFAULT 11,
  win_by INTEGER NOT NULL DEFAULT 2,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_group_id ON public.sessions (group_id);
CREATE INDEX idx_sessions_group_status ON public.sessions (group_id, status);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions are publicly readable"
  ON public.sessions FOR SELECT USING (true);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TYPE match_status AS ENUM ('queued', 'active', 'completed', 'cancelled');
CREATE TYPE match_type AS ENUM ('singles', 'doubles');

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  match_type match_type NOT NULL DEFAULT 'doubles',
  status match_status NOT NULL DEFAULT 'queued',
  team_a_player_ids UUID[] NOT NULL DEFAULT '{}',
  team_b_player_ids UUID[] NOT NULL DEFAULT '{}',
  team_a_score INTEGER NOT NULL DEFAULT 0,
  team_b_score INTEGER NOT NULL DEFAULT 0,
  winning_team TEXT,
  losing_team TEXT,
  starting_server_player_id UUID REFERENCES public.players(id),
  target_score INTEGER NOT NULL DEFAULT 11,
  win_by INTEGER NOT NULL DEFAULT 2,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_session_id ON public.matches (session_id);
CREATE INDEX idx_matches_session_status ON public.matches (session_id, status);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are publicly readable"
  ON public.matches FOR SELECT USING (true);

-- ============================================================
-- RALLY EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rally_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  rally_winner_team TEXT NOT NULL,
  resulting_team_a_score INTEGER NOT NULL,
  resulting_team_b_score INTEGER NOT NULL,
  server_player_id UUID NOT NULL REFERENCES public.players(id),
  server_number INTEGER,
  side_out_occurred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rally_events_match_id ON public.rally_events (match_id);
CREATE INDEX idx_rally_events_match_seq ON public.rally_events (match_id, sequence_number);

-- Ensure no duplicate sequence numbers per match
CREATE UNIQUE INDEX idx_rally_events_unique_seq ON public.rally_events (match_id, sequence_number);

ALTER TABLE public.rally_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rally events are publicly readable"
  ON public.rally_events FOR SELECT USING (true);

-- ============================================================
-- MATCH QUEUE ITEMS
-- ============================================================
CREATE TYPE queue_item_status AS ENUM ('pending', 'active', 'completed', 'skipped');

CREATE TABLE IF NOT EXISTS public.match_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  queue_order INTEGER NOT NULL,
  status queue_item_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_queue_session ON public.match_queue_items (session_id, queue_order);

ALTER TABLE public.match_queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match queue items are publicly readable"
  ON public.match_queue_items FOR SELECT USING (true);

-- ============================================================
-- RECAP CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recap_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  image_url TEXT,
  generated_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recap_cards_session ON public.recap_cards (session_id);

ALTER TABLE public.recap_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recap cards are publicly readable"
  ON public.recap_cards FOR SELECT USING (true);
