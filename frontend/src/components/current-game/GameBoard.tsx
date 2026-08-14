'use client';

import { useMemo } from 'react';
import { PlayerCard } from './PlayerCard';
import { GamePlayer } from './types';
import { Orientation, getBoardLayout, isQuarterTurn } from './layout';

interface GameBoardProps {
  gamePlayers: GamePlayer[];
  orientation: Orientation;
  rollingSeatId: string | null;
  onLifeChange: (seatId: string, delta: number) => void;
  onOpenDetails: (seatId: string) => void;
  t: (key: string) => string;
}

export function GameBoard({
  gamePlayers,
  orientation,
  rollingSeatId,
  onLifeChange,
  onOpenDetails,
  t,
}: GameBoardProps) {
  const layout = useMemo(
    () => getBoardLayout(gamePlayers.length, orientation),
    [gamePlayers.length, orientation]
  );

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
          <div key={gamePlayer.id} className="cg-seat" style={{ gridArea: seat.area }}>
            <div
              className={
                isQuarterTurn(seat.rotation) ? 'cg-seat-content-rotated' : 'cg-seat-content'
              }
              style={{ transform: `translate(-50%, -50%) rotate(${seat.rotation}deg)` }}
            >
              <PlayerCard
                gamePlayer={gamePlayer}
                edge={seat.edge}
                isRolling={rollingSeatId === gamePlayer.id}
                onLifeChange={delta => onLifeChange(gamePlayer.id, delta)}
                onOpenDetails={() => onOpenDetails(gamePlayer.id)}
                t={t}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
