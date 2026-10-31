import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Subscription, Customer } from '../../types';
import { CreateSubscriptionModal } from './CreateSubscriptionModal';
import { UpgradeModal } from './UpgradeModal';
import { Modal } from '../common/Modal';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  XCircle,
  ArrowUpRight,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface SubscriptionTableProps {
  onSimulatePaymentForSub?: (subscription: Subscription) => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  onSimulatePaymentForSub,
}) => {
  const {
    subscriptions,
    customers,
    plans,
    updateSubscriptionStatus,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [upgradingSub, setUpgradingSub] = useState<Subscription | null>(null);

  // Cancellation modal state
  const [cancellingSub, setCancellingSub] = useState<Subscription | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Customer switching to internal tools');

  const filteredSubs = subscriptions.filter((s) => {
    const customer = customers.find((c) => c.id === s.customerId);
    const plan = plans.find((p) => p.id === s.planId);

    const matchesSearch =
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePause = (sub: Subscription) => {
    updateSubscriptionStatus(sub.id, 'paused', 'Paused by administrative user');
  };

  const handleResume = (sub: Subscription) => {
    updateSubscriptionStatus(sub.id, 'active', 'Resumed by administrative user');
  };

  const confirmCancel = () => {
    if (cancellingSub) {
      updateSubscriptionStatus(cancellingSub.id, 'cancelled', cancellationReason);
      setCancellingSub(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Subscription Lifecycle Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Finite State Machine enforcing valid state transitions (Trial &rarr; Active &rarr; Past Due &rarr; Paused &rarr; Cancelled).
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Subscription
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscription ID, customer, plan..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs w-full md:w-auto overflow-x-auto">
          {(['all', 'active', 'trial', 'past_due', 'paused', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium capitalize whitespace-nowrap transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Subscription ID & Entity</th>
                <th className="px-5 py-3.5">Plan Tier</th>
                <th className="px-5 py-3.5">Billing Cycle</th>
                <th className="px-5 py-3.5">Current Period</th>
                <th className="px-5 py-3.5">FSM Status</th>
                <th className="px-5 py-3.5">Auto-Renew</th>
                <th className="px-5 py-3.5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const customer = customers.find((c) => c.id === sub.customerId);
                  const plan = plans.find((p) => p.id === sub.planId);
                  const expiry = new Date(sub.currentPeriodEnd);
                  const daysToExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (sub.status === 'active') statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  else if (sub.status === 'trial') statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  else if (sub.status === 'past_due') statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  else if (sub.status === 'paused') statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  else if (sub.status === 'cancelled') statusBadgeClass = 'bg-slate-100 text-slate-500 border-slate-200';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-[11px] font-bold text-slate-700">{sub.id}</div>
                        <div className="font-semibold text-slate-900 mt-0.5">
                          {customer?.company || customer?.name || 'Unknown Entity'}
                        </div>
                        <div className="text-[10px] text-slate-400">{customer?.email}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{plan?.name || 'Custom Plan'}</div>
                        <div className="text-[11px] text-slate-500">
                          ₹{sub.billingInterval === 'annual' ? plan?.annualPrice : plan?.monthlyPrice} /{' '}
                          {sub.billingInterval}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 capitalize font-medium text-slate-700">
                        {sub.billingInterval}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-slate-800">
                          {new Date(sub.currentPeriodStart).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          &rarr;{' '}
                          {new Date(sub.currentPeriodEnd).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 font-medium ${
                            daysToExpiry <= 3 && sub.status === 'active'
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {daysToExpiry <= 0 ? 'Cycle ended' : `${daysToExpiry} days remaining`}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadgeClass}`}
                        >
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {sub.autoRenew ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Disabled</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Settle / Pay Action */}
                          {(sub.status === 'trial' || sub.status === 'past_due') && (
                            <button
                              onClick={() => {
                                if (onSimulatePaymentForSub) {
                                  onSimulatePaymentForSub(sub);
                                } else {
                                  setActiveTab('payments');
                                }
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Process payment to activate or settle"
                            >
                              <CreditCard className="w-3 h-3" /> Pay
                            </button>
                          )}

                          {/* Upgrade / Downgrade */}
                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => setUpgradingSub(sub)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Upgrade or change plan tier"
                            >
                              <ArrowUpRight className="w-3 h-3" /> Tier
                            </button>
                          )}

                          {/* Pause / Resume */}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handlePause(sub)}
                              className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                              title="Pause subscription"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {sub.status === 'paused' && (
                            <button
                              onClick={() => handleResume(sub)}
                              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                              title="Resume subscription"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel */}
                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => setCancellingSub(sub)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Cancel subscription"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <CreateSubscriptionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        subscription={upgradingSub}
        isOpen={!!upgradingSub}
        onClose={() => setUpgradingSub(null)}
      />

      {/* Cancellation Confirmation Dialog */}
      <Modal
        isOpen={!!cancellingSub}
        onClose={() => setCancellingSub(null)}
        title="Cancel Subscription"
        description="Provide a cancellation reason. Subscription status will update to Cancelled and recurring charges will stop."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason (Stored in Churn Analytics)
            </label>
            <select
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Customer switching to internal tools">Customer switching to internal tools</option>
              <option value="Budget constraints / pricing too high">Budget constraints / pricing too high</option>
              <option value="Missing features / integration gap">Missing features / integration gap</option>
              <option value="Company hiatus / project wound down">Company hiatus / project wound down</option>
              <option value="Dissatisfaction with support response">Dissatisfaction with support response</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Subscription ID <strong>{cancellingSub?.id}</strong> will be immediately marked cancelled in the finite state machine.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setCancellingSub(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Keep Subscription
            </button>
            <button
              onClick={confirmCancel}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
