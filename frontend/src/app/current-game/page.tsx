'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Minus,
  X,
  Trophy,
  Clock,
  Users,
  Dices,
  Skull,
  Heart,
  Shield,
  Droplet,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronUp,
  ChevronDown,
  Swords
} from 'lucide-react';
import Link from 'next/link';

interface Player {
  _id: string;
  name: string;
  nickname?: string;
  profileImage?: string;
}

interface Deck {
  _id: string;
  name: string;
  commander: string;
  deckImage?: string;
  colorIdentity?: string[];
  owner: {
    _id: string;
    name: string;
    nickname?: string;
  };
}

interface GamePlayer {
  id: string;
  playerId: string;
  deckId: string;
  player: Player;
  deck: Deck;
  life: number;
  poison: number;
  commanderDamage: { [opponentId: string]: number };
  isEliminated: boolean;
  eliminatedBy?: string;
  placement?: number;
  isFirstPlayer?: boolean;
}

interface CommentaryEntry {
  text: string;
  timestamp: number;
}

interface ActionHistoryItem {
  type: 'life' | 'poison' | 'commanderDamage' | 'elimination' | 'undo';
  playerId: string;
  previousValue: number | boolean | { [key: string]: number };
  newValue: number | boolean | { [key: string]: number };
  opponentId?: string;
  timestamp: number;
}

const MTG_COLORS: { [key: string]: string } = {
  'W': 'bg-yellow-100 border-yellow-300',
  'U': 'bg-blue-500 border-blue-600',
  'B': 'bg-gray-800 border-gray-900',
  'R': 'bg-red-500 border-red-600',
  'G': 'bg-green-600 border-green-700',
  'C': 'bg-gray-400 border-gray-500',
};

const getColorGradient = (colors: string[] | undefined): string => {
  if (!colors || colors.length === 0) return 'from-gray-700 to-gray-800';
  
  const colorMap: { [key: string]: string } = {
    'W': '#FFFBD5',
    'U': '#0E68AB',
    'B': '#150B00',
    'R': '#D3202A',
    'G': '#00733E',
    'C': '#CAC5C0',
  };
  
  if (colors.length === 1) {
    return `from-[${colorMap[colors[0]]}] to-[${colorMap[colors[0]]}]`;
  }
  
  return 'from-purple-600 to-blue-600';
};

export default function CurrentGamePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  
  // Setup state
  const [setupPhase, setSetupPhase] = useState(true);
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Player selection state
  const [selectedPlayers, setSelectedPlayers] = useState<{ playerId: string; deckId: string }[]>([]);
  
  // Game state
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [commentary, setCommentary] = useState<CommentaryEntry[]>([]);
  const [commentaryText, setCommentaryText] = useState('');
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  
  // UI state
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<string | null>(null);
  const [rollingForFirst, setRollingForFirst] = useState(false);
  const [eliminationPrompt, setEliminationPrompt] = useState<{ playerId: string; reason: string } | null>(null);
  const [showCommentary, setShowCommentary] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch players and decks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const [playersResponse, decksResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (playersResponse.ok && decksResponse.ok) {
          const playersResult = await playersResponse.json();
          const decksResult = await decksResponse.json();
          setAvailablePlayers(playersResult.data || playersResult);
          setAvailableDecks(decksResult.data || decksResult);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && !gameEnded) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, gameEnded]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerDecks = (playerId: string) => {
    return availableDecks.filter(deck => deck.owner._id === playerId);
  };

  const handlePlayerSelection = (index: number, playerId: string) => {
    const newSelected = [...selectedPlayers];
    newSelected[index] = { ...newSelected[index], playerId, deckId: '' };
    setSelectedPlayers(newSelected);
  };

  const handleDeckSelection = (index: number, deckId: string) => {
    const newSelected = [...selectedPlayers];
    newSelected[index] = { ...newSelected[index], deckId };
    setSelectedPlayers(newSelected);
  };

  // Initialize selected players array when player count changes
  useEffect(() => {
    setSelectedPlayers(Array(playerCount).fill({ playerId: '', deckId: '' }));
  }, [playerCount]);

  const canStartGame = () => {
    return selectedPlayers.length === playerCount && 
           selectedPlayers.every(p => p.playerId && p.deckId);
  };

  const startGame = () => {
    const players: GamePlayer[] = selectedPlayers.map((selected, index) => {
      const player = availablePlayers.find(p => p._id === selected.playerId)!;
      const deck = availableDecks.find(d => d._id === selected.deckId)!;
      
      // Initialize commander damage from all other players
      const commanderDamage: { [key: string]: number } = {};
      selectedPlayers.forEach(other => {
        if (other.playerId !== selected.playerId) {
          commanderDamage[other.playerId] = 0;
        }
      });
      
      return {
        id: `${selected.playerId}-${selected.deckId}-${Date.now()}-${index}`,
        playerId: selected.playerId,
        deckId: selected.deckId,
        player,
        deck,
        life: 40,
        poison: 0,
        commanderDamage,
        isEliminated: false,
      };
    });
    
    setGamePlayers(players);
    setSetupPhase(false);
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  const rollForFirstPlayer = () => {
    if (gamePlayers.length === 0) return;
    
    setRollingForFirst(true);
    
    // Animate through players
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * gamePlayers.length);
      setGamePlayers(prev => prev.map((p, i) => ({
        ...p,
        isFirstPlayer: i === randomIndex
      })));
      
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setRollingForFirst(false);
      }
    }, 100);
  };

  const addToHistory = (action: ActionHistoryItem) => {
    setActionHistory(prev => [...prev, action]);
  };

  const updatePlayerLife = (playerId: string, delta: number) => {
    setGamePlayers(prev => prev.map(p => {
      if (p.id === playerId && !p.isEliminated) {
        const newLife = p.life + delta;
        
        addToHistory({
          type: 'life',
          playerId: p.id,
          previousValue: p.life,
          newValue: newLife,
          timestamp: Date.now()
        });
        
        // Check for elimination by life
        if (newLife <= 0) {
          setEliminationPrompt({ playerId: p.id, reason: 'life' });
        }
        
        return { ...p, life: newLife };
      }
      return p;
    }));
  };

  const updatePlayerPoison = (playerId: string, delta: number) => {
    setGamePlayers(prev => prev.map(p => {
      if (p.id === playerId && !p.isEliminated) {
        const newPoison = Math.max(0, Math.min(10, p.poison + delta));
        
        addToHistory({
          type: 'poison',
          playerId: p.id,
          previousValue: p.poison,
          newValue: newPoison,
          timestamp: Date.now()
        });
        
        // Check for elimination by poison
        if (newPoison >= 10) {
          setEliminationPrompt({ playerId: p.id, reason: 'poison' });
        }
        
        return { ...p, poison: newPoison };
      }
      return p;
    }));
  };

  const updateCommanderDamage = (playerId: string, fromOpponentId: string, delta: number) => {
    setGamePlayers(prev => prev.map(p => {
      if (p.id === playerId && !p.isEliminated) {
        const currentDamage = p.commanderDamage[fromOpponentId] || 0;
        const newDamage = Math.max(0, currentDamage + delta);
        
        addToHistory({
          type: 'commanderDamage',
          playerId: p.id,
          previousValue: { ...p.commanderDamage },
          newValue: { ...p.commanderDamage, [fromOpponentId]: newDamage },
          opponentId: fromOpponentId,
          timestamp: Date.now()
        });
        
        // Check for elimination by commander damage
        if (newDamage >= 21) {
          setEliminationPrompt({ playerId: p.id, reason: 'commanderDamage' });
        }
        
        return { 
          ...p, 
          commanderDamage: { ...p.commanderDamage, [fromOpponentId]: newDamage }
        };
      }
      return p;
    }));
  };

  const confirmElimination = (killerId: string) => {
    if (!eliminationPrompt) return;
    
    const eliminatedCount = gamePlayers.filter(p => p.isEliminated).length;
    const placement = gamePlayers.length - eliminatedCount;
    
    setGamePlayers(prev => prev.map(p => {
      if (p.id === eliminationPrompt.playerId) {
        return { ...p, isEliminated: true, eliminatedBy: killerId, placement };
      }
      return p;
    }));
    
    setEliminationPrompt(null);
    
    // Check if game is over (only 1 player left)
    const aliveCount = gamePlayers.filter(p => !p.isEliminated && p.id !== eliminationPrompt.playerId).length;
    if (aliveCount === 1) {
      // Set the winner
      setGamePlayers(prev => prev.map(p => {
        if (!p.isEliminated && p.id !== eliminationPrompt.playerId) {
          return { ...p, placement: 1 };
        }
        return p;
      }));
      setGameEnded(true);
      setIsTimerRunning(false);
    }
  };

  const undoLastAction = () => {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory[actionHistory.length - 1];
    
    setGamePlayers(prev => prev.map(p => {
      if (p.id === lastAction.playerId) {
        switch (lastAction.type) {
          case 'life':
            return { ...p, life: lastAction.previousValue as number };
          case 'poison':
            return { ...p, poison: lastAction.previousValue as number };
          case 'commanderDamage':
            return { ...p, commanderDamage: lastAction.previousValue as { [key: string]: number } };
          default:
            return p;
        }
      }
      return p;
    }));
    
    setActionHistory(prev => prev.slice(0, -1));
  };

  const addCommentary = () => {
    if (!commentaryText.trim()) return;
    
    const newEntry: CommentaryEntry = {
      text: commentaryText.trim(),
      timestamp: Date.now()
    };
    
    setCommentary(prev => [...prev, newEntry]);
    setCommentaryText('');
  };

  const finalizeGame = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      // Prepare players data with placements
      const playersData = gamePlayers.map(gp => ({
        player: gp.playerId,
        deck: gp.deckId,
        placement: gp.placement || 1,
        eliminatedBy: gp.eliminatedBy ? gamePlayers.find(p => p.id === gp.eliminatedBy)?.playerId : undefined,
      }));

      const gameData = {
        players: playersData,
        durationMinutes: Math.ceil(elapsedTime / 60) || 1,
        notes: notes || undefined,
        commentary: commentary.length > 0 ? commentary.map(c => ({
          text: c.text,
          timestamp: new Date(c.timestamp)
        })) : undefined,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
      });

      if (response.ok) {
        router.push('/games');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || t('currentGame.errorSaving'));
      }
    } catch (error) {
      console.error('Error saving game:', error);
      setErrorMessage(t('currentGame.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleEndGame = () => {
    // Set remaining players placements
    const alivePlayers = gamePlayers.filter(p => !p.isEliminated);
    if (alivePlayers.length > 1) {
      // Multiple players left, they tie for 1st
      setGamePlayers(prev => prev.map(p => {
        if (!p.isEliminated) {
          return { ...p, placement: 1 };
        }
        return p;
      }));
    }
    setGameEnded(true);
    setIsTimerRunning(false);
    setShowEndGameConfirm(false);
  };

  const getPlayerName = (player: Player): string => {
    return player.nickname || player.name;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">{t('auth.signInToContinue')}</p>
          <Link href="/login">
            <Button className="mt-4">{t('auth.login')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Setup Phase
  if (setupPhase) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/games">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t('currentGame.title')}</h1>
            <p className="text-muted-foreground">{t('currentGame.setupDescription')}</p>
          </div>
        </div>

        {/* Player Count Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('currentGame.selectPlayerCount')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 justify-center flex-wrap">
              {[3, 4, 5, 6].map(count => (
                <Button
                  key={count}
                  variant={playerCount === count ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setPlayerCount(count)}
                  className={`w-16 h-16 text-2xl font-bold ${
                    playerCount === count ? 'shadow-glow-sm' : ''
                  }`}
                >
                  {count}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Player Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('currentGame.selectPlayers')}</CardTitle>
            <CardDescription>{t('currentGame.selectPlayersDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(playerCount).fill(null).map((_, index) => {
              const selection = selectedPlayers[index] || { playerId: '', deckId: '' };
              const playerDecks = selection.playerId ? getPlayerDecks(selection.playerId) : [];
              
              return (
                <div key={index} className="p-4 border rounded-lg bg-card/50 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-bold">
                      {t('currentGame.player')} {index + 1}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('currentGame.selectPlayer')}</label>
                      <select
                        value={selection.playerId}
                        onChange={(e) => handlePlayerSelection(index, e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">{t('currentGame.choosePlayers')}</option>
                        {availablePlayers
                          .filter(p => !selectedPlayers.some((s, i) => i !== index && s.playerId === p._id))
                          .map(player => (
                            <option key={player._id} value={player._id}>
                              {player.nickname || player.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('currentGame.selectDeck')}</label>
                      <select
                        value={selection.deckId}
                        onChange={(e) => handleDeckSelection(index, e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        disabled={!selection.playerId}
                      >
                        <option value="">{t('currentGame.chooseDeck')}</option>
                        {playerDecks.map(deck => (
                          <option key={deck._id} value={deck._id}>
                            {deck.name} ({deck.commander})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Start Game Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!canStartGame()}
            onClick={startGame}
            className="w-full max-w-md h-14 text-xl font-bold shadow-glow-md"
          >
            <Play className="h-6 w-6 mr-2" />
            {t('currentGame.startGame')}
          </Button>
        </div>
      </div>
    );
  }

  // Game Phase
  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Fixed at top with controls */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50 px-2 sm:px-4 py-2">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-2">
            <Link href="/games">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-sm sm:text-lg font-mono font-bold">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommentary(!showCommentary)}
              className="h-8 text-xs"
            >
              💬
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              disabled={gameEnded}
              className="h-8 w-8 p-0"
            >
              {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={undoLastAction}
              disabled={actionHistory.length === 0}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Game Area - Landscape Grid */}
      <div className="pt-14 pb-16 h-screen overflow-hidden">
        {/* Roll for First Player Button */}
        {!gamePlayers.some(p => p.isFirstPlayer) && (
          <div className="px-2 py-2">
            <Button
              size="sm"
              onClick={rollForFirstPlayer}
              disabled={rollingForFirst}
              className="w-full h-10 text-sm font-bold animated-gradient text-white"
            >
              <Dices className={`h-4 w-4 mr-2 ${rollingForFirst ? 'animate-spin' : ''}`} />
              {rollingForFirst ? t('currentGame.rolling') : t('currentGame.rollForFirst')}
            </Button>
          </div>
        )}

        {/* Player Grid - Landscape Mode (2x2, 2x3, etc) */}
        <div className={`h-full w-full grid gap-1 p-1 ${
          gamePlayers.length === 3 ? 'grid-cols-3 grid-rows-1' :
          gamePlayers.length === 4 ? 'grid-cols-2 grid-rows-2' :
          gamePlayers.length === 5 ? 'grid-cols-3 grid-rows-2' :
          gamePlayers.length === 6 ? 'grid-cols-3 grid-rows-2' :
          'grid-cols-2 grid-rows-2'
        }`}>
          {gamePlayers.map(gamePlayer => (
            <PlayerCard
              key={gamePlayer.id}
              gamePlayer={gamePlayer}
              allPlayers={gamePlayers}
              isSelected={selectedPlayerForStats === gamePlayer.id}
              onSelect={() => setSelectedPlayerForStats(
                selectedPlayerForStats === gamePlayer.id ? null : gamePlayer.id
              )}
              onLifeChange={(delta) => updatePlayerLife(gamePlayer.id, delta)}
              onPoisonChange={(delta) => updatePlayerPoison(gamePlayer.id, delta)}
              onCommanderDamageChange={(fromId, delta) => updateCommanderDamage(gamePlayer.id, fromId, delta)}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Elimination Prompt Modal */}
      {eliminationPrompt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Skull className="h-5 w-5" />
                {t('currentGame.playerEliminated')}
              </CardTitle>
              <CardDescription>
                {gamePlayers.find(p => p.id === eliminationPrompt.playerId)?.player.nickname || 
                 gamePlayers.find(p => p.id === eliminationPrompt.playerId)?.player.name}
                {' '}{t('currentGame.eliminatedBy')}{' '}
                {eliminationPrompt.reason === 'life' && t('currentGame.lifeReachedZero')}
                {eliminationPrompt.reason === 'poison' && t('currentGame.poisonReachedTen')}
                {eliminationPrompt.reason === 'commanderDamage' && t('currentGame.commanderDamageReached')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 font-medium">{t('currentGame.whoKilledThem')}</p>
              <div className="space-y-2">
                {gamePlayers
                  .filter(p => p.id !== eliminationPrompt.playerId && !p.isEliminated)
                  .map(player => (
                    <Button
                      key={player.id}
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => confirmElimination(player.id)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={player.deck.deckImage || player.player.profileImage} />
                        <AvatarFallback>{player.player.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {player.player.nickname || player.player.name}
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/50 p-2">
        <div className="max-w-full flex gap-2">
          {gameEnded ? (
            <Button
              size="sm"
              onClick={finalizeGame}
              disabled={saving}
              className="w-full h-10 text-sm font-bold shadow-glow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('currentGame.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('currentGame.saveGame')}
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowEndGameConfirm(true)}
              className="w-full h-10 text-sm font-bold"
            >
              <Skull className="h-4 w-4 mr-2" />
              {t('currentGame.endGame')}
            </Button>
          )}
        </div>
      </div>

      {/* Commentary Modal */}
      {showCommentary && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  💬 {t('currentGame.gameCommentary')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCommentary(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 py-2">
              {/* Commentary List */}
              {commentary.length > 0 ? (
                <div className="space-y-2">
                  {commentary.map((entry, index) => (
                    <div key={index} className="p-2 bg-muted rounded-md">
                      <p className="text-sm">{entry.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(Math.floor((entry.timestamp - (Date.now() - elapsedTime * 1000)) / 1000) + elapsedTime)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('currentGame.noCommentary')}
                </p>
              )}
              
              {/* Add Commentary */}
              <div className="space-y-2 pt-2 border-t">
                <textarea
                  value={commentaryText}
                  onChange={(e) => setCommentaryText(e.target.value)}
                  placeholder={t('currentGame.commentaryPlaceholder')}
                  rows={3}
                  className="w-full p-2 text-sm border rounded-md resize-none bg-background"
                  maxLength={500}
                />
                <Button
                  size="sm"
                  onClick={addCommentary}
                  disabled={!commentaryText.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('currentGame.addCommentary')}
                </Button>
              </div>

              {/* Game Notes Section */}
              <div className="pt-3 border-t space-y-2">
                <p className="text-sm font-medium">{t('currentGame.gameNotes')}</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('currentGame.notesPlaceholder')}
                  rows={2}
                  className="w-full p-2 text-sm border rounded-md resize-none bg-background"
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* End Game Confirmation Modal */}
      {showEndGameConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skull className="h-5 w-5" />
                {t('currentGame.endGame')}
              </CardTitle>
              <CardDescription>
                {t('currentGame.confirmEndGame')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEndGameConfirm(false)}
                className="flex-1"
              >
                {t('actions.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndGame}
                className="flex-1"
              >
                {t('currentGame.endGame')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
          <Card className="bg-destructive/90 border-destructive">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-destructive-foreground text-sm">{errorMessage}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setErrorMessage(null)}
                className="text-destructive-foreground hover:bg-destructive/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Player Card Component
interface PlayerCardProps {
  gamePlayer: GamePlayer;
  allPlayers: GamePlayer[];
  isSelected: boolean;
  onSelect: () => void;
  onLifeChange: (delta: number) => void;
  onPoisonChange: (delta: number) => void;
  onCommanderDamageChange: (fromId: string, delta: number) => void;
  t: (key: string) => string;
}

function PlayerCard({
  gamePlayer,
  allPlayers,
  isSelected,
  onSelect,
  onLifeChange,
  onPoisonChange,
  onCommanderDamageChange,
  t
}: PlayerCardProps) {
  const [showCommanderDamage, setShowCommanderDamage] = useState(false);
  const [showPoison, setShowPoison] = useState(false);

  const getLifeColor = (life: number): string => {
    if (life >= 30) return 'text-green-500';
    if (life >= 20) return 'text-yellow-500';
    if (life >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  if (gamePlayer.isEliminated) {
    return (
      <div className="relative p-4 rounded-xl bg-card/30 border-2 border-destructive/30 opacity-60">
        <div className="absolute inset-0 flex items-center justify-center">
          <Skull className="h-16 w-16 text-destructive/40" />
        </div>
        <div className="text-center">
          <Avatar className="h-12 w-12 mx-auto mb-2 grayscale">
            <AvatarImage src={gamePlayer.deck.deckImage || gamePlayer.player.profileImage} />
            <AvatarFallback>{gamePlayer.player.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="font-semibold text-sm">{gamePlayer.player.nickname || gamePlayer.player.name}</p>
          <Badge variant="destructive" className="mt-1">
            #{gamePlayer.placement}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
        gamePlayer.isFirstPlayer ? 'ring-4 ring-yellow-500 shadow-glow-lg' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Background with deck image or color gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: gamePlayer.deck.deckImage 
            ? `url(${gamePlayer.deck.deckImage})` 
            : undefined 
        }}
      />
      <div className={`absolute inset-0 ${
        gamePlayer.deck.deckImage 
          ? 'bg-black/60 backdrop-blur-sm' 
          : 'bg-gradient-to-br from-card to-muted'
      }`} />

      <div className="relative p-4">
        {/* First Player Crown */}
        {gamePlayer.isFirstPlayer && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-yellow-900 p-1 rounded-full">
            <Trophy className="h-4 w-4" />
          </div>
        )}

        {/* Player Info */}
        <div className="flex items-center gap-2 mb-3" onClick={onSelect}>
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage src={gamePlayer.deck.deckImage || gamePlayer.player.profileImage} />
            <AvatarFallback className="text-sm bg-primary/20">
              {gamePlayer.player.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate text-white">
              {gamePlayer.player.nickname || gamePlayer.player.name}
            </p>
            <p className="text-xs text-white/70 truncate">
              {gamePlayer.deck.commander}
            </p>
          </div>
        </div>

        {/* Life Total - Main Control */}
        <div className="text-center mb-3">
          <div className={`text-5xl sm:text-6xl font-bold ${getLifeColor(gamePlayer.life)} transition-colors`}>
            {gamePlayer.life}
          </div>
          <div className="flex justify-center gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLifeChange(-5)}
              className="h-10 w-12 text-lg font-bold bg-red-500/20 hover:bg-red-500/40 border-red-500/50"
            >
              -5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLifeChange(-1)}
              className="h-10 w-10 text-lg font-bold bg-red-500/20 hover:bg-red-500/40 border-red-500/50"
            >
              -1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLifeChange(1)}
              className="h-10 w-10 text-lg font-bold bg-green-500/20 hover:bg-green-500/40 border-green-500/50"
            >
              +1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLifeChange(5)}
              className="h-10 w-12 text-lg font-bold bg-green-500/20 hover:bg-green-500/40 border-green-500/50"
            >
              +5
            </Button>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="flex justify-center gap-2">
          {/* Poison Counter */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPoison(!showPoison)}
            className={`h-8 px-2 gap-1 ${gamePlayer.poison > 0 ? 'bg-green-600/30 border-green-500' : 'bg-background/50'}`}
          >
            <Droplet className="h-4 w-4 text-green-500" />
            <span className={gamePlayer.poison > 0 ? 'text-green-400 font-bold' : ''}>
              {gamePlayer.poison}
            </span>
          </Button>

          {/* Commander Damage */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommanderDamage(!showCommanderDamage)}
            className="h-8 px-2 gap-1 bg-background/50"
          >
            <Swords className="h-4 w-4 text-purple-500" />
            <span className="text-xs">{t('currentGame.cmdDmg')}</span>
          </Button>
        </div>

        {/* Poison Modal */}
        {showPoison && (
          <div className="mt-3 p-3 bg-black/40 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-400 flex items-center gap-1">
                <Droplet className="h-4 w-4" />
                {t('currentGame.poisonCounters')}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowPoison(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPoisonChange(-1)}
                disabled={gamePlayer.poison <= 0}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-3xl font-bold text-green-400 w-12 text-center">
                {gamePlayer.poison}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPoisonChange(1)}
                disabled={gamePlayer.poison >= 10}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Commander Damage Modal */}
        {showCommanderDamage && (
          <div className="mt-3 p-3 bg-black/40 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-400 flex items-center gap-1">
                <Swords className="h-4 w-4" />
                {t('currentGame.commanderDamage')}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowCommanderDamage(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {allPlayers
                .filter(p => p.id !== gamePlayer.id && !p.isEliminated)
                .map(opponent => {
                  const damage = gamePlayer.commanderDamage[opponent.playerId] || 0;
                  return (
                    <div key={opponent.id} className="flex items-center justify-between">
                      <span className="text-xs truncate flex-1 text-white/80">
                        {opponent.player.nickname || opponent.player.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCommanderDamageChange(opponent.playerId, -1)}
                          disabled={damage <= 0}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className={`w-8 text-center font-bold ${damage >= 21 ? 'text-red-500' : damage >= 15 ? 'text-orange-500' : ''}`}>
                          {damage}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCommanderDamageChange(opponent.playerId, 1)}
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
        )}
      </div>
    </div>
  );
}
