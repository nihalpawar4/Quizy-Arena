'use client';

import Image from 'next/image';
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
  useSkillSheet?: boolean;
}

/** Game / category icon — SVG set or skill-icons sheet crop. */
export function GameIcon({
  iconKey,
  color = '#3B82F6',
  size = 24,
  className,
  useSkillSheet = false,
}: GameIconProps) {
  if (useSkillSheet) {
    const index = ['brain', 'puzzle', 'target', 'lightning', 'eye', 'crystal', 'puzzle', 'target'].indexOf(
      iconKey,
    );
    const col = Math.max(0, index % 4);
    return (
      <div
        className={cn('relative overflow-hidden rounded-lg shrink-0', className)}
        style={{ width: size, height: size }}
      >
        <Image
          src="/illustrations/skill-icons.png"
          alt=""
          width={256}
          height={64}
          className="absolute max-w-none h-auto"
          style={{
            width: size * 4,
            left: -col * size,
            top: 0,
          }}
        />
      </div>
    );
  }

  const Icon = ICON_MAP[iconKey] ?? BrainIcon;
  return <Icon size={size} style={{ color }} className={className} />;
}

export function WorldIllustration({
  slug,
  className,
  size = 56,
}: {
  slug: string;
  className?: string;
  size?: number;
}) {
  const src =
    slug === 'training-camp'
      ? '/illustrations/world-training-camp.png'
      : slug === 'forest-of-focus'
        ? '/illustrations/world-forest.png'
        : '/illustrations/world-ice-kingdom.png';

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt="" width={size} height={size} className="h-full w-full object-cover" />
    </div>
  );
}
