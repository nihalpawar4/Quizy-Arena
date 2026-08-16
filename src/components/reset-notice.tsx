'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Rocket, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { updateDocument } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { getUnlockedWorldSlugs } from '@/lib/worlds';

const RESET_KEY = 'arena_reset_v2_dismissed';

/**
 * One-time reset notice shown on the home page after a major update.
 * When the user dismisses it:
 * 1. Resets gameLevels, XP, and stats in Firestore
 * 2. Updates the local Zustand store to reflect the reset
 * 3. Saves a localStorage flag so it never shows again
 */
export function ResetNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const arenaProfile = useAuthStore((s) => s.arenaProfile);
  const userProfile = useAuthStore((s) => s.userProfile);
  const setArenaProfile = useAuthStore((s) => s.setArenaProfile);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);

  useEffect(() => {
    // Only show once; never show again once dismissed
    const dismissed = localStorage.getItem(RESET_KEY);
    if (!dismissed && firebaseUser) {
      setIsVisible(true);
    }
  }, [firebaseUser]);

  const handleReady = () => {
    setIsReady(true);
  };

  const handleStartPlaying = async () => {
    if (!firebaseUser || !arenaProfile) {
      // If not logged in, just dismiss
      localStorage.setItem(RESET_KEY, 'true');
      setIsVisible(false);
      return;
    }

    setIsResetting(true);

    try {
      // 1. Reset arena profile in Firestore (including cognitive skills)
      const resetArenaData: Record<string, unknown> = {
        gameLevels: {},
        arenaXp: 0,
        arenaLevel: 1,
        brainScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPlayTimeSec: 0,
        arenaStreak: 0,
        arenaStreakBest: 0,
        personalBests: {},
        rankPoints: 0,
        currentWorldSlug: 'training-camp',
        unlockedWorldSlugs: getUnlockedWorldSlugs(),
        // Reset all cognitive skill scores
        skillMemory: 0,
        skillLogic: 0,
        skillFocus: 0,
        skillReaction: 0,
        skillCreativity: 0,
        skillProblemSolving: 0,
        skillPatternRecognition: 0,
        skillDecisionMaking: 0,
        updatedAt: serverTimestamp(),
      };

      await updateDocument('arena_profiles', firebaseUser.uid, resetArenaData);

      // 2. Reset user profile in Firestore (XP, level, coins)
      // Collection is 'users' — same as leaderboard queries
      const resetUserData: Record<string, unknown> = {
        globalXp: 0,
        globalLevel: 1,
        coins: 0,
        diamonds: 0,
        currentStreak: 0,
        longestStreak: 0,
        updatedAt: serverTimestamp(),
      };

      await updateDocument('users', firebaseUser.uid, resetUserData);

      // 3. Update local Zustand stores
      setArenaProfile({
        ...arenaProfile,
        gameLevels: {},
        arenaXp: 0,
        arenaLevel: 1,
        brainScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPlayTimeSec: 0,
        arenaStreak: 0,
        arenaStreakBest: 0,
        personalBests: {},
        rankPoints: 0,
        currentWorldSlug: 'training-camp',
        unlockedWorldSlugs: getUnlockedWorldSlugs(),
        skillMemory: 0,
        skillLogic: 0,
        skillFocus: 0,
        skillReaction: 0,
        skillCreativity: 0,
        skillProblemSolving: 0,
        skillPatternRecognition: 0,
        skillDecisionMaking: 0,
      } as typeof arenaProfile);

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          globalXp: 0,
          globalLevel: 1,
          coins: 0,
          diamonds: 0,
        });
      }
    } catch (err) {
      console.error('[ResetNotice] Failed to reset profile:', err);
    }

    // Mark as dismissed
    localStorage.setItem(RESET_KEY, 'true');
    setIsVisible(false);
    setIsResetting(false);
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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Notice card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-3xl overflow-hidden"
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-success/30 p-[1px]">
            <div className="h-full w-full rounded-3xl bg-card" />
          </div>

          {/* Content */}
          <div className="relative p-8 space-y-6">
            {/* Header with icon */}
            <div className="text-center space-y-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto"
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>

              <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                Major Update! 🎉
              </h2>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-xs font-semibold text-success">v2.0 — 70% Bugs Fixed</span>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                Dear Students! 👋
              </p>
              <p>
                We&apos;ve been working hard behind the scenes. Here&apos;s what&apos;s new:
              </p>

              <div className="space-y-2 pl-1">
                {[
                  '🔧 Fixed 70% of game bugs — smoother gameplay!',
                  '🎮 Games now work properly on all devices',
                  '📈 Level progression actually saves now',
                  '🏆 Sequential world unlocking — master each game!',
                  '⚡ Faster load times & better performance',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>

              <div className="pt-2 p-3 rounded-xl bg-warning/5 border border-warning/15">
                <p className="text-xs text-warning font-medium">
                  ⚠️ To give you the best fresh experience, all game progress, XP, and levels
                  have been reset. Start your journey anew, my champions!
                </p>
              </div>
            </div>

            {/* Action */}
            <AnimatePresence mode="wait">
              {!isReady ? (
                <motion.div
                  key="ready-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-3"
                >
                  <p className="text-sm font-semibold text-text-primary">
                    Are you ready for a fresh start? 🚀
                  </p>
                  <Button
                    className="w-full"
                    onClick={handleReady}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Yes, I&apos;m Ready!
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="start-button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <Button
                    className="w-full text-base py-3"
                    onClick={handleStartPlaying}
                    isLoading={isResetting}
                    disabled={isResetting}
                  >
                    <Rocket className="h-5 w-5" />
                    Start Playing!
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
