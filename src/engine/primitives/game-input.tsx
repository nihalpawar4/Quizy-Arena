'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface GameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  autoFocusOnMount?: boolean;
  variant?: 'default' | 'correct' | 'wrong';
}

const variantStyles = {
  default: 'border-border focus:border-primary',
  correct: 'border-success bg-success-muted/30',
  wrong: 'border-danger bg-danger-muted/30 animate-[shake_0.3s_ease-in-out]',
};

/**
 * GameInput — Large auto-focus input for math/word games.
 * Centers text, uses monospace font, auto-selects on focus.
 */
export const GameInput = forwardRef<HTMLInputElement, GameInputProps>(
  ({ autoFocusOnMount = true, variant = 'default', className, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (autoFocusOnMount && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocusOnMount]);

    return (
      <input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'h-14 w-full max-w-xs rounded-lg border-2 px-4',
          'text-center text-2xl font-bold font-mono',
          'bg-card text-text-primary placeholder:text-text-disabled',
          'outline-none transition-colors duration-150',
          variantStyles[variant],
          className,
        )}
        onFocus={(e) => e.target.select()}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        {...props}
      />
    );
  },
);

GameInput.displayName = 'GameInput';
