import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Trophy, Target, Zap, BarChart3, Users, Edit3 } from 'lucide-react';
import { accountsApi, priorityApi, playSelectionsApi, plansApi } from '../lib/api';
import type { Account, TerritoryPlan, PrioritySelection, PlaySelection } from '../types';
import { cn, formatCurrency, formatRevenue } from '../lib/utils';
import TierBadge from '../components/TierBadge';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<TerritoryPlan | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selections, setSelections] = useState<PrioritySelection[]>([]);
  const [playSelections, setPlaySelections] = useState<PlaySelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) return;
    Promise.all([
      plansApi.get(planId),
      accountsApi.list(planId, { pageSize: 5000 }),
      priorityApi.list(planId),
      playSelectionsApi.list(planId),
    ]).then(([p, accs, sels, playSels]) => {
      setPlan(p);
      setAccounts(accs.accounts);
      setSelections(sels);
      setPlaySelections(playSels);
    }).finally(() => setLoading(false));
  }, [planId]);

  if (loading || !plan) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>;
  }

  const tier1 = accounts.filter(a => a.tier === 1);
  const tier2 = accounts.filter(a => a.tier === 2);
  const tier3 = accounts.filter(a => a.tier === 3);
  const pending = accounts.filter(a => !a.tier);

  const bigBets = selections.filter(s => s.bucket === 'big_bet');
  const wins = selections.filter(s => s.bucket === 'win');
  const breakIntos = selections.filter(s => s.bucket === 'break_into');

  const getAccount = (id: string) => accounts.find(a => a.id === id);

  // Industry breakdown
  const byIndustry = accounts.reduce((acc, a) => {
    const ind = a.normalizedIndustry || a.industry || 'Unknown';
    if (!acc[ind]) acc[ind] = { t1: 0, t2: 0, t3: 0, total: 0 };
    acc[ind].total++;
    if (a.tier === 1) acc[ind].t1++;
    else if (a.tier === 2) acc[ind].t2++;
    else if (a.tier === 3) acc[ind].t3++;
    return acc;
  }, {} as Record<string, { t1: number; t2: number; t3: number; total: number }>);

  const topIndustries = Object.entries(byIndustry)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      {/* Plan header */}
      <div className="bg-os-navy rounded-xl p-5 mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-white">{plan.aeName}'s Territory Plan</h1>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              plan.aeType === 'commercial' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
            )}>
              {plan.aeType === 'commercial' ? 'Commercial AE' : 'Enterprise AE'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {plan.rsdName && <span className="flex items-center gap-1"><Users size={11} />RSD: {plan.rsdName}</span>}
            {plan.rvpName && <span>RVP: {plan.rvpName}</span>}
            {plan.svpName && <span>SVP: {plan.svpName}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/plans/${planId}/enrich`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-os-navy-surface border border-gray-600 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            <BarChart3 size={13} />
            Enrich
          </Link>
          <Link
            to={`/plans/${planId}/prioritize`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-os-red text-white rounded-lg text-xs font-medium hover:bg-os-red-dark transition-colors"
          >
            <Edit3 size={13} />
            Edit Priorities
          </Link>
        </div>
      </div>

      {/* Tier stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tier 1 — Strategic" value={tier1.length} color="red" sub={`of ${accounts.length} accounts`} />
        <StatCard label="Tier 2 — Observe" value={tier2.length} color="amber" sub="Foot in Door" />
        <StatCard label="Tier 3 — Nurture" value={tier3.length} color="gray" sub="Long game" />
        <StatCard label="Pending" value={pending.length} color="blue" sub="Need AI signal" />
      </div>

      {/* Priority panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Big Bets */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-os-red px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-white" />
              <span className="font-bold text-white text-sm">Big Bets</span>
            </div>
            <span className="text-white/80 text-xs">{bigBets.length}/3</span>
          </div>
          <div className="divide-y divide-gray-100">
            {bigBets.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">None selected</div>
            ) : bigBets.map(sel => {
              const acc = getAccount(sel.accountId);
              if (!acc) return null;
              return (
                <div key={sel.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{acc.accountName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <TierBadge tier={acc.tier} size="sm" />
                        {acc.aiSignal && <Zap size={11} className="text-green-500" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {acc.normalizedIndustry || acc.industry} · {formatRevenue(acc.annualRevenue)}
                      </p>
                      {sel.notes && (
                        <p className="text-xs text-gray-600 mt-1.5 italic border-l-2 border-os-red pl-2">{sel.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 10 to Win */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-amber-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-white" />
              <span className="font-bold text-white text-sm">10 to Win</span>
            </div>
            <span className="text-white/80 text-xs">{wins.length}/10</span>
          </div>
          <div className="divide-y divide-gray-100">
            {wins.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">None selected</div>
            ) : wins.map((sel, i) => {
              const acc = getAccount(sel.accountId);
              if (!acc) return null;
              return (
                <div key={sel.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{acc.accountName}</p>
                    <p className="text-xs text-gray-500">
                      {formatRevenue(acc.annualRevenue)}
                      {acc.arr > 0 && ` · ARR ${formatCurrency(acc.arr)}`}
                      {acc.pipelineArr > 0 && ` · Pipe ${formatCurrency(acc.pipelineArr)}`}
                    </p>
                  </div>
                  <TierBadge tier={acc.tier} size="sm" />
                </div>
              );
            })}
          </div>
        </div>

        {/* 25 to Break Into */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-blue-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-white" />
              <span className="font-bold text-white text-sm">25 to Break Into</span>
            </div>
            <span className="text-white/80 text-xs">{breakIntos.length}/25</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {breakIntos.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">None selected</div>
            ) : breakIntos.map((sel, i) => {
              const acc = getAccount(sel.accountId);
              if (!acc) return null;
              return (
                <div key={sel.id} className="px-4 py-2 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-xs truncate">{acc.accountName}</p>
                    <p className="text-xs text-gray-400">{acc.normalizedIndustry || acc.industry}</p>
                  </div>
                  <TierBadge tier={acc.tier} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plays */}
      {playSelections.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="bg-os-navy px-4 py-3 flex items-center gap-2">
            <Zap size={16} className="text-os-red" />
            <span className="font-bold text-white text-sm">The Plays ({playSelections.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
            {playSelections.map(ps => {
              const play = ps.play;
              if (!play) return null;
              return (
                <div key={ps.id} className="bg-white p-4">
                  <p className="font-semibold text-gray-900 text-sm">{play.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{play.description}</p>
                  {ps.notes && (
                    <p className="text-xs text-os-red mt-2 italic">{ps.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Industry breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Accounts by Industry</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Industry</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-os-red">Tier 1</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-amber-600">Tier 2</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Tier 3</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topIndustries.map(([ind, counts]) => (
                <tr key={ind} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{ind}</td>
                  <td className="px-4 py-2.5 text-center">
                    {counts.t1 > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-os-red text-xs font-bold rounded-full">{counts.t1}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {counts.t2 > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{counts.t2}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {counts.t3 > 0 ? (
                      <span className="text-xs text-gray-500">{counts.t3}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-700">{counts.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
