export interface Player {
  _id: string;
  name: string;
  nickname?: string;
  profileImage?: string;
}

export interface Deck {
  _id: string;
  name: string;
  commander: string;
  deckImage?: string;
  colorIdentity?: string[];
  owner: {
    _id: string;
    name: string;
    nickname?: string;
  };
}

/** Why a player left the game. Mirrors Game.players.eliminationCause. */
export type EliminationCause =
  | 'life'
  | 'poison'
  | 'commanderDamage'
  | 'conceded'
  | 'other';

export interface GamePlayer {
  /** Stable per-seat id for this game; not the Player document id. */
  id: string;
  playerId: string;
  deckId: string;
  player: Player;
  deck: Deck;
  life: number;
  poison: number;
  /** Damage received, keyed by the *seat id* of the source player. */
  commanderDamage: { [opponentSeatId: string]: number };
  isEliminated: boolean;
  /** Seat id of the killer, resolved to a Player id only when saving. */
  eliminatedBy?: string;
  eliminationCause?: EliminationCause;
  placement?: number;
  isFirstPlayer?: boolean;
  /**
   * Set when the player dismissed a death prompt while still at a lethal
   * value, so the prompt does not immediately reopen. Cleared automatically
   * once they are back above every lethal threshold.
   */
  deathDismissed?: boolean;
}

export interface CommentaryEntry {
  text: string;
  timestamp: number;
}

export interface EliminationPrompt {
  playerId: string;
  reason: Extract<EliminationCause, 'life' | 'poison' | 'commanderDamage'>;
  /** Pre-selected killer when the cause identifies one (commander damage). */
  suggestedKillerId?: string;
}

export interface GameState {
  players: GamePlayer[];
  status: 'playing' | 'ended';
  elapsedSeconds: number;
  isTimerRunning: boolean;
  notes: string;
  commentary: CommentaryEntry[];
  eliminationPrompt: EliminationPrompt | null;
  /** Bounded snapshot stack; see gameReducer for why snapshots over inverses. */
  past: GameSnapshot[];
}

export interface GameSnapshot {
  players: GamePlayer[];
  status: GameState['status'];
  commentary: CommentaryEntry[];
  notes: string;
}
