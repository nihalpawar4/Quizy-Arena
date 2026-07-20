'use client';

/**
 * XP Ring — animated circular progress indicator
 * Shows XP progress toward next level
 */
export function XpRing({
  progress,
  level,
  size = 96,
  strokeWidth = 6,
}: {
  progress: number; // 0-100
  level: number;
  size?: number;
  strokeWidth?: number;
}) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--arena-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--arena-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-[var(--arena-ease-out)]"
        />
      </svg>
      {/* Level Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          LVL
        </span>
        <span className="text-xl font-bold text-text-primary leading-none">
          {level}
        </span>
      </div>
    </div>
  );
}
