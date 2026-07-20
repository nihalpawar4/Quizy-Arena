'use client';

import { Bell, Search, Menu, ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useNotifications } from '@/hooks/use-notifications';
import { getGreeting } from '@/lib/utils';
import Link from 'next/link';

/**
 * TopBar — desktop greeting + search + avatar.
 * Mobile: hamburger + logo + notifications.
 *
 * Notification bell shows real unread count from Firestore listener.
 */
export function TopBar() {
  const userProfile = useAuthStore((s) => s.userProfile);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { unreadCount } = useNotifications();

  const displayName = userProfile?.displayName || 'Player';
  const firstName = displayName.split(' ')[0];
  const globalLevel = userProfile?.globalLevel ?? 1;

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left — Mobile: hamburger + logo, Desktop: greeting */}
        <div className="flex items-center gap-3">
          {/* Back to Quizy */}
          <a
            href={process.env.NEXT_PUBLIC_QUIZY_URL || 'https://quizzytest.vercel.app'}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 -ml-2 rounded-lg text-xs font-medium text-text-secondary hover:text-primary hover:bg-primary-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quizy
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-card-hover transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="text-sm font-bold text-text-primary">
              Quizy <span className="text-text-tertiary font-medium">Arena</span>
            </span>
          </Link>

          {/* Mobile: Back to Quizy */}
          <a
            href={process.env.NEXT_PUBLIC_QUIZY_URL || 'https://quizzytest.vercel.app'}
            className="lg:hidden p-2 rounded-lg text-text-tertiary hover:text-primary transition-colors"
            aria-label="Back to Quizy"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>

          {/* Desktop greeting */}
          <div className="hidden lg:block">
            <h1 className="text-base font-semibold text-text-primary">
              {getGreeting()}, {firstName}! 👋
            </h1>
            <p className="text-xs text-text-tertiary">
              Ready to sharpen your brain today?
            </p>
          </div>
        </div>

        {/* Right — search + notifications + avatar */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-card-hover transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-card-hover transition-colors cursor-pointer"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          >
            <Bell className="h-[18px] w-[18px]" />
            {/* Badge: show count or dot based on unread */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-surface">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar + Level */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 ml-1.5 pl-2.5"
          >
            <Avatar
              src={userProfile?.avatarUrl}
              alt={displayName}
              size="sm"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text-primary leading-tight">
                {firstName}
              </p>
              <p className="text-[10px] text-text-tertiary leading-tight">
                Level {globalLevel}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
