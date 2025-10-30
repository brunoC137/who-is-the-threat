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
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.nickname || user.name}!
        </h1>
        <p className="text-muted-foreground">
          Track your Commander games and see how you stack up against your friends.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/games/new">
          <Button className="w-full h-20 text-lg">
            <Plus className="mr-2 h-6 w-6" />
            Record New Game
          </Button>
        </Link>
        <Link href="/decks/new">
          <Button variant="outline" className="w-full h-20 text-lg">
            <Package className="mr-2 h-6 w-6" />
            Add New Deck
          </Button>
        </Link>
        <Link href="/players">
          <Button variant="outline" className="w-full h-20 text-lg">
            <Users className="mr-2 h-6 w-6" />
            View All Players
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalPlayers || 0}</div>
            <p className="text-xs text-muted-foreground">Active players</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Decks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.personalStats?.totalDecks || 0}</div>
            <p className="text-xs text-muted-foreground">Decks in your collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Games</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.personalStats?.totalGames || 0}</div>
            <p className="text-xs text-muted-foreground">Games you&apos;ve played</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.personalStats?.winRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Your personal win rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games & Top Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Your Recent Games */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Games</CardTitle>
            <CardDescription>Your latest Commander matches</CardDescription>
          </CardHeader>
          <CardContent>
            {userStats?.recentUserGames && userStats.recentUserGames.length > 0 ? (
              <div className="space-y-4">
                {userStats.recentUserGames.slice(0, 5).map((game) => (
                  <div key={game._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">
                        {new Date(game.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {game.players.length} players
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Winner: {game.players.find(p => p.placement === 1)?.player.nickname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {game.players.find(p => p.placement === 1)?.deck.commander}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No games recorded yet</p>
                <Link href="/games/new">
                  <Button size="sm">Record Your First Game</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Top Performing Decks */}
        <Card>
          <CardHeader>
            <CardTitle>Your Top Performing Decks</CardTitle>
            <CardDescription>Your most successful commanders</CardDescription>
          </CardHeader>
          <CardContent>
            {userStats?.topUserDecks && userStats.topUserDecks.length > 0 ? (
              <div className="space-y-4">
                {userStats.topUserDecks.slice(0, 5).map((deck) => (
                  <div key={deck._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{deck.name}</p>
                      <p className="text-xs text-muted-foreground">{deck.commander}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{deck.winRate}% WR</p>
                      <p className="text-xs text-muted-foreground">
                        {deck.gamesPlayed} games
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No decks added yet</p>
                <Link href="/decks/new">
                  <Button size="sm">Add Your First Deck</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Recent Games & Top Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Recent Games */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Games (All Players)</CardTitle>
            <CardDescription>Latest games from the entire playgroup</CardDescription>
          </CardHeader>
          <CardContent>
            {globalStats?.recentActivity && globalStats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {globalStats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No games recorded yet</p>
                <Link href="/games/new">
                  <Button size="sm">Record Your First Game</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Top Performing Decks */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Decks (All Players)</CardTitle>
            <CardDescription>Most successful commanders across all players</CardDescription>
          </CardHeader>
          <CardContent>
            {globalStats?.topDecks && globalStats.topDecks.length > 0 ? (
              <div className="space-y-4">
                {globalStats.topDecks.slice(0, 5).map((deck) => (
                  <div key={deck._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{deck.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deck.commander} • {deck.owner?.nickname || deck.owner?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{deck.winRate}% WR</p>
                      <p className="text-xs text-muted-foreground">
                        {deck.gamesPlayed} games
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No decks added yet</p>
                <Link href="/decks/new">
                  <Button size="sm">Add Your First Deck</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}