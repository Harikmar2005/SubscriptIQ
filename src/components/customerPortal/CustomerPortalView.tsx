import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceViewModal } from '../invoices/InvoiceViewModal';
import { Modal } from '../common/Modal';
import {
  Building,
  CreditCard,
  FileText,
  Calendar,
  Check,
  ArrowRight,
  Download,
  AlertCircle,
  XCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Lock,
} from 'lucide-react';
import { Invoice, SubscriptionPlan } from '../../types';

export const CustomerPortalView: React.FC = () => {
  const {
    currentUser,
    customers,
    plans,
    subscriptions,
    payments,
    invoices,
    upgradeSubscription,
    updateSubscriptionStatus,
    updateCustomer,
    showToast,
  } = useApp();

  const customer = customers.find((c) => c.id === currentUser.customerId) || customers[0];
  const customerSub = subscriptions.find(
    (s) => s.customerId === customer?.id && ['active', 'trial', 'past_due', 'paused'].includes(s.status)
  ) || subscriptions.find((s) => s.customerId === customer?.id);

  const activePlan = customerSub ? plans.find((p) => p.id === customerSub.planId) : undefined;
  const customerPayments = payments.filter((p) => p.customerId === customer?.id);
  const customerInvoices = invoices.filter((i) => i.customerId === customer?.id);

  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Found an alternative solution');

  // Profile Edit modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [compName, setCompName] = useState(customer?.company || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [taxId, setTaxId] = useState(customer?.taxId || '');

  const handleUpgradePlan = (targetPlan: SubscriptionPlan) => {
    if (!customerSub) {
      showToast('error', 'No active subscription', 'Please contact support.');
      return;
    }
    upgradeSubscription({
      subscriptionId: customerSub.id,
      newPlanId: targetPlan.id,
      newBillingInterval: customerSub.billingInterval,
    });
    showToast('success', 'Plan Upgraded', `Your organization is now upgraded to ${targetPlan.name}!`);
  };

  const handleConfirmCancel = () => {
    if (customerSub) {
      updateSubscriptionStatus(customerSub.id, 'cancelled', cancelReason);
      setIsCancelModalOpen(false);
      showToast('warning', 'Subscription Cancelled', 'Your subscription will not renew.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (customer) {
      updateCustomer(customer.id, {
        company: compName,
        phone,
        address,
        taxId,
      });
      setIsEditProfileOpen(false);
      showToast('success', 'Profile Updated', 'Company billing details saved.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Portal Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
            {customer?.company?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {customer?.company || 'Organization Portal'}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Customer Self-Service
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged in as <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.email})
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCompName(customer?.company || '');
            setPhone(customer?.phone || '');
            setAddress(customer?.address || '');
            setTaxId(customer?.taxId || '');
            setIsEditProfileOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit Billing Profile
        </button>
      </div>

      {/* Current Subscription Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Active Membership
            </div>
            <h3 className="text-2xl font-black">{activePlan?.name || 'No Active Plan'}</h3>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-lg">
              {activePlan?.description || 'Explore available plans below to activate enterprise benefits.'}
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-6 text-xs">
              <div>
                <div className="text-[10px] text-indigo-300 uppercase font-semibold">Recurring Fee</div>
                <div className="text-lg font-bold">
                  ₹{customerSub?.billingInterval === 'annual' ? activePlan?.annualPrice : activePlan?.monthlyPrice}
                  <span className="text-xs text-indigo-200 font-normal">/{customerSub?.billingInterval || 'month'}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-indigo-300 uppercase font-semibold">Next Scheduled Renewal</div>
                <div className="text-sm font-bold">
                  {customerSub
                    ? new Date(customerSub.currentPeriodEnd).toLocaleDateString([], { dateStyle: 'medium' })
                    : 'N/A'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-indigo-300 uppercase font-semibold">Lifecycle State</div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {customerSub?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 self-start md:self-center">
            {customerSub && customerSub.status !== 'cancelled' && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-rose-900/40 text-xs font-semibold text-rose-200 border border-white/10 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compare Available Plans & Tier Switcher */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Available Plan Upgrades</h3>
          <p className="text-xs text-slate-500">
            Compare subscription features and switch tiers instantly with automated prorated billing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = activePlan?.id === p.id;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mb-4">
                    ₹{p.monthlyPrice}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan(p)}
                  disabled={isCurrent}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {isCurrent ? 'Current Tier' : 'Upgrade to this Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices & Receipts for this Customer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Your Invoices & Receipts</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">GST compliant e-invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Invoice Number</th>
                <th className="px-5 py-3">Issue Date</th>
                <th className="px-5 py-3">Amount (INR)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Download PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                customerInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {new Date(inv.issueDate).toLocaleDateString([], { dateStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setActiveInvoice(inv)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 ml-auto"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceViewModal
        invoice={activeInvoice}
        isOpen={!!activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Your Subscription"
        description="We're sorry to see you go. Please let us know why you're cancelling."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback Reason
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Found an alternative solution">Found an alternative solution</option>
              <option value="Pricing / budget constraints">Pricing / budget constraints</option>
              <option value="Temporary pause in operations">Temporary pause in operations</option>
              <option value="Feature not supported">Feature not supported</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            Your plan benefits will remain accessible until the end of your billing cycle:{' '}
            <strong>
              {customerSub ? new Date(customerSub.currentPeriodEnd).toLocaleDateString() : 'end of month'}
            </strong>
            .
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Nevermind
            </button>
            <button
              onClick={handleConfirmCancel}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Update Billing & Tax Profile"
        description="Keep your organization details and GSTIN current for tax invoicing."
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Entity</label>
            <input
              type="text"
              required
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Phone</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
