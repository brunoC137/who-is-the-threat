'use client';

import {
  ChevronDown,
  ChevronUp,
  Dices,
  Flag,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime } from './utils';

interface GameTopBarProps {
  elapsedSeconds: number;
  isTimerRunning: boolean;
  hasEnded: boolean;
  canUndo: boolean;
  commentaryCount: number;
  isRolling: boolean;
  isSaving: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onToggleTimer: () => void;
  onUndo: () => void;
  onRollFirstPlayer: () => void;
  onOpenNotes: () => void;
  onEndGame: () => void;
  onSave: () => void;
  onExit: () => void;
  t: (key: string) => string;
}

/**
 * One slim bar holds every game control. In landscape on a phone the viewport
 * is ~390px tall, so a second fixed bar at the bottom would cost the board
 * roughly a third of its height for no benefit.
 */
export function GameTopBar({
  elapsedSeconds,
  isTimerRunning,
  hasEnded,
  canUndo,
  commentaryCount,
  isRolling,
  isSaving,
  collapsed,
  onToggleCollapsed,
  onToggleTimer,
  onUndo,
  onRollFirstPlayer,
  onOpenNotes,
  onEndGame,
  onSave,
  onExit,
  t,
}: GameTopBarProps) {
  /**
   * Collapsed, the bar leaves the layout entirely so the board gets the whole
   * viewport, and only the two controls worth interrupting a game for float
   * on top: the elapsed time, and undo.
   *
   * Undo stays out because it is the one control people reach for in a hurry —
   * right after a mis-tap, usually while the table is arguing about what just
   * happened. Everything else (dice, notes, exit, end game) is deliberate
   * enough to cost an extra tap.
   */
  if (collapsed) {
    return (
      <div className="pointer-events-none absolute left-1.5 top-1.5 z-30 flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={t('currentGame.showControls')}
          aria-expanded={false}
          className="pointer-events-auto flex h-8 items-center gap-1 rounded-full border border-border/60 bg-card/80 px-2 backdrop-blur-md"
        >
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-xs font-bold tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={t('currentGame.undo')}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card/80 backdrop-blur-md disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b border-border/50 bg-card/80 px-1.5 backdrop-blur-xl">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onExit}
        aria-label={t('actions.close')}
      >
        <X className="h-4 w-4" />
      </Button>

      <button
        type="button"
        onClick={onToggleTimer}
        disabled={hasEnded}
        aria-label={t('currentGame.toggleTimer')}
        className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-sm font-mono font-bold tabular-nums hover:bg-muted disabled:opacity-60"
      >
        {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        {formatTime(elapsedSeconds)}
      </button>

      <div className="flex flex-1 items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRollFirstPlayer}
          disabled={isRolling || hasEnded}
          aria-label={t('currentGame.rollForFirst')}
        >
          <Dices className={`h-4 w-4 ${isRolling ? 'animate-spin' : ''}`} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={t('currentGame.undo')}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          onClick={onOpenNotes}
          aria-label={t('currentGame.gameCommentary')}
        >
          <MessageSquare className="h-4 w-4" />
          {commentaryCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
              {commentaryCount}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleCollapsed}
          aria-label={t('currentGame.hideControls')}
          aria-expanded
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      {hasEnded ? (
        <Button size="sm" className="h-8 shrink-0 px-2 text-xs font-bold" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1 h-3.5 w-3.5" />
          )}
          {isSaving ? t('currentGame.saving') : t('currentGame.saveGame')}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 px-2 text-xs font-bold"
          onClick={onEndGame}
        >
          <Flag className="mr-1 h-3.5 w-3.5" />
          {t('currentGame.endGame')}
        </Button>
      )}
    </header>
  );
}
