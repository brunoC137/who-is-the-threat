'use client';

import { PlayerCard } from './PlayerCard';
import { GamePlayer } from './types';
import { getPlayerColumn } from './utils';

interface GameGridProps {
  gamePlayers: GamePlayer[];
  playerSeats: { [playerId: string]: number };
  selectedPlayerForStats: string | null;
  onSelectPlayer: (playerId: string | null) => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onPoisonChange: (playerId: string, delta: number) => void;
  onCommanderDamageChange: (playerId: string, fromId: string, delta: number) => void;
  getPlayerRotation: (playerId: string) => number;
  t: (key: string) => string;
}

export function GameGrid({
  gamePlayers,
  playerSeats,
  selectedPlayerForStats,
  onSelectPlayer,
  onLifeChange,
  onPoisonChange,
  onCommanderDamageChange,
  getPlayerRotation,
  t,
}: GameGridProps) {
  const getColumnPlayers = (column: 'left' | 'right') => {
    return gamePlayers.filter(gp => {
      const seatIndex = playerSeats[gp.id] || 0;
      const playerColumn = getPlayerColumn(seatIndex, gamePlayers.length);
      return playerColumn === column;
    });
  };

  const leftPlayers = getColumnPlayers('left');
  const rightPlayers = getColumnPlayers('right');

  return (
    <div className="h-full w-full p-1 grid grid-cols-2 gap-2">
      {/* Left Column */}
      <div className="flex flex-col gap-2 justify-center">
        {leftPlayers.map(gamePlayer => (
          <PlayerCard
            key={gamePlayer.id}
            gamePlayer={gamePlayer}
            allPlayers={gamePlayers}
            isSelected={selectedPlayerForStats === gamePlayer.id}
            rotation={getPlayerRotation(gamePlayer.id)}
            onSelect={() => onSelectPlayer(
              selectedPlayerForStats === gamePlayer.id ? null : gamePlayer.id
            )}
            onLifeChange={(delta) => onLifeChange(gamePlayer.id, delta)}
            onPoisonChange={(delta) => onPoisonChange(gamePlayer.id, delta)}
            onCommanderDamageChange={(fromId, delta) => onCommanderDamageChange(gamePlayer.id, fromId, delta)}
            t={t}
          />
        ))}
      </div>
      
      {/* Right Column */}
      <div className="flex flex-col gap-2 justify-center">
        {rightPlayers.map(gamePlayer => (
          <PlayerCard
            key={gamePlayer.id}
            gamePlayer={gamePlayer}
            allPlayers={gamePlayers}
            isSelected={selectedPlayerForStats === gamePlayer.id}
            rotation={getPlayerRotation(gamePlayer.id)}
            onSelect={() => onSelectPlayer(
              selectedPlayerForStats === gamePlayer.id ? null : gamePlayer.id
            )}
            onLifeChange={(delta) => onLifeChange(gamePlayer.id, delta)}
            onPoisonChange={(delta) => onPoisonChange(gamePlayer.id, delta)}
            onCommanderDamageChange={(fromId, delta) => onCommanderDamageChange(gamePlayer.id, fromId, delta)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
