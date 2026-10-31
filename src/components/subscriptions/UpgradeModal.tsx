import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Subscription } from '../../types';
import { ArrowRight, Check } from 'lucide-react';

interface UpgradeModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  subscription,
  isOpen,
  onClose,
}) => {
  const { plans, upgradeSubscription } = useApp();

  const currentPlan = subscription ? plans.find((p) => p.id === subscription.planId) : undefined;
  const [targetPlanId, setTargetPlanId] = useState(plans[0]?.id || '');
  const [interval, setInterval] = useState<'monthly' | 'annual'>(subscription?.billingInterval || 'monthly');

  React.useEffect(() => {
    if (subscription) {
      // default target to next tier if available
      const otherPlans = plans.filter((p) => p.id !== subscription.planId);
      if (otherPlans.length > 0) setTargetPlanId(otherPlans[0].id);
      setInterval(subscription.billingInterval);
    }
  }, [subscription, plans]);

  if (!subscription || !currentPlan) return null;

  const targetPlan = plans.find((p) => p.id === targetPlanId) || currentPlan;

  const currentPrice = subscription.billingInterval === 'annual' ? currentPlan.annualPrice : currentPlan.monthlyPrice;
  const targetPrice = interval === 'annual' ? targetPlan.annualPrice : targetPlan.monthlyPrice;
  const isUpgrade = targetPrice >= currentPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upgradeSubscription({
      subscriptionId: subscription.id,
      newPlanId: targetPlan.id,
      newBillingInterval: interval,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isUpgrade ? 'Upgrade Subscription Tier' : 'Downgrade Subscription Tier'}
      description="Update recurring plan tier, feature limits, and billing interval for this account."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Comparison Overview */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Plan</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{currentPlan.name}</div>
            <div className="text-xs text-slate-500">
              ₹{currentPrice.toLocaleString()}/{subscription.billingInterval}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-3">
            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              Target {isUpgrade ? 'Upgrade' : 'Downgrade'}
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{targetPlan.name}</div>
            <div className="text-xs text-indigo-700 font-semibold">
              ₹{targetPrice.toLocaleString()}/{interval}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select New Plan Tier</label>
          <select
            value={targetPlanId}
            onChange={(e) => setTargetPlanId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ₹{p.monthlyPrice}/mo or ₹{p.annualPrice}/yr
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Frequency</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as 'monthly' | 'annual')}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="monthly">Monthly Cycle</option>
            <option value="annual">Annual Cycle (Save ~17%)</option>
          </select>
        </div>

        {/* Feature summary of target */}
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
          <div className="font-semibold text-indigo-950 mb-1">New Entitlements:</div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
            <div>• {targetPlan.limits.usersLimit > 500 ? 'Unlimited' : targetPlan.limits.usersLimit} Team Seats</div>
            <div>• {(targetPlan.limits.apiCallsLimit / 1000).toFixed(0)}k API Calls/month</div>
            <div>• {targetPlan.limits.storageGbLimit} GB Cloud Storage</div>
            <div>• {targetPlan.limits.prioritySupport ? 'Priority SLA Support' : 'Standard 48h SLA'}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
