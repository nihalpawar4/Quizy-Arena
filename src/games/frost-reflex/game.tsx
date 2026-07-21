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

  const [targets, setTargets] = useState<Target[]>([]);
  const [tappedCount, setTappedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const nextIdRef = useRef(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expireTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef(false);

  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;

  // Spawn targets periodically
  useEffect(() => {
    if (engine.state !== 'playing') return;

    const spawnInterval = Math.max(600, maxReactionMs * 0.7);

    const spawnTarget = () => {
      if (hasEndedRef.current) return;
      if (tappedCount + missedCount >= totalTargets) return;

      const id = nextIdRef.current++;
      const isDecoy = Math.random() < 0.15; // 15% chance of decoy
      const pool = isDecoy ? DECOY_TARGETS : FROST_TARGETS;
      const emoji = pool[Math.floor(Math.random() * pool.length)];

      const newTarget: Target = {
        id,
        emoji,
        x: 10 + Math.random() * 75, // % position
        y: 10 + Math.random() * 70,
        spawnedAt: Date.now(),
        isDecoy,
      };

      setTargets((prev) => [...prev, newTarget]);

      // Auto-remove after maxReactionMs if not tapped
      expireTimerRef.current = setTimeout(() => {
        setTargets((prev) => {
          const still = prev.find((t) => t.id === id);
          if (still && !still.isDecoy) {
            // Missed a valid target
            setMissedCount((m) => {
              const newMissed = m + 1;
              if (newMissed >= 3 && !hasEndedRef.current) {
                hasEndedRef.current = true;
                setTimeout(() => engine.fail('missed'), 100);
              }
              return newMissed;
            });
            engine.recordWrong();
          }
          return prev.filter((t) => t.id !== id);
        });
      }, maxReactionMs);
    };

    // Initial spawn
    spawnTarget();

    spawnTimerRef.current = setInterval(spawnTarget, spawnInterval);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Check completion
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

      if (target.isDecoy) {
        // Tapped a decoy — penalty
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
      setTappedCount((c) => c + 1);
      setTargets((prev) => prev.filter((t) => t.id !== targetId));
    },
    [engine, targets, maxReactionMs, maxScore, totalTargets],
  );

  return (
    <div className="flex-1 relative overflow-hidden">
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
                target.isDecoy
                  ? 'bg-red-500/20 border-2 border-red-400/30'
                  : 'bg-sky-400/20 border-2 border-sky-300/40 hover:bg-sky-300/30',
              )}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
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
