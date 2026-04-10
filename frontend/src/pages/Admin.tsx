import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, Settings, Zap, Building2, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '../lib/api';
import type { IndustryConfig, Play } from '../types';
import { cn } from '../lib/utils';

export default function AdminPage() {
  const [industries, setIndustries] = useState<IndustryConfig[]>([]);
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIndustry, setNewIndustry] = useState('');
  const [newPlay, setNewPlay] = useState({ name: '', description: '', recommendedIndustries: '', recommendedTiers: '' });
  const [showPlayForm, setShowPlayForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.getIndustries(), adminApi.getPlays()])
      .then(([inds, pls]) => { setIndustries(inds); setPlays(pls); })
      .finally(() => setLoading(false));
  }, []);

  const handleAddIndustry = async () => {
    if (!newIndustry.trim()) return;
    setSaving(true);
    const ind = await adminApi.createIndustry({ name: newIndustry.trim(), isTarget: true });
    setIndustries(prev => [...prev, ind]);
    setNewIndustry('');
    setSaving(false);
  };

  const handleToggleTarget = async (ind: IndustryConfig) => {
    const updated = await adminApi.updateIndustry(ind.id, { isTarget: !ind.isTarget });
    setIndustries(prev => prev.map(i => i.id === ind.id ? updated : i));
  };

  const handleDeleteIndustry = async (id: string) => {
    if (!confirm('Delete this industry?')) return;
    await adminApi.deleteIndustry(id);
    setIndustries(prev => prev.filter(i => i.id !== id));
  };

  const handleAddPlay = async () => {
    if (!newPlay.name.trim() || !newPlay.description.trim()) return;
    setSaving(true);
    const play = await adminApi.createPlay({
      name: newPlay.name.trim(),
      description: newPlay.description.trim(),
      recommendedIndustries: newPlay.recommendedIndustries
        .split(',').map(s => s.trim()).filter(Boolean),
      recommendedTiers: newPlay.recommendedTiers
        .split(',').map(s => parseInt(s.trim())).filter(n => [1, 2, 3].includes(n)) as (1 | 2 | 3)[],
      isActive: true,
    });
    setPlays(prev => [...prev, play]);
    setNewPlay({ name: '', description: '', recommendedIndustries: '', recommendedTiers: '' });
    setShowPlayForm(false);
    setSaving(false);
  };

  const handleTogglePlay = async (play: Play) => {
    const updated = await adminApi.updatePlay(play.id, { isActive: !play.isActive });
    setPlays(prev => prev.map(p => p.id === play.id ? updated : p));
  };

  const handleDeletePlay = async (id: string) => {
    if (!confirm('Delete this play?')) return;
    await adminApi.deletePlay(id);
    setPlays(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={22} className="text-os-red" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage target industries and the plays playbook</p>
        </div>
      </div>

      {/* Industries */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Target Industries</h2>
          <span className="text-xs text-gray-400 ml-auto">
            Target industries qualify accounts for Tier 1 & Tier 2
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {industries.map(ind => (
            <div key={ind.id} className="flex items-center px-5 py-3 gap-3">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">{ind.name}</span>
              </div>
              <button
                onClick={() => handleToggleTarget(ind)}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                  ind.isTarget
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                {ind.isTarget ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {ind.isTarget ? 'Target' : 'Non-target'}
              </button>
              <button
                onClick={() => handleDeleteIndustry(ind.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 p-4 flex gap-2">
          <input
            type="text"
            value={newIndustry}
            onChange={e => setNewIndustry(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddIndustry()}
            placeholder="Add industry (e.g. Retail)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red"
          />
          <button
            onClick={handleAddIndustry}
            disabled={!newIndustry.trim() || saving}
            className="flex items-center gap-1.5 bg-os-red text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-os-red-dark transition-colors disabled:opacity-50"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </section>

      {/* Plays */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-os-red" />
            <h2 className="font-semibold text-gray-900">Plays Playbook</h2>
          </div>
          <button
            onClick={() => setShowPlayForm(true)}
            className="flex items-center gap-1.5 bg-os-red text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-os-red-dark transition-colors"
          >
            <Plus size={14} />
            Add Play
          </button>
        </div>

        {showPlayForm && (
          <div className="border-b border-gray-100 bg-gray-50 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">New Play</h3>
            <input
              type="text"
              placeholder="Play name (e.g. AI Transformation Play)"
              value={newPlay.name}
              onChange={e => setNewPlay(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red"
            />
            <textarea
              placeholder="Description — what is this play about, what problem does it solve?"
              value={newPlay.description}
              onChange={e => setNewPlay(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Recommended Industries (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Banking, Insurance, Healthcare"
                  value={newPlay.recommendedIndustries}
                  onChange={e => setNewPlay(p => ({ ...p, recommendedIndustries: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Recommended Tiers (comma-separated: 1, 2, 3)
                </label>
                <input
                  type="text"
                  placeholder="1, 2"
                  value={newPlay.recommendedTiers}
                  onChange={e => setNewPlay(p => ({ ...p, recommendedTiers: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPlayForm(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlay}
                disabled={!newPlay.name.trim() || !newPlay.description.trim() || saving}
                className="px-3 py-1.5 text-sm bg-os-red text-white rounded-lg hover:bg-os-red-dark disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Play'}
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {plays.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No plays yet. Add your first play to get started.
            </div>
          ) : plays.map(play => (
            <div key={play.id} className={cn('p-5', !play.isActive && 'opacity-50')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{play.name}</p>
                    {!play.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{play.description}</p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {play.recommendedIndustries.map(ind => (
                      <span key={ind} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{ind}</span>
                    ))}
                    {play.recommendedTiers.map(t => (
                      <span key={t} className={cn(
                        'text-xs px-2 py-0.5 rounded font-medium',
                        t === 1 ? 'bg-red-50 text-os-red' :
                        t === 2 ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      )}>Tier {t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePlay(play)}
                    className={cn(
                      'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                      play.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {play.isActive ? <Check size={13} /> : <X size={13} />}
                  </button>
                  <button
                    onClick={() => handleDeletePlay(play.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
