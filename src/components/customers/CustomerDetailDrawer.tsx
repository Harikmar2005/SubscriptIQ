import React from 'react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Activity,
  CreditCard,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onManageSubscription: (customer: Customer) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customer,
  onClose,
  onEdit,
  onManageSubscription,
}) => {
  const { subscriptions, plans, payments, history, churnPredictions } = useApp();

  if (!customer) return null;

  const customerSub = subscriptions.find(
    (s) => s.customerId === customer.id && ['active', 'trial', 'past_due', 'paused'].includes(s.status)
  ) || subscriptions.find((s) => s.customerId === customer.id);

  const plan = customerSub ? plans.find((p) => p.id === customerSub.planId) : undefined;
  const customerPayments = payments.filter((p) => p.customerId === customer.id);
  const customerHistory = history.filter((h) => h.customerId === customer.id);
  const churnInfo = churnPredictions.find((c) => c.customerId === customer.id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {customer.company ? customer.company.charAt(0) : customer.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">{customer.name}</h3>
              <p className="text-xs text-slate-500">{customer.company}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(customer)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-200/50 rounded-lg transition-colors border border-slate-200"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Monthly MRR</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">₹{customer.mrr || 0}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Total Spend</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{(customer.totalSpent || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Health Score</div>
              <div className="text-base font-bold text-emerald-600 mt-0.5">
                {customer.healthScore || 85}/100
              </div>
            </div>
          </div>

          {/* Current Subscription Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Current Subscription
              </span>
              {customerSub && (
                <span
                  className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    customerSub.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : customerSub.status === 'past_due'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : customerSub.status === 'paused'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {customerSub.status}
                </span>
              )}
            </div>

            {customerSub && plan ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{plan.name}</h4>
                    <span className="text-xs text-slate-500 capitalize">
                      {customerSub.billingInterval} billing (₹{customerSub.billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice})
                    </span>
                  </div>
                  <button
                    onClick={() => onManageSubscription(customer)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Manage / Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                  <span>Current Period Ends:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(customerSub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-slate-500 mb-2">No active subscription plan</p>
                <button
                  onClick={() => onManageSubscription(customer)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Assign Subscription
                </button>
              </div>
            )}
          </div>

          {/* AI Churn Risk Assessment */}
          {churnInfo && (
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-950">AI Churn Intelligence</span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    churnInfo.churnRisk === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : churnInfo.churnRisk === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {churnInfo.churnRisk} Churn Risk
                </span>
              </div>
              <p className="text-xs text-slate-700 mb-2 font-medium">{churnInfo.recommendedAction}</p>
              <div className="space-y-1">
                {churnInfo.keyFactors.map((f, i) => (
                  <div key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Company Details */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Entity Information
            </span>
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-800">{customer.company}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {customer.address ? `${customer.address}, ${customer.city || ''}` : 'Location on file'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono uppercase text-slate-800">
                  GSTIN: {customer.taxId || 'NOT PROVIDED'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Payment History */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Billing History ({customerPayments.length})
            </span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {customerPayments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No payment records yet</div>
              ) : (
                customerPayments.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between text-xs bg-white">
                    <div>
                      <div className="font-semibold text-slate-800">₹{p.amount.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.paymentMethod.type.toUpperCase()}{' '}
                        {p.paymentMethod.last4 ? `•••• ${p.paymentMethod.last4}` : ''} •{' '}
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        p.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'failed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subscription Timeline & Audit */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Activity Audit Trail
            </span>
            <div className="space-y-3 pl-2 border-l-2 border-slate-200">
              {customerHistory.map((h) => (
                <div key={h.id} className="relative pl-4 text-xs">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="font-semibold text-slate-800">{h.details}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(h.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} • By{' '}
                    {h.userEmail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
