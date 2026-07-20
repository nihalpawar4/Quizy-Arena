'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * AuthGuard protects client-rendered pages.
 * Shows a loading skeleton while auth state resolves.
 * Redirects to /sign-in if not authenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useAuthStore();

  // Still loading auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="space-y-4 w-full max-w-sm px-4">
          <Skeleton height={48} className="w-3/4 mx-auto" />
          <Skeleton height={16} className="w-1/2 mx-auto" />
          <div className="space-y-3 mt-8">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    router.replace('/sign-in');
    return null;
  }

  return <>{children}</>;
}
