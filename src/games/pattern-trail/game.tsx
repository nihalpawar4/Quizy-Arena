'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

/**
 * Pattern Trail — Color Sequence Game (Simon Says)
 *
 * A sequence of colored circles light up one by one.
 * Player must tap them back in the exact same order.
 * Higher levels = longer sequences, more colors, faster display.
 * Different from Pattern Recall (which is grid-based tile memory).
 */

const COLOR_PALETTE = [
  { id: 'red', bg: '#EF4444', activeBg: '#FCA5A5', ring: '#DC2626' },
  { id: 'blue', bg: '#3B82F6', activeBg: '#93C5FD', ring: '#2563EB' },
  { id: 'green', bg: '#22C55E', activeBg: '#86EFAC', ring: '#16A34A' },
  { id: 'yellow', bg: '#FACC15', activeBg: '#FDE68A', ring: '#EAB308' },
  { id: 'purple', bg: '#A855F7', activeBg: '#D8B4FE', ring: '#9333EA' },
  { id: 'cyan', bg: '#06B6D4', activeBg: '#67E8F9', ring: '#0891B2' },
  { id: 'orange', bg: '#F97316', activeBg: '#FDBA74', ring: '#EA580C' },
  { id: 'pink', bg: '#EC4899', activeBg: '#F9A8D4', ring: '#DB2777' },
];

type Phase = 'showing' | 'input' | 'feedback';

export default function PatternTrailGame({ engine }: GameComponentProps) {
  // itemCount = sequenceLength from level-generator (pattern-recall config)
  const seqFromConfig = (engine.difficultyConfig.itemCount as number) ?? 3;
  // Derive effective level from sequence scaling: starts at 3, increases ~0.5 per level
  const level = Math.min(10, Math.max(1, Math.round((seqFromConfig - 3) / 0.5) + 1));

  // Scaling: colors available, sequence length, display speed
  const colorCount = Math.min(4 + Math.floor((level - 1) * 0.5), 8);
  const baseSeqLen = Math.min(3 + Math.floor((level - 1) * 0.6), 12);
  const displayMs = Math.max(300, 700 - (level - 1) * 35);

  const colors = COLOR_PALETTE.slice(0, colorCount);

  const [phase, setPhase] = useState<Phase>('showing');
  const [sequence, setSequence] = useState<number[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [seqLen, setSeqLen] = useState(baseSeqLen);
  const [flashColor, setFlashColor] = useState<number | null>(null);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  // Use ref to always have latest sequence for replay callback
  const sequenceRef = useRef<number[]>([]);

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * colorCount));
    }
    return seq;
  }, [colorCount]);

  const showSequence = useCallback((seq: number[]) => {
    let i = 0;
    setActiveIdx(null);
    setPhase('showing');

    const showNext = () => {
      if (i < seq.length) {
        setActiveIdx(seq[i]);
        setTimeout(() => {
          setActiveIdx(null);
          i++;
          timeoutRef.current = setTimeout(showNext, displayMs * 0.3);
        }, displayMs);
      } else {
        setActiveIdx(null);
        setPhase('input');
      }
    };

    timeoutRef.current = setTimeout(showNext, 500);
  }, [displayMs]);

  const startRound = useCallback(() => {
    const seq = generateSequence(seqLen);
    sequenceRef.current = seq;
    setSequence(seq);
    setPlayerInput([]);
    setFlashColor(null);
    setFlashType(null);
    showSequence(seq);
  }, [generateSequence, seqLen, showSequence]);

  // Start first round
  useEffect(() => {
    if (engine.state === 'playing') {
      startRound();
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  const handleColorTap = useCallback((colorIdx: number) => {
    if (phase !== 'input' || engine.state !== 'playing') return;

    const inputPos = playerInput.length;
    const expected = sequence[inputPos];

    if (colorIdx === expected) {
      // Correct tap
      setFlashColor(colorIdx);
      setFlashType('correct');
      setTimeout(() => { setFlashColor(null); setFlashType(null); }, 200);

      const newInput = [...playerInput, colorIdx];
      setPlayerInput(newInput);

      if (newInput.length === sequence.length) {
        // Round complete!
        const speedBonus = Math.floor(Math.max(0, 5 - engine.timeElapsed % 10) * 2);
        const points = seqLen * 10 + speedBonus;
        engine.recordCorrect(points);

        setPhase('feedback');
        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          // Increase sequence length and start next round
          const nextSeqLen = seqLen + 1;
          setSeqLen(nextSeqLen);
          const seq = generateSequence(nextSeqLen);
          sequenceRef.current = seq;
          setSequence(seq);
          setPlayerInput([]);
          setFlashColor(null);
          setFlashType(null);
          showSequence(seq);
        }, 800);
      }
    } else {
      // Wrong tap
      setFlashColor(colorIdx);
      setFlashType('wrong');
      // recordWrong handles life deduction + fail when lives reach 0
      engine.recordWrong();

      setTimeout(() => {
        setFlashColor(null);
        setFlashType(null);

        if (engine.lives <= 1) {
          // Engine's recordWrong has already scheduled a fail — just let it happen
          // Call engine.fail() only if lives are already 0 to ensure it fires
          engine.fail();
        } else {
          // Retry same sequence
          setPlayerInput([]);
          showSequence(sequenceRef.current);
        }
      }, 500);
    }
  }, [phase, engine, playerInput, sequence, seqLen, round, generateSequence, showSequence]);

  if (engine.state !== 'playing') return null;

  const timerPercent = Math.max(0, (seqLen / (baseSeqLen + 10)) * 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-5 min-h-0">
      {/* Status */}
      <div className="text-center">
        <p className="text-xs text-text-tertiary mb-1">Round {round + 1}</p>
        <p className="text-sm font-semibold text-text-secondary">
          {phase === 'showing' && 'Watch the pattern...'}
          {phase === 'input' && `Tap ${sequence.length - playerInput.length} more`}
          {phase === 'feedback' && 'Perfect! ✨'}
        </p>
      </div>

      {/* Progress dots */}
      {phase === 'input' && (
        <div className="flex gap-1.5">
          {sequence.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i < playerInput.length ? 'bg-success' : 'bg-card-hover',
              )}
            />
          ))}
        </div>
      )}

      {/* Color buttons */}
      <div
        className="grid gap-3 w-full max-w-xs"
        style={{
          gridTemplateColumns: `repeat(${Math.min(colorCount, 4)}, 1fr)`,
        }}
      >
        {colors.map((color, idx) => {
          const isActive = activeIdx === idx;
          const isFlashing = flashColor === idx;

          return (
            <motion.button
              key={color.id}
              type="button"
              onClick={() => handleColorTap(idx)}
              disabled={phase !== 'input'}
              whileTap={phase === 'input' ? { scale: 0.88 } : undefined}
              className={cn(
                'aspect-square rounded-2xl transition-all cursor-pointer touch-manipulation',
                'border-2 shadow-sm',
                phase === 'input' && 'hover:shadow-md active:shadow-inner',
              )}
              style={{
                backgroundColor: isActive || isFlashing
                  ? color.activeBg
                  : color.bg,
                borderColor: isActive || isFlashing
                  ? color.ring
                  : `${color.bg}80`,
                boxShadow: isActive
                  ? `0 0 20px ${color.bg}60, 0 0 40px ${color.bg}30`
                  : isFlashing && flashType === 'correct'
                    ? `0 0 15px ${color.bg}50`
                    : isFlashing && flashType === 'wrong'
                      ? '0 0 15px rgba(239,68,68,0.5)'
                      : undefined,
                opacity: phase === 'showing' && !isActive ? 0.5 : 1,
              }}
            />
          );
        })}
      </div>

      <p className="text-xs text-text-tertiary">
        Sequence length: {seqLen}
      </p>
    </div>
  );
}
