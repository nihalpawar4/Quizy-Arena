'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

/**
 * Logic Sprint — Number Comparison Sprint
 *
 * Two values appear side by side. Player taps the LARGER one.
 * Higher levels: bigger numbers, expressions (e.g. "12 × 3"), negatives, tighter time.
 * Different from Speed Math (which requires typing answers).
 */

interface ComparisonPair {
  leftDisplay: string;
  leftValue: number;
  rightDisplay: string;
  rightValue: number;
}

function generatePair(level: number): ComparisonPair {
  const maxNum = Math.min(10 + level * 8, 200);

  // Level 1-3: Simple numbers
  if (level <= 3) {
    const a = Math.floor(Math.random() * maxNum) + 1;
    let b = Math.floor(Math.random() * maxNum) + 1;
    while (b === a) b = Math.floor(Math.random() * maxNum) + 1;
    return { leftDisplay: `${a}`, leftValue: a, rightDisplay: `${b}`, rightValue: b };
  }

  // Level 4-6: Mix of numbers and simple expressions
  if (level <= 6) {
    const useExpression = Math.random() > 0.4;
    if (useExpression) {
      const a1 = Math.floor(Math.random() * 15) + 2;
      const a2 = Math.floor(Math.random() * 10) + 1;
      const op = Math.random() > 0.5 ? '+' : '×';
      const aVal = op === '+' ? a1 + a2 : a1 * a2;

      const b = Math.floor(Math.random() * (maxNum * 1.5)) + 1;
      return {
        leftDisplay: `${a1} ${op} ${a2}`,
        leftValue: aVal,
        rightDisplay: `${b}`,
        rightValue: b,
      };
    }
    const a = Math.floor(Math.random() * maxNum) + 1;
    let b = Math.floor(Math.random() * maxNum) + 1;
    while (b === a) b = Math.floor(Math.random() * maxNum) + 1;
    return { leftDisplay: `${a}`, leftValue: a, rightDisplay: `${b}`, rightValue: b };
  }

  // Level 7-10: Expressions on both sides, possibly negative
  const ops = ['+', '-', '×'];
  const makeExpr = () => {
    const x = Math.floor(Math.random() * 20) + 2;
    const y = Math.floor(Math.random() * 12) + 1;
    const op = ops[Math.floor(Math.random() * ops.length)];
    let val: number;
    switch (op) {
      case '+': val = x + y; break;
      case '-': val = x - y; break;
      case '×': val = x * y; break;
      default: val = x + y;
    }
    return { display: `${x} ${op} ${y}`, value: val };
  };

  const left = makeExpr();
  let right = makeExpr();
  let tries = 0;
  while (right.value === left.value && tries < 20) {
    right = makeExpr();
    tries++;
  }

  // Randomly swap sides
  if (Math.random() > 0.5) {
    return {
      leftDisplay: left.display,
      leftValue: left.value,
      rightDisplay: right.display,
      rightValue: right.value,
    };
  }
  return {
    leftDisplay: right.display,
    leftValue: right.value,
    rightDisplay: left.display,
    rightValue: left.value,
  };
}

export default function LogicSprintGame({ engine }: GameComponentProps) {
  // itemCount = maxOperand, speed = difficulty multiplier from level-generator
  const maxNum = (engine.difficultyConfig.itemCount as number) ?? 20;
  const speed = (engine.difficultyConfig.speed as number) ?? 1;
  // Derive level approximation for display time scaling
  const effectiveLevel = Math.min(10, Math.max(1, Math.round(maxNum / 20)));
  const [pair, setPair] = useState<ComparisonPair>(() => generatePair(effectiveLevel));
  const [pairCount, setPairCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [tappedSide, setTappedSide] = useState<'left' | 'right' | null>(null);
  const timePerPair = Math.max(2, 6 - (effectiveLevel - 1) * 0.4);
  const pairTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [pairTimeLeft, setPairTimeLeft] = useState(timePerPair);
  const pairIntervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const nextPair = useCallback(() => {
    setPair(generatePair(effectiveLevel));
    setPairCount((p) => p + 1);
    setFeedback(null);
    setTappedSide(null);
    setPairTimeLeft(timePerPair);
  }, [effectiveLevel, timePerPair]);

  // Per-pair timer countdown
  useEffect(() => {
    if (engine.state !== 'playing' || feedback) return;

    setPairTimeLeft(timePerPair);
    pairIntervalRef.current = setInterval(() => {
      setPairTimeLeft((prev) => {
        if (prev <= 0.1) {
          if (pairIntervalRef.current) clearInterval(pairIntervalRef.current);
          // Defer the side effects to avoid setState-during-render
          queueMicrotask(() => {
            engine.recordWrong();
            setFeedback('wrong');
            setTimeout(nextPair, 600);
          });
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => { if (pairIntervalRef.current) clearInterval(pairIntervalRef.current); };
  }, [pairCount, engine.state, feedback]);

  const handleTap = useCallback((side: 'left' | 'right') => {
    if (feedback || engine.state !== 'playing') return;
    if (pairIntervalRef.current) clearInterval(pairIntervalRef.current);

    setTappedSide(side);

    const tappedValue = side === 'left' ? pair.leftValue : pair.rightValue;
    const otherValue = side === 'left' ? pair.rightValue : pair.leftValue;

    if (tappedValue > otherValue) {
      const speedBonus = Math.floor(pairTimeLeft * 3);
      engine.recordCorrect(10 + speedBonus);
      setFeedback('correct');
    } else if (tappedValue === otherValue) {
      // Equal — both are correct
      engine.recordCorrect(5);
      setFeedback('correct');
    } else {
      engine.recordWrong();
      setFeedback('wrong');
    }

    setTimeout(nextPair, 600);
  }, [feedback, engine, pair, pairTimeLeft, nextPair]);

  if (engine.state !== 'playing') return null;

  const timerPercent = Math.max(0, (pairTimeLeft / timePerPair) * 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 min-h-0">
      <p className="text-xs text-text-tertiary">Tap the LARGER value</p>

      {/* Per-pair timer */}
      <div className="w-full max-w-xs h-1.5 rounded-full bg-card-hover overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors',
            timerPercent > 30 ? 'bg-primary' : 'bg-danger',
          )}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Comparison cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pairCount}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-4 w-full max-w-sm"
        >
          {/* Left */}
          <button
            type="button"
            onClick={() => handleTap('left')}
            disabled={!!feedback}
            className={cn(
              'flex-1 aspect-square max-h-40 rounded-2xl flex items-center justify-center',
              'text-2xl sm:text-3xl font-bold font-mono transition-all cursor-pointer touch-manipulation',
              'border-2',
              !feedback && 'bg-surface border-border hover:border-primary hover:shadow-md active:scale-95',
              feedback && tappedSide === 'left' && feedback === 'correct' && 'bg-success/15 border-success text-success',
              feedback && tappedSide === 'left' && feedback === 'wrong' && 'bg-danger/15 border-danger text-danger',
              feedback && tappedSide !== 'left' && pair.leftValue > pair.rightValue && 'border-success/30 text-success/60',
              feedback && tappedSide !== 'left' && pair.leftValue <= pair.rightValue && 'border-border/50 text-text-tertiary',
            )}
          >
            {pair.leftDisplay}
          </button>

          <span className="text-lg font-bold text-text-tertiary shrink-0">vs</span>

          {/* Right */}
          <button
            type="button"
            onClick={() => handleTap('right')}
            disabled={!!feedback}
            className={cn(
              'flex-1 aspect-square max-h-40 rounded-2xl flex items-center justify-center',
              'text-2xl sm:text-3xl font-bold font-mono transition-all cursor-pointer',
              'border-2',
              !feedback && 'bg-surface border-border hover:border-primary hover:shadow-md active:scale-95',
              feedback && tappedSide === 'right' && feedback === 'correct' && 'bg-success/15 border-success text-success',
              feedback && tappedSide === 'right' && feedback === 'wrong' && 'bg-danger/15 border-danger text-danger',
              feedback && tappedSide !== 'right' && pair.rightValue > pair.leftValue && 'border-success/30 text-success/60',
              feedback && tappedSide !== 'right' && pair.rightValue <= pair.leftValue && 'border-border/50 text-text-tertiary',
            )}
          >
            {pair.rightDisplay}
          </button>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-text-tertiary font-mono">
        Problem #{pairCount + 1}
      </p>
    </div>
  );
}
