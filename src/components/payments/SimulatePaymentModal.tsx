import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Subscription } from '../../types';
import { Shield, CreditCard, Smartphone, Building, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface SimulatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSubscription?: Subscription | null;
}

export const SimulatePaymentModal: React.FC<SimulatePaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedSubscription,
}) => {
  const { subscriptions, customers, plans, processPayment, showToast } = useApp();

  const [subscriptionId, setSubscriptionId] = useState(
    preselectedSubscription?.id || (subscriptions[0]?.id || '')
  );
  const [paymentType, setPaymentType] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [testScenario, setTestScenario] = useState<'success' | 'decline' | 'timeout'>('success');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (preselectedSubscription) {
      setSubscriptionId(preselectedSubscription.id);
    } else if (subscriptions.length > 0 && !subscriptionId) {
      setSubscriptionId(subscriptions[0].id);
    }
  }, [preselectedSubscription, subscriptions]);

  const targetSub = subscriptions.find((s) => s.id === subscriptionId);
  const customer = targetSub ? customers.find((c) => c.id === targetSub.customerId) : undefined;
  const plan = targetSub ? plans.find((p) => p.id === targetSub.planId) : undefined;

  const baseAmount = targetSub
    ? (targetSub.billingInterval === 'annual' ? plan?.annualPrice : plan?.monthlyPrice) || 799
    : 799;
  const gstAmount = Math.round(baseAmount * 0.18);
  const totalAmount = baseAmount + gstAmount;

  const handleSimulateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSub || !customer) {
      showToast('error', 'Selection error', 'Please select a valid subscription.');
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // realistic gateway roundtrip

    const willFail = testScenario !== 'success';
    let failReason = undefined;
    if (testScenario === 'decline') {
      failReason = 'Card issuer declined: Insufficient account funds or daily velocity limit reached.';
    } else if (testScenario === 'timeout') {
      failReason = 'Gateway timeout: 3D Secure authentication session expired.';
    }

    processPayment({
      subscriptionId: targetSub.id,
      customerId: targetSub.customerId,
      amount: totalAmount,
      paymentMethod: {
        type: paymentType,
        brand: paymentType === 'card' ? 'Visa Test' : undefined,
        last4: paymentType === 'card' ? (testScenario === 'success' ? '4242' : '0002') : undefined,
        upiId: paymentType === 'upi' ? (testScenario === 'success' ? 'customer@okhdfc' : 'expired@upi') : undefined,
        bankName: paymentType === 'netbanking' ? 'State Bank of India Corporate' : undefined,
      },
      forceFailure: willFail,
      failureReason: failReason,
    });

    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Razorpay Payment Transaction"
      description="Interactive gateway emulator with standard test-mode payment credentials and failure scenarios."
      maxWidth="lg"
    >
      <form onSubmit={handleSimulateCheckout} className="space-y-4">
        {/* Subscription Target */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subscription</label>
          <select
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {subscriptions.map((s) => {
              const cust = customers.find((c) => c.id === s.customerId);
              const p = plans.find((pl) => pl.id === s.planId);
              return (
                <option key={s.id} value={s.id}>
                  {s.id} — {cust?.company || cust?.name} ({p?.name}, {s.status.toUpperCase()})
                </option>
              );
            })}
          </select>
        </div>

        {/* Pricing Summary Box */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span>Base Subscription Fee ({plan?.name}):</span>
            <span className="font-semibold text-slate-800">₹{baseAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600 mb-1.5 pb-1.5 border-b border-slate-200">
            <span>Integrated GST (18%):</span>
            <span className="font-semibold text-slate-800">₹{gstAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-slate-900">
            <span>Total Payable Amount:</span>
            <span className="text-indigo-600">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
              { id: 'upi', label: 'UPI / QR Code', icon: Smartphone },
              { id: 'netbanking', label: 'Net Banking', icon: Building },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentType(m.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                    paymentType === m.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Scenario Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Gateway Simulation Scenario
          </label>
          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                testScenario === 'success'
                  ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="scenario"
                checked={testScenario === 'success'}
                onChange={() => setTestScenario('success')}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Successful Payment (4242 4242 4242 4242)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Activates subscription, generates PDF invoice with GST, and updates ARR/MRR.
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                testScenario === 'decline'
                  ? 'border-rose-300 bg-rose-50/60 text-rose-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="scenario"
                checked={testScenario === 'decline'}
                onChange={() => setTestScenario('decline')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div className="flex-1">
                <div className="text-xs font-bold flex items-center gap-1 text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Card Issuer Declined (Insufficient Funds)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Transitions subscription to Past Due status and queues for automated retry.
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                testScenario === 'timeout'
                  ? 'border-amber-300 bg-amber-50/60 text-amber-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="scenario"
                checked={testScenario === 'timeout'}
                onChange={() => setTestScenario('timeout')}
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-xs font-bold flex items-center gap-1 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Network 3DS Timeout / Gateway Error
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Generates payment failure incident and dunning alert in notifications.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>PCI-DSS compliant test harness. No real credit card or CVV details are ever stored.</span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Communicating with Gateway...
              </>
            ) : (
              `Process Simulated Payment (₹${totalAmount.toLocaleString()})`
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
