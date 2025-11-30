'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
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
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        game.players.some(p => 
          (p.player?.name || '').toLowerCase().includes(term) ||
          (p.player?.nickname || '').toLowerCase().includes(term) ||
          (p.deck?.name || '').toLowerCase().includes(term) ||
          (p.deck?.commander || '').toLowerCase().includes(term)
        ) ||
        (game.notes && game.notes.toLowerCase().includes(term));

      // Filter by type
      let matchesFilter = true;
      if (filterBy === 'my-games') {
        matchesFilter = game.players.some(p => p.player?._id === user?.id);
      } else if (filterBy === 'my-wins') {
        matchesFilter = game.players.some(p => p.player?._id === user?.id && p.placement === 1);
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
          <h1 className="text-3xl font-bold mb-2">{t('games.title')}</h1>
          <p className="text-muted-foreground">
            {t('games.historyOfAllCommander')}
          </p>
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link href="/games/new">
            <Plus className="h-4 w-4 mr-2" />
            {t('games.recordGame')}
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('games.searchGames')}
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
          <option value="date">{t('games.sortByDate')}</option>
          <option value="players">{t('games.sortByPlayers')}</option>
          <option value="duration">{t('games.sortByDuration')}</option>
        </select>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as 'all' | 'my-games' | 'my-wins')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="all">{t('games.allGames')}</option>
          <option value="my-games">{t('games.myGames')}</option>
          <option value="my-wins">{t('games.myWins')}</option>
        </select>
      </div>

      {/* Games List */}
      {filteredAndSortedGames.length > 0 ? (
        <div className="space-y-6">
          {filteredAndSortedGames.map((game) => (
            <Card key={game._id} className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-glow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-3 ml-11">
                      <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="font-medium">{game.players.length} {game.players.length === 1 ? t('games.player') : t('dashboard.players')}</span>
                      </span>
                      {game.durationMinutes && (
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                          <Clock className="h-4 w-4 text-warning" />
                          <span className="font-medium">{formatDuration(game.durationMinutes)}</span>
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 mt-4 sm:mt-0">
                    <Button variant="default" size="sm" asChild className="shadow-glow-sm">
                      <Link href={`/games/${game._id}`}>{t('games.viewDetails')}</Link>
                    </Button>
                    {(user?.isAdmin || (game.createdBy?._id && user?.id === game.createdBy?._id)) && (
                      <Button variant="outline" size="sm" asChild className="hover:border-accent/50">
                        <Link href={`/games/${game._id}/edit`}>{t('actions.edit')}</Link>
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
                      key={`${participant.player?._id || 'unknown'}-${participant.deck?._id || 'unknown'}`}
                      className="group relative overflow-hidden rounded-xl border-2 border-border/50 bg-muted/20 p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-glow-sm"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-start gap-3">
                        <Badge 
                          variant="outline"
                          className={`px-3 py-1.5 font-bold text-sm border-2 ${getPlacementColor(participant.placement)}`}
                        >
                          {getPlacementText(participant.placement)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-7 h-7 ring-2 ring-border/50">
                              <AvatarImage 
                                src={participant.player?.profileImage} 
                                alt={participant.player?.name || 'Unknown Player'} 
                              />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                                {participant.player?.name?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm truncate">
                              {participant.player?.nickname || participant.player?.name || t('players.unknown')}
                            </span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="font-semibold text-foreground/90">{participant.deck?.name || t('decks.unknown')}</div>
                            <div className="text-muted-foreground">{participant.deck?.commander || ''}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {game.notes && (
                  <div className="border-t border-border/50 pt-4 mt-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <div className="p-2 rounded-lg bg-warning/10">
                        <StickyNote className="h-4 w-4 text-warning" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-2">{t('games.gameNotes')}</div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{game.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Creator */}
                <div className="border-t border-border/50 pt-4 mt-4">
                  <p className="text-xs text-muted-foreground">
                    {t('games.recordedBy')} <span className="font-medium text-foreground">{game.createdBy?.nickname || game.createdBy?.name || t('players.unknown')}</span> • {' '}
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
          <h3 className="text-lg font-semibold mb-2">{t('games.noGames')}</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterBy !== 'all'
              ? t('games.noGamesMatch')
              : t('games.noGamesRecorded')
            }
          </p>
          {(!searchTerm && filterBy === 'all') && (
            <Button asChild>
              <Link href="/games/new">{t('games.recordYourFirst')}</Link>
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
              <CardDescription>{t('dashboard.totalGames')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {user ? games.filter(g => g.players.some(p => p.player._id === user.id)).length : 0}
              </CardTitle>
              <CardDescription>{t('games.gamesYouPlayed')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {user ? games.filter(g => g.players.some(p => p.player._id === user.id && p.placement === 1)).length : 0}
              </CardTitle>
              <CardDescription>{t('games.gamesYouWon')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {Math.round(games.reduce((acc, game) => acc + (game.durationMinutes || 0), 0) / games.length) || 0}m
              </CardTitle>
              <CardDescription>{t('games.avgGameLength')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}