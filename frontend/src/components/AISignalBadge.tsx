import { Zap, ZapOff, Loader2, Clock, AlertCircle } from 'lucide-react';
import { cn, aiStatusLabel, aiStatusColor, timeAgo } from '../lib/utils';
import type { AISignalStatus } from '../types';

interface AISignalBadgeProps {
  status: AISignalStatus;
  summary?: string | null;
  searchedAt?: string | null;
  className?: string;
}

const icons = {
  pending: Clock,
  searching: Loader2,
  found: Zap,
  not_found: ZapOff,
  error: AlertCircle,
};

export default function AISignalBadge({ status, summary, searchedAt, className }: AISignalBadgeProps) {
  const Icon = icons[status];
  return (
    <div className={cn('flex items-start gap-1.5', className)}>
      <Icon
        size={14}
        className={cn('mt-0.5 flex-shrink-0', aiStatusColor(status), status === 'searching' && 'animate-spin')}
      />
      <div className="min-w-0">
        <span className={cn('text-xs font-medium', aiStatusColor(status))}>
          {aiStatusLabel(status)}
        </span>
        {summary && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{summary}</p>
        )}
        {searchedAt && status !== 'searching' && (
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(searchedAt)}</p>
        )}
      </div>
    </div>
  );
}
