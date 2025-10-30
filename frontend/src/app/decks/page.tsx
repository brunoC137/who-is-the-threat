'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, ExternalLink, Trophy, Target, Layers, Filter } from 'lucide-react';
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
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setDecks(result.data || result);
        }
      } catch (error) {
        console.error('Error fetching decks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, []);

  // Get all unique tags for filtering
  const allTags = Array.from(new Set(decks.flatMap(deck => deck.tags || [])));

  const filteredDecks = decks.filter(deck => {
    const matchesSearch = 
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.commander.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deck.owner.nickname && deck.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesColors = selectedColors.length === 0 || 
      (deck.colorIdentity && selectedColors.every(color => deck.colorIdentity!.includes(color)));

    const matchesTags = selectedTags.length === 0 || 
      (deck.tags && selectedTags.some(tag => deck.tags!.includes(tag)));

    return matchesSearch && matchesColors && matchesTags;
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
          <h1 className="text-3xl font-bold mb-2">Decks</h1>
          <p className="text-muted-foreground">
            All Commander decks in your playgroup
          </p>
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link href="/decks/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Deck
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search decks by name, commander, or owner..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDecks.map((deck) => (
            <Card key={deck._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                {deck.deckImage ? (
                  <div className="w-full h-48 rounded-lg mb-4 bg-cover bg-center" 
                       style={{ backgroundImage: `url(${deck.deckImage})` }} />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                    <Layers className="h-12 w-12 text-white" />
                  </div>
                )}
                <CardTitle className="text-lg">{deck.name}</CardTitle>
                <CardDescription className="font-medium text-foreground">
                  {deck.commander}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Owner */}
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={deck.owner.profileImage} alt={deck.owner.name} />
                    <AvatarFallback className="text-xs">
                      {deck.owner.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {deck.owner.nickname || deck.owner.name}
                  </span>
                </div>

                {/* Color Identity */}
                {deck.colorIdentity && deck.colorIdentity.length > 0 && (
                  <div className="flex gap-1">
                    {deck.colorIdentity.map(color => (
                      <Badge
                        key={color}
                        variant="outline"
                        className={`text-xs ${colorMap[color]?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {deck.tags && deck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {deck.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                {deck.stats && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold">{deck.stats.gamesPlayed}</div>
                      <div className="text-muted-foreground">Games</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{deck.stats.wins}</div>
                      <div className="text-muted-foreground">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{deck.stats.winRate}%</div>
                      <div className="text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/decks/${deck._id}`}>View</Link>
                  </Button>
                  {deck.decklistLink && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={deck.decklistLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {(user?.isAdmin || user?.id === deck.owner._id) && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/decks/${deck._id}/edit`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No decks found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedColors.length > 0 || selectedTags.length > 0
              ? "No decks match your current filters"
              : "No decks have been created yet."
            }
          </p>
          {(!searchTerm && selectedColors.length === 0 && selectedTags.length === 0) && (
            <Button asChild>
              <Link href="/decks/new">Create Your First Deck</Link>
            </Button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {decks.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{decks.length}</CardTitle>
              <CardDescription>Total Decks</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {user ? decks.filter(d => d.owner._id === user.id).length : 0}
              </CardTitle>
              <CardDescription>Your Decks</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {new Set(decks.map(d => d.commander)).size}
              </CardTitle>
              <CardDescription>Unique Commanders</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {allTags.length}
              </CardTitle>
              <CardDescription>Different Archetypes</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}