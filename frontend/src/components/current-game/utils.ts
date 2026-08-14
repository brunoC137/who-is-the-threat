import { GamePlayer, Player } from './types';
import { LETHAL_COMMANDER_DAMAGE, LETHAL_POISON, STARTING_LIFE } from './gameReducer';

/**
 * Life total colour. Thresholds are relative to the starting total so they
 * still read correctly if the format ever changes from 40.
 *
 * These are deliberately explicit high-luminance colours rather than the
 * semantic tokens used elsewhere. The number is painted over arbitrary deck
 * artwork, not over a themed surface, so it needs guaranteed luminance —
 * `--destructive` in the dark theme is a deep red (0 63% 31%) that reads as
 * a smudge on top of a busy card image.
 */
export function getLifeColor(life: number): string {
  const ratio = life / STARTING_LIFE;

  if (ratio <= 0.25) return 'text-red-400';
  if (ratio <= 0.5) return 'text-amber-300';
  return 'text-white';
}

/** Poison is only interesting as it approaches lethal. */
export function getPoisonColor(poison: number): string {
  if (poison >= LETHAL_POISON) return 'text-destructive';
  if (poison >= LETHAL_POISON - 3) return 'text-warning';
  return 'text-muted-foreground';
}

export function getCommanderDamageColor(damage: number): string {
  if (damage >= LETHAL_COMMANDER_DAMAGE) return 'text-destructive';
  if (damage >= LETHAL_COMMANDER_DAMAGE - 6) return 'text-warning';
  return 'text-foreground';
}

/** MM:SS, or H:MM:SS once a game passes the hour mark. */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function getDisplayName(player: Player): string {
  return player.nickname || player.name;
}

/** Ordinal suffix for placement badges: 1st, 2nd, 3rd, 4th. */
export function formatPlacement(placement: number | undefined): string {
  if (!placement) return '—';

  const suffixes: { [key: number]: string } = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${placement}${suffixes[placement] || 'th'}`;
}

/**
 * Short haptic tap. Silently absent on iOS Safari, which does not implement
 * the Vibration API — the CSS pulse is the shared feedback channel.
 */
export function haptic(durationMs = 12): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

  try {
    navigator.vibrate(durationMs);
  } catch {
    // Vibration can throw when the document is not focused; feedback is
    // non-essential so failing silently is correct here.
  }
}

/** Highest commander damage from any single source, for the card summary. */
export function getHighestCommanderDamage(gamePlayer: GamePlayer): number {
  const values = Object.values(gamePlayer.commanderDamage);
  return values.length > 0 ? Math.max(...values) : 0;
}
