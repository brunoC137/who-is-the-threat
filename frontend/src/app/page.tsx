'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
            Guerreiros do Segundo Lugar
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track and visualize Commander (EDH) games among friends
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-md font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">Track Games</h3>
            <p className="text-muted-foreground">
              Record game results, participants, and deck performance with ease.
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">Manage Decks</h3>
            <p className="text-muted-foreground">
              Keep track of your Commander decks and their win rates.
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">View Statistics</h3>
            <p className="text-muted-foreground">
              Analyze player and deck performance with detailed statistics.
            </p>
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