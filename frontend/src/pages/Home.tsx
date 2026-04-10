import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Users, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { plansApi } from '../lib/api';
import type { TerritoryPlan, AEType } from '../types';
import { cn } from '../lib/utils';

const AE_TYPE_LABELS: Record<AEType, string> = {
  commercial: 'Commercial',
  enterprise: 'Enterprise',
};

export default function Home() {
  const [plans, setPlans] = useState<TerritoryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    aeName: '',
    aeType: 'commercial' as AEType,
    rsdName: '',
    rvpName: '',
    svpName: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    plansApi.list()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.aeName.trim()) return;
    setCreating(true);
    try {
      const plan = await plansApi.create(form);
      setPlans(prev => [plan, ...prev]);
      setShowCreate(false);
      setForm({ aeName: '', aeType: 'commercial', rsdName: '', rvpName: '', svpName: '' });
    } catch {
      alert('Failed to create plan. Is the server running?');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this territory plan?')) return;
    await plansApi.delete(id).catch(() => null);
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Territory Plans</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and review account territory plans for your team
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-os-red hover:bg-os-red-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Territory Plan
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Territory Plan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter team hierarchy details — this enables future rollup dashboards
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">AE Name *</label>
                  <input
                    type="text"
                    value={form.aeName}
                    onChange={e => setForm(f => ({ ...f, aeName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red focus:border-transparent"
                    placeholder="Account Executive name"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">AE Type *</label>
                  <div className="flex gap-2">
                    {(['commercial', 'enterprise'] as AEType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(f => ({ ...f, aeType: type }))}
                        className={cn(
                          'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                          form.aeType === type
                            ? 'bg-os-red border-os-red text-white'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        )}
                      >
                        {AE_TYPE_LABELS[type]}
                        <span className="block text-xs font-normal opacity-75">
                          {type === 'commercial' ? '~5,000 accounts' : '~500 accounts'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">RSD Name</label>
                  <input
                    type="text"
                    value={form.rsdName}
                    onChange={e => setForm(f => ({ ...f, rsdName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red focus:border-transparent"
                    placeholder="Regional Sales Director"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">RVP Name</label>
                  <input
                    type="text"
                    value={form.rvpName}
                    onChange={e => setForm(f => ({ ...f, rvpName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red focus:border-transparent"
                    placeholder="Regional Vice President"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SVP Name</label>
                  <input
                    type="text"
                    value={form.svpName}
                    onChange={e => setForm(f => ({ ...f, svpName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red focus:border-transparent"
                    placeholder="Senior Vice President"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.aeName.trim() || creating}
                className="px-4 py-2 text-sm bg-os-red text-white rounded-lg hover:bg-os-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Loading plans...</div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No territory plans yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Create your first plan to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-os-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-os-red-dark transition-colors"
          >
            <Plus size={16} />
            New Territory Plan
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {plans.map(plan => (
            <Link
              key={plan.id}
              to={`/plans/${plan.id}`}
              className="block bg-white rounded-xl border border-gray-200 hover:border-os-red/30 hover:shadow-sm transition-all group"
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-os-red/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-os-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{plan.aeName}</h3>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      plan.aeType === 'commercial'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    )}>
                      {AE_TYPE_LABELS[plan.aeType]}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      plan.status === 'complete'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    )}>
                      {plan.status === 'complete' ? 'Complete' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {plan.rsdName && (
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        RSD: {plan.rsdName}
                      </span>
                    )}
                    {plan.rvpName && (
                      <span>RVP: {plan.rvpName}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(plan.id, e)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-os-red transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
