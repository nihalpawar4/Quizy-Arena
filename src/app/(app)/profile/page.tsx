'use client';

import Link from 'next/link';
import {
  Gamepad2,
  Swords,
  Star,
  Calendar,
  LogOut,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { XpRing } from '@/components/illustrations/xp-ring';
import {
  BrainIcon,
  LightningIcon,
  TargetIcon,
  PuzzleIcon,
  EyeIcon,
  CrystalIcon,
  ShieldIcon,
  FlameIcon,
  CrownIcon,
  CoinIcon,
  DiamondIcon,
} from '@/components/illustrations/icons';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { signOut } from '@/lib/firebase/auth';
import { updateSetting } from '@/lib/firebase/settings';
import { formatNumber } from '@/lib/utils';
import { xpProgress, xpToNextLevel, levelFromXp, getRankFromPoints } from '@/lib/xp';
import { SKILLS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const SKILL_ICONS = [BrainIcon, PuzzleIcon, TargetIcon, LightningIcon, CrystalIcon, ShieldIcon, EyeIcon, ShieldIcon];

export default function ProfilePage() {
  const router = useRouter();
  const userProfile = useAuthStore((s) => s.userProfile);
  const arenaProfile = useAuthStore((s) => s.arenaProfile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const reset = useAuthStore((s) => s.reset);
  const addToast = useUIStore((s) => s.addToast);

  const uid = firebaseUser?.uid;
  const displayName = userProfile?.displayName || 'Player';
  const username = userProfile?.username || '';
  const globalXp = userProfile?.globalXp ?? 0;
  const globalLevel = levelFromXp(globalXp);
  const xpProg = xpProgress(globalXp);
  const xpRemaining = xpToNextLevel(globalXp);
  const brainScore = arenaProfile?.brainScore ?? 0;
  const rank = getRankFromPoints(arenaProfile?.rankPoints ?? 0);
  const coins = userProfile?.coins ?? 0;
  const diamonds = userProfile?.diamonds ?? 0;

  const joinedDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  const skills = [
    { ...SKILLS[0], value: arenaProfile?.skillMemory ?? 0 },
    { ...SKILLS[1], value: arenaProfile?.skillLogic ?? 0 },
    { ...SKILLS[2], value: arenaProfile?.skillFocus ?? 0 },
    { ...SKILLS[3], value: arenaProfile?.skillReaction ?? 0 },
    { ...SKILLS[4], value: arenaProfile?.skillCreativity ?? 0 },
    { ...SKILLS[5], value: arenaProfile?.skillProblemSolving ?? 0 },
    { ...SKILLS[6], value: arenaProfile?.skillPatternRecognition ?? 0 },
    { ...SKILLS[7], value: arenaProfile?.skillDecisionMaking ?? 0 },
  ];

  async function handleToggleSetting(key: string, currentValue: boolean) {
    if (!uid) return;
    try {
      await updateSetting(uid, key, !currentValue);
    } catch {
      addToast({ message: 'Failed to update setting', variant: 'error' });
    }
  }

  async function handleSignOut() {
    await signOut();
    reset();
    router.replace('/sign-in');
  }

  return (
    <div className="space-y-5 pb-8 max-w-3xl mx-auto">
      {/* Identity card */}
      <section className="relative overflow-hidden rounded-3xl bg-surface shadow-md p-6 lg:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-accent/5 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <XpRing progress={xpProg * 100} level={globalLevel} size={112} strokeWidth={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar src={userProfile?.avatarUrl} alt={displayName} size="lg" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{displayName}</h1>
              {userProfile?.activeTitle && <Badge variant="primary">{userProfile.activeTitle}</Badge>}
            </div>
            {username && <p className="text-sm text-text-tertiary">@{username}</p>}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-hover text-xs font-semibold text-text-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Level {globalLevel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-hover text-xs text-text-secondary">
                <CrownIcon size={14} className="text-warning" />
                {rank.name}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-hover text-xs text-text-secondary">
                <CoinIcon size={14} className="text-warning" />
                {formatNumber(coins)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-hover text-xs text-text-secondary">
                <DiamondIcon size={14} className="text-accent" />
                {formatNumber(diamonds)}
              </span>
            </div>

            <div className="mt-4 max-w-sm mx-auto sm:mx-0">
              <div className="flex justify-between text-[11px] text-text-tertiary mb-1">
                <span>Progress to Level {globalLevel + 1}</span>
                <span className="font-mono">{formatNumber(xpRemaining)} XP left</span>
              </div>
              <ProgressBar value={xpProg * 100} size="sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Brain + stats bento */}
      <div className="grid lg:grid-cols-5 gap-4">
        <section className="lg:col-span-2 rounded-2xl bg-surface shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Brain Score</p>
          <div className="arena-stat arena-gradient-text text-5xl font-bold tabular-nums">{brainScore}</div>
          <p className="text-xs text-text-tertiary mt-2 max-w-[200px]">
            Your average across 8 cognitive skills
          </p>
          <Link
            href="/games"
            className="mt-4 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Train now →
          </Link>
        </section>

        <section className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { icon: Gamepad2, label: 'Games', value: arenaProfile?.gamesPlayed ?? 0 },
            { icon: Swords, label: 'Wins', value: arenaProfile?.gamesWon ?? 0 },
            { icon: FlameIcon, label: 'Streak', value: arenaProfile?.arenaStreak ?? 0, custom: true },
            { icon: Star, label: 'Best Streak', value: arenaProfile?.arenaStreakBest ?? 0 },
            { icon: Calendar, label: 'Joined', value: joinedDate, text: true },
            { icon: CrownIcon, label: 'Rank pts', value: arenaProfile?.rankPoints ?? 0, custom: true },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface shadow-sm p-4 hover:bg-card-hover/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                {(stat as { custom?: boolean }).custom ? (
                  <stat.icon size={15} className="text-text-tertiary" />
                ) : (
                  <stat.icon className="h-4 w-4 text-text-tertiary" />
                )}
                <span className="text-[11px] text-text-tertiary font-medium">{stat.label}</span>
              </div>
              <p
                className={cn(
                  'font-semibold text-text-primary',
                  (stat as { text?: boolean }).text ? 'text-sm' : 'text-xl font-mono',
                )}
              >
                {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
              </p>
            </div>
          ))}
        </section>
      </div>

      {/* Skills */}
      <section className="rounded-2xl bg-surface shadow-sm p-5 lg:p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Cognitive Skills</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {skills.map((skill, i) => {
            const SkillIcon = SKILL_ICONS[i] ?? BrainIcon;
            return (
              <div key={skill.id} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${skill.color}12` }}
                >
                  <SkillIcon size={14} style={{ color: skill.color }} />
                </div>
                <span className="text-xs text-text-secondary w-24 truncate font-medium">{skill.label}</span>
                <ProgressBar value={skill.value} size="sm" className="flex-1" />
                <span className="text-[10px] font-mono text-text-tertiary w-6 text-right">{skill.value}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Friends */}
      <section className="rounded-2xl bg-surface shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Friends</h2>
          <Button size="sm" variant="ghost" onClick={() => addToast({ message: 'Coming Soon', variant: 'info' })}>
            <Users className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="rounded-xl bg-card-hover/60 text-center py-10 px-4">
          <Users className="h-9 w-9 text-text-disabled mx-auto mb-3 opacity-60" />
          <p className="text-sm text-text-secondary font-medium">No friends yet</p>
          <p className="text-xs text-text-tertiary mt-1 mb-4">Challenge friends when social features launch</p>
          <Button size="sm" variant="secondary" onClick={() => addToast({ message: 'Coming Soon', variant: 'info' })}>
            Find Friends
          </Button>
        </div>
      </section>

      {/* Settings */}
      <section className="rounded-2xl bg-surface shadow-sm p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-sm font-semibold text-text-primary">Settings</h2>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Sound Effects', key: 'soundEnabled', enabled: userProfile?.settings?.soundEnabled ?? true },
            { label: 'Notifications', key: 'notificationsEnabled', enabled: userProfile?.settings?.notificationsEnabled ?? true },
            { label: 'Color Blind Mode', key: 'colorBlindMode', enabled: userProfile?.settings?.colorBlindMode ?? false },
          ].map((setting) => (
            <div
              key={setting.label}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-card-hover/40 hover:bg-card-hover transition-colors"
            >
              <span className="text-sm text-text-primary font-medium">{setting.label}</span>
              <button
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 cursor-pointer',
                  setting.enabled ? 'bg-primary' : 'bg-card-hover',
                )}
                role="switch"
                aria-checked={setting.enabled}
                onClick={() => handleToggleSetting(setting.key, setting.enabled)}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                    setting.enabled ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm text-danger font-semibold bg-danger-muted hover:bg-danger/10 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </section>
    </div>
  );
}
