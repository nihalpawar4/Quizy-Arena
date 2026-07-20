'use client';

import { AlertTriangle, WifiOff, ShieldX, FileQuestion, Clock, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { FirebaseErrorCategory } from '@/lib/firebase/firebase-error';

type ErrorVariant = 'generic' | 'offline' | 'permission' | 'not-found' | 'timeout';

interface ErrorStateProps {
  title?: string;
  description?: string;
  variant?: ErrorVariant;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Map Firebase error categories to display variants.
 */
export function categoryToVariant(category: FirebaseErrorCategory): ErrorVariant {
  switch (category) {
    case 'offline':
      return 'offline';
    case 'permission-denied':
    case 'unauthenticated':
      return 'permission';
    case 'not-found':
      return 'not-found';
    case 'timeout':
      return 'timeout';
    default:
      return 'generic';
  }
}

const VARIANT_CONFIG: Record<
  ErrorVariant,
  {
    icon: typeof AlertTriangle;
    defaultTitle: string;
    defaultDescription: string;
    iconBgClass: string;
    iconClass: string;
  }
> = {
  generic: {
    icon: ServerCrash,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'We couldn\'t load this content. Please try again.',
    iconBgClass: 'bg-danger-muted',
    iconClass: 'text-danger',
  },
  offline: {
    icon: WifiOff,
    defaultTitle: 'You\'re offline',
    defaultDescription: 'Check your internet connection and try again.',
    iconBgClass: 'bg-warning-muted',
    iconClass: 'text-warning',
  },
  permission: {
    icon: ShieldX,
    defaultTitle: 'Access denied',
    defaultDescription: 'You don\'t have permission to view this content.',
    iconBgClass: 'bg-danger-muted',
    iconClass: 'text-danger',
  },
  'not-found': {
    icon: FileQuestion,
    defaultTitle: 'Not found',
    defaultDescription: 'The content you\'re looking for doesn\'t exist.',
    iconBgClass: 'bg-accent-muted',
    iconClass: 'text-accent',
  },
  timeout: {
    icon: Clock,
    defaultTitle: 'Request timed out',
    defaultDescription: 'The server took too long to respond. Please try again.',
    iconBgClass: 'bg-warning-muted',
    iconClass: 'text-warning',
  },
};

export function ErrorState({
  title,
  description,
  variant = 'generic',
  onRetry,
  isRetrying = false,
  className,
  compact = false,
}: ErrorStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

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
      role="alert"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className={cn('mb-4 p-3 rounded-full', config.iconBgClass)}
      >
        <Icon className={cn('h-6 w-6', config.iconClass)} />
      </motion.div>

      <h3 className={cn(
        'font-semibold text-text-primary mb-1',
        compact ? 'text-sm' : 'text-base',
      )}>
        {title ?? config.defaultTitle}
      </h3>

      <p className={cn(
        'text-text-secondary max-w-xs mb-4',
        compact ? 'text-xs' : 'text-sm',
      )}>
        {description ?? config.defaultDescription}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )}
    </motion.div>
  );
}
