import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changePeriod?: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changePeriod = 'vs last month',
  subtext,
  icon: Icon,
  accentColor = 'indigo',
  onClick,
}) => {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badgeBg: 'bg-indigo-50/80 text-indigo-700',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badgeBg: 'bg-emerald-50/80 text-emerald-700',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badgeBg: 'bg-amber-50/80 text-amber-700',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      badgeBg: 'bg-rose-50/80 text-rose-700',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
  }[accentColor];

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-indigo-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 tracking-wide">{title}</span>
        <div className={`p-2 rounded-xl border ${colorStyles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {change !== undefined ? (
          <div
            className={`inline-flex items-center gap-0.5 font-semibold text-[11px] px-1.5 py-0.5 rounded ${
              isPositive
                ? 'text-emerald-700 bg-emerald-50'
                : isNegative
                ? 'text-rose-700 bg-rose-50'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            {isPositive && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
            {isNegative && <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        ) : null}

        <span className="text-slate-400 text-[11px]">{subtext || changePeriod}</span>
      </div>
    </div>
  );
};
