'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useOrientation, useViewportSize } from './hooks';

interface Frame {
  /** Frame size in its own coordinates, which are always landscape. */
  width: number;
  height: number;
  /** Convert a viewport point (clientX/clientY) into frame coordinates. */
  toFrame: (clientX: number, clientY: number) => { x: number; y: number };
}

const identity = (x: number, y: number) => ({ x, y });

const FrameContext = createContext<Frame>({ width: 1024, height: 768, toFrame: identity });

export const useFrame = (): Frame => useContext(FrameContext);

/**
 * The game screen, always laid out landscape.
 *
 * A phone held upright (or with rotation locked) gets the same board as one
 * turned sideways: the whole frame is turned a quarter counter-clockwise, the
 * same way the OS would rotate it. Everything inside — board, control bar,
 * dialogs — rotates with it, because a transformed element is the containing
 * block for its `position: fixed` descendants. So the dialogs' `fixed inset-0`
 * fills the frame, not the screen, with no per-dialog handling.
 *
 * Coordinates are the one leak: pointer events report viewport coordinates,
 * so anything positioned at the pointer converts through useFrame().toFrame.
 */
export function LandscapeFrame({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const portrait = useOrientation() === 'portrait';
  const viewport = useViewportSize();

  const frame = useMemo<Frame>(
    () =>
      portrait
        ? {
            width: viewport.height,
            height: viewport.width,
            // Inverse of rotate(-90deg) about the centre: the frame's top-left
            // sits at the screen's bottom-left, its x axis pointing up.
            toFrame: (clientX, clientY) => ({ x: viewport.height - clientY, y: clientX }),
          }
        : { width: viewport.width, height: viewport.height, toFrame: identity },
    [portrait, viewport]
  );

  return (
    <FrameContext.Provider value={frame}>
      <div
        className={`fixed left-1/2 top-1/2 overflow-hidden ${className}`}
        style={{
          width: portrait ? '100dvh' : '100dvw',
          height: portrait ? '100dvw' : '100dvh',
          // The translate is applied in landscape too, so the frame is always
          // the containing block for fixed dialogs whichever way it faces.
          transform: `translate(-50%, -50%)${portrait ? ' rotate(-90deg)' : ''}`,
        }}
      >
        {children}
      </div>
    </FrameContext.Provider>
  );
}
