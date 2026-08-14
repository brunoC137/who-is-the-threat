'use client';

import { useState } from 'react';
import { Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EliminationPrompt, GamePlayer } from './types';
import { getDisplayName } from './utils';

interface EliminationDialogProps {
  prompt: EliminationPrompt;
  players: GamePlayer[];
  onConfirm: (killerSeatId: string | null) => void;
  onDismiss: () => void;
  t: (key: string) => string;
}

const REASON_KEY: Record<EliminationPrompt['reason'], string> = {
  life: 'currentGame.lifeReachedZero',
  poison: 'currentGame.poisonReachedTen',
  commanderDamage: 'currentGame.commanderDamageReached',
};

export function EliminationDialog({
  prompt,
  players,
  onConfirm,
  onDismiss,
  t,
}: EliminationDialogProps) {
  const victim = players.find(p => p.id === prompt.playerId);

  // Commander damage identifies its own killer, so that seat starts selected
  // and confirming is a single tap.
  const [killerId, setKillerId] = useState<string | null>(prompt.suggestedKillerId ?? null);

  if (!victim) return null;

  const candidates = players.filter(p => p.id !== victim.id);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-2xl">
        <header className="mb-3 text-center">
          <Skull className="mx-auto mb-2 h-7 w-7 text-destructive" />
          <h2 className="text-lg font-bold">
            {getDisplayName(victim.player)} {t('currentGame.wasEliminated')}
          </h2>
          <p className="text-xs text-muted-foreground">{t(REASON_KEY[prompt.reason])}</p>
        </header>

        <p className="mb-2 text-sm font-medium">{t('currentGame.whoKilledThem')}</p>

        <div className="mb-3 space-y-1.5">
          {candidates.map(candidate => {
            const selected = killerId === candidate.id;

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setKillerId(selected ? null : candidate.id)}
                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-primary/15'
                    : 'border-border/60 bg-background/60 hover:bg-background'
                }`}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={candidate.deck.deckImage || candidate.player.profileImage} />
                  <AvatarFallback className="text-[10px]">
                    {candidate.player.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <span className="min-w-0 flex-1 truncate text-sm">
                  {getDisplayName(candidate.player)}
                </span>

                {candidate.isEliminated && (
                  <Skull className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <Button variant="destructive" className="w-full" onClick={() => onConfirm(killerId)}>
            {t('currentGame.confirmElimination')}
          </Button>

          {/* Without this, a mis-tapped −5 forces a death that never happened. */}
          <Button variant="ghost" className="w-full" onClick={onDismiss}>
            {t('currentGame.notDeadYet')}
          </Button>
        </div>
      </div>
    </div>
  );
}
