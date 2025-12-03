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
  Users,
  Dices,
  Skull,
  Check,
  X,
  Plus,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { 
  GameTopBar, 
  GameGrid, 
  GamePlayer as ImportedGamePlayer,
  Player as ImportedPlayer,
  Deck as ImportedDeck,
  CommentaryEntry as ImportedCommentaryEntry,
  getPlayerRotation,
  checkElimination,
  formatTime,
} from '@/components/current-game';

// Type aliases for compatibility
type Player = ImportedPlayer;
type Deck = ImportedDeck;
type GamePlayer = ImportedGamePlayer;
type CommentaryEntry = ImportedCommentaryEntry;

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
  const [playerSeats, setPlayerSeats] = useState<{ [playerId: string]: number }>({}); // Track player seat positions
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Assign seat positions when game starts
  useEffect(() => {
    if (gamePlayers.length > 0 && Object.keys(playerSeats).length === 0) {
      const seats: { [playerId: string]: number } = {};
      gamePlayers.forEach((player, index) => {
        seats[player.id] = index;
      });
      setPlayerSeats(seats);
    }
  }, [gamePlayers, playerSeats]);

  // Wrapper for getPlayerRotation from utils
  const getPlayerRotationWrapper = (playerId: string): number => {
    const seatIndex = playerSeats[playerId] || 0;
    const totalPlayers = gamePlayers.length;
    return getPlayerRotation(seatIndex, totalPlayers);
  };

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
      <GameTopBar
        elapsedTime={elapsedTime}
        isTimerRunning={isTimerRunning}
        gameEnded={gameEnded}
        canUndo={actionHistory.length > 0}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        onUndo={undoLastAction}
        onToggleCommentary={() => setShowCommentary(!showCommentary)}
      />

      {/* Main Game Area - Responsive Landscape Grid */}
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

        {/* Player Grid - Landscape 2-Column Layout */}
        <GameGrid
          gamePlayers={gamePlayers}
          playerSeats={playerSeats}
          selectedPlayerForStats={selectedPlayerForStats}
          onSelectPlayer={(playerId) => setSelectedPlayerForStats(playerId)}
          onLifeChange={updatePlayerLife}
          onPoisonChange={updatePlayerPoison}
          onCommanderDamageChange={updateCommanderDamage}
          getPlayerRotation={getPlayerRotationWrapper}
          t={t}
        />
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
                        {new Date(entry.timestamp).toLocaleTimeString()}
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
