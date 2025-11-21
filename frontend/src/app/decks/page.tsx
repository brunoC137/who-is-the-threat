'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, ExternalLink, Trophy, Target, Layers, Filter, Users, User, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface Deck {
  _id: string;
  name: string;
  commander: string;
  decklistLink?: string;
  deckImage?: string;
  colorIdentity?: string[];
  tags?: string[];
  owner: {
    _id: string;
    name: string;
    nickname?: string;
    profileImage?: string;
  };
  createdAt: string;
  stats?: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
  };
}

const colorMap: { [key: string]: { name: string; color: string } } = {
  'W': { name: 'White', color: 'bg-yellow-100 text-yellow-800' },
  'U': { name: 'Blue', color: 'bg-blue-100 text-blue-800' },
  'B': { name: 'Black', color: 'bg-gray-100 text-gray-800' },
  'R': { name: 'Red', color: 'bg-red-100 text-red-800' },
  'G': { name: 'Green', color: 'bg-green-100 text-green-800' },
};

export default function DecksPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllDecks, setShowAllDecks] = useState(false); // Default to showing only user's decks
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }>({
    page: 1,
    limit: 100,
    total: 0,
    hasMore: false
  });

  const fetchDecks = async (page = 1, append = false) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      if (!append) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decks?page=${page}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const newDecks = result.data || result;
        
        if (append) {
          setDecks(prev => [...prev, ...newDecks]);
        } else {
          setDecks(newDecks);
        }

        setPagination({
          page: page,
          limit: 100,
          total: result.total || newDecks.length,
          hasMore: result.pagination?.next ? true : false
        });
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreDecks = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchDecks(pagination.page + 1, true);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    if (searchTerm || selectedColors.length > 0 || selectedTags.length > 0) {
      // When filtering, we show all locally filtered results and hide pagination
      return;
    }
    // When no filters are active, we can show pagination
  }, [searchTerm, selectedColors, selectedTags]);

  // Get all unique tags for filtering
  const allTags = Array.from(new Set(decks.flatMap(deck => deck.tags || [])));

  const filteredDecks = decks.filter(deck => {
    // First filter by ownership if not showing all decks
    const matchesOwnership = showAllDecks || (user && deck.owner._id === user.id);

    const matchesSearch = 
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.commander.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deck.owner.nickname && deck.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesColors = selectedColors.length === 0 || 
      (deck.colorIdentity && selectedColors.every(color => deck.colorIdentity!.includes(color)));

    const matchesTags = selectedTags.length === 0 || 
      (deck.tags && selectedTags.some(tag => deck.tags!.includes(tag)));

    return matchesOwnership && matchesSearch && matchesColors && matchesTags;
  });

  const toggleColorFilter = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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
          <h1 className="text-3xl font-bold mb-2">{t('decks.title')}</h1>
          <p className="text-muted-foreground">
            {showAllDecks 
              ? t('decks.allCommander')
              : t('decks.yourCommander')
            }
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button 
            variant={showAllDecks ? "default" : "outline"}
            onClick={() => setShowAllDecks(!showAllDecks)}
          >
            {showAllDecks ? (
              <>
                <User className="h-4 w-4 mr-2" />
                Show My Decks
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Show All Decks
              </>
            )}
          </Button>
          <Button asChild>
            <Link href="/decks/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Deck
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('decks.searchDecks')}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Color Identity Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Colors:
          </div>
          {Object.entries(colorMap).map(([color, { name, color: colorClass }]) => (
            <Badge
              key={color}
              variant={selectedColors.includes(color) ? "default" : "outline"}
              className={`cursor-pointer ${selectedColors.includes(color) ? '' : 'hover:bg-accent'}`}
              onClick={() => toggleColorFilter(color)}
            >
              {color}
            </Badge>
          ))}
          {selectedColors.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedColors([])}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <div className="text-sm font-medium">Tags:</div>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer ${selectedTags.includes(tag) ? '' : 'hover:bg-accent'}`}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Decks Grid */}
      {filteredDecks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDecks.map((deck) => (
              <Card key={deck._id} className="group relative overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-glow-md hover:-translate-y-2">
                <CardHeader className="pb-4 relative">
                  {deck.deckImage ? (
                    <div className="relative w-full h-48 rounded-lg mb-4 overflow-hidden">
                      <div className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110" 
                           style={{ backgroundImage: `url(${deck.deckImage})` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary via-accent to-primary/80 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden animated-gradient">
                      <Layers className="h-12 w-12 text-white drop-shadow-lg relative z-10" />
                    </div>
                  )}
                  <CardTitle className="text-lg font-bold">{deck.name}</CardTitle>
                  <CardDescription className="font-medium text-foreground/90">
                    {deck.commander}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Owner */}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 ring-2 ring-border/50">
                      <AvatarImage src={deck.owner.profileImage} alt={deck.owner.name} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                        {deck.owner.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {deck.owner.nickname || deck.owner.name}
                    </span>
                  </div>

                  {/* Color Identity */}
                  {deck.colorIdentity && deck.colorIdentity.length > 0 && (
                    <div className="flex gap-1.5">
                      {deck.colorIdentity.map(color => (
                        <div
                          key={color}
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border-2 transition-transform hover:scale-110 ${colorMap[color]?.color || 'bg-gray-100 text-gray-800'}`}
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {deck.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-muted/50 hover:bg-muted transition-colors">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  {deck.stats && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="text-center rounded-lg bg-muted/30 p-2">
                        <div className="text-lg font-bold text-foreground">{deck.stats.gamesPlayed}</div>
                        <div className="text-xs text-muted-foreground">Games</div>
                      </div>
                      <div className="text-center rounded-lg bg-muted/30 p-2">
                        <div className="text-lg font-bold text-success">{deck.stats.wins}</div>
                        <div className="text-xs text-muted-foreground">Wins</div>
                      </div>
                      <div className="text-center rounded-lg bg-muted/30 p-2">
                        <div className={`text-lg font-bold ${
                          deck.stats.winRate >= 50 ? 'text-success' :
                          deck.stats.winRate >= 30 ? 'text-warning' :
                          'text-muted-foreground'
                        }`}>
                          {deck.stats.winRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">WR</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="default" size="sm" asChild className="flex-1 shadow-glow-sm">
                      <Link href={`/decks/${deck._id}`}>View</Link>
                    </Button>
                    {deck.decklistLink && (
                      <Button variant="outline" size="sm" asChild className="hover:border-primary/50">
                        <a href={deck.decklistLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {(user?.isAdmin || user?.id === deck.owner._id) && (
                      <Button variant="outline" size="sm" asChild className="hover:border-accent/50">
                        <Link href={`/decks/${deck._id}/edit`}>Edit</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Show More Button */}
          {pagination.hasMore && !searchTerm && selectedColors.length === 0 && selectedTags.length === 0 && (
            <div className="flex flex-col items-center mt-8">
              <p className="text-sm text-muted-foreground mb-4">
                {t('decks.showingDecks')} {decks.length} {t('decks.ofDecks')} {pagination.total} {t('decks.decks')}
              </p>
              <Button 
                onClick={loadMoreDecks} 
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    {t('actions.loading')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    {t('decks.showMoreDecks')} ({pagination.total - decks.length} {t('decks.remaining')})
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      
      ) : (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No decks found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedColors.length > 0 || selectedTags.length > 0
              ? "No decks match your current filters"
              : showAllDecks 
                ? "No decks have been created yet."
                : "You haven't created any decks yet."
            }
          </p>
          {(!searchTerm && selectedColors.length === 0 && selectedTags.length === 0) && (
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/decks/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Deck
                </Link>
              </Button>
              {!showAllDecks && decks.length > 0 && (
                <Button variant="outline" onClick={() => setShowAllDecks(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  View All Decks
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {filteredDecks.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {showAllDecks ? pagination.total : (user ? decks.filter(d => d.owner._id === user.id).length : 0)}
              </CardTitle>
              <CardDescription>
                {showAllDecks ? "Total Decks" : "Your Decks"}
              </CardDescription>
            </CardHeader>
          </Card>
          {showAllDecks && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {user ? decks.filter(d => d.owner._id === user.id).length : 0}
                </CardTitle>
                <CardDescription>Your Decks</CardDescription>
              </CardHeader>
            </Card>
          )}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {new Set(filteredDecks.map(d => d.commander)).size}
              </CardTitle>
              <CardDescription>
                {showAllDecks ? "Unique Commanders" : "Your Commanders"}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {Array.from(new Set(filteredDecks.flatMap(deck => deck.tags || []))).length}
              </CardTitle>
              <CardDescription>
                {showAllDecks ? "Different Archetypes" : "Your Archetypes"}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}