import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan } from '../../types';
import { PlanFormModal } from './PlanFormModal';
import {
  Check,
  Plus,
  Edit2,
  Archive,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Users,
  HardDrive,
  Cpu,
} from 'lucide-react';

export const PlanCards: React.FC = () => {
  const { plans, createPlan, updatePlan, archivePlan } = useApp();

  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const activePlans = plans.filter((p) => !p.isArchived);

  const handleEditClick = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => {
    if (editingPlan) {
      updatePlan(editingPlan.id, data);
    } else {
      createPlan(data);
    }
    setEditingPlan(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Subscription Plan Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure tiered pricing, feature quotas, trial terms, and entitlement limits.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPlan(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Plan
        </button>
      </div>

      {/* Interval Toggle */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingInterval === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingInterval === 'annual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              Save ~17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activePlans.map((plan) => {
          const price = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const displayMonthlyEquivalent =
            billingInterval === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between ${
                plan.isPopular
                  ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                  : 'border-slate-200/90 shadow-xs hover:shadow-md'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(plan)}
                      title="Edit Plan"
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {activePlans.length > 1 && (
                      <button
                        onClick={() => archivePlan(plan.id)}
                        title="Archive Plan"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-5 min-h-[32px] leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="pb-5 mb-5 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-slate-400">₹</span>
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      /{billingInterval === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingInterval === 'annual' && (
                    <div className="text-[11px] text-emerald-600 font-medium mt-1">
                      Equivalent to ₹{displayMonthlyEquivalent.toLocaleString()}/month (billed annually)
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 mt-1">
                    {plan.trialDays > 0 ? `${plan.trialDays}-day free trial included` : 'Instant activation'}
                  </div>
                </div>

                {/* Operational Quotas */}
                <div className="space-y-2 mb-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Core Limits
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center text-xs">
                    <div>
                      <Users className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                      <div className="font-bold text-slate-800">
                        {plan.limits.usersLimit > 500 ? 'Unlimited' : plan.limits.usersLimit}
                      </div>
                      <div className="text-[10px] text-slate-400">Seats</div>
                    </div>
                    <div>
                      <Cpu className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                      <div className="font-bold text-slate-800">
                        {(plan.limits.apiCallsLimit / 1000).toFixed(0)}k
                      </div>
                      <div className="text-[10px] text-slate-400">APIs/mo</div>
                    </div>
                    <div>
                      <HardDrive className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                      <div className="font-bold text-slate-800">{plan.limits.storageGbLimit}GB</div>
                      <div className="text-[10px] text-slate-400">Cloud</div>
                    </div>
                  </div>
                </div>

                {/* Features Bullet List */}
                <div className="space-y-2.5 mb-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Included Features
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Code: <code className="font-mono text-slate-700">{plan.code}</code></span>
                <button
                  onClick={() => handleEditClick(plan)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Configure &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Form Modal */}
      <PlanFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPlan}
      />
    </div>
  );
};
