'use client';


import { motion } from 'framer-motion';
import { Star, RotateCcw, ChevronRight, Zap, Trophy, ArrowRight } from 'lucide-react';
import type { GameDefinition, GameEngine, ScoreResult, RewardResult } from '../types';
import { Button } from '@/components/ui/button';
import { formatNumber, formatDuration, cn } from '@/lib/utils';
import { GameIcon } from '@/components/games/game-icon';
import { CoinIcon, DiamondIcon, LightningIcon } from '@/components/illustrations/icons';
import { MAX_GAME_LEVEL } from '@/lib/game-config';

interface ResultScreenProps {
  definition: GameDefinition;
  engine: GameEngine;
  level: number;
  maxLevel?: number;
  scoreResult: ScoreResult | null;
  rewardResult: RewardResult | null;
  onPlayAgain: () => void;
  onNextLevel: () => void;
  onContinue: () => void;
}

/**
 * Result screen shown after a game ends.
 * Displays score, stars, accuracy, rewards, skill deltas, and level info.
 * Auto-triggers save after a brief pause on the results state.
 */
export function ResultScreen({
  definition,
  engine,
  level,
  maxLevel = MAX_GAME_LEVEL,
  scoreResult,
  rewardResult,
  onPlayAgain,
  onNextLevel,
  onContinue,
}: ResultScreenProps) {
  const isLoading = !scoreResult || !rewardResult;
  const isSaving = engine.state === 'saving';

  // Auto-trigger save when results are displayed
  // The engine handles results → saving transition automatically
  // We no longer call engine.complete() here as that's an invalid transition from 'results'

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <GameIcon iconKey={definition.iconKey} color={definition.accentColor} size={40} className="mx-auto mb-3 arena-breathe" />
          <p className="text-sm text-text-secondary">Calculating results...</p>
        </div>
      </div>
    );
  }

  const stars = scoreResult.stars;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm space-y-4"
      >
        {/* ── Level Header ── */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-center"
        >
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
            Level {level} Complete!
          </p>
        </motion.div>

        {/* ── Stars ── */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Star
                className={cn(
                  'h-10 w-10',
                  i <= stars
                    ? 'text-warning fill-warning drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                    : 'text-text-disabled',
                )}
              />
            </motion.div>
          ))}
        </div>

        {/* ── Score ── */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="text-center"
        >
          <p className="arena-stat text-4xl">{formatNumber(scoreResult.finalScore)}</p>
          <p className="text-sm text-text-secondary mt-1">Score</p>
        </motion.div>

        {/* ── Personal Best ── */}
        {rewardResult.isPersonalBest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-success-muted border border-success/20"
          >
            <Trophy className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-success">New Personal Best!</span>
          </motion.div>
        )}

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="rounded-lg border border-border bg-card p-4 space-y-2.5"
        >
          <StatRow label="Accuracy" value={`${scoreResult.accuracy}%`} />
          <StatRow label="Best Combo" value={`x${engine.maxCombo}`} />
          <StatRow label="Time" value={formatDuration(Math.round(engine.timeElapsed))} />
          {scoreResult.comboBonus > 0 && (
            <StatRow label="Combo Bonus" value={`+${scoreResult.comboBonus}%`} highlight />
          )}
          {scoreResult.speedBonus > 0 && (
            <StatRow label="Speed Bonus" value={`+${scoreResult.speedBonus}%`} highlight />
          )}
          {scoreResult.perfectBonus > 0 && (
            <StatRow label="Perfect Bonus" value={`+${scoreResult.perfectBonus}%`} highlight />
          )}
        </motion.div>

        {/* ── Rewards ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-around">
            <RewardItem icon={<LightningIcon size={18} className="text-warning" />} label="XP" value={`+${rewardResult.xpEarned}`} />
            <RewardItem icon={<CoinIcon size={18} className="text-warning" />} label="Coins" value={`+${rewardResult.coinsEarned}`} />
            {rewardResult.diamondsEarned > 0 && (
              <RewardItem icon={<DiamondIcon size={18} className="text-accent" />} label="Diamonds" value={`+${rewardResult.diamondsEarned}`} />
            )}
          </div>

          {/* Skill Deltas */}
          {Object.entries(rewardResult.skillDeltas).length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              {Object.entries(rewardResult.skillDeltas).map(([skill, delta]) => (
                <div key={skill} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary capitalize">{skill}</span>
                  <span className="text-success font-mono">+{delta}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Level Up ── */}
        {rewardResult.didLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-muted border border-primary/20"
          >
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-primary">
              Level Up! Level {rewardResult.newArenaLevel}
            </span>
          </motion.div>
        )}

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="space-y-2 pt-2"
        >
          {/* Primary: Next Level */}
          {level < maxLevel ? (
            <Button
              className="w-full"
              onClick={onNextLevel}
              isLoading={isSaving}
            >
              <ArrowRight className="h-4 w-4" />
              Next Level ({level + 1}/{maxLevel})
            </Button>
          ) : (
            <Button className="w-full" onClick={onContinue} isLoading={isSaving}>
              {maxLevel < MAX_GAME_LEVEL ? 'Challenge Complete' : 'All Levels Complete'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Secondary row */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onPlayAgain}
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onContinue}
            >
              Exit
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span
        className={cn(
          'font-mono font-medium',
          highlight ? 'text-success' : 'text-text-primary',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function RewardItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="text-sm font-bold text-text-primary mt-0.5">{value}</p>
      <p className="text-xs text-text-tertiary">{label}</p>
    </div>
  );
}
