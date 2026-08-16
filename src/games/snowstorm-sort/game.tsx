'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

interface NumberItem {
  id: number;
  value: number;
  x: number;
  y: number;
  isDecoy: boolean;
  isTapped: boolean;
}

/**
 * Generate big random numbers for sorting.
 * Numbers are unique, large (2-3 digits), and NOT sequential.
 */
function generateBigNumbers(count: number, round: number): number[] {
  const numbers = new Set<number>();
  // Range grows with rounds: round 1 → 10-50, round 5 → 20-200
  const minVal = 10 + round * 5;
  const maxVal = 50 + round * 40;
  while (numbers.size < count) {
    numbers.add(minVal + Math.floor(Math.random() * (maxVal - minVal)));
  }
  return Array.from(numbers);
}

function generateRound(count: number, decoyCount: number, round: number): NumberItem[] {
  const items: NumberItem[] = [];
  const usedPositions: { x: number; y: number }[] = [];

  const getUniquePos = () => {
    let attempts = 0;
    while (attempts < 50) {
      const x = 10 + Math.random() * 72;
      const y = 16 + Math.random() * 58;
      const tooClose = usedPositions.some(
        (p) => Math.abs(p.x - x) < 16 && Math.abs(p.y - y) < 14,
      );
      if (!tooClose) {
        usedPositions.push({ x, y });
        return { x, y };
      }
      attempts++;
    }
    const x = 10 + Math.random() * 72;
    const y = 16 + Math.random() * 58;
    usedPositions.push({ x, y });
    return { x, y };
  };

  // Generate big numbers and sort them to know the correct order
  const realValues = generateBigNumbers(count, round);
  const sorted = [...realValues].sort((a, b) => a - b);

  // Real numbers — `id` matches their correct tap order (1-based)
  realValues.forEach((value, idx) => {
    const pos = getUniquePos();
    const correctOrder = sorted.indexOf(value) + 1;
    items.push({
      id: correctOrder,
      value,
      x: pos.x,
      y: pos.y,
      isDecoy: false,
      isTapped: false,
    });
  });

  // Decoys — values that are clearly outside the range
  for (let i = 0; i < decoyCount; i++) {
    const pos = getUniquePos();
    const maxReal = Math.max(...realValues);
    const decoyValue = maxReal + 50 + Math.floor(Math.random() * 100);
    items.push({
      id: count + i + 1,
      value: decoyValue,
      x: pos.x,
      y: pos.y,
      isDecoy: true,
      isTapped: false,
    });
  }

  return items;
}

export default function SnowstormSortGame({ engine }: GameComponentProps) {
  const baseItemCount = (engine.difficultyConfig.itemCount as number) ?? 5;
  const roundCount = (engine.difficultyConfig.roundCount as number) ?? 5;
  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;

  const [currentRound, setCurrentRound] = useState(1);
  // Each round adds 1 more number
  const roundItemCount = baseItemCount + (currentRound - 1);
  const decoyCount = Math.max(1, Math.floor(roundItemCount * 0.3));

  const [items, setItems] = useState<NumberItem[]>(() =>
    generateRound(baseItemCount, Math.max(1, Math.floor(baseItemCount * 0.3)), 1),
  );
  const [nextExpected, setNextExpected] = useState(1);
  const [showRoundBanner, setShowRoundBanner] = useState(false);
  const hasEndedRef = useRef(false);

  // Set initial round
  useEffect(() => {
    if (engine.state === 'playing') {
      engine.setRound(1, roundCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Start next round immediately after sorting
  const advanceRound = useCallback(() => {
    if (hasEndedRef.current) return;

    if (currentRound >= roundCount) {
      hasEndedRef.current = true;
      engine.complete();
      return;
    }

    const nextRound = currentRound + 1;
    const nextItemCount = baseItemCount + (nextRound - 1);
    const nextDecoyCount = Math.max(1, Math.floor(nextItemCount * 0.3));

    // Flash banner briefly
    setShowRoundBanner(true);
    setTimeout(() => {
      setCurrentRound(nextRound);
      setItems(generateRound(nextItemCount, nextDecoyCount, nextRound));
      setNextExpected(1);
      setShowRoundBanner(false);
      engine.setRound(nextRound, roundCount);
    }, 400);
  }, [currentRound, roundCount, baseItemCount, engine]);

  const handleTap = useCallback(
    (itemId: number) => {
      if (engine.state !== 'playing' || hasEndedRef.current || showRoundBanner) return;

      const item = items.find((i) => i.id === itemId);
      if (!item || item.isTapped) return;

      if (item.isDecoy) {
        engine.recordWrong();
        return;
      }

      if (item.id === nextExpected) {
        // Correct order!
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isTapped: true } : i)),
        );

        const roundMultiplier = 1 + (currentRound - 1) * 0.15;
        const basePoints = Math.floor(maxScore / (roundCount * roundItemCount));
        const points = Math.floor(basePoints * roundMultiplier);
        engine.recordCorrect(points);

        if (nextExpected >= roundItemCount) {
          // Round sorted! Advance immediately
          advanceRound();
        } else {
          setNextExpected((n) => n + 1);
        }
      } else {
        engine.recordWrong();
      }
    },
    [engine, items, nextExpected, roundItemCount, roundCount, maxScore, currentRound, advanceRound, showRoundBanner],
  );

  // Find the actual value of the next expected number for display
  const nextExpectedValue = items.find((i) => i.id === nextExpected && !i.isDecoy)?.value;

  return (
    <div className="flex-1 h-full relative overflow-hidden min-h-0">
      {/* Stats bar */}
      <div className="absolute top-2 left-0 right-0 z-10 flex items-center justify-center gap-4 text-sm text-text-secondary px-4">
        <span>Round <strong className="text-text-primary font-mono">{currentRound}/{roundCount}</strong></span>
        <span>Next: <strong className="text-sky-400 font-mono text-lg">{nextExpectedValue ?? '?'}</strong></span>
        <span className={cn(engine.lives <= 1 && 'text-danger font-bold')}>
          ❤️ {engine.lives}
        </span>
      </div>

      {/* Difficulty indicator */}
      <div className="absolute top-9 left-0 right-0 z-10 flex items-center justify-center">
        <span className="text-[10px] text-text-tertiary">
          {roundItemCount} numbers · tap smallest → largest
        </span>
      </div>

      {/* Blizzard background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/10 select-none"
            style={{ left: `${(i * 10) % 100}%`, fontSize: `${8 + (i % 4) * 4}px` }}
            animate={{ y: ['-10vh', '110vh'], x: [0, Math.sin(i * 0.7) * 30, 0] }}
            transition={{ duration: 4 + (i % 5) * 2, repeat: Infinity, delay: i * 0.8, ease: 'linear' }}
          >
            ❄️
          </motion.div>
        ))}
      </div>

      {/* Number items */}
      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          if (item.isTapped) return null;
          return (
            <motion.button
              key={`${currentRound}-${item.id}-${item.value}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleTap(item.id)}
              className={cn(
                'absolute min-w-[3.5rem] h-14 px-3 rounded-full flex items-center justify-center',
                'font-bold text-base transition-all select-none cursor-pointer',
                'border-2 shadow-lg touch-manipulation active:scale-90',
                item.isDecoy
                  ? 'bg-red-500/20 border-red-400/40 text-red-300'
                  : item.id === nextExpected
                    ? 'bg-sky-500/40 border-sky-300/60 text-white shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-700/50 border-slate-500/30 text-slate-200',
              )}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {item.value}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Round transition banner */}
      <AnimatePresence>
        {showRoundBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="bg-sky-500/20 backdrop-blur-sm rounded-2xl px-8 py-4 border border-sky-300/30">
              <p className="text-2xl font-bold text-sky-300">
                {currentRound >= roundCount ? '🏆 Complete!' : `✨ Round ${currentRound + 1}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
