'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useUIStore } from '@/stores/ui-store';
import { useEffect, useRef } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Persistent offline banner displayed at the top of the app.
 * Shows when the user goes offline, auto-dismisses + toasts on reconnect.
 */
export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const addToast = useUIStore((s) => s.addToast);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      // Just came back online
      wasOffline.current = false;
      addToast({
        message: 'You\'re back online!',
        description: 'Your changes will sync now.',
        variant: 'success',
        duration: 3000,
      });
    }
  }, [isOnline, addToast]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div
            className="flex items-center justify-center gap-2 px-4 py-2 bg-warning-muted text-warning text-xs font-medium"
            role="alert"
            aria-live="polite"
          >
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>You&apos;re offline — changes will sync when you reconnect</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
