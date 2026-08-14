'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Droplet,
  Minus,
  Plus,
  RotateCcw,
  Skull,
  Swords,
  X,
} from 'lucide-react';
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
import { useViewportSize } from './hooks';

interface PlayerDetailsSheetProps {
  gamePlayer: GamePlayer;
  allPlayers: GamePlayer[];
  /** Rotation of the seat that opened the sheet, so it faces that player. */
  rotation: SeatRotation;
  onPoisonChange: (delta: number) => void;
  /** Damage this player received, from the given opponent. */
  onCommanderDamageChange: (fromSeatId: string, delta: number) => void;
  /** Damage this player's commander dealt to the given opponent. */
  onDealCommanderDamage: (toSeatId: string, delta: number) => void;
  onConcede: () => void;
  onRevive: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

/**
 * Which edge of the screen a reader is sitting at, and the turn that faces
 * them. Same convention as the board: the rotation is set by the direction
 * pointing AWAY from that seat, so a reader on the left needs 90deg, not 270.
 * See layout.ts.
 */
const EDGE_ROTATIONS: Array<{
  rotation: SeatRotation;
  position: string;
  Icon: typeof ChevronUp;
  label: string;
}> = [
  { rotation: 180, position: 'left-1/2 top-1 -translate-x-1/2', Icon: ChevronUp, label: 'top' },
  { rotation: 0, position: 'left-1/2 bottom-1 -translate-x-1/2', Icon: ChevronDown, label: 'bottom' },
  { rotation: 90, position: 'left-1 top-1/2 -translate-y-1/2', Icon: ChevronLeft, label: 'left' },
  { rotation: 270, position: 'right-1 top-1/2 -translate-y-1/2', Icon: ChevronRight, label: 'right' },
];

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
  onDealCommanderDamage,
  onConcede,
  onRevive,
  onClose,
  t,
}: PlayerDetailsSheetProps) {
  const opponents = allPlayers.filter(p => p.id !== gamePlayer.id);

  /**
   * The sheet opens facing the seat it belongs to, but on a shared device the
   * person reaching for it is often someone else. The edge tabs re-aim it in
   * one tap. Reset on every open, since the panel's owner is the best guess.
   */
  const [viewRotation, setViewRotation] = useState<SeatRotation>(rotation);
  const [damageView, setDamageView] = useState<'received' | 'dealt'>('received');

  const quarterTurned = viewRotation === 90 || viewRotation === 270;
  const viewport = useViewportSize();

  // The frame is what the sheet actually lives in, and a quarter turn swaps
  // its axes. Two columns only pay off when that frame is wide and short —
  // i.e. an upright seat on a landscape phone.
  const frameWidth = quarterTurned ? viewport.height : viewport.width;
  const frameHeight = quarterTurned ? viewport.width : viewport.height;
  const compact = frameHeight < 430 && frameWidth >= 620;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      {/* Edge tabs live outside the rotating frame and stay pinned to the
          screen, so "the tab nearest me" means the same thing no matter which
          way the sheet is currently facing. */}
      {EDGE_ROTATIONS.map(({ rotation: edgeRotation, position, Icon, label }) => {
        const active = viewRotation === edgeRotation;

        return (
          <button
            key={label}
            type="button"
            aria-label={t('currentGame.faceThisSide')}
            aria-pressed={active}
            onClick={event => {
              event.stopPropagation();
              haptic();
              setViewRotation(edgeRotation);
            }}
            className={`cg-edge-tab absolute z-[55] flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${position} ${
              active
                ? 'border-primary/80 bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}

      {/* A quarter-turned sheet reads along the viewport's other axis, so the
          rotating frame swaps its dimensions too. Without this, max-width is
          measured against the short edge and the sheet clips. */}
      <div
        // px leaves room for the left/right edge tabs to sit clear of the sheet
        className="absolute left-1/2 top-1/2 flex items-center justify-center px-12 py-3"
        style={{
          width: quarterTurned ? '100dvh' : '100dvw',
          height: quarterTurned ? '100dvw' : '100dvh',
          transform: `translate(-50%, -50%) rotate(${viewRotation}deg)`,
        }}
      >
        <div
          className={`flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${
            compact ? 'max-w-2xl' : 'max-w-md'
          }`}
          onClick={event => event.stopPropagation()}
        >
        <header className="flex shrink-0 items-center gap-3 p-3 pb-2">
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
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 pt-1">
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
          <>
          <div
            className={`min-h-0 flex-1 overflow-y-auto px-3 pb-2 ${
              compact ? 'grid grid-cols-2 items-start gap-4' : 'space-y-4'
            }`}
          >
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

              {/* Received is the canonical view — players think in "I've taken
                  14 from Atraxa". Dealt exists so the attacker can record a hit
                  from their own panel, which already faces them. */}
              <div className="mb-2 flex rounded-lg bg-background/60 p-0.5">
                {(['received', 'dealt'] as const).map(view => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setDamageView(view)}
                    aria-pressed={damageView === view}
                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      damageView === view
                        ? 'bg-accent/25 text-accent'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {t(view === 'received' ? 'currentGame.damageReceived' : 'currentGame.damageDealt')}
                  </button>
                ))}
              </div>

              <p className="mb-2 text-xs text-muted-foreground">
                {t(
                  damageView === 'received'
                    ? 'currentGame.commanderDamageHint'
                    : 'currentGame.commanderDamageDealtHint'
                )}
              </p>

              <div className="space-y-1.5">
                {opponents.map(opponent => {
                  const damage =
                    damageView === 'received'
                      ? gamePlayer.commanderDamage[opponent.id] || 0
                      : opponent.commanderDamage[gamePlayer.id] || 0;

                  const applyDelta = (delta: number) =>
                    damageView === 'received'
                      ? onCommanderDamageChange(opponent.id, delta)
                      : onDealCommanderDamage(opponent.id, delta);

                  // Only the dealt direction writes to the opponent, and the
                  // reducer ignores changes to an eliminated player. Received
                  // stays editable: a player who is now dead may still have
                  // dealt damage earlier that needs correcting.
                  const locked = damageView === 'dealt' && opponent.isEliminated;

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
                        disabled={damage <= 0 || locked}
                        onClick={() => applyDelta(-1)}
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
                        disabled={damage >= LETHAL_COMMANDER_DAMAGE || locked}
                        onClick={() => applyDelta(1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </CounterButton>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          {/* Pinned so conceding never sits below the fold on a short viewport */}
          <div className="shrink-0 border-t border-border/60 p-3">
            <Button variant="outline" className="w-full border-destructive/40 text-destructive" onClick={onConcede}>
              <Skull className="mr-2 h-4 w-4" />
              {t('currentGame.concede')}
            </Button>
          </div>
          </>
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
