'use client';

import {
  BrainIcon,
  LightningIcon,
  TargetIcon,
  PuzzleIcon,
  EyeIcon,
  CrystalIcon,
} from '@/components/illustrations/icons';
import { cn } from '@/lib/utils';

export type GameIconKey =
  | 'brain'
  | 'lightning'
  | 'target'
  | 'puzzle'
  | 'eye'
  | 'crystal';

const ICON_MAP = {
  brain: BrainIcon,
  lightning: LightningIcon,
  target: TargetIcon,
  puzzle: PuzzleIcon,
  eye: EyeIcon,
  crystal: CrystalIcon,
} as const;

interface GameIconProps {
  iconKey: GameIconKey;
  color?: string;
  size?: number;
  className?: string;
}

/** Game / category icon — SVG icon set. */
export function GameIcon({
  iconKey,
  color = '#3B82F6',
  size = 24,
  className,
}: GameIconProps) {
  const Icon = ICON_MAP[iconKey] ?? BrainIcon;
  return <Icon size={size} style={{ color }} className={className} />;
}

// ── World Illustration Configs ──

interface WorldTheme {
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accentColor: string;
  SvgScene: React.FC<{ size: number }>;
}

/** Training Camp — warm greens + campfire */
function TrainingCampScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Ground */}
      <ellipse cx="24" cy="40" rx="20" ry="4" fill="rgba(34,197,94,0.25)" />
      {/* Tent */}
      <path d="M12 36L24 14L36 36H12Z" fill="rgba(34,197,94,0.35)" stroke="rgba(34,197,94,0.6)" strokeWidth="1.2" />
      <path d="M24 14V36" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8" strokeDasharray="2 2" />
      {/* Flag */}
      <path d="M24 14L30 18L24 22" fill="rgba(250,204,21,0.5)" stroke="rgba(250,204,21,0.7)" strokeWidth="0.8" />
      {/* Campfire */}
      <circle cx="24" cy="38" r="2" fill="rgba(249,115,22,0.4)" />
      <path d="M23 38C23 35 24 33 24 33C24 33 25 35 25 38" fill="rgba(249,115,22,0.6)" />
      <circle cx="24" cy="36" r="1" fill="rgba(250,204,21,0.7)" />
    </svg>
  );
}

/** Forest of Focus — trees + path */
function ForestScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Trees */}
      <path d="M10 38L16 20L22 38H10Z" fill="rgba(22,163,74,0.4)" />
      <path d="M26 38L32 16L38 38H26Z" fill="rgba(22,163,74,0.3)" />
      <path d="M16 38L22 22L28 38H16Z" fill="rgba(34,197,94,0.45)" />
      {/* Tree trunks */}
      <rect x="15" y="34" width="2" height="6" rx="0.5" fill="rgba(120,80,40,0.5)" />
      <rect x="31" y="32" width="2" height="8" rx="0.5" fill="rgba(120,80,40,0.5)" />
      <rect x="21" y="32" width="2" height="8" rx="0.5" fill="rgba(120,80,40,0.5)" />
      {/* Path */}
      <path d="M20 44Q24 38 28 44" stroke="rgba(194,175,140,0.4)" strokeWidth="2" fill="none" />
      {/* Fireflies */}
      <circle cx="12" cy="24" r="1" fill="rgba(250,204,21,0.6)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="36" cy="20" r="0.8" fill="rgba(250,204,21,0.5)">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** Ice Kingdom — icy mountains + snowflakes */
function IceKingdomScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Mountains */}
      <path d="M4 40L16 12L28 40H4Z" fill="rgba(147,197,253,0.3)" />
      <path d="M20 40L32 8L44 40H20Z" fill="rgba(191,219,254,0.35)" />
      {/* Snow caps */}
      <path d="M14 16L16 12L18 16Q16 15 14 16Z" fill="rgba(255,255,255,0.7)" />
      <path d="M30 12L32 8L34 12Q32 11 30 12Z" fill="rgba(255,255,255,0.7)" />
      {/* Snowflakes */}
      <circle cx="10" cy="20" r="1.2" fill="rgba(255,255,255,0.6)">
        <animate attributeName="cy" values="20;28;20" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="38" cy="16" r="0.8" fill="rgba(255,255,255,0.5)">
        <animate attributeName="cy" values="16;26;16" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="22" r="1" fill="rgba(255,255,255,0.5)">
        <animate attributeName="cy" values="22;30;22" dur="5s" repeatCount="indefinite" />
      </circle>
      {/* Castle spire */}
      <rect x="35" y="24" width="4" height="12" rx="0.5" fill="rgba(147,197,253,0.3)" />
      <path d="M34 24L37 18L40 24H34Z" fill="rgba(191,219,254,0.4)" />
    </svg>
  );
}

/** Desert of Logic — sand dunes + pyramids */
function DesertScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Sand dunes */}
      <path d="M0 40Q12 32 24 36Q36 30 48 40" fill="rgba(251,191,36,0.25)" />
      <path d="M0 44Q12 36 24 40Q36 34 48 44" fill="rgba(245,158,11,0.2)" />
      {/* Pyramid */}
      <path d="M16 38L24 14L32 38H16Z" fill="rgba(245,158,11,0.35)" stroke="rgba(245,158,11,0.5)" strokeWidth="0.8" />
      <path d="M24 14L32 38V38L24 30Z" fill="rgba(217,119,6,0.2)" />
      {/* Sun */}
      <circle cx="38" cy="10" r="4" fill="rgba(250,204,21,0.4)" />
      <circle cx="38" cy="10" r="6" fill="none" stroke="rgba(250,204,21,0.15)" strokeWidth="1" />
      {/* Small pyramid */}
      <path d="M6 38L10 28L14 38H6Z" fill="rgba(245,158,11,0.25)" />
    </svg>
  );
}

/** Volcano Peak — lava + erupting mountain */
function VolcanoScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Volcano shape */}
      <path d="M8 42L18 12H30L40 42H8Z" fill="rgba(239,68,68,0.2)" />
      <path d="M18 12H30L26 18H22L18 12Z" fill="rgba(239,68,68,0.35)" />
      {/* Lava glow */}
      <ellipse cx="24" cy="12" rx="4" ry="2" fill="rgba(249,115,22,0.4)">
        <animate attributeName="ry" values="2;3;2" dur="1.5s" repeatCount="indefinite" />
      </ellipse>
      {/* Lava streaks */}
      <path d="M22 18C20 26 16 34 14 42" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" fill="none" />
      <path d="M26 18C28 26 32 34 34 42" stroke="rgba(249,115,22,0.25)" strokeWidth="1" fill="none" />
      {/* Lava particles */}
      <circle cx="20" cy="8" r="1" fill="rgba(250,204,21,0.6)">
        <animate attributeName="cy" values="8;4;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="6" r="0.8" fill="rgba(249,115,22,0.7)">
        <animate attributeName="cy" values="6;2;6" dur="1.8s" repeatCount="indefinite" />
      </circle>
      {/* Smoke */}
      <circle cx="24" cy="6" r="3" fill="rgba(156,163,175,0.15)">
        <animate attributeName="cy" values="6;2;6" dur="3s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** Cyber City — circuit lines + buildings */
function CyberCityScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Buildings */}
      <rect x="6" y="20" width="6" height="22" rx="1" fill="rgba(99,102,241,0.25)" />
      <rect x="14" y="14" width="5" height="28" rx="1" fill="rgba(139,92,246,0.3)" />
      <rect x="21" y="18" width="6" height="24" rx="1" fill="rgba(99,102,241,0.2)" />
      <rect x="29" y="10" width="5" height="32" rx="1" fill="rgba(139,92,246,0.35)" />
      <rect x="36" y="22" width="6" height="20" rx="1" fill="rgba(99,102,241,0.25)" />
      {/* Windows (glowing dots) */}
      <circle cx="9" cy="24" r="0.8" fill="rgba(56,189,248,0.6)" />
      <circle cx="9" cy="28" r="0.8" fill="rgba(250,204,21,0.5)" />
      <circle cx="16.5" cy="18" r="0.8" fill="rgba(56,189,248,0.7)" />
      <circle cx="16.5" cy="22" r="0.8" fill="rgba(250,204,21,0.6)" />
      <circle cx="24" cy="22" r="0.8" fill="rgba(56,189,248,0.5)" />
      <circle cx="31.5" cy="14" r="0.8" fill="rgba(250,204,21,0.7)" />
      <circle cx="31.5" cy="18" r="0.8" fill="rgba(56,189,248,0.6)" />
      <circle cx="39" cy="26" r="0.8" fill="rgba(56,189,248,0.5)" />
      {/* Circuit lines */}
      <path d="M4 44H44" stroke="rgba(56,189,248,0.2)" strokeWidth="0.5" />
      <path d="M8 44V46" stroke="rgba(56,189,248,0.3)" strokeWidth="0.5" />
      <path d="M24 44V46" stroke="rgba(56,189,248,0.3)" strokeWidth="0.5" />
      <path d="M40 44V46" stroke="rgba(56,189,248,0.3)" strokeWidth="0.5" />
      {/* Antenna pulse */}
      <line x1="31.5" y1="10" x2="31.5" y2="6" stroke="rgba(139,92,246,0.5)" strokeWidth="0.8" />
      <circle cx="31.5" cy="5" r="1" fill="rgba(56,189,248,0.5)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** Sky Kingdom — clouds + floating islands */
function SkyKingdomScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Floating islands */}
      <ellipse cx="16" cy="30" rx="8" ry="3" fill="rgba(34,197,94,0.25)" />
      <ellipse cx="34" cy="22" rx="6" ry="2.5" fill="rgba(34,197,94,0.2)" />
      <path d="M10 30Q16 24 22 30" fill="rgba(34,197,94,0.3)" />
      <path d="M30 22Q34 18 40 22" fill="rgba(34,197,94,0.25)" />
      {/* Clouds */}
      <ellipse cx="12" cy="12" rx="5" ry="3" fill="rgba(255,255,255,0.2)">
        <animate attributeName="cx" values="12;16;12" dur="6s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="36" cy="8" rx="4" ry="2.5" fill="rgba(255,255,255,0.15)">
        <animate attributeName="cx" values="36;32;36" dur="5s" repeatCount="indefinite" />
      </ellipse>
      {/* Waterfall */}
      <path d="M16 33V42" stroke="rgba(147,197,253,0.4)" strokeWidth="1" strokeDasharray="1.5 1.5">
        <animate attributeName="stroke-dashoffset" values="0;-3" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/** Champion Castle — castle turrets */
function ChampionCastleScene({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Castle body */}
      <rect x="12" y="20" width="24" height="22" rx="1" fill="rgba(250,204,21,0.2)" />
      {/* Towers */}
      <rect x="10" y="14" width="6" height="28" rx="1" fill="rgba(250,204,21,0.25)" />
      <rect x="32" y="14" width="6" height="28" rx="1" fill="rgba(250,204,21,0.25)" />
      {/* Battlements */}
      <rect x="10" y="12" width="2" height="4" fill="rgba(250,204,21,0.3)" />
      <rect x="14" y="12" width="2" height="4" fill="rgba(250,204,21,0.3)" />
      <rect x="32" y="12" width="2" height="4" fill="rgba(250,204,21,0.3)" />
      <rect x="36" y="12" width="2" height="4" fill="rgba(250,204,21,0.3)" />
      {/* Gate */}
      <path d="M20 42V32Q24 28 28 32V42" fill="rgba(120,80,40,0.3)" />
      {/* Crown */}
      <path d="M18 8L20 4L24 7L28 4L30 8H18Z" fill="rgba(250,204,21,0.5)" />
      {/* Banner */}
      <rect x="22" y="20" width="4" height="6" rx="0.5" fill="rgba(239,68,68,0.3)" />
    </svg>
  );
}

const WORLD_THEMES: Record<string, WorldTheme> = {
  'training-camp': {
    gradientFrom: '#065F46',
    gradientVia: '#047857',
    gradientTo: '#10B981',
    accentColor: '#34D399',
    SvgScene: TrainingCampScene,
  },
  'forest-of-focus': {
    gradientFrom: '#14532D',
    gradientVia: '#166534',
    gradientTo: '#22C55E',
    accentColor: '#4ADE80',
    SvgScene: ForestScene,
  },
  'ice-kingdom': {
    gradientFrom: '#1E3A5F',
    gradientVia: '#1E40AF',
    gradientTo: '#60A5FA',
    accentColor: '#93C5FD',
    SvgScene: IceKingdomScene,
  },
  'desert-of-logic': {
    gradientFrom: '#78350F',
    gradientVia: '#92400E',
    gradientTo: '#F59E0B',
    accentColor: '#FBBF24',
    SvgScene: DesertScene,
  },
  'volcano-peak': {
    gradientFrom: '#7F1D1D',
    gradientVia: '#991B1B',
    gradientTo: '#EF4444',
    accentColor: '#F87171',
    SvgScene: VolcanoScene,
  },
  'cyber-city': {
    gradientFrom: '#312E81',
    gradientVia: '#4338CA',
    gradientTo: '#818CF8',
    accentColor: '#A5B4FC',
    SvgScene: CyberCityScene,
  },
  'sky-kingdom': {
    gradientFrom: '#0C4A6E',
    gradientVia: '#0369A1',
    gradientTo: '#38BDF8',
    accentColor: '#7DD3FC',
    SvgScene: SkyKingdomScene,
  },
  'champion-castle': {
    gradientFrom: '#713F12',
    gradientVia: '#A16207',
    gradientTo: '#FACC15',
    accentColor: '#FDE047',
    SvgScene: ChampionCastleScene,
  },
};

/**
 * Pure CSS/SVG world illustration. No external images needed.
 * Each world has a unique gradient + themed SVG scene.
 */
export function WorldIllustration({
  slug,
  className,
  size = 56,
}: {
  slug: string;
  className?: string;
  size?: number;
}) {
  const theme = WORLD_THEMES[slug] ?? WORLD_THEMES['training-camp'];
  const { SvgScene } = theme;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl shrink-0 flex items-center justify-center',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientVia}, ${theme.gradientTo})`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 70% 30%, ${theme.accentColor}40, transparent 60%)`,
        }}
      />
      {/* SVG scene */}
      <div className="relative z-10">
        <SvgScene size={size} />
      </div>
    </div>
  );
}
