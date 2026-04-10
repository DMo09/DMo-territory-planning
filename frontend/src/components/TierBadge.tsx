import { cn, tierShortLabel, tierColor } from '../lib/utils';
import type { Tier } from '../types';

interface TierBadgeProps {
  tier: Tier | null;
  className?: string;
  size?: 'sm' | 'md';
}

export default function TierBadge({ tier, className, size = 'sm' }: TierBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        tierColor(tier),
        className
      )}
    >
      {tierShortLabel(tier)}
    </span>
  );
}
