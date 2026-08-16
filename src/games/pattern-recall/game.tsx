'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

type Phase = 'showing' | 'input' | 'feedback';

export default function PatternRecallGame({ engine }: GameComponentProps) {
  const gridSize = (engine.difficultyConfig.gridSize as number) ?? 9;
  const startLength = (engine.difficultyConfig.itemCount as number) ?? 3;
  const showTimeMsPerTile = (engine.difficultyConfig.showTimeMsPerTile as number) ?? 600;
  const cols = gridSize <= 9 ? 3 : gridSize <= 16 ? 4 : 5;

  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('showing');
  const [round, setRound] = useState(1);
  const [feedbackTile, setFeedbackTile] = useState<{ id: number; correct: boolean } | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  // Keep ref to current sequence for use inside callbacks (avoids stale closures)
  const sequenceRef = useRef<number[]>([]);

  // Generate new sequence — never repeats exact sequence from last round
  const lastSequenceRef = useRef<string>('');

  const generateSequence = useCallback(
    (length: number) => {
      let attempts = 0;
      let seq: number[];

      do {
        seq = [];
        for (let i = 0; i < length; i++) {
          let next: number;
          do {
            next = Math.floor(Math.random() * gridSize);
          } while (seq.length > 0 && seq[seq.length - 1] === next);
          seq.push(next);
        }
        attempts++;
      } while (seq.join(',') === lastSequenceRef.current && attempts < 10);

      lastSequenceRef.current = seq.join(',');
      return seq;
    },
    [gridSize],
  );

  // Start a new round
  const startRound = useCallback(
    (roundNum: number) => {
      const seqLength = startLength + roundNum - 1;
      const newSeq = generateSequence(seqLength);
      sequenceRef.current = newSeq;
      setSequence(newSeq);
      setPlayerInput([]);
      setPhase('showing');
      setFeedbackTile(null);

      engine.setRound(roundNum);

      // Show sequence one by one
      showTimeoutRef.current.forEach(clearTimeout);
      showTimeoutRef.current = [];

      // Brief pause before showing
      const startDelay = 500;
      newSeq.forEach((tileId, i) => {
        const showTimeout = setTimeout(() => {
          setActiveTile(tileId);
        }, startDelay + i * showTimeMsPerTile);

        const hideTimeout = setTimeout(() => {
          setActiveTile(null);
        }, startDelay + i * showTimeMsPerTile + showTimeMsPerTile * 0.67);

        showTimeoutRef.current.push(showTimeout, hideTimeout);
      });

      // After showing all, switch to input phase
      const inputTimeout = setTimeout(
        () => setPhase('input'),
        startDelay + newSeq.length * showTimeMsPerTile + 200,
      );
      showTimeoutRef.current.push(inputTimeout);
    },
    [engine, generateSequence, startLength, showTimeMsPerTile],
  );

  // Start first round on mount — fixed dep: [engine.state] not [engine.state === 'playing']
  useEffect(() => {
    if (engine.state === 'playing') {
      queueMicrotask(() => startRound(1));
    }
    return () => {
      showTimeoutRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Handle tile tap during input phase
  const handleTileTap = useCallback(
    (tileId: number) => {
      if (phase !== 'input' || engine.state !== 'playing') return;

      const nextIndex = playerInput.length;
      const expected = sequenceRef.current[nextIndex];

      if (tileId === expected) {
        // Correct tap
        const newInput = [...playerInput, tileId];
        setPlayerInput(newInput);
        setFeedbackTile({ id: tileId, correct: true });
        setTimeout(() => setFeedbackTile(null), 200);

        if (newInput.length === sequenceRef.current.length) {
          // Round complete!
          const pointsPerRound = Math.floor(50 + round * 10);
          engine.recordCorrect(pointsPerRound);

          setPhase('feedback');
          const nextRound = round + 1;
          setRound(nextRound);

          setTimeout(() => startRound(nextRound), 800);
        }
      } else {
        // Wrong tap — recordWrong handles fail automatically when lives reach 0
        setFeedbackTile({ id: tileId, correct: false });
        engine.recordWrong();

        setTimeout(() => {
          setFeedbackTile(null);
          // If lives remain, replay same round
          if (engine.lives > 0) {
            startRound(round);
          }
        }, 600);
      }
    },
    [phase, playerInput, engine, round, startRound],
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-5 min-h-0">
      {/* Round indicator */}
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">
          Round {round}
        </p>
        <p className="text-xs text-text-tertiary">
          {phase === 'showing'
            ? 'Watch the pattern...'
            : phase === 'input'
              ? `Tap ${sequenceRef.current.length - playerInput.length} more`
              : '✓ Correct!'}
        </p>
      </div>

      {/* Grid */}
      <div
        className="grid gap-2.5 w-full max-w-[300px] mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: gridSize }).map((_, tileId) => {
          const isActive = activeTile === tileId;
          const isPlayerTapped = playerInput.includes(tileId);
          const isFeedback = feedbackTile?.id === tileId;

          return (
            <motion.button
              key={tileId}
              onClick={() => handleTileTap(tileId)}
              disabled={phase !== 'input' || isPlayerTapped}
              className={cn(
                'aspect-square rounded-xl border-2 transition-colors select-none cursor-pointer touch-manipulation',
                'flex items-center justify-center',
                isActive
                  ? 'border-primary bg-primary shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  : isFeedback && feedbackTile?.correct
                    ? 'border-success bg-success-muted'
                    : isFeedback && !feedbackTile?.correct
                      ? 'border-danger bg-danger-muted'
                      : isPlayerTapped
                        ? 'border-primary/30 bg-primary-muted/50 opacity-50'
                        : 'border-border bg-card hover:bg-card-hover active:scale-95',
              )}
              animate={{
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ duration: 0.15 }}
            />
          );
        })}
      </div>

      {/* Progress dots showing sequence progress */}
      {phase === 'input' && (
        <div className="flex items-center gap-1.5">
          {sequenceRef.current.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i < playerInput.length
                  ? 'bg-primary'
                  : 'bg-card-hover',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
