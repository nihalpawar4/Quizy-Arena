'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Swords, Gift, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

/* ─── Nav Configuration ─── */
const NAV_ITEMS = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/games', label: 'Games', Icon: Gamepad2 },
  { href: '/battle', label: 'Battle', Icon: Swords },
  { href: '/rewards', label: 'Rewards', Icon: Gift },
  { href: '/profile', label: 'Profile', Icon: User },
] as const;

/* ─── Spring Presets ─── */
const SPRING_TAP = { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 } as const;
const SPRING_GENTLE = { type: 'spring', stiffness: 300, damping: 25, mass: 1 } as const;

/* ─── Haptic Feedback ─── */
function triggerHaptic(style: 'light' | 'medium' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 8 : 15);
  }
}

/* ─── Ripple Effect ─── */
function createRipple(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height) * 2;

  ripple.style.cssText = `
    position:absolute;width:${size}px;height:${size}px;
    left:${x - size / 2}px;top:${y - size / 2}px;
    border-radius:50%;pointer-events:none;
    background:var(--arena-primary);opacity:0.12;
    transform:scale(0);animation:nav-ripple 500ms ease-out forwards;
  `;
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}

/* ─── Center Battle Button ─── */
function BattleButton({
  href,
  isActive,
}: {
  href: string;
  isActive: boolean;
}) {
  return (
    <Link href={href} aria-label="Battle" aria-current={isActive ? 'page' : undefined}>
      <motion.div
        className="relative -mt-7 flex flex-col items-center"
        whileTap={{ scale: 0.88 }}
        transition={SPRING_TAP}
        onTapStart={() => triggerHaptic('medium')}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 top-0 mx-auto rounded-full"
          style={{
            width: 60,
            height: 60,
            background: 'var(--arena-primary)',
            opacity: isActive ? 0.15 : 0.06,
            filter: 'blur(12px)',
          }}
          animate={{
            opacity: isActive ? [0.12, 0.2, 0.12] : 0.06,
            scale: isActive ? [1, 1.15, 1] : 1,
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Button */}
        <motion.div
          className={cn(
            'relative z-10 flex items-center justify-center',
            'w-[56px] h-[56px] rounded-[20px]',
            'shadow-lg transition-shadow duration-300',
          )}
          style={{
            background: isActive
              ? 'var(--arena-primary)'
              : 'linear-gradient(135deg, var(--arena-primary), var(--arena-accent))',
            boxShadow: isActive
              ? '0 8px 24px color-mix(in srgb, var(--arena-primary) 40%, transparent), 0 2px 8px color-mix(in srgb, var(--arena-primary) 20%, transparent)'
              : '0 4px 16px color-mix(in srgb, var(--arena-primary) 25%, transparent), 0 2px 6px rgba(0,0,0,0.1)',
          }}
          animate={{
            y: isActive ? -2 : [0, -3, 0],
          }}
          transition={
            isActive
              ? SPRING_GENTLE
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <Swords className="h-6 w-6 text-white" strokeWidth={2} />
        </motion.div>

        {/* Label */}
        <span
          className={cn(
            'text-[10px] leading-none mt-1.5 font-semibold transition-colors duration-200',
            isActive ? 'text-[var(--arena-primary)]' : 'text-[var(--arena-text-tertiary)]',
          )}
        >
          Battle
        </span>
      </motion.div>
    </Link>
  );
}

/* ─── Regular Nav Item ─── */
function NavItem({
  href,
  label,
  Icon,
  isActive,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      triggerHaptic();
      createRipple(e);
    },
    [],
  );

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-16 h-full rounded-2xl overflow-hidden',
        'transition-colors duration-200',
        !isActive && 'active:bg-[var(--arena-primary-muted)]',
      )}
    >
      {/* Active pill background */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            className="absolute inset-x-2 inset-y-1.5 rounded-[14px]"
            style={{ background: 'var(--arena-nav-active-bg)' }}
            layoutId="nav-pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING_GENTLE}
          />
        )}
      </AnimatePresence>

      {/* Top indicator bar */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            className="absolute -top-[1px] h-[2.5px] w-7 rounded-full"
            style={{ background: 'var(--arena-primary)' }}
            layoutId="nav-indicator"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={SPRING_GENTLE}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: isActive ? 1.1 : 1,
          y: isActive ? -1 : 0,
        }}
        transition={SPRING_TAP}
      >
        <Icon
          className={cn(
            'h-[22px] w-[22px] transition-colors duration-200',
            isActive
              ? 'text-[var(--arena-nav-active-text)]'
              : 'text-[var(--arena-text-tertiary)]',
          )}
          strokeWidth={isActive ? 2.2 : 1.6}
        />
      </motion.div>

      {/* Label */}
      <motion.span
        className={cn(
          'relative z-10 text-[10px] leading-none mt-1 transition-colors duration-200',
          isActive
            ? 'font-semibold text-[var(--arena-nav-active-text)]'
            : 'font-medium text-[var(--arena-text-tertiary)]',
        )}
        animate={{ opacity: isActive ? 1 : 0.75 }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
    </Link>
  );
}

/* ═══════════════════════════════════════════
   BOTTOM NAV — Premium Floating Dock
   ═══════════════════════════════════════════ */

export function BottomNav() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'lg:hidden',
        'pointer-events-none',
      )}
      aria-label="Main navigation"
    >
      {/* Safe area + floating dock container */}
      <div
        className="pointer-events-auto mx-auto w-full max-w-lg px-3"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <div
          className={cn(
            'relative flex items-center justify-around',
            'h-[72px] rounded-[28px]',
            'border transition-colors duration-300',
          )}
          style={{
            background: 'color-mix(in srgb, var(--arena-surface) 85%, transparent)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderColor: 'var(--arena-border)',
            boxShadow: `
              0 -1px 0 0 color-mix(in srgb, var(--arena-border) 50%, transparent),
              0 8px 32px rgba(0, 0, 0, 0.08),
              0 2px 8px rgba(0, 0, 0, 0.04)
            `,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = isActiveRoute(item.href);

            if (item.href === '/battle') {
              return (
                <BattleButton
                  key={item.href}
                  href={item.href}
                  isActive={isActive}
                />
              );
            }

            return (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.Icon}
                isActive={isActive}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}
