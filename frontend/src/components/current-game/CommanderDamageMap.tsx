'use client';

import { GamePlayer } from './types';
import { BoardLayout, SeatRotation, isQuarterTurn } from './layout';
import { LETHAL_COMMANDER_DAMAGE } from './gameReducer';
import { getDisplayName, haptic } from './utils';
import { useHoldRepeat } from './hooks';

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

/**
 * Same areas as the board, but equal tracks: the map shows where people sit,
 * not the board's proportions, and the board's narrow side columns would
 * leave those players a sliver of a touch target.
 */
const equalTracks = (layout: BoardLayout) => {
  const rows = layout.gridTemplateAreas.match(/"[^"]*"/g) ?? [];
  const columns = rows[0]?.replace(/"/g, '').trim().split(/\s+/).length ?? 1;
  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${Math.max(1, rows.length)}, minmax(0, 1fr))`,
  };
};

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
          gridTemplateAreas: layout.gridTemplateAreas,
          ...equalTracks(layout),
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
  disabled,
  ariaLabel,
  onFire,
}: {
  area: string;
  rotation: SeatRotation;
  damage: number;
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
      style={{ gridArea: area }}
      className="flex min-h-0 min-w-0 items-center justify-center rounded bg-white/15 transition-colors active:bg-white/40 disabled:opacity-40"
      {...holdHandlers}
    >
      <span
        className={`text-[11px] font-bold tabular-nums leading-none ${damageColor(damage)}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {damage}
      </span>
    </button>
  );
}
