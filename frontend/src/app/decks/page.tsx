'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, ExternalLink, Trophy, Target, Layers, Filter, Users, User, ChevronDown, ChevronUp, Archive, ArchiveRestore, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { decksAPI } from '@/lib/api';

interface Deck {
  _id: string;
  name: string;
  commander: string;
  decklistLink?: string;
  deckImage?: string;
  colorIdentity?: string[];
  tags?: string[];
  archived?: boolean;
  archivedAt?: string;
  owner: {
    _id: string;
    name: string;
    nickname?: string;
    profileImage?: string;
  } | null;
  createdAt: string;
  stats?: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
  };
}

// How many tags the filter panel shows before the "show all" expander
const TAG_PREVIEW_COUNT = 12;

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
  const [showFilters, setShowFilters] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllDecks, setShowAllDecks] = useState(false); // Default to showing only user's decks
  const [view, setView] = useState<'active' | 'archived'>('active');
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

  const fetchDecks = async (page = 1, append = false, targetView: 'active' | 'archived' = view) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      if (!append) setLoading(true);
      else setLoadingMore(true);

      // The API hides archived decks unless they are explicitly requested
      const response = await decksAPI.getAll({
        page,
        limit: 100,
        ...(targetView === 'archived' ? { archived: true } : {}),
      });

      const result = response.data;
      const newDecks: Deck[] = result.data || result;

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

  const switchView = (nextView: 'active' | 'archived') => {
    if (nextView === view) return;
    setView(nextView);
    setDecks([]);
    fetchDecks(1, false, nextView);
  };

  // Archiving and unarchiving both move the deck out of the current list
  const toggleArchive = async (deck: Deck) => {
    try {
      if (deck.archived) {
        await decksAPI.unarchive(deck._id);
      } else {
        await decksAPI.archive(deck._id);
      }
      setDecks(prev => prev.filter(d => d._id !== deck._id));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (error) {
      console.error('Error updating deck archive state:', error);
    }
  };

  useEffect(() => {
    fetchDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    if (searchTerm || selectedColors.length > 0 || selectedTags.length > 0) {
      // When filtering, we show all locally filtered results and hide pagination
      return;
    }
    // When no filters are active, we can show pagination
  }, [searchTerm, selectedColors, selectedTags]);

  // Tags ordered by how often they are actually used, so the archetypes this
  // playgroup really plays come first instead of an arbitrary wall of badges.
  const tagCounts = decks.reduce<Record<string, number>>((counts, deck) => {
    (deck.tags || []).forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, {});

  const allTags = Object.keys(tagCounts).sort(
    (a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b)
  );

  const visibleTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.trim().toLowerCase())
  );

  // Collapsed, the tag list shows a single readable band instead of pushing the
  // deck grid off screen. Selected tags always stay visible.
  const collapsedTags = showAllTags
    ? visibleTags
    : visibleTags.filter((tag, index) => index < TAG_PREVIEW_COUNT || selectedTags.includes(tag));

  const activeFilterCount = selectedColors.length + selectedTags.length;

  const clearAllFilters = () => {
    setSelectedColors([]);
    setSelectedTags([]);
    setTagSearch('');
  };

  const filteredDecks = decks.filter(deck => {
    // First filter by ownership if not showing all decks
    const matchesOwnership = showAllDecks || (user && deck.owner?._id === user.id);

    const matchesSearch = 
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.commander.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deck.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (deck.owner?.nickname && deck.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase()));

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
          <h1 className="text-3xl font-bold mb-2">
            {view === 'archived' ? t('decks.archivedDecks') : t('decks.title')}
          </h1>
          <p className="text-muted-foreground">
            {view === 'archived'
              ? t('decks.archivedDecksDescription')
              : showAllDecks
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
                {t('decks.showMyDecks')}
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                {t('decks.showAllDecks')}
              </>
            )}
          </Button>
          {view === 'active' && (
            <Button asChild>
              <Link href="/decks/new">
                <Plus className="h-4 w-4 mr-2" />
                {t('decks.addDeck')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Active / Archived switch */}
      <div className="inline-flex w-full sm:w-auto rounded-lg border border-border bg-card p-1 mb-6">
        <button
          type="button"
          onClick={() => switchView('active')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === 'active'
              ? 'bg-primary text-primary-foreground shadow-glow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          {t('decks.activeDecks')}
        </button>
        <button
          type="button"
          onClick={() => switchView('archived')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === 'archived'
              ? 'bg-primary text-primary-foreground shadow-glow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Archive className="h-4 w-4" />
          {t('decks.archived')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-6">
        {/* Search + filter toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('decks.searchDecks')}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('decks.filters')}</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-background/25 px-1.5 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Active filters stay visible even when the panel is collapsed */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedColors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => toggleColorFilter(color)}
                className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold transition-transform hover:scale-105 ${colorMap[color]?.color || 'bg-muted'}`}
              >
                {color}
                <X className="h-3 w-3" />
              </button>
            ))}
            {selectedTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTagFilter(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                {tag}
                <X className="h-3 w-3" />
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
              {t('decks.clearAll')}
            </Button>
          </div>
        )}

        {/* Filter panel */}
        {showFilters && (
          <Card className="border-border/60 bg-card/60">
            <CardContent className="space-y-5 pt-6">
              {/* Color identity */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {t('decks.colors')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(colorMap).map(([color, { name, color: colorClass }]) => (
                    <button
                      key={color}
                      type="button"
                      title={name}
                      onClick={() => toggleColorFilter(color)}
                      className={`h-9 w-9 rounded-md border-2 text-sm font-bold transition-transform hover:scale-110 ${
                        selectedColors.includes(color)
                          ? `${colorClass} ring-2 ring-primary ring-offset-2 ring-offset-background`
                          : `${colorClass} opacity-40 hover:opacity-80`
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">
                      {t('decks.tags')}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {allTags.length}
                      </span>
                    </div>
                    {allTags.length > TAG_PREVIEW_COUNT && (
                      <div className="relative w-40 sm:w-56">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={tagSearch}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagSearch(e.target.value)}
                          placeholder={t('decks.searchTags')}
                          className="h-8 pl-8 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {collapsedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {collapsedTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                          className={`cursor-pointer gap-1.5 ${selectedTags.includes(tag) ? '' : 'hover:bg-accent'}`}
                          onClick={() => toggleTagFilter(tag)}
                        >
                          {tag}
                          <span className={selectedTags.includes(tag) ? 'opacity-70' : 'text-muted-foreground'}>
                            {tagCounts[tag]}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('decks.noTagsMatch')}</p>
                  )}

                  {visibleTags.length > collapsedTags.length && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllTags(true)}
                      className="mt-2 h-7 px-2 text-xs"
                    >
                      <ChevronDown className="mr-1 h-3 w-3" />
                      {t('decks.showAllTags')} ({visibleTags.length})
                    </Button>
                  )}
                  {showAllTags && visibleTags.length > TAG_PREVIEW_COUNT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllTags(false)}
                      className="mt-2 h-7 px-2 text-xs"
                    >
                      <ChevronUp className="mr-1 h-3 w-3" />
                      {t('decks.showFewerTags')}
                    </Button>
                  )}
                </div>
              )}

              {/* Panel footer */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-xs text-muted-foreground">
                  {filteredDecks.length} {filteredDecks.length === 1 ? t('decks.deckOne') : t('decks.decks')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  disabled={activeFilterCount === 0}
                  className="h-7 px-2 text-xs"
                >
                  {t('decks.clearAll')}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                  {deck.archived && (
                    <Badge
                      variant="secondary"
                      className="absolute right-6 top-6 z-10 gap-1 border border-border/60 bg-background/85 backdrop-blur-sm"
                    >
                      <Archive className="h-3 w-3" />
                      {t('decks.archived')}
                    </Badge>
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
                      <AvatarImage src={deck.owner?.profileImage} alt={deck.owner?.name || 'Unknown Owner'} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                        {deck.owner?.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {deck.owner ? (deck.owner.nickname || deck.owner.name) : (t('common.deletedUser') || 'Deleted User')}
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
                      <Link href={`/decks/${deck._id}`}>{t('decks.view')}</Link>
                    </Button>
                    {deck.decklistLink && (
                      <Button variant="outline" size="sm" asChild className="hover:border-primary/50">
                        <a href={deck.decklistLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {(user?.isAdmin || user?.id === deck.owner?._id) && (
                      deck.archived ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:border-primary/50"
                          onClick={() => toggleArchive(deck)}
                        >
                          <ArchiveRestore className="h-3 w-3 mr-1" />
                          {t('decks.unarchive')}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild className="hover:border-accent/50">
                          <Link href={`/decks/${deck._id}/edit`}>{t('actions.edit')}</Link>
                        </Button>
                      )
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
      
      ) : view === 'archived' ? (
        <div className="text-center py-12">
          <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('decks.noArchivedDecks')}</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedColors.length > 0 || selectedTags.length > 0
              ? t('decks.noDecksMatch')
              : t('decks.noArchivedDecksDescription')
            }
          </p>
          <Button variant="outline" onClick={() => switchView('active')}>
            <Layers className="h-4 w-4 mr-2" />
            {t('decks.activeDecks')}
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('decks.noDecksFound')}</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedColors.length > 0 || selectedTags.length > 0
              ? t('decks.noDecksMatch')
              : showAllDecks
                ? t('decks.noDecksCreated')
                : t('decks.haventCreated')
            }
          </p>
          {(!searchTerm && selectedColors.length === 0 && selectedTags.length === 0) && (
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/decks/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('decks.createFirstDeck')}
                </Link>
              </Button>
              {!showAllDecks && decks.length > 0 && (
                <Button variant="outline" onClick={() => setShowAllDecks(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  {t('decks.viewAllDecks')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {view === 'active' && filteredDecks.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {showAllDecks ? pagination.total : (user ? decks.filter(d => d.owner?._id === user.id).length : 0)}
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
                  {user ? decks.filter(d => d.owner?._id === user.id).length : 0}
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