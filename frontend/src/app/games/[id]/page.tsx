'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Edit, 
  Trophy, 
  Clock,
  Calendar,
  Users,
  User,
  Layers,
  MessageSquare,
  Target,
  Crown,
  Skull,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { gamesAPI } from '@/lib/api';

interface Game {
  _id: string;
  createdBy: {
    _id: string;
    name: string;
    nickname?: string;
    profileImage?: string;
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
      deckImage?: string;
      colorIdentity?: string[];
      tags?: string[];
    };
    placement?: number;
    eliminatedBy?: {
      _id: string;
      name: string;
      nickname?: string;
      profileImage?: string;
    };
    borrowedFrom?: {
      _id: string;
      name: string;
      nickname?: string;
      profileImage?: string;
    };
  }>;
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const colorMap: { [key: string]: { name: string; color: string } } = {
  'W': { name: 'White', color: 'bg-yellow-100 text-yellow-800' },
  'U': { name: 'Blue', color: 'bg-blue-100 text-blue-800' },
  'B': { name: 'Black', color: 'bg-gray-100 text-gray-800' },
  'R': { name: 'Red', color: 'bg-red-100 text-red-800' },
  'G': { name: 'Green', color: 'bg-green-100 text-green-800' },
};

export default function GameDetailsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useParams();
  const gameId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await gamesAPI.getById(gameId);
        const gameData = response.data.data || response.data;
        setGame(gameData);
      } catch (error: any) {
        console.error('Error fetching game:', error);
        setError(t('games.failedToLoadGame'));
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId, t]);

  // Check permissions
  const canEdit = user && game && (user.isAdmin || (game.createdBy?._id && user.id === game.createdBy._id));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {error || t('games.gameNotFound')}
          </p>
          <Link href="/games">
            <Button>{t('games.backToGames')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPlacementBadge = (placement: number | undefined) => {
    if (!placement) return null;
    
    const colors = {
      1: 'bg-yellow-500 text-white',
      2: 'bg-gray-400 text-white',
      3: 'bg-amber-600 text-white',
    };
    
    return (
      <Badge className={colors[placement as keyof typeof colors] || 'bg-slate-400 text-white'}>
        {placement === 1 ? '🥇 ' + t('games.winnerLabel') : placement === 2 ? '🥈 2nd' : placement === 3 ? '🥉 3rd' : `${placement}th`}
      </Badge>
    );
  };

  // Sort players by placement (winners first, then by placement, then unplaced)
  const sortedPlayers = [...game.players].sort((a, b) => {
    if (a.placement && b.placement) {
      return a.placement - b.placement;
    }
    if (a.placement && !b.placement) return -1;
    if (!a.placement && b.placement) return 1;
    return 0;
  });

  const winner = game.players.find(p => p.placement === 1);
  const totalPlayers = game.players.length;
  const completedGame = game.players.every(p => p.placement);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header - Compact */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link href="/games">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {completedGame ? t('games.completedGame') : t('games.gameSession')}
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalPlayers}
                </span>
                {game.durationMinutes && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(game.durationMinutes)}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {canEdit && (
              <Button size="sm" asChild className="shrink-0 h-8 sm:h-10">
                <Link href={`/games/${game._id}/edit`}>
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('games.editGameButton')}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Winner Highlight - Mobile Optimized */}
        {winner && (
          <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-background overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="shrink-0">
                  <div className="relative">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-yellow-500">
                      <AvatarImage src={winner.player?.profileImage} alt={winner.player?.name || 'Unknown Player'} />
                      <AvatarFallback className="bg-yellow-500 text-white">
                        {winner.player?.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 shrink-0" />
                    <p className="font-bold text-sm sm:text-base text-yellow-700 dark:text-yellow-400">
                      {t('games.gameWinner')}
                    </p>
                  </div>
                  <p className="font-semibold text-base sm:text-lg truncate">
                    {winner.player?.nickname || winner.player?.name || 'Unknown Player'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {(winner.deck?.name || 'Unknown Deck')} • {(winner.deck?.commander || 'Unknown Commander')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players & Results - Mobile First Design */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('games.playersAndResults')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {completedGame ? t('games.finalStandings') : t('games.gameParticipants')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              {sortedPlayers.map((participant, index) => (
                <Card key={`${participant.player?._id || 'unknown'}-${participant.deck?._id || 'unknown'}`} 
                      className="border-muted bg-muted/30">
                  <CardContent className="p-3 sm:p-4">
                    {/* Player Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                        <AvatarImage 
                          src={participant.player?.profileImage} 
                          alt={participant.player?.name || 'Unknown Player'} 
                        />
                        <AvatarFallback>
                          {participant.player?.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm sm:text-base">
                            {participant.player?.nickname || participant.player?.name || 'Unknown Player'}
                          </p>
                          {getPlacementBadge(participant.placement)}
                        </div>
                        
                        {/* Deck Info */}
                        <div className="space-y-1">
                          {participant.deck?._id ? (
                            <Link 
                              href={`/decks/${participant.deck._id}`}
                              className="text-sm font-medium text-primary hover:underline block truncate"
                            >
                              {participant.deck?.name || 'Unknown Deck'}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium block truncate">{participant.deck?.name || 'Unknown Deck'}</span>
                          )}
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                            {participant.deck?.commander || 'Unknown Commander'}
                          </p>
                        </div>
                        
                        {/* Color Identity */}
                        {participant.deck?.colorIdentity && participant.deck.colorIdentity.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {participant.deck.colorIdentity.map(color => (
                              <Badge
                                key={color}
                                variant="outline"
                                className={`text-xs px-2 py-0 ${colorMap[color]?.color || 'bg-gray-100 text-gray-800'}`}
                              >
                                {color}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="space-y-2">
                      {/* Elimination Info */}
                      {participant.eliminatedBy && participant.placement && participant.placement > 1 && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
                          <Skull className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 shrink-0" />
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                            {t('games.eliminatedByText')}{' '}
                            <Link 
                              href={`/players/${participant.eliminatedBy._id}`}
                              className="font-semibold hover:underline"
                            >
                              {participant.eliminatedBy.nickname || participant.eliminatedBy.name}
                            </Link>
                          </p>
                        </div>
                      )}

                      {/* Borrowed Deck Info */}
                      {participant.borrowedFrom && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-purple-500/10 border border-purple-500/20">
                          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 shrink-0" />
                          <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                            Borrowed from{' '}
                            <Link 
                              href={`/players/${participant.borrowedFrom._id}`}
                              className="font-semibold hover:underline"
                            >
                              {participant.borrowedFrom.nickname || participant.borrowedFrom.name}
                            </Link>
                          </p>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild className="flex-1 text-xs h-8">
                          <Link href={`/players/${participant.player?._id || ''}`}>
                            <User className="h-3 w-3 mr-1" />
                            {t('games.playerButton')}
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="flex-1 text-xs h-8" disabled={!participant.deck?._id}>
                          <Link href={`/decks/${participant.deck?._id || ''}`}>
                            <Layers className="h-3 w-3 mr-1" />
                            {t('games.deckButton')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Elimination Summary - Mobile Optimized */}
        {(() => {
          const eliminations = game.players.filter(p => p.eliminatedBy);
          if (eliminations.length > 0) {
            return (
              <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-background">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    {t('games.eliminationsTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {eliminations.map((eliminated, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Skull className="h-4 w-4 text-red-500 shrink-0" />
                      <p className="text-xs sm:text-sm text-foreground flex-1">
                        <span className="font-semibold">
                          {eliminated.eliminatedBy?.nickname || eliminated.eliminatedBy?.name}
                        </span>
                        {' ' + t('games.eliminatedText') + ' '}
                        <span className="font-semibold">
                          {eliminated.player.nickname || eliminated.player.name}
                        </span>
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        {/* Game Notes - Mobile Optimized */}
        {game.notes && (
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('games.gameNotesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
                <p className="whitespace-pre-line text-sm sm:text-base">{game.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Summary - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">{t('games.gameSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('games.dateLabel')}</p>
                <p className="text-sm sm:text-base font-medium">{formatDate(game.date)}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('games.playersAndResults')}</p>
                <p className="text-sm sm:text-base font-medium">{totalPlayers}</p>
              </div>
              
              {game.durationMinutes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('games.durationLabel')}</p>
                  <p className="text-sm sm:text-base font-medium">{formatDuration(game.durationMinutes)}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('games.statusLabel')}</p>
                <Badge variant={completedGame ? "default" : "secondary"} className="text-xs">
                  {completedGame ? t('games.completedStatus') : t('games.inProgressStatus')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commanders Used - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">{t('games.commandersTitle')}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('games.commandersUsed')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {game.players.map((participant) => (
                <div key={`${participant.player?._id || 'unknown'}-${participant.deck?._id || 'unknown'}`} 
                     className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage 
                      src={participant.player?.profileImage} 
                      alt={participant.player?.name || 'Unknown Player'} 
                    />
                    <AvatarFallback className="text-xs">
                      {participant.player?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {participant.deck?.commander || 'Unknown Commander'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.player?.nickname || participant.player?.name || 'Unknown Player'}
                    </p>
                  </div>
                  {participant.placement === 1 && (
                    <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meta Information - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">{t('games.detailsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={game.createdBy?.profileImage} alt={game.createdBy?.name || 'Unknown User'} />
                <AvatarFallback className="text-xs">
                  {game.createdBy?.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{t('games.recordedByUser')}</p>
                <p className="font-medium truncate">{game.createdBy?.nickname || game.createdBy?.name || 'Unknown User'}</p>
              </div>
            </div>
            
            <div className="space-y-1 p-2 rounded-md bg-muted/50">
              <p className="text-muted-foreground">{t('games.recordedLabel')}</p>
              <p className="font-medium">{formatDateTime(game.createdAt)}</p>
            </div>
            
            {game.updatedAt !== game.createdAt && (
              <div className="space-y-1 p-2 rounded-md bg-muted/50">
                <p className="text-muted-foreground">{t('games.lastUpdatedLabel')}</p>
                <p className="font-medium">{formatDateTime(game.updatedAt)}</p>
              </div>
            )}
            
            <div className="space-y-1 p-2 rounded-md bg-muted/50">
              <p className="text-muted-foreground">{t('games.gameIdLabel')}</p>
              <p className="font-mono text-xs break-all text-muted-foreground">{game._id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}