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
  GripVertical,
  Trash2,
  User as UserIcon,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GuestPlayerDialog } from '@/components/GuestPlayerDialog';
import { GuestDeckDialog } from '@/components/GuestDeckDialog';

/**
 * NOTE – to fully fix the modal overflow on mobile, make sure that
 * inside your <GuestPlayerDialog /> (and GuestDeckDialog) you wrap
 * the DialogContent like this:
 *
 * <DialogContent className="p-0">
 *   <div className="w-full max-w-sm sm:max-w-md mx-auto p-4">
 *     {...modal inner content...}
 *   </div>
 * </DialogContent>
 *
 * This ensures the dialog never overflows horizontally on small screens.
 */

interface Player {
  _id: string;
  name: string;
  nickname?: string;
  profileImage?: string;
  isGuest?: boolean;
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
  isGuestDeck?: boolean;
}

interface GamePlayer {
  id: string; // Unique ID for drag and drop
  player: string;
  deck: string;
  borrowedFrom?: string; // Player ID who owns the deck
}

function SortablePlayerCard({
  gamePlayer,
  index,
  selectedPlayer,
  selectedDeck,
  borrowedFromPlayer,
  onRemove,
}: {
  gamePlayer: GamePlayer;
  index: number;
  selectedPlayer?: Player;
  selectedDeck?: Deck;
  borrowedFromPlayer?: Player;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: gamePlayer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPlacementBadge = (placement: number) => {
    const badges = [
      { text: '🥇 1st', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      { text: '🥈 2nd', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      { text: '🥉 3rd', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      { text: '4th', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      { text: '5th', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      { text: '6th', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    ];
    return badges[placement - 1] || badges[3];
  };

  const placementBadge = getPlacementBadge(index + 1);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-card border-2 border-border rounded-lg p-4 touch-none"
    >
      {/* On mobile we stack vertically, on larger screens we go horizontal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Left side: drag handle + placement badge */}
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-2 hover:bg-muted rounded"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Placement Badge */}
          <Badge
            variant="outline"
            className={`px-3 py-1.5 font-bold text-sm border-2 min-w-[64px] text-center ${placementBadge.color}`}
          >
            {placementBadge.text}
          </Badge>
        </div>

        {/* Player Info */}
        {selectedPlayer && selectedDeck ? (
          <div className="flex flex-1 items-start gap-3 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-border">
              <AvatarImage src={selectedPlayer.profileImage} alt={selectedPlayer.name} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-accent/20">
                {selectedPlayer.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-semibold text-sm truncate">
                {selectedPlayer.nickname || selectedPlayer.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedDeck.name} • {selectedDeck.commander}
              </p>

              {/* Guest badges – refactored for better wrapping on mobile */}
              {(selectedPlayer.isGuest || selectedDeck.isGuestDeck) && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {selectedPlayer.isGuest && (
                    <span
                      title="Guest Player"
                      className="inline-flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-yellow-800 leading-none"
                    >
                      <UserIcon className="h-3 w-3" />
                      <span className="hidden sm:inline">Guest Player</span>
                    </span>
                  )}

                  {selectedDeck.isGuestDeck && (
                    <span
                      title="Guest Deck"
                      className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-purple-800 leading-none"
                    >
                      <Layers className="h-3 w-3" />
                      <span className="hidden sm:inline">Guest Deck</span>
                    </span>
                  )}
                </div>
              )}

              {borrowedFromPlayer && (
                <p className="mt-1 text-xs text-purple-600 italic break-words">
                  📚 Borrowed from {borrowedFromPlayer.nickname || borrowedFromPlayer.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 text-sm text-muted-foreground">Incomplete selection</div>
        )}

        {/* Remove Button */}
        <div className="self-end sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewGame2Page() {
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
  const [allowBorrowedDeck, setAllowBorrowedDeck] = useState(false);
  const [selectedDeckOwnerId, setSelectedDeckOwnerId] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const [playersResponse, decksResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setGamePlayers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addPlayer = () => {
    if (!selectedPlayerId || !selectedDeckId) {
      setErrors({ selection: 'Please select both a player and a deck' });
      return;
    }

    if (allowBorrowedDeck && !selectedDeckOwnerId) {
      setErrors({ selection: 'Please select the deck owner' });
      return;
    }

    const newGamePlayer: GamePlayer = {
      id: `${selectedPlayerId}-${selectedDeckId}-${Date.now()}`,
      player: selectedPlayerId,
      deck: selectedDeckId,
      borrowedFrom: allowBorrowedDeck ? selectedDeckOwnerId : undefined,
    };

    setGamePlayers((prev) => [...prev, newGamePlayer]);
    setSelectedPlayerId('');
    setSelectedDeckId('');
    setAllowBorrowedDeck(false);
    setSelectedDeckOwnerId('');
    setErrors({});
  };

  const handleGuestPlayerCreated = (guestPlayer: Player) => {
    setPlayers((prev) => {
      const exists = prev.some((p) => p._id === guestPlayer._id);
      return exists ? prev : [...prev, guestPlayer];
    });
    setSelectedPlayerId(guestPlayer._id);
    setSelectedDeckId('');
  };

  const handleGuestDeckCreated = (guestDeck: Deck) => {
    setDecks((prev) => {
      const exists = prev.some((d) => d._id === guestDeck._id);
      return exists ? prev : [...prev, guestDeck];
    });
    setSelectedDeckId(guestDeck._id);
  };

  const removePlayer = (id: string) => {
    setGamePlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const getPlayerById = (playerId: string) => players.find((p) => p._id === playerId);

  const getDeckById = (deckId: string) => decks.find((d) => d._id === deckId);

  const getPlayerDecks = (playerId: string) =>
    decks.filter((deck) => deck.owner._id === playerId);

  const getDecksForBorrowing = (ownerId: string) =>
    decks.filter((deck) => deck.owner._id === ownerId);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (gamePlayers.length < 2) {
      newErrors.players = 'At least 2 players are required';
    }

    if (
      formData.durationMinutes &&
      (isNaN(Number(formData.durationMinutes)) || Number(formData.durationMinutes) <= 0)
    ) {
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

      // Map gamePlayers to API format with placement based on order
      const playersData = gamePlayers.map((gp, index) => ({
        player: gp.player,
        deck: gp.deck,
        placement: index + 1, // Position in array determines placement
        borrowedFrom: gp.borrowedFrom || undefined,
      }));

      const gameData = {
        players: playersData,
        durationMinutes: formData.durationMinutes
          ? Number(formData.durationMinutes)
          : undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gameData),
      });

      if (response.ok) {
        router.push('/games');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to create game' });
      }
    } catch {
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
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const availableDecks = allowBorrowedDeck
    ? selectedDeckOwnerId
      ? getDecksForBorrowing(selectedDeckOwnerId)
      : []
    : selectedPlayerId
      ? getPlayerDecks(selectedPlayerId)
      : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/games">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Record New Game</h1>
          <p className="text-sm text-muted-foreground">
            Version 2: Drag to reorder placement
          </p>
        </div>
        <Link href="/games/new">
          <Button variant="outline" size="sm">
            Original
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-blue-900">How it works</h3>
              <ol className="space-y-1 text-sm text-blue-700">
                <li>1. Add players and their decks using the form below</li>
                <li>2. Drag players to reorder them by placement (top = winner)</li>
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
            {/* Actions: Add guest player */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <GuestPlayerDialog onGuestPlayerCreated={handleGuestPlayerCreated} />
            </div>

            {/* Player Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium">Player</label>
              <select
                value={selectedPlayerId}
                onChange={(e) => {
                  setSelectedPlayerId(e.target.value);
                  setSelectedDeckId(''); // Reset deck when player changes
                  setSelectedDeckOwnerId(''); // Reset deck owner
                }}
                className="w-full rounded-md border p-2"
              >
                <option value="">Select Player</option>
                {players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.nickname || player.name}
                    {player.isGuest ? ' (Guest)' : ''}
                  </option>
                ))}
              </select>

              {/* If selected player is guest and has no decks, suggest creating a guest deck */}
              {(() => {
                const sp = selectedPlayerId ? getPlayerById(selectedPlayerId) : undefined;
                const hasNoDecks =
                  selectedPlayerId && !allowBorrowedDeck && availableDecks.length === 0;
                if (sp && sp.isGuest && hasNoDecks) {
                  return (
                    <div className="mt-2">
                      <GuestDeckDialog
                        guestPlayerId={sp._id}
                        guestPlayerName={sp.nickname || sp.name}
                        onGuestDeckCreated={handleGuestDeckCreated}
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Borrowed Deck Toggle */}
            <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
              <input
                type="checkbox"
                id="allowBorrowedDeck"
                checked={allowBorrowedDeck}
                onChange={(e) => {
                  setAllowBorrowedDeck(e.target.checked);
                  setSelectedDeckId('');
                  setSelectedDeckOwnerId('');
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="allowBorrowedDeck"
                className="cursor-pointer text-sm font-medium text-blue-900"
              >
                Allow Borrowed Deck
              </label>
            </div>

            {/* Conditional rendering based on borrowed deck toggle */}
            {allowBorrowedDeck ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Deck Owner Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Deck Owner</label>
                  <select
                    value={selectedDeckOwnerId}
                    onChange={(e) => {
                      setSelectedDeckOwnerId(e.target.value);
                      setSelectedDeckId(''); // Reset deck when owner changes
                    }}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="">Select Deck Owner</option>
                    {players.map((player) => (
                      <option key={player._id} value={player._id}>
                        {player.nickname || player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deck Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Deck</label>
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-full rounded-md border p-2"
                    disabled={!selectedDeckOwnerId}
                  >
                    <option value="">Select Deck</option>
                    {availableDecks.map((deck) => (
                      <option key={deck._id} value={deck._id}>
                        {deck.name} ({deck.commander})
                        {deck.isGuestDeck ? ' • Guest Deck' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                {/* Deck Selection */}
                <label className="mb-2 block text-sm font-medium">Deck</label>
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full rounded-md border p-2"
                  disabled={!selectedPlayerId}
                >
                  <option value="">Select Deck</option>
                  {availableDecks.map((deck) => (
                    <option key={deck._id} value={deck._id}>
                      {deck.name} ({deck.commander})
                      {deck.isGuestDeck ? ' • Guest Deck' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="button"
              onClick={addPlayer}
              className="w-full"
              disabled={!selectedPlayerId || !selectedDeckId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Game
            </Button>

            {errors.selection && (
              <p className="text-sm text-red-500">{errors.selection}</p>
            )}
          </CardContent>
        </Card>

        {/* Players List - Drag to Reorder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Game Players (Drag to Reorder)
            </CardTitle>
            <CardDescription>
              {gamePlayers.length > 0
                ? `${gamePlayers.length} player${
                    gamePlayers.length !== 1 ? 's' : ''
                  } • Top position = Winner`
                : 'No players added yet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {gamePlayers.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={gamePlayers.map((gp) => gp.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {gamePlayers.map((gp, index) => (
                    <SortablePlayerCard
                      key={gp.id}
                      gamePlayer={gp}
                      index={index}
                      selectedPlayer={getPlayerById(gp.player)}
                      selectedDeck={getDeckById(gp.deck)}
                      borrowedFromPlayer={
                        gp.borrowedFrom ? getPlayerById(gp.borrowedFrom) : undefined
                      }
                      onRemove={() => removePlayer(gp.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>Add players to start recording the game</p>
              </div>
            )}

            {errors.players && (
              <p className="text-sm text-red-500">{errors.players}</p>
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
              <label className="flex items-center gap-2 text-sm font-medium">
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
                <p className="mt-1 text-sm text-red-500">{errors.durationMinutes}</p>
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
                className="w-full resize-none rounded-md border p-2"
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
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
