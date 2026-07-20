'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Swords, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/games', label: 'Games', Icon: Gamepad2 },
  { href: '/battle', label: 'Battle', Icon: Swords },
  { href: '/rewards', label: 'Rewards', Icon: Gift },
  { href: '/profile', label: 'Profile', Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-surface/95 backdrop-blur-md shadow-lg',
        'pb-[env(safe-area-inset-bottom)]',
        'lg:hidden',
      )}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1',
                'w-16 py-1.5 rounded-xl transition-all duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-text-tertiary active:text-text-secondary',
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active pill background */}
              {isActive && (
                <span className="absolute -top-0.5 h-[3px] w-8 rounded-full bg-primary" />
              )}

              <Icon
                className={cn(
                  'h-5 w-5 transition-transform',
                  isActive && 'scale-110',
                )}
                strokeWidth={isActive ? 2.2 : 1.5}
              />
              <span
                className={cn(
                  'text-[10px] leading-none',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
