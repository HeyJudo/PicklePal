export {
  createMatchmakingState,
  generateNextMatchup,
  generateMatchup,
  generateQueue,
  shuffleMatchup,
  buildPriorStats,
} from "./matchmaking";

export type { SessionMatchRecord } from "./matchmaking";

export type {
  MatchType,
  PlayerSession,
  Matchup,
  MatchmakingState,
  GenerateMatchupInput,
  MatchupReason,
  ReasonKey,
  PriorPlayerStats,
} from "./types";

export { MatchmakingError } from "./types";

