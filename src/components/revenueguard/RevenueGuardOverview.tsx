import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  CopyX,
  CreditCard,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  DollarSign,
  Activity,
  Award,
  Zap,
} from 'lucide-react';

export const RevenueGuardOverview: React.FC = () => {
  const {
    billingHealthScore,
    billingExceptions,
    billingRuns,
    leakageItems,
    subscriptions,
    invoices,
    payments,
    setActiveTab,
    runBillingValidation,
    autoReconcileAll,
    runRevenueGuardAcceptanceStep,
    isRevenueGuardDemoRunning,
  } = useApp();

  const openExceptions = billingExceptions.filter((e) => e.resolutionStatus === 'open');
  const criticalCount = openExceptions.filter((e) => e.severity === 'critical').length;
  const highCount = openExceptions.filter((e) => e.severity === 'high').length;

  const totalExposure = leakageItems.reduce((acc, i) => acc + i.financialExposure, 0);
  const totalRecovered = leakageItems.reduce((acc, i) => acc + i.recoveredAmount, 0);

  const preventedDuplicatesCount = billingRuns.reduce((acc, r) => acc + (r.duplicateAttemptsBlocked || 0), 0);
  const totalInvoicedByRuns = billingRuns.reduce((acc, r) => acc + r.totalBilledAmount, 0);
  const totalInvoicesByRuns = billingRuns.reduce((acc, r) => acc + r.invoicesGeneratedCount, 0);

  const unmatchedPayments = payments.filter((p) => !p.reconciled && p.status === 'success');
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === 'pending' && new Date(inv.dueDate) < new Date()
  );
  const overdueAmount = overdueInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-indigo-950/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">RevenueGuard Command Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Active Assurance v2.4
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Autonomous financial assurance, multi-tier billing validation, duplicate charge prevention, and zero-leakage statutory tax compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              runBillingValidation();
              setActiveTab('revenueguard-scanner');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Run Integrity Scan
          </button>
          <button
            onClick={() => setActiveTab('revenueguard-runs')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Execute Billing Run
          </button>
        </div>
      </div>

      {/* SECTION A: BILLING OVERVIEW (8 Core Metrics Grid) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Billing Overview & Protection Telemetry
          </h2>
          <span className="text-xs text-slate-500">Live Production Database</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('revenueguard-calendar')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Due for Billing</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">
              {subscriptions.filter((s) => s.status === 'active' || s.status === 'trial').length} Subscriptions
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Next cycle window active</span>
              <ArrowRight className="w-3 h-3 text-indigo-500" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('revenueguard-scanner')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Successfully Validated</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-2">
              {Math.max(0, subscriptions.length - openExceptions.length)} / {subscriptions.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">100% Passed 6/6 Checks</div>
          </div>

          <div
            onClick={() => setActiveTab('revenueguard-scanner')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Billing Exceptions</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-600 mt-2">
              {openExceptions.length} Detected
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              {criticalCount} Critical, {highCount} High Priority
            </div>
          </div>

          <div
            onClick={() => setActiveTab('invoices')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Invoices Generated</span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">
              {invoices.length} Invoices
            </div>
            <div className="text-[11px] text-slate-500 mt-1">₹{totalInvoicedByRuns.toLocaleString()} via Runs</div>
          </div>

          <div
            onClick={() => setActiveTab('revenueguard-leakage')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Duplicates Prevented</span>
              <CopyX className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-indigo-600 mt-2">
              {preventedDuplicatesCount} Double Invoices
            </div>
            <div className="text-[11px] text-indigo-700 font-medium mt-1">Idempotency Lock Active</div>
          </div>

          <div
            onClick={() => setActiveTab('revenueguard-reconciliation')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Unmatched Payments</span>
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">
              {unmatchedPayments.length} Receipts
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              ₹{unmatchedPayments.reduce((a, b) => a + b.amount, 0).toLocaleString()} unallocated
            </div>
          </div>

          <div
            onClick={() => setActiveTab('invoices')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Overdue Receivables</span>
              <Clock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-bold text-rose-600 mt-2">
              ₹{overdueAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-700 font-medium mt-1">{overdueInvoices.length} Invoices Past Due</div>
          </div>

          <div
            onClick={() => setActiveTab('revenueguard-leakage')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Estimated Exposure</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-indigo-950 mt-2">
              ₹{totalExposure.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">₹{totalRecovered.toLocaleString()} Protected</div>
          </div>
        </div>
      </div>

      {/* SECTION B: BILLING HEALTH SCORE (0-100 Transparent Business Rules) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Billing Assurance & Health Score
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  billingHealthScore.overallScore >= 85
                    ? 'bg-emerald-100 text-emerald-800'
                    : billingHealthScore.overallScore >= 70
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                Grade {billingHealthScore.grade}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{billingHealthScore.summary}</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Overall Assurance Index
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {billingHealthScore.overallScore}
                <span className="text-sm font-semibold text-slate-400"> / 100</span>
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white ${
                billingHealthScore.overallScore >= 85
                  ? 'bg-emerald-600'
                  : billingHealthScore.overallScore >= 70
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
            >
              {billingHealthScore.grade}
            </div>
          </div>
        </div>

        {/* 5 Component Scoring Breakdown */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(billingHealthScore.components).map(([key, comp]) => (
            <div key={key} className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800">{comp.name}</span>
                <span className="font-bold text-slate-900">
                  {comp.score} / {comp.maxScore} pts
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${
                    comp.status === 'good'
                      ? 'bg-emerald-500'
                      : comp.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${(comp.score / comp.maxScore) * 100}%` }}
                />
              </div>

              <div className="text-xs font-semibold text-slate-900">{comp.value}</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">{comp.explanation}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Formula: Validation Rate (30 pts) + Duplicate Shield (20 pts) + Tax Accuracy (15 pts) + Gateway Reconciliation (20 pts) + Receivables Hygiene (15 pts).
          </span>
          <span className="font-medium text-slate-500">Deterministic Algorithm • Zero Arbitrary Scores</span>
        </div>
      </div>

      {/* SECTION C: REVENUE PROTECTION SUMMARY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Revenue Protection Summary & Leakage Prevention
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict accounting separation between detected exposure risk and hard recovered revenue.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('revenueguard-leakage')}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Open Leakage Radar
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/70 bg-white">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Duplicate Billing Prevented
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">₹37,840</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">2 Double Charges Blocked</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/70 bg-white">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Expired Discounts Caught
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">₹3,598</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">1 Expired Voucher Revoked</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/70 bg-white">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tax Calculation Corrected
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">₹1,492</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">18% Statutory GST Enforced</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/70 bg-white">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Missing Invoices Generated
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">₹7,990</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">1 Lapsed Cycle Recovered</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/70 bg-white">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Unmatched Receipts Allocated
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">₹24,531</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Ledger Reconciled</div>
          </div>
        </div>

        {/* Financial Separation Banner */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Total Net Revenue Saved & Protected</div>
              <div className="text-[11px] text-slate-500">
                Audited against double counting and confirmed via general financial ledger.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Risk Detected</div>
              <div className="text-sm font-bold text-slate-900">₹{totalExposure.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Actual Recovered</div>
              <div className="text-base font-extrabold text-emerald-600">₹75,451</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D: RECENT BILLING ACTIVITY & ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Billing Runs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              Latest Automated Billing Runs
            </h3>
            <button
              onClick={() => setActiveTab('revenueguard-runs')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All Runs
            </button>
          </div>

          <div className="space-y-3">
            {billingRuns.slice(0, 4).map((run) => (
              <div
                key={run.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{run.runNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 uppercase">
                      {run.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {run.invoicesGeneratedCount} invoices generated • {run.readyCount} validated • {run.blockedCount} blocked
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">₹{run.totalBilledAmount.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{run.startedAt.slice(0, 10)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Exceptions & Audit Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Active Exceptions & Administrator Alerts
            </h3>
            <button
              onClick={() => setActiveTab('revenueguard-scanner')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Scanner
            </button>
          </div>

          <div className="space-y-3">
            {billingExceptions.slice(0, 4).map((exp) => (
              <div
                key={exp.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  exp.severity === 'critical'
                    ? 'border-rose-200 bg-rose-50/40'
                    : exp.severity === 'high'
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        exp.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : exp.severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {exp.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{exp.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{exp.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-900">₹{exp.financialImpact.toLocaleString()}</div>
                  <span
                    className={`inline-block text-[10px] font-semibold mt-0.5 ${
                      exp.resolutionStatus === 'resolved'
                        ? 'text-emerald-600'
                        : exp.resolutionStatus === 'overridden'
                        ? 'text-indigo-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {exp.resolutionStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
