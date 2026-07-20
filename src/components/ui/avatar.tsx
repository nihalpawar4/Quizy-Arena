import Image from 'next/image';
import { cn } from '@/lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: AvatarSize;
  showOnline?: boolean;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; pixels: number }> = {
  sm: { container: 'h-8 w-8', pixels: 32 },
  md: { container: 'h-10 w-10', pixels: 40 },
  lg: { container: 'h-14 w-14', pixels: 56 },
  xl: { container: 'h-16 w-16', pixels: 64 },
};

export function Avatar({
  src,
  alt,
  size = 'md',
  showOnline = false,
  className,
}: AvatarProps) {
  const { container, pixels } = sizeStyles[size];
  const initials = alt
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative shrink-0', container, className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={pixels}
          height={pixels}
          className="rounded-full object-cover h-full w-full"
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            'bg-primary-muted text-primary text-xs font-semibold',
            'h-full w-full',
          )}
        >
          {initials}
        </div>
      )}

      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full',
            'bg-success ring-2 ring-bg',
            size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
          )}
        />
      )}
    </div>
  );
}
