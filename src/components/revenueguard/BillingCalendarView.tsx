import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Tag,
  FileText,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Users,
} from 'lucide-react';
import { CalendarDayScheduledItem } from '../../types';

export const BillingCalendarView: React.FC = () => {
  const { getPredictiveCalendar, subscriptions } = useApp();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October 2026
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [selectedDayItem, setSelectedDayItem] = useState<CalendarDayScheduledItem | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = getPredictiveCalendar(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Month totals
  const totalMonthDue = calendarDays.reduce((acc, d) => acc + d.subscriptionsDueCount, 0);
  const totalExpectedInvoicing = calendarDays.reduce((acc, d) => acc + d.expectedInvoiceAmount, 0);
  const totalExpectedCash = calendarDays.reduce((acc, d) => acc + d.expectedCollections, 0);
  const totalExpiringDiscounts = calendarDays.reduce((acc, d) => acc + d.expiringDiscountsCount, 0);

  // First day offset for standard Sunday-Saturday calendar
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Predictive Billing & Renewal Calendar
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cash-flow forecast model mapping contractual renewal dates, anticipated invoice runs, and expiring customer promotions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs">
            {(['monthly', 'weekly', 'daily'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Month Switcher */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs text-slate-800 min-w-[110px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Forecast Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Renewals Scheduled
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalMonthDue} Contracts</div>
          <div className="text-[11px] text-slate-500 mt-0.5">In {monthNames[currentMonth]}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Projected Invoice Run
          </div>
          <div className="text-xl font-bold text-indigo-700 mt-1">₹{totalExpectedInvoicing.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">18% GST statutory gross</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Anticipated Net Cash
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">₹{totalExpectedCash.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">94% Collection Assumption</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Expiring Discounts
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{totalExpiringDiscounts} Rules</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Automatic rate adjustments</div>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 bg-slate-50/50 rounded-xl border border-transparent" />
          ))}

          {/* Calendar Days */}
          {calendarDays.map((dayItem) => {
            const dayNum = parseInt(dayItem.date.slice(-2), 10);
            const hasActivity = dayItem.subscriptionsDueCount > 0 || dayItem.expiringDiscountsCount > 0;
            const isSelected = selectedDayItem?.date === dayItem.date;

            return (
              <div
                key={dayItem.date}
                onClick={() => setSelectedDayItem(dayItem)}
                className={`h-28 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40'
                    : hasActivity
                    ? 'border-indigo-200/80 bg-white hover:border-indigo-400 shadow-2xs'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${hasActivity ? 'text-indigo-900' : 'text-slate-500'}`}>
                    {dayNum}
                  </span>
                  {dayItem.expiringDiscountsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Discount expiring" />
                  )}
                </div>

                {hasActivity ? (
                  <div className="space-y-1">
                    {dayItem.subscriptionsDueCount > 0 && (
                      <div className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 truncate">
                        {dayItem.subscriptionsDueCount} due (₹{dayItem.expectedInvoiceAmount.toLocaleString()})
                      </div>
                    )}
                    {dayItem.expiringDiscountsCount > 0 && (
                      <div className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-[10px] font-semibold text-amber-700 truncate">
                        Discount ending
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-300 italic">No events</div>
                )}

                <div className="text-[10px] text-slate-400 text-right">
                  {dayItem.subscriptionsDueCount > 0 && `${dayItem.subscriptionsDueCount} renewals`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE INSPECTOR DRAWER / MODAL */}
      {selectedDayItem && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Scheduled Invoicing & Contract Expiries: {selectedDayItem.date}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Subscriptions scheduled for automatic billing run and promotional voucher updates.
              </p>
            </div>
            <button
              onClick={() => setSelectedDayItem(null)}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close Inspector
            </button>
          </div>

          {selectedDayItem.subscriptions.length === 0 && selectedDayItem.discountsExpiring.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Zero scheduled renewals or discount transitions on {selectedDayItem.date}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Subscriptions */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Subscriptions Scheduled ({selectedDayItem.subscriptions.length})
                </h4>
                <div className="space-y-2">
                  {selectedDayItem.subscriptions.map((sub) => (
                    <div key={sub.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{sub.company}</div>
                        <div className="text-[11px] text-slate-500">
                          {sub.planName} • {sub.billingInterval}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">₹{sub.amount.toLocaleString()}</div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800">
                          {sub.churnRisk.toUpperCase()} CHURN RISK
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiring Promotions */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Expiring Discount Rules ({selectedDayItem.discountsExpiring.length})
                </h4>
                <div className="space-y-2">
                  {selectedDayItem.discountsExpiring.length === 0 ? (
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-xs italic">
                      No discount rules expire on this date.
                    </div>
                  ) : (
                    selectedDayItem.discountsExpiring.map((d) => (
                      <div key={d.code} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs">
                        <div className="font-bold text-amber-900">Voucher: {d.code}</div>
                        <p className="text-[11px] text-amber-800 mt-1">{d.description}</p>
                        <div className="text-[10px] text-amber-700 font-semibold mt-1">
                          Lapses on {d.expiryDate.slice(0, 10)} — subsequent renewals bill at standard catalog rate.
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
