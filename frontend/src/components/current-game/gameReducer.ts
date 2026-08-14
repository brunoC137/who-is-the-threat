import {
  CommentaryEntry,
  EliminationCause,
  GamePlayer,
  GameSnapshot,
  GameState,
} from './types';

export const STARTING_LIFE = 40;
export const LETHAL_POISON = 10;
export const LETHAL_COMMANDER_DAMAGE = 21;

/** Undo depth. Snapshots are ~6 small objects, so this is cheap. */
const MAX_HISTORY = 60;

export type GameAction =
  | { type: 'START'; players: GamePlayer[] }
  | { type: 'RESTORE'; state: GameState }
  | { type: 'CHANGE_LIFE'; seatId: string; delta: number }
  | { type: 'CHANGE_POISON'; seatId: string; delta: number }
  | { type: 'CHANGE_COMMANDER_DAMAGE'; seatId: string; fromSeatId: string; delta: number }
  | { type: 'DISMISS_ELIMINATION' }
  | { type: 'CONFIRM_ELIMINATION'; killerSeatId: string | null }
  | { type: 'CONCEDE'; seatId: string }
  | { type: 'REVIVE'; seatId: string }
  | { type: 'SET_FIRST_PLAYER'; seatId: string }
  | { type: 'TICK' }
  | { type: 'SET_TIMER_RUNNING'; running: boolean }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'ADD_COMMENTARY'; text: string }
  | { type: 'REMOVE_COMMENTARY'; index: number }
  | { type: 'END_GAME'; survivorOrder: string[] }
  | { type: 'UNDO' };

export function createInitialState(players: GamePlayer[] = []): GameState {
  return {
    players,
    status: 'playing',
    elapsedSeconds: 0,
    isTimerRunning: players.length > 0,
    notes: '',
    commentary: [],
    eliminationPrompt: null,
    past: [],
  };
}

const snapshot = (state: GameState): GameSnapshot => ({
  players: state.players,
  status: state.status,
  commentary: state.commentary,
  notes: state.notes,
});

/**
 * Undo works on whole-state snapshots rather than inverse operations.
 * An elimination changes several players at once (the victim's placement, and
 * potentially the winner's), so inverting it field-by-field is where the
 * previous implementation went wrong. Snapshots make every action undoable by
 * construction.
 */
const withHistory = (state: GameState, next: Partial<GameState>): GameState => ({
  ...state,
  ...next,
  past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
});

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const updateSeat = (
  players: GamePlayer[],
  seatId: string,
  update: (player: GamePlayer) => GamePlayer
): GamePlayer[] => players.map(p => (p.id === seatId ? update(p) : p));

const alivePlayers = (players: GamePlayer[]): GamePlayer[] =>
  players.filter(p => !p.isEliminated);

/** True when the player is at or past any lethal threshold. */
const isAtLethalState = (player: GamePlayer): boolean =>
  player.life <= 0 ||
  player.poison >= LETHAL_POISON ||
  Object.values(player.commanderDamage).some(d => d >= LETHAL_COMMANDER_DAMAGE);

/**
 * Decide whether the death prompt should open for a player after a change.
 * Returns the prompt, or null when nothing should be raised.
 *
 * A player who dismissed the prompt while still lethal is left alone until
 * they climb back out of it, so a mis-tap does not trap them in a loop.
 */
function detectElimination(
  player: GamePlayer,
  sourceSeatId?: string
): GameState['eliminationPrompt'] {
  if (player.isEliminated || player.deathDismissed) return null;

  const lethalCommander = Object.entries(player.commanderDamage).find(
    ([, damage]) => damage >= LETHAL_COMMANDER_DAMAGE
  );

  if (lethalCommander) {
    return {
      playerId: player.id,
      reason: 'commanderDamage',
      suggestedKillerId: lethalCommander[0],
    };
  }

  if (player.poison >= LETHAL_POISON) {
    return { playerId: player.id, reason: 'poison' };
  }

  if (player.life <= 0) {
    return { playerId: player.id, reason: 'life', suggestedKillerId: sourceSeatId };
  }

  return null;
}

/**
 * Assign the placement a player gets by dying now: last place among those
 * still standing. With 4 players the first death takes 4th, the next 3rd, and
 * the final survivor is awarded 1st by finishIfDecided.
 */
const placementForDeath = (players: GamePlayer[]): number =>
  alivePlayers(players).length;

/** When one player is left standing, award 1st and stop the clock. */
function finishIfDecided(state: GameState): GameState {
  const alive = alivePlayers(state.players);
  if (alive.length > 1 || state.players.length === 0) return state;

  return {
    ...state,
    players: state.players.map(p =>
      p.isEliminated ? p : { ...p, placement: 1 }
    ),
    status: 'ended',
    isTimerRunning: false,
    eliminationPrompt: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return createInitialState(action.players);

    case 'RESTORE':
      return action.state;

    case 'CHANGE_LIFE': {
      const target = state.players.find(p => p.id === action.seatId);
      if (!target || target.isEliminated) return state;

      const players = updateSeat(state.players, action.seatId, p => {
        const life = p.life + action.delta;
        return {
          ...p,
          life,
          // Climbing back out of danger re-arms the death prompt
          deathDismissed: p.deathDismissed && isAtLethalState({ ...p, life }),
        };
      });

      const updated = players.find(p => p.id === action.seatId)!;

      return withHistory(state, {
        players,
        eliminationPrompt: state.eliminationPrompt ?? detectElimination(updated),
      });
    }

    case 'CHANGE_POISON': {
      const target = state.players.find(p => p.id === action.seatId);
      if (!target || target.isEliminated) return state;

      const players = updateSeat(state.players, action.seatId, p => {
        const poison = clamp(p.poison + action.delta, 0, LETHAL_POISON);
        return {
          ...p,
          poison,
          deathDismissed: p.deathDismissed && isAtLethalState({ ...p, poison }),
        };
      });

      const updated = players.find(p => p.id === action.seatId)!;

      return withHistory(state, {
        players,
        eliminationPrompt: state.eliminationPrompt ?? detectElimination(updated),
      });
    }

    case 'CHANGE_COMMANDER_DAMAGE': {
      const target = state.players.find(p => p.id === action.seatId);
      if (!target || target.isEliminated) return state;

      const current = target.commanderDamage[action.fromSeatId] || 0;
      const next = clamp(current + action.delta, 0, LETHAL_COMMANDER_DAMAGE);
      const applied = next - current;
      if (applied === 0) return state;

      const players = updateSeat(state.players, action.seatId, p => {
        const commanderDamage = { ...p.commanderDamage, [action.fromSeatId]: next };
        // Commander damage is real damage: the life total moves with it, as a
        // single undoable action, so the hit is only ever recorded once.
        const life = p.life - applied;
        return {
          ...p,
          commanderDamage,
          life,
          deathDismissed:
            p.deathDismissed && isAtLethalState({ ...p, commanderDamage, life }),
        };
      });

      const updated = players.find(p => p.id === action.seatId)!;

      return withHistory(state, {
        players,
        eliminationPrompt:
          state.eliminationPrompt ?? detectElimination(updated, action.fromSeatId),
      });
    }

    case 'DISMISS_ELIMINATION': {
      if (!state.eliminationPrompt) return state;
      const { playerId } = state.eliminationPrompt;

      return {
        ...state,
        eliminationPrompt: null,
        players: updateSeat(state.players, playerId, p => ({
          ...p,
          deathDismissed: true,
        })),
      };
    }

    case 'CONFIRM_ELIMINATION': {
      const prompt = state.eliminationPrompt;
      if (!prompt) return state;

      const victim = state.players.find(p => p.id === prompt.playerId);
      if (!victim || victim.isEliminated) {
        return { ...state, eliminationPrompt: null };
      }

      const placement = placementForDeath(state.players);
      const players = updateSeat(state.players, prompt.playerId, p => ({
        ...p,
        isEliminated: true,
        eliminatedBy: action.killerSeatId ?? undefined,
        eliminationCause: prompt.reason as EliminationCause,
        placement,
        deathDismissed: false,
      }));

      return finishIfDecided(
        withHistory(state, { players, eliminationPrompt: null })
      );
    }

    case 'CONCEDE': {
      const victim = state.players.find(p => p.id === action.seatId);
      if (!victim || victim.isEliminated) return state;

      const placement = placementForDeath(state.players);
      const players = updateSeat(state.players, action.seatId, p => ({
        ...p,
        isEliminated: true,
        eliminationCause: 'conceded' as EliminationCause,
        placement,
        deathDismissed: false,
      }));

      return finishIfDecided(
        withHistory(state, { players, eliminationPrompt: null })
      );
    }

    case 'REVIVE': {
      const target = state.players.find(p => p.id === action.seatId);
      if (!target || !target.isEliminated) return state;

      // Bringing someone back invalidates every placement below them, so all
      // placements are dropped and recomputed as the game plays out again.
      const players = state.players.map(p =>
        p.id === action.seatId
          ? {
              ...p,
              isEliminated: false,
              eliminatedBy: undefined,
              eliminationCause: undefined,
              placement: undefined,
              deathDismissed: true,
              life: p.life > 0 ? p.life : 1,
            }
          : p.isEliminated
            ? p
            : { ...p, placement: undefined }
      );

      return withHistory(state, {
        players,
        status: 'playing',
        isTimerRunning: true,
        eliminationPrompt: null,
      });
    }

    case 'SET_FIRST_PLAYER':
      return {
        ...state,
        players: state.players.map(p => ({
          ...p,
          isFirstPlayer: p.id === action.seatId,
        })),
      };

    case 'TICK':
      if (!state.isTimerRunning || state.status === 'ended') return state;
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };

    case 'SET_TIMER_RUNNING':
      if (state.status === 'ended') return state;
      return { ...state, isTimerRunning: action.running };

    case 'SET_NOTES':
      return { ...state, notes: action.notes };

    case 'ADD_COMMENTARY': {
      const text = action.text.trim();
      if (!text) return state;

      const entry: CommentaryEntry = { text, timestamp: Date.now() };
      return withHistory(state, { commentary: [...state.commentary, entry] });
    }

    case 'REMOVE_COMMENTARY':
      return withHistory(state, {
        commentary: state.commentary.filter((_, i) => i !== action.index),
      });

    /**
     * Ending early: survivors are ranked by the order the user gives, taking
     * places 1..n. Players already eliminated keep the placements they earned,
     * which sit immediately below. That keeps the set unique and consecutive
     * from 1, which is what the API requires.
     */
    case 'END_GAME': {
      const players = state.players.map(p => {
        if (p.isEliminated) return p;
        const rank = action.survivorOrder.indexOf(p.id);
        return { ...p, placement: rank >= 0 ? rank + 1 : undefined };
      });

      return withHistory(state, {
        players,
        status: 'ended',
        isTimerRunning: false,
        eliminationPrompt: null,
      });
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;

      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        ...previous,
        eliminationPrompt: null,
        past: state.past.slice(0, -1),
      };
    }

    default:
      return state;
  }
}

/** Placements are only valid to save when they are unique and 1..n. */
export function getPlacementError(players: GamePlayer[]): string | null {
  const placements = players.map(p => p.placement);

  if (placements.some(p => typeof p !== 'number')) {
    return 'missing';
  }

  const sorted = [...(placements as number[])].sort((a, b) => a - b);
  const isValid = sorted.every((placement, index) => placement === index + 1);

  return isValid ? null : 'invalid';
}
