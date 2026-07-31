'use client';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { ToastContainer } from '@/components/ui/toast';
import { OfflineBanner } from '@/components/states/offline-banner';
import { usePresence } from '@/hooks/use-presence';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  // Start presence tracking (RTDB) — updates currentPage on route changes
  usePresence();

  return (
    <div className="min-h-dvh bg-bg">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'min-h-dvh flex flex-col',
          'lg:transition-[margin-left] lg:duration-300 lg:ease-[var(--arena-ease-out)]',
          sidebarOpen ? 'lg:ml-52' : 'lg:ml-[72px]',
        )}
      >
        {/* Offline Banner */}
        <OfflineBanner />

        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:px-8 lg:py-5">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
