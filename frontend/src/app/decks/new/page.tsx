'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

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

export default function NewDeckPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    commander: '',
    decklistLink: '',
    deckImage: '',
    colorIdentity: [] as string[],
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/decks');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to create deck' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while creating the deck' });
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to create a deck.</p>
          <Link href="/login">
            <Button className="mt-4">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/decks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('decks.createNewDeck')}</h1>
          <p className="text-muted-foreground">{t('decks.buildYourDeck')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personalInfo')}</CardTitle>
            <CardDescription>{t('decks.deckDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Deck Name */}
            <div>
              <label className="text-sm font-medium">{t('decks.deckName')} *</label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t('decks.enterDeckName')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Commander */}
            <div>
              <label className="text-sm font-medium">{t('decks.commander')} *</label>
              <Input
                value={formData.commander}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, commander: e.target.value })
                }
                placeholder={t('decks.enterCommander')}
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
                {t('decks.decklistLinkOptional')}
              </label>
              <Input
                value={formData.decklistLink}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, decklistLink: e.target.value })
                }
                placeholder={t('decks.enterDecklistLink')}
                className={errors.decklistLink ? 'border-red-500' : ''}
              />
              {errors.decklistLink && (
                <p className="text-sm text-red-500 mt-1">{errors.decklistLink}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t('decks.enterDecklistLink')}
              </p>
            </div>

            {/* Deck Image */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {t('decks.deckImageOptional')}
              </label>
              <Input
                value={formData.deckImage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, deckImage: e.target.value })
                }
                placeholder={t('decks.enterImageUrl')}
                className={errors.deckImage ? 'border-red-500' : ''}
              />
              {errors.deckImage && (
                <p className="text-sm text-red-500 mt-1">{errors.deckImage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t('decks.enterImageUrl')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Color Identity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('decks.colorIdentity')}</CardTitle>
            <CardDescription>{t('decks.selectColors')}</CardDescription>
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
            <CardTitle>{t('decks.tagsOptional')}</CardTitle>
            <CardDescription>{t('decks.selectTags')}</CardDescription>
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
                            <label className="text-sm font-medium mb-2 block">{t('decks.addCustomTag')}</label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  placeholder={t('decks.customTag')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addCustomTag}
                  disabled={!newTag.trim()}
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/decks" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              {t('actions.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('decks.creating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('decks.createDeck')}
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