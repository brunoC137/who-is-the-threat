'use client';

import { useAuth } from '@/context/AuthContext';
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
  X
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Players',
    href: '/players',
    icon: Users,
  },
  {
    name: 'Decks',
    href: '/decks',
    icon: Layers,
  },
  {
    name: 'Games',
    href: '/games',
    icon: Trophy,
  },
  {
    name: 'Statistics',
    href: '/stats',
    icon: BarChart3,
  },
];

interface NavigationProps {
  children: React.ReactNode;
}

export function Navigation({ children }: NavigationProps) {
  const { user, logout } = useAuth();
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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 border-r">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Guerreiros do Segundo Lugar
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
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="border-t pt-4">
                  <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold text-foreground">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="sr-only">Your profile</span>
                    <span>{user?.nickname || user?.name}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Link
                      href="/profile"
                      className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <User className="h-6 w-6 shrink-0" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <LogOut className="h-6 w-6 shrink-0" />
                      Sign out
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
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6">
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
              <Link href="/dashboard" className="text-lg font-bold text-primary">
                Guerreiros
              </Link>
              <Link href="/games/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Game
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r">
              <div className="flex h-16 shrink-0 items-center px-6">
                <Link 
                  href="/dashboard" 
                  className="text-lg font-bold text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Guerreiros do Segundo Lugar
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
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              }`}
                            >
                              <item.icon className="h-6 w-6 shrink-0" />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold text-foreground">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <span>{user?.nickname || user?.name}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsOpen(false)}
                          className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          <User className="h-6 w-6 shrink-0" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          <LogOut className="h-6 w-6 shrink-0" />
                          Sign out
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