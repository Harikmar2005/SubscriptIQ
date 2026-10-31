import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  DollarSign,
  FileText,
  Link2,
  Check,
  ShieldCheck,
  History,
} from 'lucide-react';
import { Payment, Invoice, PaymentAllocation } from '../../types';

export const PaymentReconciliationView: React.FC = () => {
  const {
    payments,
    invoices,
    paymentAllocations,
    reconcilePayment,
    autoReconcileAll,
    showToast,
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'queue' | 'history'>('queue');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [targetInvoiceId, setTargetInvoiceId] = useState<string>('');
  const [allocationAmount, setAllocationAmount] = useState<number>(0);
  const [isMatching, setIsMatching] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const unmatchedPayments = payments.filter((p) => !p.reconciled && p.status === 'success');
  const openInvoices = invoices.filter((inv) => inv.status === 'pending');

  const totalPaymentVol = payments.filter((p) => p.status === 'success').reduce((a, b) => a + b.amount, 0);
  const reconciledVol = payments.filter((p) => p.reconciled && p.status === 'success').reduce((a, b) => a + b.amount, 0);
  const unreconciledVol = totalPaymentVol - reconciledVol;
  const matchRate = totalPaymentVol > 0 ? Math.round((reconciledVol / totalPaymentVol) * 100) : 100;

  const handleOpenMatchModal = (payment: Payment) => {
    setSelectedPayment(payment);
    // Auto-select invoice matching customer if available
    const match = openInvoices.find((i) => i.customerId === payment.customerId);
    setTargetInvoiceId(match ? match.id : openInvoices[0]?.id || '');
    setAllocationAmount(payment.amount);
  };

  const handleConfirmMatch = () => {
    if (!selectedPayment || !targetInvoiceId) return;
    reconcilePayment(selectedPayment.id, targetInvoiceId, allocationAmount);
    setSelectedPayment(null);
  };

  const handleAutoReconcile = async () => {
    setIsAutoRunning(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      autoReconcileAll();
    } finally {
      setIsAutoRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <CreditCard className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Payment Reconciliation & Balance Allocator
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconciles incoming gateway settlements against open accounts receivable invoices. Supports partial payments and multi-payment distribution.
          </p>
        </div>

        <button
          onClick={handleAutoReconcile}
          disabled={isAutoRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAutoRunning ? 'animate-spin' : ''}`} />
          {isAutoRunning ? 'Auto-Matching Invoices...' : '1-Click Auto-Reconcile Gateway'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Reconciled Volume
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">₹{reconciledVol.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Matched & Balanced</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Unreconciled Volume
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">₹{unreconciledVol.toLocaleString()}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">{unmatchedPayments.length} Pending Receipts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Match Efficiency Rate
          </div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{matchRate}%</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">Bank ledger synchronized</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Open Receivables
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {openInvoices.length} Unsettled Invoices
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Awaiting allocation</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTabSub('queue')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTabSub === 'queue'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unmatched Receipts Queue ({unmatchedPayments.length})
        </button>
        <button
          onClick={() => setActiveTabSub('history')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTabSub === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Allocation History ({paymentAllocations.length})
        </button>
      </div>

      {/* QUEUE VIEW */}
      {activeTabSub === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unmatched Payments */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Unmatched Gateway Receipts
                </h2>
                <div className="text-[11px] text-slate-400">Captured in Razorpay without invoice ID</div>
              </div>
              <span className="text-xs font-semibold text-amber-700">{unmatchedPayments.length} receipts</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {unmatchedPayments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="font-semibold text-slate-700">All Gateway Receipts Reconciled</div>
                  <p className="text-xs text-slate-400 mt-1">Zero unallocated balances in cash register.</p>
                </div>
              ) : (
                unmatchedPayments.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{p.transactionId}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase">
                          Unmatched
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium mt-1">
                        {p.customerName || p.customerId}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.paymentMethod.type.toUpperCase()} • {p.createdAt.slice(0, 10)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">₹{p.amount.toLocaleString()}</div>
                      <button
                        onClick={() => handleOpenMatchModal(p)}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-xs"
                      >
                        Match to Invoice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Open Invoices awaiting payment */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Open Accounts Receivable Invoices
                </h2>
                <div className="text-[11px] text-slate-400">Invoices awaiting payment settlement</div>
              </div>
              <span className="text-xs font-semibold text-slate-700">{openInvoices.length} open</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {openInvoices.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="font-semibold text-slate-700">No Open Invoices</div>
                  <p className="text-xs text-slate-400 mt-1">All customer invoices are fully settled.</p>
                </div>
              ) : (
                openInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-800">{inv.invoiceNumber}</div>
                      <div className="text-xs text-slate-700 font-medium mt-1">
                        {inv.customer?.company || inv.customer?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Due: {inv.dueDate.slice(0, 10)} • Plan: {inv.planName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">₹{inv.totalAmount.toLocaleString()}</div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase mt-1">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ALLOCATION HISTORY VIEW */}
      {activeTabSub === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Allocation ID</th>
                  <th className="py-3 px-4">Payment Reference</th>
                  <th className="py-3 px-4">Matched Invoice</th>
                  <th className="py-3 px-4">Allocated Amount</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Reconciliation Status</th>
                  <th className="py-3 px-4">Auditor / Authorizer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paymentAllocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{alloc.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{alloc.paymentId}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{alloc.invoiceId}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">₹{alloc.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500">{alloc.allocatedAt.slice(0, 16).replace('T', ' ')}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {alloc.reconciliationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{alloc.allocatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANUAL ALLOCATION MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Link2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Allocate Payment Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Selected Receipt</div>
                <div className="font-bold text-slate-900">{selectedPayment.transactionId}</div>
                <div className="text-emerald-600 font-extrabold text-base">
                  ₹{selectedPayment.amount.toLocaleString()}
                </div>
                <div className="text-slate-500 text-[11px]">{selectedPayment.customerName}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Open Invoice to Settle:
                </label>
                <select
                  value={targetInvoiceId}
                  onChange={(e) => setTargetInvoiceId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium"
                >
                  {openInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customer?.company || inv.customer?.name} (Due: ₹{inv.totalAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Allocation Amount (INR):
                </label>
                <input
                  type="number"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Partial allocations will keep the remaining invoice balance open.
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMatch}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
              >
                Confirm Allocation & Reconcile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
