import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, Trophy, Target, Zap, ChevronRight, Plus,
  X, AlertTriangle, Check, Search
} from 'lucide-react';
import { accountsApi, priorityApi, playSelectionsApi, adminApi } from '../lib/api';
import type { Account, PrioritySelection, Play, PlaySelection, PriorityBucket } from '../types';
import { cn, formatCurrency, formatRevenue } from '../lib/utils';
import TierBadge from '../components/TierBadge';

interface BucketConfig {
  key: PriorityBucket;
  label: string;
  subtitle: string;
  max: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  headerBg: string;
  description: string;
}

const BUCKETS: BucketConfig[] = [
  {
    key: 'big_bet',
    label: 'Big Bets',
    subtitle: '1–3 accounts',
    max: 3,
    icon: Star,
    color: 'text-os-red',
    headerBg: 'bg-os-red',
    description: 'Orchestrate the full team around these accounts for Art of the Possible demos with C-Suite.',
  },
  {
    key: 'win',
    label: '10 to Win',
    subtitle: '$100K+ ARR goal',
    max: 10,
    icon: Trophy,
    color: 'text-amber-600',
    headerBg: 'bg-amber-500',
    description: 'The 10 accounts you commit to generating ARR from this year.',
  },
  {
    key: 'break_into',
    label: '25 to Break Into',
    subtitle: 'New logos at any ARR',
    max: 25,
    icon: Target,
    color: 'text-blue-600',
    headerBg: 'bg-blue-500',
    description: '25 new logo accounts that will start using OutSystems this year.',
  },
];

export default function PrioritizePage() {
  const { planId } = useParams<{ planId: string }>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selections, setSelections] = useState<PrioritySelection[]>([]);
  const [plays, setPlays] = useState<Play[]>([]);
  const [playSelections, setPlaySelections] = useState<PlaySelection[]>([]);
  const [suggestions, setSuggestions] = useState<{
    bigBets: Account[]; win: Account[]; breakInto: Account[]; plays: Play[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<PriorityBucket>('big_bet');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    if (!planId) return;
    Promise.all([
      accountsApi.list(planId, { pageSize: 5000 }),
      priorityApi.list(planId),
      adminApi.getPlays(),
      playSelectionsApi.list(planId),
      accountsApi.getSuggestions(planId),
    ]).then(([accountsRes, sels, playsRes, playSels, sugg]) => {
      setAccounts(accountsRes.accounts);
      setSelections(sels);
      setPlays(playsRes);
      setPlaySelections(playSels);
      setSuggestions(sugg);
    }).finally(() => setLoading(false));
  }, [planId]);

  const getSelected = (bucket: PriorityBucket) =>
    selections.filter(s => s.bucket === bucket);

  const isSelected = (accountId: string, bucket?: PriorityBucket) =>
    selections.some(s => s.accountId === accountId && (!bucket || s.bucket === bucket));

  const handleAdd = async (account: Account, bucket: PriorityBucket) => {
    if (!planId) return;
    const current = getSelected(bucket);
    const config = BUCKETS.find(b => b.key === bucket)!;
    if (current.length >= config.max) return;

    // Big Bet mix warning
    if (bucket === 'big_bet') {
      const tier2Count = selections
        .filter(s => s.bucket === 'big_bet')
        .filter(s => accounts.find(a => a.id === s.accountId)?.tier === 2)
        .length;
      const isT2 = account.tier === 2;
      if (isT2 && tier2Count >= 1 && current.length >= 1) {
        setWarning(`You have ${tier2Count + 1} of ${current.length + 1} Big Bets as new logos (Tier 2). A mix of Tier 1 and Tier 2 is recommended.`);
      }
    }

    const sel = await priorityApi.add(planId, account.id, bucket);
    setSelections(prev => [...prev, { ...sel, account }]);
    setShowAccountPicker(false);
  };

  const handleRemove = async (selId: string) => {
    if (!planId) return;
    await priorityApi.remove(planId, selId);
    setSelections(prev => prev.filter(s => s.id !== selId));
  };

  const handleUpdateNotes = async (selId: string, notes: string) => {
    if (!planId) return;
    await priorityApi.update(planId, selId, { notes });
    setSelections(prev => prev.map(s => s.id === selId ? { ...s, notes } : s));
  };

  const handleAddPlay = async (play: Play) => {
    if (!planId) return;
    if (playSelections.length >= 5) return;
    if (playSelections.some(ps => ps.playId === play.id)) return;
    const sel = await playSelectionsApi.add(planId, play.id);
    setPlaySelections(prev => [...prev, { ...sel, play }]);
  };

  const handleRemovePlay = async (id: string) => {
    if (!planId) return;
    await playSelectionsApi.remove(planId, id);
    setPlaySelections(prev => prev.filter(ps => ps.id !== id));
  };

  const filteredAccounts = accounts.filter(a =>
    a.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>;
  }

  const activeBucketConfig = BUCKETS.find(b => b.key === activeBucket)!;
  const activeSelections = getSelected(activeBucket);

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prioritize Your Territory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Select Big Bets, commitments, and plays — app suggestions are pre-loaded, adjust as needed
          </p>
        </div>
        <Link
          to={`/plans/${planId}/dashboard`}
          className="flex items-center gap-2 bg-os-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-os-red-dark transition-colors"
        >
          View Dashboard
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Warning */}
      {warning && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm text-amber-800">{warning}</div>
          <button onClick={() => setWarning('')} className="text-amber-500 hover:text-amber-700">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bucket tabs */}
        <div className="lg:col-span-1 space-y-2">
          {BUCKETS.map(bucket => {
            const count = getSelected(bucket.key).length;
            const Icon = bucket.icon;
            return (
              <button
                key={bucket.key}
                onClick={() => setActiveBucket(bucket.key)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  activeBucket === bucket.key
                    ? 'border-os-red bg-red-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-lg', activeBucket === bucket.key ? 'bg-os-red' : 'bg-gray-100')}>
                      <Icon size={15} className={activeBucket === bucket.key ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <span className={cn('font-semibold text-sm', activeBucket === bucket.key ? 'text-os-red' : 'text-gray-700')}>
                      {bucket.label}
                    </span>
                  </div>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    count >= bucket.max
                      ? 'bg-green-100 text-green-700'
                      : activeBucket === bucket.key
                        ? 'bg-os-red/10 text-os-red'
                        : 'bg-gray-100 text-gray-500'
                  )}>
                    {count}/{bucket.max}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-9">{bucket.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Active bucket detail */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Bucket header */}
            <div className={cn('px-5 py-4', activeBucketConfig.headerBg)}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white text-base">{activeBucketConfig.label}</h2>
                  <p className="text-xs text-white/80 mt-0.5">{activeBucketConfig.description}</p>
                </div>
                <span className="text-white/90 text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                  {activeSelections.length}/{activeBucketConfig.max}
                </span>
              </div>
            </div>

            {/* Selected accounts */}
            <div className="divide-y divide-gray-100">
              {activeSelections.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm mb-3">No accounts selected yet</p>
                  {suggestions && (
                    <p className="text-xs text-gray-400">
                      {activeBucket === 'big_bet' && suggestions.bigBets.length > 0
                        ? `${suggestions.bigBets.length} accounts suggested below`
                        : ''}
                    </p>
                  )}
                </div>
              ) : (
                activeSelections.map(sel => {
                  const account = accounts.find(a => a.id === sel.accountId);
                  if (!account) return null;
                  return (
                    <div key={sel.id} className="p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 truncate">{account.accountName}</span>
                          <TierBadge tier={account.tier} size="sm" />
                          {account.aiSignal && (
                            <span className="flex items-center gap-0.5 text-xs text-green-600">
                              <Zap size={11} />AI signal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{account.normalizedIndustry || account.industry}</span>
                          <span>Rev: {formatRevenue(account.annualRevenue)}</span>
                          {account.arr > 0 && <span>ARR: {formatCurrency(account.arr)}</span>}
                          {account.pipelineArr > 0 && <span className="text-blue-600">Pipeline: {formatCurrency(account.pipelineArr)}</span>}
                        </div>
                        <input
                          type="text"
                          placeholder="Add notes (POV direction, strategy...)"
                          defaultValue={sel.notes}
                          onBlur={e => handleUpdateNotes(sel.id, e.target.value)}
                          className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-os-red text-gray-600 placeholder-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => handleRemove(sel.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add button */}
            {activeSelections.length < activeBucketConfig.max && (
              <div className="border-t border-gray-100 p-3">
                <button
                  onClick={() => setShowAccountPicker(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-os-red hover:bg-red-50 rounded-lg border border-dashed border-gray-300 hover:border-os-red/40 transition-all"
                >
                  <Plus size={15} />
                  Add account ({activeBucketConfig.max - activeSelections.length} remaining)
                </button>
              </div>
            )}

            {/* AI Suggestions */}
            {suggestions && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  App Suggestions
                </p>
                <div className="space-y-2">
                  {(activeBucket === 'big_bet' ? suggestions.bigBets :
                    activeBucket === 'win' ? suggestions.win :
                    suggestions.breakInto
                  ).slice(0, 5).map(account => (
                    <div key={account.id} className="flex items-center gap-3 py-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 truncate">{account.accountName}</span>
                          <TierBadge tier={account.tier} size="sm" />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {account.normalizedIndustry || account.industry} · {formatRevenue(account.annualRevenue)}
                          {account.pipelineArr > 0 && ` · Pipeline: ${formatCurrency(account.pipelineArr)}`}
                        </p>
                      </div>
                      {isSelected(account.id, activeBucket) ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Check size={13} /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAdd(account, activeBucket)}
                          disabled={activeSelections.length >= activeBucketConfig.max}
                          className="text-xs text-os-red font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plays section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 bg-os-navy">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Zap size={16} className="text-os-red" />
                The Plays
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                3–5 plays to generate meetings and pipeline based on customer needs
              </p>
            </div>
            <span className="text-white/90 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
              {playSelections.length}/5
            </span>
          </div>
        </div>

        <div className="p-5">
          {/* Selected plays */}
          {playSelections.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No plays selected. Choose from the playbook below.</p>
          ) : (
            <div className="grid gap-3 mb-5">
              {playSelections.map(ps => {
                const play = plays.find(p => p.id === ps.playId) || ps.play;
                if (!play) return null;
                return (
                  <div key={ps.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <Zap size={16} className="text-os-red mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{play.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{play.description}</p>
                      <input
                        type="text"
                        placeholder="Add notes..."
                        defaultValue={ps.notes}
                        onBlur={async e => {
                          if (!planId) return;
                          await playSelectionsApi.update(planId, ps.id, { notes: e.target.value });
                        }}
                        className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-os-red text-gray-600 placeholder-gray-400"
                      />
                    </div>
                    <button
                      onClick={() => handleRemovePlay(ps.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Playbook */}
          {playSelections.length < 5 && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Playbook</p>
              <div className="grid gap-2">
                {plays.filter(p => p.isActive).map(play => {
                  const already = playSelections.some(ps => ps.playId === play.id);
                  const isSuggested = suggestions?.plays.some(sp => sp.id === play.id);
                  return (
                    <div
                      key={play.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        already ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-800">{play.name}</p>
                          {isSuggested && (
                            <span className="text-xs bg-os-red/10 text-os-red px-1.5 py-0.5 rounded font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{play.description}</p>
                        {play.recommendedIndustries.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {play.recommendedIndustries.map(ind => (
                              <span key={ind} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {ind}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {already ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium flex-shrink-0">
                          <Check size={13} /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddPlay(play)}
                          className="text-xs text-os-red font-medium hover:underline flex-shrink-0"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account picker modal */}
      {showAccountPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add to {activeBucketConfig.label}</h3>
              <button onClick={() => setShowAccountPicker(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-os-red"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredAccounts.slice(0, 100).map(account => {
                const already = isSelected(account.id, activeBucket);
                return (
                  <button
                    key={account.id}
                    onClick={() => !already && handleAdd(account, activeBucket)}
                    disabled={already || activeSelections.length >= activeBucketConfig.max}
                    className={cn(
                      'w-full text-left px-5 py-3 border-b border-gray-50 transition-colors',
                      already ? 'bg-green-50 cursor-default' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm truncate">{account.accountName}</span>
                          <TierBadge tier={account.tier} size="sm" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {account.normalizedIndustry || account.industry} · Rev: {formatRevenue(account.annualRevenue)}
                          {account.arr > 0 && ` · ARR: ${formatCurrency(account.arr)}`}
                        </p>
                      </div>
                      {already ? (
                        <Check size={15} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Plus size={15} className="text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
