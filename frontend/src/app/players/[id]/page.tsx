'use client';

import { useAuth } from '@/context/AuthContext';
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
  Target, 
  TrendingUp,
  Calendar,
  User,
  Mail,
  Crown,
  Gamepad2,
  Clock,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { playersAPI, statsAPI } from '@/lib/api';

interface Player {
  _id: string;
  name: string;
  nickname?: string;
  email: string;
  profileImage?: string;
  isAdmin: boolean;
  createdAt: string;
}

interface PlayerMatchup {
  opponent: {
    _id: string;
    name: string;
    nickname?: string;
    profileImage?: string;
  } | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: string;
  averagePositionDifference: string;
  headToHeadWins: number;
}

interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  winRate: number;
  averagePlacement: number;
  bestPlacement: number;
  worstPlacement: number;
  matchups: PlayerMatchup[];
  favoriteCommanders: Array<{
    commander: string;
    gamesPlayed: number;
    wins: number;
    winRate: number;
  }>;
  recentGames: Array<{
    _id: string;
    date: string;
    placement: number;
    deck: {
      _id: string;
      name: string;
      commander: string;
    } | null;
    totalPlayers: number;
    durationMinutes?: number;
  }>;
  monthlyPerformance: Array<{
    month: string;
    gamesPlayed: number;
    wins: number;
    winRate: number;
  }>;
  eliminationStats?: {
    playersEliminated: Array<{
      player: { _id: string; name: string; nickname?: string; profileImage?: string } | null;
      count: number;
    }>;
    eliminatedBy: Array<{
      player: { _id: string; name: string; nickname?: string; profileImage?: string } | null;
      count: number;
    }>;
  };
}

export default function PlayerDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const playerId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPlayerAndStats = async () => {
      try {
        // Fetch player details and stats in parallel
        const [playerResponse, statsResponse] = await Promise.all([
          playersAPI.getById(playerId),
          statsAPI.getPlayerStats(playerId)
        ]);

        const playerData = playerResponse.data.data || playerResponse.data;
        const statsResponse_data = statsResponse.data.data || statsResponse.data;

        setPlayer(playerData);
        
        // Map the backend response structure to frontend interface
        if (statsResponse_data && statsResponse_data.statistics) {
          const mappedStats: PlayerStats = {
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
            matchups: statsResponse_data.matchups || [],
            favoriteCommanders: [],
            recentGames: (statsResponse_data.recentGames || []).map((game: any) => ({
              _id: game._id,
              date: game.date,
              placement: game.placement,
              deck: game.deck,
              totalPlayers: game.playerCount || 0,
              durationMinutes: game.durationMinutes
            })),
            monthlyPerformance: [],
            eliminationStats: statsResponse_data.eliminationStats
          };

          // Extract favorite commanders from deckUsage
          if (statsResponse_data.deckUsage && statsResponse_data.deckUsage.length > 0) {
            mappedStats.favoriteCommanders = statsResponse_data.deckUsage.map((deck: any) => ({
              commander: deck.deck?.commander || 'Unknown Commander',
              gamesPlayed: deck.gamesPlayed || 0,
              wins: deck.wins || 0,
              winRate: parseFloat(deck.winRate) || 0
            }));
          }

          setStats(mappedStats);
        } else {
          setStats(null);
        }
      } catch (error: any) {
        console.error('Error fetching player data:', error);
        setError('Failed to load player information');
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchPlayerAndStats();
    }
  }, [playerId]);

  // Check permissions
  const canEdit = user && player && (user.isAdmin || user.id === player._id);
  const isViewingSelf = user && player && user.id === player._id;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {error || 'Player not found'}
          </p>
          <Link href="/players">
            <Button>Back to Players</Button>
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
        <Link href="/players">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="w-32 h-32 mx-auto md:mx-0">
              <AvatarImage src={player.profileImage} alt={player.name} />
              <AvatarFallback className="text-4xl">
                {player.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {player.nickname || player.name}
                    {player.isAdmin && (
                      <Crown className="inline h-8 w-8 ml-3 text-yellow-500" />
                    )}
                  </h1>
                  {player.nickname && (
                    <p className="text-xl text-muted-foreground mb-2">{player.name}</p>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {player.email}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(player.createdAt)}
                    </span>
                  </div>
                </div>
                
                {canEdit && (
                  <Button asChild className="mt-4 md:mt-0">
                    <Link href={`/players/${player._id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isViewingSelf ? 'Edit Profile' : 'Edit Player'}
                    </Link>
                  </Button>
                )}
              </div>
              
              {player.isAdmin && (
                <Badge variant="secondary" className="mb-4">
                  <Crown className="h-3 w-3 mr-1" />
                  Administrator
                </Badge>
              )}
            </div>
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
              Performance Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl">{stats.gamesPlayed}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <Gamepad2 className="h-4 w-4" />
                    Games Played
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl">{stats.wins}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Total Wins
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl text-green-600">{stats.winRate}%</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <Target className="h-4 w-4" />
                    Win Rate
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl">{stats.averagePlacement?.toFixed(1) || 'N/A'}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Avg. Placement
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Player Matchups */}
          {stats.matchups && stats.matchups.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <User className="h-6 w-6" />
                Player Matchups
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {stats.matchups.filter(m => m.opponent).map((matchup, index) => (
                  <Card key={matchup.opponent?._id || `matchup-${index}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={matchup.opponent?.profileImage} />
                            <AvatarFallback>
                              {(matchup.opponent?.nickname || matchup.opponent?.name)?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {matchup.opponent?.nickname || matchup.opponent?.name || 'Deleted Player'}
                            </h3>
                            {matchup.opponent?.nickname && (
                              <p className="text-sm text-muted-foreground">
                                {matchup.opponent.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={parseFloat(matchup.winRate) >= 50 ? "default" : "destructive"}>
                              {matchup.winRate}% WR
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {matchup.headToHeadWins}W - {matchup.gamesPlayed - matchup.headToHeadWins}L ({matchup.gamesPlayed} games)
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

          {/* Elimination Statistics */}
          {stats.eliminationStats && (stats.eliminationStats.playersEliminated.length > 0 || stats.eliminationStats.eliminatedBy.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Players Eliminated */}
              {stats.eliminationStats.playersEliminated.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-red-500" />
                      Most Eliminated
                    </CardTitle>
                    <CardDescription>Players this player eliminates most often</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.eliminationStats.playersEliminated.filter(s => s.player).map((stat, index) => (
                        <div key={stat.player?._id || `elim-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={stat.player?.profileImage} />
                              <AvatarFallback>
                                {(stat.player?.nickname || stat.player?.name)?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm">
                              {stat.player?.nickname || stat.player?.name || 'Deleted Player'}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {stat.count} {stat.count === 1 ? 'elimination' : 'eliminations'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Eliminated By */}
              {stats.eliminationStats.eliminatedBy.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Eliminated By
                    </CardTitle>
                    <CardDescription>Players who eliminate this player most often</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.eliminationStats.eliminatedBy.filter(s => s.player).map((stat, index) => (
                        <div key={stat.player?._id || `by-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={stat.player?.profileImage} />
                              <AvatarFallback>
                                {(stat.player?.nickname || stat.player?.name)?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm">
                              {stat.player?.nickname || stat.player?.name || 'Deleted Player'}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {stat.count} {stat.count === 1 ? 'time' : 'times'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Favorite Commanders */}
          {stats.favoriteCommanders && stats.favoriteCommanders.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Crown className="h-6 w-6" />
                Favorite Commanders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.favoriteCommanders.slice(0, 6).map((commander, index) => (
                  <Card key={commander.commander}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{commander.commander}</h4>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Most Played
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{commander.gamesPlayed}</p>
                          <p className="text-xs text-muted-foreground">Games</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{commander.wins}</p>
                          <p className="text-xs text-muted-foreground">Wins</p>
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold ${commander.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {commander.winRate}%
                          </p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Games */}
          {stats.recentGames && stats.recentGames.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Recent Games
              </h2>
              <div className="space-y-4">
                {stats.recentGames.slice(0, 5).map((game) => (
                  <Card key={game._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(game.date)}
                            </span>
                          </div>
                          {game.durationMinutes && (
                            <span className="text-sm text-muted-foreground">
                              • {game.durationMinutes} minutes
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            • {game.totalPlayers} players
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPlacementBadge(game.placement)}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/games/${game._id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Played with:</p>
                          <p className="font-medium">{game.deck?.name || 'Deleted Deck'}</p>
                          <p className="text-sm text-muted-foreground">({game.deck?.commander || 'Unknown Commander'})</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Performance */}
          {stats.monthlyPerformance && stats.monthlyPerformance.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Monthly Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.monthlyPerformance
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
                          <span>Games:</span>
                          <span>{month.gamesPlayed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wins:</span>
                          <span>{month.wins}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Win Rate:</span>
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
          {stats.gamesPlayed === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Games Played Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isViewingSelf 
                    ? "You haven't played any games yet. Join or create a game to start tracking your performance!"
                    : `${player.nickname || player.name} hasn't played any games yet.`
                  }
                </p>
                {isViewingSelf && (
                  <Button asChild>
                    <Link href="/games/new">Record a Game</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}