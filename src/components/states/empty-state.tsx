'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  /** Small icon (e.g. Lucide icon) displayed above the title */
  icon?: React.ReactNode;
  /** Larger illustration component (from empty-illustrations.tsx) */
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Compact mode for inline use within cards */
  compact?: boolean;
}

/**
 * Beautiful empty state component with entrance animation.
 * Supports both small icons and larger SVG illustrations.
 */
export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-6 px-3' : 'py-12 px-4',
        className,
      )}
    >
      {/* Illustration (larger, centered) */}
      {illustration && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={cn('mb-4', compact ? 'mb-3' : 'mb-5')}
        >
          {illustration}
        </motion.div>
      )}

      {/* Icon (smaller, within a muted circle) */}
      {!illustration && icon && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 text-text-tertiary"
        >
          {icon}
        </motion.div>
      )}

      <h3
        className={cn(
          'font-semibold text-text-primary mb-1',
          compact ? 'text-sm' : 'text-base',
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-text-secondary max-w-xs',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(compact ? 'mt-3' : 'mt-4')}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
