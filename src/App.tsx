import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { DemoWorkflowBar } from './components/layout/DemoWorkflowBar';
import { ToastContainer } from './components/common/ToastContainer';
import { KPICard } from './components/dashboard/KPICard';
import { RevenueCharts } from './components/dashboard/RevenueCharts';
import { RecentActivityWidgets } from './components/dashboard/RecentActivityWidgets';
import { CustomerList } from './components/customers/CustomerList';
import { PlanCards } from './components/plans/PlanCards';
import { SubscriptionTable } from './components/subscriptions/SubscriptionTable';
import { PaymentTable } from './components/payments/PaymentTable';
import { InvoiceTable } from './components/invoices/InvoiceTable';
import { RenewalManager } from './components/renewals/RenewalManager';
import { AIChurnDashboard } from './components/ai/AIChurnDashboard';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CustomerPortalView } from './components/customerPortal/CustomerPortalView';
import { ArchitectureViewer } from './components/architecture/ArchitectureViewer';
import { SimulatePaymentModal } from './components/payments/SimulatePaymentModal';
import { CreateSubscriptionModal } from './components/subscriptions/CreateSubscriptionModal';
import { RevenueGuardOverview } from './components/revenueguard/RevenueGuardOverview';
import { IntegrityScannerView } from './components/revenueguard/IntegrityScannerView';
import { BillingRunsView } from './components/revenueguard/BillingRunsView';
import { RevenueLeakageRadarView } from './components/revenueguard/RevenueLeakageRadarView';
import { PaymentReconciliationView } from './components/revenueguard/PaymentReconciliationView';
import { BillingCalendarView } from './components/revenueguard/BillingCalendarView';
import { FinancialEvidenceLedgerView } from './components/revenueguard/FinancialEvidenceLedgerView';
import { ProductsAndQuotationsView } from './components/revenueguard/ProductsAndQuotationsView';
import {
  Users,
  CalendarDays,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Customer, Subscription } from './types';

const DashboardContent: React.FC = () => {
  const { metrics, setActiveTab, subscriptions, billingHealthScore } = useApp();

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial & Operational Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time MRR tracking, subscription lifecycle velocity, and automated churn prevention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('revenueguard-overview')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold hover:bg-indigo-100 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            RevenueGuard: Health {billingHealthScore.overallScore}/100 (Grade {billingHealthScore.grade})
          </button>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Billing Engine: Live & Synchronized
          </span>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="TOTAL CUSTOMERS"
          value={metrics.totalCustomers}
          change={metrics.newCustomersThisMonth > 0 ? 12.5 : 0}
          changePeriod="vs last month"
          icon={Users}
          accentColor="indigo"
          onClick={() => setActiveTab('customers')}
        />

        <KPICard
          title="ACTIVE SUBSCRIPTIONS"
          value={metrics.activeSubscriptions}
          change={metrics.activeSubscriptionsGrowth}
          changePeriod="vs last month"
          icon={CalendarDays}
          accentColor="emerald"
          onClick={() => setActiveTab('subscriptions')}
        />

        <KPICard
          title="MONTHLY RECURRING REV (MRR)"
          value={`₹${metrics.mrr.toLocaleString()}`}
          change={metrics.mrrGrowth}
          changePeriod="vs last month"
          icon={TrendingUp}
          accentColor="indigo"
          onClick={() => setActiveTab('analytics')}
        />

        <KPICard
          title="ANNUAL RUN-RATE (ARR)"
          value={`₹${metrics.arr.toLocaleString()}`}
          change={metrics.arrGrowth}
          changePeriod="annualized"
          icon={CreditCard}
          accentColor="emerald"
          onClick={() => setActiveTab('analytics')}
        />
      </div>

      {/* Secondary SaaS Health Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('payments')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pending / Past Due
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {metrics.pendingPaymentsCount + metrics.failedPaymentsCount} Invoices
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Automated Dunning Active</div>
        </div>

        <div
          onClick={() => setActiveTab('ai-insights')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Average Churn Rate
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">{metrics.churnRate}%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Low Benchmark Range</div>
        </div>

        <div
          onClick={() => setActiveTab('analytics')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Average Revenue / User (ARPU)
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">₹{metrics.arpu.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Per month per account</div>
        </div>

        <div
          onClick={() => setActiveTab('payments')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Gateway Collection Rate
          </div>
          <div className="text-lg font-bold text-emerald-600 mt-1">{metrics.paymentSuccessRate}%</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Razorpay Test Gateway</div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <RevenueCharts />

      {/* Real-time Activity Widgets */}
      <RecentActivityWidgets />
    </div>
  );
};

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  // Cross-modal triggers
  const [paymentSub, setPaymentSub] = useState<Subscription | null>(null);
  const [assignCust, setAssignCust] = useState<Customer | null>(null);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Hackathon Demonstration Bar */}
        <DemoWorkflowBar />

        {/* Dynamic Page Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'dashboard' && <DashboardContent />}

            {activeTab === 'customers' && (
              <CustomerList
                onAssignSubscription={(cust) => {
                  setAssignCust(cust);
                  setActiveTab('subscriptions');
                }}
              />
            )}

            {activeTab === 'products' && <ProductsAndQuotationsView />}

            {activeTab === 'plans' && <PlanCards />}

            {activeTab === 'quotations' && <ProductsAndQuotationsView />}

            {activeTab === 'subscriptions' && (
              <SubscriptionTable
                onSimulatePaymentForSub={(sub) => {
                  setPaymentSub(sub);
                }}
              />
            )}

            {activeTab === 'payments' && <PaymentTable />}

            {activeTab === 'invoices' && <InvoiceTable />}

            {activeTab === 'renewals' && <RenewalManager />}

            {/* RevenueGuard Suite */}
            {activeTab === 'revenueguard-overview' && <RevenueGuardOverview />}

            {activeTab === 'revenueguard-scanner' && <IntegrityScannerView />}

            {activeTab === 'revenueguard-runs' && <BillingRunsView />}

            {activeTab === 'revenueguard-leakage' && <RevenueLeakageRadarView />}

            {activeTab === 'revenueguard-reconciliation' && <PaymentReconciliationView />}

            {activeTab === 'revenueguard-calendar' && <BillingCalendarView />}

            {activeTab === 'revenueguard-ledger' && <FinancialEvidenceLedgerView />}

            {activeTab === 'ai-insights' && <AIChurnDashboard />}

            {activeTab === 'analytics' && <AnalyticsView />}

            {activeTab === 'customer-portal' && <CustomerPortalView />}

            {activeTab === 'architecture' && <ArchitectureViewer />}
          </div>
        </main>
      </div>

      {/* Global Modals triggered from lists */}
      {paymentSub && (
        <SimulatePaymentModal
          isOpen={!!paymentSub}
          onClose={() => setPaymentSub(null)}
          preselectedSubscription={paymentSub}
        />
      )}

      {assignCust && (
        <CreateSubscriptionModal
          isOpen={!!assignCust}
          onClose={() => setAssignCust(null)}
          preselectedCustomer={assignCust}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
