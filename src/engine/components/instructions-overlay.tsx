'use client';

import { ChevronRight } from 'lucide-react';
import type { GameDefinition, GameDifficulty } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameIcon } from '@/components/games/game-icon';
import { CoinIcon, DiamondIcon, LightningIcon } from '@/components/illustrations/icons';

interface InstructionsOverlayProps {
  definition: GameDefinition;
  difficulty: GameDifficulty;
  onStart?: () => void;
  onStartGame?: () => void;
}

/**
 * Instructions overlay shown before countdown.
 * Displays game name, category, difficulty, how-to-play, and start button.
 */
export function InstructionsOverlay({
  definition,
  difficulty,
}: InstructionsOverlayProps) {
  const diffConfig = definition.difficultyConfig[difficulty];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <GameIcon iconKey={definition.iconKey} color={definition.accentColor} size={56} className="mb-4" />

      {/* Title */}
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        {definition.title}
      </h1>
      <p className="text-sm text-text-secondary mb-4">
        {definition.description}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="primary">{definition.category}</Badge>
        <Badge variant={difficulty === 'hard' ? 'danger' : difficulty === 'medium' ? 'warning' : 'success'}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
        {definition.timerMode !== 'infinite' && (
          <Badge>{diffConfig.durationSec}s</Badge>
        )}
      </div>

      {/* Instructions */}
      <div className="w-full max-w-xs space-y-2 mb-8">
        <h2 className="arena-overline text-center">How to Play</h2>
        {definition.instructions.map((instruction, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm">
            <span className="shrink-0 h-5 w-5 rounded-full bg-primary-muted text-primary text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-text-secondary">{instruction}</span>
          </div>
        ))}
      </div>

      {/* Rewards Preview */}
      <div className="flex items-center gap-4 mb-8 text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <LightningIcon size={14} />
          Up to {definition.baseXp} XP
        </span>
        <span className="flex items-center gap-1">
          <CoinIcon size={14} />
          Up to {definition.baseCoinReward} Coins
        </span>
        {definition.diamondChance > 0 && (
          <span className="flex items-center gap-1">
            <DiamondIcon size={14} />
            {Math.round(definition.diamondChance * 100)}% chance
          </span>
        )}
      </div>

      {/* Start Button */}
      <Button size="lg" className="min-w-[200px]">
        Start Game
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
