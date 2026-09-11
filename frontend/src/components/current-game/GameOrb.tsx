'use client';

import { Fragment, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Check,
  Dices,
  Flag,
  HelpCircle,
  LayoutGrid,
  Loader2,
  LogOut,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Save,
  Swords,
  X,
} from 'lucide-react';
import { formatTime, haptic } from './utils';
import { useOrbLabels } from './hooks';

interface GameOrbProps {
  elapsedSeconds: number;
  isTimerRunning: boolean;
  hasEnded: boolean;
  canUndo: boolean;
  commentaryCount: number;
  isRolling: boolean;
  isSaving: boolean;
  arranging: boolean;
  onToggleArranging: () => void;
  onToggleBoardView: () => void;
  commanderShortcuts: boolean;
  onToggleCommanderShortcuts: () => void;
  onToggleTimer: () => void;
  onUndo: () => void;
  onRollFirstPlayer: () => void;
  onOpenNotes: () => void;
  onEndGame: () => void;
  onSave: () => void;
  onExit: () => void;
  t: (key: string) => string;
}

interface OrbAction {
  key: string;
  Icon: LucideIcon;
  label: string;
  /** Short name shown beside the button while captions are on. */
  caption: string;
  onClick: () => void;
  disabled?: boolean;
  /** Stay open afterwards: undo and pause are often pressed several times. */
  keepOpen?: boolean;
  tone?: 'primary' | 'warning';
  /** A toggle that is currently on. */
  active?: boolean;
  badge?: number;
  spin?: boolean;
}

const ORB_SIZE = 52;
const ACTION_SIZE = 44;
/** Distance from the orb's centre to each action's centre: ten 44px actions need ~58px apart. */
const RING_RADIUS = 92;
/**
 * Where each caption's inner edge sits: just outside its button, on the line
 * from the orb through it. Anchoring the edge rather than the centre keeps a
 * long caption ("End game", "Roll first") from reaching back over its button.
 */
const CAPTION_RADIUS = RING_RADIUS + ACTION_SIZE / 2 + 8;

const TONE: Record<NonNullable<OrbAction['tone']> | 'default' | 'active', string> = {
  default: 'border-border bg-card text-foreground',
  active: 'border-primary/70 bg-card text-primary',
  primary: 'border-primary bg-primary text-primary-foreground',
  warning: 'border-warning/60 bg-card text-warning',
};

/**
 * The sides view's game controls, folded into one orb at the centre of the
 * board so every pixel between the two rows goes to the panels.
 *
 * Closed, it shows the game clock (or a save prompt once the game is over).
 * Open, the actions fan out in a ring over a dimmed board — icons read the
 * same from either side of the table, which a labelled bar would not.
 * While the table is still learning them, short captions name each action
 * (see useOrbLabels).
 *
 * Positioned from a zero-size anchor at the board's centre (see GameBoard)
 * with offsets rather than transforms: a transformed ancestor would become
 * the containing block for the fixed backdrop and shrink it to nothing.
 */
export function GameOrb({
  elapsedSeconds,
  isTimerRunning,
  hasEnded,
  canUndo,
  commentaryCount,
  isRolling,
  isSaving,
  arranging,
  onToggleArranging,
  onToggleBoardView,
  commanderShortcuts,
  onToggleCommanderShortcuts,
  onToggleTimer,
  onUndo,
  onRollFirstPlayer,
  onOpenNotes,
  onEndGame,
  onSave,
  onExit,
  t,
}: GameOrbProps) {
  const [open, setOpen] = useState(false);
  const { showLabels, toggleLabels, recordOpen } = useOrbLabels();

  if (arranging) {
    return (
      <div className="pointer-events-auto absolute left-0 top-0 flex w-60 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
        <p className="rounded-md bg-card/95 px-2 py-1 text-center text-[11px] leading-tight shadow-lg">
          {t('currentGame.arrangeHint')}
        </p>
        <button
          type="button"
          onClick={onToggleArranging}
          className="flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-glow-md"
        >
          <Check className="h-4 w-4" />
          {t('currentGame.doneArranging')}
        </button>
      </div>
    );
  }

  const actions: OrbAction[] = [
    {
      key: 'undo',
      Icon: RotateCcw,
      label: t('currentGame.undo'),
      caption: t('currentGame.captionUndo'),
      onClick: onUndo,
      disabled: !canUndo,
      keepOpen: true,
    },
    {
      key: 'timer',
      Icon: isTimerRunning ? Pause : Play,
      label: t('currentGame.toggleTimer'),
      caption: t(isTimerRunning ? 'currentGame.captionPause' : 'currentGame.captionResume'),
      onClick: onToggleTimer,
      disabled: hasEnded,
      keepOpen: true,
    },
    {
      key: 'dice',
      Icon: Dices,
      label: t('currentGame.rollForFirst'),
      caption: t('currentGame.captionDice'),
      onClick: onRollFirstPlayer,
      disabled: isRolling || hasEnded,
      spin: isRolling,
    },
    {
      key: 'arrange',
      Icon: ArrowLeftRight,
      label: t('currentGame.arrangeSeats'),
      caption: t('currentGame.captionSeats'),
      onClick: onToggleArranging,
      disabled: isRolling,
    },
    {
      key: 'view',
      Icon: LayoutGrid,
      label: t('currentGame.switchBoardView'),
      caption: t('currentGame.captionView'),
      onClick: onToggleBoardView,
    },
    {
      key: 'shortcuts',
      Icon: Swords,
      label: t('currentGame.toggleCommanderShortcuts'),
      caption: t('currentGame.captionShortcuts'),
      onClick: onToggleCommanderShortcuts,
      active: commanderShortcuts,
    },
    {
      key: 'notes',
      Icon: MessageSquare,
      label: t('currentGame.gameCommentary'),
      caption: t('currentGame.captionNotes'),
      onClick: onOpenNotes,
      badge: commentaryCount,
    },
    hasEnded
      ? {
          key: 'save',
          Icon: isSaving ? Loader2 : Save,
          label: isSaving ? t('currentGame.saving') : t('currentGame.saveGame'),
          caption: t('currentGame.captionSave'),
          onClick: onSave,
          disabled: isSaving,
          tone: 'primary',
          spin: isSaving,
        }
      : {
          key: 'end',
          Icon: Flag,
          label: t('currentGame.endGame'),
          caption: t('currentGame.captionEnd'),
          onClick: onEndGame,
          tone: 'warning',
        },
    // Not X: that is the orb's own close icon, right next to it
    {
      key: 'exit',
      Icon: LogOut,
      label: t('actions.close'),
      caption: t('currentGame.captionExit'),
      onClick: onExit,
    },
    {
      key: 'help',
      Icon: HelpCircle,
      label: t('currentGame.toggleOrbLabels'),
      // Only visible while captions are on, so it names what it will do
      caption: t('currentGame.captionHelp'),
      onClick: toggleLabels,
      active: showLabels,
      keepOpen: true,
    },
  ];

  const close = () => setOpen(false);

  return (
    <>
      {open && (
        <div
          className="pointer-events-auto fixed inset-0 z-30 bg-black/55"
          onClick={close}
          aria-hidden
        />
      )}

      {open &&
        actions.map((action, index) => {
          // Clockwise from the top
          const angle = (index / actions.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * RING_RADIUS;
          const y = Math.sin(angle) * RING_RADIUS;

          return (
            <Fragment key={action.key}>
            <button
              type="button"
              aria-label={action.label}
              title={action.label}
              aria-pressed={action.active}
              disabled={action.disabled}
              onClick={() => {
                haptic();
                action.onClick();
                if (!action.keepOpen) close();
              }}
              className={`pointer-events-auto absolute z-40 flex items-center justify-center rounded-full border shadow-lg transition-opacity disabled:opacity-40 ${
                action.active ? TONE.active : TONE[action.tone ?? 'default']
              }`}
              style={{
                width: ACTION_SIZE,
                height: ACTION_SIZE,
                left: x - ACTION_SIZE / 2,
                top: y - ACTION_SIZE / 2,
              }}
            >
              <action.Icon className={`h-5 w-5 ${action.spin ? 'animate-spin' : ''}`} />
              {!!action.badge && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {action.badge}
                </span>
              )}
            </button>

            {showLabels && (
              <span
                aria-hidden
                className="pointer-events-none absolute z-40 whitespace-nowrap rounded-md bg-card/95 px-1.5 py-0.5 text-[11px] font-medium leading-tight text-foreground shadow-lg"
                style={{
                  left: Math.cos(angle) * CAPTION_RADIUS,
                  top: Math.sin(angle) * CAPTION_RADIUS,
                  // Centre on the point, then push outward by half the caption's
                  // own size along the ring's direction (% is of the caption)
                  transform: `translate(${-50 + Math.cos(angle) * 50}%, ${-50 + Math.sin(angle) * 50}%)`,
                }}
              >
                {action.caption}
              </span>
            )}
            </Fragment>
          );
        })}

      <button
        type="button"
        onClick={() => {
          haptic();
          if (!open) recordOpen();
          setOpen(!open);
        }}
        aria-label={open ? t('actions.close') : t('currentGame.openControls')}
        aria-expanded={open}
        className={`pointer-events-auto absolute z-40 flex flex-col items-center justify-center gap-0.5 rounded-full border shadow-glow-md backdrop-blur-md transition-colors ${
          hasEnded && !open
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-primary/60 bg-card/90 text-foreground'
        }`}
        style={{
          width: ORB_SIZE,
          height: ORB_SIZE,
          left: -ORB_SIZE / 2,
          top: -ORB_SIZE / 2,
        }}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : hasEnded ? (
          <Save className="h-5 w-5" />
        ) : (
          <>
            {!isTimerRunning && <Pause className="h-3 w-3 text-muted-foreground" />}
            <span className="font-mono text-[11px] font-bold tabular-nums leading-none">
              {formatTime(elapsedSeconds)}
            </span>
          </>
        )}
      </button>
    </>
  );
}
