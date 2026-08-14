/**
 * Table-centric board layout.
 *
 * The device lies flat in the middle of the table and each player reads their
 * own panel from where they are sitting, so every panel is rotated to face its
 * seat. Two rules make this work:
 *
 * 1. Rotations are only ever quarter turns. A rectangle rotated by anything
 *    else does not fit its own bounding box, which is what makes arbitrary
 *    angles (120deg, 72deg, ...) overflow and clip.
 * 2. A panel rotated 90/270 needs its width and height swapped relative to the
 *    grid cell it sits in. That is done in CSS with container query units
 *    (see .cg-seat-content-rotated in globals.css), so no JS measurement or
 *    ResizeObserver is involved.
 *
 * Rotation convention (device flat, screen +x right / +y down).
 *
 * Text reads upright to you when its top points AWAY from you, across the
 * device. So the rotation a seat needs is set by which screen direction points
 * away from that seat — not by which side the seat is on:
 *
 *   bottom seat (south) -> away is screen up    (0,-1) -> 0deg
 *   left seat   (west)  -> away is screen right (1, 0) -> 90deg
 *   top seat    (north) -> away is screen down  (0, 1) -> 180deg
 *   right seat  (east)  -> away is screen left  (-1,0) -> 270deg
 *
 * Note left/right are the mirror of the naive reading: a player sitting on the
 * LEFT reads text whose top points RIGHT. Getting this backwards renders the
 * side panels 180deg out for the very players they are meant to face.
 */

export type SeatEdge = 'top' | 'bottom' | 'left' | 'right';

export type SeatRotation = 0 | 90 | 180 | 270;

export interface Seat {
  /** CSS grid-area name, matched against the template below */
  area: string;
  edge: SeatEdge;
  rotation: SeatRotation;
}

export interface BoardLayout {
  seats: Seat[];
  gridTemplateAreas: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
}

export type Orientation = 'landscape' | 'portrait';

const EDGE_ROTATION: Record<SeatEdge, SeatRotation> = {
  bottom: 0,
  left: 90,
  top: 180,
  right: 270,
};

const seat = (area: string, edge: SeatEdge): Seat => ({
  area,
  edge,
  rotation: EDGE_ROTATION[edge],
});

/**
 * Landscape is the primary orientation: the phone sits flat between players.
 *
 * Four players get a true pinwheel (one panel per edge) with no dead centre —
 * the left/right columns are narrow cells whose rotated content reads wide,
 * so every panel ends up landscape-shaped for its own reader.
 */
const LANDSCAPE_LAYOUTS: Record<number, BoardLayout> = {
  2: {
    seats: [seat('p0', 'top'), seat('p1', 'bottom')],
    gridTemplateAreas: '"p0" "p1"',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr 1fr',
  },
  3: {
    seats: [seat('p0', 'top'), seat('p1', 'bottom'), seat('p2', 'bottom')],
    gridTemplateAreas: '"p0 p0" "p1 p2"',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
  },
  4: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'left'),
      seat('p2', 'right'),
      seat('p3', 'bottom'),
    ],
    gridTemplateAreas: '"p1 p0 p2" "p1 p3 p2"',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.7fr) minmax(0, 1fr)',
    gridTemplateRows: '1fr 1fr',
  },
  5: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'top'),
      seat('p2', 'top'),
      seat('p3', 'bottom'),
      seat('p4', 'bottom'),
    ],
    gridTemplateAreas: '"p0 p0 p1 p1 p2 p2" "p3 p3 p3 p4 p4 p4"',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gridTemplateRows: '1fr 1fr',
  },
  6: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'top'),
      seat('p2', 'top'),
      seat('p3', 'bottom'),
      seat('p4', 'bottom'),
      seat('p5', 'bottom'),
    ],
    gridTemplateAreas: '"p0 p1 p2" "p3 p4 p5"',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gridTemplateRows: '1fr 1fr',
  },
};

/**
 * Portrait keeps the same "face your seat" rule but stacks rows, since a tall
 * narrow viewport cannot give side seats a usable share of the width until
 * there are enough players to justify a middle row.
 */
const PORTRAIT_LAYOUTS: Record<number, BoardLayout> = {
  2: {
    seats: [seat('p0', 'top'), seat('p1', 'bottom')],
    gridTemplateAreas: '"p0" "p1"',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr 1fr',
  },
  3: {
    seats: [seat('p0', 'top'), seat('p1', 'bottom'), seat('p2', 'bottom')],
    gridTemplateAreas: '"p0 p0" "p1 p2"',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
  },
  4: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'top'),
      seat('p2', 'bottom'),
      seat('p3', 'bottom'),
    ],
    gridTemplateAreas: '"p0 p1" "p2 p3"',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
  },
  5: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'top'),
      seat('p2', 'left'),
      seat('p3', 'right'),
      seat('p4', 'bottom'),
    ],
    gridTemplateAreas: '"p0 p1" "p2 p3" "p4 p4"',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
  },
  6: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'top'),
      seat('p2', 'left'),
      seat('p3', 'right'),
      seat('p4', 'bottom'),
      seat('p5', 'bottom'),
    ],
    gridTemplateAreas: '"p0 p1" "p2 p3" "p4 p5"',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
  },
};

const clampPlayerCount = (playerCount: number): number =>
  Math.min(6, Math.max(2, playerCount));

export function getBoardLayout(
  playerCount: number,
  orientation: Orientation
): BoardLayout {
  const count = clampPlayerCount(playerCount);
  const layouts = orientation === 'portrait' ? PORTRAIT_LAYOUTS : LANDSCAPE_LAYOUTS;
  return layouts[count];
}

/** A seat rotated a quarter turn needs its cell's width/height swapped. */
export const isQuarterTurn = (rotation: SeatRotation): boolean =>
  rotation === 90 || rotation === 270;

/**
 * Panels on the left/right edges are narrow-and-tall on screen, so their
 * content has less room along the reading axis. Used to scale the life total
 * down a step without needing per-seat magic numbers in the card.
 */
export const isSideSeat = (edge: SeatEdge): boolean =>
  edge === 'left' || edge === 'right';
