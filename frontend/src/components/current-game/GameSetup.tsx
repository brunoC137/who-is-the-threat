'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Play, Repeat, RotateCcw, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Deck, Player } from './types';
import { BoardView, getBoardLayout } from './layout';
import { MAX_PLAYERS, MIN_PLAYERS } from './gameReducer';
import { getDisplayName } from './utils';

export interface SeatSelection {
  playerId: string;
  deckId: string;
}

interface GameSetupProps {
  /** The lineup in seat order. Its length is the player count. */
  selections: SeatSelection[];
  availablePlayers: Player[];
  availableDecks: Deck[];
  /** How recently each player last played (0 = most recent), for ordering the grid. */
  playerRecency: Map<string, number>;
  /** The last game's lineup, offered as a one-tap rematch. */
  rematchLineup: SeatSelection[];
  hasResumableGame: boolean;
  boardView: BoardView;
  onBoardViewChange: (view: BoardView) => void;
  /** Add a player to the next seat, or remove them if already in. */
  onTogglePlayer: (playerId: string) => void;
  onSelectDeck: (playerId: string, deckId: string) => void;
  onRematch: () => void;
  onResume: () => void;
  onDiscardResumable: () => void;
  onStart: () => void;
  t: (key: string) => string;
}

/**
 * Setting up should take a few taps, not a form: the same group plays week
 * after week, so the likely lineup is one tap (rematch), players are picked
 * from a grid ordered by who played last, and each one arrives with the deck
 * they last played. Order does not matter here — seating is fixed on the
 * board, in arrange mode.
 */
export function GameSetup({
  selections,
  availablePlayers,
  availableDecks,
  playerRecency,
  rematchLineup,
  hasResumableGame,
  boardView,
  onBoardViewChange,
  onTogglePlayer,
  onSelectDeck,
  onRematch,
  onResume,
  onDiscardResumable,
  onStart,
  t,
}: GameSetupProps) {
  const selectedIds = selections.map(selection => selection.playerId);
  const isFull = selections.length >= MAX_PLAYERS;
  const hasEnoughPlayers = selections.length >= MIN_PLAYERS;
  const everyoneHasDeck = selections.every(selection => selection.deckId);
  const canStart = hasEnoughPlayers && everyoneHasDeck;

  const playersById = useMemo(
    () => new Map(availablePlayers.map(player => [player._id, player])),
    [availablePlayers]
  );

  // Regulars first: most recent players lead, everyone else alphabetically
  const sortedPlayers = useMemo(
    () =>
      [...availablePlayers].sort((a, b) => {
        const rankA = playerRecency.get(a._id) ?? Number.MAX_SAFE_INTEGER;
        const rankB = playerRecency.get(b._id) ?? Number.MAX_SAFE_INTEGER;
        return rankA !== rankB
          ? rankA - rankB
          : getDisplayName(a).localeCompare(getDisplayName(b));
      }),
    [availablePlayers, playerRecency]
  );

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-3xl px-4 pt-5">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/games">
          <Button variant="ghost" size="icon" aria-label={t('actions.back')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('currentGame.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('currentGame.setupDescription')}</p>
        </div>
      </div>

      {/* Offered before anything else: an interrupted game is the one thing
          the player is most likely to be here for. */}
      {hasResumableGame && (
        <div className="mb-5 rounded-xl border border-warning/50 bg-warning/10 p-3">
          <p className="mb-2 text-sm font-semibold">{t('currentGame.resumeFound')}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onResume}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {t('currentGame.resumeGame')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDiscardResumable}>
              {t('currentGame.discardGame')}
            </Button>
          </div>
        </div>
      )}

      {rematchLineup.length >= MIN_PLAYERS && (
        <button
          type="button"
          onClick={onRematch}
          className="mb-5 flex w-full items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3 text-left transition-colors hover:bg-primary/15"
        >
          <Repeat className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t('currentGame.rematch')}</span>
            <span className="block text-xs text-muted-foreground">
              {t('currentGame.rematchHint')}
            </span>
          </span>
          <span className="flex shrink-0 -space-x-2">
            {rematchLineup.map(selection => {
              const player = playersById.get(selection.playerId);
              return (
                player && (
                  <PlayerAvatar
                    key={selection.playerId}
                    player={player}
                    className="h-7 w-7 ring-2 ring-background"
                  />
                )
              );
            })}
          </span>
        </button>
      )}

      <section className="mb-5">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <LayoutGrid className="h-4 w-4" />
          {t('currentGame.boardView')}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(['table', 'sides'] as const).map(view => {
            const active = boardView === view;

            return (
              <button
                key={view}
                type="button"
                onClick={() => onBoardViewChange(view)}
                aria-pressed={active}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
                  active ? 'border-primary bg-primary/10 shadow-glow-sm' : 'border-border bg-card/50'
                }`}
              >
                <ViewPreview view={view} active={active} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {t(view === 'table' ? 'currentGame.viewTable' : 'currentGame.viewSides')}
                  </span>
                  <span className="block text-xs leading-snug text-muted-foreground">
                    {t(view === 'table' ? 'currentGame.viewTableHint' : 'currentGame.viewSidesHint')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
          <Users className="h-4 w-4" />
          {t('currentGame.whoIsPlaying')}
          <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
            {selections.length}/{MAX_PLAYERS}
          </span>
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">{t('currentGame.whoIsPlayingHint')}</p>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {sortedPlayers.map(player => {
            const seat = selectedIds.indexOf(player._id);
            const selected = seat >= 0;

            return (
              <button
                key={player._id}
                type="button"
                onClick={() => onTogglePlayer(player._id)}
                disabled={!selected && isFull}
                aria-pressed={selected}
                className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl border p-2 transition-colors disabled:opacity-40 ${
                  selected ? 'border-primary bg-primary/15' : 'border-border bg-card/50'
                }`}
              >
                <PlayerAvatar player={player} className="h-11 w-11" />
                <span className="w-full truncate text-center text-xs font-medium">
                  {getDisplayName(player)}
                </span>
                {selected && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {seat + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {selections.length > 0 && (
        <section className="mb-5 space-y-2">
          <h2 className="text-sm font-semibold">{t('currentGame.decksTitle')}</h2>

          {selections.map((selection, index) => {
            const player = playersById.get(selection.playerId);
            const decksForPlayer = availableDecks.filter(
              deck => deck.owner?._id === selection.playerId
            );
            const selectedDeck = decksForPlayer.find(deck => deck._id === selection.deckId);

            return (
              <div
                key={selection.playerId}
                className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                  selection.deckId ? 'border-success/40 bg-success/5' : 'border-warning/50 bg-warning/5'
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {index + 1}
                </span>

                {player && (
                  <PlayerAvatar
                    player={player}
                    image={selectedDeck?.deckImage}
                    className="h-9 w-9 shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">
                    {player ? getDisplayName(player) : '—'}
                  </p>
                  <select
                    value={selection.deckId}
                    onChange={event => onSelectDeck(selection.playerId, event.target.value)}
                    aria-label={t('currentGame.selectDeck')}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">
                      {decksForPlayer.length === 0
                        ? t('currentGame.noDecksForPlayer')
                        : t('currentGame.chooseDeck')}
                    </option>
                    {decksForPlayer.map(deck => (
                      <option key={deck._id} value={deck._id}>
                        {deck.name} — {deck.commander}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => onTogglePlayer(selection.playerId)}
                  aria-label={t('currentGame.removePlayer')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* Pinned so Start is always one thumb-reach away, however long the
          player grid gets. */}
      <div className="sticky bottom-0 -mx-4 border-t border-border/50 bg-background/90 px-4 pb-4 pt-3 backdrop-blur">
        <Button
          size="lg"
          disabled={!canStart}
          onClick={onStart}
          className="h-14 w-full text-lg font-bold shadow-glow-md"
        >
          <Play className="mr-2 h-5 w-5" />
          {t('currentGame.startGame')}
        </Button>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {!hasEnoughPlayers
            ? t('currentGame.pickAtLeastTwo')
            : !everyoneHasDeck
              ? t('currentGame.everyoneNeedsDeck')
              : t('currentGame.landscapeHint')}
        </p>
      </div>
    </div>
  );
}

function PlayerAvatar({
  player,
  image,
  className,
}: {
  player: Player;
  /** Shown instead of the profile picture, e.g. the chosen deck's art. */
  image?: string;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage src={image || player.profileImage} />
      <AvatarFallback className="text-xs">
        {player.name?.charAt(0)?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** A four-player thumbnail of a view, drawn from the real layout data. */
function ViewPreview({ view, active }: { view: BoardView; active: boolean }) {
  const layout = getBoardLayout(4, view);

  return (
    <span
      aria-hidden
      className="relative grid h-8 w-12 shrink-0 gap-0.5 rounded-md border border-border/60 p-0.5"
      style={{
        gridTemplateAreas: layout.gridTemplateAreas,
        gridTemplateColumns: layout.gridTemplateColumns,
        gridTemplateRows: layout.gridTemplateRows,
      }}
    >
      {layout.seats.map(seat => (
        <span
          key={seat.area}
          style={{ gridArea: seat.area }}
          className={`rounded-sm ${active ? 'bg-primary/70' : 'bg-muted-foreground/40'}`}
        />
      ))}
      {/* The sides view's control orb */}
      {view === 'sides' && (
        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-warning" />
      )}
    </span>
  );
}
