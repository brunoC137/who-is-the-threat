'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Package, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { statsAPI } from '@/lib/api';

interface GlobalStats {
  totalPlayers: number;
  totalDecks: number;
  totalGames: number;
  topPlayers: Array<{
    _id: string;
    name: string;
    nickname?: string;
    profileImage?: string;
    gamesPlayed: number;
    wins: number;
    winRate: number;
    averagePlacement: number;
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
    gamesPlayed: number;
    wins: number;
    winRate: number;
  }>;
  recentActivity: Array<{
    type: 'game' | 'deck' | 'player';
    description: string;
    date: string;
  }>;
}

interface UserStats {
  personalStats: {
    totalDecks: number;
    totalGames: number;
    wins: number;
    winRate: number;
  };
  topUserDecks: Array<{
    _id: string;
    name: string;
    commander: string;
    deckImage?: string;
    owner: {
      name: string;
      nickname?: string;
    };
    gamesPlayed: number;
    wins: number;
    winRate: number;
  }>;
  recentUserGames: Array<{
    _id: string;
    date: string;
    players: Array<{
      player: { name: string; nickname: string };
      deck: { name: string; commander: string };
      placement: number;
    }>;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch both global and user-specific stats
        const [globalResponse, userResponse] = await Promise.all([
          statsAPI.getGlobalStats(),
          statsAPI.getDashboardStats()
        ]);

        const globalResult = globalResponse.data;
        setGlobalStats(globalResult.data || globalResult);

        const userResult = userResponse.data;
        setUserStats(userResult.data || userResult);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Guerreiros do Segundo Lugar</h1>
          <p className="text-muted-foreground mb-6">Please log in to access your dashboard</p>
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Welcome Header with Gradient */}
      <div className="mb-8 relative overflow-hidden rounded-xl p-8 animated-gradient">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">
            Welcome back, {user.nickname || user.name}!
          </h1>
          <p className="text-white/90 text-lg">
            Track your Commander games and see how you stack up against your friends.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/games/new" className="group">
          <div className="h-24 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 transition-all duration-300 hover:shadow-glow-lg hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Record New Game</h3>
                <p className="text-sm text-white/80">Track your latest match</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/decks/new" className="group">
          <div className="h-24 rounded-xl bg-gradient-to-br from-accent to-accent/80 p-6 transition-all duration-300 hover:shadow-glow-accent hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Add New Deck</h3>
                <p className="text-sm text-white/80">Build your arsenal</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/players" className="group">
          <div className="h-24 rounded-xl bg-gradient-to-br from-success to-success/80 p-6 transition-all duration-300 hover:shadow-glow-md hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">View All Players</h3>
                <p className="text-sm text-white/80">Check the leaderboard</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{globalStats?.totalPlayers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active players</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-accent/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Decks</CardTitle>
            <div className="p-2 rounded-lg bg-accent/10">
              <Package className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{userStats?.personalStats?.totalDecks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Decks in your collection</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-warning/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Games</CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{userStats?.personalStats?.totalGames || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Games you&apos;ve played</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-success/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Win Rate</CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              (userStats?.personalStats?.winRate || 0) >= 40 ? 'text-success' :
              (userStats?.personalStats?.winRate || 0) >= 25 ? 'text-warning' :
              'text-destructive'
            }`}>
              {userStats?.personalStats?.winRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your personal win rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games & Top Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Your Recent Games */}
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Your Recent Games
            </CardTitle>
            <CardDescription>Your latest Commander matches</CardDescription>
          </CardHeader>
          <CardContent>
            {userStats?.recentUserGames && userStats.recentUserGames.length > 0 ? (
              <div className="space-y-3">
                {userStats.recentUserGames.slice(0, 5).map((game) => (
                  <div key={game._id} className="group relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-glow-sm hover:-translate-y-0.5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {new Date(game.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {game.players.length} players
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Trophy className="h-4 w-4 text-warning" />
                          <p className="text-sm font-medium text-foreground">
                            {game.players.find(p => p.placement === 1)?.player.nickname}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {game.players.find(p => p.placement === 1)?.deck.commander}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No games recorded yet</p>
                <Link href="/games/new">
                  <Button size="sm" className="shadow-glow-sm">Record Your First Game</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Top Performing Decks */}
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Your Top Performing Decks
            </CardTitle>
            <CardDescription>Your most successful commanders</CardDescription>
          </CardHeader>
          <CardContent>
            {userStats?.topUserDecks && userStats.topUserDecks.length > 0 ? (
              <div className="space-y-3">
                {userStats.topUserDecks.slice(0, 5).map((deck, index) => (
                  <div key={deck._id} className="group relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 p-4 transition-all duration-300 hover:border-accent/50 hover:shadow-glow-sm hover:-translate-y-0.5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-warning to-warning/80 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{deck.name}</p>
                          <p className="text-xs text-muted-foreground">{deck.commander}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          deck.winRate >= 50 ? 'text-success' :
                          deck.winRate >= 30 ? 'text-warning' :
                          'text-muted-foreground'
                        }`}>
                          {deck.winRate}% WR
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deck.gamesPlayed} games
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No decks added yet</p>
                <Link href="/decks/new">
                  <Button size="sm" className="shadow-glow-sm">Add Your First Deck</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Recent Games & Top Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Recent Games */}
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-success" />
              Recent Games (All Players)
            </CardTitle>
            <CardDescription>Latest games from the entire playgroup</CardDescription>
          </CardHeader>
          <CardContent>
            {globalStats?.recentActivity && globalStats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {globalStats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 p-4 transition-all duration-300 hover:border-success/50 hover:shadow-glow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No games recorded yet</p>
                <Link href="/games/new">
                  <Button size="sm" className="shadow-glow-sm">Record Your First Game</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Top Performing Decks */}
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-warning" />
              Top Performing Decks (All Players)
            </CardTitle>
            <CardDescription>Most successful commanders across all players</CardDescription>
          </CardHeader>
          <CardContent>
            {globalStats?.topDecks && globalStats.topDecks.length > 0 ? (
              <div className="space-y-3">
                {globalStats.topDecks.slice(0, 5).map((deck, index) => (
                  <div key={deck._id} className="group relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 p-4 transition-all duration-300 hover:border-warning/50 hover:shadow-glow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-warning to-warning/80 text-white shadow-glow-sm' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{deck.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {deck.commander} • {deck.owner?.nickname || deck.owner?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          deck.winRate >= 50 ? 'text-success' :
                          deck.winRate >= 30 ? 'text-warning' :
                          'text-muted-foreground'
                        }`}>
                          {deck.winRate}% WR
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deck.gamesPlayed} games
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No decks added yet</p>
                <Link href="/decks/new">
                  <Button size="sm" className="shadow-glow-sm">Add Your First Deck</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}