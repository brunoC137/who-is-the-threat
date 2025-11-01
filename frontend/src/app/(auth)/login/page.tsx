'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock, Sparkles, Crown, Languages } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || t('messages.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt-BR' : 'en');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
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
        {[...Array(20)].map((_, i) => (
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
            <Sparkles className="h-2 w-2 text-blue-400/30" />
          </div>
        ))}
      </div>

      {/* MTG Artwork Easter Egg */}
      <div 
        className={`fixed top-4 right-4 transition-all duration-500 cursor-pointer z-50 ${
          showEasterEgg ? 'scale-100 opacity-100' : 'scale-50 opacity-30 hover:scale-75 hover:opacity-60'
        }`}
        onClick={() => setShowEasterEgg(!showEasterEgg)}
      >
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-lg p-2 border border-slate-700/50">
            <Image 
              src="https://i.imgur.com/YBQD2Q6.jpeg" 
              alt="MTG Artwork Easter Egg" 
              width={showEasterEgg ? 192 : 48}
              height={showEasterEgg ? 267 : 48}
              className={`transition-all duration-300 rounded ${
                showEasterEgg ? 'w-48 h-auto' : 'w-12 h-12 object-cover'
              }`}
              unoptimized
            />
            {showEasterEgg && (
              <div className="mt-2 text-xs text-gray-300 text-center">
                <p className="font-semibold">Epic MTG Art! ✨</p>
                <p className="text-gray-400">Click to minimize</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30 animate-pulse"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-full p-4 border border-slate-700/50">
              <Crown className="h-12 w-12 text-yellow-400 mx-auto" />
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-bold text-white">
            Guerreiros
          </h1>
          <p className="text-xl text-purple-400 font-medium">
            do Segundo Lugar
          </p>
          <p className="mt-2 text-gray-400 text-sm">
            {t('auth.enterBattlefield')}
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription className="text-gray-400">
              {t('auth.signInToContinue')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t('auth.enterEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder={t('auth.enterPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 text-base border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-slate-700/50">
              <p className="text-gray-400 text-sm">
                {t('auth.newToBattlefield')}{' '}
                <Link 
                  href="/register" 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {t('auth.createAccount')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          {t('auth.topdecksLegendary')}
        </p>
      </div>
    </div>
  );
}