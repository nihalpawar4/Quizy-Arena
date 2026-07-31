'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, ChevronRight, Check, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useDailyMissions } from '@/hooks/use-daily-missions';
import { formatNumber } from '@/lib/utils';
import {
  claimDailyGift,
  canClaimDailyGift,
  getUnopenedChests,
  openChest,
} from '@/lib/firebase/rewards';
import type { ArenaChestDocument } from '@/lib/firebase/types';
import {
  CoinIcon,
  DiamondIcon,
  TreasureIcon,
  CrownIcon,
  StarFilledIcon,
  ShieldIcon,
} from '@/components/illustrations/icons';
import { LuckyWheel } from '@/components/rewards/lucky-wheel';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const userProfile = useAuthStore((s) => s.userProfile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const addToast = useUIStore((s) => s.addToast);
  const { missions, claimReward, completedCount, totalCount } = useDailyMissions();

  const uid = firebaseUser?.uid;
  const coins = userProfile?.coins ?? 0;
  const diamonds = userProfile?.diamonds ?? 0;

  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [chests, setChests] = useState<ArenaChestDocument[]>([]);
  const [openingChestId, setOpeningChestId] = useState<string | null>(null);

  useEffect(() => {
    setCanClaim(canClaimDailyGift(userProfile?.lastDailyClaimAt));
    if (uid) {
      getUnopenedChests(uid).then(setChests).catch(() => setChests([]));
    }
  }, [uid, userProfile?.lastDailyClaimAt]);

  const handleClaimDailyGift = useCallback(async () => {
    if (!uid || isClaiming) return;
    setIsClaiming(true);

    try {
      const result = await claimDailyGift(uid);
      if (result) {
        addToast({
          message: 'Daily Gift Claimed!',
          description: `+${result.coins} Coins${result.diamonds > 0 ? `, +${result.diamonds} Diamonds` : ''} (Day ${result.streakDay})`,
          variant: 'success',
        });
        setCanClaim(false);
      } else {
        addToast({ message: 'Already claimed today', variant: 'warning' });
        setCanClaim(false);
      }
    } catch {
      addToast({ message: 'Failed to claim gift', variant: 'error' });
    } finally {
      setIsClaiming(false);
    }
  }, [uid, isClaiming, addToast]);

  const handleOpenChest = useCallback(async (chestId: string) => {
    if (!uid || openingChestId) return;
    setOpeningChestId(chestId);

    try {
      const contents = await openChest(uid, chestId);
      if (contents) {
        const desc = contents.map((c) => `${c.value} ${c.type}`).join(', ');
        addToast({ message: 'Chest Opened!', description: desc, variant: 'success' });
        setChests((prev) => prev.filter((c) => c.id !== chestId));
      }
    } catch {
      addToast({ message: 'Failed to open chest', variant: 'error' });
    } finally {
      setOpeningChestId(null);
    }
  }, [uid, openingChestId, addToast]);

  const badgeCount = userProfile?.earnedBadges?.length ?? 0;
  const frameCount = userProfile?.earnedFrames?.length ?? 0;
  const titleCount = userProfile?.earnedTitles?.length ?? 0;
  const streakDay = userProfile?.dailyClaimStreak !== undefined
    ? (userProfile.dailyClaimStreak % 7) + 1
    : 1;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Rewards</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface shadow-xs">
            <CoinIcon size={14} className="text-warning" />
            <span className="text-xs font-bold text-text-primary font-mono">{formatNumber(coins)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface shadow-xs">
            <DiamondIcon size={14} className="text-accent" />
            <span className="text-xs font-bold text-text-primary font-mono">{formatNumber(diamonds)}</span>
          </div>
        </div>
      </div>

      {/* Daily Gift */}
      <section>
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl p-5 lg:p-6',
            'bg-gradient-to-br from-amber-500 to-orange-500',
            'text-white shadow-md',
            canClaim && 'hover:shadow-lg transition-shadow',
          )}
        >
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Gift className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold">Daily Gift</h2>
              <p className="text-sm opacity-90 mt-0.5">
                {canClaim ? 'Your daily reward is ready!' : 'Come back tomorrow for more!'}
              </p>
              {!canClaim && (
                <p className="text-xs opacity-70 mt-1">Day {streakDay} streak · Keep it going!</p>
              )}
            </div>
            <Button
              size="sm"
              className="bg-white text-amber-600 hover:bg-white/90 shadow-sm shrink-0"
              onClick={handleClaimDailyGift}
              isLoading={isClaiming}
              disabled={!canClaim}
            >
              {canClaim ? 'Claim' : 'Claimed'}
            </Button>
          </div>
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/5" />
        </div>
      </section>

      {/* Lucky Wheel */}
      <LuckyWheel uid={uid} lastSpinAt={userProfile?.lastWheelSpinAt} />

      {/* Treasure Chests */}
      {chests.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="arena-section-title">Treasure Chests</h2>
            <Badge variant="warning">{chests.length} to open</Badge>
          </div>

          <div className="flex gap-3 overflow-x-auto arena-scroll-hidden -mx-4 px-4">
            {chests.map((chest) => {
              const colors: Record<string, { bgFrom: string; bgTo: string }> = {
                wooden: { bgFrom: '#FEF3C7', bgTo: '#FDE68A' },
                silver: { bgFrom: '#F3F4F6', bgTo: '#D1D5DB' },
                gold: { bgFrom: '#FEF3C7', bgTo: '#F59E0B' },
                diamond: { bgFrom: '#DBEAFE', bgTo: '#60A5FA' },
              };
              const c = colors[chest.type] ?? colors.wooden;

              return (
                <div key={chest.id} className="w-40 shrink-0 rounded-2xl overflow-hidden bg-surface shadow-sm">
                  <div className="h-24 flex items-center justify-center">
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center relative"
                      style={{ background: `linear-gradient(135deg, ${c.bgFrom}80, ${c.bgTo}80)` }}
                    >
                      <TreasureIcon size={32} style={{ color: c.bgTo }} />
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-sm font-semibold text-text-primary capitalize">{chest.type} Chest</p>
                    <Button
                      size="sm"
                      fullWidth
                      className="mt-2.5"
                      onClick={() => handleOpenChest(chest.id!)}
                      isLoading={openingChestId === chest.id}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* My Collection */}
      <section>
        <h2 className="arena-section-title mb-4">My Collection</h2>
        <div className="rounded-2xl bg-surface shadow-sm overflow-hidden">
          {[
            { label: 'Badges', count: badgeCount, icon: ShieldIcon, color: '#3B82F6' },
            { label: 'Frames', count: frameCount, icon: CrownIcon, color: '#8B5CF6' },
            { label: 'Titles', count: titleCount, icon: StarFilledIcon, color: '#F59E0B' },
          ].map((item, i) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center justify-between px-5 py-4 hover:bg-card-hover transition-colors cursor-pointer',
                i > 0 && 'mt-0.5',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}12` }}
                >
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <span className="text-sm font-medium text-text-primary">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">{item.count} earned</span>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Missions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="arena-section-title">Missions</h2>
          <Badge variant="primary">{completedCount}/{totalCount}</Badge>
        </div>

        <div className="rounded-2xl bg-surface shadow-sm">
          {missions.map((mission, i) => (
            <div
              key={mission.id}
              className={cn('flex items-center gap-3 px-5 py-3.5', i > 0 && 'mt-0.5')}
            >
              <button
                onClick={() => {
                  if (mission.isCompleted && !mission.isClaimed) claimReward(mission.id);
                }}
                disabled={!mission.isCompleted || mission.isClaimed}
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                  mission.isClaimed
                    ? 'bg-success text-white'
                    : mission.isCompleted
                      ? 'bg-primary text-white animate-pulse'
                      : 'bg-card-hover text-transparent',
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </button>

              <span
                className={cn(
                  'flex-1 text-sm',
                  mission.isClaimed ? 'text-text-tertiary line-through' : 'text-text-primary font-medium',
                )}
              >
                {mission.title}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <CoinIcon size={12} className="text-warning" />
                <span className="text-xs text-text-tertiary font-mono">+{mission.coinReward}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
