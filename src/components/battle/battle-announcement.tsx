'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Sparkles, Zap, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

const ANNOUNCEMENT_KEY = 'arena_battle_announced_v1';

/**
 * One-time popup announcing that Battle Arena is now available.
 * Uses localStorage to ensure it only shows once per device.
 */
export function BattleAnnouncement() {
  const [isVisible, setIsVisible] = useState(false);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  useEffect(() => {
    // Only show for authenticated users who haven't seen it
    if (!firebaseUser) return;
    const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!dismissed) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [firebaseUser]);

  const handleDismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={handleDismiss}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 40 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        >
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 via-accent/30 to-warning/40 p-[1.5px]">
            <div className="h-full w-full rounded-3xl bg-card" />
          </div>

          {/* Inner content */}
          <div className="relative p-8 space-y-6">
            {/* Animated swords icon */}
            <div className="text-center">
              <motion.div
                className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl mx-auto"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Swords className="h-10 w-10 text-white" />
              </motion.div>

              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-lg"
                  style={{
                    left: `${25 + Math.random() * 50}%`,
                    top: `${10 + Math.random() * 30}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    y: [0, -20],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.4,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-text-primary"
              >
                Battle Arena is
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {' '}NOW LIVE!
                </span>{' '}
                ⚔️
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-text-secondary"
              >
                Challenge real players in 60-second brain duels!
              </motion.p>
            </div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {[
                { icon: <Zap className="h-3 w-3" />, label: 'Real-time PvP' },
                { icon: <Trophy className="h-3 w-3" />, label: 'Earn Rewards' },
                { icon: <Sparkles className="h-3 w-3" />, label: 'Climb Ranks' },
              ].map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
                >
                  {feat.icon}
                  {feat.label}
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <Link href="/battle" onClick={handleDismiss} className="block">
                <Button className="w-full h-12 text-base font-bold gap-2 relative overflow-hidden">
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <span className="relative flex items-center gap-2">
                    <Swords className="h-5 w-5" />
                    Try it Now!
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </Link>

              <button
                onClick={handleDismiss}
                className="w-full text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer py-1"
              >
                Maybe later
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
