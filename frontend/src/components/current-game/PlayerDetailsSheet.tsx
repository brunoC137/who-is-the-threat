'use client';

import { Droplet, Minus, Plus, RotateCcw, Skull, Swords, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GamePlayer } from './types';
import { SeatRotation } from './layout';
import { LETHAL_COMMANDER_DAMAGE, LETHAL_POISON } from './gameReducer';
import {
  formatPlacement,
  getCommanderDamageColor,
  getDisplayName,
  getPoisonColor,
  haptic,
} from './utils';

interface PlayerDetailsSheetProps {
  gamePlayer: GamePlayer;
  allPlayers: GamePlayer[];
  /** Rotation of the seat that opened the sheet, so it faces that player. */
  rotation: SeatRotation;
  onPoisonChange: (delta: number) => void;
  onCommanderDamageChange: (fromSeatId: string, delta: number) => void;
  onConcede: () => void;
  onRevive: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

/**
 * Rendered at viewport root rather than inside the player's panel: a panel is
 * only a fraction of the screen, and a dialog nested inside a rotated ~150px
 * box is unusable. The sheet takes the whole screen and rotates as a unit, so
 * it still reads correctly for the player who opened it.
 */
export function PlayerDetailsSheet({
  gamePlayer,
  allPlayers,
  rotation,
  onPoisonChange,
  onCommanderDamageChange,
  onConcede,
  onRevive,
  onClose,
  t,
}: PlayerDetailsSheetProps) {
  const opponents = allPlayers.filter(p => p.id !== gamePlayer.id);

  const quarterTurned = rotation === 90 || rotation === 270;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      {/* A quarter-turned sheet reads along the viewport's other axis, so the
          rotating frame swaps its dimensions too. Without this, max-width is
          measured against the short edge and the sheet clips. */}
      <div
        className="absolute left-1/2 top-1/2 flex items-center justify-center p-3"
        style={{
          width: quarterTurned ? '100dvh' : '100dvw',
          height: quarterTurned ? '100dvw' : '100dvh',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      >
        <div
          className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-2xl"
          onClick={event => event.stopPropagation()}
        >
        <header className="mb-4 flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-1 ring-border">
            <AvatarImage src={gamePlayer.deck.deckImage || gamePlayer.player.profileImage} />
            <AvatarFallback>{gamePlayer.player.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate font-bold leading-tight">
              {getDisplayName(gamePlayer.player)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {gamePlayer.deck.commander}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('actions.close')}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        {gamePlayer.isEliminated ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center">
              <Skull className="mx-auto mb-1 h-5 w-5 text-destructive" />
              <p className="text-sm font-semibold">
                {t('currentGame.finishedIn')} {formatPlacement(gamePlayer.placement)}
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={onRevive}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('currentGame.undoElimination')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Droplet className="h-4 w-4 text-success" />
                {t('currentGame.poisonCounters')}
              </h3>

              <div className="flex items-center justify-center gap-4 rounded-lg bg-background/60 p-2">
                <CounterButton
                  ariaLabel={t('currentGame.decreasePoison')}
                  disabled={gamePlayer.poison <= 0}
                  onClick={() => onPoisonChange(-1)}
                >
                  <Minus className="h-4 w-4" />
                </CounterButton>

                <span
                  className={`w-12 text-center text-3xl font-bold tabular-nums ${getPoisonColor(gamePlayer.poison)}`}
                >
                  {gamePlayer.poison}
                </span>

                <CounterButton
                  ariaLabel={t('currentGame.increasePoison')}
                  disabled={gamePlayer.poison >= LETHAL_POISON}
                  onClick={() => onPoisonChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </CounterButton>
              </div>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Swords className="h-4 w-4 text-accent" />
                {t('currentGame.commanderDamage')}
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">
                {t('currentGame.commanderDamageHint')}
              </p>

              <div className="space-y-1.5">
                {opponents.map(opponent => {
                  const damage = gamePlayer.commanderDamage[opponent.id] || 0;

                  return (
                    <div
                      key={opponent.id}
                      className="flex items-center gap-2 rounded-lg bg-background/60 p-1.5"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage
                          src={opponent.deck.deckImage || opponent.player.profileImage}
                        />
                        <AvatarFallback className="text-[10px]">
                          {opponent.player.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <span className="min-w-0 flex-1 truncate text-sm">
                        {getDisplayName(opponent.player)}
                      </span>

                      <CounterButton
                        ariaLabel={t('currentGame.decreaseCommanderDamage')}
                        disabled={damage <= 0}
                        onClick={() => onCommanderDamageChange(opponent.id, -1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </CounterButton>

                      <span
                        className={`w-8 text-center text-base font-bold tabular-nums ${getCommanderDamageColor(damage)}`}
                      >
                        {damage}
                      </span>

                      <CounterButton
                        ariaLabel={t('currentGame.increaseCommanderDamage')}
                        disabled={damage >= LETHAL_COMMANDER_DAMAGE}
                        onClick={() => onCommanderDamageChange(opponent.id, 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </CounterButton>
                    </div>
                  );
                })}
              </div>
            </section>

            <Button variant="outline" className="w-full border-destructive/40 text-destructive" onClick={onConcede}>
              <Skull className="mr-2 h-4 w-4" />
              {t('currentGame.concede')}
            </Button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CounterButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={ariaLabel}
      disabled={disabled}
      className="h-9 w-9 shrink-0"
      onClick={() => {
        haptic();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}
