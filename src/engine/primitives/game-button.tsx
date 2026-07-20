'use client';

import { cn } from '@/lib/utils';

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'correct' | 'wrong' | 'selected';
  size?: 'md' | 'lg' | 'xl';
}

const variantStyles = {
  default: 'bg-card border-border hover:bg-card-hover hover:border-border-hover active:scale-95',
  correct: 'bg-success-muted border-success/30 text-success scale-95',
  wrong: 'bg-danger-muted border-danger/30 text-danger animate-[shake_0.3s_ease-in-out]',
  selected: 'bg-primary-muted border-primary/30 text-primary',
};

const sizeStyles = {
  md: 'min-h-[48px] min-w-[48px] px-4 py-2 text-base',
  lg: 'min-h-[56px] min-w-[56px] px-5 py-3 text-lg',
  xl: 'min-h-[64px] min-w-[64px] px-6 py-4 text-xl',
};

/**
 * GameButton — Large touch-target button for gameplay interactions.
 * Minimum 48px (Apple HIG).
 */
export function GameButton({
  variant = 'default',
  size = 'lg',
  className,
  children,
  ...props
}: GameButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-semibold',
        'transition-all duration-150 cursor-pointer select-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
