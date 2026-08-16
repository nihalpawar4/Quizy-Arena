'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameComponentProps } from '@/engine/types';
import { cn } from '@/lib/utils';

interface Tile {
  value: number; // 0 = empty space
  row: number;
  col: number;
}

function createSolvablePuzzle(size: number): number[] {
  const total = size * size;
  const tiles = Array.from({ length: total }, (_, i) => i); // 0 = empty

  // Shuffle with guaranteed solvability
  // Start from solved state and make random valid moves
  const grid = [...tiles];
  let emptyIdx = 0; // Position of empty (0)

  const getRow = (idx: number) => Math.floor(idx / size);
  const getCol = (idx: number) => idx % size;

  const moves = size === 3 ? 100 : 200;
  for (let i = 0; i < moves; i++) {
    const emptyRow = getRow(emptyIdx);
    const emptyCol = getCol(emptyIdx);
    const neighbors: number[] = [];

    if (emptyRow > 0) neighbors.push(emptyIdx - size);
    if (emptyRow < size - 1) neighbors.push(emptyIdx + size);
    if (emptyCol > 0) neighbors.push(emptyIdx - 1);
    if (emptyCol < size - 1) neighbors.push(emptyIdx + 1);

    const swapIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
    [grid[emptyIdx], grid[swapIdx]] = [grid[swapIdx], grid[emptyIdx]];
    emptyIdx = swapIdx;
  }

  return grid;
}

function isSolved(grid: number[]): boolean {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== i) return false;
  }
  return true;
}

const ICE_EMOJIS = ['❄️', '🧊', '⛄', '🌨️', '🏔️', '🐧', '🦭', '🎿', '🌊', '💎', '⭐', '🔷', '🔹', '💠', '🧿'];

export default function IcePuzzleGame({ engine }: GameComponentProps) {
  const gridSizeTotal = (engine.difficultyConfig.gridSize as number) ?? 9;
  const size = Math.round(Math.sqrt(gridSizeTotal));

  const [grid, setGrid] = useState<number[]>(() => createSolvablePuzzle(size));
  const [moveCount, setMoveCount] = useState(0);
  const hasCompleted = useRef(false);

  // Check win condition
  useEffect(() => {
    if (engine.state === 'playing' && moveCount > 0 && isSolved(grid) && !hasCompleted.current) {
      hasCompleted.current = true;
      // Score based on moves — fewer moves = higher score
      const maxMoves = size * size * 10;
      const moveEfficiency = Math.max(0, 1 - moveCount / maxMoves);
      const score = Math.floor((engine.difficultyConfig.maxScore as number) * moveEfficiency);
      engine.addScore(score);
      engine.recordCorrect(0);
      setTimeout(() => engine.complete(), 600);
    }
  }, [grid, moveCount, engine, size]);

  const handleTileClick = useCallback(
    (idx: number) => {
      if (engine.state !== 'playing') return;
      if (hasCompleted.current) return;

      const emptyIdx = grid.indexOf(0);
      const tileRow = Math.floor(idx / size);
      const tileCol = idx % size;
      const emptyRow = Math.floor(emptyIdx / size);
      const emptyCol = emptyIdx % size;

      // Check adjacency
      const isAdjacent =
        (Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol) ||
        (Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow);

      if (!isAdjacent) return;

      // Swap
      const newGrid = [...grid];
      [newGrid[idx], newGrid[emptyIdx]] = [newGrid[emptyIdx], newGrid[idx]];
      setGrid(newGrid);
      setMoveCount((m) => m + 1);
    },
    [grid, engine, size],
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 min-h-0">
      <div className="flex items-center gap-4 text-sm text-text-secondary">
        <span>Moves: <strong className="text-text-primary font-mono">{moveCount}</strong></span>
      </div>

      <div
        className="grid gap-1.5 w-full max-w-xs mx-auto"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {grid.map((value, idx) => (
          <motion.button
            key={idx}
            onClick={() => handleTileClick(idx)}
            disabled={value === 0 || engine.state !== 'playing'}
            className={cn(
              'aspect-square rounded-xl text-lg font-bold transition-all select-none touch-manipulation',
              'flex items-center justify-center',
              value === 0
                ? 'bg-transparent'
                : 'bg-gradient-to-br from-sky-400/90 to-blue-500/90 text-white shadow-md border border-sky-300/30 cursor-pointer hover:from-sky-300/90 hover:to-blue-400/90 active:scale-95',
            )}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {value !== 0 && (
              <span className="text-2xl">{ICE_EMOJIS[value - 1] ?? value}</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
