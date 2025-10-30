'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User,
  Mail,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
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
}

export default function EditPlayerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch player data on mount
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await playersAPI.getById(playerId);
        const playerData = response.data.data || response.data;
        setPlayer(playerData);
        
        // Pre-populate form
        setFormData(prev => ({
          ...prev,
          name: playerData.name || '',
          nickname: playerData.nickname || '',
          email: playerData.email || '',
          profileImage: playerData.profileImage || '',
        }));
      } catch (error) {
        console.error('Error fetching player:', error);
        setErrors({ fetch: 'Failed to load player data' });
      } finally {
        setInitialLoading(false);
      }
    };

    if (playerId) {
      fetchPlayer();
    }
  }, [playerId]);

  // Check permissions
  const canEdit = user && player && (user.isAdmin || user.id === player._id);
  const isEditingSelf = user && player && user.id === player._id;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.profileImage && !isValidUrl(formData.profileImage)) {
      newErrors.profileImage = 'Please enter a valid image URL';
    }

    // Password validation (only if changing password)
    if (showChangePassword) {
      if (isEditingSelf && !formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
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
      // Prepare update data
      const updateData: any = {
        name: formData.name,
        nickname: formData.nickname || undefined,
        email: formData.email,
        profileImage: formData.profileImage || undefined,
      };

      // Add password data if changing password
      if (showChangePassword && formData.newPassword) {
        if (isEditingSelf) {
          updateData.currentPassword = formData.currentPassword;
        }
        updateData.newPassword = formData.newPassword;
      }

      await playersAPI.update(playerId, updateData);
      
      // Update user context if editing self
      if (isEditingSelf && user) {
        const updatedUser = {
          ...user,
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email,
          profileImage: formData.profileImage,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Note: In a real app, you might want to trigger a context update here
      }

      router.push(`/players/${playerId}`);
    } catch (error: any) {
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to update player profile' 
      });
    } finally {
      setLoading(false);
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
  if (errors.fetch || !player) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {errors.fetch || 'Player not found'}
          </p>
          <Link href="/players">
            <Button>Back to Players</Button>
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
            You don&apos;t have permission to edit this player profile.
          </p>
          <Link href={`/players/${playerId}`}>
            <Button>View Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/players/${playerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {isEditingSelf ? 'Edit Your Profile' : 'Edit Player Profile'}
          </h1>
          <p className="text-muted-foreground">Update player information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Preview of your profile image</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Avatar className="w-24 h-24">
              <AvatarImage src={formData.profileImage} alt={formData.name} />
              <AvatarFallback className="text-2xl">
                {formData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label className="text-sm font-medium">Nickname (Display Name)</label>
              <Input
                value={formData.nickname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, nickname: e.target.value })
                }
                placeholder="Enter a nickname (optional)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If provided, this will be displayed instead of your full name
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter your email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Profile Image URL */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Profile Image URL
              </label>
              <Input
                value={formData.profileImage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, profileImage: e.target.value })
                }
                placeholder="https://example.com/your-photo.jpg"
                className={errors.profileImage ? 'border-red-500' : ''}
              />
              {errors.profileImage && (
                <p className="text-sm text-red-500 mt-1">{errors.profileImage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                URL to your profile picture (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Change Password
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                {showChangePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardTitle>
            <CardDescription>
              {showChangePassword 
                ? 'Update your account password' 
                : 'Click the eye icon to change your password'
              }
            </CardDescription>
          </CardHeader>
          {showChangePassword && (
            <CardContent className="space-y-4">
              {/* Current Password (only for self-editing) */}
              {isEditingSelf && (
                <div>
                  <label className="text-sm font-medium">Current Password *</label>
                  <Input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    placeholder="Enter your current password"
                    className={errors.currentPassword ? 'border-red-500' : ''}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>
                  )}
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="text-sm font-medium">New Password *</label>
                <Input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  placeholder="Enter a new password"
                  className={errors.newPassword ? 'border-red-500' : ''}
                />
                {errors.newPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-medium">Confirm New Password *</label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm your new password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href={`/players/${playerId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
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