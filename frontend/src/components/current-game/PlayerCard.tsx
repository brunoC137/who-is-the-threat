'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Skull, Droplet, Swords, Plus, Minus } from 'lucide-react';
import { GamePlayer } from './types';
import { getLifeColor } from './utils';

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  allPlayers: GamePlayer[];
  isSelected: boolean;
  rotation: number;
  onSelect: () => void;
  onLifeChange: (delta: number) => void;
  onPoisonChange: (delta: number) => void;
  onCommanderDamageChange: (fromId: string, delta: number) => void;
  t: (key: string) => string;
}

export function PlayerCard({
  gamePlayer,
  allPlayers,
  isSelected,
  rotation,
  onSelect,
  onLifeChange,
  onPoisonChange,
  onCommanderDamageChange,
  t,
}: PlayerCardProps) {
  const [showCommanderDamage, setShowCommanderDamage] = useState(false);
  const [showPoison, setShowPoison] = useState(false);

  if (gamePlayer.isEliminated) {
    return (
      <EliminatedPlayerCard
        gamePlayer={gamePlayer}
      />
    );
  }

  return (
    <div 
      className={`relative rounded-lg overflow-hidden transition-all duration-300 w-full aspect-[2/1] ${
        gamePlayer.isFirstPlayer ? 'ring-2 ring-yellow-500 shadow-glow-lg' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Background with deck image or color gradient */}
      <PlayerCardBackground deckImage={gamePlayer.deck.deckImage} />

      {/* Rotated Content Wrapper */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <div className="w-full h-full relative flex flex-row items-center p-1 gap-2">
          {/* First Player Crown */}
          {gamePlayer.isFirstPlayer && <FirstPlayerBadge />}

          {/* Landscape Layout */}
          <LifeControls
            life={gamePlayer.life}
            onLifeChange={onLifeChange}
          />

          {/* Player Info */}
          <PlayerInfo
            player={gamePlayer.player}
            deckImage={gamePlayer.deck.deckImage}
          />

          {/* Secondary Stats */}
          <SecondaryStats
            gamePlayer={gamePlayer}
            allPlayers={allPlayers}
            showPoison={showPoison}
            showCommanderDamage={showCommanderDamage}
            onTogglePoison={() => setShowPoison(!showPoison)}
            onToggleCommanderDamage={() => setShowCommanderDamage(!showCommanderDamage)}
            onPoisonChange={onPoisonChange}
            onCommanderDamageChange={onCommanderDamageChange}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

function EliminatedPlayerCard({ gamePlayer }: { gamePlayer: GamePlayer }) {
  return (
    <div className="relative h-full w-full min-h-[200px] rounded-lg bg-card/30 border-2 border-destructive/30 opacity-60 flex items-center justify-center">
      <div className="text-center p-2">
        <Skull className="h-8 w-8 mx-auto text-destructive/40 mb-1" />
        <Avatar className="h-8 w-8 mx-auto mb-1 grayscale">
          <AvatarImage src={gamePlayer.deck.deckImage || gamePlayer.player.profileImage} />
          <AvatarFallback className="text-xs">{gamePlayer.player.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-xs truncate">{gamePlayer.player.nickname || gamePlayer.player.name}</p>
        <Badge variant="destructive" className="mt-1 text-xs">
          #{gamePlayer.placement}
        </Badge>
      </div>
    </div>
  );
}

function PlayerCardBackground({ deckImage }: { deckImage?: string }) {
  return (
    <>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: deckImage ? `url(${deckImage})` : undefined 
        }}
      />
      <div className={`absolute inset-0 ${
        deckImage 
          ? 'bg-black/60 backdrop-blur-sm' 
          : 'bg-gradient-to-br from-card to-muted'
      }`} />
    </>
  );
}

function FirstPlayerBadge() {
  return (
    <div className="absolute top-1 right-1 bg-yellow-500 text-yellow-900 p-0.5 rounded-full z-10">
      <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
    </div>
  );
}

interface LifeControlsProps {
  life: number;
  onLifeChange: (delta: number) => void;
}

function LifeControls({ life, onLifeChange }: LifeControlsProps) {
  return (
    <div className="w-full h-full flex flex-row items-center justify-between p-2 gap-2">
      {/* Left: Minus buttons */}
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLifeChange(-5)}
          className="h-12 w-12 text-lg font-bold bg-red-600/30 hover:bg-red-600/50 border-red-600/50 p-0"
        >
          -5
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLifeChange(-1)}
          className="h-12 w-12 text-lg font-bold bg-red-500/30 hover:bg-red-500/50 border-red-500/50 p-0"
        >
          -1
        </Button>
      </div>

      {/* Center: Life total */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`font-bold text-6xl sm:text-7xl ${getLifeColor(life)} transition-colors select-none`}>
          {life}
        </div>
      </div>

      {/* Right: Plus buttons */}
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLifeChange(1)}
          className="h-12 w-12 text-lg font-bold bg-green-500/30 hover:bg-green-500/50 border-green-500/50 p-0"
        >
          +1
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLifeChange(5)}
          className="h-12 w-12 text-lg font-bold bg-green-600/30 hover:bg-green-600/50 border-green-600/50 p-0"
        >
          +5
        </Button>
      </div>
    </div>
  );
}

interface PlayerInfoProps {
  player: GamePlayer['player'];
  deckImage?: string;
}

function PlayerInfo({ player, deckImage }: PlayerInfoProps) {
  return (
    <div className="absolute top-2 left-2 flex items-center gap-1">
      <Avatar className="h-6 w-6 ring-1 ring-white/20">
        <AvatarImage src={deckImage || player.profileImage} />
        <AvatarFallback className="text-xs bg-primary/20">
          {player.name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-semibold text-white truncate max-w-[100px]">
        {player.nickname || player.name}
      </span>
    </div>
  );
}

interface SecondaryStatsProps {
  gamePlayer: GamePlayer;
  allPlayers: GamePlayer[];
  showPoison: boolean;
  showCommanderDamage: boolean;
  onTogglePoison: () => void;
  onToggleCommanderDamage: () => void;
  onPoisonChange: (delta: number) => void;
  onCommanderDamageChange: (fromId: string, delta: number) => void;
  t: (key: string) => string;
}

function SecondaryStats({
  gamePlayer,
  allPlayers,
  showPoison,
  showCommanderDamage,
  onTogglePoison,
  onToggleCommanderDamage,
  onPoisonChange,
  onCommanderDamageChange,
  t,
}: SecondaryStatsProps) {
  return (
    <>
      <div className="absolute bottom-2 left-2 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePoison}
          className={`h-6 px-1.5 text-xs ${gamePlayer.poison > 0 ? 'bg-green-600/30 border-green-500' : 'bg-background/50'}`}
        >
          <Droplet className="h-3 w-3 text-green-500" />
          <span className={gamePlayer.poison > 0 ? 'text-green-400 font-bold ml-0.5' : 'ml-0.5'}>
            {gamePlayer.poison}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCommanderDamage}
          className="h-6 px-1.5 bg-background/50 text-xs"
        >
          <Swords className="h-3 w-3 text-purple-500" />
        </Button>
      </div>

      {/* Poison Modal */}
      {showPoison && (
        <PoisonModal
          poison={gamePlayer.poison}
          onPoisonChange={onPoisonChange}
          onClose={onTogglePoison}
          t={t}
        />
      )}

      {/* Commander Damage Modal */}
      {showCommanderDamage && (
        <CommanderDamageModal
          gamePlayer={gamePlayer}
          allPlayers={allPlayers}
          onCommanderDamageChange={onCommanderDamageChange}
          onClose={onToggleCommanderDamage}
          t={t}
        />
      )}
    </>
  );
}

interface PoisonModalProps {
  poison: number;
  onPoisonChange: (delta: number) => void;
  onClose: () => void;
  t: (key: string) => string;
}

function PoisonModal({ poison, onPoisonChange, onClose, t }: PoisonModalProps) {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-4 max-w-xs w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm flex items-center gap-1">
            <Droplet className="h-4 w-4 text-green-500" />
            {t('currentGame.poisonCounters')}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPoisonChange(-1)}
            disabled={poison <= 0}
            className="h-10 w-10"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className={`text-4xl font-bold ${poison >= 10 ? 'text-red-500' : 'text-green-500'}`}>
            {poison}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPoisonChange(1)}
            disabled={poison >= 10}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CommanderDamageModalProps {
  gamePlayer: GamePlayer;
  allPlayers: GamePlayer[];
  onCommanderDamageChange: (fromId: string, delta: number) => void;
  onClose: () => void;
  t: (key: string) => string;
}

function CommanderDamageModal({
  gamePlayer,
  allPlayers,
  onCommanderDamageChange,
  onClose,
  t,
}: CommanderDamageModalProps) {
  const opponents = useMemo(() => 
    allPlayers.filter(p => p.id !== gamePlayer.id && !p.isEliminated),
    [allPlayers, gamePlayer.id]
  );

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center p-2">
      <div className="bg-card rounded-lg p-3 max-w-xs w-full max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-sm flex items-center gap-1">
            <Swords className="h-4 w-4 text-purple-500" />
            {t('currentGame.commanderDamage')}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>
        
        <div className="space-y-2">
          {opponents.map(opponent => {
            const damage = gamePlayer.commanderDamage[opponent.id] || 0;
            return (
              <div key={opponent.id} className="flex items-center justify-between gap-2 bg-background/50 p-2 rounded">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={opponent.deck.deckImage || opponent.player.profileImage} />
                    <AvatarFallback className="text-xs">
                      {opponent.player.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{opponent.player.nickname || opponent.player.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCommanderDamageChange(opponent.id, -1)}
                    disabled={damage <= 0}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className={`text-sm font-bold w-8 text-center ${damage >= 21 ? 'text-red-500' : damage >= 15 ? 'text-orange-500' : ''}`}>
                    {damage}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCommanderDamageChange(opponent.id, 1)}
                    disabled={damage >= 21}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
