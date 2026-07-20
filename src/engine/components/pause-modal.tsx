'use client';

import { motion } from 'framer-motion';
import { Play, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PauseModalProps {
  onResume: () => void;
  onQuit: () => void;
}

/**
 * Pause modal shown when the game is paused.
 * Blurs the game content behind it.
 */
export function PauseModal({ onResume, onQuit }: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-overlay backdrop-blur-md" />

      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-64 p-6 rounded-xl bg-surface border border-border shadow-lg text-center"
      >
        <div className="text-4xl mb-3">⏸️</div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Paused</h2>
        <p className="text-sm text-text-secondary mb-6">
          Take a breather. Your progress is saved.
        </p>

        <div className="space-y-3">
          <Button fullWidth onClick={onResume}>
            <Play className="h-4 w-4" />
            Resume
          </Button>

          <Button variant="ghost" fullWidth onClick={onQuit}>
            <LogOut className="h-4 w-4" />
            Quit Game
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
