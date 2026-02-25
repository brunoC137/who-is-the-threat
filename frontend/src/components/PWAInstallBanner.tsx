'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';

const DISMISSED_KEY = 'pwa-install-dismissed';

export function PWAInstallBanner() {
  const { isInstallable, isIOS, isInstalled, promptInstall } = usePWAInstall();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handleInstall = async () => {
    await promptInstall();
    setDismissed(true);
  };

  const shouldShow = !dismissed && !isInstalled && (isInstallable || isIOS);

  if (!shouldShow) return null;

  return (
    <div
      role="banner"
      aria-label={t('pwa.bannerLabel')}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-inset-bottom"
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('pwa.title')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS ? t('pwa.descriptionIOS') : t('pwa.description')}
            </p>
            {isIOS && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Share className="h-3 w-3 inline-block flex-shrink-0" />
                {t('pwa.iosInstructions')}
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            aria-label={t('actions.close')}
            className="flex-shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIOS && (
          <div className="mt-3 flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              {t('pwa.notNow')}
            </Button>
            <Button size="sm" onClick={handleInstall} className="shadow-glow-sm">
              <Download className="h-4 w-4 mr-1.5" />
              {t('pwa.install')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
