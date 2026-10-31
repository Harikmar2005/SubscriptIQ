import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  RefreshCw,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Play,
  Settings,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const RenewalManager: React.FC = () => {
  const {
    subscriptions,
    customers,
    plans,
    triggerRenewalBatch,
    notifications,
    showToast,
  } = useApp();

  const [isRunning, setIsRunning] = useState(false);
  const [retryIntervalDays, setRetryIntervalDays] = useState(3);
  const [maxRetryAttempts, setMaxRetryAttempts] = useState(3);
  const [lastBatchResult, setLastBatchResult] = useState<{
    processedCount: number;
    successCount: number;
    failedCount: number;
    details: string[];
  } | null>(null);

  // Subscriptions eligible for renewal in the next 14 days or past due
  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'past_due')
    .map((s) => {
      const customer = customers.find((c) => c.id === s.customerId);
      const plan = plans.find((p) => p.id === s.planId);
      const expiry = new Date(s.currentPeriodEnd);
      const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const amount = (s.billingInterval === 'annual' ? plan?.annualPrice : plan?.monthlyPrice) || 799;
      const total = Math.round(amount * 1.18);

      let urgency: 'high' | 'medium' | 'normal' = 'normal';
      let recommendedAction = 'Automated charge scheduled on renewal date.';

      if (s.status === 'past_due') {
        urgency = 'high';
        recommendedAction = 'Dunning active: send email reminder with alternate payment link.';
      } else if (daysLeft <= 3) {
        urgency = 'medium';
        recommendedAction = 'Pre-charge notice dispatched. Ensure card billing limits are active.';
      }

      return {
        subscription: s,
        customer,
        plan,
        expiry,
        daysLeft,
        total,
        urgency,
        recommendedAction,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const handleRunBatch = async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 700));
    const result = triggerRenewalBatch();
    setLastBatchResult(result);
    setIsRunning(false);
  };

  const renewalNotifications = notifications.filter(
    (n) => n.type === 'renewal_reminder' || n.type === 'payment_failed'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Automated Renewal & Dunning Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Background scheduler for recurring subscription cycles, automated pre-renewal alerts, and intelligent dunning retries.
          </p>
        </div>

        <button
          onClick={handleRunBatch}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Processing Batch...' : 'Trigger Scheduled Renewal Run'}
        </button>
      </div>

      {/* Batch Result Flash */}
      {lastBatchResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-bold text-emerald-950">
                Renewal Execution Succeeded: {lastBatchResult.successCount} auto-renewed,{' '}
                {lastBatchResult.failedCount} failed
              </h4>
            </div>
            <button
              onClick={() => setLastBatchResult(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-2 text-xs text-emerald-800 space-y-0.5">
            {lastBatchResult.details.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Upcoming Renewals Queue + Dunning Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Queue: Upcoming Renewals */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Renewals Queue</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {upcomingRenewals.length} subscriptions in renewal window
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Customer & Plan</th>
                  <th className="px-5 py-3">Renewal Date</th>
                  <th className="px-5 py-3">Gross Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Recommended Dunning Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingRenewals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No subscriptions approaching renewal.
                    </td>
                  </tr>
                ) : (
                  upcomingRenewals.map((item) => (
                    <tr key={item.subscription.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {item.customer?.company || item.customer?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.plan?.name} ({item.subscription.billingInterval})
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-slate-800 font-medium">
                          {item.expiry.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div
                          className={`text-[10px] font-semibold ${
                            item.daysLeft <= 0
                              ? 'text-rose-600'
                              : item.daysLeft <= 3
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.daysLeft <= 0 ? 'Overdue / Past Due' : `${item.daysLeft} days remaining`}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{item.total.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.subscription.status === 'past_due'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.subscription.status === 'past_due' ? 'Past Due' : 'Active'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-[11px] text-slate-600">
                        {item.recommendedAction}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Dunning Policy & Notifications */}
        <div className="space-y-6">
          {/* Dunning Configuration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Automated Dunning Policy</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Retry Cadence Interval
              </label>
              <select
                value={retryIntervalDays}
                onChange={(e) => setRetryIntervalDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value={1}>Daily (Every 24 hours)</option>
                <option value={3}>Standard SaaS (Every 3 days)</option>
                <option value={5}>Relaxed (Every 5 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Automatic Retry Attempts
              </label>
              <select
                value={maxRetryAttempts}
                onChange={(e) => setMaxRetryAttempts(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value={2}>2 Attempts before cancellation</option>
                <option value={3}>3 Attempts (Recommended)</option>
                <option value={5}>5 Attempts with SMS notifications</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed">
              If all retries fail, SubscriptIQ FSM automatically transitions the subscription from Past Due to Cancelled and notifies the account owner.
            </div>
          </div>

          {/* Renewal & Dunning Alerts Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Renewal Activity Feed</h3>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {renewalNotifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No recent alerts</div>
              ) : (
                renewalNotifications.map((notif) => (
                  <div key={notif.id} className="pt-2.5 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">{notif.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
