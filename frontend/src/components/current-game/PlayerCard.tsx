'use client';

import { useEffect, useRef, useState } from 'react';
import { Crown, Droplet, Skull } from 'lucide-react';
import { GamePlayer } from './types';
import { BoardLayout, SeatEdge, SeatRotation, isSideSeat } from './layout';
import { LETHAL_POISON } from './gameReducer';
import { CommanderDamageMap } from './CommanderDamageMap';
import {
  formatLifeDelta,
  formatPlacement,
  getDisplayName,
  getLifeColor,
  getLifeDeltaColor,
  getPoisonColor,
  haptic,
} from './utils';
import { useHoldRepeat } from './hooks';

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  edge: SeatEdge;
  rotation: SeatRotation;
  /**
   * Which edge of the panel (as its reader sees it) carries the name. Top by
   * default; bottom when something floats over the panels' inner edges.
   */
  labelEdge?: 'top' | 'bottom';
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
  labelEdge = 'top',
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

      {/* Identity strip. Lets presses through to the life zones beneath it;
          only the poison chip is a target. Carries its own gradient: 11px text
          cannot rely on a glyph halo the way the large life total can. At the
          bottom it stops short of the commander damage map in that corner. */}
      <div
        className={`pointer-events-none absolute inset-x-0 flex items-center gap-1.5 p-1.5 ${
          labelEdge === 'bottom'
            ? 'cg-panel-label-scrim-bottom bottom-0 pr-[96px] pt-3'
            : 'cg-panel-label-scrim top-0 pb-3'
        }`}
      >
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
        {gamePlayer.poison > 0 && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm"
          >
            <Droplet className="h-3 w-3 text-success" />
            <span className={`text-[11px] font-bold tabular-nums ${getPoisonColor(gamePlayer.poison)}`}>
              {gamePlayer.poison}
            </span>
          </button>
        )}
      </div>

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

/** How long the running change stays up after life last moved. */
const DELTA_SETTLE_MS = 2000;
/** Fade-out before the chip is removed; matches its opacity transition. */
const DELTA_FADE_MS = 200;

/**
 * Net life change over the current burst of changes — "−7" after seven taps,
 * a big hit, or commander damage — so the table can confirm what just
 * happened without doing arithmetic. Resets once life has been still for a
 * moment. Undo counts too: undoing one of those seven taps leaves "−6", the
 * true net, rather than a misleading "+1".
 */
function useRunningDelta(value: number): { delta: number; fading: boolean } {
  // `start` is life at the beginning of the current burst, or null between
  // bursts. It is adjusted during render (React's pattern for state derived
  // from a changing prop), so the chip shows the new net change in the same
  // frame as the new number rather than one render behind it.
  const [burst, setBurst] = useState<{ seen: number; start: number | null }>({
    seen: value,
    start: null,
  });
  const [fading, setFading] = useState(false);
  const previous = useRef(value);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  let start = burst.start;
  if (burst.seen !== value) {
    start = burst.start ?? burst.seen;
    setBurst({ seen: value, start });
  }

  // Every change restarts the settle countdown
  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;

    timers.current.forEach(clearTimeout);
    setFading(false);
    timers.current = [
      setTimeout(() => setFading(true), DELTA_SETTLE_MS),
      setTimeout(() => {
        setBurst(current => ({ ...current, start: null }));
        setFading(false);
      }, DELTA_SETTLE_MS + DELTA_FADE_MS),
    ];
  }, [value]);

  const delta = start === null ? 0 : value - start;

  useEffect(() => {
    const pending = timers;
    return () => pending.current.forEach(clearTimeout);
  }, []);

  return { delta, fading };
}

function LifeTotal({ life, compact }: { life: number; compact: boolean }) {
  const [pulse, setPulse] = useState(false);
  const previous = useRef(life);
  const { delta, fading } = useRunningDelta(life);

  useEffect(() => {
    if (previous.current !== life) {
      previous.current = life;
      setPulse(true);
    }
  }, [life]);

  return (
    // relative: anchors the delta chip above the number without moving it
    <span className="relative inline-flex">
      {delta !== 0 && (
        <span
          // Re-keyed per value so the pop-in replays on every change
          key={delta}
          aria-hidden
          className={`cg-life-delta pointer-events-none absolute bottom-full left-1/2 mb-1.5 whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 font-bold tabular-nums leading-none backdrop-blur-sm transition-opacity duration-200 ${
            compact ? 'text-xs' : 'text-sm'
          } ${getLifeDeltaColor(delta)} ${fading ? 'opacity-0' : 'opacity-100'}`}
        >
          {formatLifeDelta(delta)}
        </span>
      )}

      <span
        onAnimationEnd={() => setPulse(false)}
        className={`cg-life-number font-bold tabular-nums leading-none ${getLifeColor(life)} ${
          pulse ? 'cg-life-pulse' : ''
        } ${compact ? 'text-4xl' : 'text-5xl sm:text-6xl'}`}
      >
        {life}
      </span>
    </span>
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
