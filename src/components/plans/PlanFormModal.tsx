import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SubscriptionPlan } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => void;
  initialData?: SubscriptionPlan | null;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState(799);
  const [annualPrice, setAnnualPrice] = useState(7990);
  const [trialDays, setTrialDays] = useState(14);
  const [isPopular, setIsPopular] = useState(false);
  const [features, setFeatures] = useState<string[]>(['']);
  const [usersLimit, setUsersLimit] = useState(25);
  const [apiCallsLimit, setApiCallsLimit] = useState(100000);
  const [storageGbLimit, setStorageGbLimit] = useState(50);
  const [customDomains, setCustomDomains] = useState(true);
  const [prioritySupport, setPrioritySupport] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
      setDescription(initialData.description);
      setMonthlyPrice(initialData.monthlyPrice);
      setAnnualPrice(initialData.annualPrice);
      setTrialDays(initialData.trialDays);
      setIsPopular(!!initialData.isPopular);
      setFeatures(initialData.features.length ? initialData.features : ['']);
      setUsersLimit(initialData.limits.usersLimit);
      setApiCallsLimit(initialData.limits.apiCallsLimit);
      setStorageGbLimit(initialData.limits.storageGbLimit);
      setCustomDomains(initialData.limits.customDomains);
      setPrioritySupport(initialData.limits.prioritySupport);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setMonthlyPrice(499);
      setAnnualPrice(4990);
      setTrialDays(14);
      setIsPopular(false);
      setFeatures([
        'Up to 10 team seats',
        '25,000 API requests / month',
        'Automated GST invoicing',
      ]);
      setUsersLimit(10);
      setApiCallsLimit(25000);
      setStorageGbLimit(10);
      setCustomDomains(false);
      setPrioritySupport(false);
    }
  }, [initialData, isOpen]);

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || 'New SaaS Tier',
      code: code.trim().toLowerCase() || 'custom-plan',
      description: description.trim(),
      monthlyPrice: Number(monthlyPrice),
      annualPrice: Number(annualPrice),
      currency: 'INR',
      trialDays: Number(trialDays),
      isPopular,
      isArchived: false,
      features: features.filter((f) => f.trim().length > 0),
      limits: {
        usersLimit: Number(usersLimit),
        apiCallsLimit: Number(apiCallsLimit),
        storageGbLimit: Number(storageGbLimit),
        customDomains,
        prioritySupport,
        automatedInvoicing: true,
        churnIntelligence: isPopular || Number(monthlyPrice) >= 799,
        webhookIntegrations: Number(monthlyPrice) >= 799,
      },
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Configure Subscription Plan' : 'Create New Subscription Plan'}
      description="Configure recurring pricing, trial duration, feature entitlements, and operational quotas."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Growth Accelerator"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Code Identifier</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. growth-tier"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Target audience and primary value proposition..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Price (₹ INR)</label>
            <input
              type="number"
              min="0"
              required
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Price (₹ INR)</label>
            <input
              type="number"
              min="0"
              required
              value={annualPrice}
              onChange={(e) => setAnnualPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trial Period (Days)</label>
            <input
              type="number"
              min="0"
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Plan Entitlements & Limits</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Max Users</label>
              <input
                type="number"
                value={usersLimit}
                onChange={(e) => setUsersLimit(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Monthly API Calls</label>
              <input
                type="number"
                value={apiCallsLimit}
                onChange={(e) => setApiCallsLimit(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Storage (GB)</label>
              <input
                type="number"
                value={storageGbLimit}
                onChange={(e) => setStorageGbLimit(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={customDomains}
                onChange={(e) => setCustomDomains(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Custom Domains
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prioritySupport}
                onChange={(e) => setPrioritySupport(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Priority SLA Support
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Badge as 'Most Popular'
            </label>
          </div>
        </div>

        {/* Feature List */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Feature Bullet Points</label>
            <button
              type="button"
              onClick={handleAddFeature}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bullet
            </button>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {features.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={f}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder={`Feature ${idx + 1}`}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
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
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            {initialData ? 'Save Plan Changes' : 'Create Subscription Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
