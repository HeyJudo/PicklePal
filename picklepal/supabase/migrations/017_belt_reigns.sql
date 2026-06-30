-- Phase Belts: reign history for live, ownable titles
-- Enum covers all three belts (pickler included for future use).

CREATE TYPE belt_type AS ENUM ('king_of_the_kitchen', 'poacher', 'pickler');

CREATE TABLE IF NOT EXISTS public.belt_reigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  belt_type belt_type NOT NULL,
  holder_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  subject_player_id UUID REFERENCES public.players(id) ON DELETE CASCADE, -- Pickler only; the dominated opponent
  context JSONB,                  -- e.g. {"streak":7} / {"winRate":0.83,"games":9} for display + Hall of Fame
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,           -- NULL = current/active reign
  season_id UUID,                 -- nullable; reserved for a future season system
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_belt_reigns_group_current
  ON public.belt_reigns (group_id, belt_type) WHERE ended_at IS NULL;
CREATE INDEX idx_belt_reigns_group_started
  ON public.belt_reigns (group_id, started_at DESC);
CREATE UNIQUE INDEX idx_belt_reigns_one_active
  ON public.belt_reigns (group_id, belt_type,
     COALESCE(subject_player_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE ended_at IS NULL;

ALTER TABLE public.belt_reigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Belt reigns are publicly readable" ON public.belt_reigns FOR SELECT USING (true);
