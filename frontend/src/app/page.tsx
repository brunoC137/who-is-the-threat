'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Package, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <div className="relative min-h-screen">
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

        <div className="container mx-auto px-4 py-12">
        {/* Hero Section with Gradient */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur-3xl animate-gradient-shift" />
          </div>
          
          <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Commander EDH Tracking</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Guerreiros do Segundo Lugar
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Track and visualize your Commander games with style. Analyze your decks, compete with friends, and climb the leaderboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-glow-md transition-all duration-300 hover:shadow-glow-lg hover:-translate-y-1">
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </Link>
            <Link href="/register">
              <button className="px-8 py-4 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 hover:border-primary/50 font-semibold transition-all duration-300 hover:-translate-y-1">
                Sign Up Free
              </button>
            </Link>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="group relative overflow-hidden rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-glow-sm hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Games</h3>
              <p className="text-muted-foreground">
                Record game results, track participants, and analyze deck performance with comprehensive statistics.
              </p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-accent/50 hover:shadow-glow-sm hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-6">
                <Package className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Manage Decks</h3>
              <p className="text-muted-foreground">
                Organize your Commander decks and monitor their win rates, strategies, and overall performance.
              </p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-success/50 hover:shadow-glow-sm hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">View Statistics</h3>
              <p className="text-muted-foreground">
                Deep dive into player and deck analytics with detailed statistics, charts, and leaderboards.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-center mb-12">Why Commander Players Love Us</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  100%
                </div>
                <div className="text-sm text-muted-foreground">Free Forever</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  ∞
                </div>
                <div className="text-sm text-muted-foreground">Unlimited Decks</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  📊
                </div>
                <div className="text-sm text-muted-foreground">Detailed Stats</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  📱
                </div>
                <div className="text-sm text-muted-foreground">Mobile First</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}