'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
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
  gamesPlayed: number;
  wins: number;
  winRate: number;
  favoriteCommander: string;
  totalDecks: number;
  recentGames: Array<{
    id: string;
    date: string;
    placement: number;
    deck: { name: string; commander: string };
  }>;
  topDecks: Array<{
    id: string;
    name: string;
    commander: string;
    winRate: number;
    gamesPlayed: number;
  }>;
}

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    nickname: user?.nickname || '',
    profileImage: user?.profileImage || '',
  });

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

  const fetchUserStats = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || !user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/player/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players/${user._id}`, {
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
        login(updatedUser, token);
        setIsEditing(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={isEditing ? formData.profileImage : user.profileImage} 
                alt={user.name} 
              />
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nickname</label>
                    <Input
                      value={formData.nickname}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, nickname: e.target.value })
                      }
                      placeholder="Enter your nickname (optional)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Profile Image URL</label>
                    <Input
                      value={formData.profileImage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, profileImage: e.target.value })
                      }
                      placeholder="Enter image URL (optional)"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">
                      {user.nickname || user.name}
                    </h1>
                    {user.isAdmin && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  {user.nickname && (
                    <p className="text-lg text-muted-foreground">{user.name}</p>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Played</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.gamesPlayed}</div>
              <p className="text-xs text-muted-foreground">Total matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wins</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wins}</div>
              <p className="text-xs text-muted-foreground">Victories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.winRate}%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Decks</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDecks}</div>
              <p className="text-xs text-muted-foreground">In collection</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Games */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Your latest Commander matches</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentGames && stats.recentGames.length > 0 ? (
              <div className="space-y-4">
                {stats.recentGames.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={game.placement === 1 ? "default" : "outline"}
                        className={
                          game.placement === 1 
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
                            : ""
                        }
                      >
                        {game.placement === 1 ? '1st' : 
                         game.placement === 2 ? '2nd' : 
                         game.placement === 3 ? '3rd' : 
                         `${game.placement}th`}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{game.deck.name}</p>
                        <p className="text-xs text-muted-foreground">{game.deck.commander}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(game.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No games played yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Decks */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Decks</CardTitle>
            <CardDescription>Your most successful commanders</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topDecks && stats.topDecks.length > 0 ? (
              <div className="space-y-4">
                {stats.topDecks.map((deck) => (
                  <div key={deck.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{deck.name}</p>
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
                <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No decks created yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Favorite Commander */}
      {stats?.favoriteCommander && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Favorite Commander</CardTitle>
            <CardDescription>The commander you play most often</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{stats.favoriteCommander}</h3>
                <p className="text-muted-foreground">Most played commander</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}