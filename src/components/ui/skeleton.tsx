'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'arena-skeleton',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded-sm h-4',
        variant === 'rectangular' && 'rounded-md',
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Pre-composed skeleton for a standard card */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 space-y-3',
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton height={20} width="60%" variant="text" />
      <Skeleton height={14} width="80%" variant="text" />
      <Skeleton height={14} width="40%" variant="text" />
    </div>
  );
}

/** Pre-composed skeleton for a game card */
export function GameCardSkeleton() {
  return (
    <div className="w-36 shrink-0 space-y-2" aria-hidden="true">
      <Skeleton className="w-full aspect-[4/3]" />
      <Skeleton height={14} width="70%" variant="text" />
      <Skeleton height={12} width="50%" variant="text" />
    </div>
  );
}

// ============================================
// PAGE-SPECIFIC COMPOSITE SKELETONS
// ============================================

/** Homepage hero section skeleton */
export function HomepageHeroSkeleton() {
  return (
    <div
      className="relative -mx-4 -mt-5 lg:-mx-8 lg:-mt-6 overflow-hidden"
      aria-hidden="true"
    >
      <div className="bg-gradient-to-b from-hero-from to-hero-to px-6 pt-6 pb-8 lg:px-10 lg:pt-8">
        {/* Currency bar skeleton */}
        <div className="flex items-center justify-end gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-8 w-20 rounded-full"
            />
          ))}
        </div>

        {/* Hero content skeleton */}
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <Skeleton variant="circular" width={88} height={88} />
            <Skeleton height={12} width={64} variant="text" />
          </div>
          <div className="flex-1 flex justify-center">
            <Skeleton className="w-full max-w-[280px] aspect-square rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Daily challenge card skeleton */
export function DailyChallengeSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 bg-gradient-to-br from-primary/20 to-primary/10 border border-border"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 mb-2">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton height={10} width={100} variant="text" />
      </div>
      <Skeleton height={22} width="60%" variant="text" className="mb-1" />
      <Skeleton height={14} width="80%" variant="text" className="mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton height={12} width={60} variant="text" />
          <Skeleton height={12} width={40} variant="text" />
        </div>
        <Skeleton height={12} width={50} variant="text" />
      </div>
    </div>
  );
}

/** Continue playing horizontal scroll skeleton */
export function ContinuePlayingSkeleton() {
  return (
    <div
      className="flex gap-3 overflow-hidden -mx-4 px-4"
      aria-hidden="true"
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-36 shrink-0 p-4 rounded-2xl border border-border">
          <Skeleton className="h-10 w-10 rounded-xl mb-3" />
          <Skeleton height={14} width="70%" variant="text" />
          <Skeleton height={11} width="50%" variant="text" className="mt-1 mb-3" />
          <Skeleton height={6} className="w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Missions list skeleton */
export function MissionsSkeleton() {
  return (
    <div
      className="rounded-2xl bg-surface border border-border shadow-sm divide-y divide-border"
      aria-hidden="true"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1">
            <Skeleton height={14} width="60%" variant="text" />
            <Skeleton height={6} className="w-full rounded-full mt-2" />
          </div>
          <Skeleton height={22} width={60} className="rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Leaderboard rows skeleton */
export function LeaderboardSkeleton() {
  return (
    <div
      className="rounded-2xl bg-surface border border-border shadow-sm divide-y divide-border overflow-hidden"
      aria-hidden="true"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton variant="circular" width={28} height={28} />
          <div className="flex-1">
            <Skeleton height={14} width="40%" variant="text" />
          </div>
          <Skeleton height={12} width={60} variant="text" />
        </div>
      ))}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary-muted">
        <Skeleton variant="circular" width={18} height={18} />
        <div className="flex-1">
          <Skeleton height={14} width={30} variant="text" />
        </div>
        <Skeleton height={12} width={80} variant="text" />
      </div>
    </div>
  );
}

/** Profile header skeleton */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-6" aria-hidden="true">
      <Skeleton variant="circular" width={96} height={96} />
      <div className="text-center space-y-2">
        <Skeleton height={20} width={140} variant="text" className="mx-auto" />
        <Skeleton height={14} width={100} variant="text" className="mx-auto" />
      </div>
      <Skeleton height={8} width={200} className="rounded-full" />
    </div>
  );
}

/** Profile stats grid skeleton */
export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border p-4 text-center space-y-2">
          <Skeleton height={28} width={48} variant="text" className="mx-auto" />
          <Skeleton height={12} width={64} variant="text" className="mx-auto" />
        </div>
      ))}
    </div>
  );
}

/** Rewards page skeleton */
export function RewardsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {/* Daily gift card */}
      <div className="rounded-2xl border border-border p-5 space-y-3">
        <Skeleton height={20} width="40%" variant="text" />
        <Skeleton height={14} width="70%" variant="text" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-xl" />
          ))}
        </div>
        <Skeleton height={40} className="w-full rounded-xl" />
      </div>
      {/* Chest row */}
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-24 shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Notifications list skeleton */
export function NotificationsSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl">
          <Skeleton variant="circular" width={36} height={36} />
          <div className="flex-1 space-y-1.5">
            <Skeleton height={14} width="50%" variant="text" />
            <Skeleton height={12} width="80%" variant="text" />
            <Skeleton height={10} width={60} variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Battle page skeleton */
export function BattleSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton height={20} width="30%" variant="text" />
          <Skeleton height={28} width={80} className="rounded-full" />
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center space-y-2">
            <Skeleton variant="circular" width={64} height={64} className="mx-auto" />
            <Skeleton height={14} width={60} variant="text" className="mx-auto" />
          </div>
          <Skeleton height={28} width={28} variant="text" />
          <div className="text-center space-y-2">
            <Skeleton variant="circular" width={64} height={64} className="mx-auto" />
            <Skeleton height={14} width={60} variant="text" className="mx-auto" />
          </div>
        </div>
        <Skeleton height={44} className="w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Friends list skeleton */
export function FriendsSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton height={14} width="40%" variant="text" />
            <Skeleton height={12} width={80} variant="text" className="mt-1" />
          </div>
          <Skeleton height={8} width={8} variant="circular" />
        </div>
      ))}
    </div>
  );
}

/** Game history session list skeleton */
export function GameHistorySkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton height={14} width="50%" variant="text" />
            <Skeleton height={12} width="30%" variant="text" className="mt-1" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton height={16} width={50} variant="text" />
            <Skeleton height={10} width={40} variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Worlds grid skeleton */
export function WorldsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3 space-y-1.5">
            <Skeleton height={14} width="60%" variant="text" />
            <Skeleton height={11} width={50} variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Brain score section skeleton */
export function BrainScoreSkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border shadow-sm p-5" aria-hidden="true">
      <div className="flex items-center gap-5 mb-5">
        <div className="text-center">
          <Skeleton height={36} width={48} variant="text" />
          <Skeleton height={11} width={70} variant="text" className="mt-1" />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="circular" width={14} height={14} />
              <Skeleton height={6} className="flex-1 rounded-full" />
              <Skeleton height={10} width={16} variant="text" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
