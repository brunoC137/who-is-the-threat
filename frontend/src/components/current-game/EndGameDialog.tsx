'use client';

import { useState } from 'react';
import { Flag, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GamePlayer } from './types';
import { formatPlacement, getDisplayName } from './utils';

interface EndGameDialogProps {
  players: GamePlayer[];
  onConfirm: (survivorOrder: string[]) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

/**
 * Ending a game before everyone is dead still has to produce unique,
 * consecutive placements — the API rejects anything else. Rather than silently
 * giving every survivor 1st place (which is unsavable), the table ranks the
 * remaining players by tapping them in finishing order.
 */
export function EndGameDialog({ players, onConfirm, onCancel, t }: EndGameDialogProps) {
  const survivors = players.filter(p => !p.isEliminated);
  const [order, setOrder] = useState<string[]>(
    survivors.length === 1 ? [survivors[0].id] : []
  );

  const toggle = (seatId: string) => {
    setOrder(current =>
      current.includes(seatId)
        ? current.filter(id => id !== seatId)
        : [...current, seatId]
    );
  };

  const isComplete = order.length === survivors.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-2xl">
        <header className="mb-3 text-center">
          <Flag className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <h2 className="text-lg font-bold">{t('currentGame.endGame')}</h2>
          <p className="text-xs text-muted-foreground">
            {survivors.length > 1
              ? t('currentGame.rankSurvivors')
              : t('currentGame.confirmEndGame')}
          </p>
        </header>

        <div className="mb-4 space-y-1.5">
          {survivors.map(survivor => {
            const rank = order.indexOf(survivor.id);
            const isRanked = rank >= 0;

            return (
              <button
                key={survivor.id}
                type="button"
                onClick={() => toggle(survivor.id)}
                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                  isRanked
                    ? 'border-primary bg-primary/15'
                    : 'border-border/60 bg-background/60 hover:bg-background'
                }`}
              >
                <span
                  className={`flex h-6 w-8 shrink-0 items-center justify-center rounded text-xs font-bold ${
                    isRanked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isRanked ? formatPlacement(rank + 1) : '—'}
                </span>

                <Avatar className="h-7 w-7">
                  <AvatarImage src={survivor.deck.deckImage || survivor.player.profileImage} />
                  <AvatarFallback className="text-[10px]">
                    {survivor.player.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <span className="min-w-0 flex-1 truncate text-sm">
                  {getDisplayName(survivor.player)}
                </span>

                {rank === 0 && <Trophy className="h-4 w-4 shrink-0 text-warning" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
          <Button
            className="flex-1"
            disabled={!isComplete}
            onClick={() => onConfirm(order)}
          >
            {t('currentGame.endGame')}
          </Button>
        </div>
      </div>
    </div>
  );
}
