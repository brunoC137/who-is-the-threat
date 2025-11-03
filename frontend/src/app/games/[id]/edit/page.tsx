'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { gamesAPI, playersAPI, decksAPI } from '@/lib/api';

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
  eliminatedBy?: string;
  borrowedFrom?: string;
}

interface Game {
  _id: string;
  createdBy: {
    _id: string;
    name: string;
    nickname?: string;
  };
  date: string;
  players: Array<{
    player: {
      _id: string;
      name: string;
      nickname?: string;
      profileImage?: string;
    };
    deck: {
      _id: string;
      name: string;
      commander: string;
    };
    placement?: number;
    eliminatedBy?: {
      _id: string;
      name: string;
      nickname?: string;
    };
    borrowedFrom?: {
      _id: string;
      name: string;
      nickname?: string;
    };
  }>;
  durationMinutes?: number;
  notes?: string;
}

export default function EditGamePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    players: [] as GamePlayer[],
    durationMinutes: '',
    notes: '',
  });

  // State for managing borrowed deck toggles per player
  const [borrowedDeckToggles, setBorrowedDeckToggles] = useState<{ [key: number]: boolean }>({});
  const [deckOwners, setDeckOwners] = useState<{ [key: number]: string }>({});

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch game data and other required data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch game, players, and decks in parallel
        const [gameResponse, playersResponse, decksResponse] = await Promise.all([
          gamesAPI.getById(gameId),
          playersAPI.getAll(),
          decksAPI.getAll()
        ]);

        const gameData = gameResponse.data.data || gameResponse.data;
        const playersResponseData = playersResponse.data.data || playersResponse.data;
        const decksData = decksResponse.data.data || decksResponse.data;

        setGame(gameData);
        setPlayers(playersResponseData);
        setDecks(decksData);

        // Pre-populate form with game data
        const gamePlayersData = gameData.players.map((p: any) => ({
          player: p.player._id,
          deck: p.deck._id,
          placement: p.placement,
          eliminatedBy: p.eliminatedBy?._id || undefined,
          borrowedFrom: p.borrowedFrom?._id || undefined
        }));

        setFormData({
          players: gamePlayersData,
          durationMinutes: gameData.durationMinutes ? gameData.durationMinutes.toString() : '',
          notes: gameData.notes || '',
        });

        // Initialize borrowed deck toggles and deck owners
        const initialToggles: { [key: number]: boolean } = {};
        const initialOwners: { [key: number]: string } = {};
        gamePlayersData.forEach((player: any, index: number) => {
          initialToggles[index] = !!player.borrowedFrom;
          if (player.borrowedFrom) {
            initialOwners[index] = player.borrowedFrom;
          }
        });
        setBorrowedDeckToggles(initialToggles);
        setDeckOwners(initialOwners);

        setLoadingData(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors({ fetch: 'Failed to load game data' });
        setLoadingData(false);
      } finally {
        setInitialLoading(false);
      }
    };

    if (gameId) {
      fetchData();
    }
  }, [gameId]);

  // Check permissions
  const canEdit = user && game && (user.isAdmin || user.id === game.createdBy._id);
  const canDelete = user && game && (user.isAdmin || user.id === game.createdBy._id);

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
      const gameData = {
        players: formData.players,
        durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : undefined,
        notes: formData.notes || undefined,
      };

      await gamesAPI.update(gameId, gameData);
      router.push(`/games/${gameId}`);
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to update game' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await gamesAPI.delete(gameId);
      router.push('/games');
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to delete game' });
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    const newIndex = formData.players.length;
    setFormData(prev => ({
      ...prev,
      players: [...prev.players, { player: '', deck: '' }]
    }));
    // Initialize borrowed deck state for new player
    setBorrowedDeckToggles(prev => ({ ...prev, [newIndex]: false }));
    setDeckOwners(prev => ({ ...prev, [newIndex]: '' }));
  };

  const removePlayer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }));
    
    // Clean up borrowed deck state for removed player and reindex remaining players
    setBorrowedDeckToggles(prev => {
      const newToggles: { [key: number]: boolean } = {};
      Object.keys(prev).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newToggles[keyIndex] = prev[keyIndex];
        } else if (keyIndex > index) {
          newToggles[keyIndex - 1] = prev[keyIndex];
        }
      });
      return newToggles;
    });
    
    setDeckOwners(prev => {
      const newOwners: { [key: number]: string } = {};
      Object.keys(prev).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newOwners[keyIndex] = prev[keyIndex];
        } else if (keyIndex > index) {
          newOwners[keyIndex - 1] = prev[keyIndex];
        }
      });
      return newOwners;
    });
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

  const getDecksForBorrowing = (ownerId: string) => {
    return decks.filter(deck => deck.owner._id === ownerId);
  };

  const getPlayerById = (playerId: string) => {
    return players.find(p => p._id === playerId);
  };

  const getDeckById = (deckId: string) => {
    return decks.find(d => d._id === deckId);
  };

  // Loading state
  if (initialLoading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (errors.fetch || !game) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {errors.fetch || 'Game not found'}
          </p>
          <Link href="/games">
            <Button>Back to Games</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Permission check
  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to edit this game.
          </p>
          <Link href={`/games/${gameId}`}>
            <Button>View Game</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/games/${gameId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Game</h1>
          <p className="text-muted-foreground">
            Game from {formatDate(game.date)} • Created by {game.createdBy.nickname || game.createdBy.name}
          </p>
        </div>
        {canDelete && (
          <Button 
            variant={showDeleteConfirm ? "destructive" : "outline"}
            onClick={handleDelete}
            disabled={loading}
          >
            {showDeleteConfirm ? (
              loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        )}
      </div>

      {showDeleteConfirm && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800 mb-4">
              Are you sure you want to delete this game? This action cannot be undone and will affect player statistics.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Game'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Players Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players & Decks
            </CardTitle>
            <CardDescription>Update players and their decks for this game</CardDescription>
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
                    {formData.players.length > 2 && (
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
                          updatePlayer(index, 'borrowedFrom', undefined); // Reset borrowed from
                          // Reset borrowed deck state
                          setBorrowedDeckToggles(prev => ({ ...prev, [index]: false }));
                          setDeckOwners(prev => ({ ...prev, [index]: '' }));
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

                  {/* Borrowed Deck Toggle */}
                  {gamePlayer.player && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <input
                        type="checkbox"
                        id={`allowBorrowedDeck-${index}`}
                        checked={borrowedDeckToggles[index] || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setBorrowedDeckToggles(prev => ({ ...prev, [index]: isChecked }));
                          if (!isChecked) {
                            updatePlayer(index, 'deck', '');
                            updatePlayer(index, 'borrowedFrom', undefined);
                            setDeckOwners(prev => ({ ...prev, [index]: '' }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`allowBorrowedDeck-${index}`} className="text-sm font-medium text-blue-900 cursor-pointer">
                        Allow Borrowed Deck
                      </label>
                    </div>
                  )}

                  {/* Conditional rendering based on borrowed deck toggle */}
                  {gamePlayer.player && (
                    borrowedDeckToggles[index] ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Deck Owner Selection */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Deck Owner</label>
                          <select
                            value={deckOwners[index] || ''}
                            onChange={(e) => {
                              const ownerId = e.target.value;
                              setDeckOwners(prev => ({ ...prev, [index]: ownerId }));
                              updatePlayer(index, 'deck', ''); // Reset deck when owner changes
                              updatePlayer(index, 'borrowedFrom', ownerId);
                            }}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select Deck Owner</option>
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
                            disabled={!deckOwners[index]}
                          >
                            <option value="">Select Deck</option>
                            {deckOwners[index] && getDecksForBorrowing(deckOwners[index]).map(deck => (
                              <option key={deck._id} value={deck._id}>
                                {deck.name} ({deck.commander})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Deck Selection */}
                        <label className="text-sm font-medium mb-2 block">Deck</label>
                        <select
                          value={gamePlayer.deck}
                          onChange={(e) => {
                            updatePlayer(index, 'deck', e.target.value);
                            updatePlayer(index, 'borrowedFrom', undefined);
                          }}
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
                    )
                  )}

                  {/* Eliminated By - Only show for non-winners */}
                  {gamePlayer.placement && gamePlayer.placement > 1 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Eliminated By</label>
                      <select
                        value={gamePlayer.eliminatedBy || ''}
                        onChange={(e) => updatePlayer(index, 'eliminatedBy', e.target.value || undefined)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Not specified</option>
                        {formData.players
                          .filter(p => p.player && p.player !== gamePlayer.player)
                          .map((p, pIndex) => {
                            const player = getPlayerById(p.player);
                            return player ? (
                              <option key={p.player} value={p.player}>
                                {player.nickname || player.name}
                              </option>
                            ) : null;
                          })
                        }
                      </select>
                    </div>
                  )}

                  {/* Player/Deck Preview */}
                  {selectedPlayer && selectedDeck && (
                    <div className="flex items-center gap-3 p-2 bg-muted rounded-md">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={selectedPlayer.profileImage} alt={selectedPlayer.name} />
                        <AvatarFallback className="text-xs">
                          {selectedPlayer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {selectedPlayer.nickname || selectedPlayer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedDeck.name} • {selectedDeck.commander}
                        </p>
                        {gamePlayer.borrowedFrom && (
                          <p className="text-xs text-purple-600 italic">
                            📚 Borrowed from {getPlayerById(gamePlayer.borrowedFrom)?.nickname || getPlayerById(gamePlayer.borrowedFrom)?.name}
                          </p>
                        )}
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
          <Link href={`/games/${gameId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
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