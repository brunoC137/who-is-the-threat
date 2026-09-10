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
 *
 * Seat order. seats[i] is where players[i] sits, and every layout lists its
 * seats clockwise around the table: top edge left to right, right edge,
 * bottom edge right to left, left edge. Both views share that order, so
 * switching views mid-game keeps everyone next to the same neighbours; only
 * the positions on the phone change.
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

/**
 * Device orientation. The board itself is always laid out landscape; a
 * portrait device gets the whole game screen turned a quarter instead (see
 * LandscapeFrame), so there is only one set of layouts per view to get right.
 */
export type Orientation = 'landscape' | 'portrait';

/**
 * How seats are arranged on the board.
 *  - table: players on every edge of the phone; four players get a pinwheel.
 *  - sides: players only along the two long edges, facing each other — the
 *    arrangement LifeTap uses. The rows meet in the middle; the game controls
 *    float over the centre in an orb (see GameOrb) instead of taking a row.
 */
export type BoardView = 'table' | 'sides';

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
 * The phone sits flat between players, long side across.
 *
 * Four players get a true pinwheel (one panel per edge) with no dead centre —
 * the left/right columns are narrow cells whose rotated content reads wide,
 * so every panel ends up landscape-shaped for its own reader.
 */
const TABLE_LAYOUTS: Record<number, BoardLayout> = {
  2: {
    seats: [seat('p0', 'top'), seat('p1', 'bottom')],
    gridTemplateAreas: '"p0" "p1"',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr 1fr',
  },
  3: {
    seats: [seat('p0', 'top'), seat('p1', 'bottom'), seat('p2', 'bottom')],
    gridTemplateAreas: '"p0 p0" "p2 p1"',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
  },
  4: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'right'),
      seat('p2', 'bottom'),
      seat('p3', 'left'),
    ],
    gridTemplateAreas: '"p3 p0 p1" "p3 p2 p1"',
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
    gridTemplateAreas: '"p0 p0 p1 p1 p2 p2" "p4 p4 p4 p3 p3 p3"',
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
    gridTemplateAreas: '"p0 p1 p2" "p5 p4 p3"',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gridTemplateRows: '1fr 1fr',
  },
};

/**
 * Nobody sits at the short ends: two rows of players face each other across
 * the phone. Only 4 players actually sit differently from the table view;
 * for the rest the difference is where the controls live (the orb).
 */
const SIDES_LAYOUTS: Record<number, BoardLayout> = {
  2: TABLE_LAYOUTS[2],
  3: TABLE_LAYOUTS[3],
  4: {
    seats: [
      seat('p0', 'top'),
      seat('p1', 'top'),
      seat('p2', 'bottom'),
      seat('p3', 'bottom'),
    ],
    gridTemplateAreas: '"p0 p1" "p3 p2"',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
  },
  5: TABLE_LAYOUTS[5],
  6: TABLE_LAYOUTS[6],
};

const clampPlayerCount = (playerCount: number): number =>
  Math.min(6, Math.max(2, playerCount));

export function getBoardLayout(playerCount: number, view: BoardView = 'table'): BoardLayout {
  const layouts = view === 'sides' ? SIDES_LAYOUTS : TABLE_LAYOUTS;
  return layouts[clampPlayerCount(playerCount)];
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
