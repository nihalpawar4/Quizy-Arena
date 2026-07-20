/**
 * Empty State Illustrations
 *
 * Lightweight, theme-aware inline SVG illustrations for empty states.
 * All illustrations use currentColor and CSS variables for theming.
 * Consistent minimalist style across all illustrations.
 */

interface IllustrationProps {
  size?: number;
  className?: string;
}

/**
 * Two silhouettes with a connecting dotted line.
 * Used for: No friends.
 */
export function NoFriendsIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Left person */}
      <circle cx="35" cy="42" r="12" fill="var(--arena-primary-muted)" stroke="var(--arena-primary)" strokeWidth="1.5" />
      <path d="M20 78c0-8.284 6.716-15 15-15s15 6.716 15 15" stroke="var(--arena-primary)" strokeWidth="1.5" strokeLinecap="round" fill="var(--arena-primary-muted)" />
      {/* Right person */}
      <circle cx="85" cy="42" r="12" fill="var(--arena-accent-muted)" stroke="var(--arena-accent)" strokeWidth="1.5" />
      <path d="M70 78c0-8.284 6.716-15 15-15s15 6.716 15 15" stroke="var(--arena-accent)" strokeWidth="1.5" strokeLinecap="round" fill="var(--arena-accent-muted)" />
      {/* Connecting dotted line */}
      <path d="M47 50h26" stroke="var(--arena-text-disabled)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
      {/* Heart */}
      <path d="M57 46c0-2 2-4 3-4s3 2 3 4c0 3-3 5-3 6-0-1-3-3-3-6z" fill="var(--arena-danger)" opacity="0.4" />
    </svg>
  );
}

/**
 * Empty trophy shelf with sparkles.
 * Used for: No achievements.
 */
export function NoAchievementsIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Shelf */}
      <rect x="20" y="80" width="80" height="4" rx="2" fill="var(--arena-border)" />
      <rect x="24" y="84" width="3" height="16" rx="1.5" fill="var(--arena-border)" />
      <rect x="93" y="84" width="3" height="16" rx="1.5" fill="var(--arena-border)" />
      {/* Ghost trophy */}
      <path
        d="M50 68h20v12H50z"
        fill="var(--arena-card-hover)"
        stroke="var(--arena-border)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        rx="2"
      />
      <path
        d="M55 56h10v12H55z"
        fill="var(--arena-card-hover)"
        stroke="var(--arena-border)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        rx="2"
      />
      <circle cx="60" cy="50" r="6" fill="var(--arena-card-hover)" stroke="var(--arena-border)" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Sparkles */}
      <path d="M36 40l2-4 2 4-4-2 4 0" stroke="var(--arena-warning)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M82 36l1.5-3 1.5 3-3-1.5 3 0" stroke="var(--arena-warning)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <path d="M44 30l1-2 1 2-2-1 2 0" stroke="var(--arena-warning)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/**
 * Gamepad with Zzz symbols.
 * Used for: No recent games.
 */
export function NoRecentGamesIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Controller body */}
      <rect x="25" y="45" width="70" height="40" rx="12" fill="var(--arena-card-hover)" stroke="var(--arena-border)" strokeWidth="1.5" />
      {/* D-pad */}
      <rect x="38" y="58" width="12" height="4" rx="1" fill="var(--arena-text-disabled)" />
      <rect x="42" y="54" width="4" height="12" rx="1" fill="var(--arena-text-disabled)" />
      {/* Buttons */}
      <circle cx="76" cy="58" r="3" fill="var(--arena-primary-muted)" stroke="var(--arena-primary)" strokeWidth="1" opacity="0.5" />
      <circle cx="84" cy="62" r="3" fill="var(--arena-success-muted)" stroke="var(--arena-success)" strokeWidth="1" opacity="0.5" />
      <circle cx="76" cy="66" r="3" fill="var(--arena-danger-muted)" stroke="var(--arena-danger)" strokeWidth="1" opacity="0.5" />
      {/* Zzz */}
      <text x="72" y="38" fill="var(--arena-text-tertiary)" fontSize="14" fontWeight="700" opacity="0.6">z</text>
      <text x="80" y="30" fill="var(--arena-text-tertiary)" fontSize="11" fontWeight="700" opacity="0.4">z</text>
      <text x="86" y="24" fill="var(--arena-text-tertiary)" fontSize="9" fontWeight="700" opacity="0.25">z</text>
    </svg>
  );
}

/**
 * Bell with a checkmark (all clear!).
 * Used for: No notifications.
 */
export function NoNotificationsIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Bell */}
      <path
        d="M60 30c-11.046 0-20 8.954-20 20v14c0 2-4 6-4 6h48s-4-4-4-6V50c0-11.046-8.954-20-20-20z"
        fill="var(--arena-card-hover)"
        stroke="var(--arena-border)"
        strokeWidth="1.5"
      />
      {/* Clapper */}
      <path d="M54 70c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="var(--arena-border)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Checkmark circle */}
      <circle cx="78" cy="38" r="12" fill="var(--arena-success-muted)" stroke="var(--arena-success)" strokeWidth="1.5" />
      <path d="M72 38l4 4 8-8" stroke="var(--arena-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Open empty treasure chest.
 * Used for: No rewards.
 */
export function NoRewardsIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Chest body */}
      <rect x="28" y="58" width="64" height="32" rx="4" fill="var(--arena-card-hover)" stroke="var(--arena-border)" strokeWidth="1.5" />
      {/* Chest lid (open) */}
      <path
        d="M28 58h64l-4-20H32l-4 20z"
        fill="var(--arena-card-hover)"
        stroke="var(--arena-border)"
        strokeWidth="1.5"
      />
      {/* Lock */}
      <rect x="55" y="60" width="10" height="8" rx="2" fill="var(--arena-warning-muted)" stroke="var(--arena-warning)" strokeWidth="1" opacity="0.6" />
      {/* Sparkles suggesting emptiness */}
      <circle cx="45" cy="50" r="1.5" fill="var(--arena-text-disabled)" opacity="0.4" />
      <circle cx="60" cy="46" r="1" fill="var(--arena-text-disabled)" opacity="0.3" />
      <circle cx="75" cy="50" r="1.5" fill="var(--arena-text-disabled)" opacity="0.4" />
    </svg>
  );
}

/**
 * Clipboard with empty checklist.
 * Used for: No missions.
 */
export function NoMissionsIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Clipboard */}
      <rect x="32" y="30" width="56" height="70" rx="6" fill="var(--arena-card-hover)" stroke="var(--arena-border)" strokeWidth="1.5" />
      {/* Clip */}
      <rect x="48" y="24" width="24" height="14" rx="4" fill="var(--arena-surface)" stroke="var(--arena-border)" strokeWidth="1.5" />
      <circle cx="60" cy="31" r="2" fill="var(--arena-text-disabled)" />
      {/* Empty lines */}
      {[48, 60, 72, 84].map((y) => (
        <g key={y}>
          <rect x="42" y={y} width="8" height="8" rx="2" fill="none" stroke="var(--arena-border)" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="56" y={y + 2} width="24" height="4" rx="1" fill="var(--arena-card-hover)" stroke="var(--arena-border)" strokeWidth="0.5" strokeDasharray="3 2" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Magnifying glass with question mark.
 * Used for: No search results.
 */
export function NoSearchResultsIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Magnifying glass */}
      <circle cx="52" cy="52" r="22" fill="var(--arena-card-hover)" stroke="var(--arena-border)" strokeWidth="2" />
      <line x1="68" y1="68" x2="90" y2="90" stroke="var(--arena-border)" strokeWidth="3" strokeLinecap="round" />
      {/* Question mark */}
      <path
        d="M48 44c0-4.418 3.582-6 6-6s6 1.582 6 6c0 3-3 4-3 6"
        stroke="var(--arena-text-tertiary)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="54" cy="58" r="1.5" fill="var(--arena-text-tertiary)" />
    </svg>
  );
}

/**
 * Cloud with X mark.
 * Used for: Offline state.
 */
export function OfflineIllustration({ size = 120, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud */}
      <path
        d="M30 68c-5.523 0-10-4.477-10-10 0-4.632 3.149-8.528 7.422-9.67C28.37 41.008 35.38 35 44 35c7.127 0 13.178 4.612 15.327 11.011C60.858 44.732 62.858 44 65 44c6.627 0 12 5.373 12 12 0 .338-.014.673-.041 1.004C81.265 58.394 84 62.37 84 67c0 6.075-4.925 11-11 11H30z"
        fill="var(--arena-card-hover)"
        stroke="var(--arena-border)"
        strokeWidth="1.5"
      />
      {/* X mark */}
      <circle cx="55" cy="60" r="10" fill="var(--arena-danger-muted)" />
      <path d="M50 55l10 10M60 55l-10 10" stroke="var(--arena-danger)" strokeWidth="2" strokeLinecap="round" />
      {/* Signal waves */}
      <path d="M88 46c2 0 4 2 4 4" stroke="var(--arena-text-disabled)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M88 40c4 0 8 4 8 8" stroke="var(--arena-text-disabled)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}
