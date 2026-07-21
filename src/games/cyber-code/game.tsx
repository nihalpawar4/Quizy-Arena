'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

const CODE_COLORS = [
  { name: 'Red', bg: 'bg-red-500', border: 'border-red-400', active: 'bg-red-400', hex: '#EF4444' },
  { name: 'Blue', bg: 'bg-blue-500', border: 'border-blue-400', active: 'bg-blue-400', hex: '#3B82F6' },
  { name: 'Green', bg: 'bg-green-500', border: 'border-green-400', active: 'bg-green-400', hex: '#22C55E' },
  { name: 'Purple', bg: 'bg-purple-500', border: 'border-purple-400', active: 'bg-purple-400', hex: '#A855F7' },
  { name: 'Yellow', bg: 'bg-yellow-500', border: 'border-yellow-400', active: 'bg-yellow-400', hex: '#EAB308' },
  { name: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-400', active: 'bg-cyan-400', hex: '#06B6D4' },
];

type Phase = 'showing' | 'input' | 'feedback';

export default function CyberCodeGame({ engine }: GameComponentProps) {
  const patternLength = (engine.difficultyConfig.itemCount as number) ?? 4;
  const totalRounds = (engine.difficultyConfig.roundCount as number) ?? 8;
  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;

  const [currentRound, setCurrentRound] = useState(0);
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('showing');
  const [activeShowIdx, setActiveShowIdx] = useState(-1);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Current pattern length grows every 3 rounds
  const currentPatternLen = patternLength + Math.floor(currentRound / 3);

  // Generate and show pattern
  useEffect(() => {
    if (engine.state !== 'playing') return;

    // Generate new pattern
    const newPattern: number[] = [];
    for (let i = 0; i < currentPatternLen; i++) {
      newPattern.push(Math.floor(Math.random() * CODE_COLORS.length));
    }
    setPattern(newPattern);
    setPlayerInput([]);
    setPhase('showing');
    setActiveShowIdx(-1);

    engine.setRound(currentRound + 1, totalRounds);

    // Show pattern one by one
    let idx = 0;
    const showNext = () => {
      if (idx < newPattern.length) {
        setActiveShowIdx(idx);
        idx++;
        showTimerRef.current = setTimeout(() => {
          setActiveShowIdx(-1);
          showTimerRef.current = setTimeout(showNext, 200);
        }, 500);
      } else {
        setPhase('input');
      }
    };

    showTimerRef.current = setTimeout(showNext, 600);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, engine.state === 'playing']);

  const handleColorTap = useCallback(
    (colorIdx: number) => {
      if (phase !== 'input' || engine.state !== 'playing') return;

      const newInput = [...playerInput, colorIdx];
      setPlayerInput(newInput);

      const inputIdx = newInput.length - 1;

      // Check if this input matches the pattern
      if (newInput[inputIdx] !== pattern[inputIdx]) {
        // Wrong!
        setPhase('feedback');
        setFeedbackCorrect(false);
        engine.recordWrong();

        setTimeout(() => {
          if (currentRound + 1 >= totalRounds) {
            engine.complete();
          } else {
            setCurrentRound((r) => r + 1);
          }
        }, 800);
        return;
      }

      // Check if complete
      if (newInput.length === pattern.length) {
        // Correct!
        setPhase('feedback');
        setFeedbackCorrect(true);
        const pointsPerRound = Math.floor(maxScore / totalRounds);
        engine.recordCorrect(pointsPerRound);

        setTimeout(() => {
          if (currentRound + 1 >= totalRounds) {
            engine.complete();
          } else {
            setCurrentRound((r) => r + 1);
          }
        }, 800);
      }
    },
    [phase, engine, playerInput, pattern, currentRound, totalRounds, maxScore],
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
      {/* Round progress */}
      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-colors',
              i < totalRounds / 2 ? 'w-3' : 'w-2',
              i < currentRound ? 'bg-purple-400' : i === currentRound ? 'bg-purple-500' : 'bg-card-hover',
            )}
          />
        ))}
      </div>

      {/* Phase indicator */}
      <div className="mb-6 text-center">
        <AnimatePresence mode="wait">
          {phase === 'showing' && (
            <motion.p
              key="showing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-purple-400 font-medium"
            >
              👁️ Memorize the pattern...
            </motion.p>
          )}
          {phase === 'input' && (
            <motion.p
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-text-secondary font-medium"
            >
              🎯 Reproduce it! ({playerInput.length}/{pattern.length})
            </motion.p>
          )}
          {phase === 'feedback' && (
            <motion.p
              key="feedback"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={cn('text-sm font-bold', feedbackCorrect ? 'text-green-400' : 'text-red-400')}
            >
              {feedbackCorrect ? '✅ Correct!' : '❌ Wrong!'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Pattern display (shown during 'showing' phase) */}
      <div className="flex items-center justify-center gap-2 mb-8 min-h-[48px]">
        {pattern.map((colorIdx, i) => (
          <motion.div
            key={i}
            className={cn(
              'h-10 w-10 rounded-lg border-2 transition-all',
              phase === 'showing' && i === activeShowIdx
                ? `${CODE_COLORS[colorIdx].bg} ${CODE_COLORS[colorIdx].border} scale-110 shadow-lg`
                : phase === 'showing'
                  ? 'bg-card-hover border-border'
                  : i < playerInput.length
                    ? `${CODE_COLORS[playerInput[i]].bg} ${CODE_COLORS[playerInput[i]].border}`
                    : 'bg-card-hover border-border',
            )}
            animate={
              phase === 'showing' && i === activeShowIdx
                ? { scale: [1, 1.15, 1] }
                : {}
            }
          />
        ))}
      </div>

      {/* Color buttons */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {CODE_COLORS.map((color, i) => (
          <motion.button
            key={i}
            onClick={() => handleColorTap(i)}
            disabled={phase !== 'input'}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'aspect-square rounded-2xl border-2 transition-all cursor-pointer',
              'flex items-center justify-center',
              `${color.bg} ${color.border}`,
              phase !== 'input' && 'opacity-50',
              phase === 'input' && 'hover:opacity-80 active:opacity-60',
            )}
          >
            <span className="text-white text-xs font-bold drop-shadow-sm">{color.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
