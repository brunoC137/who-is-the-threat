'use client';

import { Button } from '@/components/ui/button';
import { Clock, X, Pause, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from './utils';

interface GameTopBarProps {
  elapsedTime: number;
  isTimerRunning: boolean;
  gameEnded: boolean;
  canUndo: boolean;
  onToggleTimer: () => void;
  onUndo: () => void;
  onToggleCommentary: () => void;
}

export function GameTopBar({
  elapsedTime,
  isTimerRunning,
  gameEnded,
  canUndo,
  onToggleTimer,
  onUndo,
  onToggleCommentary,
}: GameTopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50 px-2 sm:px-4 py-2">
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-2">
          <Link href="/games">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-sm sm:text-lg font-mono font-bold">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleCommentary}
            className="h-8 text-xs"
          >
            💬
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTimer}
            disabled={gameEnded}
            className="h-8 w-8 p-0"
          >
            {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
