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
  ExternalLink, 
  Layers, 
  Trophy, 
  Target, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Users,
  Swords,
  Shield,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { decksAPI, statsAPI, gamesAPI } from '@/lib/api';

const colorMap: { [key: string]: { name: string; color: string } } = {
  'W': { name: 'White', color: 'bg-yellow-100 text-yellow-800' },
  'U': { name: 'Blue', color: 'bg-blue-100 text-blue-800' },
  'B': { name: 'Black', color: 'bg-gray-100 text-gray-800' },
  'R': { name: 'Red', color: 'bg-red-100 text-red-800' },
  'G': { name: 'Green', color: 'bg-green-100 text-green-800' },
};

interface Deck {
  _id: string;
  name: string;
  commander: string;
  decklistLink?: string;
  deckImage?: string;
  colorIdentity?: string[];
  tags?: string[];
  owner: {
    _id: string;
    name: string;
    nickname?: string;
    profileImage?: string;
  };
  createdAt: string;
}

interface DeckMatchup {
  opponentDeck: {
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
  };
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: string;
  averagePositionDifference: string;
}

interface DeckStats {
  gamesPlayed: number;
  wins: number;
  winRate: number;
  averagePlacement: number;
  bestPlacement: number;
  worstPlacement: number;
  recentGames: Array<{
    _id: string;
    date: string;
    placement: number;
    players: Array<{
      player: {
        _id: string;
        name: string;
        nickname?: string;
      };
      deck: {
        _id: string;
        name: string;
        commander: string;
      };
      placement: number;
    }>;
    durationMinutes?: number;
  }>;
  matchups: DeckMatchup[];
  winRateVsDecks: Array<{
    opponentDeck: {
      _id: string;
      name: string;
      commander: string;
      owner: {
        name: string;
        nickname?: string;
      };
    };
    gamesPlayed: number;
    wins: number;
    winRate: number;
  }>;
  monthlyPerformance: Array<{
    month: string;
    gamesPlayed: number;
    wins: number;
    winRate: number;
  }>;
}

export default function DeckPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useParams();
  const deckId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState<DeckStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDeckAndStats = async () => {
      try {
        // Fetch deck details and stats in parallel
        const [deckResponse, statsResponse] = await Promise.all([
          decksAPI.getById(deckId),
          statsAPI.getDeckStats(deckId)
        ]);

        const deckData = deckResponse.data.data || deckResponse.data;
        const statsResponse_data = statsResponse.data.data || statsResponse.data;

        setDeck(deckData);
        // Handle the stats API structure properly
        if (statsResponse_data && statsResponse_data.statistics) {
          setStats({
            gamesPlayed: statsResponse_data.statistics.totalGames || 0,
            wins: statsResponse_data.statistics.wins || 0,
            winRate: statsResponse_data.statistics.winRate || 0,
            averagePlacement: statsResponse_data.statistics.averagePlacement || 0,
            bestPlacement: statsResponse_data.statistics.placementDistribution && 
              Object.keys(statsResponse_data.statistics.placementDistribution).length > 0 ? 
              Math.min(...Object.keys(statsResponse_data.statistics.placementDistribution).map(Number)) : 0,
            worstPlacement: statsResponse_data.statistics.placementDistribution && 
              Object.keys(statsResponse_data.statistics.placementDistribution).length > 0 ? 
              Math.max(...Object.keys(statsResponse_data.statistics.placementDistribution).map(Number)) : 0,
            recentGames: statsResponse_data.recentGames || [],
            matchups: statsResponse_data.matchups || [],
            winRateVsDecks: [],
            monthlyPerformance: []
          });
        }
      } catch (error: any) {
        console.error('Error fetching deck data:', error);
        setError('Failed to load deck information');
      } finally {
        setLoading(false);
      }
    };

    if (deckId) {
      fetchDeckAndStats();
    }
  }, [deckId]);

  // Check permissions
  const canEdit = user && deck && (user.isAdmin || user.id === deck.owner._id);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {error || t('decks.deckNotFound')}
          </p>
          <Link href="/decks">
            <Button>{t('decks.backToDecks')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlacementBadge = (placement: number) => {
    const colors = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      2: 'bg-gray-100 text-gray-800 border-gray-300',
      3: 'bg-amber-100 text-amber-800 border-amber-300',
    };
    
    return (
      <Badge variant="outline" className={colors[placement as keyof typeof colors] || 'bg-slate-100 text-slate-800'}>
        {placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : placement}
        {placement === 1 ? ' Winner' : ` ${placement}${placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th'}`}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/decks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          {deck.deckImage ? (
            <div className="w-full max-w-sm h-64 rounded-lg mb-4 bg-cover bg-center mx-auto md:mx-0 md:float-right md:ml-8 md:mb-0" 
                 style={{ backgroundImage: `url(${deck.deckImage})` }} />
          ) : (
            <div className="w-full max-w-sm h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center mx-auto md:mx-0 md:float-right md:ml-8 md:mb-0">
              <Layers className="h-16 w-16 text-white" />
            </div>
          )}
          
          <div>
            <h1 className="text-4xl font-bold mb-2">{deck.name}</h1>
            <p className="text-xl text-muted-foreground mb-4">{deck.commander}</p>
            
            {/* Owner */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={deck.owner.profileImage} alt={deck.owner.name} />
                <AvatarFallback>
                  {deck.owner.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                {t('decks.ownedBy')} <strong>{deck.owner.nickname || deck.owner.name}</strong>
              </span>
            </div>

            {/* Color Identity */}
            {deck.colorIdentity && deck.colorIdentity.length > 0 && (
              <div className="flex gap-2 mb-4">
                {deck.colorIdentity.map(color => (
                  <Badge
                    key={color}
                    variant="outline"
                    className={colorMap[color]?.color || 'bg-gray-100 text-gray-800'}
                  >
                    {color} - {colorMap[color]?.name || color}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tags */}
            {deck.tags && deck.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {deck.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mb-6">
              {deck.decklistLink && (
                <Button variant="outline" asChild>
                  <a href={deck.decklistLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('decks.viewDecklist')}
                  </a>
                </Button>
              )}
              {canEdit && (
                <Button asChild>
                  <Link href={`/decks/${deck._id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('decks.editDeck')}
                  </Link>
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {t('decks.createdOn')} {formatDate(deck.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="space-y-8">
          {/* Overview Stats */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              {t('decks.performanceOverview')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl">{stats?.gamesPlayed || 0}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    {t('decks.gamesPlayedStat')}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl">{stats?.wins || 0}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {t('decks.totalWins')}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl text-green-600">{stats?.winRate || 0}%</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <Target className="h-4 w-4" />
                    {t('decks.winRateStat')}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl">{stats?.averagePlacement?.toFixed(1) || 'N/A'}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {t('decks.avgPlacement')}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Deck Matchups */}
          {stats?.matchups && stats.matchups.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Swords className="h-6 w-6" />
                {t('decks.deckMatchups')}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {stats.matchups.map((matchup) => (
                  <Card key={matchup.opponentDeck._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {matchup.opponentDeck.deckImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={matchup.opponentDeck.deckImage}
                                alt={matchup.opponentDeck.commander}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                                <Layers className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{matchup.opponentDeck.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {matchup.opponentDeck.commander}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {matchup.opponentDeck.owner.nickname || matchup.opponentDeck.owner.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={parseFloat(matchup.winRate) >= 50 ? "default" : "destructive"}>
                              {matchup.winRate}% WR
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {matchup.wins}W - {matchup.losses}L ({matchup.gamesPlayed} games)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Avg position diff: {parseFloat(matchup.averagePositionDifference) > 0 ? '+' : ''}{matchup.averagePositionDifference}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Games */}
          {stats?.recentGames && stats.recentGames.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6" />
                {t('decks.recentGames')}
              </h2>
              <div className="space-y-4">
                {stats.recentGames.slice(0, 5).map((game) => (
                  <Card key={game._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(game.date)}
                          </span>
                          {game.durationMinutes && (
                            <span className="text-sm text-muted-foreground">
                              • {game.durationMinutes} {t('decks.minutes')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getPlacementBadge(game.placement)}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/games/${game._id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              {t('decks.view')}
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="font-medium mb-2">{t('decks.gameDetails')}</p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <div>
                              <span className="font-medium">
                                {(game as any).player?.nickname || (game as any).player?.name || t('decks.unknownPlayer')}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {(game as any).playerCount ? `${(game as any).playerCount} ${t('decks.playersTotal')}` : t('decks.gameDetails')}
                              </p>
                            </div>
                            {getPlacementBadge(game.placement)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Matchup Data */}
          {stats?.winRateVsDecks && stats.winRateVsDecks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Swords className="h-6 w-6" />
                {t('decks.matchupsVsOtherDecks')}
              </h2>
              <div className="space-y-3">
                {stats?.winRateVsDecks
                  .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
                  .map((matchup) => (
                  <Card key={matchup.opponentDeck._id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{matchup.opponentDeck.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {matchup.opponentDeck.commander} • 
                            {matchup.opponentDeck.owner.nickname || matchup.opponentDeck.owner.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">{matchup.gamesPlayed}</p>
                              <p className="text-xs text-muted-foreground">{t('decks.gamesColumn')}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">{matchup.wins}</p>
                              <p className="text-xs text-muted-foreground">{t('decks.winsColumn')}</p>
                            </div>
                            <div className="text-center">
                              <Badge 
                                variant={matchup.winRate >= 50 ? "default" : "secondary"}
                                className={matchup.winRate >= 50 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {matchup.winRate >= 50 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                {matchup.winRate}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Performance */}
          {stats?.monthlyPerformance && stats.monthlyPerformance.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                {t('decks.monthlyPerformance')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats?.monthlyPerformance
                  .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
                  .slice(0, 6)
                  .map((month) => (
                  <Card key={month.month}>
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">
                        {new Date(month.month).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex justify-between">
                          <span>{t('decks.gamesColumn')}:</span>
                          <span>{month.gamesPlayed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('decks.winsColumn')}:</span>
                          <span>{month.wins}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>{t('decks.winRateStat')}:</span>
                          <span className={month.winRate >= 50 ? "text-green-600" : "text-red-600"}>
                            {month.winRate}%
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats?.gamesPlayed === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('decks.noGamesRecorded')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('decks.noGamesYet')}
                </p>
                <Button asChild>
                  <Link href="/games/new">{t('decks.recordAGame')}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}