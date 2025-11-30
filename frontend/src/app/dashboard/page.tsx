'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricInfo } from '@/components/MetricInfo';
import { Plus, Users, Package, Trophy, TrendingUp, Award, BarChart3, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    } | null;
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
    } | null;
    gamesPlayed: number;
    wins: number;
    winRate: number;
  }>;
  recentUserGames: Array<{
    _id: string;
    date: string;
    players: Array<{
      player: { name: string; nickname: string } | null;
      deck: { name: string; commander: string } | null;
      placement: number;
    }>;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [advancedMetrics, setAdvancedMetrics] = useState<{
    topByWeightedWinScore: Array<any>;
    topByBayesianTrueWinRate: Array<any>;
    topByDominanceIndex: Array<any>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        // Fetch global stats, user-specific stats, and advanced metrics
        const [globalResponse, userResponse, advancedResponse] = await Promise.all([
          statsAPI.getGlobalStats(),
          statsAPI.getDashboardStats(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/advanced-metrics`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const globalResult = globalResponse.data;
        setGlobalStats(globalResult.data || globalResult);

        const userResult = userResponse.data;
        setUserStats(userResult.data || userResult);

        if (advancedResponse.ok) {
          const advancedResult = await advancedResponse.json();
          setAdvancedMetrics(advancedResult.data || advancedResult);
        }
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
          <h1 className="text-2xl font-bold mb-4">{t('dashboard.welcomeToGuerreiros')}</h1>
          <p className="text-muted-foreground mb-6">{t('dashboard.pleaseLoginDashboard')}</p>
          <Link href="/login">
            <Button>{t('auth.login')}</Button>
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
            {t('dashboard.welcomeBack')}, {user.nickname || user.name}!
          </h1>
          <p className="text-white/90 text-lg">
            {t('dashboard.trackCommander')}
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
                <h3 className="text-lg font-semibold text-white">{t('dashboard.recordNewGame')}</h3>
                <p className="text-sm text-white/80">{t('dashboard.trackLatestMatch')}</p>
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
                <h3 className="text-lg font-semibold text-white">{t('dashboard.addNewDeck')}</h3>
                <p className="text-sm text-white/80">{t('dashboard.buildArsenal')}</p>
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
                <h3 className="text-lg font-semibold text-white">{t('dashboard.viewAllPlayers')}</h3>
                <p className="text-sm text-white/80">{t('dashboard.checkLeaderboard')}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.totalPlayers')}</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{globalStats?.totalPlayers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.activePlayers')}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-accent/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.yourDecks')}</CardTitle>
            <div className="p-2 rounded-lg bg-accent/10">
              <Package className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{userStats?.personalStats?.totalDecks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.decksInCollection')}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-warning/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.yourGames')}</CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{userStats?.personalStats?.totalGames || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.gamesYouPlayed')}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-glow-sm hover:border-success/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.yourWinRate')}</CardTitle>
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
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.personalWinRate')}</p>
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
              {t('dashboard.yourRecentGames')}
            </CardTitle>
            <CardDescription>{t('dashboard.latestMatches')}</CardDescription>
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
                          {game.players.length} {t('dashboard.players')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Trophy className="h-4 w-4 text-warning" />
                          <p className="text-sm font-medium text-foreground">
                            {game.players.find(p => p.placement === 1)?.player?.nickname || game.players.find(p => p.placement === 1)?.player?.name || (t('common.deletedPlayer') || 'Unknown')}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {game.players.find(p => p.placement === 1)?.deck?.commander || (t('common.deletedDeck') || 'Deleted Deck')}
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
              {t('dashboard.yourTopDecks')}
            </CardTitle>
            <CardDescription>{t('dashboard.mostSuccessful')}</CardDescription>
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
                          {deck.winRate}% {t('dashboard.wr')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deck.gamesPlayed} {t('dashboard.games')}
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
                <p className="text-muted-foreground mb-4">{t('dashboard.noDecksAdded')}</p>
                <Link href="/decks/new">
                  <Button size="sm" className="shadow-glow-sm">{t('dashboard.addFirstDeck')}</Button>
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
              {t('dashboard.allRecentGames')}
            </CardTitle>
            <CardDescription>{t('dashboard.entirePlaygroup')}</CardDescription>
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
                <p className="text-muted-foreground mb-4">{t('dashboard.noGamesRecorded')}</p>
                <Link href="/games/new">
                  <Button size="sm" className="shadow-glow-sm">{t('dashboard.recordFirstGame')}</Button>
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
              {t('dashboard.allTopDecks')}
            </CardTitle>
            <CardDescription>{t('dashboard.mostSuccessfulAll')}</CardDescription>
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
                          {deck.winRate}% {t('dashboard.wr')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deck.gamesPlayed} {t('dashboard.games')}
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
                <p className="text-muted-foreground mb-4">{t('dashboard.noDecksAdded')}</p>
                <Link href="/decks/new">
                  <Button size="sm" className="shadow-glow-sm">{t('dashboard.addFirstDeck')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Deck Metrics */}
      {advancedMetrics && (
        <div className="space-y-6 mt-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">Advanced Deck Metrics</h2>
            <p className="text-muted-foreground">Data-driven insights into deck performance beyond simple win rates</p>
          </div>

          {/* Weighted Win Score */}
          <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                Top Decks by Weighted Win Score
                <MetricInfo
                  title="Weighted Win Score (WWS)"
                  description="Represents decks that win a lot and are played frequently. Balances win quality with play frequency."
                  formula="(WinRate × GamesPlayed × 1.5)"
                />
              </CardTitle>
              <CardDescription>Decks that combine high win rates with frequent play</CardDescription>
            </CardHeader>
            <CardContent>
              {advancedMetrics.topByWeightedWinScore && advancedMetrics.topByWeightedWinScore.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {advancedMetrics.topByWeightedWinScore.slice(0, 6).map((deck, index) => (
                    <div
                      key={deck._id}
                      onClick={() => router.push(`/decks/${deck._id}`)}
                      className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105"
                    >
                      <div className="relative h-40 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                        {deck.deckImage ? (
                          <>
                            <div 
                              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                              style={{ backgroundImage: `url(${deck.deckImage})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
                        )}
                        
                        <div className="relative h-full flex flex-col justify-between p-4">
                          <div className="flex items-start justify-between">
                            <Badge className={`${
                              index === 0 ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg" :
                              index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0" :
                              index === 2 ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0" :
                              "bg-slate-600/80 text-gray-200 border-0 backdrop-blur-sm"
                            } font-bold`}>
                              #{index + 1}
                            </Badge>
                            <div className="text-right">
                              <span className="font-bold text-2xl text-blue-400 drop-shadow-lg">
                                {deck.weightedWinScore.toFixed(1)}
                              </span>
                              <p className="text-xs text-gray-300 drop-shadow">WWS</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="font-bold text-white drop-shadow-lg line-clamp-1">
                              {deck.name}
                            </h3>
                            <p className="text-sm text-gray-200 drop-shadow line-clamp-1">
                              {deck.commander}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-gray-300 drop-shadow">
                                by {deck.owner?.nickname || deck.owner?.name}
                              </span>
                              <span className="text-xs text-gray-300 drop-shadow bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                                {deck.gamesPlayed} games
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Award className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bayesian True Win Rate */}
          <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Top Decks by Bayesian Win Rate
                <MetricInfo
                  title="Bayesian True Win Rate (BTWR)"
                  description="A statistically adjusted win rate that accounts for sample size. Punishes decks with few games to provide more accurate comparisons."
                  formula="(Wins + 5) / (Games + 10) × 100"
                />
              </CardTitle>
              <CardDescription>Most statistically accurate win rate rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {advancedMetrics.topByBayesianTrueWinRate && advancedMetrics.topByBayesianTrueWinRate.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {advancedMetrics.topByBayesianTrueWinRate.slice(0, 6).map((deck, index) => (
                    <div
                      key={deck._id}
                      onClick={() => router.push(`/decks/${deck._id}`)}
                      className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105"
                    >
                      <div className="relative h-40 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                        {deck.deckImage ? (
                          <>
                            <div 
                              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                              style={{ backgroundImage: `url(${deck.deckImage})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20" />
                        )}
                        
                        <div className="relative h-full flex flex-col justify-between p-4">
                          <div className="flex items-start justify-between">
                            <Badge className={`${
                              index === 0 ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg" :
                              index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0" :
                              index === 2 ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0" :
                              "bg-slate-600/80 text-gray-200 border-0 backdrop-blur-sm"
                            } font-bold`}>
                              #{index + 1}
                            </Badge>
                            <div className="text-right">
                              <span className="font-bold text-2xl text-purple-400 drop-shadow-lg">
                                {deck.bayesianTrueWinRate.toFixed(1)}%
                              </span>
                              <p className="text-xs text-gray-300 drop-shadow">BTWR</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="font-bold text-white drop-shadow-lg line-clamp-1">
                              {deck.name}
                            </h3>
                            <p className="text-sm text-gray-200 drop-shadow line-clamp-1">
                              {deck.commander}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-gray-300 drop-shadow">
                                by {deck.owner?.nickname || deck.owner?.name}
                              </span>
                              <span className="text-xs text-gray-300 drop-shadow bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                                {deck.gamesPlayed} games
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dominance Index */}
          <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Top Decks by Dominance Index
                <MetricInfo
                  title="Dominance Index (DI)"
                  description="Captures performance consistency by considering both average placement and variance. Rewards decks that perform consistently well."
                  formula="(NormalizedPlacement × ConsistencyFactor × 10)"
                />
              </CardTitle>
              <CardDescription>Most consistently strong performers</CardDescription>
            </CardHeader>
            <CardContent>
              {advancedMetrics.topByDominanceIndex && advancedMetrics.topByDominanceIndex.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {advancedMetrics.topByDominanceIndex.slice(0, 6).map((deck, index) => (
                    <div
                      key={deck._id}
                      onClick={() => router.push(`/decks/${deck._id}`)}
                      className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105"
                    >
                      <div className="relative h-40 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                        {deck.deckImage ? (
                          <>
                            <div 
                              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                              style={{ backgroundImage: `url(${deck.deckImage})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-emerald-600/20 to-teal-600/20" />
                        )}
                        
                        <div className="relative h-full flex flex-col justify-between p-4">
                          <div className="flex items-start justify-between">
                            <Badge className={`${
                              index === 0 ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg" :
                              index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0" :
                              index === 2 ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0" :
                              "bg-slate-600/80 text-gray-200 border-0 backdrop-blur-sm"
                            } font-bold`}>
                              #{index + 1}
                            </Badge>
                            <div className="text-right">
                              <span className="font-bold text-2xl text-green-400 drop-shadow-lg">
                                {deck.dominanceIndex.toFixed(1)}
                              </span>
                              <p className="text-xs text-gray-300 drop-shadow">DI</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="font-bold text-white drop-shadow-lg line-clamp-1">
                              {deck.name}
                            </h3>
                            <p className="text-sm text-gray-200 drop-shadow line-clamp-1">
                              {deck.commander}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-gray-300 drop-shadow">
                                by {deck.owner?.nickname || deck.owner?.name}
                              </span>
                              <span className="text-xs text-gray-300 drop-shadow bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                                {deck.gamesPlayed} games
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}