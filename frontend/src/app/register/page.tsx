'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, User, Mail, Loader2, UserPlus, Sparkles, Languages } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { user, login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt-BR' : 'en');
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('validation.nameMinLength');
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.passwordMinLength');
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
    }

    // Profile image validation (optional)
    if (formData.profileImage && !isValidUrl(formData.profileImage)) {
      newErrors.profileImage = t('validation.imageUrlInvalid');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || undefined,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          profileImage: formData.profileImage.trim() || undefined,
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after successful registration
        login(data.user, data.token);
        router.push('/dashboard');
      } else {
        setErrors({ submit: data.message || t('validation.accountCreationFailed') });
      }
    } catch (error) {
      setErrors({ submit: t('validation.accountCreationError') });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Don't render if user is already logged in
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-900/50 to-slate-950" />
      
      {/* Language Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className="fixed top-4 left-4 z-50 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/90"
        title={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
      >
        <Languages className="h-5 w-5 text-gray-300" />
      </Button>
      
      {/* Floating Particles Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <UserPlus className="h-2 w-2 text-purple-400/30" />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-30 animate-pulse"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-full p-4 border border-slate-700/50">
              <UserPlus className="h-12 w-12 text-purple-400 mx-auto" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {language === 'en' ? 'Join the Playgroup' : 'Junte-se ao Grupo'}
          </h1>
          <p className="text-gray-400">
            {language === 'en' ? 'Create your account to start tracking Commander games' : 'Crie sua conta para começar a rastrear partidas de Commander'}
          </p>
        </div>

        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-xl">
              <UserPlus className="h-5 w-5 text-purple-400" />
              {t('auth.createAccount')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {language === 'en' ? 'Fill in your details to join Guerreiros do Segundo Lugar' : 'Preencha seus dados para entrar em Guerreiros do Segundo Lugar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('auth.name')} *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder={language === 'en' ? 'Enter your full name' : 'Digite seu nome completo'}
                  className={`bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Nickname */}
              <div>
                <label htmlFor="nickname" className="text-sm font-medium text-gray-300">
                  {t('auth.nickname')} ({t('form.optional')})
                </label>
                <Input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={handleInputChange('nickname')}
                  placeholder={language === 'en' ? 'Display name for games' : 'Nome de exibição para partidas'}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'en' ? 'This will be shown during games if provided' : 'Será mostrado durante as partidas se fornecido'}
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('auth.email')} *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder={language === 'en' ? 'Enter your email' : 'Digite seu email'}
                  className={`bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder={language === 'en' ? 'Create a secure password' : 'Crie uma senha segura'}
                    className={`bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  {t('auth.confirmPassword')} *
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    placeholder={language === 'en' ? 'Confirm your password' : 'Confirme sua senha'}
                    className={`bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Profile Image */}
              <div>
                <label htmlFor="profileImage" className="text-sm font-medium text-gray-300">
                  {t('players.profileImage')} ({t('form.optional')})
                </label>
                <Input
                  id="profileImage"
                  type="url"
                  value={formData.profileImage}
                  onChange={handleInputChange('profileImage')}
                  placeholder="https://example.com/your-photo.jpg"
                  className={`bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 ${errors.profileImage ? 'border-red-500' : ''}`}
                />
                {errors.profileImage && (
                  <p className="text-sm text-red-400 mt-1">{errors.profileImage}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'en' ? 'Link to your profile picture (Gravatar, social media, etc.)' : 'Link para sua foto de perfil (Gravatar, redes sociais, etc.)'}
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 text-base border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'en' ? 'Creating Account...' : 'Criando Conta...'}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('auth.createAccount')}
                  </>
                )}
              </Button>

              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{errors.submit}</p>
                </div>
              )}

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-slate-700/50">
                <p className="text-gray-400 text-sm">
                  {t('auth.alreadyHaveAccount')}{' '}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    {language === 'en' ? 'Sign in here' : 'Entre aqui'}
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          Welcome to the multiverse of Commander! 🎯
        </p>
      </div>
    </div>
  );
}