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
  Package,
  FileCheck2,
  ShieldAlert,
  Calendar,
  History,
  Link2,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

interface NavSection {
  title: string;
  items: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab, billingExceptions, leakageItems } = useApp();

  const openExceptionsCount = billingExceptions.filter((e) => e.resolutionStatus === 'open').length;
  const activeLeakageCount = leakageItems.filter((i) => i.status === 'detected').length;

  const navSections: NavSection[] = [
    {
      title: 'SUBSCRIPTIQ CORE',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'products', label: 'Products & Variants', icon: Package },
        { id: 'plans', label: 'Subscription Plans', icon: Layers },
        { id: 'quotations', label: 'Quotations', icon: FileCheck2 },
        { id: 'subscriptions', label: 'Subscriptions', icon: CalendarDays },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'payments', label: 'Payments & Gateway', icon: CreditCard },
        { id: 'renewals', label: 'Renewals & Dunning', icon: RefreshCw },
      ],
    },
    {
      title: 'REVENUEGUARD ENGINE',
      items: [
        {
          id: 'revenueguard-overview',
          label: 'Billing Overview',
          icon: ShieldCheck,
          badge: 'Live',
          badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
        },
        {
          id: 'revenueguard-scanner',
          label: 'Integrity Scanner',
          icon: ShieldCheck,
          badge: openExceptionsCount > 0 ? openExceptionsCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-800 font-bold',
        },
        {
          id: 'revenueguard-runs',
          label: 'Billing Runs',
          icon: RefreshCw,
        },
        {
          id: 'revenueguard-leakage',
          label: 'Revenue Leakage Radar',
          icon: ShieldAlert,
          badge: activeLeakageCount > 0 ? activeLeakageCount : undefined,
          badgeColor: 'bg-rose-100 text-rose-800 font-bold',
        },
        {
          id: 'revenueguard-reconciliation',
          label: 'Payment Reconciliation',
          icon: Link2,
        },
        {
          id: 'revenueguard-calendar',
          label: 'Billing Calendar',
          icon: Calendar,
        },
        {
          id: 'revenueguard-ledger',
          label: 'Evidence Ledger',
          icon: History,
          badge: 'Audit',
          badgeColor: 'bg-indigo-100 text-indigo-700 font-semibold',
        },
        {
          id: 'ai-insights',
          label: 'AI Churn Intelligence',
          icon: Sparkles,
          badge: 'ML',
          badgeColor: 'bg-indigo-100 text-indigo-700 font-semibold',
        },
      ],
    },
    {
      title: 'PLATFORM & ARCHITECTURE',
      items: [
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
      ],
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
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-indigo-200 shrink-0 tracking-tighter">
            RG
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-sm leading-none flex items-center gap-1.5">
                Subscript<span className="text-indigo-600">IQ</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  RevenueGuard
                </span>
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Billing Assurance Engine</span>
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
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2 pb-1">
              {!collapsed ? (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </span>
              ) : (
                <div className="h-1 border-t border-slate-100 my-2" />
              )}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
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
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${item.badgeColor}`}>
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
          </div>
        ))}
      </nav>

      {/* Live Assurance Guard Badge */}
      {!collapsed ? (
        <div className="p-3 mx-3 mb-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Assurance Shield
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              ACTIVE
            </span>
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            6 Pre-flight checkpoints verifying idempotency & GST compliance.
          </div>
        </div>
      ) : null}
    </aside>
  );
};
