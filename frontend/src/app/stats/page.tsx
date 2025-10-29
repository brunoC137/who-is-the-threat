'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
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
          const data = await response.json();
          setStats(data);
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
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Statistics</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics for your Commander playgroup
        </p>
      </div>

      {/* Global Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGames || 0}</div>
            <p className="text-xs text-muted-foreground">Commander matches played</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPlayers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered players</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDecks || 0}</div>
            <p className="text-xs text-muted-foreground">Unique deck builds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Game Length</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageGameLength || 0}m</div>
            <p className="text-xs text-muted-foreground">Average duration</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Players Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Players
            </CardTitle>
            <CardDescription>Highest win rates among active players</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topPlayers && stats.topPlayers.length > 0 ? (
              <div className="space-y-4">
                {stats.topPlayers.map((player, index) => (
                  <div key={player._id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Badge 
                      variant={index === 0 ? "default" : "outline"}
                      className={
                        index === 0 
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300 min-w-[2rem] justify-center" 
                          : "min-w-[2rem] justify-center"
                      }
                    >
                      #{index + 1}
                    </Badge>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={player.profileImage} alt={player.name} />
                      <AvatarFallback>
                        {player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{player.nickname || player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.wins} wins • {player.gamesPlayed} games
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{player.winRate}%</p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No player stats available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Popular Commanders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              Popular Commanders
            </CardTitle>
            <CardDescription>Most played commanders in the meta</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.mostPopularCommanders && stats.mostPopularCommanders.length > 0 ? (
              <div className="space-y-4">
                {stats.mostPopularCommanders.map((commander, index) => (
                  <div key={commander.commander} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="min-w-[2rem] justify-center">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{commander.commander}</p>
                        <p className="text-sm text-muted-foreground">
                          {commander.count} deck{commander.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{commander.winRate}%</p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Crown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No commander data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Decks */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Top Performing Decks
          </CardTitle>
          <CardDescription>Highest win rate decks across all players</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.topDecks && stats.topDecks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topDecks.map((deck, index) => (
                <div key={deck._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={index < 3 ? "default" : "outline"}
                      className={
                        index === 0 
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
                          : index === 1 
                          ? "bg-gray-100 text-gray-800 border-gray-300"
                          : index === 2
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : ""
                      }
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-bold text-lg">{deck.winRate}%</span>
                  </div>
                  <h3 className="font-semibold">{deck.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{deck.commander}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {deck.owner.nickname || deck.owner.name}</span>
                    <span>{deck.wins}/{deck.gamesPlayed} wins</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No deck performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates in your playgroup</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border-l-2 border-muted pl-4">
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}