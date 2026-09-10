'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlayerCard } from './PlayerCard';
import { ArrangeSeatPanel } from './ArrangeSeatPanel';
import { GamePlayer } from './types';
import { Orientation, getBoardLayout, isQuarterTurn } from './layout';
import { getDisplayName, haptic } from './utils';

interface GameBoardProps {
  gamePlayers: GamePlayer[];
  orientation: Orientation;
  rollingSeatId: string | null;
  /** Seat arrangement mode: panels become draggable and life is locked. */
  arranging: boolean;
  onLifeChange: (seatId: string, delta: number) => void;
  onOpenDetails: (seatId: string) => void;
  onSwapSeats: (seatA: string, seatB: string) => void;
  t: (key: string) => string;
}

/** Movement (px) before a press on a seat turns into a drag instead of a tap. */
const DRAG_THRESHOLD = 8;

interface Press {
  seatId: string;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
}

interface DragState {
  seatId: string;
  x: number;
  y: number;
  overSeatId: string | null;
}

/**
 * Hit-testing goes through the DOM rather than seat rectangles because the
 * panels are rotated; the grid cells carrying data-seat-id are not, so this
 * resolves correctly no matter which way a panel faces.
 */
const seatIdAt = (x: number, y: number): string | null =>
  document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-seat-id]')?.dataset.seatId ??
  null;

export function GameBoard({
  gamePlayers,
  orientation,
  rollingSeatId,
  arranging,
  onLifeChange,
  onOpenDetails,
  onSwapSeats,
  t,
}: GameBoardProps) {
  const layout = useMemo(
    () => getBoardLayout(gamePlayers.length, orientation),
    [gamePlayers.length, orientation]
  );

  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const press = useRef<Press | null>(null);
  // Set once a press is resolved in onPointerUp, so the click that follows
  // it is not counted a second time. Clicks without it are keyboard presses.
  const pointerHandled = useRef(false);

  useEffect(() => {
    if (arranging) return;
    press.current = null;
    setSelectedSeatId(null);
    setDrag(null);
  }, [arranging]);

  /** Tap one player, then another, to swap them. Tapping the same one again cancels. */
  const selectOrSwap = (seatId: string) => {
    haptic();
    if (!selectedSeatId) {
      setSelectedSeatId(seatId);
      return;
    }
    if (selectedSeatId !== seatId) onSwapSeats(selectedSeatId, seatId);
    setSelectedSeatId(null);
  };

  const arrangeHandlers = (seatId: string) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      // A second finger landing mid-drag must not hijack it
      if (event.button !== 0 || press.current?.active) return;

      pointerHandled.current = false;
      try {
        // Keeps move/up events coming here even once the finger is over
        // another seat, which is the whole point of a drag.
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Without capture a drag ending elsewhere is lost, but taps still work.
      }

      press.current = {
        seatId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
      };
    },
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;

      if (!current.active) {
        const distance = Math.hypot(
          event.clientX - current.startX,
          event.clientY - current.startY
        );
        if (distance < DRAG_THRESHOLD) return;

        current.active = true;
        setSelectedSeatId(null);
        haptic();
      }

      const overSeatId = seatIdAt(event.clientX, event.clientY);
      setDrag({
        seatId: current.seatId,
        x: event.clientX,
        y: event.clientY,
        overSeatId: overSeatId === current.seatId ? null : overSeatId,
      });
    },
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;

      press.current = null;
      pointerHandled.current = true;

      if (!current.active) {
        selectOrSwap(current.seatId);
        return;
      }

      setDrag(null);
      const targetSeatId = seatIdAt(event.clientX, event.clientY);
      if (targetSeatId && targetSeatId !== current.seatId) {
        haptic();
        onSwapSeats(current.seatId, targetSeatId);
      }
    },
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (press.current?.pointerId !== event.pointerId) return;
      press.current = null;
      setDrag(null);
    },
    onClick: () => {
      if (pointerHandled.current) {
        pointerHandled.current = false;
        return;
      }
      selectOrSwap(seatId);
    },
  });

  const draggedPlayer = drag ? gamePlayers.find(p => p.id === drag.seatId) : undefined;

  return (
    <div
      className="cg-board grid h-full w-full gap-1.5 p-1.5"
      style={{
        gridTemplateAreas: layout.gridTemplateAreas,
        gridTemplateColumns: layout.gridTemplateColumns,
        gridTemplateRows: layout.gridTemplateRows,
      }}
    >
      {gamePlayers.map((gamePlayer, index) => {
        const seat = layout.seats[index];
        if (!seat) return null;

        return (
          <div
            key={gamePlayer.id}
            data-seat-id={gamePlayer.id}
            // touch-none: the board allows panning (touch-action: manipulation),
            // and a pan claimed by the browser would cancel the drag mid-way.
            className={`cg-seat ${arranging ? 'touch-none' : ''}`}
            style={{ gridArea: seat.area }}
            {...(arranging ? arrangeHandlers(gamePlayer.id) : {})}
          >
            <div
              className={
                isQuarterTurn(seat.rotation) ? 'cg-seat-content-rotated' : 'cg-seat-content'
              }
              style={{ transform: `translate(-50%, -50%) rotate(${seat.rotation}deg)` }}
            >
              {arranging ? (
                <ArrangeSeatPanel
                  gamePlayer={gamePlayer}
                  edge={seat.edge}
                  isSelected={selectedSeatId === gamePlayer.id}
                  isDragSource={drag?.seatId === gamePlayer.id}
                  isDropTarget={drag?.overSeatId === gamePlayer.id}
                  t={t}
                />
              ) : (
                <PlayerCard
                  gamePlayer={gamePlayer}
                  edge={seat.edge}
                  isRolling={rollingSeatId === gamePlayer.id}
                  onLifeChange={delta => onLifeChange(gamePlayer.id, delta)}
                  onOpenDetails={() => onOpenDetails(gamePlayer.id)}
                  t={t}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Follows the pointer, lifted above it so a finger does not cover it.
          pointer-events-none keeps it out of seatIdAt's hit test. */}
      {drag && draggedPlayer && (
        <div
          className="pointer-events-none fixed z-[60] flex items-center gap-2 rounded-full border border-primary bg-card/95 py-1 pl-1 pr-3 shadow-glow-md"
          style={{
            left: drag.x,
            top: drag.y,
            transform: 'translate(-50%, calc(-100% - 20px))',
          }}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={draggedPlayer.deck?.deckImage || draggedPlayer.player.profileImage}
            />
            <AvatarFallback className="text-[10px]">
              {draggedPlayer.player.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="whitespace-nowrap text-sm font-bold">
            {getDisplayName(draggedPlayer.player)}
          </span>
        </div>
      )}
    </div>
  );
}
