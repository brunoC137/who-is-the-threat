'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trophy,
  Clock,
  Users,
  Trash2,
  Award,
  Medal
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
  owner: {
    _id: string;
    name: string;
    nickname?: string;
  };
}

interface GamePlayer {
  id: string;
  player: string;
  deck: string;
  placement?: number;
}

export default function NewGame3Page() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [formData, setFormData] = useState({
    durationMinutes: '',
    notes: '',
  });

  // Selection state for adding new players
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
          setPlayers(playersResult.data || playersResult);
          setDecks(decksResult.data || decksResult);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const addPlayer = () => {
    if (!selectedPlayerId || !selectedDeckId) {
      setErrors({ selection: 'Please select both a player and a deck' });
      return;
    }

    const newGamePlayer: GamePlayer = {
      id: `${selectedPlayerId}-${selectedDeckId}-${Date.now()}`,
      player: selectedPlayerId,
      deck: selectedDeckId,
    };

    setGamePlayers([...gamePlayers, newGamePlayer]);
    setSelectedPlayerId('');
    setSelectedDeckId('');
    setErrors({});
  };

  const removePlayer = (id: string) => {
    setGamePlayers(gamePlayers.filter(p => p.id !== id));
  };

  const setPlacement = (id: string, placement: number) => {
    setGamePlayers(gamePlayers.map(p => 
      p.id === id ? { ...p, placement } : p
    ));
  };

  const clearPlacement = (id: string) => {
    setGamePlayers(gamePlayers.map(p => 
      p.id === id ? { ...p, placement: undefined } : p
    ));
  };

  const getPlayerById = (playerId: string) => {
    return players.find(p => p._id === playerId);
  };

  const getDeckById = (deckId: string) => {
    return decks.find(d => d._id === deckId);
  };

  const getPlayerDecks = (playerId: string) => {
    return decks.filter(deck => deck.owner._id === playerId);
  };

  const isPlacementTaken = (placement: number, currentId?: string) => {
    return gamePlayers.some(p => p.placement === placement && p.id !== currentId);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (gamePlayers.length < 2) {
      newErrors.players = 'At least 2 players are required';
    }

    // Check if there are any placements assigned
    const assignedPlacements = gamePlayers.filter(p => p.placement !== undefined);
    if (assignedPlacements.length > 0 && assignedPlacements.length !== gamePlayers.length) {
      newErrors.placements = 'Either assign placements to all players or leave all unassigned';
    }

    if (formData.durationMinutes && (isNaN(Number(formData.durationMinutes)) || Number(formData.durationMinutes) <= 0)) {
      newErrors.durationMinutes = 'Duration must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const playersData = gamePlayers.map((gp) => ({
        player: gp.player,
        deck: gp.deck,
        placement: gp.placement,
      }));

      const gameData = {
        players: playersData,
        durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : undefined,
        notes: formData.notes || undefined,
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
        setErrors({ submit: errorData.message || 'Failed to create game' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while creating the game' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to record a game.</p>
          <Link href="/login">
            <Button className="mt-4">Login</Button>
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

  const availableDecks = selectedPlayerId ? getPlayerDecks(selectedPlayerId) : [];
  
  // Calculate available placement slots
  const maxPlacement = Math.min(gamePlayers.length, 6);
  const placementOptions = Array.from({ length: maxPlacement }, (_, i) => i + 1);

  const getPlacementBadgeStyle = (placement: number) => {
    const styles = [
      { bg: 'bg-yellow-100 hover:bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300', icon: '🥇' },
      { bg: 'bg-gray-100 hover:bg-gray-200', text: 'text-gray-800', border: 'border-gray-300', icon: '🥈' },
      { bg: 'bg-orange-100 hover:bg-orange-200', text: 'text-orange-800', border: 'border-orange-300', icon: '🥉' },
      { bg: 'bg-blue-100 hover:bg-blue-200', text: 'text-blue-800', border: 'border-blue-300', icon: '4️⃣' },
      { bg: 'bg-blue-100 hover:bg-blue-200', text: 'text-blue-800', border: 'border-blue-300', icon: '5️⃣' },
      { bg: 'bg-blue-100 hover:bg-blue-200', text: 'text-blue-800', border: 'border-blue-300', icon: '6️⃣' },
    ];
    return styles[placement - 1] || styles[3];
  };

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
          <h1 className="text-3xl font-bold">Record New Game</h1>
          <p className="text-muted-foreground">Version 3: Quick tap placement</p>
        </div>
        <Link href="/games/new">
          <Button variant="outline" size="sm">Original</Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">How it works</h3>
              <ol className="text-sm text-purple-700 space-y-1">
                <li>1. Add all players and their decks</li>
                <li>2. Tap placement badges to quickly assign positions</li>
                <li>3. Add game details and submit!</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Add Player Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Player
            </CardTitle>
            <CardDescription>Select a player and their deck</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Player</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => {
                    setSelectedPlayerId(e.target.value);
                    setSelectedDeckId('');
                  }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Player</option>
                  {players.map(player => (
                    <option key={player._id} value={player._id}>
                      {player.nickname || player.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deck Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Deck</label>
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={!selectedPlayerId}
                >
                  <option value="">Select Deck</option>
                  {availableDecks.map(deck => (
                    <option key={deck._id} value={deck._id}>
                      {deck.name} ({deck.commander})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button 
              type="button" 
              onClick={addPlayer} 
              className="w-full"
              disabled={!selectedPlayerId || !selectedDeckId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Game
            </Button>

            {errors.selection && (
              <p className="text-sm text-red-500">{errors.selection}</p>
            )}
          </CardContent>
        </Card>

        {/* Players List - Tap to Assign Placement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Game Players
            </CardTitle>
            <CardDescription>
              {gamePlayers.length > 0 
                ? `${gamePlayers.length} player${gamePlayers.length !== 1 ? 's' : ''} • Tap badges to assign placement`
                : 'No players added yet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gamePlayers.length > 0 ? (
              gamePlayers.map((gp) => {
                const selectedPlayer = getPlayerById(gp.player);
                const selectedDeck = getDeckById(gp.deck);

                return (
                  <div
                    key={gp.id}
                    className="relative bg-card border-2 border-border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Player Info */}
                      {selectedPlayer && selectedDeck ? (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 ring-2 ring-border">
                            <AvatarImage src={selectedPlayer.profileImage} alt={selectedPlayer.name} />
                            <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-accent/20">
                              {selectedPlayer.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {selectedPlayer.nickname || selectedPlayer.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedDeck.name} • {selectedDeck.commander}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-sm text-muted-foreground">
                          Incomplete selection
                        </div>
                      )}

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayer(gp.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Placement Selection - Quick Tap Badges */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <span className="text-xs font-medium text-muted-foreground self-center mr-2">
                        Placement:
                      </span>
                      {placementOptions.map((placement) => {
                        const isSelected = gp.placement === placement;
                        const isTaken = !isSelected && isPlacementTaken(placement, gp.id);
                        const style = getPlacementBadgeStyle(placement);
                        
                        return (
                          <button
                            key={placement}
                            type="button"
                            onClick={() => setPlacement(gp.id, placement)}
                            disabled={isTaken}
                            className={`
                              px-3 py-1.5 rounded-md border-2 font-bold text-sm
                              transition-all duration-200
                              ${isSelected 
                                ? `${style.bg} ${style.text} ${style.border} ring-2 ring-offset-1 ring-primary` 
                                : isTaken
                                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                  : `${style.bg} ${style.text} ${style.border}`
                              }
                            `}
                          >
                            {style.icon} {placement === 1 ? '1st' : placement === 2 ? '2nd' : placement === 3 ? '3rd' : `${placement}th`}
                          </button>
                        );
                      })}
                      {gp.placement && (
                        <button
                          type="button"
                          onClick={() => clearPlacement(gp.id)}
                          className="px-3 py-1.5 rounded-md border-2 border-gray-300 bg-white text-gray-600 hover:bg-gray-50 font-medium text-xs"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Add players to start recording the game</p>
              </div>
            )}

            {errors.players && (
              <p className="text-sm text-red-500">{errors.players}</p>
            )}
            {errors.placements && (
              <p className="text-sm text-red-500">{errors.placements}</p>
            )}
          </CardContent>
        </Card>

        {/* Game Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Game Details
            </CardTitle>
            <CardDescription>Optional information about the game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Duration */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, durationMinutes: e.target.value })
                }
                placeholder="90"
                className={errors.durationMinutes ? 'border-red-500' : ''}
              />
              {errors.durationMinutes && (
                <p className="text-sm text-red-500 mt-1">{errors.durationMinutes}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Game highlights, memorable moments, or any other notes..."
                rows={3}
                className="w-full p-2 border rounded-md resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/games" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Record Game
              </>
            )}
          </Button>
        </div>

        {errors.submit && (
          <div className="text-center">
            <p className="text-sm text-red-500">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
}
