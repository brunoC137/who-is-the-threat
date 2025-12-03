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

export interface GamePlayer {
  id: string;
  playerId?: string;
  deckId?: string;
  player: Player;
  deck: Deck;
  life: number;
  poison: number;
  commanderDamage: { [opponentId: string]: number };
  isEliminated: boolean;
  eliminatedBy?: string;
  placement?: number;
  isFirstPlayer?: boolean;
}

export interface GameAction {
  type: 'LIFE_CHANGE' | 'POISON_CHANGE' | 'COMMANDER_DAMAGE_CHANGE' | 'ELIMINATE_PLAYER' | 'SET_FIRST_PLAYER';
  playerId: string;
  value?: number;
  fromPlayerId?: string;
  killedBy?: string;
}

export interface CommentaryEntry {
  text: string;
  timestamp: number;
}
