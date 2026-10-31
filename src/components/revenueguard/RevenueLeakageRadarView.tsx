import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  ArrowRight,
  Filter,
  Search,
  Zap,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  CopyX,
  CreditCard,
  Percent,
} from 'lucide-react';
import { RevenueLeakageItem, LeakageType } from '../../types';

export const RevenueLeakageRadarView: React.FC = () => {
  const { leakageItems, resolveLeakageItem, showToast } = useApp();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const filteredItems = leakageItems.filter((item) => {
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        item.customerName.toLowerCase().includes(term) ||
        item.rootCause.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalExposure = leakageItems.reduce((acc, i) => acc + (i.status === 'detected' ? i.financialExposure : 0), 0);
  const totalRecovered = leakageItems.reduce((acc, i) => acc + i.recoveredAmount, 0);

  const leakageVectors: {
    type: LeakageType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      type: 'missing_billing',
      title: 'A. Missing Billing',
      description: 'Active subscription due for renewal but skipped by invoicing scheduler.',
      icon: Clock,
      accentColor: 'rose',
    },
    {
      type: 'duplicate_billing',
      title: 'B. Duplicate Billing',
      description: 'Concurrent checkouts or retried batches issuing double charges.',
      icon: CopyX,
      accentColor: 'amber',
    },
    {
      type: 'incorrect_discount',
      title: 'C. Incorrect Discount',
      description: 'Vouchers applied past expiry date or exceeding statutory usage quota.',
      icon: Percent,
      accentColor: 'indigo',
    },
    {
      type: 'tax_mismatch',
      title: 'D. Tax Mismatch',
      description: 'Discrepancy between invoice tax and mandatory 18% HSN 998313 GST schedule.',
      icon: FileText,
      accentColor: 'sky',
    },
    {
      type: 'price_mismatch',
      title: 'E. Price Mismatch',
      description: 'Billed subscription lines differing from official plan & variant catalog.',
      icon: DollarSign,
      accentColor: 'amber',
    },
    {
      type: 'unmatched_payment',
      title: 'F. Unmatched Payment',
      description: 'Received bank receipts or gateway settlements unallocated in general ledger.',
      icon: CreditCard,
      accentColor: 'indigo',
    },
    {
      type: 'overdue_invoice',
      title: 'G. Overdue Receivables',
      description: 'Unpaid accounts passed 14-day grace terms without active dunning.',
      icon: AlertTriangle,
      accentColor: 'rose',
    },
  ];

  const handleExecuteResolution = async (item: RevenueLeakageItem) => {
    setResolvingId(item.id);
    try {
      await new Promise((r) => setTimeout(r, 600));
      resolveLeakageItem(item.id, item.actionRequired);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Revenue Leakage Radar & Prevention Workflows
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous multi-vector radar identifying financial leakage, unbilled subscriptions, tax discrepancies, and unallocated balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Protected</div>
            <div className="text-sm font-bold text-emerald-600">₹{totalRecovered.toLocaleString()}</div>
          </div>
          <div className="text-right pl-3 border-l border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Open Exposure</div>
            <div className="text-base font-extrabold text-rose-600">₹{totalExposure.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 7 Leakage Vectors Interactive Grid */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          7 Core Financial Leakage Detection Vectors
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {leakageVectors.map((v) => {
            const Icon = v.icon;
            const count = leakageItems.filter((i) => i.type === v.type && i.status === 'detected').length;
            const isSelected = selectedType === v.type;

            return (
              <div
                key={v.type}
                onClick={() => setSelectedType(isSelected ? 'all' : v.type)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-900">{v.title}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      count > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {v.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Leakage Incidents Table & Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Detected Leakage Queue</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600">
              {filteredItems.length} incidents
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search incident title, root cause, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg border border-slate-200 text-xs w-64 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {selectedType !== 'all' && (
              <button
                onClick={() => setSelectedType('all')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Leakage Vector & Title</th>
                <th className="py-3 px-4">Customer & Account</th>
                <th className="py-3 px-4">Financial Exposure</th>
                <th className="py-3 px-4">Root Cause Diagnostics</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actionable Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-semibold text-slate-700">Zero Active Revenue Leakage</div>
                    <p className="text-xs text-slate-400 mt-1">
                      All subscriptions and receipts are mathematically balanced.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Vector: {item.type.replace('_', ' ').toUpperCase()} • ID: {item.id}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{item.customerName}</div>
                      <div className="text-[10px] text-slate-400">Cust: {item.customerId}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-rose-600">
                        ₹{item.financialExposure.toLocaleString()}
                      </div>
                      {item.recoveredAmount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          ₹{item.recoveredAmount.toLocaleString()} Recovered
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-700 text-xs font-medium">{item.rootCause}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.details}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {item.status === 'resolved' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Protection Confirmed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleExecuteResolution(item)}
                          disabled={resolvingId === item.id}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Zap className={`w-3 h-3 fill-current ${resolvingId === item.id ? 'animate-spin' : ''}`} />
                          {resolvingId === item.id ? 'Resolving...' : '1-Click Fix & Recover'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
