'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Home, 
  Users, 
  Layers, 
  Trophy, 
  BarChart3, 
  User, 
  LogOut,
  Plus,
  X,
  Target,
  Languages
} from 'lucide-react';

interface NavigationProps {
  children: React.ReactNode;
}

export function Navigation({ children }: NavigationProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show navigation on auth pages
  if (pathname === '/login' || pathname === '/register' || !user) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt-BR' : 'en');
  };

  const navigationItems = [
    {
      name: t('nav.dashboard'),
      href: '/dashboard',
      icon: Home,
    },
    {
      name: t('nav.players'),
      href: '/players',
      icon: Users,
    },
    {
      name: t('nav.decks'),
      href: '/decks',
      icon: Layers,
    },
    {
      name: t('nav.games'),
      href: '/games',
      icon: Trophy,
    },
    {
      name: t('nav.eliminations'),
      href: '/eliminations',
      icon: Target,
    },
    {
      name: t('nav.statistics'),
      href: '/stats',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card/50 backdrop-blur-xl border-r border-border/50 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Guerreiros
              </span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-glow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <item.icon className={`h-6 w-6 shrink-0 ${isActive ? 'text-white' : ''}`} />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="border-t border-border/50 pt-4">
                  <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold text-foreground">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <span className="sr-only">Your profile</span>
                    <span className="truncate">{user?.nickname || user?.name}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <button
                      onClick={toggleLanguage}
                      className="group flex w-full gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                      title={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
                    >
                      <Languages className="h-6 w-6 shrink-0" />
                      <span>{language === 'en' ? 'EN' : 'PT'}</span>
                    </button>
                    <Link
                      href="/profile"
                      className="group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                      <User className="h-6 w-6 shrink-0" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="group flex w-full gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                      <LogOut className="h-6 w-6 shrink-0" />
                      {t('nav.signOut')}
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="-m-2.5 p-2.5"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Guerreiros
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleLanguage}
                  className="h-9 w-9"
                  title={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
                >
                  <Languages className="h-5 w-5" />
                </Button>
                <Link href="/games/new">
                  <Button size="sm" className="shadow-glow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('nav.newGame')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card/95 backdrop-blur-xl border-r border-border/50">
              <div className="flex h-16 shrink-0 items-center px-6">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Guerreiros
                  </span>
                </Link>
              </div>
              <nav className="flex flex-1 flex-col px-6 pb-4">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigationItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                                isActive
                                  ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-glow-sm'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              <item.icon className={`h-6 w-6 shrink-0 ${isActive ? 'text-white' : ''}`} />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <div className="border-t border-border/50 pt-4">
                      <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold text-foreground">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <span className="truncate">{user?.nickname || user?.name}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <button
                          onClick={() => {
                            toggleLanguage();
                            setIsOpen(false);
                          }}
                          className="group flex w-full gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                          <Languages className="h-6 w-6 shrink-0" />
                          <span>{language === 'en' ? 'English' : 'Português'}</span>
                        </button>
                        <Link
                          href="/profile"
                          onClick={() => setIsOpen(false)}
                          className="group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                          <User className="h-6 w-6 shrink-0" />
                          {t('nav.profile')}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="group flex w-full gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                          <LogOut className="h-6 w-6 shrink-0" />
                          {t('nav.signOut')}
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        <main className="py-4 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}