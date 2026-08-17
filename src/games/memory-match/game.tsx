'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { GameGrid } from '@/engine/primitives/game-grid';
import { cn } from '@/lib/utils';

// Animal & nature emoji pairs for memory cards
const CARD_SYMBOLS = [
  { id: '🐶', color: '#F59E0B' },
  { id: '🐱', color: '#8B5CF6' },
  { id: '🦊', color: '#F97316' },
  { id: '🐻', color: '#92400E' },
  { id: '🐼', color: '#1F2937' },
  { id: '🐸', color: '#22C55E' },
  { id: '🦁', color: '#F59E0B' },
  { id: '🐵', color: '#A16207' },
  { id: '🐰', color: '#EC4899' },
  { id: '🦉', color: '#78716C' },
  { id: '🐝', color: '#EAB308' },
  { id: '🐢', color: '#16A34A' },
  { id: '🦋', color: '#3B82F6' },
  { id: '🐙', color: '#E11D48' },
  { id: '🐬', color: '#0EA5E9' },
  { id: '🦜', color: '#22C55E' },
  { id: '🦄', color: '#D946EF' },
  { id: '🐲', color: '#DC2626' },
  { id: '🐠', color: '#06B6D4' },
  { id: '🐘', color: '#6B7280' },
];

interface Card {
  id: number;
  symbolId: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function createDeck(pairCount: number): Card[] {
  const pool = [...CARD_SYMBOLS];
  const selected: typeof CARD_SYMBOLS = [];

  for (let i = 0; i < Math.min(pairCount, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
  }

  const cards: Card[] = [];
  selected.forEach((sym, i) => {
    cards.push({ id: i * 2, symbolId: sym.id, color: sym.color, isFlipped: false, isMatched: false });
    cards.push({ id: i * 2 + 1, symbolId: sym.id, color: sym.color, isFlipped: false, isMatched: false });
  });

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

export default function MemoryMatchGame({ engine }: GameComponentProps) {
  const pairCount = (engine.difficultyConfig.itemCount as number) ?? 6;
  const previewTimeSec = (engine.difficultyConfig.previewTimeSec as number) ?? 1.5;

  // Calculate grid columns based on total cards
  const totalCards = pairCount * 2;
  let cols: number;
  if (totalCards <= 12) cols = 3;       // 3×4
  else if (totalCards <= 16) cols = 4;  // 4×4
  else if (totalCards <= 20) cols = 4;  // 4×5
  else if (totalCards <= 24) cols = 4;  // 4×6
  else if (totalCards <= 30) cols = 5;  // 5×6
  else cols = 6;                        // 6×N

  const [cards, setCards] = useState<Card[]>(() => createDeck(pairCount));
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(true);
  // Use ref for matchedCount to avoid stale closure in the flippedIds effect
  const matchedCountRef = useRef(0);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preview: show all cards face-up briefly at start
  useEffect(() => {
    if (engine.state !== 'playing') return;
    if (!isPreviewing) return;

    // Show all cards face up
    queueMicrotask(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));
    });

    previewTimeoutRef.current = setTimeout(() => {
      // Hide all cards
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setIsPreviewing(false);
    }, previewTimeSec * 1000);

    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state]);

  // Check for match when 2 cards are flipped
  useEffect(() => {
    if (flippedIds.length !== 2) return;

    queueMicrotask(() => setIsChecking(true));
    const [first, second] = flippedIds;
    const card1 = cards.find((c) => c.id === first)!;
    const card2 = cards.find((c) => c.id === second)!;

    if (card1.symbolId === card2.symbolId) {
      // Match found
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === first || c.id === second
              ? { ...c, isMatched: true }
              : c,
          ),
        );
        setFlippedIds([]);
        setIsChecking(false);

        // Increment ref first, then check completion — avoids stale closure
        matchedCountRef.current += 1;
        const newMatchedCount = matchedCountRef.current;

        const pointsPerMatch = Math.floor(
          (engine.difficultyConfig.maxScore as number) / pairCount,
        );
        engine.recordCorrect(pointsPerMatch);

        if (newMatchedCount >= pairCount) {
          setTimeout(() => engine.complete(), 500);
        }
      }, 200);
    } else {
      // No match
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === first || c.id === second
              ? { ...c, isFlipped: false }
              : c,
          ),
        );
        setFlippedIds([]);
        setIsChecking(false);
        engine.recordWrong();
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIds]);

  // Safety net: complete the game when every card is matched, even if
  // matchedCountRef drifted due to timing / stale-closure issues.
  useEffect(() => {
    if (engine.state !== 'playing') return;
    if (isPreviewing) return;
    if (cards.length === 0) return;

    const allMatched = cards.every((c) => c.isMatched);
    if (allMatched) {
      // Ensure the ref is also up to date
      matchedCountRef.current = pairCount;
      setTimeout(() => engine.complete(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (isPreviewing) return;
      if (isChecking) return;
      if (flippedIds.length >= 2) return;
      if (engine.state !== 'playing') return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return;

      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, isFlipped: true } : c,
        ),
      );
      setFlippedIds((prev) => [...prev, cardId]);
    },
    [isPreviewing, isChecking, flippedIds, cards, engine.state],
  );

  return (
    <div className="flex-1 flex items-center justify-center p-3 min-h-0">
      <GameGrid cols={cols} gap={totalCards > 24 ? 6 : 10}>
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched || isChecking || isPreviewing}
            className={cn(
              'relative aspect-square w-full rounded-xl border-2 transition-colors select-none cursor-pointer touch-manipulation',
              'flex items-center justify-center',
              card.isMatched
                ? 'border-success/30 bg-success-muted/30 opacity-60'
                : card.isFlipped
                  ? 'border-primary/40 bg-primary-muted'
                  : 'border-border bg-card hover:bg-card-hover active:scale-95',
            )}
            animate={{
              rotateY: card.isFlipped || card.isMatched ? 180 : 0,
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Back face (question mark) */}
            <span
              className={cn(
                'absolute text-2xl text-text-disabled',
                (card.isFlipped || card.isMatched) && 'opacity-0',
              )}
            >
              ?
            </span>

            {/* Front face (emoji) */}
            <span
              className={cn(
                'absolute text-3xl',
                !(card.isFlipped || card.isMatched) && 'opacity-0',
              )}
              style={{ transform: 'rotateY(180deg)' }}
            >
              {card.symbolId}
            </span>
          </motion.button>
        ))}
      </GameGrid>
    </div>
  );
}
