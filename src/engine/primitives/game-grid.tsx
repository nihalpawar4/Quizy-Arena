import { cn } from '@/lib/utils';

interface GameGridProps {
  cols: number;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * GameGrid — Responsive grid layout for game items.
 * Automatically centers content and adapts gap.
 */
export function GameGrid({
  cols,
  gap = 8,
  children,
  className,
}: GameGridProps) {
  return (
    <div
      className={cn(
        'grid place-items-center w-full max-w-md mx-auto p-4',
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}
