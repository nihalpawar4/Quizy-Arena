'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameDefinition, GameDifficulty, GameComponentProps, ScoreResult, RewardResult } from '../types';
import { useGameEngine } from '../use-game-engine';
import { GameHUD } from './game-hud';
import { CountdownOverlay } from './countdown-overlay';
import { PauseModal } from './pause-modal';
import { ResultScreen } from './result-screen';
import { FeedbackFlash } from './feedback-flash';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ArrowLeft, Coins } from 'lucide-react';
import { GameIcon } from '@/components/games/game-icon';
import { CoinIcon, DiamondIcon, LightningIcon } from '@/components/illustrations/icons';
import { MAX_GAME_LEVEL } from '@/lib/game-config';
import { getGameCoinCost, canAffordGame, deductCoins, buyExtraLife, DIAMOND_PER_LIFE } from '../economy';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface GameShellProps {
  definition: GameDefinition;
  GameComponent: React.LazyExoticComponent<React.ComponentType<GameComponentProps>>;
  difficulty?: GameDifficulty;
  initialLevel?: number;
  maxLevel?: number;
  onExit: () => void;
}

/**
 * GameShell wraps every game with the full engine lifecycle.
 * It renders the appropriate overlay/HUD for each state.
 * The game component only renders during the 'playing' state.
 *
 * Supports up to 10 levels of progression.
 * Level 2+ costs coins to play.
 * Diamonds can be used to buy extra lives.
 */
export function GameShell({
  definition,
  GameComponent,
  difficulty,
  initialLevel = 1,
  maxLevel = MAX_GAME_LEVEL,
  onExit,
}: GameShellProps) {
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [gameKey, setGameKey] = useState(0);
  const [coinCheckPassed, setCoinCheckPassed] = useState(false);
  const [deductingCoins, setDeductingCoins] = useState(false);

  const userProfile = useAuthStore((s) => s.userProfile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const userCoins = userProfile?.coins ?? 0;
  const userDiamonds = userProfile?.diamonds ?? 0;

  const coinCost = getGameCoinCost(currentLevel);
  const canAfford = canAffordGame(userCoins, currentLevel);

  const engine = useGameEngine({ definition, difficulty, level: currentLevel });

  // Auto-signal ready once mounted (or after reset)
  useEffect(() => {
    if (engine.state === 'loading') {
      // For Level 1 (free), skip coin check
      if (coinCost === 0) {
        setCoinCheckPassed(true);
      }
      const timeout = setTimeout(() => engine.ready(), 300);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state, gameKey]);

  const handlePayAndStart = useCallback(async () => {
    if (!firebaseUser) return;
    if (coinCost === 0) {
      setCoinCheckPassed(true);
      engine.startCountdown();
      return;
    }

    setDeductingCoins(true);
    const success = await deductCoins(firebaseUser.uid, coinCost);
    setDeductingCoins(false);

    if (success) {
      setCoinCheckPassed(true);
      engine.startCountdown();
    }
  }, [firebaseUser, coinCost, engine]);

  const handlePlayAgain = useCallback(() => {
    setCoinCheckPassed(false);
    engine.reset();
    setGameKey((k) => k + 1);
  }, [engine]);

  const handleNextLevel = useCallback(() => {
    setCoinCheckPassed(false);
    setCurrentLevel((l) => Math.min(l + 1, maxLevel));
    engine.reset();
    setGameKey((k) => k + 1);
  }, [engine]);

  const handleBuyLife = useCallback(async () => {
    if (!firebaseUser || userDiamonds < DIAMOND_PER_LIFE) return;
    const success = await buyExtraLife(firebaseUser.uid);
    if (success) {
      // Add a life back to the engine
      engine.resume();
    }
  }, [firebaseUser, userDiamonds, engine]);

  return (
    <div
      className="fixed inset-0 z-50 bg-bg flex flex-col"
      style={{ '--game-accent': definition.accentColor } as React.CSSProperties}
    >
      {/* ── Loading ── */}
      {engine.state === 'loading' && (
        <GameLoadingScreen definition={definition} level={currentLevel} />
      )}

      {/* ── Instructions ── */}
      {engine.state === 'instructions' && (
        <GameInstructionsScreen
          definition={definition}
          level={currentLevel}
          difficulty={difficulty ?? engine.difficulty}
          coinCost={coinCost}
          canAfford={canAfford}
          userCoins={userCoins}
          deductingCoins={deductingCoins}
          onStart={coinCost > 0 ? handlePayAndStart : () => engine.startCountdown()}
          onBack={onExit}
        />
      )}

      {/* ── Countdown ── */}
      {engine.state === 'countdown' && (
        <CountdownOverlay
          onComplete={() => engine.startPlaying()}
        />
      )}

      {/* ── Active Gameplay ── */}
      {(engine.state === 'playing' || engine.state === 'paused') && (
        <>
          <GameHUD engine={engine} />

          <div className="flex-1 overflow-hidden" key={gameKey}>
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              }
            >
              <GameComponent engine={engine} />
            </Suspense>
          </div>

          <FeedbackFlash engine={engine} />

          {engine.state === 'paused' && (
            <PauseModal
              onResume={() => engine.resume()}
              onQuit={() => {
                engine.fail('quit');
                onExit();
              }}
            />
          )}
        </>
      )}

      {/* ── Failed with option to buy life ── */}
      {engine.state === 'failed' && engine.lives <= 0 && definition.supportsLives && userDiamonds >= DIAMOND_PER_LIFE && (
        <div className="absolute inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface rounded-2xl p-6 mx-4 max-w-sm w-full text-center shadow-xl"
          >
            <p className="text-lg font-bold text-text-primary mb-2">Out of Lives!</p>
            <p className="text-sm text-text-secondary mb-4">
              Use diamonds to get an extra life and continue playing.
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-5">
              <DiamondIcon size={18} className="text-accent" />
              <span className="text-sm font-bold text-accent">{DIAMOND_PER_LIFE} Diamonds</span>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={handleBuyLife}>
                <DiamondIcon size={16} className="mr-1.5" />
                Buy Extra Life
              </Button>
              <Button variant="secondary" className="w-full" onClick={onExit}>
                End Game
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Results / Saving / Rewards ── */}
      {(engine.state === 'scoring' ||
        engine.state === 'results' ||
        engine.state === 'saving' ||
        engine.state === 'rewards') && (
        <ResultScreen
          definition={definition}
          engine={engine}
          level={currentLevel}
          maxLevel={maxLevel}
          scoreResult={engine.scoreResult}
          rewardResult={engine.rewardResult}
          onPlayAgain={handlePlayAgain}
          onNextLevel={handleNextLevel}
          onContinue={onExit}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// Premium Loading Screen with Animated Progress Bar
// ══════════════════════════════════════════════

function GameLoadingScreen({ definition, level }: { definition: GameDefinition; level: number }) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const steps = [
      { progress: 20, text: 'Loading assets...' },
      { progress: 45, text: 'Preparing game board...' },
      { progress: 70, text: 'Setting difficulty...' },
      { progress: 90, text: 'Almost ready...' },
      { progress: 100, text: 'Let\'s go!' },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].progress);
        setLoadingText(steps[i].text);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Animated game icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-8"
      >
        {/* Pulsing background ring */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl"
          style={{ backgroundColor: definition.accentColor }}
        />
        <div
          className="relative h-24 w-24 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${definition.accentColor}20` }}
        >
          <GameIcon iconKey={definition.iconKey} color={definition.accentColor} size={48} />
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-bold text-text-primary mb-0.5"
      >
        {definition.title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-sm font-medium text-primary mb-1"
      >
        Level {level}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-text-tertiary mb-10"
      >
        {loadingText}
      </motion.p>

      {/* Animated progress bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: '100%' }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xs"
      >
        <div className="h-2 rounded-full bg-card-hover overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: definition.accentColor }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[11px] text-text-disabled text-center mt-2 font-mono">
          {progress}%
        </p>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════
// Premium Instructions Screen (with coin cost)
// ══════════════════════════════════════════════

function GameInstructionsScreen({
  definition,
  level,
  difficulty,
  coinCost,
  canAfford,
  userCoins,
  deductingCoins,
  onStart,
  onBack,
}: {
  definition: GameDefinition;
  level: number;
  difficulty: GameDifficulty;
  coinCost: number;
  canAfford: boolean;
  userCoins: number;
  deductingCoins: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Back button */}
      <div className="p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Floating game icon with gradient background */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          {/* Decorative circles */}
          <div
            className="absolute -inset-8 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: definition.accentColor }}
          />
          <div
            className="relative h-28 w-28 rounded-[28px] flex items-center justify-center shadow-xl border border-white/10"
            style={{ background: `linear-gradient(135deg, ${definition.accentColor}30, ${definition.accentColor}10)` }}
          >
            <GameIcon iconKey={definition.iconKey} color={definition.accentColor} size={56} />
          </div>
        </motion.div>

        {/* Title + Level */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-5"
        >
          <h1 className="text-2xl font-bold text-text-primary">{definition.title}</h1>
          <p className="text-sm text-text-secondary mt-1">{definition.description}</p>
        </motion.div>

        {/* Level + Category Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-8"
        >
          <Badge variant="primary" className="font-bold">Level {level}</Badge>
          <Badge variant="primary" className="capitalize">{definition.category}</Badge>
          <Badge variant={difficulty === 'hard' ? 'danger' : difficulty === 'medium' ? 'warning' : 'success'}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </motion.div>

        {/* Instructions Card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full max-w-xs rounded-2xl bg-surface border border-border shadow-sm p-5 mb-6"
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">
            How to Play
          </h2>
          <div className="space-y-3">
            {definition.instructions.map((instruction, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="flex items-start gap-3 text-sm"
              >
                <span
                  className="shrink-0 h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                  style={{
                    backgroundColor: `${definition.accentColor}15`,
                    color: definition.accentColor,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-text-secondary leading-snug">{instruction}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rewards Preview + Cost */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-5 mb-4 text-xs text-text-tertiary"
        >
          <span className="flex items-center gap-1">
            <LightningIcon size={14} className="text-warning" />
            Up to {definition.baseXp} XP
          </span>
          <span className="flex items-center gap-1">
            <CoinIcon size={14} className="text-warning" />
            Up to {definition.baseCoinReward} Coins
          </span>
          {definition.diamondChance > 0 && (
            <span className="flex items-center gap-1">
              <DiamondIcon size={14} className="text-accent" />
              {Math.round(definition.diamondChance * 100)}% chance
            </span>
          )}
        </motion.div>

        {/* Coin cost indicator */}
        {coinCost > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl mb-6 text-sm font-medium',
              canAfford
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600'
                : 'bg-red-500/10 border border-red-500/20 text-red-500',
            )}
          >
            <CoinIcon size={16} className={canAfford ? 'text-amber-500' : 'text-red-400'} />
            {canAfford ? (
              <span>Costs <strong>{coinCost}</strong> coins to play (You have {userCoins})</span>
            ) : (
              <span>Need <strong>{coinCost}</strong> coins (You have {userCoins})</span>
            )}
          </motion.div>
        )}

        {/* Animated Start Button */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Button
            size="lg"
            className={cn(
              'min-w-[220px] h-14 text-base font-bold shadow-lg',
              'relative overflow-hidden',
              (!canAfford && coinCost > 0) && 'opacity-50 cursor-not-allowed',
            )}
            style={{
              backgroundColor: definition.accentColor,
              boxShadow: `0 8px 24px ${definition.accentColor}30`,
            }}
            onClick={onStart}
            disabled={(!canAfford && coinCost > 0) || deductingCoins}
            isLoading={deductingCoins}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
            />
            <span className="relative flex items-center gap-2">
              {coinCost > 0 && <CoinIcon size={18} />}
              {coinCost > 0 ? `Play Level ${level} (${coinCost} coins)` : `Start Level ${level}`}
              <ChevronRight className="h-5 w-5" />
            </span>
          </Button>
          {!canAfford && coinCost > 0 && (
            <p className="text-xs text-red-400 mt-2 text-center">
              Play more games to earn coins!
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
