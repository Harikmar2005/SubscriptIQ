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
  FinancialLedgerEntry,
  RevenueAnomaly,
  SmartRetentionCampaign,
  MLModelEvaluation,
  WhatIfSimulationParams,
  WhatIfSimulationResult,
  Product,
  ProductVariant,
  DiscountRule,
  Quotation,
  TaxConfiguration,
  BillingException,
  SubscriptionValidationDetail,
  BillingValidationResult,
  BillingRun,
  PaymentAllocation,
  RevenueLeakageItem,
  BillingHealthScoreBreakdown,
  FinancialEvidenceTrail,
  CalendarDayScheduledItem,
} from '../types';
import { apiService, resetToSeedData } from '../services/api';
import { INITIAL_CUSTOMERS, PRIMARY_TENANT_ID, SECONDARY_TENANT_ID } from '../services/mockData';

export type ActiveTab =
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'plans'
  | 'quotations'
  | 'subscriptions'
  | 'payments'
  | 'invoices'
  | 'renewals'
  | 'revenueguard-overview'
  | 'revenueguard-scanner'
  | 'revenueguard-runs'
  | 'revenueguard-leakage'
  | 'revenueguard-reconciliation'
  | 'revenueguard-calendar'
  | 'revenueguard-ledger'
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
  currentTenantId: string;
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
  financialLedger: FinancialLedgerEntry[];
  revenueAnomalies: RevenueAnomaly[];
  retentionCampaigns: SmartRetentionCampaign[];
  mlModelMetrics: MLModelEvaluation;
  unreadNotifCount: number;

  // RevenueGuard State
  products: Product[];
  discounts: DiscountRule[];
  quotations: Quotation[];
  billingExceptions: BillingException[];
  billingRuns: BillingRun[];
  paymentAllocations: PaymentAllocation[];
  leakageItems: RevenueLeakageItem[];
  billingHealthScore: BillingHealthScoreBreakdown;
  latestValidationResult: BillingValidationResult | null;
  taxConfig: TaxConfiguration;

  // Actions
  switchRole: (role: 'admin' | 'customer', customerId?: string) => void;
  switchTenant: (tenantId: string) => void;
  refreshData: () => void;
  resetAllDemoData: () => void;

  // Customer & Plan CRUD
  createCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => Customer;
  deleteCustomer: (id: string) => void;

  createPlan: (data: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => SubscriptionPlan;
  updatePlan: (id: string, updates: Partial<SubscriptionPlan>) => SubscriptionPlan;
  archivePlan: (id: string) => void;

  // Product, Variant, Discount & Quotation CRUD
  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'tenantId'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => Product;
  deleteProduct: (id: string) => void;
  addProductVariant: (productId: string, variant: Omit<ProductVariant, 'id' | 'productId'>) => ProductVariant;

  createDiscount: (data: Omit<DiscountRule, 'id' | 'createdAt' | 'tenantId' | 'currentUsageCount'>) => DiscountRule;
  updateDiscount: (id: string, updates: Partial<DiscountRule>) => DiscountRule;

  createQuotation: (data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'tenantId'>) => Quotation;
  confirmQuotation: (id: string) => { quotation: Quotation; subscription: Subscription };

  // Subscriptions Lifecycle
  createSubscription: (params: {
    customerId: string;
    planId: string;
    billingInterval: 'monthly' | 'annual';
    startWithTrial?: boolean;
    autoRenew?: boolean;
  }) => Subscription;
  updateSubscriptionStatus: (id: string, status: Subscription['status'], reason?: string) => Subscription;
  upgradeSubscription: (params: { subscriptionId: string; newPlanId: string; newBillingInterval?: 'monthly' | 'annual' }) => Subscription;

  // Payments & Invoicing
  processPayment: (params: {
    subscriptionId: string;
    customerId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    forceFailure?: boolean;
    failureReason?: string;
    idempotencyKey?: string;
  }) => { payment: Payment; invoice?: Invoice; error?: string; isIdempotentReplay?: boolean };
  retryPayment: (paymentId: string) => { payment: Payment; invoice?: Invoice };
  refundPayment: (paymentId: string) => Payment;

  triggerRenewalBatch: () => { processedCount: number; successCount: number; failedCount: number; details: string[] };

  // RevenueGuard Operations
  runBillingValidation: (billingDate?: string) => BillingValidationResult;
  reviewBillingException: (id: string) => BillingException;
  overrideBillingException: (id: string, reason: string, adminName: string) => BillingException;
  resolveBillingException: (id: string, correctedData?: any) => BillingException;

  createAndExecuteBillingRun: (billingDate: string, autoInvoiceReady?: boolean) => BillingRun;
  retryBillingRunSubscription: (runId: string, subscriptionId: string) => { success: boolean; invoice?: Invoice; error?: string };

  resolveLeakageItem: (id: string, actionDesc: string) => RevenueLeakageItem;

  reconcilePayment: (paymentId: string, invoiceId: string, amount?: number) => PaymentAllocation;
  autoReconcileAll: () => { matchedCount: number; matchedAmount: number };

  getFinancialEvidence: (invoiceId: string) => FinancialEvidenceTrail | undefined;
  getPredictiveCalendar: (year?: number, month?: number) => CalendarDayScheduledItem[];

  // Intelligence & Simulations
  resolveAnomaly: (anomalyId: string) => void;
  applyRetentionOffer: (campaignId: string) => void;
  runWhatIfSimulation: (params: WhatIfSimulationParams) => WhatIfSimulationResult;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (type: Toast['type'], title: string, message?: string) => void;
  dismissToast: (id: string) => void;

  // Workflow Automation Helpers
  runHackathonDemoStep: (stepNumber: number) => Promise<void>;
  runRevenueGuardAcceptanceStep: (stepNumber: number) => Promise<void>;
  isDemoRunning: boolean;
  isRevenueGuardDemoRunning: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(apiService.getCurrentUser());
  const [currentTenantId, setCurrentTenantId] = useState<string>(apiService.getCurrentTenantId());
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
  const [financialLedger, setFinancialLedger] = useState<FinancialLedgerEntry[]>([]);
  const [revenueAnomalies, setRevenueAnomalies] = useState<RevenueAnomaly[]>([]);
  const [retentionCampaigns, setRetentionCampaigns] = useState<SmartRetentionCampaign[]>([]);
  const [mlModelMetrics, setMlModelMetrics] = useState<MLModelEvaluation>(apiService.getMLModelMetrics());

  // RevenueGuard state hooks
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [billingExceptions, setBillingExceptions] = useState<BillingException[]>([]);
  const [billingRuns, setBillingRuns] = useState<BillingRun[]>([]);
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>([]);
  const [leakageItems, setLeakageItems] = useState<RevenueLeakageItem[]>([]);
  const [billingHealthScore, setBillingHealthScore] = useState<BillingHealthScoreBreakdown>(apiService.getBillingHealthScore());
  const [latestValidationResult, setLatestValidationResult] = useState<BillingValidationResult | null>(null);
  const [taxConfig, setTaxConfig] = useState<TaxConfiguration>(apiService.getTaxConfig());

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isRevenueGuardDemoRunning, setIsRevenueGuardDemoRunning] = useState(false);

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
    setFinancialLedger(apiService.getFinancialLedger());
    setRevenueAnomalies(apiService.getRevenueAnomalies());
    setRetentionCampaigns(apiService.getRetentionCampaigns());
    setMlModelMetrics(apiService.getMLModelMetrics());
    setCurrentTenantId(apiService.getCurrentTenantId());

    // RevenueGuard data refresh
    setProducts(apiService.getProducts());
    setDiscounts(apiService.getDiscounts());
    setQuotations(apiService.getQuotations());
    setBillingExceptions(apiService.getBillingExceptions());
    setBillingRuns(apiService.getBillingRuns());
    setPaymentAllocations(apiService.getPaymentAllocations());
    setLeakageItems(apiService.getRevenueLeakageRadar());
    setBillingHealthScore(apiService.getBillingHealthScore());
    setTaxConfig(apiService.getTaxConfig());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const switchTenant = (tenantId: string) => {
    const user = apiService.loginAs(currentUser.role, currentUser.customerId, tenantId);
    setCurrentUser(user);
    setCurrentTenantId(tenantId);
    refreshData();
    showToast(
      'info',
      'Tenant Switched',
      tenantId === SECONDARY_TENANT_ID
        ? 'Switched to Tenant: Zenith Global Aerospace (Isolated Tenant Sandbox)'
        : 'Switched to Tenant: SubscriptIQ India (Production Tenant)'
    );
  };

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
    showToast('success', 'Reset Complete', 'Database restored to initial demonstration baseline.');
  };

  // Customers
  const handleCreateCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const cust = apiService.createCustomer(data);
    refreshData();
    showToast('success', 'Customer Created', `${cust.name} added to SubscriptIQ directory.`);
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

  // Plans
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

  // Products & Variants
  const handleCreateProduct = (data: Omit<Product, 'id' | 'createdAt' | 'tenantId'>) => {
    const prod = apiService.createProduct(data);
    refreshData();
    showToast('success', 'Product Created', `Added ${prod.name} (Code: ${prod.code}) to catalog.`);
    return prod;
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    const prod = apiService.updateProduct(id, updates);
    refreshData();
    showToast('success', 'Product Updated', `Updated ${prod.name}`);
    return prod;
  };

  const handleDeleteProduct = (id: string) => {
    apiService.deleteProduct(id);
    refreshData();
    showToast('info', 'Product Removed', 'Removed product from catalog.');
  };

  const handleAddProductVariant = (productId: string, variant: Omit<ProductVariant, 'id' | 'productId'>) => {
    const v = apiService.addProductVariant(productId, variant);
    refreshData();
    showToast('success', 'Variant Added', `Configured variant "${v.name}" (+₹${v.priceAdjustment}).`);
    return v;
  };

  // Discounts
  const handleCreateDiscount = (data: Omit<DiscountRule, 'id' | 'createdAt' | 'tenantId' | 'currentUsageCount'>) => {
    const disc = apiService.createDiscount(data);
    refreshData();
    showToast('success', 'Discount Rule Created', `Active code "${disc.code}" (${disc.value}${disc.discountType === 'percentage' ? '%' : '₹'} off).`);
    return disc;
  };

  const handleUpdateDiscount = (id: string, updates: Partial<DiscountRule>) => {
    const disc = apiService.updateDiscount(id, updates);
    refreshData();
    showToast('success', 'Discount Updated', `Rule ${disc.code} updated.`);
    return disc;
  };

  // Quotations
  const handleCreateQuotation = (data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'tenantId'>) => {
    const q = apiService.createQuotation(data);
    refreshData();
    showToast('success', 'Quotation Issued', `Quotation ${q.quotationNumber} generated for ${q.company}.`);
    return q;
  };

  const handleConfirmQuotation = (id: string) => {
    const res = apiService.confirmQuotation(id);
    refreshData();
    showToast('success', 'Quotation Accepted', `${res.quotation.quotationNumber} confirmed and converted to Active Subscription ${res.subscription.id}.`);
    return res;
  };

  // Subscriptions
  const handleCreateSubscription = (params: {
    customerId: string;
    planId: string;
    billingInterval: 'monthly' | 'annual';
    startWithTrial?: boolean;
    autoRenew?: boolean;
  }) => {
    const sub = apiService.createSubscription(params);
    refreshData();
    showToast('success', 'Subscription Activated', `Created subscription ${sub.id} for ${sub.billingInterval} cycle.`);
    return sub;
  };

  const handleUpdateSubscriptionStatus = (id: string, status: Subscription['status'], reason?: string) => {
    const sub = apiService.updateSubscriptionStatus(id, status, reason);
    refreshData();
    showToast('info', 'Subscription Status Changed', `Subscription ${sub.id} is now ${status.toUpperCase()}.`);
    return sub;
  };

  const handleUpgradeSubscription = (params: {
    subscriptionId: string;
    newPlanId: string;
    newBillingInterval?: 'monthly' | 'annual';
  }) => {
    const sub = apiService.upgradeOrDowngradeSubscription(params);
    refreshData();
    showToast('success', 'Subscription Modified', `Tier updated for subscription ${sub.id}.`);
    return sub;
  };

  // Payments
  const handleProcessPayment = (params: {
    subscriptionId: string;
    customerId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    forceFailure?: boolean;
    failureReason?: string;
    idempotencyKey?: string;
  }) => {
    const result = apiService.processPayment(params);
    refreshData();
    if (result.payment.status === 'success') {
      showToast('success', 'Payment Settled', `Charge of ₹${params.amount.toLocaleString()} processed via ${params.paymentMethod.type}. Invoice generated.`);
    } else {
      showToast('error', 'Payment Failed', result.error || 'Payment declined by gateway.');
    }
    return result;
  };

  const handleRetryPayment = (paymentId: string) => {
    const result = apiService.retryPayment(paymentId);
    refreshData();
    showToast('success', 'Payment Retried', 'Payment settled successfully on retry.');
    return result;
  };

  const handleRefundPayment = (paymentId: string) => {
    const result = apiService.refundPayment(paymentId);
    refreshData();
    showToast('warning', 'Refund Executed', `Payment ₹${result.amount.toLocaleString()} refunded. Balanced ledger.`);
    return result;
  };

  const handleTriggerRenewalBatch = () => {
    const result = apiService.triggerRenewalBatch();
    refreshData();
    showToast('info', 'Renewal Batch Complete', `Processed ${result.processedCount} renewals: ${result.successCount} succeeded, ${result.failedCount} failed.`);
    return result;
  };

  // RevenueGuard Integrity Engine
  const handleRunBillingValidation = (billingDate?: string) => {
    const res = apiService.runBillingValidation(billingDate);
    setLatestValidationResult(res);
    refreshData();
    showToast(
      res.blockedCount > 0 ? 'warning' : 'success',
      'Billing Validation Complete',
      `Checked ${res.totalChecked} subscriptions: ${res.readyCount} Ready, ${res.warningCount} Warnings, ${res.blockedCount} Blocked.`
    );
    return res;
  };

  const handleReviewBillingException = (id: string) => {
    const res = apiService.reviewBillingException(id);
    refreshData();
    showToast('info', 'Exception Reviewed', `Exception ${id} marked as reviewed.`);
    return res;
  };

  const handleOverrideBillingException = (id: string, reason: string, adminName: string) => {
    const res = apiService.overrideBillingException(id, reason, adminName);
    refreshData();
    showToast('warning', 'Critical Exception Overridden', `Explicit administrative override logged for ${id}.`);
    return res;
  };

  const handleResolveBillingException = (id: string, correctedData?: any) => {
    const res = apiService.resolveBillingException(id, correctedData);
    refreshData();
    showToast('success', 'Exception Resolved', `Corrected underlying data for ${id}. Integrity restored.`);
    return res;
  };

  const handleCreateAndExecuteBillingRun = (billingDate: string, autoInvoiceReady = true) => {
    const run = apiService.createAndExecuteBillingRun(billingDate, autoInvoiceReady);
    refreshData();
    showToast('success', 'Billing Run Executed', `Generated ${run.invoicesGeneratedCount} invoices (₹${run.totalBilledAmount.toLocaleString()}).`);
    return run;
  };

  const handleRetryBillingRunSubscription = (runId: string, subscriptionId: string) => {
    const res = apiService.retryBillingRunSubscription(runId, subscriptionId);
    refreshData();
    if (res.success && res.invoice) {
      showToast('success', 'Subscription Re-Invoiced', `Invoice ${res.invoice.invoiceNumber} created on retry.`);
    } else {
      showToast('error', 'Retry Blocked', res.error || 'Validation failed.');
    }
    return res;
  };

  const handleResolveLeakageItem = (id: string, actionDesc: string) => {
    const res = apiService.resolveLeakageItem(id, actionDesc);
    refreshData();
    showToast('success', 'Revenue Recovered', `Protected ₹${res.financialExposure.toLocaleString()}! ${actionDesc}`);
    return res;
  };

  const handleReconcilePayment = (paymentId: string, invoiceId: string, amount?: number) => {
    const alloc = apiService.reconcilePayment(paymentId, invoiceId, amount);
    refreshData();
    showToast('success', 'Payment Reconciled', `Allocated ₹${alloc.amount.toLocaleString()} to invoice.`);
    return alloc;
  };

  const handleAutoReconcileAll = () => {
    const res = apiService.autoReconcileAll();
    refreshData();
    showToast('success', 'Auto-Reconciliation Complete', `Matched ${res.matchedCount} receipts totalling ₹${res.matchedAmount.toLocaleString()}.`);
    return res;
  };

  const handleGetFinancialEvidence = (invoiceId: string) => {
    return apiService.getFinancialEvidence(invoiceId);
  };

  const handleGetPredictiveCalendar = (year?: number, month?: number) => {
    return apiService.getPredictiveCalendar(year, month);
  };

  // AI & Anomaly
  const handleResolveAnomaly = (anomalyId: string) => {
    apiService.resolveAnomaly(anomalyId);
    refreshData();
    showToast('success', 'Anomaly Resolved', 'Corrective action executed and logged to audit trail.');
  };

  const handleApplyRetentionOffer = (campaignId: string) => {
    apiService.applyRetentionOffer(campaignId);
    refreshData();
    showToast('success', 'Retention Offer Sent', 'Discount offer applied to next billing cycle.');
  };

  const handleRunWhatIfSimulation = (params: WhatIfSimulationParams) => {
    return apiService.runWhatIfSimulation(params);
  };

  const handleMarkNotificationRead = (id: string) => {
    apiService.markNotificationAsRead(id);
    refreshData();
  };

  const handleMarkAllNotificationsRead = () => {
    apiService.markAllNotificationsRead();
    refreshData();
    showToast('info', 'Notifications Cleared', 'All marked as read.');
  };

  // Original 15-step Hackathon Workflow
  const runHackathonDemoStep = async (stepNumber: number) => {
    setIsDemoRunning(true);
    try {
      switch (stepNumber) {
        case 1:
          switchRole('admin');
          showToast('info', 'Step 1: Admin Authenticated', 'Access granted with full enterprise billing permissions.');
          break;
        case 2:
          setActiveTab('dashboard');
          showToast('info', 'Step 2: Dashboard Overview', 'Real-time financial command center loaded.');
          break;
        case 3: {
          setActiveTab('customers');
          const newCust = handleCreateCustomer({
            name: 'Priya Sharma',
            email: 'priya.sharma@cloudsync.io',
            company: 'CloudSync Systems',
            phone: '+91 98765 43210',
            address: 'Cyber Gateway, HITEC City',
            city: 'Hyderabad',
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

  // RevenueGuard 16-Step Acceptance Workflow (Section 17)
  const runRevenueGuardAcceptanceStep = async (stepNumber: number) => {
    setIsRevenueGuardDemoRunning(true);
    try {
      const res = await apiService.runRevenueGuardAcceptanceStep(stepNumber);
      refreshData();
      if (res.targetTab) {
        setActiveTab(res.targetTab as ActiveTab);
      }
      showToast(
        stepNumber === 10 ? 'warning' : 'success',
        `Step ${res.step}: ${res.title}`,
        res.message
      );
    } finally {
      setIsRevenueGuardDemoRunning(false);
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentTenantId,
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
        financialLedger,
        revenueAnomalies,
        retentionCampaigns,
        mlModelMetrics,
        unreadNotifCount,

        // RevenueGuard state
        products,
        discounts,
        quotations,
        billingExceptions,
        billingRuns,
        paymentAllocations,
        leakageItems,
        billingHealthScore,
        latestValidationResult,
        taxConfig,

        // Actions
        switchRole,
        switchTenant,
        refreshData,
        resetAllDemoData,

        createCustomer: handleCreateCustomer,
        updateCustomer: handleUpdateCustomer,
        deleteCustomer: handleDeleteCustomer,

        createPlan: handleCreatePlan,
        updatePlan: handleUpdatePlan,
        archivePlan: handleArchivePlan,

        createProduct: handleCreateProduct,
        updateProduct: handleUpdateProduct,
        deleteProduct: handleDeleteProduct,
        addProductVariant: handleAddProductVariant,

        createDiscount: handleCreateDiscount,
        updateDiscount: handleUpdateDiscount,

        createQuotation: handleCreateQuotation,
        confirmQuotation: handleConfirmQuotation,

        createSubscription: handleCreateSubscription,
        updateSubscriptionStatus: handleUpdateSubscriptionStatus,
        upgradeSubscription: handleUpgradeSubscription,

        processPayment: handleProcessPayment,
        retryPayment: handleRetryPayment,
        refundPayment: handleRefundPayment,
        triggerRenewalBatch: handleTriggerRenewalBatch,

        runBillingValidation: handleRunBillingValidation,
        reviewBillingException: handleReviewBillingException,
        overrideBillingException: handleOverrideBillingException,
        resolveBillingException: handleResolveBillingException,

        createAndExecuteBillingRun: handleCreateAndExecuteBillingRun,
        retryBillingRunSubscription: handleRetryBillingRunSubscription,

        resolveLeakageItem: handleResolveLeakageItem,

        reconcilePayment: handleReconcilePayment,
        autoReconcileAll: handleAutoReconcileAll,

        getFinancialEvidence: handleGetFinancialEvidence,
        getPredictiveCalendar: handleGetPredictiveCalendar,

        resolveAnomaly: handleResolveAnomaly,
        applyRetentionOffer: handleApplyRetentionOffer,
        runWhatIfSimulation: handleRunWhatIfSimulation,

        markNotificationRead: handleMarkNotificationRead,
        markAllNotificationsRead: handleMarkAllNotificationsRead,

        toasts,
        showToast,
        dismissToast,

        runHackathonDemoStep,
        runRevenueGuardAcceptanceStep,
        isDemoRunning,
        isRevenueGuardDemoRunning,
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
