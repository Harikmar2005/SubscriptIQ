import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building,
} from 'lucide-react';
import { Payment } from '../../types';

export const RecentActivityWidgets: React.FC = () => {
  const {
    payments,
    subscriptions,
    customers,
    plans,
    retryPayment,
    triggerRenewalBatch,
    setActiveTab,
  } = useApp();

  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Failed payments needing attention
  const failedPayments = payments.filter((p) => p.status === 'failed').slice(0, 2);

  // Upcoming renewals (active subs sorted by currentPeriodEnd)
  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'past_due')
    .sort((a, b) => new Date(a.currentPeriodEnd).getTime() - new Date(b.currentPeriodEnd).getTime())
    .slice(0, 4);

  // Recent payment transactions
  const recentTransactions = payments.slice(0, 5);

  const handleQuickRetry = async (paymentId: string) => {
    setRetryingId(paymentId);
    try {
      await retryPayment(paymentId);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Urgent Action Alert (if failed payments exist) */}
      {failedPayments.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-rose-950">
                  {failedPayments.length} Payment Dunning Alert{failedPayments.length > 1 ? 's' : ''}
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-200/70 text-rose-800">
                  Past Due
                </span>
              </div>
              <p className="text-xs text-rose-700/90 mt-0.5">
                {failedPayments[0].customerName || 'Customer'} renewal failed for ₹
                {failedPayments[0].amount.toLocaleString()} ({failedPayments[0].failureReason}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => handleQuickRetry(failedPayments[0].id)}
              disabled={retryingId === failedPayments[0].id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryingId === failedPayments[0].id ? 'animate-spin' : ''}`} />
              {retryingId === failedPayments[0].id ? 'Retrying...' : 'Instant Retry (Test Mode)'}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className="text-xs text-rose-800 hover:text-rose-950 font-medium px-2 py-1.5"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Grid: Upcoming Renewals + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Upcoming Renewals Queue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Upcoming Renewals Queue</h3>
              </div>
              <button
                onClick={() => triggerRenewalBatch()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Trigger Batch Run
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingRenewals.map((sub) => {
                const customer = customers.find((c) => c.id === sub.customerId);
                const plan = plans.find((p) => p.id === sub.planId);
                const expiryDate = new Date(sub.currentPeriodEnd);
                const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const renewalAmount = Math.round(
                  (sub.billingInterval === 'annual' ? plan?.annualPrice : plan?.monthlyPrice) || 799 * 1.18
                );

                return (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                        {customer?.company?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {customer?.company || customer?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {plan?.name} •{' '}
                          <span className={daysLeft <= 3 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                            {daysLeft <= 0 ? 'Due Today' : `Renews in ${daysLeft} days`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">₹{renewalAmount.toLocaleString()}</div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          sub.status === 'past_due'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {sub.status === 'past_due' ? 'Past Due' : 'Auto-Renew On'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Automated dunning schedule configured</span>
            <button
              onClick={() => setActiveTab('renewals')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Renewal Center <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Widget 2: Recent Payment Transactions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Ledger
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentTransactions.map((pay) => {
                const isSuccess = pay.status === 'success';
                const isFailed = pay.status === 'failed';

                return (
                  <div key={pay.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-600'
                            : isFailed
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isFailed ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {pay.customerName || 'Subscription Payment'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {pay.paymentMethod.type.toUpperCase()}{' '}
                          {pay.paymentMethod.last4 ? `•••• ${pay.paymentMethod.last4}` : ''} •{' '}
                          {new Date(pay.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">₹{pay.amount.toLocaleString()}</div>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          isSuccess
                            ? 'text-emerald-700'
                            : isFailed
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Gateway: Razorpay Test Simulation</span>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Tax Invoices <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
