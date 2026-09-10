'use client';

import { Move } from 'lucide-react';
import { GamePlayer } from './types';
import { SeatEdge, isSideSeat } from './layout';
import { PanelBackground } from './PlayerCard';
import { getDisplayName } from './utils';

interface ArrangeSeatPanelProps {
  gamePlayer: GamePlayer;
  edge: SeatEdge;
  isSelected: boolean;
  isDragSource: boolean;
  isDropTarget: boolean;
  t: (key: string) => string;
}

/**
 * A seat while the table is being arranged. Life controls are gone so a drag
 * can never register as a life change, and the name is the headline: it is
 * rotated to face this seat, so each player can confirm at a glance that the
 * name facing them is their own.
 *
 * Presses are handled by GameBoard on the unrotated seat cell; this button
 * exists for focus and keyboard activation.
 */
export function ArrangeSeatPanel({
  gamePlayer,
  edge,
  isSelected,
  isDragSource,
  isDropTarget,
  t,
}: ArrangeSeatPanelProps) {
  const compact = isSideSeat(edge);
  const name = getDisplayName(gamePlayer.player);

  const frame = isDropTarget
    ? 'border-solid border-warning shadow-glow-md'
    : isSelected
      ? 'border-solid border-primary shadow-glow-md'
      : 'border-dashed border-primary/50';

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`${t('currentGame.moveSeat')}: ${name}`}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 transition-[opacity,border-color,box-shadow] duration-150 ${frame} ${
        isDragSource ? 'opacity-40' : ''
      } ${gamePlayer.isEliminated ? 'grayscale' : ''}`}
    >
      <PanelBackground deck={gamePlayer.deck} />

      {(isSelected || isDropTarget) && (
        <div
          className={`absolute inset-0 ${isDropTarget ? 'bg-warning/15' : 'bg-primary/15'}`}
        />
      )}

      <div className="relative flex max-w-full flex-col items-center gap-1 px-3 text-center">
        <Move className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-white/80 drop-shadow`} />
        <span
          className={`max-w-full truncate font-bold leading-tight text-white drop-shadow-md ${
            compact ? 'text-base' : 'text-xl'
          }`}
        >
          {name}
        </span>
        {gamePlayer.deck?.commander && (
          <span className="max-w-full truncate text-xs text-white/70 drop-shadow">
            {gamePlayer.deck.commander}
          </span>
        )}
      </div>
    </button>
  );
}
