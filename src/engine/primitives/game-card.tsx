'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GameCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped?: boolean;
  isMatched?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};

/**
 * GameCard — Flippable card for memory games.
 * Shows back (default) and flips to reveal front.
 */
export function GameCard({
  front,
  back,
  isFlipped = false,
  isMatched = false,
  onClick,
  size = 'md',
  className,
}: GameCardProps) {
  return (
    <div
      className={cn(
        'relative cursor-pointer select-none perspective-[600px]',
        sizeStyles[size],
        isMatched && 'opacity-50 pointer-events-none',
        className,
      )}
      onClick={!isMatched ? onClick : undefined}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back face (visible when not flipped) */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg',
            'bg-card border border-border',
            'backface-hidden',
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {back}
        </div>

        {/* Front face (visible when flipped) */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg',
            'bg-primary-muted border border-primary/30',
          )}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {front}
        </div>
      </motion.div>
    </div>
  );
}
