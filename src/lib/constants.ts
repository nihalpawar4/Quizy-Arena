/**
 * App-wide constants for Quizy Arena.
 */

export const APP_NAME = 'Quizy Arena';
export const APP_TAGLINE = 'Play. Think. Grow.';
export const APP_DESCRIPTION =
  'Train your brain with premium cognitive games. Improve memory, logic, and focus.';

// ── Navigation ──
export const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'Home' },
  { href: '/games', label: 'Games', icon: 'Gamepad2' },
  { href: '/battle', label: 'Battle', icon: 'Swords' },
  { href: '/rewards', label: 'Rewards', icon: 'Gift' },
  { href: '/profile', label: 'Profile', icon: 'User' },
] as const;

// ── Skills ──
export const SKILLS = [
  { id: 'memory', label: 'Memory', icon: 'Brain', color: '#3B82F6' },
  { id: 'logic', label: 'Logic', icon: 'Puzzle', color: '#38BDF8' },
  { id: 'focus', label: 'Focus', icon: 'Target', color: '#22C55E' },
  { id: 'reaction', label: 'Reaction', icon: 'Zap', color: '#FACC15' },
  { id: 'creativity', label: 'Creativity', icon: 'Palette', color: '#38BDF8' },
  { id: 'problemSolving', label: 'Problem Solving', icon: 'Wrench', color: '#3B82F6' },
  { id: 'patternRecognition', label: 'Pattern Recognition', icon: 'Eye', color: '#22C55E' },
  { id: 'decisionMaking', label: 'Decision Making', icon: 'Scale', color: '#FACC15' },
] as const;

export type SkillId = (typeof SKILLS)[number]['id'];

// ── Worlds ──
export const WORLDS = [
  { slug: 'training-camp', name: 'Training Camp', unlockLevel: 1 },
  { slug: 'forest-of-focus', name: 'Forest of Focus', unlockLevel: 5 },
  { slug: 'ice-kingdom', name: 'Ice Kingdom', unlockLevel: 10 },
  { slug: 'desert-of-logic', name: 'Desert of Logic', unlockLevel: 16 },
  { slug: 'volcano-peak', name: 'Volcano Peak', unlockLevel: 23 },
  { slug: 'cyber-city', name: 'Cyber City', unlockLevel: 30 },
  { slug: 'sky-kingdom', name: 'Sky Kingdom', unlockLevel: 38 },
  { slug: 'champion-castle', name: 'Champion Castle', unlockLevel: 46 },
] as const;

// ── Upcoming / locked games (shown in Discover) ──
export const UPCOMING_GAMES: readonly {
  slug: string;
  title: string;
  skill: string;
  time: string;
  unlockLevel: number;
  worldSlug: string;
  color: string;
  iconKey: 'brain' | 'lightning' | 'target' | 'puzzle' | 'eye' | 'crystal';
}[] = [];

// ── Chest Types ──
export const CHEST_TYPES = {
  wooden: { name: 'Wooden Chest' },
  silver: { name: 'Silver Chest' },
  gold: { name: 'Gold Chest' },
  diamond: { name: 'Diamond Chest' },
} as const;

// ── Streak ──
export const STREAK_BONUSES = [
  { days: 3, xpMultiplier: 1.1, label: '+10% XP' },
  { days: 7, xpMultiplier: 1.25, label: '+25% XP', diamondReward: 5 },
  { days: 14, xpMultiplier: 1.25, label: '+25% XP', badge: 'dedicated' },
  { days: 30, xpMultiplier: 1.5, label: '+50% XP', diamondReward: 15, badge: 'committed' },
  { days: 100, xpMultiplier: 1.5, label: '+50% XP', diamondReward: 50, badge: 'legend', frame: 'legend-frame' },
] as const;

// ── Skill Score Tiers ──
export const SKILL_TIERS = [
  { min: 0, max: 19, name: 'Beginner' },
  { min: 20, max: 39, name: 'Learner' },
  { min: 40, max: 59, name: 'Thinker' },
  { min: 60, max: 79, name: 'Sharp' },
  { min: 80, max: 89, name: 'Expert' },
  { min: 90, max: 99, name: 'Master' },
  { min: 100, max: 100, name: 'Genius' },
] as const;

// ── Daily Motivational Quotes (a curated subset) ──
export const DAILY_QUOTES = [
  'The brain is a muscle. The more you use it, the stronger it gets.',
  'Every expert was once a beginner.',
  'Small daily improvements lead to stunning results.',
  'Your mind is your greatest superpower.',
  'Challenge yourself — growth lives outside your comfort zone.',
  'Focus is the new superpower.',
  'Mistakes are proof that you are trying.',
  'The only limit is the one you set for yourself.',
  'A little progress each day adds up to big results.',
  'Train your brain today. Thank yourself tomorrow.',
] as const;

/**
 * Get today's motivational quote (deterministic by date).
 */
export function getTodayQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

// ── Intro Loading Messages ──
export const INTRO_MESSAGES = [
  'Preparing Arena...',
  'Loading Worlds...',
  'Generating Daily Rewards...',
  'Finding Opponents...',
  'Sharpening Your Brain...',
  'Almost Ready...',
] as const;

// ── Local Storage Keys ──
export const STORAGE_KEYS = {
  INTRO_SEEN: 'arena_intro_seen',
  INSTALL_DISMISSED: 'arena_install_dismissed',
  INSTALL_DISMISS_DATE: 'arena_install_dismiss_date',
} as const;
