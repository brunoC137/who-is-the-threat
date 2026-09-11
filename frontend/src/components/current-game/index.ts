export { GameBoard } from './GameBoard';
export { GameOrb } from './GameOrb';
export { GameSetup } from './GameSetup';
export type { SeatSelection } from './GameSetup';
export { GameTopBar } from './GameTopBar';
export { LandscapeFrame, useFrame } from './LandscapeFrame';
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
  MIN_PLAYERS,
  MAX_PLAYERS,
  LETHAL_POISON,
  LETHAL_COMMANDER_DAMAGE,
} from './gameReducer';
export type { GameAction } from './gameReducer';

export { EMPTY_SETUP_HISTORY, buildSetupHistory, defaultDeckFor } from './setupHistory';
export type { RecentGame, SetupHistory } from './setupHistory';

export {
  getBoardLayout,
  isQuarterTurn,
  isSideSeat,
} from './layout';
export type { BoardLayout, BoardView, Orientation, Seat, SeatEdge, SeatRotation } from './layout';

export {
  useBoardView,
  useCollapsedHeader,
  useCommanderShortcuts,
  useOrbLabels,
  useHoldRepeat,
  useOrientation,
  usePersistedGame,
  useViewportSize,
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
