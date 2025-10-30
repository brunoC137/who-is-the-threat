'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Shield,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function NewPlayerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: '',
    isAdmin: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.profileImage && !isValidUrl(formData.profileImage)) {
      newErrors.profileImage = 'Please enter a valid image URL';
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
      const playerData = {
        name: formData.name,
        nickname: formData.nickname || undefined,
        email: formData.email,
        password: formData.password,
        profileImage: formData.profileImage || undefined,
        isAdmin: formData.isAdmin,
      };

      // Use the register endpoint for creating new players
      await authAPI.register(playerData);
      router.push('/players');
    } catch (error: any) {
      setErrors({ submit: 'An error occurred while creating the player' });
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to create players.
          </p>
          <Link href="/players">
            <Button>Back to Players</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/players">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Player</h1>
          <p className="text-muted-foreground">Add a new player to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture Preview</CardTitle>
            <CardDescription>How the profile picture will appear</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Avatar className="w-24 h-24">
              <AvatarImage src={formData.profileImage} alt={formData.name} />
              <AvatarFallback className="text-2xl">
                {formData.name.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Personal details for the new player</CardDescription>
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
                placeholder="Enter full name"
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
                If provided, this will be displayed instead of the full name
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
                placeholder="Enter email address"
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
                placeholder="https://example.com/photo.jpg"
                className={errors.profileImage ? 'border-red-500' : ''}
              />
              {errors.profileImage && (
                <p className="text-sm text-red-500 mt-1">{errors.profileImage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                URL to the player&apos;s profile picture (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Account Setup</CardTitle>
            <CardDescription>Login credentials and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Password */}
            <div>
              <label className="text-sm font-medium">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium">Confirm Password *</label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Admin Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, isAdmin: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Make this player an administrator
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Administrators can manage all players, decks, and games
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/players" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Player
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