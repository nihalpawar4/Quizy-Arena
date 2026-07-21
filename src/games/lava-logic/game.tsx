'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

interface SequencePuzzle {
  sequence: number[];
  answer: number;
  options: number[];
}

// Generate sequence puzzles algorithmically
function generateSequence(difficulty: number): SequencePuzzle {
  const patterns = [
    // Arithmetic: +N
    () => {
      const step = Math.floor(Math.random() * (3 + difficulty * 2)) + 2;
      const start = Math.floor(Math.random() * 10) + 1;
      const seq = Array.from({ length: 5 }, (_, i) => start + step * i);
      return { seq, answer: start + step * 5 };
    },
    // Geometric: ×N
    () => {
      const factor = Math.floor(Math.random() * 2) + 2;
      const start = Math.floor(Math.random() * 3) + 1;
      const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(factor, i));
      return { seq, answer: start * Math.pow(factor, 5) };
    },
    // Squares
    () => {
      const offset = Math.floor(Math.random() * 3);
      const seq = Array.from({ length: 5 }, (_, i) => (i + 1 + offset) * (i + 1 + offset));
      return { seq, answer: (6 + offset) * (6 + offset) };
    },
    // Fibonacci-like
    () => {
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 2;
      const seq = [a, b];
      for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]);
      const answer = seq[4] + seq[3];
      return { seq, answer };
    },
    // Alternating +A, +B
    () => {
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 4) + 3;
      const start = Math.floor(Math.random() * 5) + 1;
      const seq = [start];
      for (let i = 1; i < 5; i++) {
        seq.push(seq[i - 1] + (i % 2 === 1 ? a : b));
      }
      const answer = seq[4] + (5 % 2 === 1 ? a : b);
      return { seq, answer };
    },
    // Triangular numbers
    () => {
      const seq = Array.from({ length: 5 }, (_, i) => ((i + 1) * (i + 2)) / 2);
      return { seq, answer: (6 * 7) / 2 };
    },
  ];

  // Use more complex patterns at higher difficulty
  const maxIdx = Math.min(patterns.length - 1, 1 + difficulty);
  const patternIdx = Math.floor(Math.random() * (maxIdx + 1));
  const { seq, answer } = patterns[patternIdx]();

  // Generate wrong options
  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const offset = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const wrong = answer + offset;
    if (wrong !== answer && wrong > 0) wrongOptions.add(wrong);
  }

  const allOptions = [answer, ...Array.from(wrongOptions)];
  // Shuffle options
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  return {
    sequence: seq,
    answer,
    options: allOptions,
  };
}

export default function LavaLogicGame({ engine }: GameComponentProps) {
  const totalRounds = (engine.difficultyConfig.roundCount as number) ?? 5;
  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;

  const [currentRound, setCurrentRound] = useState(0);
  const [puzzle, setPuzzle] = useState<SequencePuzzle | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const roundStartRef = useRef(Date.now());

  // Generate puzzle for each round
  useEffect(() => {
    const difficulty = Math.floor(currentRound / 2); // Gets harder every 2 rounds
    setPuzzle(generateSequence(difficulty));
    roundStartRef.current = Date.now();
    engine.setRound(currentRound + 1, totalRounds);
  }, [currentRound, totalRounds, engine]);

  const handleAnswer = useCallback(
    (option: number) => {
      if (engine.state !== 'playing' || showResult || !puzzle) return;

      setSelectedAnswer(option);
      setShowResult(true);

      const isCorrect = option === puzzle.answer;
      const timeTaken = (Date.now() - roundStartRef.current) / 1000;

      if (isCorrect) {
        const pointsPerRound = Math.floor(maxScore / totalRounds);
        const speedBonus = Math.max(0.5, 1 - timeTaken / 30);
        engine.recordCorrect(Math.floor(pointsPerRound * speedBonus));
      } else {
        engine.recordWrong();
      }

      setTimeout(() => {
        setSelectedAnswer(null);
        setShowResult(false);

        if (currentRound + 1 >= totalRounds) {
          engine.complete();
        } else {
          setCurrentRound((r) => r + 1);
        }
      }, 1200);
    },
    [engine, showResult, puzzle, currentRound, totalRounds, maxScore],
  );

  if (!puzzle) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-6">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i < currentRound ? 'bg-success' : i === currentRound ? 'bg-red-400' : 'bg-card-hover',
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentRound}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Sequence display */}
          <div className="rounded-2xl bg-surface border border-border shadow-sm p-6 mb-6 text-center">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-4">
              What comes next? 🌋
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {puzzle.sequence.map((num, i) => (
                <span key={i} className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 text-lg font-bold text-text-primary font-mono">
                  {num}
                </span>
              ))}
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-red-500/20 border-2 border-dashed border-red-400/40 text-lg font-bold text-red-400">
                ?
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2.5">
            {puzzle.options.map((option, i) => {
              let variant = 'default';
              if (showResult) {
                if (option === puzzle.answer) variant = 'correct';
                else if (option === selectedAnswer) variant = 'wrong';
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'py-4 rounded-xl text-lg font-bold font-mono transition-all cursor-pointer border-2',
                    variant === 'correct' && 'bg-green-500/15 border-green-500/50 text-green-600',
                    variant === 'wrong' && 'bg-red-500/15 border-red-500/50 text-red-500',
                    variant === 'default' && 'bg-surface border-border text-text-primary hover:bg-card-hover hover:border-red-400/30',
                  )}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
