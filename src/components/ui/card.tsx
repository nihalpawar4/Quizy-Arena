import { cn } from '@/lib/utils';

type CardVariant = 'primary' | 'secondary' | 'tertiary';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  padded?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  primary: [
    'bg-surface border border-primary/20',
    'bg-gradient-to-br from-primary-muted/60 via-surface to-surface',
    'shadow-sm',
  ].join(' '),
  secondary: 'bg-surface border border-border shadow-sm',
  tertiary: 'bg-card-hover/50',
};

export function Card({
  variant = 'secondary',
  hoverable = false,
  padded = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200 ease-[var(--arena-ease-out)]',
        variantStyles[variant],
        padded && 'p-4',
        hoverable && 'cursor-pointer arena-card-lift',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-text-primary', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-text-secondary line-clamp-2', className)}
      {...props}
    >
      {children}
    </p>
  );
}
