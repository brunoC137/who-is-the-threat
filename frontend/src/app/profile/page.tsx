'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Edit2, 
  Save, 
  X, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  Layers,
  Crown
} from 'lucide-react';

interface ProfileStats {
  statistics: {
    totalGames: number;
    wins: number;
    winRate: number;
    averagePlacement: number;
    placementDistribution: Record<string, number>;
  };
  deckUsage: Array<{
    deck: { _id: string; name: string; commander: string };
    gamesPlayed: number;
    wins: number;
    winRate: string;
    averagePlacement: string;
  }>;
  recentGames: Array<{
    _id: string;
    date: string;
    placement: number;
    deck: { name: string; commander: string };
    playerCount: number;
  }>;
  matchups: Array<{
    opponent: { _id: string; name: string; nickname?: string; profileImage?: string };
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: string;
    headToHeadWins: number;
  }>;
  eliminationStats?: {
    playersEliminated: Array<{
      player: { _id: string; name: string; nickname?: string; profileImage?: string };
      count: number;
    }>;
    eliminatedBy: Array<{
      player: { _id: string; name: string; nickname?: string; profileImage?: string };
      count: number;
    }>;
  };
}

export default function ProfilePage() {
  const { user, setUserData } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    nickname: user?.nickname || '',
    profileImage: user?.profileImage || '',
  });

  const fetchUserStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || !user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/player/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } else {
        setStatsError('Failed to load statistics');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStatsError('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        nickname: user.nickname || '',
        profileImage: user.profileImage || '',
      });
      
      // Fetch user stats
      fetchUserStats();
    }
  }, [user, fetchUserStats]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    setUpdateError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update the auth context with new user data
        setUserData(updatedUser);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setUpdateError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      nickname: user?.nickname || '',
      profileImage: user?.profileImage || '',
    });
    setUpdateError(null);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">{t('profile.pleaseLogIn')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-xl blur-xl -z-10" />
        
        <Card className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-blue-500/20">
                  <AvatarImage 
                    src={isEditing ? formData.profileImage : user.profileImage} 
                    alt={user.name} 
                  />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.isAdmin && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">{t('profile.name')}</label>
                      <Input
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder={t('profile.enterName')}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">{t('profile.nickname')}</label>
                      <Input
                        value={formData.nickname}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setFormData({ ...formData, nickname: e.target.value })
                        }
                        placeholder={t('profile.enterNickname')}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">{t('profile.profileImageUrl')}</label>
                      <Input
                        value={formData.profileImage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setFormData({ ...formData, profileImage: e.target.value })
                        }
                        placeholder={t('profile.enterImageUrl')}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    {updateError && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{updateError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {user.nickname || user.name}
                      </h1>
                      {user.isAdmin && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    {user.nickname && (
                      <p className="text-xl text-gray-300 mb-3">{user.name}</p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t('profile.joined')} {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('profile.unknown')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleSave} 
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? t('profile.saving') : t('profile.save')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      className="border-slate-600 text-gray-300 hover:bg-slate-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="mb-8">
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="relative">
                <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-slate-700 rounded animate-pulse w-20"></div>
                    <div className="h-5 w-5 bg-slate-700 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-slate-700 rounded animate-pulse w-16 mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded animate-pulse w-24"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : stats && stats.statistics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Games Played */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Games Played</CardTitle>
                  <Trophy className="h-5 w-5 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.statistics.totalGames}</div>
                  <p className="text-xs text-gray-400">Total matches</p>
                </CardContent>
              </Card>
            </div>

            {/* Wins */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Wins</CardTitle>
                  <Target className="h-5 w-5 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.statistics.wins}</div>
                  <p className="text-xs text-gray-400">Victories</p>
                </CardContent>
              </Card>
            </div>

            {/* Win Rate */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Win Rate</CardTitle>
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.statistics.winRate}%</div>
                  <p className="text-xs text-gray-400">Success rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Avg Placement */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Avg Placement</CardTitle>
                  <Layers className="h-5 w-5 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.statistics.averagePlacement}</div>
                  <p className="text-xs text-gray-400">Position</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : statsError ? (
          <div className="text-center py-12">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-full opacity-20"></div>
              <X className="h-12 w-12 text-red-500 mx-auto mt-4" />
            </div>
            <p className="text-red-400 text-lg mb-2">Failed to load statistics</p>
            <p className="text-gray-500 text-sm mb-4">{statsError}</p>
            <Button 
              onClick={fetchUserStats}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20"></div>
              <Trophy className="h-12 w-12 text-gray-500 mx-auto mt-4" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No statistics available</p>
            <p className="text-gray-500 text-sm mb-4">Play some games to see your stats!</p>
            <Button 
              onClick={() => router.push('/games/new')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
            >
              Create Your First Game
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Games */}
        <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-400" />
              Recent Games
            </CardTitle>
            <CardDescription className="text-gray-400">Your latest Commander matches</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentGames && stats.recentGames.length > 0 ? (
              <div className="space-y-4">
                {stats.recentGames.map((game) => (
                  <div key={game._id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={
                          game.placement === 1 
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg" 
                            : game.placement === 2
                            ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0"
                            : game.placement === 3
                            ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-0"
                            : "bg-slate-600 text-gray-300 border-0"
                        }
                      >
                        {game.placement === 1 ? '🥇 1st' : 
                         game.placement === 2 ? '🥈 2nd' : 
                         game.placement === 3 ? '🥉 3rd' : 
                         `${game.placement}th`}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm text-white">{game.deck.name}</p>
                        <p className="text-xs text-gray-400">{game.deck.commander}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        {new Date(game.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {game.playerCount} players
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20"></div>
                  <Trophy className="h-12 w-12 text-gray-500 mx-auto mt-4" />
                </div>
                <p className="text-gray-400 text-lg mb-2">No games played yet</p>
                <p className="text-gray-500 text-sm mb-4">Start your Commander journey!</p>
                <Button 
                  onClick={() => router.push('/games/new')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  Record Your First Game
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Decks */}
        <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              Top Performing Decks
            </CardTitle>
            <CardDescription className="text-gray-400">Your most successful commanders</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.deckUsage && stats.deckUsage.length > 0 ? (
              <div className="space-y-4">
                {stats.deckUsage.slice(0, 5).map((deckStat) => (
                  <div key={deckStat.deck._id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">{deckStat.deck.name}</p>
                        <p className="text-xs text-gray-400">{deckStat.deck.commander}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        <span className={`${parseFloat(deckStat.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {deckStat.winRate}%
                        </span> WR
                      </p>
                      <p className="text-xs text-gray-400">
                        {deckStat.gamesPlayed} games
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-20"></div>
                  <Layers className="h-12 w-12 text-gray-500 mx-auto mt-4" />
                </div>
                <p className="text-gray-400 text-lg mb-2">No decks created yet</p>
                <p className="text-gray-500 text-sm mb-4">Build your first deck to get started!</p>
                <Button 
                  onClick={() => router.push('/decks/new')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0"
                >
                  Create Your First Deck
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Player Matchups */}
      {stats?.matchups && stats.matchups.length > 0 && (
        <Card className="mt-6 bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-green-400" />
              Player Matchups
            </CardTitle>
            <CardDescription className="text-gray-400">Your performance against other players</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.matchups.slice(0, 5).map((matchup) => (
                <div key={matchup.opponent._id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 ring-2 ring-slate-600">
                      <AvatarImage src={matchup.opponent.profileImage} alt={matchup.opponent.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {(matchup.opponent.nickname || matchup.opponent.name).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {matchup.opponent.nickname || matchup.opponent.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {matchup.gamesPlayed} games played
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      <span className={`${parseFloat(matchup.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {matchup.winRate}%
                      </span> WR
                    </p>
                    <p className="text-xs text-gray-400">
                      {matchup.headToHeadWins}W-{matchup.losses}L
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Elimination Statistics */}
      {stats?.eliminationStats && (stats.eliminationStats.playersEliminated.length > 0 || stats.eliminationStats.eliminatedBy.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Players Eliminated */}
          {stats.eliminationStats.playersEliminated.length > 0 && (
            <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-400" />
                  Most Eliminated
                </CardTitle>
                <CardDescription className="text-gray-400">Players you eliminate most often</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.eliminationStats.playersEliminated.slice(0, 5).map((stat) => (
                    <div key={stat.player._id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-slate-600">
                          <AvatarImage src={stat.player.profileImage} alt={stat.player.name} />
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white">
                            {(stat.player.nickname || stat.player.name).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm text-white">
                          {stat.player.nickname || stat.player.name}
                        </p>
                      </div>
                      <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/50">
                        {stat.count} {stat.count === 1 ? t('profile.elimination') : t('profile.eliminations')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Eliminated By */}
          {stats.eliminationStats.eliminatedBy.length > 0 && (
            <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  Eliminated By
                </CardTitle>
                <CardDescription className="text-gray-400">Players who eliminate you most often</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.eliminationStats.eliminatedBy.slice(0, 5).map((stat) => (
                    <div key={stat.player._id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-slate-600">
                          <AvatarImage src={stat.player.profileImage} alt={stat.player.name} />
                          <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
                            {(stat.player.nickname || stat.player.name).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm text-white">
                          {stat.player.nickname || stat.player.name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                        {stat.count} {stat.count === 1 ? t('profile.time') : t('profile.times')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </div>
    </div>
  );
}