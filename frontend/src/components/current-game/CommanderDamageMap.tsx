'use client';

import { GamePlayer } from './types';
import { BoardLayout, SeatRotation, isQuarterTurn, miniMapGrid } from './layout';
import { LETHAL_COMMANDER_DAMAGE } from './gameReducer';
import { getDisplayName, haptic } from './utils';
import { useHoldRepeat } from './hooks';
import { cssUrl } from '@/lib/utils';

interface CommanderDamageMapProps {
  self: GamePlayer;
  /** Every player in seat order, so players[i] sits at layout.seats[i]. */
  players: GamePlayer[];
  layout: BoardLayout;
  /** Rotation of the panel this map sits in. */
  rotation: SeatRotation;
  onDamage: (fromSeatId: string) => void;
  t: (key: string) => string;
}

/** Map size in board (frame) pixels, before any rotation. */
const MAP_WIDTH = 84;
const MAP_HEIGHT = 52;

const damageColor = (damage: number): string => {
  if (damage >= LETHAL_COMMANDER_DAMAGE) return 'text-destructive';
  if (damage >= 15) return 'text-warning';
  return damage > 0 ? 'text-white' : 'text-white/50';
};

/**
 * Commander damage taken, drawn as a miniature of the board: each cell sits
 * where that opponent sits, so the player across from you is the cell across
 * from "me". Tapping a cell records one point from that opponent (the reducer
 * takes it off life in the same action); holding repeats. Corrections go
 * through undo or the detail sheet.
 *
 * The panel is rotated to face its reader, so the map is turned back by the
 * same amount to line up with the real board, and each number is turned
 * forward again so it still reads upright for that player.
 */
export function CommanderDamageMap({
  self,
  players,
  layout,
  rotation,
  onDamage,
  t,
}: CommanderDamageMapProps) {
  const quarterTurned = isQuarterTurn(rotation);

  return (
    // Footprint in the panel's own coordinates: a quarter turn swaps the axes
    <div
      className="relative"
      style={{
        width: quarterTurned ? MAP_HEIGHT : MAP_WIDTH,
        height: quarterTurned ? MAP_WIDTH : MAP_HEIGHT,
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 grid gap-0.5 rounded-lg bg-black/45 p-0.5 backdrop-blur-sm"
        style={{
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          ...miniMapGrid(layout),
          transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
        }}
      >
        {players.map((player, index) => {
          const seat = layout.seats[index];
          if (!seat) return null;

          if (player.id === self.id) {
            return (
              <div
                key={player.id}
                style={{ gridArea: seat.area }}
                className="flex min-h-0 min-w-0 items-center justify-center rounded bg-primary/30"
              >
                <span
                  className="text-[9px] font-semibold uppercase leading-none text-white/80"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {t('currentGame.you')}
                </span>
              </div>
            );
          }

          const damage = self.commanderDamage[player.id] || 0;

          return (
            <DamageCell
              key={player.id}
              area={seat.area}
              rotation={rotation}
              damage={damage}
              // The attacker's deck art, the same art as their panel, so the
              // cell reads as a colour reminder of who it stands for; their
              // profile picture when the deck has none.
              image={player.deck?.deckImage || player.player.profileImage}
              // A player who has left the game takes their commander with them
              disabled={player.isEliminated}
              ariaLabel={`${t('currentGame.commanderDamageFrom')} ${getDisplayName(player.player)}: ${damage}`}
              onFire={() => onDamage(player.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DamageCell({
  area,
  rotation,
  damage,
  image,
  disabled,
  ariaLabel,
  onFire,
}: {
  area: string;
  rotation: SeatRotation;
  damage: number;
  /** Background art; the plain cell is used when absent. */
  image?: string;
  disabled: boolean;
  ariaLabel: string;
  onFire: () => void;
}) {
  const holdHandlers = useHoldRepeat(() => {
    haptic();
    onFire();
  });

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        gridArea: area,
        backgroundImage: image ? cssUrl(image) : undefined,
      }}
      className="group relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded bg-white/15 bg-cover bg-center disabled:opacity-40 disabled:grayscale"
      {...holdHandlers}
    >
      {/* The art is only a colour reminder; the scrim keeps the number
          readable over any artwork, and lifts while the cell is pressed. */}
      {image && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black/55 transition-colors group-active:bg-black/20"
        />
      )}
      <span
        className={`relative text-[11px] font-bold tabular-nums leading-none ${damageColor(damage)} ${
          image ? '' : 'group-active:opacity-70'
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          textShadow: '0 0 3px rgba(0, 0, 0, 0.95), 0 1px 2px rgba(0, 0, 0, 0.9)',
        }}
      >
        {damage}
      </span>
    </button>
  );
}
