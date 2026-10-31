import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Customer,
  SubscriptionPlan,
  Subscription,
  Payment,
  Invoice,
  NotificationItem,
  DashboardMetrics,
  ChurnPrediction,
  RevenueForecastMonth,
  SubscriptionHistoryEvent,
} from '../types';
import { apiService, resetToSeedData } from '../services/api';
import { INITIAL_CUSTOMERS } from '../services/mockData';

export type ActiveTab =
  | 'dashboard'
  | 'customers'
  | 'plans'
  | 'subscriptions'
  | 'payments'
  | 'invoices'
  | 'renewals'
  | 'ai-insights'
  | 'analytics'
  | 'customer-portal'
  | 'architecture';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  currentUser: User;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  customers: Customer[];
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  payments: Payment[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  history: SubscriptionHistoryEvent[];
  metrics: DashboardMetrics;
  churnPredictions: ChurnPrediction[];
  forecast: RevenueForecastMonth[];
  unreadNotifCount: number;

  // Actions
  switchRole: (role: 'admin' | 'customer', customerId?: string) => void;
  refreshData: () => void;
  resetAllDemoData: () => void;

  // CRUD & Operations
  createCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => Customer;
  deleteCustomer: (id: string) => void;

  createPlan: (data: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => SubscriptionPlan;
  updatePlan: (id: string, updates: Partial<SubscriptionPlan>) => SubscriptionPlan;
  archivePlan: (id: string) => void;

  createSubscription: (params: {
    customerId: string;
    planId: string;
    billingInterval: 'monthly' | 'annual';
    startWithTrial?: boolean;
    autoRenew?: boolean;
  }) => Subscription;
  updateSubscriptionStatus: (id: string, status: Subscription['status'], reason?: string) => Subscription;
  upgradeSubscription: (params: { subscriptionId: string; newPlanId: string; newBillingInterval?: 'monthly' | 'annual' }) => Subscription;

  processPayment: (params: {
    subscriptionId: string;
    customerId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    forceFailure?: boolean;
    failureReason?: string;
  }) => { payment: Payment; invoice?: Invoice; error?: string };
  retryPayment: (paymentId: string) => { payment: Payment; invoice?: Invoice };
  refundPayment: (paymentId: string) => Payment;

  triggerRenewalBatch: () => { processedCount: number; successCount: number; failedCount: number; details: string[] };

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (type: Toast['type'], title: string, message?: string) => void;
  dismissToast: (id: string) => void;

  // Hackathon Workflow Automation Helper
  runHackathonDemoStep: (stepNumber: number) => Promise<void>;
  isDemoRunning: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(apiService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [history, setHistory] = useState<SubscriptionHistoryEvent[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(apiService.getDashboardMetrics());
  const [churnPredictions, setChurnPredictions] = useState<ChurnPrediction[]>([]);
  const [forecast, setForecast] = useState<RevenueForecastMonth[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const showToast = useCallback((type: Toast['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshData = useCallback(() => {
    setCustomers(apiService.getCustomers());
    setPlans(apiService.getPlans());
    setSubscriptions(apiService.getSubscriptions());
    setPayments(apiService.getPayments());
    setInvoices(apiService.getInvoices());
    setNotifications(apiService.getNotifications());
    setHistory(apiService.getHistory());
    setMetrics(apiService.getDashboardMetrics());
    setChurnPredictions(apiService.getChurnPredictions());
    setForecast(apiService.getRevenueForecast());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const switchRole = (role: 'admin' | 'customer', customerId?: string) => {
    const user = apiService.loginAs(role, customerId);
    setCurrentUser(user);
    if (role === 'customer') {
      setActiveTab('customer-portal');
      showToast('info', 'Customer Portal Activated', `Viewing as ${user.name} (${user.email})`);
    } else {
      setActiveTab('dashboard');
      showToast('info', 'Admin Console Activated', `Logged in as Super Administrator`);
    }
    refreshData();
  };

  const resetAllDemoData = () => {
    resetToSeedData();
    setCurrentUser(apiService.getCurrentUser());
    refreshData();
    showToast('success', 'Reset Complete', 'Database restored to initial hackathon demonstration baseline.');
  };

  const handleCreateCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const cust = apiService.createCustomer(data);
    refreshData();
    showToast('success', 'Customer Created', `${cust.name} added to SubFlow directory.`);
    return cust;
  };

  const handleUpdateCustomer = (id: string, updates: Partial<Customer>) => {
    const cust = apiService.updateCustomer(id, updates);
    refreshData();
    showToast('success', 'Customer Updated', 'Details saved successfully.');
    return cust;
  };

  const handleDeleteCustomer = (id: string) => {
    apiService.deleteCustomer(id);
    refreshData();
    showToast('warning', 'Customer Removed', 'Customer and associated subscriptions have been archived.');
  };

  const handleCreatePlan = (data: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => {
    const plan = apiService.createPlan(data);
    refreshData();
    showToast('success', 'Plan Created', `New plan tier "${plan.name}" is now available.`);
    return plan;
  };

  const handleUpdatePlan = (id: string, updates: Partial<SubscriptionPlan>) => {
    const plan = apiService.updatePlan(id, updates);
    refreshData();
    showToast('success', 'Plan Updated', `Plan "${plan.name}" updated.`);
    return plan;
  };

  const handleArchivePlan = (id: string) => {
    apiService.archivePlan(id);
    refreshData();
    showToast('info', 'Plan Archived', 'Plan archived and hidden from new customer signups.');
  };

  const handleCreateSubscription = (params: {
    customerId: string;
    planId: string;
    billingInterval: 'monthly' | 'annual';
    startWithTrial?: boolean;
    autoRenew?: boolean;
  }) => {
    const sub = apiService.createSubscription(params);
    refreshData();
    showToast('success', 'Subscription Created', `Status: ${sub.status.toUpperCase()} (${params.billingInterval})`);
    return sub;
  };

  const handleUpdateSubscriptionStatus = (id: string, status: Subscription['status'], reason?: string) => {
    try {
      const sub = apiService.updateSubscriptionStatus(id, status, reason);
      refreshData();
      showToast('success', 'Status Updated', `Subscription transitioned to ${status.toUpperCase()}`);
      return sub;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid state transition';
      showToast('error', 'Lifecycle Error', message);
      throw err;
    }
  };

  const handleUpgradeSubscription = (params: { subscriptionId: string; newPlanId: string; newBillingInterval?: 'monthly' | 'annual' }) => {
    const sub = apiService.upgradeOrDowngradeSubscription(params);
    refreshData();
    showToast('success', 'Plan Changed', 'Subscription plan updated successfully.');
    return sub;
  };

  const handleProcessPayment = (params: {
    subscriptionId: string;
    customerId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    forceFailure?: boolean;
    failureReason?: string;
  }) => {
    const res = apiService.processPayment(params);
    refreshData();
    if (res.payment.status === 'success') {
      showToast('success', 'Payment Successful', `Processed ₹${res.payment.amount.toLocaleString()} via Razorpay simulator.`);
    } else {
      showToast('error', 'Payment Failed', res.error || 'Card transaction rejected.');
    }
    return res;
  };

  const handleRetryPayment = (paymentId: string) => {
    const res = apiService.retryPayment(paymentId);
    refreshData();
    showToast('success', 'Retry Succeeded', `Payment recovered! Invoice ${res.invoice?.invoiceNumber} marked Paid.`);
    return res;
  };

  const handleRefundPayment = (paymentId: string) => {
    const res = apiService.refundPayment(paymentId);
    refreshData();
    showToast('info', 'Payment Refunded', `Refund of ₹${res.amount.toLocaleString()} issued.`);
    return res;
  };

  const handleTriggerRenewalBatch = () => {
    const res = apiService.triggerRenewalBatch();
    refreshData();
    showToast(
      'success',
      'Batch Renewal Execution Complete',
      `Processed ${res.processedCount} renewals: ${res.successCount} succeeded, ${res.failedCount} failed.`
    );
    return res;
  };

  const handleMarkNotifRead = (id: string) => {
    apiService.markNotificationAsRead(id);
    refreshData();
  };

  const handleMarkAllNotifRead = () => {
    apiService.markAllNotificationsRead();
    refreshData();
    showToast('info', 'Notifications Cleared', 'All alerts marked as read.');
  };

  // Hackathon Workflow Automated Step Execution (Steps 1 to 15)
  const runHackathonDemoStep = async (stepNumber: number) => {
    setIsDemoRunning(true);
    try {
      switch (stepNumber) {
        case 1:
          switchRole('admin');
          setActiveTab('dashboard');
          showToast('info', 'Step 1: Admin Logged In', 'Administrator authenticated with enterprise privileges.');
          break;
        case 2:
          setActiveTab('dashboard');
          showToast('info', 'Step 2: Analytics Dashboard', 'Reviewing real-time MRR, ARR, active subscriptions, and cash flow.');
          break;
        case 3: {
          setActiveTab('customers');
          const newCust = handleCreateCustomer({
            name: 'Kavita Krishnan',
            email: `kavita.${Date.now().toString().slice(-4)}@quantumscale.tech`,
            phone: '+91 98200 44556',
            company: 'QuantumScale AI Corp',
            address: 'Innovate Park, Phase 1',
            city: 'Bengaluru, Karnataka',
            country: 'India',
            taxId: '29AAACQ4921M1Z1',
            status: 'active',
          });
          showToast('success', 'Step 3: New Customer Created', `Added ${newCust.company} to customer ledger.`);
          break;
        }
        case 4:
          setActiveTab('plans');
          showToast('info', 'Step 4: Subscription Plans Inspected', 'Browsing Basic (₹299), Pro (₹799), and Enterprise (₹1,999) tiers.');
          break;
        case 5:
        case 6: {
          setActiveTab('subscriptions');
          const latestCust = customers[0] || INITIAL_CUSTOMERS[0];
          const newSub = handleCreateSubscription({
            customerId: latestCust.id,
            planId: 'plan-pro',
            billingInterval: 'monthly',
            startWithTrial: false,
          });
          showToast('success', 'Step 5 & 6: Subscription Assigned', `Assigned Professional Scale to ${latestCust.company} (ID: ${newSub.id}).`);
          break;
        }
        case 7:
        case 8:
        case 9:
        case 10: {
          setActiveTab('payments');
          const latestSub = subscriptions[0];
          if (latestSub) {
            const payRes = handleProcessPayment({
              subscriptionId: latestSub.id,
              customerId: latestSub.customerId,
              amount: 943,
              paymentMethod: { type: 'card', brand: 'Visa Demo', last4: '4242' },
              forceFailure: false,
            });
            showToast('success', 'Steps 7-10: Payment & Invoice Generated', `Simulated payment processed. Invoice ${payRes.invoice?.invoiceNumber} generated! MRR updated.`);
          }
          break;
        }
        case 11:
        case 12:
        case 13: {
          setActiveTab('renewals');
          showToast('info', 'Step 11 & 12: Automated Renewal Triggered', 'Running scheduled renewal dunning engine for upcoming expiries...');
          await new Promise((r) => setTimeout(r, 600));
          handleTriggerRenewalBatch();
          showToast('success', 'Step 13: Renewal Processed', 'Batch renewal payments simulated with automatic cycle advancement.');
          break;
        }
        case 14:
          setActiveTab('payments');
          showToast('info', 'Step 14: History Verified', 'Inspected comprehensive payment receipts and audit trail.');
          break;
        case 15:
          setActiveTab('ai-insights');
          showToast('warning', 'Step 15: AI Churn Engine Active', 'Identified high-risk customer with 84% churn probability & actionable retention proposal.');
          break;
        default:
          setActiveTab('dashboard');
      }
    } finally {
      setIsDemoRunning(false);
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        customers,
        plans,
        subscriptions,
        payments,
        invoices,
        notifications,
        history,
        metrics,
        churnPredictions,
        forecast,
        unreadNotifCount,

        switchRole,
        refreshData,
        resetAllDemoData,

        createCustomer: handleCreateCustomer,
        updateCustomer: handleUpdateCustomer,
        deleteCustomer: handleDeleteCustomer,

        createPlan: handleCreatePlan,
        updatePlan: handleUpdatePlan,
        archivePlan: handleArchivePlan,

        createSubscription: handleCreateSubscription,
        updateSubscriptionStatus: handleUpdateSubscriptionStatus,
        upgradeSubscription: handleUpgradeSubscription,

        processPayment: handleProcessPayment,
        retryPayment: handleRetryPayment,
        refundPayment: handleRefundPayment,

        triggerRenewalBatch: handleTriggerRenewalBatch,

        markNotificationRead: handleMarkNotifRead,
        markAllNotificationsRead: handleMarkAllNotifRead,

        toasts,
        showToast,
        dismissToast,

        runHackathonDemoStep,
        isDemoRunning,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
