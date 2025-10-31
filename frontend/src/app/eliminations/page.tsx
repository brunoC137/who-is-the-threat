'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Target, 
  Skull, 
  TrendingUp, 
  Crosshair,
  Users,
  Activity,
  Shield,
  Sword
} from 'lucide-react';

interface Player {
  _id: string;
  name: string;
  nickname?: string;
  profileImage?: string;
}

interface EliminationStats {
  overview: {
    totalEliminations: number;
    gamesWithEliminations: number;
    averageEliminationsPerGame: number;
    recentEliminations: number;
  };
  mostEliminations: Array<{
    player: Player;
    count: number;
  }>;
  mostEliminated: Array<{
    player: Player;
    count: number;
  }>;
  topMatchups: Array<{
    eliminator: Player;
    victim: Player;
    count: number;
  }>;
}

interface PlayerEliminationStats {
  playersEliminated: Array<{
    player: Player;
    count: number;
  }>;
  eliminatedBy: Array<{
    player: Player;
    count: number;
  }>;
}

export default function EliminationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<EliminationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerEliminationStats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        // Fetch elimination stats and players in parallel
        const [eliminationResponse, playersResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/eliminations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (eliminationResponse.ok) {
          const result = await eliminationResponse.json();
          setStats(result.data || result);
        }

        if (playersResponse.ok) {
          const playersResult = await playersResponse.json();
          setPlayers(playersResult.data || playersResult);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Effect to fetch player-specific elimination stats
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (!selectedPlayer) {
        setPlayerStats(null);
        return;
      }

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/player/${selectedPlayer._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          const playerData = result.data || result;
          setPlayerStats({
            playersEliminated: playerData.eliminationStats?.playersEliminated || [],
            eliminatedBy: playerData.eliminationStats?.eliminatedBy || []
          });
        }
      } catch (error) {
        console.error('Error fetching player elimination stats:', error);
      }
    };

    fetchPlayerStats();
  }, [selectedPlayer]);

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
          <h1 className="text-4xl font-bold mb-2 text-white flex items-center gap-3">
            <Target className="h-10 w-10 text-red-400" />
            Eliminations
          </h1>
          <p className="text-gray-400 text-lg">
            Track who&apos;s bringing the heat to the battlefield
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Eliminations */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Eliminations</CardTitle>
                <Crosshair className="h-5 w-5 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats?.overview?.totalEliminations || 0}</div>
                <p className="text-xs text-gray-400">Players eliminated</p>
              </CardContent>
            </Card>
          </div>

          {/* Games with Eliminations */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Active Games</CardTitle>
                <Activity className="h-5 w-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats?.overview?.gamesWithEliminations || 0}</div>
                <p className="text-xs text-gray-400">Games with eliminations</p>
              </CardContent>
            </Card>
          </div>

          {/* Average per Game */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Average per Game</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats?.overview?.averageEliminationsPerGame || 0}</div>
                <p className="text-xs text-gray-400">Eliminations per game</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <Card className="relative bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Last 30 Days</CardTitle>
                <Target className="h-5 w-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats?.overview?.recentEliminations || 0}</div>
                <p className="text-xs text-gray-400">Recent eliminations</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Player Selection */}
        {players.length > 0 && (
          <Card className="mb-8 bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-purple-400" />
                Player Elimination Details
              </CardTitle>
              <CardDescription className="text-gray-400">
                Select a player to see their detailed elimination statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <select
                  value={selectedPlayer?._id || ''}
                  onChange={(e) => {
                    const player = players.find(p => p._id === e.target.value);
                    setSelectedPlayer(player || null);
                  }}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select a player to view detailed stats...</option>
                  {players.map(player => (
                    <option key={player._id} value={player._id}>
                      {player.nickname || player.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayer && playerStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Players This Player Eliminated */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Sword className="h-5 w-5 text-red-400" />
                      Players Eliminated by {selectedPlayer.nickname || selectedPlayer.name}
                    </h4>
                    {playerStats.playersEliminated.length > 0 ? (
                      <div className="space-y-3">
                        {playerStats.playersEliminated.map((victim, index) => (
                          <div key={victim.player._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={victim.player.profileImage} alt={victim.player.name} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                  {victim.player.name?.charAt(0)?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white font-medium">
                                {victim.player.nickname || victim.player.name}
                              </span>
                            </div>
                            <Badge className="bg-red-600/80 text-white border-0">
                              {victim.count} elimination{victim.count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No eliminations recorded</p>
                    )}
                  </div>

                  {/* Players Who Eliminated This Player */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Skull className="h-5 w-5 text-blue-400" />
                      Players Who Eliminated {selectedPlayer.nickname || selectedPlayer.name}
                    </h4>
                    {playerStats.eliminatedBy.length > 0 ? (
                      <div className="space-y-3">
                        {playerStats.eliminatedBy.map((eliminator, index) => (
                          <div key={eliminator.player._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={eliminator.player.profileImage} alt={eliminator.player.name} />
                                <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-xs">
                                  {eliminator.player.name?.charAt(0)?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white font-medium">
                                {eliminator.player.nickname || eliminator.player.name}
                              </span>
                            </div>
                            <Badge className="bg-blue-600/80 text-white border-0">
                              {eliminator.count} time{eliminator.count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Never been eliminated</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Most Eliminations - The Hunters */}
          <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sword className="h-5 w-5 text-red-400" />
                The Hunters
              </CardTitle>
              <CardDescription className="text-gray-400">Players with the most eliminations</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.mostEliminations && stats.mostEliminations.length > 0 ? (
                <div className="space-y-4">
                  {stats.mostEliminations.map((player, index) => (
                    <div key={player.player._id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                         onClick={() => router.push(`/players/${player.player._id}`)}>
                      <Badge 
                        className={
                          index === 0 
                            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-lg min-w-[2rem] justify-center" 
                            : index === 1
                            ? "bg-gradient-to-r from-orange-400 to-red-400 text-white border-0 min-w-[2rem] justify-center"
                            : index === 2
                            ? "bg-gradient-to-r from-yellow-500 to-orange-400 text-white border-0 min-w-[2rem] justify-center"
                            : "bg-slate-600 text-gray-300 border-0 min-w-[2rem] justify-center"
                        }
                      >
                        {index === 0 ? '🎯' : index === 1 ? '🔥' : index === 2 ? '⚔️' : `#${index + 1}`}
                      </Badge>
                      <Avatar className="w-12 h-12 ring-2 ring-red-500/50">
                        <AvatarImage src={player.player.profileImage} alt={player.player.name || 'Player'} />
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white">
                          {player.player.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-white">{player.player.nickname || player.player.name || 'Unknown Player'}</p>
                        <p className="text-sm text-gray-400">
                          {player.count} elimination{player.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-red-400">{player.count}</p>
                        <p className="text-xs text-gray-400">Eliminations</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative mx-auto w-20 h-20 mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-full opacity-20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sword className="h-12 w-12 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-lg mb-2">No elimination data available</p>
                  <p className="text-gray-500 text-sm">Start playing games to track eliminations!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Eliminated - The Hunted */}
          <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-blue-400" />
                The Hunted
              </CardTitle>
              <CardDescription className="text-gray-400">Players who get eliminated most often</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.mostEliminated && stats.mostEliminated.length > 0 ? (
                <div className="space-y-4">
                  {stats.mostEliminated.map((player, index) => (
                    <div key={player.player._id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                         onClick={() => router.push(`/players/${player.player._id}`)}>
                      <Badge 
                        className={
                          index === 0 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg min-w-[2rem] justify-center" 
                            : index === 1
                            ? "bg-gradient-to-r from-purple-400 to-blue-400 text-white border-0 min-w-[2rem] justify-center"
                            : index === 2
                            ? "bg-gradient-to-r from-indigo-500 to-purple-400 text-white border-0 min-w-[2rem] justify-center"
                            : "bg-slate-600 text-gray-300 border-0 min-w-[2rem] justify-center"
                        }
                      >
                        {index === 0 ? '💀' : index === 1 ? '🛡️' : index === 2 ? '⚰️' : `#${index + 1}`}
                      </Badge>
                      <Avatar className="w-12 h-12 ring-2 ring-blue-500/50">
                        <AvatarImage src={player.player.profileImage} alt={player.player.name || 'Player'} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {player.player.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-white">{player.player.nickname || player.player.name || 'Unknown Player'}</p>
                        <p className="text-sm text-gray-400">
                          Eliminated {player.count} time{player.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-blue-400">{player.count}</p>
                        <p className="text-xs text-gray-400">Times Eliminated</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative mx-auto w-20 h-20 mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="h-12 w-12 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-lg mb-2">No elimination data available</p>
                  <p className="text-gray-500 text-sm">Start playing games to track eliminations!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Elimination Matchups */}
        <Card className="mb-8 bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Crosshair className="h-5 w-5 text-yellow-400" />
              Elimination Rivalries
            </CardTitle>
            <CardDescription className="text-gray-400">Most frequent elimination matchups between players</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topMatchups && stats.topMatchups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.topMatchups.map((matchup, index) => (
                  <div key={`${matchup.eliminator._id}-${matchup.victim._id}`} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg blur opacity-0 group-hover:opacity-50 transition duration-300"></div>
                    <Card className="relative bg-slate-800/50 border-slate-700/50 p-4 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-yellow-600/80 text-white border-0">
                          #{index + 1}
                        </Badge>
                        <div className="text-right">
                          <span className="font-bold text-2xl text-yellow-400">{matchup.count}</span>
                          <p className="text-xs text-gray-400">Eliminations</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Eliminator */}
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 ring-2 ring-red-500/50">
                            <AvatarImage src={matchup.eliminator.profileImage} alt={matchup.eliminator.name || 'Player'} />
                            <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-sm">
                              {matchup.eliminator.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">
                              {matchup.eliminator.nickname || matchup.eliminator.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-red-400">Eliminator</p>
                          </div>
                          <Sword className="h-4 w-4 text-red-400" />
                        </div>
                        
                        {/* VS Divider */}
                        <div className="flex items-center justify-center">
                          <div className="border-t border-slate-600 flex-1"></div>
                          <span className="px-3 text-gray-400 text-sm font-bold">VS</span>
                          <div className="border-t border-slate-600 flex-1"></div>
                        </div>
                        
                        {/* Victim */}
                        <div className="flex items-center gap-3">
                          <Skull className="h-4 w-4 text-blue-400" />
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">
                              {matchup.victim.nickname || matchup.victim.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-blue-400">Victim</p>
                          </div>
                          <Avatar className="w-10 h-10 ring-2 ring-blue-500/50">
                            <AvatarImage src={matchup.victim.profileImage} alt={matchup.victim.name || 'Player'} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                              {matchup.victim.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full opacity-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Crosshair className="h-12 w-12 text-gray-500" />
                  </div>
                </div>
                <p className="text-gray-400 text-lg mb-2">No elimination matchups available</p>
                <p className="text-gray-500 text-sm">Rivalries will appear as you play more games!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}