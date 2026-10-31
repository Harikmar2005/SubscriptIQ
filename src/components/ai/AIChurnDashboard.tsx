import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Brain,
  ShieldAlert,
  ArrowRight,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  Award,
  BarChart2,
  Gift,
  Zap,
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
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const AIChurnDashboard: React.FC = () => {
  const {
    churnPredictions,
    forecast,
    metrics,
    mlModelMetrics,
    retentionCampaigns,
    applyRetentionOffer,
  } = useApp();

  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [forecastModel, setForecastModel] = useState<'projected' | 'conservative' | 'optimistic'>('projected');
  const [activeTabSub, setActiveTabSub] = useState<'predictions' | 'model-metrics' | 'retention-campaigns'>('predictions');

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
            Trained supervised machine learning classifier evaluating payment failure velocity, engagement telemetry, and renewal volatility.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
            Model: {mlModelMetrics.modelType} (v{mlModelMetrics.version})
          </span>
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
            ROC-AUC: {mlModelMetrics.rocAuc}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTabSub('predictions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTabSub === 'predictions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Customer Risk Ledger ({churnPredictions.length})</span>
        </button>
        <button
          onClick={() => setActiveTabSub('model-metrics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTabSub === 'model-metrics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>ML Model Evaluation & SHAP Features</span>
        </button>
        <button
          onClick={() => setActiveTabSub('retention-campaigns')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTabSub === 'retention-campaigns'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Smart Retention Campaigns ({retentionCampaigns.length})</span>
        </button>
      </div>

      {/* Risk Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Fleet Health Score
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {metrics.healthScoreAvg}/100
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High enterprise stability
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
            Needs retention offer
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
            Usage warning triggers
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

      {activeTabSub === 'model-metrics' && (
        <div className="space-y-6">
          {/* ML Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Model Accuracy</div>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {(mlModelMetrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Test split 20%</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">ROC - AUC Score</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {mlModelMetrics.rocAuc}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">High separability</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Precision</div>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                {(mlModelMetrics.precision * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Low false positives</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Recall</div>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                {(mlModelMetrics.recall * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Catches 85% churn</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Training Samples</div>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                {mlModelMetrics.trainingSamplesCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">5-fold stratified CV</div>
            </div>
          </div>

          {/* Confusion Matrix & Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Empirical Confusion Matrix (Validation Set)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-semibold text-emerald-700">True Positives (TP)</div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">
                    {mlModelMetrics.confusionMatrix.truePositive}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-1">Correctly identified churn</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] font-semibold text-amber-700">False Positives (FP)</div>
                  <div className="text-2xl font-black text-amber-800 mt-1">
                    {mlModelMetrics.confusionMatrix.falsePositive}
                  </div>
                  <div className="text-[10px] text-amber-600 mt-1">Safe flagged as churn</div>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[11px] font-semibold text-rose-700">False Negatives (FN)</div>
                  <div className="text-2xl font-black text-rose-800 mt-1">
                    {mlModelMetrics.confusionMatrix.falseNegative}
                  </div>
                  <div className="text-[10px] text-rose-600 mt-1">Missed churn events</div>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[11px] font-semibold text-indigo-700">True Negatives (TN)</div>
                  <div className="text-2xl font-black text-indigo-800 mt-1">
                    {mlModelMetrics.confusionMatrix.trueNegative}
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-1">Correctly identified retained</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-500">
                Evaluation performed on held-out validation cohort using balanced class weights to prevent majority-class bias.
              </div>
            </div>

            {/* Feature Importance Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Feature Importance Ranking (Gini Impurity Drop)
              </h3>
              <div className="space-y-3">
                {mlModelMetrics.featureImportances.map((feat, idx: number) => {
                  const pct = Math.round(feat.importancePct || (feat.importance ? feat.importance * 100 : 20));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{feat.feature}</span>
                        <span className="font-bold text-slate-900">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTabSub === 'retention-campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Smart Retention Campaigns</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated retention offers triggered by trained churn risk thresholds to intercept customer cancellations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {retentionCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      {camp.campaignName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        camp.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-1">{camp.company}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Offer: <span className="font-semibold text-slate-800">{camp.offerDiscountPct}% Discount</span> on renewal for {camp.offerDurationMonths} months.
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Target Risk: <span className="font-semibold text-rose-600">{(camp.triggerRiskLevel || 'HIGH').toUpperCase()}</span>
                  </span>
                  {camp.status === 'accepted' ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" /> Coupon Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => applyRetentionOffer(camp.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Apply 20% Retention Offer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Forecasting Section */}
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

      {/* Customer Risk Ledger with Explainable SHAP Attribution */}
      {activeTabSub === 'predictions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Customer Retention Risk Ledger & SHAP Contributions
              </h3>
              <p className="text-xs text-slate-500">
                Individual account risk scores with trained feature attribution weights.
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
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{pred.customerName}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="font-medium text-slate-600 text-xs">{pred.company}</span>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {pred.planName} (₹{pred.monthlyValue}/mo)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Renews in {pred.daysToRenewal} days
                        </span>
                      </div>

                      {/* SHAP-style Waterfall Contribution Tags */}
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Feature Contributions (SHAP-style):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pred.contributions && pred.contributions.length > 0 ? (
                            pred.contributions.map((c, i) => (
                              <div
                                key={i}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                                  c.impactWeight > 0
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                                title={c.description}
                              >
                                <span>{c.feature}:</span>
                                <span className="font-bold">{c.value}</span>
                                <span className="text-[10px] opacity-75">
                                  ({c.impactWeight > 0 ? `+${c.impactWeight}%` : `${c.impactWeight}%`})
                                </span>
                              </div>
                            ))
                          ) : (
                            pred.keyFactors.map((kf, i) => (
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
                            ))
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 pt-1 flex items-start gap-1.5">
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
      )}
    </div>
  );
};
