'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type Toast } from '@/stores/ui-store';

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const variantStyles = {
  info: 'border-primary/30 bg-primary-muted/30',
  success: 'border-success/30 bg-success-muted/30',
  warning: 'border-warning/30 bg-warning-muted/30',
  error: 'border-danger/30 bg-danger-muted/30',
};

const iconStyles = {
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm md:bottom-6 md:left-auto md:right-6 md:translate-x-0"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const Icon = icons[toast.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border shadow-md',
        'bg-surface backdrop-blur-sm',
        variantStyles[toast.variant],
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconStyles[toast.variant])} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.message}</p>
        {toast.description && (
          <p className="text-xs text-text-secondary mt-0.5">{toast.description}</p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="p-0.5 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
