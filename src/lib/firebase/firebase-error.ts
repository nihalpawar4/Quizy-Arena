/**
 * Firebase Error Classification
 *
 * Wraps raw Firebase errors into typed, user-friendly categories.
 * Every Firebase operation in the app should catch errors and
 * classify them through this module.
 */

export type FirebaseErrorCategory =
  | 'offline'
  | 'permission-denied'
  | 'not-found'
  | 'write-failed'
  | 'timeout'
  | 'unauthenticated'
  | 'already-exists'
  | 'rate-limited'
  | 'unknown';

export interface ClassifiedError {
  category: FirebaseErrorCategory;
  message: string;
  isRetryable: boolean;
  originalError: unknown;
}

/**
 * Maps of Firebase error codes to our categories.
 */
const CODE_MAP: Record<string, FirebaseErrorCategory> = {
  // Firestore
  'permission-denied': 'permission-denied',
  'not-found': 'not-found',
  'already-exists': 'already-exists',
  'resource-exhausted': 'rate-limited',
  'deadline-exceeded': 'timeout',
  unavailable: 'offline',
  'failed-precondition': 'write-failed',
  aborted: 'write-failed',
  cancelled: 'offline',
  'data-loss': 'write-failed',
  internal: 'unknown',
  'invalid-argument': 'write-failed',
  'out-of-range': 'write-failed',
  unimplemented: 'unknown',
  unauthenticated: 'unauthenticated',

  // Auth
  'auth/network-request-failed': 'offline',
  'auth/too-many-requests': 'rate-limited',
  'auth/user-not-found': 'not-found',
  'auth/wrong-password': 'permission-denied',
  'auth/unauthorized-domain': 'permission-denied',

  // Storage
  'storage/unauthorized': 'permission-denied',
  'storage/object-not-found': 'not-found',
  'storage/retry-limit-exceeded': 'timeout',
  'storage/canceled': 'offline',
};

/**
 * User-friendly messages per category.
 */
const MESSAGES: Record<FirebaseErrorCategory, string> = {
  offline: 'You appear to be offline. Changes will sync when you reconnect.',
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested data could not be found.',
  'write-failed': 'Failed to save your changes. Please try again.',
  timeout: 'The request timed out. Please try again.',
  unauthenticated: 'Please sign in to continue.',
  'already-exists': 'This item already exists.',
  'rate-limited': 'Too many requests. Please wait a moment and try again.',
  unknown: 'Something went wrong. Please try again.',
};

/**
 * Categories that are safe to retry.
 */
const RETRYABLE: Set<FirebaseErrorCategory> = new Set([
  'offline',
  'timeout',
  'rate-limited',
  'write-failed',
  'unknown',
]);

/**
 * Extract a Firebase error code from an error object.
 * Firebase errors have a `code` property (e.g. "permission-denied").
 */
function extractCode(error: unknown): string | null {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (typeof e.code === 'string') {
      // Strip service prefix if present (e.g. "firestore/permission-denied" → "permission-denied")
      const parts = e.code.split('/');
      return parts[parts.length - 1];
    }
  }
  return null;
}

/**
 * Classify any error into a structured FirebaseError.
 */
export function classifyError(error: unknown): ClassifiedError {
  // Check for offline state first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      category: 'offline',
      message: MESSAGES.offline,
      isRetryable: true,
      originalError: error,
    };
  }

  const code = extractCode(error);
  if (code) {
    // Try direct match first
    let category = CODE_MAP[code];

    // Try stripping service prefix (e.g. "firestore/permission-denied" → "permission-denied")
    if (!category) {
      const stripped = code.split('/').pop();
      if (stripped) category = CODE_MAP[stripped];
    }

    if (category) {
      return {
        category,
        message: MESSAGES[category],
        isRetryable: RETRYABLE.has(category),
        originalError: error,
      };
    }
  }

  // Fallback: check for network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      category: 'offline',
      message: MESSAGES.offline,
      isRetryable: true,
      originalError: error,
    };
  }

  return {
    category: 'unknown',
    message: MESSAGES.unknown,
    isRetryable: true,
    originalError: error,
  };
}

/**
 * Check if an error is retryable.
 */
export function isRetryable(error: unknown): boolean {
  return classifyError(error).isRetryable;
}

/**
 * Get a user-friendly error message.
 */
export function getErrorMessage(error: unknown): string {
  return classifyError(error).message;
}

/**
 * Get the error category.
 */
export function getErrorCategory(error: unknown): FirebaseErrorCategory {
  return classifyError(error).category;
}
