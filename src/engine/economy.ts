/**
 * Economy Module
 *
 * Handles coin costs for games (after Level 1) and diamond-to-lives conversion.
 * All Firestore mutations use atomic increment to prevent race conditions.
 */

import { getDocRef, increment } from '@/lib/firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Get the coin cost to play a game at a given level.
 * Level 1 is always free. Higher levels cost more coins.
 */
export function getGameCoinCost(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 10;
  if (level === 3) return 25;
  if (level <= 5) return 40;
  if (level <= 7) return 60;
  return 80; // Levels 8-10
}

/**
 * Check if the player can afford to play at the given level.
 */
export function canAffordGame(coins: number, level: number): boolean {
  return coins >= getGameCoinCost(level);
}

/**
 * Diamond cost for one extra life.
 */
export const DIAMOND_PER_LIFE = 5;

/**
 * Deduct coins from the user's profile atomically.
 * Returns true if successful.
 */
export async function deductCoins(uid: string, amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  try {
    const userRef = getDocRef('users', uid);
    await updateDoc(userRef, {
      coins: increment(-amount),
    });
    useAuthStore.getState().adjustCoins(-amount);
    return true;
  } catch (error) {
    console.error('[Economy] Failed to deduct coins:', error);
    return false;
  }
}

/**
 * Buy an extra life by spending diamonds.
 * Returns true if the purchase was successful.
 */
export async function buyExtraLife(uid: string): Promise<boolean> {
  try {
    const userRef = getDocRef('users', uid);
    await updateDoc(userRef, {
      diamonds: increment(-DIAMOND_PER_LIFE),
    });
    useAuthStore.getState().adjustDiamonds(-DIAMOND_PER_LIFE);
    return true;
  } catch (error) {
    console.error('[Economy] Failed to buy extra life:', error);
    return false;
  }
}
