import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search, Zap, ChevronRight, Filter, RefreshCw,
  CheckSquare, Square, PlayCircle
} from 'lucide-react';
import { accountsApi } from '../lib/api';
import type { Account } from '../types';
import { cn, formatCurrency, formatRevenue } from '../lib/utils';
import TierBadge from '../components/TierBadge';
import AISignalBadge from '../components/AISignalBadge';
import StatCard from '../components/StatCard';

const TIER_FILTERS = [
  { value: '', label: 'All Tiers' },
  { value: '1', label: 'Tier 1 — Strategic' },
  { value: '2', label: 'Tier 2 — Observe' },
  { value: '3', label: 'Tier 3 — Nurture' },
  { value: 'pending', label: 'Pending AI Search' },
];

export default function EnrichPage() {
  const { planId } = useParams<{ planId: string }>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tierFilter, setTierFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);

  const PAGE_SIZE = 50;

  const loadAccounts = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const result = await accountsApi.list(planId, {
        tier: tierFilter && tierFilter !== 'pending' ? parseInt(tierFilter) : undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setAccounts(result.accounts);
      setTotal(result.total);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [planId, tierFilter, search, page]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const tierStats = accounts.reduce((acc, a) => {
    const key = a.tier ? `tier${a.tier}` : 'pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSearchAI = async (accountId: string) => {
    if (!planId) return;
    setSearching(s => new Set(s).add(accountId));
    try {
      const updated = await accountsApi.searchAiSignal(planId, accountId);
      setAccounts(prev => prev.map(a => a.id === accountId ? updated : a));
    } finally {
      setSearching(s => { const n = new Set(s); n.delete(accountId); return n; });
    }
  };

  const handleSearchSelected = async () => {
    if (!planId || selected.size === 0) return;
    const ids = Array.from(selected);
    ids.forEach(id => setSearching(s => new Set(s).add(id)));
    setSelected(new Set());
    try {
      await accountsApi.searchAiSignalBatch(planId, ids);
      await loadAccounts();
    } finally {
      ids.forEach(id => setSearching(s => { const n = new Set(s); n.delete(id); return n; }));
    }
  };

  const handleSearchNext50 = async () => {
    if (!planId) return;
    setBatchRunning(true);
    try {
      await accountsApi.searchAiSignalNext50(planId);
      await loadAccounts();
    } finally {
      setBatchRunning(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === accounts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(accounts.map(a => a.id)));
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Enrich & Tier Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} accounts — run AI signal search to complete tiering
          </p>
        </div>
        <Link
          to={`/plans/${planId}/prioritize`}
          className="flex items-center gap-2 bg-os-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-os-red-dark transition-colors"
        >
          Next: Prioritize
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tier 1 — Strategic" value={tierStats.tier1 || 0} color="red" sub="Land & Expand" />
        <StatCard label="Tier 2 — Observe" value={tierStats.tier2 || 0} color="amber" sub="Foot in Door" />
        <StatCard label="Tier 3 — Nurture" value={tierStats.tier3 || 0} color="gray" sub="Long game" />
        <StatCard label="Pending AI Search" value={tierStats.pending || 0} color="blue" sub="Need signal check" />
      </div>

      {/* AI Search controls */}
      <div className="bg-os-navy rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-white">
          <Zap size={16} className="text-os-red" />
          <span className="text-sm font-medium">AI Signal Search</span>
        </div>
        <div className="flex-1 text-xs text-gray-400">
          Searches public sources for AI transformation signals per company
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleSearchSelected}
              className="flex items-center gap-1.5 bg-os-red text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-os-red-dark transition-colors"
            >
              <Search size={13} />
              Search {selected.size} selected
            </button>
          )}
          <button
            onClick={handleSearchNext50}
            disabled={batchRunning}
            className="flex items-center gap-1.5 bg-os-navy-surface border border-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-os-navy-light transition-colors disabled:opacity-50"
          >
            <PlayCircle size={13} className={batchRunning ? 'animate-spin' : ''} />
            {batchRunning ? 'Running...' : 'Search Next 50'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-os-red"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-gray-400" />
          {TIER_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setTierFilter(f.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                tierFilter === f.value
                  ? 'bg-os-red text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={loadAccounts}
          className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Account table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left w-8">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                    {selected.size === accounts.length && accounts.length > 0
                      ? <CheckSquare size={16} className="text-os-red" />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Account</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Industry</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Tier</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">Co. Revenue</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">ARR</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">Pipeline</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">AI Signal</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No accounts found
                  </td>
                </tr>
              ) : accounts.map(account => (
                <tr
                  key={account.id}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    selected.has(account.id) && 'bg-red-50'
                  )}
                >
                  <td className="px-3 py-3">
                    <button onClick={() => toggleSelect(account.id)} className="text-gray-400 hover:text-os-red">
                      {selected.has(account.id)
                        ? <CheckSquare size={16} className="text-os-red" />
                        : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900 max-w-[220px] truncate">{account.accountName}</p>
                    {account.billingState && (
                      <p className="text-xs text-gray-400">{account.billingState}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-gray-700 max-w-[140px] truncate">{account.normalizedIndustry || account.industry}</p>
                  </td>
                  <td className="px-3 py-3">
                    <TierBadge tier={account.tier} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn(
                      'font-medium',
                      account.annualRevenue && account.annualRevenue >= 500_000_000
                        ? 'text-gray-900' : 'text-gray-400'
                    )}>
                      {formatRevenue(account.annualRevenue)}
                    </span>
                    {account.annualRevenueSource && (
                      <p className="text-xs text-gray-400">via web</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn('font-medium', account.arr > 0 ? 'text-green-700' : 'text-gray-400')}>
                      {account.arr > 0 ? formatCurrency(account.arr) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn('font-medium', account.pipelineArr > 0 ? 'text-blue-700' : 'text-gray-400')}>
                      {account.pipelineArr > 0 ? formatCurrency(account.pipelineArr) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <AISignalBadge
                      status={searching.has(account.id) ? 'searching' : account.aiSignalStatus}
                      summary={account.aiSignalSummary}
                      searchedAt={account.aiSignalSearchedAt}
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleSearchAI(account.id)}
                      disabled={searching.has(account.id)}
                      title="Run AI signal search for this account"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-os-red hover:bg-red-50 transition-colors disabled:opacity-30"
                    >
                      <Zap size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= total}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
