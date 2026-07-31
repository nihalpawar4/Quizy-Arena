'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

/**
 * Memory Grove — Word Memory Game
 *
 * Phase 1 (Study): Show a list of words for a few seconds
 * Phase 2 (Recall): Show a mixed list — player taps words they remember
 * Higher levels = more words, more distractors, less study time
 */

const WORD_POOLS = [
  // Nature
  ['oak', 'pine', 'fern', 'moss', 'ivy', 'lily', 'rose', 'vine', 'leaf', 'bark',
   'root', 'seed', 'stem', 'bud', 'twig', 'pond', 'brook', 'cliff', 'cave', 'hill'],
  // Animals
  ['fox', 'owl', 'deer', 'bear', 'wolf', 'hawk', 'swan', 'crow', 'hare', 'frog',
   'toad', 'newt', 'moth', 'wasp', 'wren', 'dove', 'lynx', 'elk', 'eel', 'cub'],
  // Weather / Sky
  ['rain', 'snow', 'hail', 'mist', 'fog', 'dew', 'wind', 'gust', 'bolt', 'glow',
   'star', 'moon', 'dawn', 'dusk', 'haze', 'beam', 'ray', 'arc', 'sky', 'cloud'],
  // Objects
  ['bell', 'drum', 'lamp', 'flag', 'ring', 'coin', 'gem', 'key', 'lock', 'map',
   'rope', 'mask', 'wand', 'orb', 'rune', 'axe', 'bow', 'helm', 'cape', 'crown'],
];

function getWordsForLevel(level: number): { studyWords: string[]; allWords: string[]; studyTimeSec: number } {
  const studyCount = Math.min(3 + Math.floor((level - 1) * 0.8), 12);
  const distractorCount = Math.min(3 + Math.floor((level - 1) * 1.2), 16);
  const studyTimeSec = Math.max(2, Math.round(5 - (level - 1) * 0.25));

  // Pick from random pools
  const allAvailable = WORD_POOLS.flat();
  const shuffled = [...allAvailable].sort(() => Math.random() - 0.5);

  const studyWords = shuffled.slice(0, studyCount);
  const distractors = shuffled.slice(studyCount, studyCount + distractorCount);
  const allWords = [...studyWords, ...distractors].sort(() => Math.random() - 0.5);

  return { studyWords, allWords, studyTimeSec };
}

type Phase = 'study' | 'recall' | 'feedback';

export default function MemoryGroveGame({ engine }: GameComponentProps) {
  // itemCount = pairCount from level-generator (memory-match config)
  const itemCount = (engine.difficultyConfig.itemCount as number) ?? 6;
  // Derive effective level from itemCount scaling: starts at 6, increases ~0.6 per level
  const level = Math.min(10, Math.max(1, Math.round((itemCount - 6) / 0.6) + 1));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('study');
  const [studyWords, setStudyWords] = useState<string[]>([]);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [studyTimeSec, setStudyTimeSec] = useState(5);
  const [countdown, setCountdown] = useState(5);
  const [roundResults, setRoundResults] = useState<Record<string, 'correct' | 'wrong' | 'missed'>>({});
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const maxRounds = Math.min(3 + Math.floor((level - 1) * 0.5), 8);

  const startNewRound = useCallback(() => {
    const config = getWordsForLevel(level);
    setStudyWords(config.studyWords);
    setAllWords(config.allWords);
    setStudyTimeSec(config.studyTimeSec);
    setCountdown(config.studyTimeSec);
    setSelectedWords(new Set());
    setRoundResults({});
    setPhase('study');
  }, [level]);

  // Initialize first round
  useEffect(() => {
    if (engine.state === 'playing') {
      startNewRound();
    }
  }, [engine.state, startNewRound]);

  // Study phase countdown
  useEffect(() => {
    if (phase !== 'study' || engine.state !== 'playing') return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('recall');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, engine.state]);

  const handleWordTap = useCallback((word: string) => {
    if (phase !== 'recall' || engine.state !== 'playing') return;

    setSelectedWords((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  }, [phase, engine.state]);

  const handleSubmit = useCallback(() => {
    if (phase !== 'recall') return;

    const results: Record<string, 'correct' | 'wrong' | 'missed'> = {};
    let correct = 0;
    let wrong = 0;

    // Check selected words
    for (const word of selectedWords) {
      if (studyWords.includes(word)) {
        results[word] = 'correct';
        correct++;
      } else {
        results[word] = 'wrong';
        wrong++;
      }
    }

    // Check missed words
    for (const word of studyWords) {
      if (!selectedWords.has(word)) {
        results[word] = 'missed';
      }
    }

    // Score: correct picks earn points, wrong picks lose points
    const pointsPerCorrect = Math.floor(20 + level * 2);
    const totalPoints = Math.max(0, correct * pointsPerCorrect - wrong * 5);

    for (let i = 0; i < correct; i++) {
      engine.recordCorrect(pointsPerCorrect);
    }
    for (let i = 0; i < wrong; i++) {
      engine.recordWrong();
    }

    setRoundResults(results);
    setPhase('feedback');

    // Auto-advance after feedback
    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= maxRounds) {
        engine.complete();
      } else {
        setRound(nextRound);
        startNewRound();
      }
    }, 1500);
  }, [phase, selectedWords, studyWords, engine, round, maxRounds, level, startNewRound]);

  if (engine.state !== 'playing') return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      {/* Round indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-text-tertiary">
          Round {round + 1} / {maxRounds}
        </span>
        {phase === 'study' && (
          <span className="text-xs font-bold text-primary animate-pulse">
            Memorize! {countdown}s
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── STUDY PHASE ── */}
        {phase === 'study' && (
          <motion.div
            key="study"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center w-full max-w-sm"
          >
            <p className="text-sm font-semibold text-primary mb-4">
              Remember these words
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {studyWords.map((word) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-2 rounded-xl bg-primary/15 text-primary font-semibold text-sm border border-primary/20"
                >
                  {word}
                </motion.span>
              ))}
            </div>

            {/* Timer bar */}
            <div className="mt-6 h-1.5 rounded-full bg-card-hover overflow-hidden max-w-xs mx-auto">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: studyTimeSec, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}

        {/* ── RECALL PHASE ── */}
        {phase === 'recall' && (
          <motion.div
            key="recall"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center w-full max-w-sm"
          >
            <p className="text-sm font-semibold text-text-secondary mb-1">
              Tap the words you saw
            </p>
            <p className="text-xs text-text-tertiary mb-4">
              {studyWords.length} words to find
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {allWords.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => handleWordTap(word)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer',
                    'border',
                    selectedWords.has(word)
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface text-text-primary border-border hover:border-primary/40',
                  )}
                >
                  {word}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="mt-6 px-8 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Submit ({selectedWords.size} / {studyWords.length})
            </button>
          </motion.div>
        )}

        {/* ── FEEDBACK PHASE ── */}
        {phase === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center w-full max-w-sm"
          >
            <div className="flex flex-wrap justify-center gap-2">
              {allWords.map((word) => {
                const result = roundResults[word];
                return (
                  <span
                    key={word}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium border',
                      result === 'correct' && 'bg-success/15 text-success border-success/30',
                      result === 'wrong' && 'bg-danger/15 text-danger border-danger/30',
                      result === 'missed' && 'bg-warning/15 text-warning border-warning/30 ring-2 ring-warning/20',
                      !result && 'bg-surface text-text-tertiary border-border opacity-50',
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
