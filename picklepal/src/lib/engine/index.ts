export {
  createMatch,
  processRally,
  isMatchComplete,
  getMatchResult,
  getServerCourtSide,
} from "./engine";

export {
  createMatchHistory,
  recordRally,
  undoRally,
  undoMultiple,
  canUndo,
  undoDepth,
} from "./undo";

export { isDoublesState, isSinglesState } from "./types";

export type {
  Team,
  MatchType,
  ServerNumber,
  CourtSide,
  MatchConfig,
  DoublesPositions,
  DoublesServerState,
  SinglesServerState,
  DoublesMatchState,
  SinglesMatchState,
  MatchState,
  RallyResult,
  MatchResult,
  CreateDoublesMatchInput,
  CreateSinglesMatchInput,
  CreateMatchInput,
} from "./types";

export type { MatchHistory } from "./undo";
