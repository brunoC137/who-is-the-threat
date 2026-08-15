'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import Link from 'next/link';
import { decksAPI } from '@/lib/api';

const colorOptions = [
  { id: 'W', name: 'White', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'U', name: 'Blue', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'B', name: 'Black', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { id: 'R', name: 'Red', color: 'bg-red-100 text-red-800 border-red-300' },
  { id: 'G', name: 'Green', color: 'bg-green-100 text-green-800 border-green-300' },
];

const commonTags = [
  'Aggro', 'Control', 'Combo', 'Midrange', 'Ramp', 'Voltron',
  'Tribal', 'Aristocrats', 'Group Hug', 'Stax', 'Mill', 'Burn',
  'Tokens', 'Reanimator', 'Storm', 'Pillowfort', 'Landfall', 'Artifacts'
];

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
  };
  createdAt: string;
}

export default function EditDeckPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [deck, setDeck] = useState<Deck | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    commander: '',
    decklistLink: '',
    deckImage: '',
    colorIdentity: [] as string[],
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch deck data on mount
  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const response = await decksAPI.getById(deckId);
        const deckData = response.data.data || response.data;
        setDeck(deckData);
        
        // Pre-populate form
        setFormData({
          name: deckData.name || '',
          commander: deckData.commander || '',
          decklistLink: deckData.decklistLink || '',
          deckImage: deckData.deckImage || '',
          colorIdentity: deckData.colorIdentity || [],
          tags: deckData.tags || [],
        });
      } catch (error) {
        console.error('Error fetching deck:', error);
        setErrors({ fetch: 'Failed to load deck data' });
      } finally {
        setInitialLoading(false);
      }
    };

    if (deckId) {
      fetchDeck();
    }
  }, [deckId]);

  // Check permissions. Decks are never deleted — archiving keeps the deck
  // attached to every game it was played in.
  const canEdit = user && deck && (user.isAdmin || user.id === deck.owner._id);
  const canArchive = canEdit;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('decks.deckNameRequired');
    }
    
    if (!formData.commander.trim()) {
      newErrors.commander = t('decks.commanderRequired');
    }    if (formData.decklistLink && !isValidUrl(formData.decklistLink)) {
      newErrors.decklistLink = 'Please enter a valid URL';
    }

    if (formData.deckImage && !isValidUrl(formData.deckImage)) {
      newErrors.deckImage = 'Please enter a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await decksAPI.update(deckId, formData);
      router.push(`/decks/${deckId}`);
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to update deck' });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!deck) return;

    // Unarchiving is harmless, so only archiving asks for confirmation
    if (!deck.archived && !showArchiveConfirm) {
      setShowArchiveConfirm(true);
      return;
    }

    setArchiving(true);
    try {
      if (deck.archived) {
        const response = await decksAPI.unarchive(deckId);
        setDeck(response.data.data || response.data);
        setShowArchiveConfirm(false);
      } else {
        await decksAPI.archive(deckId);
        router.push('/decks');
      }
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.message ||
          (deck.archived ? t('decks.unarchiveFailed') : t('decks.archiveFailed'))
      });
      setShowArchiveConfirm(false);
    } finally {
      setArchiving(false);
    }
  };

  const toggleColorIdentity = (colorId: string) => {
    setFormData(prev => ({
      ...prev,
      colorIdentity: prev.colorIdentity.includes(colorId)
        ? prev.colorIdentity.filter(c => c !== colorId)
        : [...prev.colorIdentity, colorId]
    }));
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addCustomTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (errors.fetch || !deck) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {errors.fetch || 'Deck not found'}
          </p>
          <Link href="/decks">
            <Button>Back to Decks</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Permission check
  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to edit this deck.
          </p>
          <Link href={`/decks/${deckId}`}>
            <Button>View Deck</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/decks/${deckId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('decks.editDeck')}</h1>
          <p className="text-muted-foreground">{t('decks.editYourDeck')}</p>
        </div>
        {canArchive && (
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={archiving || loading}
          >
            {archiving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {deck.archived ? t('decks.unarchiving') : t('decks.archiving')}
              </>
            ) : deck.archived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                {t('decks.unarchive')}
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                {t('decks.archive')}
              </>
            )}
          </Button>
        )}
      </div>

      {deck.archived && (
        <Card className="mb-6 border-warning/40 bg-warning/10">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground/90 flex items-start gap-2">
              <Archive className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
              {t('decks.archivedDeckNotice')}
            </p>
          </CardContent>
        </Card>
      )}

      {showArchiveConfirm && !deck.archived && (
        <Card className="mb-6 border-warning/40 bg-warning/10">
          <CardContent className="pt-6">
            <p className="font-medium mb-2">{t('decks.archiveConfirmTitle')}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('decks.archiveConfirmDescription')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveConfirm(false)}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleArchive}
                disabled={archiving}
              >
                {archiving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('decks.archiving')}
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    {t('decks.archiveDeck')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about your deck</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Deck Name */}
            <div>
              <label className="text-sm font-medium">Deck Name *</label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your deck name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Commander */}
            <div>
              <label className="text-sm font-medium">Commander *</label>
              <Input
                value={formData.commander}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, commander: e.target.value })
                }
                placeholder="Enter your commander's name"
                className={errors.commander ? 'border-red-500' : ''}
              />
              {errors.commander && (
                <p className="text-sm text-red-500 mt-1">{errors.commander}</p>
              )}
            </div>

            {/* Decklist Link */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Decklist Link
              </label>
              <Input
                value={formData.decklistLink}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, decklistLink: e.target.value })
                }
                placeholder="https://moxfield.com/decks/..."
                className={errors.decklistLink ? 'border-red-500' : ''}
              />
              {errors.decklistLink && (
                <p className="text-sm text-red-500 mt-1">{errors.decklistLink}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Link to your decklist on Moxfield, Archidekt, or similar
              </p>
            </div>

            {/* Deck Image */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Deck Image URL
              </label>
              <Input
                value={formData.deckImage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, deckImage: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                className={errors.deckImage ? 'border-red-500' : ''}
              />
              {errors.deckImage && (
                <p className="text-sm text-red-500 mt-1">{errors.deckImage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                URL to an image representing your deck
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Color Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Color Identity</CardTitle>
            <CardDescription>Select the colors in your commander&apos;s identity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <Badge
                  key={color.id}
                  variant={formData.colorIdentity.includes(color.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    formData.colorIdentity.includes(color.id) 
                      ? color.color 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => toggleColorIdentity(color.id)}
                >
                  {color.id} - {color.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tags/Archetypes */}
        <Card>
          <CardHeader>
            <CardTitle>Tags & Archetypes</CardTitle>
            <CardDescription>Categorize your deck strategy and style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Selected Tags</label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="default" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Common Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">Common Archetypes</label>
              <div className="flex flex-wrap gap-2">
                {commonTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={formData.tags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.tags.includes(tag) 
                        ? '' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => 
                      formData.tags.includes(tag) ? removeTag(tag) : addTag(tag)
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Add Custom Tag</label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  placeholder="Enter custom tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                />
                <Button type="button" onClick={addCustomTag} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href={`/decks/${deckId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              {t('actions.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('decks.updating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('actions.save')}
              </>
            )}
          </Button>
        </div>

        {errors.submit && (
          <div className="text-center">
            <p className="text-sm text-red-500">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
}