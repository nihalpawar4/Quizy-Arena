'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

interface Riddle {
  question: string;
  options: string[];
  correctIndex: number;
}

// Pool of logic riddles (shuffled per game)
const RIDDLE_POOL: Riddle[] = [
  { question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', options: ['Shadow', 'Echo', 'Dream', 'Cloud'], correctIndex: 1 },
  { question: 'If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?', options: ['100 minutes', '5 minutes', '20 minutes', '50 minutes'], correctIndex: 1 },
  { question: 'What has keys but no locks, space but no room, and you can enter but can\'t go inside?', options: ['A map', 'A keyboard', 'A safe', 'A house'], correctIndex: 1 },
  { question: 'A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left?', options: ['8', '17', '9', '0'], correctIndex: 2 },
  { question: 'What comes once in a minute, twice in a moment, but never in a thousand years?', options: ['Time', 'The letter M', 'Luck', 'A second'], correctIndex: 1 },
  { question: 'If you have me, you want to share me. If you share me, you don\'t have me. What am I?', options: ['Love', 'Money', 'A secret', 'Knowledge'], correctIndex: 2 },
  { question: 'Tom\'s father has 3 sons: Snap, Crackle, and ___?', options: ['Pop', 'Tom', 'Bob', 'Jim'], correctIndex: 1 },
  { question: 'How many months have 28 days?', options: ['1', '2', 'All 12', '6'], correctIndex: 2 },
  { question: 'What gets wetter the more it dries?', options: ['Sand', 'A sponge', 'A towel', 'The sun'], correctIndex: 2 },
  { question: 'A bat and a ball cost $1.10. The bat costs $1.00 more than the ball. How much does the ball cost?', options: ['$0.10', '$0.05', '$0.15', '$0.01'], correctIndex: 1 },
  { question: 'If two\'s company and three\'s a crowd, what are four and five?', options: ['More crowded', 'Nine', 'A party', 'Too many'], correctIndex: 1 },
  { question: 'What has a head and a tail but no body?', options: ['A snake', 'A coin', 'A pin', 'A worm'], correctIndex: 1 },
  { question: 'I am not alive, but I grow. I don\'t have lungs, but I need air. What am I?', options: ['A tree', 'Fire', 'Moss', 'A balloon'], correctIndex: 1 },
  { question: 'What can travel around the world while staying in a corner?', options: ['A wheel', 'A stamp', 'A map', 'A compass'], correctIndex: 1 },
  { question: 'Forward I am heavy, but backward I am not. What am I?', options: ['A car', 'A boat', 'The word TON', 'An anchor'], correctIndex: 2 },
  { question: 'What has many teeth but cannot bite?', options: ['A comb', 'A saw', 'A zipper', 'A gear'], correctIndex: 0 },
  { question: 'I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?', options: ['A painting', 'A map', 'A dream', 'A globe'], correctIndex: 1 },
  { question: 'What can fill a room but takes up no space?', options: ['Air', 'Light', 'Sound', 'Darkness'], correctIndex: 1 },
  { question: 'The more you take, the more you leave behind. What are they?', options: ['Memories', 'Steps', 'Footprints', 'Breaths'], correctIndex: 2 },
  { question: 'What invention lets you look right through a wall?', options: ['X-ray', 'A window', 'A mirror', 'A telescope'], correctIndex: 1 },
];

function getShuffledRiddles(count: number): Riddle[] {
  const pool = [...RIDDLE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export default function DesertRiddleGame({ engine }: GameComponentProps) {
  const totalRiddles = (engine.difficultyConfig.roundCount as number) ?? 5;
  const maxScore = (engine.difficultyConfig.maxScore as number) ?? 600;

  const [riddles] = useState(() => getShuffledRiddles(totalRiddles));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const roundStartRef = useRef(Date.now());

  const currentRiddle = riddles[currentIndex];

  useEffect(() => {
    engine.setRound(currentIndex + 1, totalRiddles);
  }, [currentIndex, totalRiddles, engine]);

  useEffect(() => {
    if (engine.state === 'playing') {
      roundStartRef.current = Date.now();
    }
  }, [currentIndex, engine.state]);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (engine.state !== 'playing' || showResult) return;

      setSelectedAnswer(answerIndex);
      setShowResult(true);

      const isCorrect = answerIndex === currentRiddle.correctIndex;
      const timeTaken = (Date.now() - roundStartRef.current) / 1000;

      if (isCorrect) {
        // Points based on speed (max 3 points per second deduction from full score)
        const pointsPerRiddle = Math.floor(maxScore / totalRiddles);
        const speedBonus = Math.max(0.5, 1 - timeTaken / 30);
        const points = Math.floor(pointsPerRiddle * speedBonus);
        engine.recordCorrect(points);
      } else {
        engine.recordWrong();
      }

      // Move to next riddle after delay
      setTimeout(() => {
        setSelectedAnswer(null);
        setShowResult(false);

        if (currentIndex + 1 >= riddles.length) {
          engine.complete();
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }, 1200);
    },
    [engine, showResult, currentRiddle, currentIndex, riddles.length, maxScore, totalRiddles],
  );

  if (!currentRiddle) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Loading riddles...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-5 min-h-0">
      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {riddles.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i < currentIndex ? 'bg-success' : i === currentIndex ? 'bg-amber-400' : 'bg-card-hover',
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Riddle card */}
          <div className="rounded-2xl bg-surface border border-border shadow-sm p-6 mb-6">
            <div className="text-center mb-2">
              <span className="text-3xl">🏜️</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed text-center font-medium">
              {currentRiddle.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentRiddle.options.map((option, i) => {
              let variant = 'default';
              if (showResult) {
                if (i === currentRiddle.correctIndex) variant = 'correct';
                else if (i === selectedAnswer) variant = 'wrong';
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'w-full px-5 py-3.5 rounded-xl text-sm font-medium text-left transition-all cursor-pointer touch-manipulation',
                    'border-2 flex items-center gap-3',
                    variant === 'correct' && 'bg-green-500/15 border-green-500/50 text-green-600',
                    variant === 'wrong' && 'bg-red-500/15 border-red-500/50 text-red-500',
                    variant === 'default' && 'bg-surface border-border text-text-primary hover:bg-card-hover hover:border-primary/30',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center',
                      variant === 'correct' ? 'bg-green-500/20 text-green-600' :
                      variant === 'wrong' ? 'bg-red-500/20 text-red-500' :
                      'bg-amber-500/10 text-amber-600',
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
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
