'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users,
  Layers,
  Crown,
  BarChart3,
  Calendar
} from 'lucide-react';

interface GlobalStats {
  totalGames: number;
  totalPlayers: number;
  totalDecks: number;
  averageGameLength: number;
  mostPopularCommanders: Array<{
    commander: string;
    count: number;
    winRate: number;
  }>;
  topPlayers: Array<{
    _id: string;
    name: string;
    nickname?: string;
    profileImage?: string;
    wins: number;
    gamesPlayed: number;
    winRate: number;
  }>;
  topDecks: Array<{
    _id: string;
    name: string;
    commander: string;
    deckImage?: string;
    owner: {
      name: string;
      nickname?: string;
    };
    wins: number;
    gamesPlayed: number;
    winRate: number;
  }>;
  recentActivity: Array<{
    type: 'game' | 'deck' | 'player';
    description: string;
    date: string;
  }>;
}

export default function StatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/global`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setStats(result.data || result);
        }
      } catch (error) {
        console.error('Error fetching global stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStats();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Statistics</h1>
          <p className="text-gray-400 text-lg">
            Comprehensive analytics for your Commander playgroup
          </p>
        </div>

      {/* Global Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Games */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
          <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Games</CardTitle>
              <Trophy className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.totalGames || 0}</div>
              <p className="text-xs text-gray-400">Commander matches played</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Players */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
          <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Players</CardTitle>
              <Users className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.totalPlayers || 0}</div>
              <p className="text-xs text-gray-400">Registered players</p>
            </CardContent>
          </Card>
        </div>

        {/* Total Decks */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
          <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Decks</CardTitle>
              <Layers className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.totalDecks || 0}</div>
              <p className="text-xs text-gray-400">Unique deck builds</p>
            </CardContent>
          </Card>
        </div>

        {/* Avg Game Length */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
          <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Avg Game Length</CardTitle>
              <BarChart3 className="h-5 w-5 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.averageGameLength || 0}m</div>
              <p className="text-xs text-gray-400">Average duration</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Players Leaderboard */}
        <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Top Players
            </CardTitle>
            <CardDescription className="text-gray-400">Highest win rates among active players</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topPlayers && stats.topPlayers.length > 0 ? (
              <div className="space-y-4">
                {stats.topPlayers.map((player, index) => (
                  <div key={player._id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <Badge 
                      className={
                        index === 0 
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg min-w-[2rem] justify-center" 
                          : index === 1
                          ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 min-w-[2rem] justify-center"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 min-w-[2rem] justify-center"
                          : "bg-slate-600 text-gray-300 border-0 min-w-[2rem] justify-center"
                      }
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </Badge>
                    <Avatar className="w-12 h-12 ring-2 ring-slate-600">
                      <AvatarImage src={player.profileImage} alt={player.name || 'Player'} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {player.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-white">{player.nickname || player.name || 'Unknown Player'}</p>
                      <p className="text-sm text-gray-400">
                        {player.wins} wins • {player.gamesPlayed} games
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-white">{Math.round(player.winRate)}%</p>
                      <p className="text-xs text-gray-400">Win Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full opacity-20"></div>
                  <Users className="h-12 w-12 text-gray-500 mx-auto mt-4" />
                </div>
                <p className="text-gray-400 text-lg mb-2">No player stats available</p>
                <p className="text-gray-500 text-sm">Start playing games to see leaderboards!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Popular Commanders */}
        <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Crown className="h-5 w-5 text-purple-400" />
              Popular Commanders
            </CardTitle>
            <CardDescription className="text-gray-400">Most played commanders in the meta</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.mostPopularCommanders && stats.mostPopularCommanders.length > 0 ? (
              <div className="space-y-4">
                {stats.mostPopularCommanders.map((commander, index) => (
                  <div key={commander.commander} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-600/80 text-white border-0 min-w-[2rem] justify-center">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-white">{commander.commander}</p>
                        <p className="text-sm text-gray-400">
                          {commander.count} deck{commander.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{commander.winRate}%</p>
                      <p className="text-xs text-gray-400">Win Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-20"></div>
                  <Crown className="h-12 w-12 text-gray-500 mx-auto mt-4" />
                </div>
                <p className="text-gray-400 text-lg mb-2">No commander data available</p>
                <p className="text-gray-500 text-sm">Create decks to see popular commanders!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Decks */}
      <Card className="mb-8 bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-green-400" />
            Top Performing Decks
          </CardTitle>
          <CardDescription className="text-gray-400">Highest win rate decks across all players</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.topDecks && stats.topDecks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.topDecks.map((deck, index) => (
                <div 
                  key={deck._id} 
                  onClick={() => router.push(`/decks/${deck._id}`)}
                  className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  {/* Background Image */}
                  <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                    {deck.deckImage ? (
                      <>
                        {/* Deck Image Background */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${deck.deckImage})` }}
                        />
                        {/* Dark Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </>
                    ) : (
                      /* Fallback Gradient Background */
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20" />
                    )}
                    
                    {/* Glowing Border Effect */}
                    <div className={`absolute -inset-0.5 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-300 ${
                      index === 0 
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500" 
                        : index === 1 
                        ? "bg-gradient-to-r from-gray-300 to-gray-500"
                        : index === 2
                        ? "bg-gradient-to-r from-orange-400 to-red-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-600"
                    }`} />
                    
                    {/* Content Overlay */}
                    <div className="relative h-full flex flex-col justify-between p-4">
                      {/* Top Section - Rank and Win Rate */}
                      <div className="flex items-start justify-between">
                        <Badge 
                          className={`${
                            index === 0 
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg" 
                              : index === 1 
                              ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0"
                              : index === 2
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
                              : "bg-slate-600/80 text-gray-200 border-0 backdrop-blur-sm"
                          } font-bold`}
                        >
                          {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                        </Badge>
                        <div className="text-right">
                          <span className="font-bold text-2xl text-white drop-shadow-lg">
                            {Math.round(deck.winRate)}%
                          </span>
                          <p className="text-xs text-gray-300 drop-shadow">Win Rate</p>
                        </div>
                      </div>

                      {/* Bottom Section - Deck Info */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-white drop-shadow-lg line-clamp-1">
                          {deck.name}
                        </h3>
                        <p className="text-sm text-gray-200 drop-shadow line-clamp-1">
                          {deck.commander}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-gray-300 drop-shadow">
                            by {deck.owner?.nickname || deck.owner?.name || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                            <span className="text-xs font-medium text-white">
                              {deck.wins}W-{deck.gamesPlayed - deck.wins}L
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full opacity-20"></div>
                <Target className="h-12 w-12 text-gray-500 mx-auto mt-4" />
              </div>
              <p className="text-gray-400 text-lg mb-2">No deck performance data available</p>
              <p className="text-gray-500 text-sm">Start playing games to see deck statistics!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-blue-400" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-gray-400">Latest updates in your playgroup</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border-l-2 border-blue-500/50 bg-slate-800/30 rounded-r-lg">
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-blue-600/80 text-white border-0 capitalize">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full opacity-20"></div>
                <Calendar className="h-12 w-12 text-gray-500 mx-auto mt-4" />
              </div>
              <p className="text-gray-400 text-lg mb-2">No recent activity</p>
              <p className="text-gray-500 text-sm">Activity will appear as you play games!</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}