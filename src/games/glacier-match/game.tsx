'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

const ICE_CRYSTALS = ['💎', '❄️', '🧊', '⭐', '🔷', '💠', '🌟', '🔹', '🌀', '🪩', '✨', '🫧'];

type Phase = 'showing' | 'input' | 'feedback';

export default function GlacierMatchGame({ engine }: GameComponentProps) {
  const gridSize = (engine.difficultyConfig.gridSize as number) ?? 6;
  const startLength = (engine.difficultyConfig.itemCount as number) ?? 3;
  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;

  const [crystals] = useState(() =>
    ICE_CRYSTALS.slice(0, gridSize).sort(() => Math.random() - 0.5),
  );
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('showing');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const hasEndedRef = useRef(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize first sequence
  useEffect(() => {
    if (engine.state === 'playing' && sequence.length === 0) {
      const initial: number[] = [];
      for (let i = 0; i < startLength; i++) {
        initial.push(Math.floor(Math.random() * gridSize));
      }
      setSequence(initial);
      setRound(1);
      engine.setRound(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Show sequence animation
  useEffect(() => {
    if (phase !== 'showing' || sequence.length === 0) return;
    if (engine.state !== 'playing') return;

    let i = 0;
    const showSpeed = Math.max(300, 600 - round * 20);

    const showNext = () => {
      if (i < sequence.length) {
        setActiveIdx(sequence[i]);
        i++;
        showTimerRef.current = setTimeout(() => {
          setActiveIdx(null);
          showTimerRef.current = setTimeout(showNext, 200);
        }, showSpeed);
      } else {
        setActiveIdx(null);
        setPhase('input');
        setPlayerInput([]);
      }
    };

    // Brief pause before showing
    showTimerRef.current = setTimeout(showNext, 500);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence, round]);

  const handleCrystalTap = useCallback(
    (crystalIdx: number) => {
      if (phase !== 'input' || engine.state !== 'playing' || hasEndedRef.current) return;

      const stepIdx = playerInput.length;
      const expected = sequence[stepIdx];
      const newInput = [...playerInput, crystalIdx];

      if (crystalIdx === expected) {
        // Correct tap
        setFlashIdx(crystalIdx);
        setFlashType('correct');
        setTimeout(() => { setFlashIdx(null); setFlashType(null); }, 200);

        setPlayerInput(newInput);

        // Check if sequence complete
        if (newInput.length === sequence.length) {
          // Round complete!
          const speedBonus = Math.max(0, Math.floor(10 - engine.timeElapsed % 8));
          const roundPoints = Math.floor(maxScore / 15) + speedBonus;
          engine.recordCorrect(roundPoints);

          setPhase('feedback');

          setTimeout(() => {
            // Add one more to the sequence
            const nextCrystal = Math.floor(Math.random() * gridSize);
            setSequence((prev) => [...prev, nextCrystal]);
            setRound((r) => {
              const newRound = r + 1;
              engine.setRound(newRound);
              return newRound;
            });
            setPhase('showing');
          }, 800);
        }
      } else {
        // Wrong tap
        setFlashIdx(crystalIdx);
        setFlashType('wrong');
        setTimeout(() => { setFlashIdx(null); setFlashType(null); }, 300);

        // recordWrong handles life deduction + automatic fail when lives reach 0.
        // Do NOT manually call engine.fail() here — it would race with the internal one.
        engine.recordWrong();

        // Replay sequence (engine will transition to failed if lives hit 0 first)
        setTimeout(() => {
          if (!hasEndedRef.current) {
            setPhase('showing');
            setPlayerInput([]);
          }
        }, 600);
      }
    },
    [phase, playerInput, sequence, engine, gridSize, maxScore],
  );

  // Calculate grid dimensions
  const cols = gridSize <= 6 ? 3 : gridSize <= 9 ? 3 : 4;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-5 min-h-0">
      {/* Status */}
      <div className="flex items-center gap-6 text-sm text-text-secondary">
        <span>Round <strong className="text-text-primary font-mono">{round}</strong></span>
        <span>Sequence <strong className="text-text-primary font-mono">{sequence.length}</strong></span>
        <span className={cn(engine.lives <= 1 && 'text-danger font-bold')}>
          ❤️ {engine.lives}
        </span>
      </div>

      {/* Phase indicator */}
      <div className="text-center">
        {phase === 'showing' && (
          <motion.p
            key="watch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-semibold text-sky-400"
          >
            👀 Watch the sequence...
          </motion.p>
        )}
        {phase === 'input' && (
          <motion.p
            key="repeat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-semibold text-emerald-400"
          >
            🎯 Your turn! ({playerInput.length}/{sequence.length})
          </motion.p>
        )}
        {phase === 'feedback' && (
          <motion.p
            key="nice"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm font-bold text-success"
          >
            ✨ Perfect!
          </motion.p>
        )}
      </div>

      {/* Crystal grid */}
      <div
        className="grid gap-3 w-full max-w-xs mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {crystals.map((emoji, idx) => {
          const isActive = activeIdx === idx;
          const isFlash = flashIdx === idx;

          return (
            <motion.button
              key={idx}
              onClick={() => handleCrystalTap(idx)}
              disabled={phase !== 'input' || engine.state !== 'playing'}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'aspect-square rounded-2xl flex items-center justify-center text-3xl',
                'transition-all duration-200 select-none border-2 cursor-pointer touch-manipulation',
                isActive
                  ? 'bg-sky-400/50 border-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.5)] scale-110'
                  : isFlash && flashType === 'correct'
                    ? 'bg-emerald-400/40 border-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                    : isFlash && flashType === 'wrong'
                      ? 'bg-red-400/40 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : phase === 'input'
                        ? 'bg-sky-900/30 border-sky-700/30 hover:bg-sky-800/40 hover:border-sky-500/40 cursor-pointer'
                        : 'bg-sky-900/20 border-sky-800/20',
              )}
            >
              <span className={cn(
                'transition-transform duration-200',
                isActive && 'scale-125',
              )}>
                {emoji}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
