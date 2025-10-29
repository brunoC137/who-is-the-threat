'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Trophy, Calendar, Users, Clock, StickyNote, Filter } from 'lucide-react';
import Link from 'next/link';

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
    placement: number;
  }>;
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
}

export default function GamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'players' | 'duration'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'my-games' | 'my-wins'>('all');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/games`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setGames(result.data || result);
        }
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const filteredAndSortedGames = games
    .filter(game => {
      // Filter by search term
      const matchesSearch = 
        game.players.some(p => 
          p.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.player.nickname && p.player.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
          p.deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.deck.commander.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (game.notes && game.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by type
      let matchesFilter = true;
      if (filterBy === 'my-games') {
        matchesFilter = game.players.some(p => p.player._id === user?.id);
      } else if (filterBy === 'my-wins') {
        matchesFilter = game.players.some(p => p.player._id === user?.id && p.placement === 1);
      }

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'players':
          return b.players.length - a.players.length;
        case 'duration':
          return (b.durationMinutes || 0) - (a.durationMinutes || 0);
        default:
          return 0;
      }
    });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPlacementColor = (placement: number) => {
    switch (placement) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getPlacementText = (placement: number) => {
    switch (placement) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `${placement}th`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground">
            History of all Commander games played
          </p>
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link href="/games/new">
            <Plus className="h-4 w-4 mr-2" />
            Record Game
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'players' | 'duration')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="date">Sort by Date</option>
          <option value="players">Sort by Players</option>
          <option value="duration">Sort by Duration</option>
        </select>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as 'all' | 'my-games' | 'my-wins')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="all">All Games</option>
          <option value="my-games">My Games</option>
          <option value="my-wins">My Wins</option>
        </select>
      </div>

      {/* Games List */}
      {filteredAndSortedGames.length > 0 ? (
        <div className="space-y-6">
          {filteredAndSortedGames.map((game) => (
            <Card key={game._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {game.players.length} players
                      </span>
                      {game.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(game.durationMinutes)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 mt-4 sm:mt-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/games/${game._id}`}>View Details</Link>
                    </Button>
                    {(user?.isAdmin || user?.id === game.createdBy._id) && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/games/${game._id}/edit`}>Edit</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Players and Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                  {game.players
                    .sort((a, b) => a.placement - b.placement)
                    .map((participant) => (
                    <div
                      key={`${participant.player._id}-${participant.deck._id}`}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Badge 
                        variant="outline"
                        className={`px-2 py-1 font-bold ${getPlacementColor(participant.placement)}`}
                      >
                        {getPlacementText(participant.placement)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage 
                              src={participant.player.profileImage} 
                              alt={participant.player.name} 
                            />
                            <AvatarFallback className="text-xs">
                              {participant.player.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm truncate">
                            {participant.player.nickname || participant.player.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium">{participant.deck.name}</div>
                          <div>{participant.deck.commander}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {game.notes && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium mb-1">Notes</div>
                        <p className="text-sm text-muted-foreground">{game.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Creator */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-muted-foreground">
                    Recorded by {game.createdBy.nickname || game.createdBy.name} • {' '}
                    {new Date(game.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No games found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterBy !== 'all'
              ? "No games match your current filters"
              : "No games have been recorded yet."
            }
          </p>
          {(!searchTerm && filterBy === 'all') && (
            <Button asChild>
              <Link href="/games/new">Record Your First Game</Link>
            </Button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {games.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{games.length}</CardTitle>
              <CardDescription>Total Games</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {user ? games.filter(g => g.players.some(p => p.player._id === user._id)).length : 0}
              </CardTitle>
              <CardDescription>Games You Played</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {user ? games.filter(g => g.players.some(p => p.player._id === user._id && p.placement === 1)).length : 0}
              </CardTitle>
              <CardDescription>Your Wins</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {Math.round(games.reduce((acc, game) => acc + (game.durationMinutes || 0), 0) / games.length) || 0}m
              </CardTitle>
              <CardDescription>Avg Game Length</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}