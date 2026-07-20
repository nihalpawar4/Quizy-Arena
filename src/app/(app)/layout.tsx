'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { AppShell } from '@/components/layout/app-shell';

/**
 * Layout for all authenticated app routes.
 * Wraps children with AuthGuard (redirect if not signed in)
 * and AppShell (navigation chrome).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
