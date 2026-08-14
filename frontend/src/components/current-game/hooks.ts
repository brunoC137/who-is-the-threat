'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { Orientation } from './layout';
import { GameState } from './types';

/**
 * Board orientation, driven by aspect ratio rather than the orientation media
 * query so that a narrow desktop window is treated like a portrait device.
 * Defaults to landscape on the server, which is the primary target.
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('landscape');

  useEffect(() => {
    const query = window.matchMedia('(min-aspect-ratio: 1/1)');
    const apply = () => setOrientation(query.matches ? 'landscape' : 'portrait');

    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  return orientation;
}

/**
 * Live viewport size. Needed because the board's dialogs rotate, so whether a
 * dialog is "short" depends on its own rotation rather than on a plain CSS
 * media query against the viewport.
 */
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    const apply = () => setSize({ width: window.innerWidth, height: window.innerHeight });

    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);

    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);

  return size;
}

/**
 * Keeps the screen awake while a game is in progress. A Commander game runs
 * far past any sane screen timeout, and a tracker that blanks mid-turn is
 * worse than no tracker.
 *
 * The lock is dropped by the browser whenever the tab is hidden, so it is
 * re-acquired on visibilitychange.
 */
interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockNavigator {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const wakeLock = (navigator as Navigator & WakeLockNavigator).wakeLock;
    if (!active || !wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        sentinel = await wakeLock.request('screen');
      } catch {
        // Denied (low battery, unsupported, not user-activated). The game is
        // still perfectly playable, so there is nothing to report.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}

const HEADER_COLLAPSED_KEY = 'currentGame:headerCollapsed';

/**
 * Whether the control bar is collapsed, remembered across games. A group that
 * prefers the extra board height should not have to re-collapse every session.
 *
 * Starts expanded on the server and on first paint so the controls are never
 * hidden from someone who has not chosen to hide them; the stored preference
 * is applied on mount.
 */
export function useCollapsedHeader(): {
  collapsed: boolean;
  toggle: () => void;
  expandWithoutSaving: () => void;
} {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(HEADER_COLLAPSED_KEY) === 'true');
    } catch {
      // Preference is cosmetic; the default stands.
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed(current => {
      const next = !current;
      try {
        window.localStorage.setItem(HEADER_COLLAPSED_KEY, String(next));
      } catch {
        // Ignore; the toggle still works for this session.
      }
      return next;
    });
  }, []);

  /**
   * Reveal the controls without overwriting the stored preference. Used when
   * the game ends: Save Game lives in the bar, so a collapsed bar would leave
   * a finished game with no visible way to record it.
   */
  const expandWithoutSaving = useCallback(() => setCollapsed(false), []);

  return { collapsed, toggle, expandWithoutSaving };
}

const STORAGE_KEY = 'currentGame:v1';

interface PersistedGame {
  savedAt: number;
  state: GameState;
}

/**
 * A Commander game lasts hours. A reload, an accidental back swipe or the OS
 * evicting the tab must not cost the table its game, so the whole reducer
 * state is mirrored into localStorage.
 */
export function loadPersistedGame(): PersistedGame | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedGame;
    if (!parsed?.state?.players?.length) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function clearPersistedGame(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage full or blocked; nothing useful to do.
  }
}

export function usePersistedGame(state: GameState, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || state.players.length === 0) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: Date.now(), state })
      );
    } catch {
      // Persistence is a safety net, not a requirement.
    }
  }, [state, enabled]);
}

/**
 * Press-and-hold to repeat, for dragging a life total down quickly without
 * twenty separate taps. A normal tap fires exactly once.
 *
 * Two things this has to get right, both learned the hard way:
 *
 * 1. A repeat that never receives its matching pointerup runs away. Losing the
 *    pointer (leave/cancel), backgrounding the tab, or the window losing focus
 *    all stop it, and the total number of repeats is capped regardless.
 * 2. Pointer handlers alone leave the control unusable by keyboard, so Enter
 *    and Space fire a single step. preventDefault is deliberately NOT called
 *    on pointerdown — it suppresses focus and click synthesis, and the
 *    unwanted touch behaviours are already handled in CSS by .cg-board
 *    (touch-action, user-select, touch-callout).
 */
export function useHoldRepeat(
  onFire: () => void,
  {
    delay = 400,
    interval = 130,
    // ~8s of continuous holding. A 40-life swing takes about 5s, so this
    // clears any real intent while capping the damage from a pointerup that
    // never arrives (OS gesture, app switch, dead touch digitizer).
    maxRepeats = 60,
  }: { delay?: number; interval?: number; maxRepeats?: number } = {}
) {
  const timers = useRef<{ timeout?: ReturnType<typeof setTimeout>; interval?: ReturnType<typeof setInterval> }>({});
  const callback = useRef(onFire);

  useEffect(() => {
    callback.current = onFire;
  }, [onFire]);

  const stop = useCallback(() => {
    if (timers.current.timeout) clearTimeout(timers.current.timeout);
    if (timers.current.interval) clearInterval(timers.current.interval);
    timers.current = {};
  }, []);

  const start = useCallback(() => {
    stop();
    callback.current();

    let repeats = 0;
    timers.current.timeout = setTimeout(() => {
      timers.current.interval = setInterval(() => {
        repeats += 1;
        if (repeats > maxRepeats) {
          stop();
          return;
        }
        callback.current();
      }, interval);
    }, delay);
  }, [delay, interval, maxRepeats, stop]);

  // A hold interrupted by the tab going away must not keep counting.
  useEffect(() => {
    const handleAbort = () => stop();

    window.addEventListener('blur', handleAbort);
    window.addEventListener('contextmenu', handleAbort);
    document.addEventListener('visibilitychange', handleAbort);

    return () => {
      window.removeEventListener('blur', handleAbort);
      window.removeEventListener('contextmenu', handleAbort);
      document.removeEventListener('visibilitychange', handleAbort);
      stop();
    };
  }, [stop]);

  return {
    onPointerDown: (event: ReactPointerEvent) => {
      // Ignore secondary buttons so a right-click does not start a repeat that
      // never receives its matching pointerup.
      if (event.button !== 0) return;

      // Capture the pointer so a finger that drifts off the zone mid-hold
      // keeps counting and, more importantly, still delivers its pointerup
      // here on release instead of stranding the repeat.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture is an optimisation; pointerup/leave below still stop it.
      }

      start();
    },
    onPointerUp: stop,
    onPointerLeave: (event: ReactPointerEvent) => {
      // With capture held this does not fire; it is the fallback for when
      // capture was refused.
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
      stop();
    },
    onPointerCancel: stop,
    onKeyDown: (event: ReactKeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (event.repeat) return;
      callback.current();
    },
  };
}
