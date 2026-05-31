-- Phase 7.5b: Session Players table for late arrival / temporary bench
-- Tracks which players are active, benched, or removed from a session.

CREATE TYPE session_player_status AS ENUM ('active', 'benched', 'removed');

CREATE TABLE IF NOT EXISTS public.session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status session_player_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each player can only appear once per session
  CONSTRAINT unique_session_player UNIQUE (session_id, player_id)
);

CREATE INDEX idx_session_players_session ON public.session_players (session_id);
CREATE INDEX idx_session_players_session_status ON public.session_players (session_id, status);

ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session players are publicly readable"
  ON public.session_players FOR SELECT USING (true);
