'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Trophy, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { decksAPI, gamesAPI, playersAPI } from '@/lib/api';
import {
  EliminationDialog,
  EndGameDialog,
  GameBoard,
  GameSetup,
  GameTopBar,
  NotesSheet,
  PlayerDetailsSheet,
  STARTING_LIFE,
  clearPersistedGame,
  createInitialState,
  formatPlacement,
  gameReducer,
  getBoardLayout,
  getDisplayName,
  getPlacementError,
  loadPersistedGame,
  useCollapsedHeader,
  usePersistedGame,
  useOrientation,
  useWakeLock,
} from '@/components/current-game';
import type { Deck, GamePlayer, GameState, Player, SeatSelection } from '@/components/current-game';

type Phase = 'setup' | 'playing';

export default function CurrentGamePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const orientation = useOrientation();

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadingData, setLoadingData] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);

  const [playerCount, setPlayerCount] = useState(4);
  const [selections, setSelections] = useState<SeatSelection[]>(
    Array.from({ length: 4 }, () => ({ playerId: '', deckId: '' }))
  );
  const [resumable, setResumable] = useState<GameState | null>(null);

  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState());

  const [openSeatId, setOpenSeatId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);
  const [rollingSeatId, setRollingSeatId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    collapsed: headerCollapsed,
    toggle: toggleHeaderCollapsed,
    expandWithoutSaving,
  } = useCollapsedHeader();

  usePersistedGame(state, phase === 'playing');
  useWakeLock(phase === 'playing' && state.status === 'playing');

  // Load players and decks through the shared API layer
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [playersResponse, decksResponse] = await Promise.all([
          playersAPI.getAll(),
          decksAPI.getAll(),
        ]);

        if (cancelled) return;

        setAvailablePlayers(playersResponse.data?.data || []);
        setAvailableDecks(decksResponse.data?.data || []);
      } catch (error) {
        if (!cancelled) setErrorMessage(t('currentGame.errorLoading'));
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // Surface an interrupted game so a reload never costs the table its progress
  useEffect(() => {
    const persisted = loadPersistedGame();
    if (persisted) setResumable(persisted.state);
  }, []);

  useEffect(() => {
    setSelections(current => {
      const next = Array.from({ length: playerCount }, (_, index) =>
        current[index] || { playerId: '', deckId: '' }
      );
      return next;
    });
  }, [playerCount]);

  // Game clock
  useEffect(() => {
    if (phase !== 'playing' || !state.isTimerRunning || state.status === 'ended') return;

    const interval = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(interval);
  }, [phase, state.isTimerRunning, state.status]);

  useEffect(() => () => {
    if (rollTimer.current) clearInterval(rollTimer.current);
  }, []);

  // Save Game lives in the control bar, so a finished game must never be left
  // with the bar collapsed and no visible way to record it.
  useEffect(() => {
    if (state.status === 'ended') expandWithoutSaving();
  }, [state.status, expandWithoutSaving]);

  const openSeat = useMemo(
    () => state.players.find(p => p.id === openSeatId) || null,
    [state.players, openSeatId]
  );

  const openSeatRotation = useMemo(() => {
    if (!openSeat) return 0 as const;

    const layout = getBoardLayout(state.players.length, orientation);
    const index = state.players.findIndex(p => p.id === openSeat.id);
    return layout.seats[index]?.rotation ?? 0;
  }, [openSeat, state.players, orientation]);

  const handleStart = () => {
    const players: GamePlayer[] = selections.map((selection, index) => {
      const player = availablePlayers.find(p => p._id === selection.playerId)!;
      const deck = availableDecks.find(d => d._id === selection.deckId)!;

      return {
        id: `seat-${index}-${selection.playerId}`,
        playerId: selection.playerId,
        deckId: selection.deckId,
        player,
        deck,
        life: STARTING_LIFE,
        poison: 0,
        commanderDamage: {},
        isEliminated: false,
      };
    });

    dispatch({ type: 'START', players });
    setPhase('playing');
  };

  const handleResume = () => {
    if (!resumable) return;
    dispatch({ type: 'RESTORE', state: resumable });
    setResumable(null);
    setPhase('playing');
  };

  const handleDiscardResumable = () => {
    clearPersistedGame();
    setResumable(null);
  };

  const handleRollFirstPlayer = useCallback(() => {
    const candidates = state.players.filter(p => !p.isEliminated);
    if (candidates.length === 0 || rollTimer.current) return;

    let ticks = 0;
    rollTimer.current = setInterval(() => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      setRollingSeatId(pick.id);
      ticks += 1;

      if (ticks >= 16) {
        if (rollTimer.current) clearInterval(rollTimer.current);
        rollTimer.current = null;
        setRollingSeatId(null);
        dispatch({ type: 'SET_FIRST_PLAYER', seatId: pick.id });
      }
    }, 90);
  }, [state.players]);

  const handleExit = () => {
    // Warn whenever there is unsaved game state — including a finished game
    // that has not been saved yet, which is the easiest result to lose.
    if (state.players.length > 0) {
      // The game stays in localStorage, so leaving is recoverable
      const confirmed = window.confirm(
        state.status === 'ended'
          ? t('currentGame.confirmExitUnsaved')
          : t('currentGame.confirmExit')
      );
      if (!confirmed) return;
    }
    router.push('/games');
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);

    const placementError = getPlacementError(state.players);
    if (placementError) {
      setErrorMessage(t('currentGame.errorPlacements'));
      setSaving(false);
      return;
    }

    // Seat ids are local to this board; everything sent to the API is
    // resolved back to Player document ids here.
    const seatToPlayerId = new Map(state.players.map(p => [p.id, p.playerId]));

    try {
      const payload = {
        players: state.players.map(participant => ({
          player: participant.playerId,
          deck: participant.deckId,
          placement: participant.placement,
          eliminatedBy: participant.eliminatedBy
            ? seatToPlayerId.get(participant.eliminatedBy)
            : undefined,
          eliminationCause: participant.eliminationCause,
          poison: participant.poison,
          commanderDamage: Object.entries(participant.commanderDamage)
            .filter(([, damage]) => damage > 0)
            .map(([seatId, damage]) => ({
              from: seatToPlayerId.get(seatId),
              damage,
            }))
            .filter(entry => Boolean(entry.from)),
        })),
        durationMinutes: Math.max(1, Math.round(state.elapsedSeconds / 60)),
        notes: state.notes.trim() || undefined,
        commentary: state.commentary.map(entry => ({
          text: entry.text,
          timestamp: new Date(entry.timestamp).toISOString(),
        })),
      };

      await gamesAPI.create(payload);
      clearPersistedGame();
      router.push('/games');
    } catch (error: any) {
      const response = error?.response?.data;
      const detail = response?.errors?.[0]?.msg || response?.message;
      setErrorMessage(detail || t('currentGame.errorSaving'));
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">{t('auth.signInToContinue')}</p>
        <Link href="/login">
          <Button>{t('auth.login')}</Button>
        </Link>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <>
        <GameSetup
          playerCount={playerCount}
          selections={selections}
          availablePlayers={availablePlayers}
          availableDecks={availableDecks}
          hasResumableGame={Boolean(resumable)}
          onPlayerCountChange={setPlayerCount}
          onSelectPlayer={(index, playerId) =>
            setSelections(current =>
              current.map((selection, i) =>
                i === index ? { playerId, deckId: '' } : selection
              )
            )
          }
          onSelectDeck={(index, deckId) =>
            setSelections(current =>
              current.map((selection, i) => (i === index ? { ...selection, deckId } : selection))
            )
          }
          onResume={handleResume}
          onDiscardResumable={handleDiscardResumable}
          onStart={handleStart}
          t={t}
        />
        <ErrorToast message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      </>
    );
  }

  const winner = state.players.find(p => p.placement === 1);

  return (
    // relative: anchors the collapsed control overlay, which sits on top of
    // the board rather than taking layout height from it
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background">
      <GameTopBar
        elapsedSeconds={state.elapsedSeconds}
        isTimerRunning={state.isTimerRunning}
        hasEnded={state.status === 'ended'}
        canUndo={state.past.length > 0}
        commentaryCount={state.commentary.length}
        isRolling={rollingSeatId !== null}
        isSaving={saving}
        collapsed={headerCollapsed}
        onToggleCollapsed={toggleHeaderCollapsed}
        onToggleTimer={() => dispatch({ type: 'SET_TIMER_RUNNING', running: !state.isTimerRunning })}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRollFirstPlayer={handleRollFirstPlayer}
        onOpenNotes={() => setShowNotes(true)}
        onEndGame={() => setShowEndGame(true)}
        onSave={handleSave}
        onExit={handleExit}
        t={t}
      />

      <main className="min-h-0 flex-1">
        <GameBoard
          gamePlayers={state.players}
          orientation={orientation}
          rollingSeatId={rollingSeatId}
          onLifeChange={(seatId, delta) => dispatch({ type: 'CHANGE_LIFE', seatId, delta })}
          onOpenDetails={setOpenSeatId}
          t={t}
        />
      </main>

      {state.status === 'ended' && winner && (
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-warning/40 bg-warning/10 px-3 py-1.5">
          <Trophy className="h-4 w-4 text-warning" />
          <span className="text-sm font-bold">
            {getDisplayName(winner.player)} — {formatPlacement(1)}
          </span>
        </div>
      )}

      {openSeat && (
        <PlayerDetailsSheet
          gamePlayer={openSeat}
          allPlayers={state.players}
          rotation={openSeatRotation}
          onPoisonChange={delta =>
            dispatch({ type: 'CHANGE_POISON', seatId: openSeat.id, delta })
          }
          onCommanderDamageChange={(fromSeatId, delta) =>
            dispatch({
              type: 'CHANGE_COMMANDER_DAMAGE',
              seatId: openSeat.id,
              fromSeatId,
              delta,
            })
          }
          onConcede={() => {
            dispatch({ type: 'CONCEDE', seatId: openSeat.id });
            setOpenSeatId(null);
          }}
          onRevive={() => {
            dispatch({ type: 'REVIVE', seatId: openSeat.id });
            setOpenSeatId(null);
          }}
          onClose={() => setOpenSeatId(null)}
          t={t}
        />
      )}

      {state.eliminationPrompt && (
        <EliminationDialog
          prompt={state.eliminationPrompt}
          players={state.players}
          onConfirm={killerSeatId => dispatch({ type: 'CONFIRM_ELIMINATION', killerSeatId })}
          onDismiss={() => dispatch({ type: 'DISMISS_ELIMINATION' })}
          t={t}
        />
      )}

      {showEndGame && (
        <EndGameDialog
          players={state.players}
          onConfirm={survivorOrder => {
            dispatch({ type: 'END_GAME', survivorOrder });
            setShowEndGame(false);
          }}
          onCancel={() => setShowEndGame(false)}
          t={t}
        />
      )}

      {showNotes && (
        <NotesSheet
          commentary={state.commentary}
          notes={state.notes}
          onAddCommentary={text => dispatch({ type: 'ADD_COMMENTARY', text })}
          onRemoveCommentary={index => dispatch({ type: 'REMOVE_COMMENTARY', index })}
          onNotesChange={notes => dispatch({ type: 'SET_NOTES', notes })}
          onClose={() => setShowNotes(false)}
          t={t}
        />
      )}

      <ErrorToast message={errorMessage} onDismiss={() => setErrorMessage(null)} />
    </div>
  );
}

function ErrorToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-lg border border-destructive bg-destructive px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-destructive-foreground">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-destructive-foreground/80 hover:text-destructive-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
