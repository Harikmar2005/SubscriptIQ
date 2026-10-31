import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  RefreshCw,
  Play,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  CopyX,
  Lock,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { BillingRun } from '../../types';

export const BillingRunsView: React.FC = () => {
  const {
    billingRuns,
    createAndExecuteBillingRun,
    retryBillingRunSubscription,
    subscriptions,
    latestValidationResult,
    runBillingValidation,
    showToast,
  } = useApp();

  const [selectedRun, setSelectedRun] = useState<BillingRun | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillingDate, setSelectedBillingDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [autoInvoiceReady, setAutoInvoiceReady] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartBillingRun = async () => {
    setIsProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const run = createAndExecuteBillingRun(selectedBillingDate, autoInvoiceReady);
      setIsModalOpen(false);
      setSelectedRun(run);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportReport = (run: BillingRun) => {
    const reportData = {
      runNumber: run.runNumber,
      billingDate: run.billingDate,
      billingPeriod: run.billingPeriod,
      status: run.status,
      totalSubscriptions: run.totalSubscriptions,
      readyCount: run.readyCount,
      blockedCount: run.blockedCount,
      invoicesGeneratedCount: run.invoicesGeneratedCount,
      totalBilledAmount: run.totalBilledAmount,
      duplicateAttemptsBlocked: run.duplicateAttemptsBlocked,
      idempotencyKey: run.idempotencyKey,
      initiatedBy: run.initiatedBy,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      exceptionsSummary: run.exceptionsSummary,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-run-${run.runNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Report Exported', `Downloaded audit JSON for ${run.runNumber}.`);
  };

  const totalRuns = billingRuns.length;
  const totalBilledAllTime = billingRuns.reduce((acc, r) => acc + r.totalBilledAmount, 0);
  const totalInvoicesAllTime = billingRuns.reduce((acc, r) => acc + r.invoicesGeneratedCount, 0);
  const totalDuplicatesBlocked = billingRuns.reduce((acc, r) => acc + (r.duplicateAttemptsBlocked || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Automated Billing Run Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Batch billing orchestrator executing multi-point verification, idempotency locks, and automated GST invoice issuance.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Schedule & Execute Billing Run
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Billing Runs
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalRuns} Executed</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Automated batch history</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Invoices Issued
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{totalInvoicesAllTime} Invoices</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">100% Tax Compliant</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Billed Volume
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">₹{totalBilledAllTime.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Gross recurring revenue</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Duplicate Invoices Prevented
          </div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{totalDuplicatesBlocked} Blocked</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">Idempotency protection</div>
        </div>
      </div>

      {/* Workflow Step Guide Strip */}
      <div className="bg-slate-900 text-white p-4 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
            BATCH PIPELINE
          </span>
          <span className="text-slate-300">
            Select Billing Date → Evaluate 6 Checks → Group Ready/Blocked → Review Exceptions → Issue GST Invoices → Record Double-Entry Ledger.
          </span>
        </div>
        <span className="text-[11px] text-indigo-300 shrink-0 font-medium">
          Zero Invoices for Blocked Subscriptions
        </span>
      </div>

      {/* Previous Billing Runs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Execution Run History & Detailed Audit
          </h2>
          <span className="text-xs text-slate-400">Chronological Archive</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Run # & Cycle</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Validated / Blocked</th>
                <th className="py-3 px-4">Invoices Created</th>
                <th className="py-3 px-4">Total Billed</th>
                <th className="py-3 px-4">Duplicates Blocked</th>
                <th className="py-3 px-4">Initiated By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {billingRuns.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900">{run.runNumber}</div>
                    <div className="text-[11px] text-slate-400">{run.billingPeriod}</div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">{run.billingDate}</td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {run.status}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-emerald-700 font-bold">{run.readyCount} Ready</span>
                    {run.blockedCount > 0 && (
                      <span className="text-rose-600 font-bold ml-1.5">• {run.blockedCount} Blocked</span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {run.invoicesGeneratedCount} Invoices
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    ₹{run.totalBilledAmount.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 font-medium text-indigo-700">
                    {run.duplicateAttemptsBlocked || 0} Blocked
                  </td>

                  <td className="py-3 px-4 text-slate-500">{run.initiatedBy}</td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedRun(run)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleExportReport(run)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Export JSON report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE & RUN BILLING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Initiate Automated Billing Run
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Execution Date:
                </label>
                <input
                  type="date"
                  value={selectedBillingDate}
                  onChange={(e) => setSelectedBillingDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Pre-Run Integrity Verification Summary
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subscriptions in Active Cycle:</span>
                  <span className="font-bold text-slate-900">{subscriptions.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Concurrency & Idempotency Key:</span>
                  <span className="font-mono text-[10px] text-indigo-700 font-semibold">
                    AUTO_KEY_{selectedBillingDate.replace(/-/g, '')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <input
                  type="checkbox"
                  id="autoInvoice"
                  checked={autoInvoiceReady}
                  onChange={(e) => setAutoInvoiceReady(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="autoInvoice" className="text-slate-700 cursor-pointer">
                  <span className="font-bold text-indigo-950 block">
                    Automatically generate invoices for verified READY subscriptions
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Blocked subscriptions will be halted without issuing an invoice. Exceptions will be posted to the Integrity Scanner.
                  </span>
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStartBillingRun}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Validating & Invoicing...' : 'Execute Run Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILLING RUN DETAILS DRAWER */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">{selectedRun.runNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {selectedRun.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Executed on {selectedRun.startedAt} by {selectedRun.initiatedBy}
                </div>
              </div>

              <button
                onClick={() => setSelectedRun(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Subscriptions</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{selectedRun.totalSubscriptions}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Invoiced (Ready)</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">{selectedRun.invoicesGeneratedCount}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-rose-600 uppercase">Blocked Exceptions</div>
                  <div className="text-lg font-bold text-rose-600 mt-1">{selectedRun.blockedCount}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Security & Idempotency Audit</div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Unique Idempotency Hash:</span>
                  <span className="font-mono text-[10px] text-slate-800">{selectedRun.idempotencyKey}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Amount Billed & Reconciled:</span>
                  <span className="font-bold text-slate-900">₹{selectedRun.totalBilledAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Duplicate Charges Intercepted:</span>
                  <span className="font-bold text-indigo-700">{selectedRun.duplicateAttemptsBlocked}</span>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-900 mb-2">Category Exceptions Summary</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedRun.exceptionsSummary || {}).map(([cat, count]) => (
                    <div key={cat} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="capitalize text-slate-600">{cat.replace('_', ' ')}:</span>
                      <span className={`font-bold ${count > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <button
                onClick={() => handleExportReport(selectedRun)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Export Audit JSON
              </button>
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
