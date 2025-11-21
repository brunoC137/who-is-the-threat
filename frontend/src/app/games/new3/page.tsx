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
  X,
  Trophy,
  Clock,
  Users,
  Layers
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
  player: string;
  deck: string;
  placement?: number;
}

export default function NewGamePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  const [formData, setFormData] = useState({
    players: [] as GamePlayer[],
    durationMinutes: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        // Fetch players and decks
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.players.length < 2) {
      newErrors.players = 'At least 2 players are required';
    }

    // Check if all players have decks selected
    const playersWithoutDecks = formData.players.filter(p => !p.deck);
    if (playersWithoutDecks.length > 0) {
      newErrors.decks = 'All players must have a deck selected';
    }

    // Check for duplicate placements
    const placements = formData.players
      .map(p => p.placement)
      .filter(p => p !== undefined && p !== null);
    
    const uniquePlacements = Array.from(new Set(placements));
    if (placements.length > 0 && placements.length !== uniquePlacements.length) {
      newErrors.placements = 'Each placement must be unique';
    }

    // Check if placements are sequential starting from 1
    if (placements.length > 0) {
      const sortedPlacements = placements.sort((a, b) => a! - b!);
      for (let i = 0; i < sortedPlacements.length; i++) {
        if (sortedPlacements[i] !== i + 1) {
          newErrors.placements = 'Placements must be sequential starting from 1st place';
          break;
        }
      }
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

      const gameData = {
        players: formData.players,
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

  const addPlayer = () => {
    setFormData(prev => ({
      ...prev,
      players: [...prev.players, { player: '', deck: '' }]
    }));
  };

  const removePlayer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }));
  };

  const updatePlayer = (index: number, field: keyof GamePlayer, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const getPlayerDecks = (playerId: string) => {
    return decks.filter(deck => deck.owner._id === playerId);
  };

  const getPlayerById = (playerId: string) => {
    return players.find(p => p._id === playerId);
  };

  const getDeckById = (deckId: string) => {
    return decks.find(d => d._id === deckId);
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/games">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Record New Game</h1>
          <p className="text-muted-foreground">Track a Commander game session</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Players Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players & Decks
            </CardTitle>
            <CardDescription>Add players and their decks for this game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.players.map((gamePlayer, index) => {
              const selectedPlayer = getPlayerById(gamePlayer.player);
              const selectedDeck = getDeckById(gamePlayer.deck);
              const playerDecks = gamePlayer.player ? getPlayerDecks(gamePlayer.player) : [];

              return (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Player {index + 1}</h4>
                    {formData.players.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayer(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Player Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Player</label>
                      <select
                        value={gamePlayer.player}
                        onChange={(e) => {
                          updatePlayer(index, 'player', e.target.value);
                          updatePlayer(index, 'deck', ''); // Reset deck when player changes
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
                        value={gamePlayer.deck}
                        onChange={(e) => updatePlayer(index, 'deck', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={!gamePlayer.player}
                      >
                        <option value="">Select Deck</option>
                        {playerDecks.map(deck => (
                          <option key={deck._id} value={deck._id}>
                            {deck.name} ({deck.commander})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Placement */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Placement</label>
                      <select
                        value={gamePlayer.placement || ''}
                        onChange={(e) => updatePlayer(index, 'placement', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Not finished</option>
                        <option value="1">1st Place 🥇</option>
                        <option value="2">2nd Place 🥈</option>
                        <option value="3">3rd Place 🥉</option>
                        <option value="4">4th Place</option>
                        <option value="5">5th Place</option>
                        <option value="6">6th Place</option>
                      </select>
                    </div>
                  </div>

                  {/* Player/Deck Preview */}
                  {selectedPlayer && selectedDeck && (
                    <div className="flex items-center gap-3 p-2 bg-muted rounded-md">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={selectedPlayer.profileImage} alt={selectedPlayer.name} />
                        <AvatarFallback className="text-xs">
                          {selectedPlayer.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {selectedPlayer.nickname || selectedPlayer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedDeck.name} • {selectedDeck.commander}
                        </p>
                      </div>
                      {gamePlayer.placement && (
                        <Badge variant={gamePlayer.placement === 1 ? "default" : "outline"}>
                          {gamePlayer.placement === 1 ? '🥇 Winner' : `${gamePlayer.placement}${getOrdinalSuffix(gamePlayer.placement)} Place`}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <Button type="button" onClick={addPlayer} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>

            {errors.players && (
              <p className="text-sm text-red-500">{errors.players}</p>
            )}
            {errors.decks && (
              <p className="text-sm text-red-500">{errors.decks}</p>
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
              <Trophy className="h-5 w-5" />
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

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}