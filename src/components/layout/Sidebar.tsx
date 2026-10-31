import React from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  CreditCard,
  FileText,
  RefreshCw,
  Sparkles,
  BarChart3,
  UserCheck,
  Code2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab, currentUser, unreadNotifCount } = useApp();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'plans', label: 'Subscription Plans', icon: Layers },
    { id: 'subscriptions', label: 'Subscriptions', icon: CalendarDays },
    { id: 'payments', label: 'Payments & Gateway', icon: CreditCard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'renewals', label: 'Renewals & Dunning', icon: RefreshCw },
    {
      id: 'ai-insights',
      label: 'AI Churn Engine',
      icon: Sparkles,
      badge: 'ML',
      badgeColor: 'bg-indigo-100 text-indigo-700 font-semibold',
    },
    { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3 },
    {
      id: 'customer-portal',
      label: 'Customer Portal',
      icon: UserCheck,
      badge: 'Tenant',
      badgeColor: 'bg-emerald-100 text-emerald-700 font-medium',
    },
    {
      id: 'architecture',
      label: 'Backend & Specs',
      icon: Code2,
      badge: 'FastAPI',
      badgeColor: 'bg-amber-100 text-amber-800 font-medium',
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-indigo-200 shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-sm leading-none flex items-center gap-1.5">
                SubFlow
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Enterprise
                </span>
              </span>
              <span className="text-[11px] text-slate-400 mt-1">SaaS Recurring Billing</span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-2 px-2">
          {!collapsed ? (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Platform Modules
            </span>
          ) : (
            <div className="h-2" />
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />

              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}

              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Gateway & Environment Status Card */}
      {!collapsed ? (
        <div className="p-3 mx-3 mb-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Razorpay Engine
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
              Test Mode
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>DB State:</span>
            <span className="text-slate-800 font-medium">Synced In-Memory/Local</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1">
            <span>GST Compliance:</span>
            <span className="text-slate-800 font-medium">18% Auto-calc</span>
          </div>
        </div>
      ) : (
        <div className="p-3 flex justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-500" title="System Operational & Test Mode Active" />
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 flex items-center gap-3">
        <img
          src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
        />
        {!collapsed && (
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</span>
            <span className="text-[10px] text-slate-400 truncate capitalize">{currentUser.role} Account</span>
          </div>
        )}
      </div>
    </aside>
  );
};
