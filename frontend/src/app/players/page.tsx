'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Trophy, Target, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';

interface Player {
  _id: string;
  name: string;
  nickname?: string;
  email: string;
  profileImage?: string;
  isAdmin: boolean;
  createdAt: string;
  stats?: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
    favoriteCommander?: string;
  };
}

export default function PlayersPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setPlayers(result.data || result);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.nickname && player.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Players</h1>
          <p className="text-muted-foreground">
            All registered players in your Commander group
          </p>
        </div>
        {user?.isAdmin && (
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/players/invite">Invite Player</Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search players by name or nickname..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <Card key={player._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={player.profileImage} alt={player.name} />
                  <AvatarFallback className="text-lg">
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">
                  {player.nickname || player.name}
                  {player.isAdmin && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Admin
                    </Badge>
                  )}
                </CardTitle>
                {player.nickname && (
                  <CardDescription>{player.name}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {player.stats ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Games Played
                      </span>
                      <span className="font-semibold">{player.stats.gamesPlayed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        Wins
                      </span>
                      <span className="font-semibold">{player.stats.wins}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Win Rate
                      </span>
                      <span className="font-semibold">{player.stats.winRate}%</span>
                    </div>
                    {player.stats.favoriteCommander && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Favorite Commander</p>
                        <p className="text-sm font-medium">{player.stats.favoriteCommander}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No games played yet</p>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button variant="default" size="sm" asChild className="flex-1">
                    <Link href={`/players/${player._id}`}>View Profile</Link>
                  </Button>
                  {(user?.isAdmin || user?.id === player._id) && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/players/${player._id}/edit`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No players found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? `No players match "${searchTerm}"`
              : "No players have been registered yet."
            }
          </p>
          {user?.isAdmin && !searchTerm && (
            <Button asChild>
              <Link href="/players/invite">Invite First Player</Link>
            </Button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {players.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{players.length}</CardTitle>
              <CardDescription>Total Players</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {players.filter(p => p.isAdmin).length}
              </CardTitle>
              <CardDescription>Administrators</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {players.filter(p => p.stats && p.stats.gamesPlayed > 0).length}
              </CardTitle>
              <CardDescription>Active Players</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}