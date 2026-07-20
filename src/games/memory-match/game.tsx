'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { GameGrid } from '@/engine/primitives/game-grid';
import { cn } from '@/lib/utils';

// Colored symbol pairs for memory cards (no emojis)
const CARD_SYMBOLS = [
  { id: 'A', color: '#3B82F6' },
  { id: 'B', color: '#22C55E' },
  { id: 'C', color: '#FACC15' },
  { id: 'D', color: '#EF4444' },
  { id: 'E', color: '#8B5CF6' },
  { id: 'F', color: '#F97316' },
  { id: 'G', color: '#06B6D4' },
  { id: 'H', color: '#EC4899' },
  { id: 'I', color: '#14B8A6' },
  { id: 'J', color: '#6366F1' },
  { id: 'K', color: '#84CC16' },
  { id: 'L', color: '#A855F7' },
  { id: 'M', color: '#0EA5E9' },
  { id: 'N', color: '#F43F5E' },
  { id: 'O', color: '#10B981' },
  { id: 'P', color: '#EAB308' },
  { id: 'Q', color: '#64748B' },
  { id: 'R', color: '#7C3AED' },
  { id: 'S', color: '#2563EB' },
  { id: 'T', color: '#059669' },
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
  const [matchedCount, setMatchedCount] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(true);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preview: show all cards face-up briefly at start
  useEffect(() => {
    if (engine.state === 'playing' && isPreviewing) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state === 'playing']);

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
        setMatchedCount((prev) => prev + 1);

        // Score based on time bonus
        const pointsPerMatch = Math.floor(
          (engine.difficultyConfig.maxScore as number) / pairCount,
        );
        engine.recordCorrect(pointsPerMatch);

        // Check for game completion
        if (matchedCount + 1 >= pairCount) {
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

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (isPreviewing) return;
      if (isChecking) return;
      if (flippedIds.length >= 2) return;
      if (engine.state !== 'playing') return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return;

      // Flip the card
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
    <div className="flex-1 flex items-center justify-center p-4">
      <GameGrid cols={cols} gap={totalCards > 24 ? 6 : 10}>
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched || isChecking || isPreviewing}
            className={cn(
              'relative aspect-square w-full rounded-xl border-2 transition-colors select-none cursor-pointer',
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

            {/* Front face (symbol) */}
            <span
              className={cn(
                'absolute text-lg font-bold',
                !(card.isFlipped || card.isMatched) && 'opacity-0',
              )}
              style={{ transform: 'rotateY(180deg)', color: card.color }}
            >
              {card.symbolId}
            </span>
          </motion.button>
        ))}
      </GameGrid>
    </div>
  );
}
