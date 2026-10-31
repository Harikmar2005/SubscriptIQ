import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  RotateCcw,
  UserCheck,
  Shield,
  Check,
  ChevronDown,
  Building,
  ExternalLink,
  Sliders,
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    switchRole,
    notifications,
    unreadNotifCount,
    markNotificationRead,
    markAllNotificationsRead,
    resetAllDemoData,
    customers,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; subtitle: string; tab: any }[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: { type: string; title: string; subtitle: string; tab: any }[] = [];

    customers.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
        results.push({
          type: 'Customer',
          title: c.name,
          subtitle: `${c.company} • ${c.currentPlanName || 'No plan'}`,
          tab: 'customers',
        });
      }
    });

    if ('subscriptions'.includes(q) || 'pro'.includes(q) || 'basic'.includes(q) || 'enterprise'.includes(q)) {
      results.push({
        type: 'Module',
        title: 'Subscription Tiers',
        subtitle: 'Basic, Pro, Enterprise pricing management',
        tab: 'plans',
      });
    }

    if ('payment'.includes(q) || 'razorpay'.includes(q) || 'failed'.includes(q) || 'invoice'.includes(q)) {
      results.push({
        type: 'Module',
        title: 'Payments & Razorpay Transactions',
        subtitle: 'Review payment history, retries, and simulated gateways',
        tab: 'payments',
      });
    }

    if ('churn'.includes(q) || 'ai'.includes(q) || 'risk'.includes(q)) {
      results.push({
        type: 'Feature',
        title: 'AI Churn Intelligence',
        subtitle: 'Predictive churn risk & health score analysis',
        tab: 'ai-insights',
      });
    }

    setSearchResults(results.slice(0, 5));
  }, [searchQuery, customers]);

  // Tab title mapping for breadcrumbs
  const tabTitles: Record<string, string> = {
    dashboard: 'Executive Dashboard & Financial Overview',
    customers: 'Customer Accounts & Directory',
    plans: 'Subscription Plan Configurations',
    subscriptions: 'Lifecycle State Machine & Subscriptions',
    payments: 'Payment Processing & Razorpay Gateway',
    invoices: 'Tax Invoices & Billing Records',
    renewals: 'Automated Renewal Engine & Dunning',
    'ai-insights': 'AI Churn Intelligence & Health Scoring',
    analytics: 'Financial Reports & Revenue Forecasting',
    'customer-portal': 'Tenant Customer Portal',
    architecture: 'Full-Stack Architecture & Codebase',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">SubscriptIQ Enterprise</span>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-800">
          {tabTitles[activeTab] || 'Dashboard'}
        </span>
      </div>

      {/* Center Search Input */}
      <div className="relative max-w-md w-full mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, plans, payments, invoices..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
            <div className="text-[10px] uppercase font-semibold text-slate-400 px-2.5 py-1">Quick Matches</div>
            {searchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveTab(res.tab);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-medium text-slate-800 group-hover:text-indigo-700">{res.title}</div>
                  <div className="text-[11px] text-slate-400">{res.subtitle}</div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {res.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Reset Demo Data button */}
        <button
          onClick={resetAllDemoData}
          title="Reset database to fresh hackathon demonstration state"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden lg:inline">Reset Demo</span>
        </button>

        {/* Role Switcher Menu */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              currentUser.role === 'admin'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {currentUser.role === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <Building className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="font-semibold">
              {currentUser.role === 'admin' ? 'Super Admin' : 'Customer Portal'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simulate Perspective
              </div>

              <button
                onClick={() => {
                  switchRole('admin');
                  setShowRoleMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentUser.role === 'admin'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <div className="text-left">
                    <div className="font-semibold">Alexander Vance</div>
                    <div className="text-[10px] text-slate-400">Super Administrator</div>
                  </div>
                </div>
                {currentUser.role === 'admin' && <Check className="w-4 h-4 text-indigo-600" />}
              </button>

              <button
                onClick={() => {
                  switchRole('customer', 'cust-1');
                  setShowRoleMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors mt-1 ${
                  currentUser.role === 'customer'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold">Sarah Jenkins</div>
                    <div className="text-[10px] text-slate-400">TechNova Solutions (Pro Plan)</div>
                  </div>
                </div>
                {currentUser.role === 'customer' && <Check className="w-4 h-4 text-emerald-600" />}
              </button>

              <div className="mt-2 pt-2 border-t border-slate-100 px-2 text-[11px] text-slate-400 leading-tight">
                Switching instantly toggles between administrative controls and the multi-tenant customer self-service portal.
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="System Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                  {unreadNotifCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {unreadNotifCount} new
                    </span>
                  )}
                </div>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`py-3 px-2 flex items-start gap-3 rounded-lg cursor-pointer transition-colors ${
                        !n.read ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.read ? 'bg-indigo-600' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 truncate">{n.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>Dunning & Renewal Monitor</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-Scheduler Active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
