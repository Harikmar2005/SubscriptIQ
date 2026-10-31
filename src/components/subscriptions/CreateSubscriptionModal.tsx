import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomer?: Customer | null;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomer,
}) => {
  const { customers, plans, createSubscription, showToast } = useApp();

  const [customerId, setCustomerId] = useState(preselectedCustomer?.id || (customers[0]?.id || ''));
  const [planId, setPlanId] = useState(plans[1]?.id || plans[0]?.id || '');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [startWithTrial, setStartWithTrial] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);

  React.useEffect(() => {
    if (preselectedCustomer) {
      setCustomerId(preselectedCustomer.id);
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [preselectedCustomer, customers]);

  const selectedPlan = plans.find((p) => p.id === planId);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !planId) {
      showToast('error', 'Incomplete Form', 'Please select both a customer and a subscription plan.');
      return;
    }

    createSubscription({
      customerId,
      planId,
      billingInterval,
      startWithTrial,
      autoRenew,
    });

    onClose();
  };

  const price = selectedPlan
    ? billingInterval === 'annual'
      ? selectedPlan.annualPrice
      : selectedPlan.monthlyPrice
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subscription"
      description="Assign a recurring plan to a customer, calculate renewal dates, and set lifecycle parameters."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.company} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ₹{p.monthlyPrice}/mo or ₹{p.annualPrice}/yr
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Frequency</label>
            <select
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value as 'monthly' | 'annual')}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="monthly">Monthly Cycle</option>
              <option value="annual">Annual Cycle (Save ~17%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Calculated Fee</label>
            <div className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900">
              ₹{price.toLocaleString()} + 18% GST (₹{Math.round(price * 1.18).toLocaleString()})
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={startWithTrial}
              onChange={(e) => setStartWithTrial(e.target.checked)}
              disabled={!selectedPlan || selectedPlan.trialDays <= 0}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              Start with {selectedPlan?.trialDays || 14}-day free trial period (Initial status: TRIAL)
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Enable Automated Recurring Renewal on due date</span>
          </label>
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
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            Initialize Subscription
          </button>
        </div>
      </form>
    </Modal>
  );
};
