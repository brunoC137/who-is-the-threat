'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
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
 * twenty separate taps. Falls back to a single fire on a normal tap.
 */
export function useHoldRepeat(
  onFire: () => void,
  { delay = 400, interval = 90 }: { delay?: number; interval?: number } = {}
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

    timers.current.timeout = setTimeout(() => {
      timers.current.interval = setInterval(() => callback.current(), interval);
    }, delay);
  }, [delay, interval, stop]);

  useEffect(() => stop, [stop]);

  return {
    onPointerDown: (event: ReactPointerEvent) => {
      // Ignore secondary buttons so a right-click does not start a repeat that
      // never receives its matching pointerup.
      if (event.button !== 0) return;
      event.preventDefault();
      start();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
