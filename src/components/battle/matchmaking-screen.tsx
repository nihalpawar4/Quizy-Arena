'use client';

import { motion } from 'framer-motion';
import { Search, X, Swords, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchmakingScreenProps {
  displayName: string;
  globalLevel: number;
  onCancel: () => void;
  timeElapsed: number;
  isTimedOut: boolean;
}

export function MatchmakingScreen({
  displayName,
  globalLevel,
  onCancel,
  timeElapsed,
  isTimedOut,
}: MatchmakingScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-[60vh]">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm text-center space-y-8">
        {/* VS Cards */}
        <div className="flex items-center justify-center gap-4">
          {/* Player card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🧠</span>
            </div>
            <p className="text-sm font-semibold text-text-primary max-w-[80px] truncate">{displayName}</p>
            <span className="text-[10px] text-text-tertiary">Lv. {globalLevel}</span>
          </motion.div>

          {/* VS Divider */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
              <Swords className="h-6 w-6 text-white" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Opponent card (mystery) */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className="h-20 w-20 rounded-2xl bg-gradient-to-br from-text-disabled/10 to-text-disabled/5 border border-border flex items-center justify-center shadow-lg"
              animate={{ borderColor: ['var(--arena-border)', 'var(--arena-primary)', 'var(--arena-border)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span
                className="text-3xl"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ?
              </motion.span>
            </motion.div>
            <p className="text-sm font-semibold text-text-tertiary">Searching...</p>
            <span className="text-[10px] text-text-tertiary">Lv. ???</span>
          </motion.div>
        </div>

        {/* Search status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {isTimedOut ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-text-secondary">
                <Wifi className="h-4 w-4 text-text-tertiary" />
                <span className="text-sm font-medium">No opponents found</span>
              </div>
              <p className="text-xs text-text-tertiary">
                Try again later — more players may be online!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-text-secondary">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Search className="h-4 w-4 text-primary" />
                </motion.div>
                <span className="text-sm font-medium">
                  Finding a worthy opponent...
                </span>
              </div>

              {/* Pulsing dots */}
              <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>

              <p className="text-xs text-text-tertiary">
                {timeElapsed}s elapsed
              </p>
            </div>
          )}
        </motion.div>

        {/* Cancel / Retry button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            variant="secondary"
            onClick={onCancel}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {isTimedOut ? 'Go Back' : 'Cancel Search'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
