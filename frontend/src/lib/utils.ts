import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Tier, AISignalStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value == null) return '—';
  if (value === 0) return '$0';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatRevenue(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export function tierLabel(tier: Tier | null): string {
  if (!tier) return 'Pending';
  return { 1: 'Tier 1 — Strategic', 2: 'Tier 2 — Observe', 3: 'Tier 3 — Nurture' }[tier];
}

export function tierShortLabel(tier: Tier | null): string {
  if (!tier) return 'Pending';
  return { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' }[tier];
}

export function tierColor(tier: Tier | null): string {
  if (!tier) return 'bg-gray-100 text-gray-500';
  return {
    1: 'bg-red-100 text-os-red border border-red-200',
    2: 'bg-amber-100 text-amber-700 border border-amber-200',
    3: 'bg-gray-100 text-gray-600 border border-gray-200',
  }[tier];
}

export function aiStatusLabel(status: AISignalStatus): string {
  return {
    pending: 'Not searched',
    searching: 'Searching...',
    found: 'AI signals found',
    not_found: 'No signals found',
    error: 'Search error',
  }[status];
}

export function aiStatusColor(status: AISignalStatus): string {
  return {
    pending: 'text-gray-400',
    searching: 'text-blue-500',
    found: 'text-green-600',
    not_found: 'text-gray-500',
    error: 'text-red-500',
  }[status];
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}
