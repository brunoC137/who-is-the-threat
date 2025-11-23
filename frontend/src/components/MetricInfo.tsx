'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface MetricInfoProps {
  title: string;
  description: string;
  formula?: string;
}

export function MetricInfo({ title, description, formula }: MetricInfoProps) {
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  return (
    <>
      {/* Desktop: Tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="hidden md:inline-flex ml-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Information about ${title}`}
            >
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">{title}</p>
              <p className="text-sm">{description}</p>
              {formula && (
                <p className="text-xs font-mono bg-muted p-2 rounded">{formula}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Mobile: Click to show dialog */}
      <button
        onClick={() => setShowMobileInfo(!showMobileInfo)}
        className="md:hidden ml-2 text-muted-foreground hover:text-foreground transition-colors inline-flex"
        aria-label={`Information about ${title}`}
      >
        <Info className="h-4 w-4" />
      </button>

      {/* Mobile Info Panel */}
      {showMobileInfo && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowMobileInfo(false)}>
          <div 
            className="bg-background border-t rounded-t-xl p-6 w-full animate-in slide-in-from-bottom-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
              {formula && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs font-semibold mb-1">Formula:</p>
                  <p className="text-xs font-mono">{formula}</p>
                </div>
              )}
              <Button 
                onClick={() => setShowMobileInfo(false)}
                className="w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
