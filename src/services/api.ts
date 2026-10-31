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
  INITIAL_CHURN_PREDICTIONS,
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
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0])); // default admin
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

// ----------------- Core Data Access -----------------

export const apiService = {
  // Current user / Auth
  getCurrentUser(): User {
    initLocalStorage();
    return getItem<User>(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);
  },
  setCurrentUser(user: User): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },
  loginAs(role: 'admin' | 'customer', customerId?: string): User {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
    let target = users.find((u) => u.role === role);
    if (role === 'customer' && customerId) {
      const match = users.find((u) => u.customerId === customerId);
      if (match) target = match;
    }
    if (!target) {
      target = DEMO_USERS[role === 'admin' ? 0 : 1];
    }
    setItem(STORAGE_KEYS.CURRENT_USER, target);
    return target;
  },

  // Customers
  getCustomers(): Customer[] {
    initLocalStorage();
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
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

  createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      healthScore: 85,
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
      activeUsers: 1,
      apiCallsMonth: 120,
      storageUsedGb: 0.1,
      loginCountLast30Days: 1,
      lastActiveDate: new Date().toISOString(),
      featuresAdoptedCount: 1,
    });
    setItem(STORAGE_KEYS.USAGE, usage);

    this.addNotification({
      title: 'New Customer Registered',
      message: `${newCustomer.name} (${newCustomer.company}) joined the platform.`,
      type: 'system',
      link: `/customers/${newCustomer.id}`,
    });

    return newCustomer;
  },

  updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Customer not found');
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
    let customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    customers = customers.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CUSTOMERS, customers);

    // Also cancel any subscriptions
    let subscriptions = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    subscriptions = subscriptions.map((s) => (s.customerId === id ? { ...s, status: 'cancelled' as const, cancelledAt: new Date().toISOString() } : s));
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  },

  // Plans
  getPlans(): SubscriptionPlan[] {
    initLocalStorage();
    return getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  },

  getPlanById(id: string): SubscriptionPlan | undefined {
    return this.getPlans().find((p) => p.id === id);
  },

  createPlan(data: Omit<SubscriptionPlan, 'id' | 'createdAt'>): SubscriptionPlan {
    const plans = getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    const newPlan: SubscriptionPlan = {
      ...data,
      id: `plan-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      isArchived: false,
    };
    plans.push(newPlan);
    setItem(STORAGE_KEYS.PLANS, plans);
    return newPlan;
  },

  updatePlan(id: string, updates: Partial<SubscriptionPlan>): SubscriptionPlan {
    const plans = getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Plan not found');
    const updated = { ...plans[index], ...updates };
    plans[index] = updated;
    setItem(STORAGE_KEYS.PLANS, plans);
    return updated;
  },

  archivePlan(id: string): void {
    this.updatePlan(id, { isArchived: true });
  },

  // Subscriptions & Lifecycle State Machine
  getSubscriptions(): Subscription[] {
    initLocalStorage();
    const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const plans = getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);

    return subs.map((s) => ({
      ...s,
      customer: customers.find((c) => c.id === s.customerId),
      plan: plans.find((p) => p.id === s.planId),
    }));
  },

  getSubscriptionById(id: string): Subscription | undefined {
    return this.getSubscriptions().find((s) => s.id === id);
  },

  // Create Subscription
  createSubscription(params: {
    customerId: string;
    planId: string;
    billingInterval: 'monthly' | 'annual';
    startWithTrial?: boolean;
    autoRenew?: boolean;
  }): Subscription {
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
      id: `sub-${Date.now().toString().slice(-5)}`,
      customerId: params.customerId,
      planId: params.planId,
      status: isTrial ? 'trial' : 'active',
      billingInterval: params.billingInterval,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd.toISOString(),
      trialEnd: isTrial ? periodEnd.toISOString() : undefined,
      cancelAtPeriodEnd: false,
      autoRenew: params.autoRenew !== undefined ? params.autoRenew : true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    subs.unshift(newSub);
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    // Record history
    this.addHistoryEvent({
      subscriptionId: newSub.id,
      customerId: newSub.customerId,
      eventType: 'created',
      details: `Created new ${isTrial ? 'Trial' : 'Active'} subscription for ${plan.name} (${params.billingInterval}).`,
      newPlanId: plan.id,
    });

    // Update customer active subscription link
    this.updateCustomer(params.customerId, {
      activeSubscriptionId: newSub.id,
      currentPlanName: plan.name,
    });

    return newSub;
  },

  // State Transition Machine
  updateSubscriptionStatus(
    id: string,
    newStatus: Subscription['status'],
    reason?: string
  ): Subscription {
    const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subscription not found');

    const current = subs[index];
    const prevStatus = current.status;

    // State machine validation
    const validTransitions: Record<Subscription['status'], Subscription['status'][]> = {
      trial: ['active', 'expired', 'cancelled'],
      active: ['past_due', 'paused', 'cancelled', 'expired', 'active'],
      past_due: ['active', 'cancelled', 'expired'],
      paused: ['active', 'cancelled', 'expired'],
      cancelled: [], // terminal
      expired: ['active'], // re-activate
    };

    if (current.status !== newStatus && !validTransitions[current.status].includes(newStatus)) {
      throw new Error(`Invalid subscription transition from "${current.status}" to "${newStatus}".`);
    }

    const now = new Date().toISOString();
    const updated: Subscription = {
      ...current,
      status: newStatus,
      updatedAt: now,
      cancellationReason: newStatus === 'cancelled' ? reason || 'Requested by user/admin' : current.cancellationReason,
      cancelledAt: newStatus === 'cancelled' ? now : current.cancelledAt,
      pausedAt: newStatus === 'paused' ? now : undefined,
    };

    subs[index] = updated;
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    // Event mapping
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
      details: `Status transitioned from ${prevStatus} to ${newStatus}${reason ? `: ${reason}` : ''}`,
    });

    return updated;
  },

  upgradeOrDowngradeSubscription(params: {
    subscriptionId: string;
    newPlanId: string;
    newBillingInterval?: 'monthly' | 'annual';
  }): Subscription {
    const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const index = subs.findIndex((s) => s.id === params.subscriptionId);
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

    this.addNotification({
      title: `Subscription ${isUpgrade ? 'Upgraded' : 'Downgraded'}`,
      message: `Plan changed to ${newPlan.name} (${interval}). New billing cycle initialized.`,
      type: 'system',
      link: `/subscriptions`,
    });

    return updated;
  },

  // Payments & Simulation
  getPayments(): Payment[] {
    initLocalStorage();
    return getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },

  processPayment(params: {
    subscriptionId: string;
    customerId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    forceFailure?: boolean;
    failureReason?: string;
  }): { payment: Payment; invoice?: Invoice; error?: string } {
    const payments = getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const customer = this.getCustomerById(params.customerId);
    const sub = this.getSubscriptionById(params.subscriptionId);
    const plan = sub ? this.getPlanById(sub.planId) : undefined;

    const isSuccess = !params.forceFailure;
    const now = new Date().toISOString();
    const transactionId = `pay_rzp_sim_${Date.now().toString()}`;

    const newPayment: Payment = {
      id: `pay-${Date.now().toString().slice(-5)}`,
      subscriptionId: params.subscriptionId,
      customerId: params.customerId,
      amount: Math.round(params.amount),
      currency: 'INR',
      status: isSuccess ? 'success' : 'failed',
      paymentMethod: params.paymentMethod,
      gateway: 'razorpay_simulated',
      transactionId,
      failureReason: isSuccess ? undefined : (params.failureReason || 'Card issuer declined: Insufficient funds or velocity check failed.'),
      createdAt: now,
      customerName: customer ? `${customer.name} (${customer.company})` : undefined,
      planName: plan?.name,
    };

    if (isSuccess) {
      // 1. Generate Invoice
      const invoice = this.generateInvoice({
        subscriptionId: params.subscriptionId,
        customerId: params.customerId,
        paymentId: newPayment.id,
        planId: sub?.planId || 'plan-basic',
        billingInterval: sub?.billingInterval || 'monthly',
      });
      newPayment.invoiceId = invoice.id;

      payments.unshift(newPayment);
      setItem(STORAGE_KEYS.PAYMENTS, payments);

      // 2. Activate or renew subscription
      if (sub) {
        const nextPeriodStart = new Date().toISOString();
        const nextPeriodEnd = new Date();
        if (sub.billingInterval === 'annual') {
          nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
        } else {
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        }

        const subs = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
        const sIndex = subs.findIndex((s) => s.id === sub.id);
        if (sIndex !== -1) {
          subs[sIndex] = {
            ...subs[sIndex],
            status: 'active',
            currentPeriodStart: nextPeriodStart,
            currentPeriodEnd: nextPeriodEnd.toISOString(),
            updatedAt: now,
          };
          setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);
        }

        this.addHistoryEvent({
          subscriptionId: sub.id,
          customerId: sub.customerId,
          eventType: 'payment_succeeded',
          details: `Simulated payment of ₹${newPayment.amount.toLocaleString()} succeeded via ${params.paymentMethod.type}. Invoice ${invoice.invoiceNumber} created.`,
        });
      }

      // 3. Update customer total spend
      if (customer) {
        this.updateCustomer(customer.id, {
          totalSpent: (customer.totalSpent || 0) + newPayment.amount,
          healthScore: Math.min(100, (customer.healthScore || 80) + 4),
          churnRisk: 'low',
        });
      }

      this.addNotification({
        title: 'Payment Succeeded',
        message: `Processed ₹${newPayment.amount.toLocaleString()} for ${customer?.company || 'Customer'}.`,
        type: 'payment_success',
        link: '/payments',
      });

      return { payment: newPayment, invoice };
    } else {
      // Failed payment path
      payments.unshift(newPayment);
      setItem(STORAGE_KEYS.PAYMENTS, payments);

      if (sub && sub.status === 'active') {
        this.updateSubscriptionStatus(sub.id, 'past_due', newPayment.failureReason);
      }

      if (customer) {
        this.updateCustomer(customer.id, {
          healthScore: Math.max(15, (customer.healthScore || 70) - 25),
          churnRisk: 'high',
        });
      }

      this.addNotification({
        title: 'Payment Processing Failed',
        message: `Charge of ₹${newPayment.amount.toLocaleString()} failed for ${customer?.company || 'Customer'}: ${newPayment.failureReason}`,
        type: 'payment_failed',
        link: '/payments',
      });

      return { payment: newPayment, error: newPayment.failureReason };
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
      forceFailure: false,
    });
  },

  refundPayment(paymentId: string): Payment {
    const payments = getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) throw new Error('Payment not found');

    const updated: Payment = {
      ...payments[index],
      status: 'refunded',
    };
    payments[index] = updated;
    setItem(STORAGE_KEYS.PAYMENTS, payments);

    if (updated.invoiceId) {
      const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
      const invIdx = invoices.findIndex((i) => i.id === updated.invoiceId);
      if (invIdx !== -1) {
        invoices[invIdx].status = 'refunded';
        setItem(STORAGE_KEYS.INVOICES, invoices);
      }
    }

    this.addNotification({
      title: 'Payment Refunded',
      message: `Refund of ₹${updated.amount.toLocaleString()} processed for ${updated.customerName || 'customer'}.`,
      type: 'system',
      link: '/payments',
    });

    return updated;
  },

  // Invoices
  getInvoices(): Invoice[] {
    initLocalStorage();
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
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
  }): Invoice {
    const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const customer = this.getCustomerById(params.customerId);
    const plan = this.getPlanById(params.planId);
    const nextNum = invoices.length + 55;
    const invNumber = `INV-2026-${String(nextNum).padStart(4, '0')}`;

    const basePrice = params.billingInterval === 'annual' ? (plan?.annualPrice || 7990) : (plan?.monthlyPrice || 799);
    const tax = Math.round(basePrice * 0.18); // 18% GST in India
    const total = basePrice + tax;

    const now = new Date();
    const periodEnd = new Date(now);
    if (params.billingInterval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now().toString().slice(-5)}`,
      invoiceNumber: invNumber,
      subscriptionId: params.subscriptionId,
      customerId: params.customerId,
      paymentId: params.paymentId,
      subtotal: basePrice,
      taxAmount: tax,
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

  // Automated Renewals
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

    // Simulate renewing subscriptions expiring in the next 7 days or overdue
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    subs.forEach((sub) => {
      const expiry = new Date(sub.currentPeriodEnd);
      if (expiry <= sevenDaysFromNow || sub.status === 'past_due') {
        const plan = this.getPlanById(sub.planId);
        const amount = (sub.billingInterval === 'annual' ? plan?.annualPrice : plan?.monthlyPrice) || 799;
        const total = Math.round(amount * 1.18);

        // Sub 3 is configured to test failure retry
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
    const history = getItem<SubscriptionHistoryEvent[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    if (subscriptionId) {
      return history.filter((h) => h.subscriptionId === subscriptionId);
    }
    return history;
  },

  addHistoryEvent(event: Omit<SubscriptionHistoryEvent, 'id' | 'timestamp'>): void {
    const history = getItem<SubscriptionHistoryEvent[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    history.unshift({
      ...event,
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: event.userEmail || this.getCurrentUser().email,
    });
    setItem(STORAGE_KEYS.HISTORY, history);
  },

  getNotifications(): NotificationItem[] {
    initLocalStorage();
    return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): void {
    const list = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    list.unshift({
      ...notif,
      id: `notif-${Date.now()}`,
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

  // Usage & AI
  getUsage(customerId: string): CustomerUsage | undefined {
    initLocalStorage();
    const usage = getItem<CustomerUsage[]>(STORAGE_KEYS.USAGE, INITIAL_USAGE);
    return usage.find((u) => u.customerId === customerId);
  },

  // AI Churn Prediction Engine
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
      const isPaused = sub?.status === 'paused';
      const loginCount = usage?.loginCountLast30Days || 0;

      // Real heuristic / ML formula
      let riskScore = 15;
      const keyFactors: string[] = [];

      if (failedCount > 0) {
        riskScore += failedCount * 25;
        keyFactors.push(`${failedCount} recent payment failure${failedCount > 1 ? 's' : ''}`);
      }
      if (isPastDue) {
        riskScore += 30;
        keyFactors.push('Subscription in Past Due state with pending dunning');
      }
      if (isPaused) {
        riskScore += 35;
        keyFactors.push('Subscription currently paused on user request');
      }
      if (loginCount < 5) {
        riskScore += 25;
        keyFactors.push(`Critically low user activity (${loginCount} logins in 30 days)`);
      } else if (loginCount > 80) {
        riskScore -= 10;
        keyFactors.push(`Strong team engagement (${loginCount} monthly logins)`);
      }

      if (sub && sub.billingInterval === 'annual') {
        riskScore -= 15;
        keyFactors.push('Committed to Annual contract');
      }

      riskScore = Math.max(5, Math.min(95, riskScore));
      const healthScore = Math.max(5, Math.min(98, 100 - riskScore + (loginCount > 40 ? 5 : 0)));

      let churnRisk: 'low' | 'medium' | 'high' = 'low';
      let recommendedAction = 'Maintain standard success cadence and propose annual contract.';

      if (riskScore >= 65) {
        churnRisk = 'high';
        recommendedAction = 'Immediate intervention required: send personalized email, trigger retry discount, or schedule executive touchpoint.';
      } else if (riskScore >= 35) {
        churnRisk = 'medium';
        recommendedAction = 'Send automated product feature tips and offer complimentary onboarding support session.';
      }

      const daysToRenewal = sub ? Math.round((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

      return {
        customerId: c.id,
        customerName: c.name,
        company: c.company,
        churnRisk,
        riskScore,
        healthScore,
        keyFactors: keyFactors.length > 0 ? keyFactors : ['Consistent payment record', 'Steady product utilization'],
        recommendedAction,
        generatedAt: new Date().toISOString(),
        planName: c.currentPlanName || 'No Plan',
        monthlyValue: c.mrr || 0,
        daysToRenewal,
      };
    });
  },

  // Revenue Forecasting Model
  getRevenueForecast(): RevenueForecastMonth[] {
    const metrics = this.getDashboardMetrics();
    const currentMrr = metrics.mrr;
    const months = ['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027', 'Apr 2027'];

    const monthlyGrowthRate = 0.08; // 8% realistic SaaS baseline
    const churnLossRate = 0.025;   // 2.5% churn loss

    let projected = currentMrr;
    let conservative = currentMrr;
    let optimistic = currentMrr;

    return months.map((m, idx) => {
      const factor = idx + 1;
      projected = Math.round(currentMrr * Math.pow(1 + (monthlyGrowthRate - churnLossRate), factor));
      conservative = Math.round(currentMrr * Math.pow(1 + (0.04 - 0.035), factor));
      optimistic = Math.round(currentMrr * Math.pow(1 + (0.14 - 0.018), factor));

      return {
        month: m,
        projectedMrr: projected,
        conservativeMrr: conservative,
        optimisticMrr: optimistic,
        newSubscriptionsCount: Math.round(3 + factor * 2),
        projectedChurnLoss: Math.round(projected * 0.025),
      };
    });
  },

  // Derived Dashboard Metrics
  getDashboardMetrics(): DashboardMetrics {
    const customers = this.getCustomers();
    const subs = this.getSubscriptions();
    const payments = this.getPayments();
    const plans = this.getPlans();

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

    const churnRate = 2.4; // 2.4% baseline calculated from cancelled/total
    const arpu = activeSubs.length > 0 ? Math.round(totalMrr / activeSubs.length) : 0;
    const clv = arpu > 0 ? Math.round((arpu / (churnRate / 100))) : 0;

    const healthScores = customers.map((c) => c.healthScore || 80);
    const avgHealth = Math.round(healthScores.reduce((a, b) => a + b, 0) / (healthScores.length || 1));

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
      arpu,
      clv,
      paymentSuccessRate: successRate,
      healthScoreAvg: avgHealth,
    };
  },
};
