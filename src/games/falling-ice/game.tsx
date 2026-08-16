'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

type Operator = '+' | '-' | '×';

interface IceBlock {
  id: number;
  question: string;
  answer: number;
  options: number[];
  y: number;       // 0–100 percentage from top
  x: number;       // horizontal position percentage
  spawnedAt: number;
}

function generateMathProblem(
  maxNum: number,
  operatorCount: number,
): { question: string; answer: number } {
  const allOps: Operator[] = ['+', '-', '×'];
  const ops = allOps.slice(0, operatorCount);
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * maxNum) + 2;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return { question: `${a} ${op} ${b}`, answer };
}

function generateOptions(answer: number): number[] {
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) + 1;
    const wrong = answer + (Math.random() > 0.5 ? offset : -offset);
    if (wrong !== answer && wrong >= 0) {
      options.add(wrong);
    }
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
}

const FALL_DURATION_MS = 8000; // 8 seconds — slow enough to read and tap

export default function FallingIceGame({ engine }: GameComponentProps) {
  const maxNum = (engine.difficultyConfig.itemCount as number) ?? 15;
  const speed = (engine.difficultyConfig.speed as number) ?? 1;
  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;
  const operatorCount = maxNum > 30 ? 3 : 2;

  const [blocks, setBlocks] = useState<IceBlock[]>([]);
  const [solvedCount, setSolvedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const nextIdRef = useRef(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const hasEndedRef = useRef(false);
  const pendingMissesRef = useRef(0);
  const solvedCountRef = useRef(0);
  const missedCountRef = useRef(0);
  const totalTargets = Math.floor(maxScore / 40);

  // Slower fall speed so players can actually read and tap
  const effectiveFallMs = FALL_DURATION_MS / speed;

  // Spawn blocks periodically — only 1 block at a time on screen
  useEffect(() => {
    if (engine.state !== 'playing') return;

    // Spawn interval: give enough time between blocks for the player to answer
    const spawnInterval = Math.max(2500, effectiveFallMs * 0.45);

    const spawnBlock = () => {
      if (hasEndedRef.current) return;
      if (solvedCountRef.current + missedCountRef.current >= totalTargets) return;

      const { question, answer } = generateMathProblem(maxNum, operatorCount);
      const options = generateOptions(answer);

      const block: IceBlock = {
        id: nextIdRef.current++,
        question,
        answer,
        options,
        y: -5,
        // Keep x between 20–50% so the block (which is centered) stays fully on screen
        x: 50,
        spawnedAt: Date.now(),
      };

      setBlocks((prev) => [...prev, block]);
    };

    spawnBlock();
    spawnTimerRef.current = setInterval(spawnBlock, spawnInterval);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Animate blocks falling
  useEffect(() => {
    if (engine.state !== 'playing') return;

    const animate = () => {
      const now = Date.now();
      let newMissesThisFrame = 0;

      setBlocks((prev) => {
        const updated: IceBlock[] = [];

        for (const block of prev) {
          const elapsed = now - block.spawnedAt;
          const progress = elapsed / effectiveFallMs;
          // Cap at 85% so block stays visible before being removed
          const newY = Math.min(progress * 85, 85);

          if (progress >= 1) {
            // Block hit the ground — count as miss
            newMissesThisFrame++;
          } else {
            updated.push({ ...block, y: newY });
          }
        }

        return updated;
      });

      if (newMissesThisFrame > 0) {
        pendingMissesRef.current += newMissesThisFrame;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Drain pending misses from rAF
  useEffect(() => {
    if (engine.state !== 'playing') return;
    const interval = setInterval(() => {
      const pending = pendingMissesRef.current;
      if (pending > 0) {
        pendingMissesRef.current = 0;
        missedCountRef.current += pending;
        setMissedCount(missedCountRef.current);
        for (let i = 0; i < pending; i++) {
          engine.recordWrong();
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [engine]);

  // Check completion
  useEffect(() => {
    if (hasEndedRef.current) return;

    if (solvedCount + missedCount >= totalTargets) {
      hasEndedRef.current = true;
      setTimeout(() => engine.complete(), 500);
    }
  }, [solvedCount, missedCount, totalTargets, engine]);

  const handleAnswer = useCallback(
    (blockId: number, selectedAnswer: number) => {
      if (engine.state !== 'playing') return;

      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      if (selectedAnswer === block.answer) {
        const heightBonus = Math.max(0, 1 - block.y / 85);
        const basePoints = Math.floor(maxScore / totalTargets);
        const points = Math.floor(basePoints * (0.5 + heightBonus * 0.5));
        engine.recordCorrect(points);
        solvedCountRef.current += 1;
        setSolvedCount(solvedCountRef.current);
      } else {
        engine.recordWrong();
      }

      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    },
    [engine, blocks, maxScore, totalTargets],
  );

  return (
    <div className="flex-1 h-full relative overflow-hidden min-h-0">
      {/* Stats bar */}
      <div className="absolute top-2 left-0 right-0 z-10 flex items-center justify-center gap-6 text-sm text-text-secondary">
        <span>✅ {solvedCount}/{totalTargets}</span>
        <span className={cn(engine.lives <= 1 && 'text-danger font-bold')}>
          ❤️ {engine.lives}
        </span>
      </div>

      {/* Ground indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-300/50 via-blue-400/50 to-sky-300/50" />

      {/* Falling blocks — centered, full width, large tap targets */}
      <AnimatePresence>
        {blocks.map((block) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ duration: 0.25 }}
            className="absolute left-1/2 -translate-x-1/2 w-[88%] max-w-xs"
            style={{
              top: `${block.y}%`,
            }}
          >
            <div className="bg-gradient-to-br from-sky-400/90 to-blue-600/90 rounded-2xl p-4 shadow-lg border border-sky-300/40 backdrop-blur-sm">
              {/* Question */}
              <p className="text-center text-white font-bold text-2xl font-mono mb-3">
                {block.question} = ?
              </p>

              {/* Answer options — large tap targets */}
              <div className="grid grid-cols-2 gap-2">
                {block.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(block.id, opt)}
                    className="py-3 px-3 rounded-xl bg-white/20 hover:bg-white/40 active:bg-white/50 active:scale-95 text-white font-bold text-base transition-all cursor-pointer border border-white/10 touch-manipulation"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Snowflake decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/20 text-lg select-none"
            style={{
              left: `${10 + i * 12}%`,
              top: '-20px',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.sin(i) * 20],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'linear',
            }}
          >
            ❄️
          </motion.div>
        ))}
      </div>
    </div>
  );
}
