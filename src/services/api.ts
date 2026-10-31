import {
  Customer,
  SubscriptionPlan,
  Subscription,
  Payment,
  Invoice,
  NotificationItem,
  SubscriptionHistoryEvent,
  CustomerUsage,
  ChurnPrediction,
  User,
  DashboardMetrics,
  RevenueForecastMonth,
  MLModelEvaluation,
  FinancialLedgerEntry,
  RevenueAnomaly,
  SmartRetentionCampaign,
  WhatIfSimulationParams,
  WhatIfSimulationResult,
} from '../types';
import {
  DEMO_USERS,
  INITIAL_PLANS,
  INITIAL_CUSTOMERS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_PAYMENTS,
  INITIAL_INVOICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_HISTORY,
  INITIAL_USAGE,
  INITIAL_FINANCIAL_LEDGER,
  INITIAL_REVENUE_ANOMALIES,
  INITIAL_SMART_RETENTION_CAMPAIGNS,
  TRAINED_ML_METRICS,
  PRIMARY_TENANT_ID,
  SECONDARY_TENANT_ID,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'subscriptiq_users',
  CUSTOMERS: 'subscriptiq_customers',
  PLANS: 'subscriptiq_plans',
  SUBSCRIPTIONS: 'subscriptiq_subscriptions',
  PAYMENTS: 'subscriptiq_payments',
  INVOICES: 'subscriptiq_invoices',
  NOTIFICATIONS: 'subscriptiq_notifications',
  HISTORY: 'subscriptiq_history',
  USAGE: 'subscriptiq_usage',
  LEDGER: 'subscriptiq_ledger',
  ANOMALIES: 'subscriptiq_anomalies',
  CAMPAIGNS: 'subscriptiq_retention_campaigns',
  CURRENT_USER: 'subscriptiq_current_user',
};

// Initialize localStorage if empty
export function initLocalStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USAGE)) {
    localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(INITIAL_USAGE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEDGER)) {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(INITIAL_FINANCIAL_LEDGER));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANOMALIES)) {
    localStorage.setItem(STORAGE_KEYS.ANOMALIES, JSON.stringify(INITIAL_REVENUE_ANOMALIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CAMPAIGNS)) {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(INITIAL_SMART_RETENTION_CAMPAIGNS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
  }
}

export function resetToSeedData(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
  localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
  localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(INITIAL_USAGE));
  localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(INITIAL_FINANCIAL_LEDGER));
  localStorage.setItem(STORAGE_KEYS.ANOMALIES, JSON.stringify(INITIAL_REVENUE_ANOMALIES));
  localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(INITIAL_SMART_RETENTION_CAMPAIGNS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// ----------------- Core Data Access with Tenant Isolation -----------------

export const apiService = {
  // Current user & Tenant Context
  getCurrentUser(): User {
    initLocalStorage();
    return getItem<User>(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);
  },

  setCurrentUser(user: User): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  getCurrentTenantId(): string {
    return this.getCurrentUser().tenantId || PRIMARY_TENANT_ID;
  },

  loginAs(role: 'admin' | 'customer', customerId?: string, tenantId?: string): User {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
    let target: User | undefined;

    if (tenantId && tenantId === SECONDARY_TENANT_ID) {
      target = users.find((u) => u.tenantId === SECONDARY_TENANT_ID);
    } else if (role === 'customer' && customerId) {
      target = users.find((u) => u.customerId === customerId);
    } else {
      target = users.find((u) => u.role === role && u.tenantId === PRIMARY_TENANT_ID);
    }

    if (!target) {
      target = DEMO_USERS[0];
    }
    setItem(STORAGE_KEYS.CURRENT_USER, target);
    return target;
  },

  // Customers (Strictly Tenant-Isolated)
  getCustomers(): Customer[] {
    initLocalStorage();
    const currentTenant = this.getCurrentTenantId();
    const allCustomers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const customers = allCustomers.filter((c) => c.tenantId === currentTenant);

    const subscriptions = this.getSubscriptions();
    const plans = this.getPlans();

    return customers.map((c) => {
      const sub = subscriptions.find((s) => s.customerId === c.id && ['active', 'trial', 'past_due', 'paused'].includes(s.status));
      const plan = sub ? plans.find((p) => p.id === sub.planId) : undefined;
      return {
        ...c,
        activeSubscriptionId: sub?.id,
        currentPlanName: plan ? plan.name : 'No active plan',
        mrr: sub && sub.status === 'active' && plan ? (sub.billingInterval === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice) : 0,
      };
    });
  },

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  },

  createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Customer {
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const tenantId = this.getCurrentTenantId();

    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now().toString().slice(-6)}`,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      healthScore: 88,
      churnRisk: 'low',
      totalSpent: 0,
      mrr: 0,
    };
    customers.unshift(newCustomer);
    setItem(STORAGE_KEYS.CUSTOMERS, customers);

    // Initial usage record
    const usage = getItem<CustomerUsage[]>(STORAGE_KEYS.USAGE, INITIAL_USAGE);
    usage.push({
      customerId: newCustomer.id,
      tenantId,
      activeUsers: 1,
      apiCallsMonth: 120,
      storageUsedGb: 0.1,
      loginCountLast30Days: 1,
      lastActiveDate: new Date().toISOString(),
      featuresAdoptedCount: 1,
      apiOveragesUnits: 0,
      apiOverageAmount: 0,
    });
    setItem(STORAGE_KEYS.USAGE, usage);

    this.addNotification({
      title: 'New Customer Registered',
      message: `${newCustomer.name} (${newCustomer.company}) registered.`,
      type: 'system',
      link: `/customers`,
    });

    return newCustomer;
  },

  updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const tenantId = this.getCurrentTenantId();
    const index = customers.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (index === -1) throw new Error('Customer not found in current tenant');

    const updated = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    customers[index] = updated;
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
    return updated;
  },

  deleteCustomer(id: string): void {
    const tenantId = this.getCurrentTenantId();
    let customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    customers = customers.filter((c) => !(c.id === id && c.tenantId === tenantId));
    setItem(STORAGE_KEYS.CUSTOMERS, customers);

    let subscriptions = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    subscriptions = subscriptions.map((s) => (s.customerId === id && s.tenantId === tenantId ? { ...s, status: 'cancelled' as const, cancelledAt: new Date().toISOString() } : s));
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  },

  // Subscription Plans (Tenant-Isolated)
  getPlans(): SubscriptionPlan[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    const plans = getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    return plans.filter((p) => p.tenantId === tenantId);
  },

  getPlanById(id: string): SubscriptionPlan | undefined {
    return this.getPlans().find((p) => p.id === id);
  },

  createPlan(data: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'tenantId'>): SubscriptionPlan {
    const plans = getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    const tenantId = this.getCurrentTenantId();

    const newPlan: SubscriptionPlan = {
      ...data,
      id: `plan-${Date.now().toString().slice(-4)}`,
      tenantId,
      createdAt: new Date().toISOString(),
      isArchived: false,
    };
    plans.push(newPlan);
    setItem(STORAGE_KEYS.PLANS, plans);
    return newPlan;
  },

  updatePlan(id: string, updates: Partial<SubscriptionPlan>): SubscriptionPlan {
    const plans = getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    const tenantId = this.getCurrentTenantId();
    const index = plans.findIndex((p) => p.id === id && p.tenantId === tenantId);
    if (index === -1) throw new Error('Plan not found in current tenant');

    const updated = { ...plans[index], ...updates };
    plans[index] = updated;
    setItem(STORAGE_KEYS.PLANS, plans);
    return updated;
  },

  archivePlan(id: string): void {
    this.updatePlan(id, { isArchived: true });
  },

  // Subscriptions Lifecycle State Machine
  getSubscriptions(): Subscription[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS).filter((s) => s.tenantId === tenantId);
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS).filter((c) => c.tenantId === tenantId);
    const plans = getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS).filter((p) => p.tenantId === tenantId);

    return subs.map((s) => ({
      ...s,
      customer: customers.find((c) => c.id === s.customerId),
      plan: plans.find((p) => p.id === s.planId),
    }));
  },

  getSubscriptionById(id: string): Subscription | undefined {
    return this.getSubscriptions().find((s) => s.id === id);
  },

  createSubscription(params: {
    customerId: string;
    planId: string;
    billingInterval: 'monthly' | 'annual';
    startWithTrial?: boolean;
    autoRenew?: boolean;
  }): Subscription {
    const tenantId = this.getCurrentTenantId();
    const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const plan = this.getPlanById(params.planId);
    const customer = this.getCustomerById(params.customerId);
    if (!plan) throw new Error('Plan not found');
    if (!customer) throw new Error('Customer not found');

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now);

    const isTrial = !!params.startWithTrial && plan.trialDays > 0;
    if (isTrial) {
      periodEnd.setDate(periodEnd.getDate() + plan.trialDays);
    } else {
      if (params.billingInterval === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
    }

    const newSub: Subscription = {
      id: `sub-${Date.now().toString().slice(-6)}`,
      tenantId,
      customerId: params.customerId,
      planId: params.planId,
      status: isTrial ? 'trial' : 'active',
      billingInterval: params.billingInterval,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd.toISOString(),
      trialEnd: isTrial ? periodEnd.toISOString() : undefined,
      cancelAtPeriodEnd: false,
      autoRenew: params.autoRenew !== undefined ? params.autoRenew : true,
      failedRetryCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    subs.unshift(newSub);
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    this.addHistoryEvent({
      subscriptionId: newSub.id,
      customerId: newSub.customerId,
      eventType: 'created',
      details: `Created new ${isTrial ? 'Trial' : 'Active'} subscription for ${plan.name} (${params.billingInterval}).`,
      newPlanId: plan.id,
    });

    this.updateCustomer(params.customerId, {
      activeSubscriptionId: newSub.id,
      currentPlanName: plan.name,
    });

    return newSub;
  },

  updateSubscriptionStatus(
    id: string,
    newStatus: Subscription['status'],
    reason?: string
  ): Subscription {
    const tenantId = this.getCurrentTenantId();
    const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const index = subs.findIndex((s) => s.id === id && s.tenantId === tenantId);
    if (index === -1) throw new Error('Subscription not found');

    const current = subs[index];
    const prevStatus = current.status;

    // Strict FSM state transition validation
    const validTransitions: Record<Subscription['status'], Subscription['status'][]> = {
      trial: ['active', 'expired', 'cancelled'],
      active: ['past_due', 'paused', 'cancelled', 'expired', 'active'],
      past_due: ['active', 'cancelled', 'expired'],
      paused: ['active', 'cancelled', 'expired'],
      cancelled: [], // Terminal state
      expired: ['active'],
    };

    if (current.status !== newStatus && !validTransitions[current.status].includes(newStatus)) {
      throw new Error(`Invalid subscription transition from "${current.status}" to "${newStatus}".`);
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 14-day grace period on past due
    let graceEnd = current.gracePeriodEnd;
    if (newStatus === 'past_due' && prevStatus !== 'past_due') {
      const g = new Date(now);
      g.setDate(g.getDate() + 14);
      graceEnd = g.toISOString();
    } else if (newStatus === 'active') {
      graceEnd = undefined;
    }

    const updated: Subscription = {
      ...current,
      status: newStatus,
      updatedAt: nowIso,
      gracePeriodEnd: graceEnd,
      cancellationReason: newStatus === 'cancelled' ? reason || 'Requested by customer/admin' : current.cancellationReason,
      cancelledAt: newStatus === 'cancelled' ? nowIso : current.cancelledAt,
      pausedAt: newStatus === 'paused' ? nowIso : undefined,
    };

    subs[index] = updated;
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    const eventMap: Record<Subscription['status'], SubscriptionHistoryEvent['eventType']> = {
      active: prevStatus === 'paused' ? 'resumed' : 'activated',
      paused: 'paused',
      cancelled: 'cancelled',
      past_due: 'payment_failed',
      trial: 'created',
      expired: 'cancelled',
    };

    this.addHistoryEvent({
      subscriptionId: id,
      customerId: current.customerId,
      eventType: eventMap[newStatus] || 'activated',
      details: `Status transitioned from ${prevStatus.toUpperCase()} to ${newStatus.toUpperCase()}${reason ? `: ${reason}` : ''}`,
    });

    return updated;
  },

  upgradeOrDowngradeSubscription(params: {
    subscriptionId: string;
    newPlanId: string;
    newBillingInterval?: 'monthly' | 'annual';
  }): Subscription {
    const tenantId = this.getCurrentTenantId();
    const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const index = subs.findIndex((s) => s.id === params.subscriptionId && s.tenantId === tenantId);
    if (index === -1) throw new Error('Subscription not found');

    const sub = subs[index];
    const currentPlan = this.getPlanById(sub.planId);
    const newPlan = this.getPlanById(params.newPlanId);
    if (!newPlan) throw new Error('New plan not found');

    const oldPrice = currentPlan?.monthlyPrice || 0;
    const isUpgrade = newPlan.monthlyPrice >= oldPrice;

    const now = new Date();
    const periodEnd = new Date(now);
    const interval = params.newBillingInterval || sub.billingInterval;
    if (interval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const updated: Subscription = {
      ...sub,
      planId: newPlan.id,
      billingInterval: interval,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      updatedAt: now.toISOString(),
    };

    subs[index] = updated;
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    this.addHistoryEvent({
      subscriptionId: sub.id,
      customerId: sub.customerId,
      eventType: isUpgrade ? 'upgraded' : 'downgraded',
      previousPlanId: currentPlan?.id,
      newPlanId: newPlan.id,
      details: `${isUpgrade ? 'Upgraded' : 'Downgraded'} from ${currentPlan?.name} to ${newPlan.name} (${interval}).`,
    });

    return updated;
  },

  // Payments & Idempotent Processing
  getPayments(): Payment[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    return getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS).filter((p) => p.tenantId === tenantId);
  },

  processPayment(params: {
    subscriptionId: string;
    customerId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    idempotencyKey?: string;
    forceFailure?: boolean;
    failureReason?: string;
  }): { payment: Payment; invoice?: Invoice; isIdempotentReplay?: boolean; error?: string } {
    const tenantId = this.getCurrentTenantId();
    const payments = getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);

    // Idempotency check: prevent duplicate charges
    if (params.idempotencyKey) {
      const existing = payments.find((p) => p.tenantId === tenantId && p.idempotencyKey === params.idempotencyKey);
      if (existing) {
        const existingInvoice = existing.invoiceId ? this.getInvoiceById(existing.invoiceId) : undefined;
        return {
          payment: existing,
          invoice: existingInvoice,
          isIdempotentReplay: true,
        };
      }
    }

    const customer = this.getCustomerById(params.customerId);
    const sub = this.getSubscriptionById(params.subscriptionId);
    const plan = sub ? this.getPlanById(sub.planId) : undefined;

    const isSuccess = !params.forceFailure;
    const now = new Date().toISOString();
    const transactionId = `pay_rzp_sim_${Date.now().toString()}`;

    const newPayment: Payment = {
      id: `pay-${Date.now().toString().slice(-6)}`,
      tenantId,
      subscriptionId: params.subscriptionId,
      customerId: params.customerId,
      amount: Math.round(params.amount),
      currency: 'INR',
      status: isSuccess ? 'success' : 'failed',
      paymentMethod: params.paymentMethod,
      gateway: 'razorpay_simulated',
      transactionId,
      idempotencyKey: params.idempotencyKey,
      failureReason: isSuccess ? undefined : (params.failureReason || 'Card issuer declined: Insufficient funds.'),
      reconciled: isSuccess,
      createdAt: now,
      customerName: customer ? `${customer.name} (${customer.company})` : undefined,
      planName: plan?.name,
    };

    if (isSuccess) {
      // 1. Generate Tax Invoice with exact decimal 18% GST
      const invoice = this.generateInvoice({
        subscriptionId: params.subscriptionId,
        customerId: params.customerId,
        paymentId: newPayment.id,
        planId: sub?.planId || 'plan-basic',
        billingInterval: sub?.billingInterval || 'monthly',
        grossAmount: newPayment.amount,
      });
      newPayment.invoiceId = invoice.id;

      payments.unshift(newPayment);
      setItem(STORAGE_KEYS.PAYMENTS, payments);

      // 2. Double-Entry Balanced Ledger Entries
      this.recordLedgerTransaction({
        transactionId,
        debitAccount: 'Cash/Razorpay Gateway',
        creditAccount: 'Subscription Revenue',
        grossAmount: newPayment.amount,
        netRevenue: invoice.subtotal,
        gstTax: invoice.taxAmount,
        referenceId: invoice.id,
        description: `Settlement for ${customer?.company || 'Customer'} (INV ${invoice.invoiceNumber})`,
      });

      // 3. Advance Subscription Cycle & Reset Grace Period
      if (sub) {
        const nextPeriodStart = new Date().toISOString();
        const nextPeriodEnd = new Date();
        if (sub.billingInterval === 'annual') {
          nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
        } else {
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        }

        const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
        const sIndex = subs.findIndex((s) => s.id === sub.id && s.tenantId === tenantId);
        if (sIndex !== -1) {
          subs[sIndex] = {
            ...subs[sIndex],
            status: 'active',
            currentPeriodStart: nextPeriodStart,
            currentPeriodEnd: nextPeriodEnd.toISOString(),
            failedRetryCount: 0,
            gracePeriodEnd: undefined,
            updatedAt: now,
          };
          setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);
        }

        this.addHistoryEvent({
          subscriptionId: sub.id,
          customerId: sub.customerId,
          eventType: 'payment_succeeded',
          details: `Payment of ₹${newPayment.amount.toLocaleString()} settled via ${params.paymentMethod.type}. Invoice ${invoice.invoiceNumber} recorded.`,
        });
      }

      // 4. Update customer spend & health
      if (customer) {
        this.updateCustomer(customer.id, {
          totalSpent: (customer.totalSpent || 0) + newPayment.amount,
          healthScore: Math.min(100, (customer.healthScore || 80) + 5),
          churnRisk: 'low',
        });
      }

      this.addNotification({
        title: 'Payment Succeeded',
        message: `Settled ₹${newPayment.amount.toLocaleString()} for ${customer?.company || 'Customer'}.`,
        type: 'payment_success',
        link: '/payments',
      });

      return { payment: newPayment, invoice, isIdempotentReplay: false };
    } else {
      // Payment failure path
      payments.unshift(newPayment);
      setItem(STORAGE_KEYS.PAYMENTS, payments);

      if (sub && (sub.status === 'active' || sub.status === 'past_due')) {
        this.updateSubscriptionStatus(sub.id, 'past_due', newPayment.failureReason);
      }

      if (customer) {
        this.updateCustomer(customer.id, {
          healthScore: Math.max(15, (customer.healthScore || 70) - 20),
          churnRisk: 'high',
        });
      }

      this.addNotification({
        title: 'Payment Failed (Grace Period Active)',
        message: `Charge of ₹${newPayment.amount.toLocaleString()} failed for ${customer?.company}: ${newPayment.failureReason}`,
        type: 'payment_failed',
        link: '/payments',
      });

      return { payment: newPayment, error: newPayment.failureReason, isIdempotentReplay: false };
    }
  },

  retryPayment(paymentId: string): { payment: Payment; invoice?: Invoice } {
    const payment = this.getPayments().find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    return this.processPayment({
      subscriptionId: payment.subscriptionId,
      customerId: payment.customerId,
      amount: payment.amount,
      paymentMethod: {
        type: 'card',
        brand: 'Visa (Retry)',
        last4: '4242',
      },
      idempotencyKey: `retry_${paymentId}_${Date.now()}`,
      forceFailure: false,
    });
  },

  refundPayment(paymentId: string): Payment {
    const tenantId = this.getCurrentTenantId();
    const payments = getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const index = payments.findIndex((p) => p.id === paymentId && p.tenantId === tenantId);
    if (index === -1) throw new Error('Payment not found');

    const target = payments[index];
    const updated: Payment = {
      ...target,
      status: 'refunded',
    };
    payments[index] = updated;
    setItem(STORAGE_KEYS.PAYMENTS, payments);

    if (updated.invoiceId) {
      const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
      const invIdx = invoices.findIndex((i) => i.id === updated.invoiceId && i.tenantId === tenantId);
      if (invIdx !== -1) {
        invoices[invIdx].status = 'refunded';
        setItem(STORAGE_KEYS.INVOICES, invoices);
      }
    }

    // Ledger entry for refund credit note
    const subtotal = Math.round(target.amount / 1.18);
    const tax = target.amount - subtotal;
    const ledger = getItem<FinancialLedgerEntry[]>(STORAGE_KEYS.LEDGER, INITIAL_FINANCIAL_LEDGER);
    const txId = `ref_${Date.now()}`;

    ledger.unshift(
      {
        id: `led-${Date.now()}-1`,
        tenantId,
        transactionId: txId,
        entryType: 'debit',
        accountName: 'Refunds & Allowances',
        amount: subtotal,
        referenceId: target.id,
        description: `Refund debit for payment ${target.transactionId}`,
        createdAt: new Date().toISOString(),
      },
      {
        id: `led-${Date.now()}-2`,
        tenantId,
        transactionId: txId,
        entryType: 'debit',
        accountName: 'GST Output Liability',
        amount: tax,
        referenceId: target.id,
        description: `GST reversal credit on refund`,
        createdAt: new Date().toISOString(),
      },
      {
        id: `led-${Date.now()}-3`,
        tenantId,
        transactionId: txId,
        entryType: 'credit',
        accountName: 'Cash/Razorpay Gateway',
        amount: target.amount,
        referenceId: target.id,
        description: `Cash outflow for customer refund`,
        createdAt: new Date().toISOString(),
      }
    );
    setItem(STORAGE_KEYS.LEDGER, ledger);

    this.addHistoryEvent({
      subscriptionId: target.subscriptionId,
      customerId: target.customerId,
      eventType: 'refund_issued',
      details: `Refund of ₹${target.amount.toLocaleString()} issued. Financial ledger balanced.`,
    });

    return updated;
  },

  // Double-Entry Ledger Recording
  recordLedgerTransaction(params: {
    transactionId: string;
    debitAccount: FinancialLedgerEntry['accountName'];
    creditAccount: FinancialLedgerEntry['accountName'];
    grossAmount: number;
    netRevenue: number;
    gstTax: number;
    referenceId: string;
    description: string;
  }): void {
    const tenantId = this.getCurrentTenantId();
    const ledger = getItem<FinancialLedgerEntry[]>(STORAGE_KEYS.LEDGER, INITIAL_FINANCIAL_LEDGER);
    const now = new Date().toISOString();

    // 1. Debit Cash/Gateway Asset
    ledger.unshift({
      id: `led-${Date.now()}-1`,
      tenantId,
      transactionId: params.transactionId,
      entryType: 'debit',
      accountName: params.debitAccount,
      amount: params.grossAmount,
      referenceId: params.referenceId,
      description: params.description,
      createdAt: now,
    });

    // 2. Credit Subscription Revenue
    ledger.unshift({
      id: `led-${Date.now()}-2`,
      tenantId,
      transactionId: params.transactionId,
      entryType: 'credit',
      accountName: params.creditAccount,
      amount: params.netRevenue,
      referenceId: params.referenceId,
      description: 'Net subscription revenue recognized',
      createdAt: now,
    });

    // 3. Credit GST Output Liability (18% Statutory tax)
    ledger.unshift({
      id: `led-${Date.now()}-3`,
      tenantId,
      transactionId: params.transactionId,
      entryType: 'credit',
      accountName: 'GST Output Liability',
      amount: params.gstTax,
      referenceId: params.referenceId,
      description: '18% GST collected for statutory compliance',
      createdAt: now,
    });

    setItem(STORAGE_KEYS.LEDGER, ledger);
  },

  getFinancialLedger(): FinancialLedgerEntry[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    return getItem<FinancialLedgerEntry[]>(STORAGE_KEYS.LEDGER, INITIAL_FINANCIAL_LEDGER).filter((l) => l.tenantId === tenantId);
  },

  // Invoices & Exact GST Breakdown
  getInvoices(): Invoice[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES).filter((i) => i.tenantId === tenantId);
  },

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id);
  },

  generateInvoice(params: {
    subscriptionId: string;
    customerId: string;
    paymentId?: string;
    planId: string;
    billingInterval: 'monthly' | 'annual';
    grossAmount?: number;
  }): Invoice {
    const tenantId = this.getCurrentTenantId();
    const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const customer = this.getCustomerById(params.customerId);
    const plan = this.getPlanById(params.planId);
    const nextNum = invoices.length + 62;
    const invNumber = `INV-2026-${String(nextNum).padStart(4, '0')}`;

    let basePrice: number;
    let tax: number;
    let total: number;

    if (params.grossAmount) {
      total = params.grossAmount;
      basePrice = Math.round(total / 1.18);
      tax = total - basePrice;
    } else {
      basePrice = params.billingInterval === 'annual' ? (plan?.annualPrice || 7990) : (plan?.monthlyPrice || 799);
      tax = Math.round(basePrice * 0.18);
      total = basePrice + tax;
    }

    const cgst = Math.round(tax / 2);
    const sgst = tax - cgst;

    const now = new Date();
    const periodEnd = new Date(now);
    if (params.billingInterval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now().toString().slice(-6)}`,
      tenantId,
      invoiceNumber: invNumber,
      subscriptionId: params.subscriptionId,
      customerId: params.customerId,
      paymentId: params.paymentId,
      subtotal: basePrice,
      taxAmount: tax,
      cgstAmount: cgst,
      sgstAmount: sgst,
      totalAmount: total,
      currency: 'INR',
      status: params.paymentId ? 'paid' : 'pending',
      issueDate: now.toISOString(),
      dueDate: now.toISOString(),
      paidAt: params.paymentId ? now.toISOString() : undefined,
      billingPeriodStart: now.toISOString(),
      billingPeriodEnd: periodEnd.toISOString(),
      planName: plan?.name || 'SaaS Subscription',
      items: [
        {
          id: `item-${Date.now()}`,
          description: `${plan?.name || 'Subscription'} (${params.billingInterval === 'annual' ? 'Annual Tier - 1 Year' : 'Monthly Tier - 1 Month'})`,
          quantity: 1,
          unitPrice: basePrice,
          total: basePrice,
          hsnSacCode: '998313',
        },
      ],
      customer: customer
        ? {
            name: customer.name,
            company: customer.company,
            email: customer.email,
            phone: customer.phone,
            address: customer.address ? `${customer.address}, ${customer.city || ''}` : 'Corporate Headquarters',
            taxId: customer.taxId || 'GSTIN-PENDING',
          }
        : undefined,
      createdAt: now.toISOString(),
    };

    invoices.unshift(newInvoice);
    setItem(STORAGE_KEYS.INVOICES, invoices);
    return newInvoice;
  },

  // Automated Renewals Batch Scheduler
  triggerRenewalBatch(): {
    processedCount: number;
    successCount: number;
    failedCount: number;
    details: string[];
  } {
    const subs = this.getSubscriptions().filter((s) => s.status === 'active' || s.status === 'past_due');
    let successCount = 0;
    let failedCount = 0;
    const details: string[] = [];

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    subs.forEach((sub) => {
      const expiry = new Date(sub.currentPeriodEnd);
      if (expiry <= sevenDaysFromNow || sub.status === 'past_due') {
        const plan = this.getPlanById(sub.planId);
        const amount = (sub.billingInterval === 'annual' ? plan?.annualPrice : plan?.monthlyPrice) || 799;
        const total = Math.round(amount * 1.18);

        // Test failure on sub-3
        const willFail = sub.customerId === 'cust-3';

        const result = this.processPayment({
          subscriptionId: sub.id,
          customerId: sub.customerId,
          amount: total,
          paymentMethod: {
            type: 'card',
            brand: 'Visa Auto-Renew',
            last4: '4242',
          },
          idempotencyKey: `auto_renew_${sub.id}_${now.toISOString().slice(0, 10)}`,
          forceFailure: willFail,
          failureReason: willFail ? 'Renewal dunning failed: Customer bank card has expired.' : undefined,
        });

        if (result.payment.status === 'success') {
          successCount++;
          details.push(`Renewed ${sub.customer?.company || sub.id} for ₹${total}`);
        } else {
          failedCount++;
          details.push(`Failed renewal for ${sub.customer?.company || sub.id}: ${result.error}`);
        }
      }
    });

    return {
      processedCount: successCount + failedCount,
      successCount,
      failedCount,
      details,
    };
  },

  // History & Notifications
  getHistory(subscriptionId?: string): SubscriptionHistoryEvent[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    const history = getItem<SubscriptionHistoryEvent[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY).filter((h) => !h.tenantId || h.tenantId === tenantId);
    if (subscriptionId) {
      return history.filter((h) => h.subscriptionId === subscriptionId);
    }
    return history;
  },

  addHistoryEvent(event: Omit<SubscriptionHistoryEvent, 'id' | 'timestamp' | 'tenantId'>): void {
    const history = getItem<SubscriptionHistoryEvent[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    history.unshift({
      ...event,
      id: `hist-${Date.now()}`,
      tenantId: this.getCurrentTenantId(),
      timestamp: new Date().toISOString(),
      userEmail: event.userEmail || this.getCurrentUser().email,
    });
    setItem(STORAGE_KEYS.HISTORY, history);
  },

  getNotifications(): NotificationItem[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS).filter((n) => !n.tenantId || n.tenantId === tenantId);
  },

  getCustomerUsage(customerId: string): CustomerUsage | undefined {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    const usageList = getItem<CustomerUsage[]>(STORAGE_KEYS.USAGE, INITIAL_USAGE);
    return usageList.find((u) => u.customerId === customerId && u.tenantId === tenantId);
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read' | 'tenantId'>): void {
    const list = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    list.unshift({
      ...notif,
      id: `notif-${Date.now()}`,
      tenantId: this.getCurrentTenantId(),
      read: false,
      createdAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  markNotificationAsRead(id: string): void {
    const list = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  markAllNotificationsRead(): void {
    const list = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    list.forEach((n) => (n.read = true));
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  // Machine Learning Churn Engine & Explainability
  getMLModelMetrics(): MLModelEvaluation {
    return TRAINED_ML_METRICS;
  },

  getChurnPredictions(): ChurnPrediction[] {
    const customers = this.getCustomers();
    const subs = this.getSubscriptions();
    const payments = this.getPayments();
    const usageList = getItem<CustomerUsage[]>(STORAGE_KEYS.USAGE, INITIAL_USAGE);

    return customers.map((c) => {
      const sub = subs.find((s) => s.customerId === c.id && s.status !== 'cancelled');
      const custPayments = payments.filter((p) => p.customerId === c.id);
      const usage = usageList.find((u) => u.customerId === c.id);

      const failedCount = custPayments.filter((p) => p.status === 'failed').length;
      const isPastDue = sub?.status === 'past_due';
      const isAnnual = sub?.billingInterval === 'annual';
      const loginCount = usage?.loginCountLast30Days || 0;
      const apiCalls = usage?.apiCallsMonth || 0;

      // Realistic inference using trained weights
      let z = -1.15; // baseline bias
      const contributions = [];

      if (failedCount > 0) {
        const impact = Math.min(50, failedCount * 25);
        z += (failedCount * 0.942);
        contributions.push({
          feature: 'Payment Friction',
          value: `${failedCount} failures`,
          impactWeight: impact,
          description: 'Recurring card declines signal severe risk of involuntary churn.',
        });
      }

      if (loginCount < 10) {
        const impact = 25;
        z += 0.725;
        contributions.push({
          feature: 'Low User Engagement',
          value: `${loginCount} logins/mo`,
          impactWeight: impact,
          description: 'Team inactivity indicates declining product stickiness.',
        });
      } else if (loginCount > 80) {
        z -= 0.6;
        contributions.push({
          feature: 'Strong User Engagement',
          value: `${loginCount} logins/mo`,
          impactWeight: -12,
          description: 'Daily team activity strongly defends against churn.',
        });
      }

      if (isPastDue) {
        z += 0.85;
        contributions.push({
          feature: 'Past Due Status',
          value: 'Active Dunning',
          impactWeight: 30,
          description: 'Account currently in grace period awaiting payment recovery.',
        });
      }

      if (isAnnual) {
        z -= 0.85;
        contributions.push({
          feature: 'Annual Contract Commitment',
          value: 'Annual Tier',
          impactWeight: -15,
          description: 'Long-term contractual commitment significantly dampens churn probability.',
        });
      }

      const probability = 1 / (1 + Math.exp(-z));
      const riskScore = Math.round(probability * 100);
      const healthScore = Math.max(5, Math.min(98, 100 - riskScore));

      let churnRisk: 'low' | 'medium' | 'high' = 'low';
      let recommendedAction = 'Maintain standard success cadence and propose annual contract.';

      if (riskScore >= 65) {
        churnRisk = 'high';
        recommendedAction = 'Dispatch immediate customer success intervention; offer 20% retention discount or pause extension.';
      } else if (riskScore >= 35) {
        churnRisk = 'medium';
        recommendedAction = 'Send automated feature onboarding tips and offer complimentary optimization session.';
      }

      const daysToRenewal = sub ? Math.round((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

      return {
        customerId: c.id,
        tenantId: c.tenantId,
        customerName: c.name,
        company: c.company,
        churnRisk,
        riskScore,
        healthScore,
        keyFactors: contributions.map((k) => `${k.feature}: ${k.value}`),
        contributions,
        recommendedAction,
        retentionOfferEligible: churnRisk === 'high',
        generatedAt: new Date().toISOString(),
        planName: c.currentPlanName || 'No Plan',
        monthlyValue: c.mrr || 0,
        daysToRenewal,
        isTrainedModel: true,
      };
    });
  },

  // Smart Retention Campaigns
  getRetentionCampaigns(): SmartRetentionCampaign[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    return getItem<SmartRetentionCampaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_SMART_RETENTION_CAMPAIGNS).filter((c) => c.tenantId === tenantId);
  },

  applyRetentionOffer(campaignId: string): SmartRetentionCampaign {
    const tenantId = this.getCurrentTenantId();
    const campaigns = getItem<SmartRetentionCampaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_SMART_RETENTION_CAMPAIGNS);
    const index = campaigns.findIndex((c) => c.id === campaignId && c.tenantId === tenantId);
    if (index === -1) throw new Error('Campaign not found');

    campaigns[index].status = 'accepted';
    setItem(STORAGE_KEYS.CAMPAIGNS, campaigns);

    this.addNotification({
      title: 'Retention Offer Applied',
      message: `20% discount applied to ${campaigns[index].company} for the next renewal cycle.`,
      type: 'system',
      link: '/ai-insights',
    });

    return campaigns[index];
  },

  // Revenue Anomaly Detection
  getRevenueAnomalies(): RevenueAnomaly[] {
    initLocalStorage();
    const tenantId = this.getCurrentTenantId();
    return getItem<RevenueAnomaly[]>(STORAGE_KEYS.ANOMALIES, INITIAL_REVENUE_ANOMALIES).filter((a) => a.tenantId === tenantId);
  },

  resolveAnomaly(anomalyId: string): void {
    const tenantId = this.getCurrentTenantId();
    const list = getItem<RevenueAnomaly[]>(STORAGE_KEYS.ANOMALIES, INITIAL_REVENUE_ANOMALIES);
    const index = list.findIndex((a) => a.id === anomalyId && a.tenantId === tenantId);
    if (index !== -1) {
      list[index].status = 'resolved';
      setItem(STORAGE_KEYS.ANOMALIES, list);
    }
  },

  // What-If Revenue Simulator
  runWhatIfSimulation(params: WhatIfSimulationParams): WhatIfSimulationResult {
    const currentMetrics = this.getDashboardMetrics();
    const currentArr = currentMetrics.arr;
    const currentMrr = currentMetrics.mrr;

    const monthlyGrowth = params.growthRatePct / 100;
    const monthlyChurn = params.churnRatePct / 100;
    const arpuMultiplier = 1 + (params.arpuChangePct / 100);

    const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];
    let runningMrr = currentMrr * arpuMultiplier;
    let totalChurnLoss = 0;

    const trajectory = months.map((m, idx) => {
      const churnLoss = Math.round(runningMrr * monthlyChurn);
      totalChurnLoss += churnLoss;
      const netAddition = Math.round(runningMrr * monthlyGrowth) + (params.newSignupsPerMonth * 799);
      runningMrr = runningMrr - churnLoss + netAddition;

      return {
        month: m,
        mrr: Math.round(runningMrr),
        netNewCustomers: Math.round(params.newSignupsPerMonth * (1 + idx * 0.1)),
        churnedCustomers: Math.max(0, Math.round(runningMrr * monthlyChurn / (currentMetrics.arpu || 799))),
      };
    });

    const projectedArrIn12Months = Math.round(runningMrr * 12);
    const netNewArr = projectedArrIn12Months - currentArr;

    return {
      projectedArrIn12Months,
      currentArr,
      netNewArr,
      totalChurnLoss,
      monthlyTrajectory: trajectory,
    };
  },

  // Derived Financial Metrics & Unit Economics
  getDashboardMetrics(): DashboardMetrics {
    const customers = this.getCustomers();
    const subs = this.getSubscriptions();
    const payments = this.getPayments();
    const plans = this.getPlans();
    const ledger = this.getFinancialLedger();

    const activeSubs = subs.filter((s) => s.status === 'active');
    let totalMrr = 0;

    activeSubs.forEach((s) => {
      const plan = plans.find((p) => p.id === s.planId);
      if (plan) {
        if (s.billingInterval === 'annual') {
          totalMrr += Math.round(plan.annualPrice / 12);
        } else {
          totalMrr += plan.monthlyPrice;
        }
      }
    });

    const totalArr = totalMrr * 12;

    const pendingPayments = payments.filter((p) => p.status === 'pending');
    const failedPayments = payments.filter((p) => p.status === 'failed');
    const successfulPayments = payments.filter((p) => p.status === 'success');

    const totalPaymentAttempts = payments.length;
    const successRate = totalPaymentAttempts > 0 ? Math.round((successfulPayments.length / totalPaymentAttempts) * 100) : 100;

    const churnRate = 2.4;
    const logoChurnRate = 2.1;
    const revenueChurnRate = 1.8;

    const arpu = activeSubs.length > 0 ? Math.round(totalMrr / activeSubs.length) : 0;
    const clv = arpu > 0 ? Math.round(arpu / (churnRate / 100)) : 0;

    const healthScores = customers.map((c) => c.healthScore || 85);
    const avgHealth = Math.round(healthScores.reduce((a, b) => a + b, 0) / (healthScores.length || 1));

    const reconciledVolume = payments.filter((p) => p.reconciled).reduce((acc, p) => acc + p.amount, 0);
    const unreconciledVolume = payments.filter((p) => !p.reconciled).reduce((acc, p) => acc + p.amount, 0);

    return {
      totalCustomers: customers.length,
      newCustomersThisMonth: 3,
      activeSubscriptions: activeSubs.length,
      activeSubscriptionsGrowth: 14.5,
      mrr: totalMrr,
      mrrGrowth: 12.8,
      arr: totalArr,
      arrGrowth: 15.2,
      pendingPaymentsCount: pendingPayments.length,
      pendingPaymentsAmount: pendingPayments.reduce((acc, p) => acc + p.amount, 0),
      failedPaymentsCount: failedPayments.length,
      churnRate,
      logoChurnRate,
      revenueChurnRate,
      arpu,
      clv,
      paymentSuccessRate: successRate,
      healthScoreAvg: avgHealth,
      reconciledVolume,
      unreconciledVolume,
    };
  },

  getRevenueForecast(): RevenueForecastMonth[] {
    const metrics = this.getDashboardMetrics();
    const currentMrr = metrics.mrr;
    const months = ['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027', 'Apr 2027'];

    return months.map((m, idx) => {
      const factor = idx + 1;
      const projected = Math.round(currentMrr * Math.pow(1 + (0.08 - 0.024), factor));
      const conservative = Math.round(currentMrr * Math.pow(1 + (0.04 - 0.035), factor));
      const optimistic = Math.round(currentMrr * Math.pow(1 + (0.14 - 0.018), factor));

      return {
        month: m,
        projectedMrr: projected,
        conservativeMrr: conservative,
        optimisticMrr: optimistic,
        newSubscriptionsCount: Math.round(3 + factor * 2),
        projectedChurnLoss: Math.round(projected * 0.024),
      };
    });
  },
};
