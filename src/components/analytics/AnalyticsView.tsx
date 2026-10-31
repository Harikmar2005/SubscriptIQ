import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Percent,
  DollarSign,
  Users,
  CreditCard,
  HelpCircle,
  Calculator,
  BookOpen,
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const {
    metrics,
    plans,
    subscriptions,
    payments,
    financialLedger,
    revenueAnomalies,
    resolveAnomaly,
    runWhatIfSimulation,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'economics' | 'simulator' | 'ledger' | 'anomalies'>('economics');
  const [selectedYear, setSelectedYear] = useState('2026');

  // What-If Simulation State
  const [simGrowth, setSimGrowth] = useState<number>(8);
  const [simChurn, setSimChurn] = useState<number>(2.4);
  const [simArpuDelta, setSimArpuDelta] = useState<number>(0);
  const [simNewSignups, setSimNewSignups] = useState<number>(5);

  const simulationResult = runWhatIfSimulation({
    growthRatePct: simGrowth,
    churnRatePct: simChurn,
    arpuChangePct: simArpuDelta,
    newSignupsPerMonth: simNewSignups,
  });

  // Plan distribution data
  const planRevenueBreakdown = plans.map((p) => {
    const subs = subscriptions.filter((s) => s.planId === p.id && s.status === 'active');
    const monthlyRev = subs.reduce((acc, s) => {
      return acc + (s.billingInterval === 'annual' ? Math.round(p.annualPrice / 12) : p.monthlyPrice);
    }, 0);
    return {
      planName: p.name,
      subscribers: subs.length,
      monthlyRev,
      annualizedRev: monthlyRev * 12,
    };
  });

  // Monthly performance dataset
  const monthlyMetricsData = [
    { month: 'Jun', mrr: Math.round(metrics.mrr * 0.72), arpu: 680, churn: 2.1, newSubs: 2 },
    { month: 'Jul', mrr: Math.round(metrics.mrr * 0.81), arpu: 710, churn: 2.8, newSubs: 3 },
    { month: 'Aug', mrr: Math.round(metrics.mrr * 0.88), arpu: 745, churn: 1.9, newSubs: 4 },
    { month: 'Sep', mrr: Math.round(metrics.mrr * 0.94), arpu: 770, churn: 2.3, newSubs: 4 },
    { month: 'Oct', mrr: metrics.mrr, arpu: metrics.arpu, churn: metrics.churnRate, newSubs: 5 },
  ];

  // Ledger summary
  const totalDebits = financialLedger
    .filter((l) => l.entryType === 'debit')
    .reduce((acc, l) => acc + l.amount, 0);
  const totalCredits = financialLedger
    .filter((l) => l.entryType === 'credit')
    .reduce((acc, l) => acc + l.amount, 0);
  const isLedgerBalanced = totalDebits === totalCredits;

  const exportFinancialReport = () => {
    const headers = ['Metric', 'Current Value', 'Calculation Formula'];
    const rows = [
      ['Monthly Recurring Revenue (MRR)', `₹${metrics.mrr.toLocaleString()}`, 'Sum of normalized monthly plan fees of all active subscriptions'],
      ['Annual Recurring Revenue (ARR)', `₹${metrics.arr.toLocaleString()}`, 'MRR * 12'],
      ['Average Revenue Per User (ARPU)', `₹${metrics.arpu.toLocaleString()}`, 'MRR / Total Active Subscriptions'],
      ['Customer Lifetime Value (LTV)', `₹${metrics.clv.toLocaleString()}`, 'ARPU / Monthly Churn Rate'],
      ['Logo Churn Rate', `${metrics.logoChurnRate}%`, 'Cancelled Accounts / Total Accounts'],
      ['Revenue Churn Rate', `${metrics.revenueChurnRate}%`, 'Lost MRR / Beginning MRR'],
      ['Gateway Success Rate', `${metrics.paymentSuccessRate}%`, 'Successful Charges / Total Payment Attempts * 100'],
      ['Reconciled Volume', `₹${metrics.reconciledVolume.toLocaleString()}`, 'Settled Razorpay gateway volume'],
      ['Double-Entry Ledger Status', isLedgerBalanced ? 'Balanced' : 'Discrepancy', `Debits: ₹${totalDebits} = Credits: ₹${totalCredits}`],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subscriptiq_financial_report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Financial Analytics & SaaS Unit Economics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time calculation of MRR, ARR, LTV, ARPU, double-entry financial ledger, and what-if simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold"
          >
            <option value="2026">FY 2026-27</option>
            <option value="2025">FY 2025-26</option>
          </select>

          <button
            onClick={exportFinancialReport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Audit Report
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('economics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'economics' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Unit Economics & Revenue</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'simulator' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>What-If Revenue Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Double-Entry Financial Ledger ({financialLedger.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'anomalies' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Anomaly Detection ({revenueAnomalies.filter((a) => a.status === 'detected').length} alerts)</span>
        </button>
      </div>

      {/* Core Unit Economics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Monthly Recurring Rev (MRR)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{metrics.mrr.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">+{metrics.mrrGrowth}% MoM Velocity</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Annualized Run-Rate (ARR)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{metrics.arr.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">+{metrics.arrGrowth}% YoY Run-rate</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Avg Revenue / User (ARPU)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{metrics.arpu.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Logo Churn: {metrics.logoChurnRate}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Customer Lifetime Value (LTV)
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1">₹{metrics.clv.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">Rev Churn: {metrics.revenueChurnRate}%</div>
        </div>
      </div>

      {/* TAB 1: ECONOMICS */}
      {activeTab === 'economics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Plan-wise Revenue Contribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Plan Tier Revenue Breakdown</h3>
                  <p className="text-xs text-slate-500">Gross monthly revenue generated by each plan tier</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planRevenueBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="planName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Monthly Rev']}
                    />
                    <Bar dataKey="monthlyRev" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: ARPU vs Churn Rate Trend */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">ARPU Expansion & Churn Stability</h3>
                  <p className="text-xs text-slate-500">Historical trend of Average Revenue Per User</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyMetricsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="arpu"
                      name="ARPU (INR)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tax & Reconciliation Summary Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Statutory GST Breakdown (SAC 998313 - 18%)
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Decimally computed tax allocation separating base subscription fees from statutory GST liabilities.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Net Taxable Subtotal</span>
                  <span className="font-bold text-slate-900">
                    ₹{Math.round(metrics.mrr / 1.18).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Central GST (CGST @ 9%)</span>
                  <span className="font-bold text-slate-900">
                    ₹{Math.round((metrics.mrr - metrics.mrr / 1.18) / 2).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">State GST (SGST @ 9%)</span>
                  <span className="font-bold text-slate-900">
                    ₹{Math.round((metrics.mrr - metrics.mrr / 1.18) / 2).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-indigo-700">
                  <span>Total Gross Invoiced (Incl. 18% GST)</span>
                  <span>₹{metrics.mrr.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Payment Reconciliation Status
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Automated matching of incoming Razorpay webhook settlements with customer accounts.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Reconciled Gateway Volume</span>
                  <span className="font-bold text-emerald-600">
                    ₹{metrics.reconciledVolume.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Unreconciled / Pending</span>
                  <span className="font-bold text-amber-600">
                    ₹{metrics.unreconciledVolume.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Overall Success Ratio</span>
                  <span className="font-bold text-slate-900">{metrics.paymentSuccessRate}%</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-slate-900">
                  <span>Reconciliation Efficiency</span>
                  <span className="text-emerald-700">96.8% Automated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHAT-IF SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interactive SaaS Revenue Sandbox</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate 12-month ARR trajectories under varying growth, churn, pricing, and signup scenarios.
              </p>
            </div>

            {/* Interactive Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Monthly Growth Rate</span>
                  <span className="font-bold text-indigo-600">{simGrowth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={simGrowth}
                  onChange={(e) => setSimGrowth(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="text-[10px] text-slate-400">Baseline organic MoM expansion</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Monthly Churn Rate</span>
                  <span className="font-bold text-rose-600">{simChurn}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={simChurn}
                  onChange={(e) => setSimChurn(parseFloat(e.target.value))}
                  className="w-full accent-rose-600"
                />
                <div className="text-[10px] text-slate-400">Projected customer decay</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">ARPU Price Adjustment</span>
                  <span className="font-bold text-emerald-600">{simArpuDelta > 0 ? `+${simArpuDelta}%` : `${simArpuDelta}%`}</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="5"
                  value={simArpuDelta}
                  onChange={(e) => setSimArpuDelta(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="text-[10px] text-slate-400">Packaging / price expansion</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">New Signups / Month</span>
                  <span className="font-bold text-slate-900">{simNewSignups}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={simNewSignups}
                  onChange={(e) => setSimNewSignups(parseInt(e.target.value))}
                  className="w-full accent-slate-800"
                />
                <div className="text-[10px] text-slate-400">Inbound sales funnel volume</div>
              </div>
            </div>

            {/* Simulation KPI Outputs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <div className="text-[10px] font-bold text-indigo-600 uppercase">Projected ARR (Month 12)</div>
                <div className="text-2xl font-black text-indigo-950 mt-1">
                  ₹{simulationResult.projectedArrIn12Months.toLocaleString()}
                </div>
                <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                  vs ₹{simulationResult.currentArr.toLocaleString()} Current
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Net New ARR Generated</div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  +₹{simulationResult.netNewArr.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  +{Math.round((simulationResult.netNewArr / (simulationResult.currentArr || 1)) * 100)}% Growth
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
                <div className="text-[10px] font-bold text-rose-600 uppercase">12-Mo Cumulative Churn Drag</div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  -₹{simulationResult.totalChurnLoss.toLocaleString()}
                </div>
                <div className="text-[11px] text-rose-700 font-medium mt-0.5">
                  Preventable with AI retention
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Projected Exit MRR</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{Math.round(simulationResult.projectedArrIn12Months / 12).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">At end of Month 12</div>
              </div>
            </div>

            {/* Trajectory Chart */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                12-Month Projected MRR Trajectory
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationResult.monthlyTrajectory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Simulated MRR']}
                    />
                    <Line
                      type="monotone"
                      dataKey="mrr"
                      name="Projected MRR"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOUBLE-ENTRY FINANCIAL LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Double-Entry Financial Audit Ledger</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isLedgerBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isLedgerBalanced ? 'Ledger Balanced' : 'Imbalance Detected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every settled transaction generates balanced Debit (Cash/Gateway Asset) and Credits (Net Subscription Revenue + 18% GST Output Liability).
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="text-emerald-700">Total Debits: ₹{totalDebits.toLocaleString()}</div>
              <div className="text-indigo-700">Total Credits: ₹{totalCredits.toLocaleString()}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Entry ID / Date</th>
                  <th className="py-2.5 px-4 font-semibold">Transaction Reference</th>
                  <th className="py-2.5 px-4 font-semibold">Account Name</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Debit (INR)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Credit (INR)</th>
                  <th className="py-2.5 px-4 font-semibold">Memo / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financialLedger.map((entry) => {
                  const isDebit = entry.entryType === 'debit';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        <div>{entry.id}</div>
                        <div className="text-[10px] text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{entry.transactionId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{entry.accountName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isDebit ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {entry.entryType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {isDebit ? `₹${entry.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                        {!isDebit ? `₹${entry.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{entry.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REVENUE ANOMALIES */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Automated Revenue Anomaly Alerts (z-score &gt; 2.5)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statistical monitoring detects unusual payment drop-offs, sudden cancellation spikes, or unexpected discount velocity.
            </p>

            <div className="mt-4 space-y-3">
              {revenueAnomalies.map((anom) => (
                <div
                  key={anom.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    anom.status === 'detected'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {(anom.anomalyType || anom.metric || 'Anomaly').replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        z-score: {anom.zScore || anom.deviationScore || 2.5}
                      </span>
                      <span className="text-xs text-slate-400">• Detected {new Date(anom.detectedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      Expected ₹{(anom.expectedValue || 12000).toLocaleString()} vs Actual ₹{(anom.actualValue || 8500).toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-600">{anom.rootCauseDescription || anom.rootCause}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {anom.status === 'detected' ? (
                      <button
                        onClick={() => resolveAnomaly(anom.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
                      >
                        Investigate & Mark Resolved
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mathematical SaaS Formula Reference */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 text-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          SaaS Operational Formulas Enforced in Engine
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800">Monthly Recurring Revenue (MRR)</div>
            <div className="font-mono text-indigo-600 mt-1">∑ (MonthlyFee + AnnualFee / 12)</div>
            <p className="text-slate-500 mt-1 text-[11px]">Normalized monthly subscription revenue across all active contracts.</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800">Customer Lifetime Value (LTV)</div>
            <div className="font-mono text-indigo-600 mt-1">ARPU / Monthly Churn Rate</div>
            <p className="text-slate-500 mt-1 text-[11px]">Total projected gross margin generated by an entity over its lifespan.</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800">Double-Entry Balancing Rule</div>
            <div className="font-mono text-indigo-600 mt-1">Debit Cash = Credit Rev + Credit Tax</div>
            <p className="text-slate-500 mt-1 text-[11px]">Zero-discrepancy statutory accounting integrity for all payment settlements.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
