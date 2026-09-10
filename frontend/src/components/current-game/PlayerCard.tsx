'use client';

import { useEffect, useRef, useState } from 'react';
import { Crown, Droplet, Skull } from 'lucide-react';
import { GamePlayer } from './types';
import { BoardLayout, SeatEdge, SeatRotation, isSideSeat } from './layout';
import { LETHAL_POISON } from './gameReducer';
import { CommanderDamageMap } from './CommanderDamageMap';
import {
  formatPlacement,
  getDisplayName,
  getLifeColor,
  getPoisonColor,
  haptic,
} from './utils';
import { useHoldRepeat } from './hooks';

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  edge: SeatEdge;
  rotation: SeatRotation;
  /** Board layout and every player in seat order, for the commander damage map. */
  layout: BoardLayout;
  players: GamePlayer[];
  isRolling: boolean;
  onLifeChange: (delta: number) => void;
  onOpenDetails: () => void;
  /** One point of commander damage taken from the given seat. */
  onCommanderDamage: (fromSeatId: string) => void;
  t: (key: string) => string;
}

export function PlayerCard(props: PlayerCardProps) {
  const { gamePlayer, onOpenDetails, t } = props;

  if (gamePlayer.isEliminated) {
    return <EliminatedPanel gamePlayer={gamePlayer} onOpenDetails={onOpenDetails} t={t} />;
  }

  return <LivePanel {...props} />;
}

function LivePanel({
  gamePlayer,
  edge,
  rotation,
  layout,
  players,
  isRolling,
  onLifeChange,
  onOpenDetails,
  onCommanderDamage,
  t,
}: PlayerCardProps) {
  const compact = isSideSeat(edge);
  const inDanger = gamePlayer.life <= 5 || gamePlayer.poison >= LETHAL_POISON - 2;

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl border transition-shadow duration-300 ${
        gamePlayer.isFirstPlayer
          ? 'border-warning/70 shadow-glow-md'
          : 'border-border/60'
      } ${isRolling ? 'animate-pulse' : ''}`}
    >
      <PanelBackground deck={gamePlayer.deck} />

      {inDanger && <div className="cg-danger pointer-events-none absolute inset-0 rounded-xl" />}

      {/* Tap zones: the whole panel is the control surface. Left half removes
          life, right half adds, and the centre column opens the detail sheet.
          Nothing here is a small target. */}
      <div className="absolute inset-0 flex">
        <LifeTapZone
          label="−"
          delta={-1}
          onLifeChange={onLifeChange}
          ariaLabel={t('currentGame.decreaseLife')}
        />

        <button
          type="button"
          onClick={onOpenDetails}
          aria-label={t('currentGame.openDetails')}
          className="relative flex h-full flex-[1.15] flex-col items-center justify-center gap-0.5 px-1"
        >
          <LifeTotal life={gamePlayer.life} compact={compact} />
        </button>

        <LifeTapZone
          label="+"
          delta={1}
          onLifeChange={onLifeChange}
          ariaLabel={t('currentGame.increaseLife')}
        />
      </div>

      {/* Identity strip. Kept out of the tap zones so it never eats a press.
          Carries its own gradient: 11px text cannot rely on a glyph halo the
          way the large life total can. */}
      <div className="cg-panel-label-scrim pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 p-1.5 pb-3">
        {gamePlayer.isFirstPlayer && (
          <Crown className="h-3.5 w-3.5 shrink-0 text-warning drop-shadow" />
        )}
        <span className="truncate text-[11px] font-semibold leading-none text-white drop-shadow-md">
          {getDisplayName(gamePlayer.player)}
        </span>
        {!compact && (
          <span className="truncate text-[10px] leading-none text-white/60">
            {gamePlayer.deck.commander}
          </span>
        )}
      </div>

      <PoisonBadge gamePlayer={gamePlayer} onOpenDetails={onOpenDetails} />

      {/* Commander damage is recorded right here, in one tap per point, rather
          than through the detail sheet. Sits in the + corner, clear of the
          life total and the identity strip. */}
      <div className="absolute bottom-1.5 right-1.5">
        <CommanderDamageMap
          self={gamePlayer}
          players={players}
          layout={layout}
          rotation={rotation}
          onDamage={onCommanderDamage}
          t={t}
        />
      </div>
    </div>
  );
}

interface LifeTapZoneProps {
  label: string;
  delta: number;
  onLifeChange: (delta: number) => void;
  ariaLabel: string;
}

function LifeTapZone({ label, delta, onLifeChange, ariaLabel }: LifeTapZoneProps) {
  const holdHandlers = useHoldRepeat(() => {
    haptic();
    onLifeChange(delta);
  });

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="group flex h-full flex-1 items-center justify-center text-white/25 transition-colors active:bg-white/10 active:text-white/70"
      {...holdHandlers}
    >
      <span className="text-2xl font-light leading-none">{label}</span>
    </button>
  );
}

function LifeTotal({ life, compact }: { life: number; compact: boolean }) {
  const [pulse, setPulse] = useState(false);
  const previous = useRef(life);

  useEffect(() => {
    if (previous.current !== life) {
      previous.current = life;
      setPulse(true);
    }
  }, [life]);

  return (
    <span
      onAnimationEnd={() => setPulse(false)}
      className={`cg-life-number font-bold tabular-nums leading-none ${getLifeColor(life)} ${
        pulse ? 'cg-life-pulse' : ''
      } ${compact ? 'text-4xl' : 'text-5xl sm:text-6xl'}`}
    >
      {life}
    </span>
  );
}

/** Only shown once poison is actually in play, so a clean board stays clean. */
function PoisonBadge({
  gamePlayer,
  onOpenDetails,
}: {
  gamePlayer: GamePlayer;
  onOpenDetails: () => void;
}) {
  if (gamePlayer.poison <= 0) return null;

  return (
    // The strip itself lets presses through to the life zones beneath it;
    // only the badge is a target.
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center p-1">
      <button
        type="button"
        onClick={onOpenDetails}
        className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm"
      >
        <Droplet className="h-3 w-3 text-success" />
        <span className={`text-[11px] font-bold tabular-nums ${getPoisonColor(gamePlayer.poison)}`}>
          {gamePlayer.poison}
        </span>
      </button>
    </div>
  );
}

export function PanelBackground({ deck }: { deck: GamePlayer['deck'] }) {
  if (deck.deckImage) {
    return (
      <>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${deck.deckImage})` }}
        />
        {/* No blur: the art stays sharp and the radial vignette buys contrast
            only where the life total actually sits. See .cg-panel-focus. */}
        <div className="cg-panel-focus absolute inset-0" />
      </>
    );
  }

  return <div className="absolute inset-0 bg-gradient-to-br from-card to-secondary" />;
}

function EliminatedPanel({
  gamePlayer,
  onOpenDetails,
  t,
}: {
  gamePlayer: GamePlayer;
  onOpenDetails: () => void;
  t: (key: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={onOpenDetails}
      aria-label={t('currentGame.openDetails')}
      className="relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-destructive/30 bg-card/40 grayscale"
    >
      <Skull className="h-6 w-6 text-destructive/60" />
      <span className="max-w-full truncate px-2 text-[11px] font-semibold text-muted-foreground">
        {getDisplayName(gamePlayer.player)}
      </span>
      <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[11px] font-bold text-destructive">
        {formatPlacement(gamePlayer.placement)}
      </span>
    </button>
  );
}
