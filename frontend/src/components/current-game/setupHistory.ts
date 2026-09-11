import { Deck, Player } from './types';
import type { SeatSelection } from './GameSetup';

/**
 * The slice of a game from GET /api/games that setup needs. Populated refs
 * come back null when the player or deck has since been deleted, so every
 * field is treated as possibly missing.
 */
export interface RecentGame {
  players?: Array<{
    player?: { _id?: string } | null;
    deck?: { _id?: string } | null;
  }>;
}

export interface SetupHistory {
  /** The most recent deck each player used that they own and can still pick. */
  lastDeckByPlayer: Map<string, string>;
  /** How recently each player last played: 0 is the most recent. */
  recency: Map<string, number>;
  /** The last game's lineup in seat order, trimmed to what can still be picked. */
  lastLineup: SeatSelection[];
}

export const EMPTY_SETUP_HISTORY: SetupHistory = {
  lastDeckByPlayer: new Map(),
  recency: new Map(),
  lastLineup: [],
};

/**
 * The deck a player should start with: the last one they played, if they
 * still own it and it is not archived; otherwise their only deck; otherwise
 * nothing, and they pick.
 */
export function defaultDeckFor(
  playerId: string,
  history: SetupHistory,
  decks: Deck[]
): string {
  const last = history.lastDeckByPlayer.get(playerId);
  if (last) return last;

  const own = decks.filter(deck => deck.owner?._id === playerId);
  return own.length === 1 ? own[0]._id : '';
}

/**
 * Derive setup defaults from recent games (newest first, as the API returns
 * them). Only suggestions come out of this: anything no longer valid — a
 * deleted player, an archived deck, a deck that was borrowed — is dropped
 * rather than offered.
 */
export function buildSetupHistory(
  games: RecentGame[],
  players: Player[],
  decks: Deck[]
): SetupHistory {
  const playerIds = new Set(players.map(player => player._id));
  // `decks` holds only pickable (non-archived) decks, so this also filters archived ones
  const deckOwner = new Map(decks.map(deck => [deck._id, deck.owner?._id]));

  const lastDeckByPlayer = new Map<string, string>();
  const recency = new Map<string, number>();

  games.forEach(game => {
    game.players?.forEach(participant => {
      const playerId = participant.player?._id;
      if (!playerId || !playerIds.has(playerId)) return;

      if (!recency.has(playerId)) recency.set(playerId, recency.size);

      const deckId = participant.deck?._id;
      // A borrowed deck is not theirs to default to next time
      if (deckId && !lastDeckByPlayer.has(playerId) && deckOwner.get(deckId) === playerId) {
        lastDeckByPlayer.set(playerId, deckId);
      }
    });
  });

  const history: SetupHistory = { lastDeckByPlayer, recency, lastLineup: [] };

  // Saved games keep participants in seat order, so this is also the seating
  const seen = new Set<string>();
  history.lastLineup = (games[0]?.players ?? [])
    .map(participant => participant.player?._id)
    .filter((id): id is string => {
      if (!id || !playerIds.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map(playerId => ({ playerId, deckId: defaultDeckFor(playerId, history, decks) }));

  return history;
}
