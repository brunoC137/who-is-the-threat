/**
 * Get text color based on life total
 */
export function getLifeColor(life: number): string {
  if (life >= 30) return 'text-green-500';
  if (life >= 20) return 'text-yellow-500';
  if (life >= 10) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Calculate rotation angle for a player based on their seat position
 */
export function getPlayerRotation(seatIndex: number, totalPlayers: number): number {
  if (totalPlayers === 2) {
    return seatIndex === 0 ? 0 : 180;
  } else if (totalPlayers === 3) {
    const rotations = [0, 120, 240];
    return rotations[seatIndex] || 0;
  } else if (totalPlayers === 4) {
    const rotations = [0, 90, 180, 270];
    return rotations[seatIndex] || 0;
  } else if (totalPlayers === 5) {
    const rotations = [0, 72, 144, 216, 288];
    return rotations[seatIndex] || 0;
  } else if (totalPlayers === 6) {
    const rotations = [0, 60, 120, 180, 240, 300];
    return rotations[seatIndex] || 0;
  }
  
  return 0;
}

/**
 * Determine which column a player should be in for landscape 2-column layout
 */
export function getPlayerColumn(seatIndex: number, totalPlayers: number): 'left' | 'right' {
  if (totalPlayers === 4) {
    return seatIndex === 0 || seatIndex === 3 ? 'left' : 'right';
  } else if (totalPlayers === 3) {
    return seatIndex === 0 ? 'left' : 'right';
  } else if (totalPlayers === 2) {
    return seatIndex === 0 ? 'left' : 'right';
  } else {
    // For 5-6 players, split evenly
    return seatIndex < Math.ceil(totalPlayers / 2) ? 'left' : 'right';
  }
}

/**
 * Format time duration in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if a player should be eliminated based on game state
 */
export function checkElimination(life: number, poison: number, commanderDamage: { [key: string]: number }): {
  isEliminated: boolean;
  reason: 'life' | 'poison' | 'commander' | null;
  fromPlayer?: string;
} {
  if (life <= 0) {
    return { isEliminated: true, reason: 'life' };
  }
  
  if (poison >= 10) {
    return { isEliminated: true, reason: 'poison' };
  }
  
  for (const [playerId, damage] of Object.entries(commanderDamage)) {
    if (damage >= 21) {
      return { isEliminated: true, reason: 'commander', fromPlayer: playerId };
    }
  }
  
  return { isEliminated: false, reason: null };
}
