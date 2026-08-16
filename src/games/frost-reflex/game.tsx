'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

const FROST_TARGETS = ['❄️', '🌨️', '⛄', '🧊', '💎', '🌟'];
const DECOY_TARGETS = ['🔥', '☀️']; // Don't tap these!

interface Target {
  id: number;
  emoji: string;
  x: number;
  y: number;
  spawnedAt: number;
  isDecoy: boolean;
}

export default function FrostReflexGame({ engine }: GameComponentProps) {
  const maxReactionMs = (engine.difficultyConfig.maxReactionMs as number) ?? 2000;
  const totalTargets = (engine.difficultyConfig.itemCount as number) ?? 15;
  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;

  const [targets, setTargets] = useState<Target[]>([]);

  // Use refs for counts used inside timer callbacks to avoid stale closures
  const tappedCountRef = useRef(0);
  const missedCountRef = useRef(0);
  const [tappedCount, setTappedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);

  const nextIdRef = useRef(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Map of targetId → expire timeout so we can cancel per-target
  const expireTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const hasEndedRef = useRef(false);

  // Spawn targets periodically
  useEffect(() => {
    if (engine.state !== 'playing') return;

    const spawnInterval = Math.max(600, maxReactionMs * 0.7);

    const spawnTarget = () => {
      if (hasEndedRef.current) return;
      // Read from refs — never stale
      if (tappedCountRef.current + missedCountRef.current >= totalTargets) return;

      const id = nextIdRef.current++;
      const isDecoy = Math.random() < 0.15;
      const pool = isDecoy ? DECOY_TARGETS : FROST_TARGETS;
      const emoji = pool[Math.floor(Math.random() * pool.length)];

      const newTarget: Target = {
        id,
        emoji,
        // Constrain x/y so the 64px tap target stays fully on screen
        // with adequate padding from edges and the top stats bar
        x: 12 + Math.random() * 70,   // 12–82%
        y: 18 + Math.random() * 54,   // 18–72% (avoids stats bar at top + ground at bottom)
        spawnedAt: Date.now(),
        isDecoy,
      };

      setTargets((prev) => [...prev, newTarget]);

      // Auto-remove after maxReactionMs if not tapped
      const expireTimer = setTimeout(() => {
        expireTimersRef.current.delete(id);
        setTargets((prev) => {
          const still = prev.find((t) => t.id === id);
          if (still && !still.isDecoy && !hasEndedRef.current) {
            // Missed a valid target — increment ref first so next spawn check is accurate
            missedCountRef.current += 1;
            setMissedCount(missedCountRef.current);
            // recordWrong handles life deduction + fail when lives hit 0
            engine.recordWrong();
          }
          return prev.filter((t) => t.id !== id);
        });
      }, maxReactionMs);

      expireTimersRef.current.set(id, expireTimer);
    };

    // Initial spawn
    spawnTarget();
    spawnTimerRef.current = setInterval(spawnTarget, spawnInterval);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      // Clear all per-target expire timers
      expireTimersRef.current.forEach((t) => clearTimeout(t));
      expireTimersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Check completion (all targets resolved)
  useEffect(() => {
    if (tappedCount + missedCount >= totalTargets && !hasEndedRef.current) {
      hasEndedRef.current = true;
      setTimeout(() => engine.complete(), 500);
    }
  }, [tappedCount, missedCount, totalTargets, engine]);

  const handleTap = useCallback(
    (targetId: number) => {
      if (engine.state !== 'playing') return;

      const target = targets.find((t) => t.id === targetId);
      if (!target) return;

      // Cancel the expire timer for this target
      const expireTimer = expireTimersRef.current.get(targetId);
      if (expireTimer) {
        clearTimeout(expireTimer);
        expireTimersRef.current.delete(targetId);
      }

      if (target.isDecoy) {
        // Tapped a decoy — penalty (recordWrong handles fail if lives hit 0)
        engine.recordWrong();
        setTargets((prev) => prev.filter((t) => t.id !== targetId));
        return;
      }

      // Calculate score based on reaction time
      const reactionTime = Date.now() - target.spawnedAt;
      const timeRatio = Math.max(0, 1 - reactionTime / maxReactionMs);
      const pointsPerTarget = Math.floor(maxScore / totalTargets);
      const points = Math.floor(pointsPerTarget * (0.5 + timeRatio * 0.5));

      engine.recordCorrect(points);
      tappedCountRef.current += 1;
      setTappedCount(tappedCountRef.current);
      setTargets((prev) => prev.filter((t) => t.id !== targetId));
    },
    [engine, targets, maxReactionMs, maxScore, totalTargets],
  );

  return (
    <div className="flex-1 h-full relative overflow-hidden min-h-0">
      {/* Stats bar */}
      <div className="absolute top-2 left-0 right-0 z-10 flex items-center justify-center gap-6 text-sm text-text-secondary">
        <span>✅ {tappedCount}/{totalTargets}</span>
        <span className={cn(missedCount >= 2 && 'text-danger font-bold')}>
          ❌ {missedCount}/3
        </span>
      </div>

      {/* Target area */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {targets.map((target) => (
            <motion.button
              key={target.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleTap(target.id)}
              className={cn(
                'absolute cursor-pointer select-none',
                'h-16 w-16 rounded-full flex items-center justify-center',
                'touch-manipulation',
                target.isDecoy
                  ? 'bg-red-500/20 border-2 border-red-400/30'
                  : 'bg-sky-400/20 border-2 border-sky-300/40 hover:bg-sky-300/30 active:scale-90',
              )}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-3xl">{target.emoji}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
