'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { GameInput } from '@/engine/primitives/game-input';
import { cn } from '@/lib/utils';

type Operator = '+' | '-' | '×' | '÷';

interface Problem {
  display: string;
  answer: number;
}

/**
 * Generates a math problem algorithmically based on level config.
 * Higher levels unlock more operators and larger operands.
 * Never repeats identical problems within a session.
 */
function generateProblem(
  maxNum: number,
  operatorCount: number,
  maxSteps: number,
  usedProblems: Set<string>,
): Problem {
  const allOps: Operator[] = ['+', '-', '×', '÷'];
  const ops = allOps.slice(0, operatorCount);

  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const problem = createSingleProblem(maxNum, ops, maxSteps);
    const key = problem.display;
    if (!usedProblems.has(key)) {
      usedProblems.add(key);
      return problem;
    }
  }

  // Fallback: just return a new problem even if seen before
  return createSingleProblem(maxNum, ops, maxSteps);
}

function createSingleProblem(maxNum: number, ops: Operator[], steps: number): Problem {
  if (steps >= 2) {
    return createMultiStepProblem(maxNum, ops);
  }

  const operator = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  switch (operator) {
    case '+':
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * maxNum) + 2;
      b = Math.floor(Math.random() * (a - 1)) + 1; // Ensure positive result
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * Math.min(maxNum, 15)) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
    case '÷':
      // Generate a÷b where answer is integer
      b = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      a = b * answer;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return { display: `${a} ${operator} ${b}`, answer };
}

function createMultiStepProblem(maxNum: number, ops: Operator[]): Problem {
  // Generate: a OP1 b OP2 c (evaluated left to right for simplicity)
  const simpleOps: Operator[] = ops.filter((o) => o === '+' || o === '-');
  if (simpleOps.length === 0) simpleOps.push('+');

  const op1 = simpleOps[Math.floor(Math.random() * simpleOps.length)];
  const op2 = simpleOps[Math.floor(Math.random() * simpleOps.length)];

  const bound = Math.min(maxNum, 30);
  const a = Math.floor(Math.random() * bound) + 1;
  const b = Math.floor(Math.random() * bound) + 1;
  const c = Math.floor(Math.random() * bound) + 1;

  const step1 = op1 === '+' ? a + b : a - b;
  const answer = op2 === '+' ? step1 + c : step1 - c;

  return { display: `${a} ${op1} ${b} ${op2} ${c}`, answer };
}

export default function SpeedMathGame({ engine }: GameComponentProps) {
  const maxNum = (engine.difficultyConfig.itemCount as number) ?? 20;
  const operatorCount = (engine.difficultyConfig.operatorCount as number) ?? 2;
  const maxSteps = (engine.difficultyConfig.maxSteps as number) ?? 1;

  const usedProblemsRef = useRef(new Set<string>());

  const [problem, setProblem] = useState<Problem>(() => {
    const set = new Set<string>();
    return generateProblem(maxNum, operatorCount, maxSteps, set);
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [problemCount, setProblemCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextProblem = useCallback(() => {
    setProblem(generateProblem(maxNum, operatorCount, maxSteps, usedProblemsRef.current));
    setUserAnswer('');
    setFeedback(null);
    setProblemCount((prev) => prev + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [maxNum, operatorCount, maxSteps]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (engine.state !== 'playing') return;
      if (userAnswer.trim() === '') return;

      const parsed = parseInt(userAnswer, 10);

      if (parsed === problem.answer) {
        const speedBonus = Math.max(0, 10 - Math.floor(engine.timeElapsed % 5));
        const points = 10 + speedBonus;
        engine.recordCorrect(points);
        setFeedback('correct');
        setTimeout(nextProblem, 300);
      } else {
        engine.recordWrong();
        setFeedback('wrong');
        setTimeout(() => {
          setFeedback(null);
          setUserAnswer('');
          inputRef.current?.focus();
        }, 500);
      }
    },
    [userAnswer, problem.answer, engine, nextProblem],
  );

  // Auto-focus on mount
  useEffect(() => {
    if (engine.state === 'playing') {
      inputRef.current?.focus();
    }
  }, [engine.state]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      {/* Problem Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={problemCount}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="text-center"
        >
          <div className="font-mono text-5xl font-bold text-text-primary tracking-wider">
            {problem.display}
          </div>
          <p className="text-sm text-text-tertiary mt-2">
            = ?
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
        <GameInput
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9-]*"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          variant={feedback ?? 'default'}
          placeholder="?"
          autoFocusOnMount={false}
        />

        <button
          type="submit"
          className={cn(
            'px-8 py-3 rounded-lg font-semibold text-sm',
            'bg-primary text-white hover:bg-primary-hover',
            'transition-colors cursor-pointer',
            'min-w-[160px]',
          )}
        >
          Submit
        </button>
      </form>

      {/* Problem counter */}
      <p className="text-xs text-text-tertiary">
        Problem #{problemCount + 1}
      </p>
    </div>
  );
}
