'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameEngine } from '../types';

interface FeedbackFlashProps {
  engine: GameEngine;
}

/**
 * FeedbackFlash shows a brief green/red flash on correct/wrong answers.
 * Also shows a combo indicator when combo is active.
 */
export function FeedbackFlash({ engine }: FeedbackFlashProps) {
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [showCombo, setShowCombo] = useState(false);
  const prevCorrect = useRef(engine.correctAnswers);
  const prevWrong = useRef(engine.wrongAnswers);
  const prevCombo = useRef(engine.combo);

  useEffect(() => {
    // Detect correct answer
    if (engine.correctAnswers > prevCorrect.current) {
      setFlash('correct');
      const t = setTimeout(() => setFlash(null), 300);
      prevCorrect.current = engine.correctAnswers;
      return () => clearTimeout(t);
    }
    prevCorrect.current = engine.correctAnswers;
  }, [engine.correctAnswers]);

  useEffect(() => {
    // Detect wrong answer
    if (engine.wrongAnswers > prevWrong.current) {
      setFlash('wrong');
      const t = setTimeout(() => setFlash(null), 300);
      prevWrong.current = engine.wrongAnswers;
      return () => clearTimeout(t);
    }
    prevWrong.current = engine.wrongAnswers;
  }, [engine.wrongAnswers]);

  useEffect(() => {
    // Detect combo milestone (every 5)
    if (engine.combo > prevCombo.current && engine.combo >= 5 && engine.combo % 5 === 0) {
      setShowCombo(true);
      const t = setTimeout(() => setShowCombo(false), 1000);
      prevCombo.current = engine.combo;
      return () => clearTimeout(t);
    }
    prevCombo.current = engine.combo;
  }, [engine.combo]);

  return (
    <>
      {/* Screen Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-0 pointer-events-none z-40 ${
              flash === 'correct'
                ? 'bg-success/10'
                : 'bg-danger/10'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Combo Indicator */}
      <AnimatePresence>
        {showCombo && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.2, opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="px-4 py-2 rounded-full bg-warning text-bg font-bold text-lg shadow-lg">
              🔥 x{engine.combo} COMBO!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
