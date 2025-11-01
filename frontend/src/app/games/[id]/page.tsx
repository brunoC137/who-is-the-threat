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
  Eye,
  ExternalLink,
  Target
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
  const canEdit = user && game && (user.isAdmin || user.id === game.createdBy._id);

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
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/games">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {completedGame ? t('games.completedGame') : t('games.gameSession')}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(game.date)}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {totalPlayers} {t('games.playersCount')}
                </span>
                {game.durationMinutes && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDuration(game.durationMinutes)}
                  </span>
                )}
              </div>
              
              {/* Game Creator */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={game.createdBy.profileImage} alt={game.createdBy.name} />
                  <AvatarFallback>
                    {game.createdBy.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">
                  {t('games.recordedByUser')} <strong>{game.createdBy.nickname || game.createdBy.name}</strong>
                </span>
              </div>

              {/* Winner Highlight */}
              {winner && (
                <div className="bg-gradient-to-r from-yellow-100 to-amber-100 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-800">{t('games.gameWinner')}</p>
                      <p className="text-yellow-700">
                        {winner.player.nickname || winner.player.name} with {winner.deck.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Elimination Summary */}
              {(() => {
                const eliminations = game.players.filter(p => p.eliminatedBy);
                if (eliminations.length > 0) {
                  return (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-red-600" />
                        <p className="font-semibold text-red-800">{t('games.eliminationsTitle')}</p>
                      </div>
                      <div className="space-y-1">
                        {eliminations.map((eliminated, index) => (
                          <p key={index} className="text-sm text-red-700">
                            <span className="font-medium">
                              {eliminated.eliminatedBy?.nickname || eliminated.eliminatedBy?.name}
                            </span>
                            {' ' + t('games.eliminatedText') + ' '}
                            <span className="font-medium">
                              {eliminated.player.nickname || eliminated.player.name}
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {canEdit && (
              <Button asChild>
                <Link href={`/games/${game._id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('games.editGameButton')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Players & Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t('games.playersAndResults')}
              </CardTitle>
              <CardDescription>
                {completedGame ? t('games.finalStandings') : t('games.gameParticipants')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPlayers.map((participant, index) => (
                  <div key={`${participant.player._id}-${participant.deck._id}`} 
                       className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={participant.player.profileImage} 
                          alt={participant.player.name} 
                        />
                        <AvatarFallback>
                          {participant.player.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {participant.player.nickname || participant.player.name}
                          </p>
                          {getPlacementBadge(participant.placement)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                            <Link href={`/decks/${participant.deck._id}`}>
                              {participant.deck.name}
                            </Link>
                          </Button>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {participant.deck.commander}
                          </span>
                        </div>
                        
                        {/* Color Identity */}
                        {participant.deck.colorIdentity && participant.deck.colorIdentity.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {participant.deck.colorIdentity.map(color => (
                              <Badge
                                key={color}
                                variant="outline"
                                className={`text-xs ${colorMap[color]?.color || 'bg-gray-100 text-gray-800'}`}
                              >
                                {color}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Elimination Information */}
                        {participant.eliminatedBy && participant.placement && participant.placement > 1 && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <span>💀 {t('games.eliminatedByText')}</span>
                            <Link 
                              href={`/players/${participant.eliminatedBy._id}`}
                              className="font-medium hover:underline"
                            >
                              {participant.eliminatedBy.nickname || participant.eliminatedBy.name}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/players/${participant.player._id}`}>
                          <User className="h-3 w-3 mr-1" />
                          {t('games.playerButton')}
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/decks/${participant.deck._id}`}>
                          <Layers className="h-3 w-3 mr-1" />
                          {t('games.deckButton')}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Notes */}
          {game.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('games.gameNotesTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line">{game.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t('games.gameSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('games.dateLabel')}</span>
                <span className="text-sm font-medium">{formatDate(game.date)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('games.playersAndResults')}</span>
                <span className="text-sm font-medium">{totalPlayers}</span>
              </div>
              
              {game.durationMinutes && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('games.durationLabel')}</span>
                  <span className="text-sm font-medium">{formatDuration(game.durationMinutes)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('games.statusLabel')}</span>
                <Badge variant={completedGame ? "default" : "secondary"}>
                  {completedGame ? t('games.completedStatus') : t('games.inProgressStatus')}
                </Badge>
              </div>

              {winner && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('games.winnerLabel')}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {winner.player.nickname || winner.player.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {winner.deck.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commanders Used */}
          <Card>
            <CardHeader>
              <CardTitle>{t('games.commandersTitle')}</CardTitle>
              <CardDescription>{t('games.commandersUsed')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {game.players.map((participant) => (
                  <div key={`${participant.player._id}-${participant.deck._id}`} 
                       className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage 
                        src={participant.player.profileImage} 
                        alt={participant.player.name} 
                      />
                      <AvatarFallback className="text-xs">
                        {participant.player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {participant.deck.commander}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {participant.player.nickname || participant.player.name}
                      </p>
                    </div>
                    {participant.placement === 1 && (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meta Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('games.detailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">{t('games.recordedLabel')}:</span>
                <p className="font-medium">{formatDateTime(game.createdAt)}</p>
              </div>
              
              {game.updatedAt !== game.createdAt && (
                <div>
                  <span className="text-muted-foreground">{t('games.lastUpdatedLabel')}:</span>
                  <p className="font-medium">{formatDateTime(game.updatedAt)}</p>
                </div>
              )}
              
              <div>
                <span className="text-muted-foreground">{t('games.gameIdLabel')}:</span>
                <p className="font-mono text-xs break-all">{game._id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}