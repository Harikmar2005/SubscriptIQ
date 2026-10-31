import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import { SimulatePaymentModal } from './SimulatePaymentModal';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PaymentTableProps {
  onViewInvoice?: (invoiceId: string) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({ onViewInvoice }) => {
  const { payments, retryPayment, refundPayment, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customerName && p.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.planName && p.planName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRetry = async (paymentId: string) => {
    setRetryingId(paymentId);
    try {
      await retryPayment(paymentId);
    } finally {
      setRetryingId(null);
    }
  };

  const handleRefund = (paymentId: string) => {
    if (confirm('Issue a simulated refund for this transaction?')) {
      refundPayment(paymentId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Payments & Gateway Reconciliation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Razorpay test-mode transaction audit trail, failure dunning, and invoice generation.
          </p>
        </div>

        <button
          onClick={() => setIsSimulateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          Simulate Payment
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
            placeholder="Search transaction ID, customer, amount..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs w-full md:w-auto overflow-x-auto">
          {(['all', 'success', 'failed', 'pending', 'refunded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium capitalize whitespace-nowrap transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Transaction ID & Gateway</th>
                <th className="px-5 py-3.5">Customer & Entity</th>
                <th className="px-5 py-3.5">Plan Tier</th>
                <th className="px-5 py-3.5">Amount (INR)</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5">Gateway Status</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isSuccess = p.status === 'success';
                  const isFailed = p.status === 'failed';
                  const isRefunded = p.status === 'refunded';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-[11px] font-bold text-slate-800">{p.transactionId}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3 h-3 text-indigo-500" />
                          Razorpay Simulated
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{p.customerName || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400">Ref: {p.customerId}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {p.planName || 'Recurring Plan'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{p.amount.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-slate-700 uppercase font-medium text-[11px]">
                          {p.paymentMethod.type}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.paymentMethod.brand && `${p.paymentMethod.brand} `}
                          {p.paymentMethod.last4 ? `•••• ${p.paymentMethod.last4}` : ''}
                          {p.paymentMethod.upiId ? p.paymentMethod.upiId : ''}
                          {p.paymentMethod.bankName ? p.paymentMethod.bankName : ''}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isRefunded
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              isSuccess
                                ? 'bg-emerald-500'
                                : isFailed
                                ? 'bg-rose-500'
                                : isRefunded
                                ? 'bg-slate-400'
                                : 'bg-amber-500'
                            }`}
                          />
                          {p.status}
                        </span>
                        {p.failureReason && (
                          <div className="text-[10px] text-rose-600 mt-1 max-w-xs leading-tight">
                            {p.failureReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        <div>{new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Invoice View */}
                          {p.invoiceId && (
                            <button
                              onClick={() => {
                                if (onViewInvoice && p.invoiceId) {
                                  onViewInvoice(p.invoiceId);
                                } else {
                                  setActiveTab('invoices');
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Generated Tax Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Retry action for failed payments */}
                          {isFailed && (
                            <button
                              onClick={() => handleRetry(p.id)}
                              disabled={retryingId === p.id}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                              title="Retry failed payment with valid test card"
                            >
                              <RefreshCw className={`w-3 h-3 ${retryingId === p.id ? 'animate-spin' : ''}`} />
                              Retry
                            </button>
                          )}

                          {/* Refund action for successful payments */}
                          {isSuccess && (
                            <button
                              onClick={() => handleRefund(p.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Process Refund"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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

      {/* Simulate Payment Modal */}
      <SimulatePaymentModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
      />
    </div>
  );
};
