'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Trophy, Target, TrendingUp, User, Share2, UserPlus, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { playersAPI } from '@/lib/api';

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
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await playersAPI.getAll();
        const result = response.data;
        setPlayers(result.data || result);
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

  const handleShareInvite = async () => {
    const registerUrl = `${window.location.origin}/register`;
    
    try {
      await navigator.clipboard.writeText(registerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      console.error('Failed to copy to clipboard:', err);
      // Create a temporary input element for fallback
      const textArea = document.createElement('textarea');
      textArea.value = registerUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">{t('players.title')}</h1>
          <p className="text-muted-foreground">
            {t('players.allRegistered')}
          </p>
        </div>
        
        {user && (
          <div className="flex gap-2 mt-4 sm:mt-0">
            {/* Invite/Share button - shown to all users */}
            <Button onClick={handleShareInvite} variant="outline">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('players.copied')}
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('players.invitePlayer')}
                </>
              )}
            </Button>
            
            {/* Create Player button - shown only to admins */}
            {user.isAdmin && (
              <Button asChild>
                <Link href="/players/new">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('players.createPlayer')}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('players.searchPlayers')}
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <Card key={player._id} className="group relative overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-glow-md hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="text-center pb-4 relative">
                <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-border/50 group-hover:ring-primary/50 transition-all">
                  <AvatarImage src={player.profileImage} alt={player.name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-accent/20">
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg font-bold">
                  {player.nickname || player.name}
                  {player.isAdmin && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-gradient-to-r from-warning to-warning/80 text-white border-0">
                      {t('players.isAdmin')}
                    </Badge>
                  )}
                </CardTitle>
                {player.nickname && (
                  <CardDescription className="text-muted-foreground/80">{player.name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="relative">
                {player.stats ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-warning" />
                        </div>
                        {t('players.gamesPlayed')}
                      </span>
                      <span className="font-bold text-lg">{player.stats.gamesPlayed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                          <Target className="h-4 w-4 text-success" />
                        </div>
                        {t('players.wins')}
                      </span>
                      <span className="font-bold text-lg text-success">{player.stats.wins}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        {t('profile.winRate')}
                      </span>
                      <span className={`font-bold text-lg ${
                        player.stats.winRate >= 40 ? 'text-success' :
                        player.stats.winRate >= 25 ? 'text-warning' :
                        'text-muted-foreground'
                      }`}>
                        {player.stats.winRate}%
                      </span>
                    </div>
                    {player.stats.favoriteCommander && (
                      <div className="pt-3 mt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">{t('stats.favoriteDecks')}</p>
                        <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {player.stats.favoriteCommander}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('players.noGamesYet')}</p>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button variant="default" size="sm" asChild className="flex-1 shadow-glow-sm">
                    <Link href={`/players/${player._id}`}>{t('players.viewProfile')}</Link>
                  </Button>
                  {(user?.isAdmin || user?.id === player._id) && (
                    <Button variant="outline" size="sm" asChild className="flex-1 hover:border-accent/50">
                      <Link href={`/players/${player._id}/edit`}>{t('actions.edit')}</Link>
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
          <h3 className="text-lg font-semibold mb-2">{t('players.noPlayersFound')}</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? `${t('players.noPlayersMatch')} "${searchTerm}"`
              : t('players.noPlayersRegistered')
            }
          </p>
          {user && !searchTerm && (
            <div className="flex gap-2 justify-center">
              <Button onClick={handleShareInvite}>
                <Share2 className="h-4 w-4 mr-2" />
                {copied ? t('players.copied') : t('players.invitePlayer')}
              </Button>
              {user.isAdmin && (
                <Button variant="outline" asChild>
                  <Link href="/players/new">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('players.createPlayer')}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {players.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{players.length}</CardTitle>
              <CardDescription>{t('players.totalPlayers')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {players.filter(p => p.isAdmin).length}
              </CardTitle>
              <CardDescription>{t('players.administrators')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {players.filter(p => p.stats && p.stats.gamesPlayed > 0).length}
              </CardTitle>
              <CardDescription>{t('players.activePlayers')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}