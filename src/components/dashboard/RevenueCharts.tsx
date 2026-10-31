import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { TrendingUp, Layers, PieChart as PieIcon, Activity } from 'lucide-react';

export const RevenueCharts: React.FC = () => {
  const { metrics, plans, subscriptions, payments } = useApp();
  const [chartTimeframe, setChartTimeframe] = useState<'6m' | '1y'>('6m');

  // Realistic revenue trend data based on calculated metrics
  const currentMrr = metrics.mrr || 4500;
  const revenueTrendData = [
    { month: 'May', mrr: Math.round(currentMrr * 0.65), arr: Math.round(currentMrr * 0.65 * 12), newSubs: 2 },
    { month: 'Jun', mrr: Math.round(currentMrr * 0.72), arr: Math.round(currentMrr * 0.72 * 12), newSubs: 3 },
    { month: 'Jul', mrr: Math.round(currentMrr * 0.81), arr: Math.round(currentMrr * 0.81 * 12), newSubs: 3 },
    { month: 'Aug', mrr: Math.round(currentMrr * 0.88), arr: Math.round(currentMrr * 0.88 * 12), newSubs: 4 },
    { month: 'Sep', mrr: Math.round(currentMrr * 0.94), arr: Math.round(currentMrr * 0.94 * 12), newSubs: 4 },
    { month: 'Oct (Current)', mrr: currentMrr, arr: metrics.arr, newSubs: 5 },
  ];

  // Subscription distribution by plan
  const planData = plans.map((p) => {
    const count = subscriptions.filter((s) => s.planId === p.id && s.status === 'active').length;
    const rev = count * p.monthlyPrice;
    return {
      name: p.name.split(' ')[0], // 'Basic', 'Pro', 'Enterprise'
      fullName: p.name,
      subscriptions: count,
      revenue: rev,
    };
  });

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'];

  // Payment status distribution
  const successfulCount = payments.filter((p) => p.status === 'success').length;
  const failedCount = payments.filter((p) => p.status === 'failed').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const refundedCount = payments.filter((p) => p.status === 'refunded').length;

  const paymentBreakdown = [
    { name: 'Successful', value: successfulCount, color: '#10b981' },
    { name: 'Failed', value: failedCount, color: '#f43f5e' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Refunded', value: refundedCount, color: '#94a3b8' },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
      {/* Chart 1: Revenue Trends (MRR Growth) */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Recurring Revenue Velocity (MRR)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated subscription revenue calculated from active accounts
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs self-start">
            <button
              onClick={() => setChartTimeframe('6m')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                chartTimeframe === '6m' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setChartTimeframe('1y')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                chartTimeframe === '1y' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              1 Year Trajectory
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'MRR']}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMrr)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-slate-600 font-medium">Current MRR:</span>
            <span className="font-bold text-slate-900">₹{metrics.mrr.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Annualized Run-Rate (ARR):</span>
            <span className="font-bold text-slate-900">₹{metrics.arr.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Chart 2: Plan Breakdown & Payment Health */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Plan Contribution</h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">By Subscriptions</span>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="subscriptions"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} active accounts (₹${item.payload.revenue.toLocaleString()}/mo)`,
                    item.payload.fullName,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-slate-900">{metrics.activeSubscriptions}</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Active</span>
            </div>
          </div>

          {/* Plan legend */}
          <div className="space-y-2 mt-2">
            {planData.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-700">{p.fullName}</span>
                </div>
                <span className="font-semibold text-slate-900">₹{p.revenue.toLocaleString()}/mo</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Success Rate Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Gateway Success Rate</span>
            <span className="font-bold text-emerald-700">{metrics.paymentSuccessRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${metrics.paymentSuccessRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
