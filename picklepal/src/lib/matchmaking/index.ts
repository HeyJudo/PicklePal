export {
  createMatchmakingState,
  generateNextMatchup,
  generateMatchup,
  generateQueue,
  shuffleMatchup,
} from "./matchmaking";

export type {
  MatchType,
  PlayerSession,
  Matchup,
  MatchmakingState,
  GenerateMatchupInput,
  MatchupReason,
  ReasonKey,
} from "./types";

export { MatchmakingError } from "./types";
