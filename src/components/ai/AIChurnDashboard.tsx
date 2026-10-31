import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Brain,
  ShieldAlert,
  ArrowRight,
  Sliders,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const AIChurnDashboard: React.FC = () => {
  const { churnPredictions, forecast, metrics, setActiveTab } = useApp();

  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [forecastModel, setForecastModel] = useState<'projected' | 'conservative' | 'optimistic'>('projected');

  const filteredPredictions = churnPredictions.filter((p) => {
    if (riskFilter === 'all') return true;
    return p.churnRisk === riskFilter;
  });

  const highRiskCount = churnPredictions.filter((p) => p.churnRisk === 'high').length;
  const mediumRiskCount = churnPredictions.filter((p) => p.churnRisk === 'medium').length;
  const lowRiskCount = churnPredictions.filter((p) => p.churnRisk === 'low').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Intelligent Customer Retention & Churn Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Machine Learning and behavioral heuristics analyzing payment failure velocity, engagement trends, and renewal volatility.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
            Model: Multi-Signal Gradient Classifier
          </span>
        </div>
      </div>

      {/* Feature 1 & 3: Risk Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Average Health Score
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {metrics.healthScoreAvg}/100
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High fleet stability
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            High Churn Risk
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {highRiskCount} Accounts
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">
            Needs immediate intervention
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Medium Churn Risk
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {mediumRiskCount} Accounts
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Monitor API limits & support
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Healthy & Loyal
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {lowRiskCount} Accounts
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Prime for Annual upgrades
          </div>
        </div>
      </div>

      {/* Feature 4: Revenue Forecasting Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Predictive Revenue Forecasting (Next 6 Months)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulated MRR trajectory combining active contract renewals, expansion MRR, and churn probability.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs self-start">
            <button
              onClick={() => setForecastModel('projected')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                forecastModel === 'projected' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Base Plan (8% MoM)
            </button>
            <button
              onClick={() => setForecastModel('conservative')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                forecastModel === 'conservative' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Conservative (3.5% Churn)
            </button>
            <button
              onClick={() => setForecastModel('optimistic')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                forecastModel === 'optimistic' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Aggressive (14% Growth)
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Projected MRR']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="projectedMrr"
                name="Baseline Projection (INR)"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="conservativeMrr"
                name="Conservative Model"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="optimisticMrr"
                name="Aggressive Expansion"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="2 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
          <div>
            <strong>Assumptions:</strong> 8% net monthly subscriber addition.
          </div>
          <div>
            <strong>Projected Monthly Churn Loss:</strong> ~2.5% annualized decay.
          </div>
          <div>
            <strong>LTV Expansion:</strong> Average Customer Lifetime Value = ₹{metrics.clv.toLocaleString()}.
          </div>
        </div>
      </div>

      {/* Feature 1: Churn Predictions Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Customer Retention Risk Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Detailed behavioral signals and automated AI remediation steps.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs self-start">
            {(['all', 'high', 'medium', 'low'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-all ${
                  riskFilter === lvl ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                {lvl} Risk
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPredictions.map((pred) => {
            const isHigh = pred.churnRisk === 'high';
            const isMed = pred.churnRisk === 'medium';

            return (
              <div key={pred.customerId} className="p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{pred.customerName}</span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="font-medium text-slate-600 text-xs">{pred.company}</span>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {pred.planName} (₹{pred.monthlyValue}/mo)
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Identified Risk Factors:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pred.keyFactors.map((kf, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                              isHigh
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isMed
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {kf}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 pt-2 flex items-start gap-1.5">
                      <strong className="text-indigo-900 shrink-0">Prescribed Retention Action:</strong>
                      <span>{pred.recommendedAction}</span>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-2">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Churn Probability</div>
                      <div
                        className={`text-lg font-black ${
                          isHigh ? 'text-rose-600' : isMed ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {pred.riskScore}%
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isMed
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {pred.churnRisk} Churn Risk
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
