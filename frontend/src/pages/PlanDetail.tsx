import { useParams, Link, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Upload, BarChart3, Star, LayoutDashboard, ChevronRight, ArrowLeft } from 'lucide-react';
import { plansApi } from '../lib/api';
import type { TerritoryPlan } from '../types';
import { cn } from '../lib/utils';

const STEPS = [
  { path: 'upload', label: 'Upload', icon: Upload, step: 1 },
  { path: 'enrich', label: 'Enrich & Tier', icon: BarChart3, step: 2 },
  { path: 'prioritize', label: 'Prioritize', icon: Star, step: 3 },
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, step: 4 },
];

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const location = useLocation();
  const [plan, setPlan] = useState<TerritoryPlan | null>(null);

  useEffect(() => {
    if (planId) {
      plansApi.get(planId).then(setPlan).catch(() => null);
    }
  }, [planId]);

  const currentStep = STEPS.find(s => location.pathname.includes(`/${s.path}`));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Plan sub-nav */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center h-12 gap-4">
          <Link to="/" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={13} />
            All Plans
          </Link>
          <span className="text-gray-200">|</span>
          {plan && (
            <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
              {plan.aeName}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {STEPS.map((step, i) => (
              <div key={step.path} className="flex items-center gap-1">
                <Link
                  to={`/plans/${planId}/${step.path}`}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    currentStep?.path === step.path
                      ? 'bg-os-red/10 text-os-red'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <step.icon size={13} />
                  {step.label}
                </Link>
                {i < STEPS.length - 1 && <ChevronRight size={13} className="text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
