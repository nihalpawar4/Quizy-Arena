'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { isRetryable, getErrorMessage } from '@/lib/firebase/firebase-error';
import type { ClassifiedError } from '@/lib/firebase/firebase-error';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,     // 5 minutes
            gcTime: 30 * 60 * 1000,        // 30 minutes
            retry: (failureCount, error) => {
              // Don't retry non-retryable errors (permission-denied, etc.)
              if (!isRetryable(error)) return false;
              // Max 2 retries for retryable errors
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: (failureCount, error) => {
              if (!isRetryable(error)) return false;
              return failureCount < 1;
            },
            onError: (error) => {
              // Show toast for failed mutations globally
              const message = isClassifiedError(error)
                ? error.message
                : getErrorMessage(error);

              useUIStore.getState().addToast({
                message,
                variant: 'error',
              });
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Type guard for ClassifiedError.
 */
function isClassifiedError(error: unknown): error is ClassifiedError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    'message' in error &&
    'isRetryable' in error
  );
}
