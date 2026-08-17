'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Check, X, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Operator = '+' | '-' | '×' | '÷';

interface Problem {
  display: string;
  answer: number;
}

/**
 * Seeded random number generator for reproducible problems.
 * Both players get the same sequence of problems from the same seed.
 */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createProblem(rng: () => number, maxNum: number): Problem {
  const ops: Operator[] = ['+', '-', '×'];
  const operator = ops[Math.floor(rng() * ops.length)];
  let a: number, b: number, answer: number;

  switch (operator) {
    case '+':
      a = Math.floor(rng() * maxNum) + 1;
      b = Math.floor(rng() * maxNum) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(rng() * maxNum) + 2;
      b = Math.floor(rng() * (a - 1)) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(rng() * Math.min(maxNum, 12)) + 1;
      b = Math.floor(rng() * 12) + 1;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return { display: `${a} ${operator} ${b}`, answer };
}

interface BattleGameProps {
  seed: number;
  durationSec: number;
  opponentName: string;
  opponentScore: number;
  opponentCorrect: number;
  onScoreUpdate: (score: number, correct: number, wrong: number) => void;
  onTimeUp: (finalScore: number, correct: number, wrong: number) => void;
}

export function BattleGame({
  seed,
  durationSec,
  opponentName,
  opponentScore,
  opponentCorrect,
  onScoreUpdate,
  onTimeUp,
}: BattleGameProps) {
  const rngRef = useRef(seededRandom(seed));
  const [problem, setProblem] = useState<Problem>(() => createProblem(rngRef.current, 30));
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [problemCount, setProblemCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasEndedRef = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  // Store callbacks in refs so the timer never restarts when parent re-renders
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const onScoreUpdateRef = useRef(onScoreUpdate);
  onScoreUpdateRef.current = onScoreUpdate;

  // Timer countdown — runs once, never restarts
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            onTimeUpRef.current(scoreRef.current, correctRef.current, wrongRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const nextProblem = useCallback(() => {
    setProblem(createProblem(rngRef.current, 30));
    setUserAnswer('');
    setFeedback(null);
    setProblemCount((prev) => prev + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (hasEndedRef.current || timeLeft <= 0) return;
      if (userAnswer.trim() === '') return;

      const parsed = parseInt(userAnswer, 10);

      if (parsed === problem.answer) {
        const points = 10;
        const newScore = score + points;
        const newCorrect = correctCount + 1;
        setScore(newScore);
        setCorrectCount(newCorrect);
        scoreRef.current = newScore;
        correctRef.current = newCorrect;
        setFeedback('correct');
        onScoreUpdateRef.current(newScore, newCorrect, wrongCount);
        setTimeout(nextProblem, 200);
      } else {
        const newWrong = wrongCount + 1;
        setWrongCount(newWrong);
        wrongRef.current = newWrong;
        setFeedback('wrong');
        onScoreUpdateRef.current(score, correctCount, newWrong);
        setTimeout(() => {
          setFeedback(null);
          setUserAnswer('');
          inputRef.current?.focus();
        }, 400);
      }
    },
    [userAnswer, problem, score, correctCount, wrongCount, timeLeft, nextProblem],
  );

  const timerColor = timeLeft <= 10 ? 'text-danger' : timeLeft <= 30 ? 'text-warning' : 'text-text-secondary';
  const timerPct = (timeLeft / durationSec) * 100;

  return (
    <div className="flex-1 flex flex-col px-4 py-3 min-h-0">
      {/* ── Top Bar: Timer + Scores ── */}
      <div className="flex items-center justify-between mb-3">
        {/* Your score */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm">🧠</span>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">You</p>
            <p className="text-lg font-bold text-primary font-mono">{score}</p>
          </div>
        </div>

        {/* Timer */}
        <motion.div
          className={cn('flex flex-col items-center', timerColor)}
          animate={timeLeft <= 10 ? { scale: [1, 1.05, 1] } : {}}
          transition={timeLeft <= 10 ? { duration: 0.5, repeat: Infinity } : {}}
        >
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xl font-bold font-mono">{timeLeft}</span>
          </div>
          <div className="w-20 h-1 rounded-full bg-card-hover mt-1 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                timeLeft <= 10 ? 'bg-danger' : timeLeft <= 30 ? 'bg-warning' : 'bg-primary',
              )}
              style={{ width: `${timerPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Opponent score */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-text-tertiary truncate max-w-[60px]">{opponentName}</p>
            <p className="text-lg font-bold text-danger font-mono">{opponentScore}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-danger/10 flex items-center justify-center">
            <span className="text-sm">⚔️</span>
          </div>
        </div>
      </div>

      {/* Score comparison bar */}
      <div className="flex items-center gap-1 mb-4">
        <div
          className="h-1.5 rounded-l-full bg-primary transition-all duration-500"
          style={{ flex: Math.max(score, 1) }}
        />
        <div
          className="h-1.5 rounded-r-full bg-danger/60 transition-all duration-500"
          style={{ flex: Math.max(opponentScore, 1) }}
        />
      </div>

      {/* ── Problem Area ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-success" />
            {correctCount}
          </span>
          <span className="flex items-center gap-1">
            <X className="h-3 w-3 text-danger" />
            {wrongCount}
          </span>
          <span>#{problemCount + 1}</span>
        </div>

        {/* Problem display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={problem.display}
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative px-8 py-6 rounded-2xl border-2 shadow-md',
              feedback === 'correct'
                ? 'bg-success/10 border-success/30'
                : feedback === 'wrong'
                  ? 'bg-danger/10 border-danger/30'
                  : 'bg-surface border-border',
            )}
          >
            <p className="text-3xl font-bold text-text-primary tracking-wider text-center font-mono">
              {problem.display} = ?
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-xs">
          <div className="relative">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Your answer..."
              disabled={timeLeft <= 0}
              className={cn(
                'w-full h-14 px-4 text-center text-xl font-bold rounded-xl',
                'bg-card border-2 border-border text-text-primary',
                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                'placeholder:text-text-disabled',
                'transition-all duration-200',
                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              )}
              autoComplete="off"
            />
            {userAnswer && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-colors"
              >
                <Check className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
