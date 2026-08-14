'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Play, RotateCcw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Deck, Player } from './types';
import { getDisplayName } from './utils';

export interface SeatSelection {
  playerId: string;
  deckId: string;
}

interface GameSetupProps {
  playerCount: number;
  selections: SeatSelection[];
  availablePlayers: Player[];
  availableDecks: Deck[];
  hasResumableGame: boolean;
  onPlayerCountChange: (count: number) => void;
  onSelectPlayer: (index: number, playerId: string) => void;
  onSelectDeck: (index: number, deckId: string) => void;
  onResume: () => void;
  onDiscardResumable: () => void;
  onStart: () => void;
  t: (key: string) => string;
}

export function GameSetup({
  playerCount,
  selections,
  availablePlayers,
  availableDecks,
  hasResumableGame,
  onPlayerCountChange,
  onSelectPlayer,
  onSelectDeck,
  onResume,
  onDiscardResumable,
  onStart,
  t,
}: GameSetupProps) {
  const takenPlayerIds = selections.map(s => s.playerId).filter(Boolean);
  const canStart =
    selections.length === playerCount && selections.every(s => s.playerId && s.deckId);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-3xl px-4 py-5">
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

      <section className="mb-5">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Users className="h-4 w-4" />
          {t('currentGame.selectPlayerCount')}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {[3, 4, 5, 6].map(count => (
            <Button
              key={count}
              variant={playerCount === count ? 'default' : 'outline'}
              onClick={() => onPlayerCountChange(count)}
              className={`h-14 text-xl font-bold ${playerCount === count ? 'shadow-glow-sm' : ''}`}
            >
              {count}
            </Button>
          ))}
        </div>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="mb-2 text-sm font-semibold">{t('currentGame.selectPlayers')}</h2>

        {Array.from({ length: playerCount }).map((_, index) => {
          const selection = selections[index] || { playerId: '', deckId: '' };
          const decksForPlayer = availableDecks.filter(
            deck => deck.owner?._id === selection.playerId
          );
          const selectedPlayer = availablePlayers.find(p => p._id === selection.playerId);
          const selectedDeck = availableDecks.find(d => d._id === selection.deckId);
          const isComplete = Boolean(selection.playerId && selection.deckId);

          return (
            <div
              key={index}
              className={`rounded-xl border p-3 transition-colors ${
                isComplete ? 'border-success/40 bg-success/5' : 'border-border bg-card/50'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {index + 1}
                </span>

                {selectedPlayer && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={selectedDeck?.deckImage || selectedPlayer.profileImage}
                    />
                    <AvatarFallback className="text-[10px]">
                      {selectedPlayer.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {selectedPlayer ? getDisplayName(selectedPlayer) : t('currentGame.emptySeat')}
                </span>

                {isComplete && <Check className="h-4 w-4 shrink-0 text-success" />}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={selection.playerId}
                  onChange={event => onSelectPlayer(index, event.target.value)}
                  aria-label={t('currentGame.selectPlayer')}
                  className="h-11 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">{t('currentGame.choosePlayers')}</option>
                  {availablePlayers
                    .filter(
                      player =>
                        player._id === selection.playerId ||
                        !takenPlayerIds.includes(player._id)
                    )
                    .map(player => (
                      <option key={player._id} value={player._id}>
                        {getDisplayName(player)}
                      </option>
                    ))}
                </select>

                <select
                  value={selection.deckId}
                  onChange={event => onSelectDeck(index, event.target.value)}
                  disabled={!selection.playerId}
                  aria-label={t('currentGame.selectDeck')}
                  className="h-11 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                >
                  <option value="">
                    {decksForPlayer.length === 0 && selection.playerId
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
            </div>
          );
        })}
      </section>

      <Button
        size="lg"
        disabled={!canStart}
        onClick={onStart}
        className="h-14 w-full text-lg font-bold shadow-glow-md"
      >
        <Play className="mr-2 h-5 w-5" />
        {t('currentGame.startGame')}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t('currentGame.landscapeHint')}
      </p>
    </div>
  );
}
