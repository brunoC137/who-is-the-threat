'use client';

import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ServiceWorkerRegistration />
        {children}
        <PWAInstallBanner />
      </AuthProvider>
    </LanguageProvider>
  );
}