/**
 * Premium SVG Icon Set for Quizy Arena
 *
 * Replaces emojis with consistent, custom icons.
 * All icons accept className and size props.
 */

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function BrainIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 2C9.5 2 7.5 3.5 7 5.5C5 6 3.5 8 3.5 10.5C3.5 12.5 4.5 14 6 15C6 16.5 7 18 8.5 18.5C9.5 19.5 10.5 20 12 20C13.5 20 14.5 19.5 15.5 18.5C17 18 18 16.5 18 15C19.5 14 20.5 12.5 20.5 10.5C20.5 8 19 6 17 5.5C16.5 3.5 14.5 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
      <path d="M7.5 8.5C8.5 8 9.5 8 10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16.5 8.5C15.5 8 14.5 8 14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function TargetIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

export function LightningIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M13 2L4.5 13H12L11 22L19.5 11H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ShieldIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 3L4 7V12C4 16.42 7.42 20.34 12 21.5C16.58 20.34 20 16.42 20 12V7L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function PuzzleIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M4 14H6.5C7.33 14 8 13.33 8 12.5C8 11.67 7.33 11 6.5 11H4V7C4 5.9 4.9 5 6 5H10V6.5C10 7.33 10.67 8 11.5 8C12.33 8 13 7.33 13 6.5V5H18C19.1 5 20 5.9 20 7V11H18.5C17.67 11 17 11.67 17 12.5C17 13.33 17.67 14 18.5 14H20V18C20 19.1 19.1 20 18 20H14V18.5C14 17.67 13.33 17 12.5 17C11.67 17 11 17.67 11 18.5V20H6C4.9 20 4 19.1 4 18V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function EyeIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M2.5 12C2.5 12 6 5 12 5C18 5 21.5 12 21.5 12C21.5 12 18 19 12 19C6 19 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function CrystalIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M6 3H18L21 9L12 21L3 9L6 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 21L9 9L12 3L15 9L12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export function SwordsIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M5 20L10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M19 4L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M19 20L14 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 4L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14.5 14.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function TreasureIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <rect x="3" y="10" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 14H21" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 10V8C5 5.79 7.24 4 12 4C16.76 4 19 5.79 19 8V10" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
    </svg>
  );
}

export function CrownIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M3 18H21V20H3V18Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M3 18L5 8L9 12L12 4L15 12L19 8L21 18H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export function FlameIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 2C12 2 7 8 7 13C7 16.31 9.24 19 12 19C14.76 19 17 16.31 17 13C17 8 12 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 19C10.5 19 9.5 17.5 9.5 16C9.5 13.5 12 11 12 11C12 11 14.5 13.5 14.5 16C14.5 17.5 13.5 19 12 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function CoinIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 9.5C15 9.5 14 8.5 12 8.5C10 8.5 9 9.5 9 10.5C9 11.5 10 12.5 12 12.5C14 12.5 15 13.5 15 14.5C15 15.5 14 16.5 12 16.5C10 16.5 9 15.5 9 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function DiamondIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M6 3H18L22 9L12 21L2 9L6 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 9H22" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 21L9 9L12 3L15 9L12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export function StarFilledIcon({ className, size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  );
}
