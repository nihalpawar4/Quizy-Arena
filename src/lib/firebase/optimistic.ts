/**
 * Optimistic Update Helper
 *
 * Immediately updates the Zustand store, then runs the Firebase write.
 * On failure, rolls back to the previous value and shows an error toast.
 *
 * Works with any Zustand store that has a getter/setter pattern.
 */

import { useUIStore } from '@/stores/ui-store';
import { classifyError } from './firebase-error';

interface OptimisticUpdateOptions<T> {
  /** Current value before the update (used for rollback). */
  previousValue: T;
  /** The optimistic value to show immediately. */
  optimisticValue: T;
  /** Function to apply the value to the store. */
  applyToStore: (value: T) => void;
  /** The async Firebase write to execute. */
  firebaseWrite: () => Promise<void>;
  /** Optional success toast message. */
  successMessage?: string;
  /** Optional error toast message override (default uses classifyError). */
  errorMessage?: string;
  /** Whether to show a success toast (default: false). */
  showSuccess?: boolean;
}

/**
 * Execute an optimistic update.
 *
 * 1. Immediately applies `optimisticValue` to the store.
 * 2. Runs `firebaseWrite()` in the background.
 * 3. On failure: rolls back to `previousValue` and shows an error toast.
 * 4. On success: optionally shows a success toast.
 *
 * Returns true if the write succeeded, false if it was rolled back.
 */
export async function optimisticUpdate<T>(
  options: OptimisticUpdateOptions<T>,
): Promise<boolean> {
  const {
    previousValue,
    optimisticValue,
    applyToStore,
    firebaseWrite,
    successMessage,
    errorMessage,
    showSuccess = false,
  } = options;

  // Step 1: Apply optimistic value immediately
  applyToStore(optimisticValue);

  try {
    // Step 2: Perform the Firebase write
    await firebaseWrite();

    // Step 3: Success
    if (showSuccess && successMessage) {
      useUIStore.getState().addToast({
        message: successMessage,
        variant: 'success',
      });
    }

    return true;
  } catch (error) {
    // Step 4: Rollback on failure
    applyToStore(previousValue);

    const classified = classifyError(error);
    useUIStore.getState().addToast({
      message: errorMessage ?? classified.message,
      variant: 'error',
    });

    return false;
  }
}

/**
 * Helper to create a partial user profile update with optimistic behavior.
 * Designed to work with useAuthStore.setUserProfile.
 */
export function createProfileUpdater(
  getCurrentProfile: () => Record<string, unknown> | null,
  setProfile: (profile: Record<string, unknown> | null) => void,
) {
  return async (
    updates: Record<string, unknown>,
    firebaseWrite: () => Promise<void>,
    successMessage?: string,
  ): Promise<boolean> => {
    const current = getCurrentProfile();
    if (!current) return false;

    const optimistic = { ...current, ...updates };

    return optimisticUpdate({
      previousValue: current,
      optimisticValue: optimistic,
      applyToStore: setProfile,
      firebaseWrite,
      successMessage,
      showSuccess: !!successMessage,
    });
  };
}
