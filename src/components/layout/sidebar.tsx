'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Gamepad2,
  Swords,
  Gift,
  User,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useTheme } from '@/components/providers/theme-provider';

const mainItems = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/games', label: 'Games', Icon: Gamepad2 },
  { href: '/battle', label: 'Battle', Icon: Swords },
  { href: '/rewards', label: 'Rewards', Icon: Gift },
] as const;

const secondaryItems = [
  { href: '/profile', label: 'Profile', Icon: User },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 flex flex-col',
          'bg-surface shadow-lg',
          'transition-all duration-300 ease-[var(--arena-ease-out)]',
          'lg:z-40',
          sidebarOpen ? 'lg:w-52' : 'lg:w-[72px]',
          sidebarOpen ? 'w-56 translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-sm font-black tracking-tight">Q</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-text-primary leading-tight truncate">
                  Quizy
                </span>
                <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest leading-tight">
                  Arena
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5" aria-label="Sidebar navigation">
          {mainItems.map(({ href, label, Icon }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-150 ease-[var(--arena-ease-out)]',
                  sidebarOpen ? 'h-10 px-3' : 'flex-col h-auto py-2.5 px-1 gap-1 lg:flex',
                  isActive
                    ? 'bg-primary text-white shadow-sm font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card-hover',
                )}
                title={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                <span
                  className={cn(
                    'leading-tight',
                    sidebarOpen
                      ? 'text-[13px]'
                      : 'hidden lg:block text-[10px] font-medium text-center',
                    !sidebarOpen && !isActive && 'text-text-tertiary',
                    !sidebarOpen && isActive && 'text-white',
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="py-2 px-2 space-y-0.5">
          {secondaryItems.map(({ href, label, Icon }) => {
            const isActive = pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-150 ease-[var(--arena-ease-out)]',
                  sidebarOpen ? 'h-10 px-3' : 'flex-col h-auto py-2.5 px-1 gap-1 lg:flex',
                  isActive
                    ? 'bg-primary text-white shadow-sm font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card-hover',
                )}
                title={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                <span
                  className={cn(
                    'leading-tight',
                    sidebarOpen
                      ? 'text-[13px]'
                      : 'hidden lg:block text-[10px] font-medium text-center',
                    !sidebarOpen && !isActive && 'text-text-tertiary',
                    !sidebarOpen && isActive && 'text-white',
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl transition-all duration-150 cursor-pointer',
              'text-text-secondary hover:text-text-primary hover:bg-card-hover',
              sidebarOpen ? 'h-10 px-3' : 'flex-col h-auto py-2.5 px-1 gap-1 lg:flex',
            )}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            ) : (
              <Sun className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            )}
            <span
              className={cn(
                'leading-tight text-text-tertiary',
                sidebarOpen ? 'text-[13px]' : 'hidden lg:block text-[10px] font-medium text-center',
              )}
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
          </button>

          <button
            onClick={toggleSidebar}
            className={cn(
              'hidden lg:flex items-center justify-center gap-3 w-full rounded-xl',
              'text-text-tertiary hover:text-text-primary hover:bg-card-hover',
              'transition-all duration-150 cursor-pointer',
              sidebarOpen ? 'h-10 px-3' : 'flex-col h-auto py-2.5 px-1 gap-1',
            )}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                <span className="text-[13px]">Collapse</span>
              </>
            ) : (
              <>
                <ChevronRight className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                <span className="text-[10px] font-medium text-center">Expand</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
