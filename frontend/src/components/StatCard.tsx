import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  color?: 'red' | 'amber' | 'gray' | 'blue' | 'green';
  className?: string;
}

const colorMap = {
  red: 'border-t-os-red',
  amber: 'border-t-amber-500',
  gray: 'border-t-gray-400',
  blue: 'border-t-blue-500',
  green: 'border-t-green-500',
};

export default function StatCard({ label, value, sub, color, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-lg p-4 border border-gray-200 border-t-2',
      color ? colorMap[color] : 'border-t-gray-200',
      className
    )}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
