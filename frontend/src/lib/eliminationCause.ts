/**
 * How a player left a game. Mirrors Game.players.eliminationCause on the API.
 *
 * The field is optional by design: it is only written by the Current Game
 * tracker and the manual game forms, so every game logged before it existed
 * has no cause. Treat a missing value as "not recorded" rather than as any
 * particular cause — see getEliminationCauseKey.
 */
export const ELIMINATION_CAUSES = [
  'life',
  'poison',
  'commanderDamage',
  'conceded',
  'other',
] as const;

export type EliminationCause = (typeof ELIMINATION_CAUSES)[number];

/** Translation keys, so every surface labels a cause the same way. */
export const ELIMINATION_CAUSE_KEYS: Record<EliminationCause, string> = {
  life: 'games.causeLife',
  poison: 'games.causePoison',
  commanderDamage: 'games.causeCommanderDamage',
  conceded: 'games.causeConceded',
  other: 'games.causeOther',
};

export const isEliminationCause = (value: unknown): value is EliminationCause =>
  typeof value === 'string' && ELIMINATION_CAUSES.includes(value as EliminationCause);

/**
 * Translation key for a possibly-missing cause. Historical participants have
 * no cause at all, which is information in itself and must not be silently
 * rendered as one of the real causes.
 */
export function getEliminationCauseKey(cause: string | undefined | null): string {
  return isEliminationCause(cause) ? ELIMINATION_CAUSE_KEYS[cause] : 'games.causeUnknown';
}

/** Tailwind classes per cause, kept consistent across detail and list views. */
export const ELIMINATION_CAUSE_STYLES: Record<EliminationCause, string> = {
  life: 'bg-destructive/15 text-destructive border-destructive/30',
  poison: 'bg-success/15 text-success border-success/30',
  commanderDamage: 'bg-accent/15 text-accent border-accent/30',
  conceded: 'bg-muted text-muted-foreground border-border',
  other: 'bg-muted text-muted-foreground border-border',
};

export function getEliminationCauseStyle(cause: string | undefined | null): string {
  return isEliminationCause(cause)
    ? ELIMINATION_CAUSE_STYLES[cause]
    : 'bg-muted text-muted-foreground border-border';
}
