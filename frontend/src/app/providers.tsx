'use client';

import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <PWAInstallBanner />
      </AuthProvider>
    </LanguageProvider>
  );
}