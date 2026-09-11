'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Droplet, Minus, Plus, RotateCcw, Skull, Swords, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GamePlayer } from './types';
import { BoardLayout, SeatRotation, isQuarterTurn, miniMapGrid } from './layout';
import { LETHAL_COMMANDER_DAMAGE, LETHAL_POISON } from './gameReducer';
import { formatPlacement, getDisplayName, haptic } from './utils';
import { useFrame } from './LandscapeFrame';
import { useHoldRepeat } from './hooks';

interface PlayerDetailsSheetProps {
  gamePlayer: GamePlayer;
  /** Every player in seat order, so allPlayers[i] sits at layout.seats[i]. */
  allPlayers: GamePlayer[];
  /** The board's current layout, for the seat picker. */
  layout: BoardLayout;
  /** Rotation of the seat that opened the sheet; the fallback facing. */
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

/** Space the frame keeps around the sheet, each side. */
const FRAME_PADDING = 12;
/** The sheet's own horizontal padding, both sides together. */
const SHEET_PADDING = 24;
/** Widest the sheet gets, so tiles do not sprawl on a large screen (max-w-3xl). */
const MAX_SHEET_WIDTH = 768;
/** Narrowest a tile gets before the tiles wrap onto another row. */
const TILE_MIN_WIDTH = 104;
const TILE_GAP = 8;
/** Below this the header cannot also carry the seat picker. */
const NARROW_SHEET = 560;
/** How long Concede waits for its confirming second tap. */
const CONCEDE_CONFIRM_MS = 3000;

/**
 * Counter number colour: quiet at zero, amber near lethal, red at lethal.
 * Explicit shades rather than the tokens because the dark theme's
 * --destructive is a deep red that does not read as text on the card.
 */
const counterColor = (value: number, lethal: number, warnFrom: number): string => {
  if (value >= lethal) return 'text-red-400';
  if (value >= warnFrom) return 'text-amber-300';
  return value > 0 ? 'text-foreground' : 'text-muted-foreground';
};

/**
 * Rendered at viewport root rather than inside the player's panel: a panel is
 * only a fraction of the screen, and a dialog nested inside a rotated ~150px
 * box is unusable. The sheet takes the whole screen and rotates as a unit, so
 * it still reads correctly for the player who opened it.
 *
 * Every counter is a tile with the same − and + as a life panel, sized so a
 * four-player game never scrolls: one row when the sheet faces a long side,
 * wrapping into rows when it is turned to a short one.
 */
export function PlayerDetailsSheet({
  gamePlayer,
  allPlayers,
  layout,
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
   * Who the sheet faces. It opens facing its own player, the best guess; on
   * a shared device the reader is often someone else, and the seat picker
   * re-aims it at them. Kept as a seat rather than a rotation so the picker
   * can highlight it even when two seats share an edge.
   */
  const [facingSeatId, setFacingSeatId] = useState(gamePlayer.id);
  const facingIndex = allPlayers.findIndex(p => p.id === facingSeatId);
  const viewRotation: SeatRotation = layout.seats[facingIndex]?.rotation ?? rotation;
  const quarterTurned = isQuarterTurn(viewRotation);

  const [damageView, setDamageView] = useState<'received' | 'dealt'>('received');

  // Measured against the game frame, not the window (on an upright phone the
  // frame is itself turned), and a quarter turn swaps the axes again.
  const frame = useFrame();
  const sheetWidth = (quarterTurned ? frame.height : frame.width) - FRAME_PADDING * 2;
  const narrow = sheetWidth < NARROW_SHEET;

  // As many tiles per row as fit, then balanced so no row is left nearly empty
  const tileCount = opponents.length + 1;
  const usable = Math.min(sheetWidth, MAX_SHEET_WIDTH) - SHEET_PADDING;
  const maxColumns = Math.max(1, Math.floor((usable + TILE_GAP) / (TILE_MIN_WIDTH + TILE_GAP)));
  const rows = Math.ceil(tileCount / maxColumns);
  const columns = Math.ceil(tileCount / rows);

  // Concede is final for this game, so it asks for a second tap
  const [confirmingConcede, setConfirmingConcede] = useState(false);
  const concedeTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(concedeTimer.current), []);

  const handleConcede = () => {
    haptic();
    if (confirmingConcede) {
      clearTimeout(concedeTimer.current);
      onConcede();
      return;
    }
    setConfirmingConcede(true);
    concedeTimer.current = setTimeout(() => setConfirmingConcede(false), CONCEDE_CONFIRM_MS);
  };

  const seatPicker = (
    <SeatPicker
      layout={layout}
      players={allPlayers}
      facingSeatId={facingSeatId}
      rotation={viewRotation}
      onFace={seatId => {
        haptic();
        setFacingSeatId(seatId);
      }}
      t={t}
    />
  );

  return (
    // Size container so the rotating frame below can swap its dimensions in
    // cq units, relative to the game frame rather than the viewport.
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm [container-type:size]"
      onClick={onClose}
    >
      {/* A quarter-turned sheet reads along the frame's other axis, so the
          rotating frame swaps its dimensions too. */}
      <div
        className="absolute left-1/2 top-1/2 flex items-center justify-center p-3"
        style={{
          width: quarterTurned ? '100cqh' : '100cqw',
          height: quarterTurned ? '100cqw' : '100cqh',
          transform: `translate(-50%, -50%) rotate(${viewRotation}deg)`,
        }}
      >
        <div
          className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          onClick={event => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-center gap-2 p-3 pb-2">
            <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
              <AvatarImage src={gamePlayer.deck.deckImage || gamePlayer.player.profileImage} />
              <AvatarFallback>{gamePlayer.player.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-tight">{getDisplayName(gamePlayer.player)}</p>
              <p className="truncate text-xs text-muted-foreground">{gamePlayer.deck.commander}</p>
            </div>

            {!narrow && seatPicker}

            {!gamePlayer.isEliminated && (
              <button
                type="button"
                onClick={handleConcede}
                aria-label={t('currentGame.concede')}
                className={`flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors ${
                  confirmingConcede
                    ? 'border-destructive bg-destructive px-3 text-destructive-foreground'
                    : 'w-11 border-destructive/60 text-red-400 hover:bg-destructive/20'
                }`}
              >
                <Skull className="h-4 w-4" />
                {confirmingConcede && t('currentGame.concedeConfirm')}
              </button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={onClose}
              aria-label={t('actions.close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {gamePlayer.isEliminated ? (
            <div className="space-y-3 p-3 pt-1">
              {narrow && <div className="flex justify-end">{seatPicker}</div>}

              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center">
                <Skull className="mx-auto mb-1 h-5 w-5 text-red-400" />
                <p className="text-sm font-semibold">
                  {t('currentGame.finishedIn')} {formatPlacement(gamePlayer.placement)}
                </p>
              </div>

              <Button variant="outline" className="h-11 w-full" onClick={onRevive}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('currentGame.undoElimination')}
              </Button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-2.5 px-3 pb-3">
              <div className="flex items-center justify-between gap-2">
                {/* Taken is the canonical view — players think in "I've taken
                    14 from Atraxa". Dealt lets the attacker record a hit from
                    their own sheet, which already faces them. */}
                <div
                  role="group"
                  aria-label={t('currentGame.commanderDamage')}
                  className="flex items-center gap-2"
                >
                  <Swords className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div className="flex rounded-lg bg-background/60 p-0.5">
                    {(['received', 'dealt'] as const).map(view => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setDamageView(view)}
                        aria-pressed={damageView === view}
                        className={`h-11 min-w-[88px] rounded-md px-3 text-sm font-medium transition-colors ${
                          damageView === view ? 'bg-accent/25 text-accent' : 'text-muted-foreground'
                        }`}
                      >
                        {t(view === 'received' ? 'currentGame.damageReceived' : 'currentGame.damageDealt')}
                      </button>
                    ))}
                  </div>
                </div>

                {narrow && seatPicker}
              </div>

              <div
                className="grid"
                style={{
                  gap: TILE_GAP,
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                <CounterTile
                  label={t('currentGame.poison')}
                  icon={<Droplet className="h-3.5 w-3.5 shrink-0 text-success" />}
                  value={gamePlayer.poison}
                  lethal={LETHAL_POISON}
                  warnFrom={LETHAL_POISON - 3}
                  onChange={onPoisonChange}
                  decreaseLabel={t('currentGame.decreasePoison')}
                  increaseLabel={t('currentGame.increasePoison')}
                />

                {opponents.map(opponent => {
                  const received = damageView === 'received';
                  const damage = received
                    ? gamePlayer.commanderDamage[opponent.id] || 0
                    : opponent.commanderDamage[gamePlayer.id] || 0;

                  return (
                    <CounterTile
                      key={opponent.id}
                      label={getDisplayName(opponent.player)}
                      icon={
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage src={opponent.deck.deckImage || opponent.player.profileImage} />
                          <AvatarFallback className="text-[9px]">
                            {opponent.player.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      }
                      value={damage}
                      lethal={LETHAL_COMMANDER_DAMAGE}
                      warnFrom={LETHAL_COMMANDER_DAMAGE - 6}
                      dim={opponent.isEliminated}
                      // Only the dealt direction writes to the opponent, and
                      // the reducer ignores changes to an eliminated player.
                      // Taken stays editable: a player who is now out may
                      // still have dealt damage earlier that needs correcting.
                      locked={!received && opponent.isEliminated}
                      onChange={delta =>
                        received
                          ? onCommanderDamageChange(opponent.id, delta)
                          : onDealCommanderDamage(opponent.id, delta)
                      }
                      decreaseLabel={t('currentGame.decreaseCommanderDamage')}
                      increaseLabel={t('currentGame.increaseCommanderDamage')}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CounterTile({
  label,
  icon,
  value,
  lethal,
  warnFrom,
  dim = false,
  locked = false,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  icon: ReactNode;
  value: number;
  lethal: number;
  warnFrom: number;
  dim?: boolean;
  locked?: boolean;
  onChange: (delta: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 rounded-xl border border-border/70 bg-background/60 p-2 ${
        dim ? 'opacity-50' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
        {icon}
        <span className="truncate">{label}</span>
      </div>

      <div
        className={`text-center text-4xl font-bold tabular-nums leading-none ${counterColor(value, lethal, warnFrom)}`}
      >
        {value}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <CounterButton
          ariaLabel={`${decreaseLabel}: ${label}`}
          disabled={value <= 0 || locked}
          onClick={() => onChange(-1)}
        >
          <Minus className="h-4 w-4" />
        </CounterButton>
        <CounterButton
          ariaLabel={`${increaseLabel}: ${label}`}
          disabled={value >= lethal || locked}
          onClick={() => onChange(1)}
        >
          <Plus className="h-4 w-4" />
        </CounterButton>
      </div>
    </div>
  );
}

/** Picker size in frame pixels, before any rotation. */
const PICKER_WIDTH = 84;
const PICKER_HEIGHT = 50;

/**
 * "Face…": a miniature of the board. Tapping a seat turns the sheet to face
 * whoever sits there — the reader picks themselves, not a direction.
 *
 * Like the panels' commander damage map, it is turned back by the sheet's own
 * rotation so it stays lined up with the real board: the seat you tap is
 * where that person actually sits, and it stays put as the sheet turns.
 */
function SeatPicker({
  layout,
  players,
  facingSeatId,
  rotation,
  onFace,
  t,
}: {
  layout: BoardLayout;
  players: GamePlayer[];
  facingSeatId: string;
  rotation: SeatRotation;
  onFace: (seatId: string) => void;
  t: (key: string) => string;
}) {
  const quarterTurned = isQuarterTurn(rotation);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('currentGame.faceLabel')}
      </span>

      {/* Footprint in the sheet's own coordinates: a quarter turn swaps the axes */}
      <div
        className="relative shrink-0"
        style={{
          width: quarterTurned ? PICKER_HEIGHT : PICKER_WIDTH,
          height: quarterTurned ? PICKER_WIDTH : PICKER_HEIGHT,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 grid gap-[3px] rounded-lg border border-border bg-background/70 p-[3px]"
          style={{
            width: PICKER_WIDTH,
            height: PICKER_HEIGHT,
            ...miniMapGrid(layout),
            transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
          }}
        >
          {players.map((player, index) => {
            const seat = layout.seats[index];
            if (!seat) return null;
            const facing = player.id === facingSeatId;

            return (
              <button
                key={player.id}
                type="button"
                style={{ gridArea: seat.area }}
                onClick={() => onFace(player.id)}
                aria-pressed={facing}
                aria-label={`${t('currentGame.faceSeat')} ${getDisplayName(player.player)}`}
                className={`min-h-0 min-w-0 rounded transition-colors ${
                  facing ? 'bg-primary shadow-glow-sm' : 'bg-muted hover:bg-muted-foreground/40'
                }`}
              />
            );
          })}
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
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  // Hold to repeat, so correcting a big commander hit is one press, not ten
  const holdHandlers = useHoldRepeat(() => {
    haptic();
    onClick();
  });

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={ariaLabel}
      disabled={disabled}
      className="h-11 w-full min-w-0"
      {...holdHandlers}
    >
      {children}
    </Button>
  );
}
