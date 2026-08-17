'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Swords, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoinIcon, DiamondIcon, LightningIcon } from '@/components/illustrations/icons';
import { BATTLE_REWARDS } from '@/lib/battle/types';
import { cn } from '@/lib/utils';

interface BattleResultProps {
  result: 'win' | 'lose' | 'draw';
  myScore: number;
  myCorrect: number;
  myWrong: number;
  opponentName: string;
  opponentScore: number;
  opponentCorrect: number;
  onPlayAgain: () => void;
  onBack: () => void;
}

export function BattleResult({
  result,
  myScore,
  myCorrect,
  myWrong,
  opponentName,
  opponentScore,
  opponentCorrect,
  onPlayAgain,
  onBack,
}: BattleResultProps) {
  const rewards = result === 'win'
    ? BATTLE_REWARDS.winner
    : result === 'draw'
      ? BATTLE_REWARDS.draw
      : BATTLE_REWARDS.loser;

  const headerConfig = {
    win: {
      emoji: '🏆',
      title: 'Victory!',
      subtitle: 'You crushed it!',
      gradient: 'from-amber-500 to-yellow-600',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    lose: {
      emoji: '💪',
      title: 'Defeat',
      subtitle: 'Better luck next time!',
      gradient: 'from-red-500 to-rose-600',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    draw: {
      emoji: '🤝',
      title: "It's a Draw!",
      subtitle: 'Equally matched brains!',
      gradient: 'from-primary to-accent',
      textColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  }[result];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-[60vh]">
      {/* Celebration particles (win only) */}
      {result === 'win' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{
                x: '50%',
                y: '50%',
                opacity: 1,
                scale: 0,
              }}
              animate={{
                x: `${20 + Math.random() * 60}%`,
                y: `${10 + Math.random() * 80}%`,
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.15,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              {['⭐', '✨', '🎉', '🏆'][i % 4]}
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Result Header */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-3"
        >
          <motion.div
            animate={result === 'win' ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            className={cn(
              'inline-flex items-center justify-center h-24 w-24 rounded-3xl mx-auto',
              `bg-gradient-to-br ${headerConfig.gradient}`,
              'shadow-xl',
            )}
          >
            <span className="text-5xl">{headerConfig.emoji}</span>
          </motion.div>

          <h1 className="text-3xl font-bold text-text-primary">{headerConfig.title}</h1>
          <p className="text-sm text-text-secondary">{headerConfig.subtitle}</p>
        </motion.div>

        {/* Score Comparison */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-surface border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            {/* Your score */}
            <div className="text-center flex-1">
              <p className="text-xs text-text-tertiary mb-1">You</p>
              <p className={cn('text-3xl font-bold font-mono', headerConfig.textColor)}>{myScore}</p>
              <p className="text-[10px] text-text-tertiary mt-1">
                ✅ {myCorrect} · ❌ {myWrong}
              </p>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1 px-4">
              <Swords className="h-5 w-5 text-text-disabled" />
              <span className="text-[10px] font-bold text-text-disabled">VS</span>
            </div>

            {/* Opponent score */}
            <div className="text-center flex-1">
              <p className="text-xs text-text-tertiary mb-1 truncate">{opponentName}</p>
              <p className="text-3xl font-bold font-mono text-text-secondary">{opponentScore}</p>
              <p className="text-[10px] text-text-tertiary mt-1">
                ✅ {opponentCorrect}
              </p>
            </div>
          </div>

          {/* Score bar */}
          <div className="flex items-center gap-1 rounded-full overflow-hidden h-2 bg-card-hover">
            <div
              className={cn(
                'h-full rounded-l-full transition-all duration-700',
                result === 'win' ? 'bg-amber-500' : result === 'draw' ? 'bg-primary' : 'bg-red-400',
              )}
              style={{ width: `${Math.max(5, (myScore / Math.max(myScore + opponentScore, 1)) * 100)}%` }}
            />
          </div>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={cn('rounded-2xl p-4 border', headerConfig.bgColor, 'border-current/10')}
        >
          <p className="text-xs font-semibold text-text-tertiary mb-3 uppercase tracking-wider">
            Rewards Earned
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <LightningIcon size={16} className="text-warning" />
              <span className="text-sm font-bold text-text-primary">+{rewards.xp} XP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CoinIcon size={16} className="text-warning" />
              <span className="text-sm font-bold text-text-primary">+{rewards.coins}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-text-primary">+{rewards.rankPoints} RP</span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3"
        >
          <Button
            variant="secondary"
            onClick={onBack}
            className="flex-1 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={onPlayAgain}
            className="flex-1 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
