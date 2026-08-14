export { GameBoard } from './GameBoard';
export { GameSetup } from './GameSetup';
export type { SeatSelection } from './GameSetup';
export { GameTopBar } from './GameTopBar';
export { PlayerCard } from './PlayerCard';
export { PlayerDetailsSheet } from './PlayerDetailsSheet';
export { EliminationDialog } from './EliminationDialog';
export { EndGameDialog } from './EndGameDialog';
export { NotesSheet } from './NotesSheet';

export {
  gameReducer,
  createInitialState,
  getPlacementError,
  STARTING_LIFE,
  LETHAL_POISON,
  LETHAL_COMMANDER_DAMAGE,
} from './gameReducer';
export type { GameAction } from './gameReducer';

export {
  getBoardLayout,
  isQuarterTurn,
  isSideSeat,
} from './layout';
export type { BoardLayout, Orientation, Seat, SeatEdge, SeatRotation } from './layout';

export {
  useHoldRepeat,
  useOrientation,
  usePersistedGame,
  useWakeLock,
  loadPersistedGame,
  clearPersistedGame,
} from './hooks';

export {
  formatPlacement,
  formatTime,
  getDisplayName,
  getLifeColor,
  haptic,
} from './utils';

export type {
  CommentaryEntry,
  Deck,
  EliminationCause,
  EliminationPrompt,
  GamePlayer,
  GameSnapshot,
  GameState,
  Player,
} from './types';
