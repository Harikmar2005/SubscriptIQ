export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customerId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'suspended';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string; // GSTIN / Tax ID
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  // Computed / expanded fields
  activeSubscriptionId?: string;
  currentPlanName?: string;
  mrr?: number;
  totalSpent?: number;
  healthScore?: number;
  churnRisk?: 'low' | 'medium' | 'high';
}

export interface PlanFeatures {
  usersLimit: number;
  apiCallsLimit: number;
  storageGbLimit: number;
  customDomains: boolean;
  prioritySupport: boolean;
  automatedInvoicing: boolean;
  churnIntelligence: boolean;
  webhookIntegrations: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: 'basic' | 'pro' | 'enterprise' | string;
  description: string;
  monthlyPrice: number; // in INR e.g. 299
  annualPrice: number;  // in INR e.g. 2990
  currency: 'INR' | 'USD';
  trialDays: number;
  features: string[];
  limits: PlanFeatures;
  isPopular?: boolean;
  isArchived: boolean;
  createdAt: string;
}

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'expired';

export type BillingInterval = 'monthly' | 'annual';

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  pausedAt?: string;
  autoRenew: boolean;
  paymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  customer?: Customer;
  plan?: SubscriptionPlan;
}

export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded';

export interface PaymentMethod {
  type: 'card' | 'upi' | 'netbanking';
  last4?: string;
  brand?: string;
  upiId?: string;
  bankName?: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: 'INR';
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  gateway: 'razorpay_simulated';
  transactionId: string;
  failureReason?: string;
  invoiceId?: string;
  createdAt: string;
  // Populated fields
  customerName?: string;
  planName?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0089
  subscriptionId: string;
  customerId: string;
  paymentId?: string;
  subtotal: number;
  taxAmount: number; // 18% GST in INR
  totalAmount: number;
  currency: 'INR';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  items: InvoiceItem[];
  customer?: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address?: string;
    taxId?: string;
  };
  planName?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  customerId?: string;
  title: string;
  message: string;
  type: 'renewal_reminder' | 'payment_failed' | 'payment_success' | 'subscription_expiring' | 'churn_risk' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface SubscriptionHistoryEvent {
  id: string;
  subscriptionId: string;
  customerId: string;
  eventType:
    | 'created'
    | 'activated'
    | 'upgraded'
    | 'downgraded'
    | 'paused'
    | 'resumed'
    | 'cancelled'
    | 'renewed'
    | 'payment_failed'
    | 'payment_succeeded';
  details: string;
  previousPlanId?: string;
  newPlanId?: string;
  timestamp: string;
  userEmail?: string;
}

export interface CustomerUsage {
  customerId: string;
  activeUsers: number;
  apiCallsMonth: number;
  storageUsedGb: number;
  loginCountLast30Days: number;
  lastActiveDate: string;
  featuresAdoptedCount: number;
}

export interface ChurnPrediction {
  customerId: string;
  customerName: string;
  company: string;
  churnRisk: 'low' | 'medium' | 'high';
  riskScore: number; // 0 - 100 (higher = more likely to churn)
  healthScore: number; // 0 - 100 (higher = healthier)
  keyFactors: string[];
  recommendedAction: string;
  generatedAt: string;
  planName: string;
  monthlyValue: number;
  daysToRenewal: number;
}

export interface RevenueForecastMonth {
  month: string;
  projectedMrr: number;
  conservativeMrr: number;
  optimisticMrr: number;
  newSubscriptionsCount: number;
  projectedChurnLoss: number;
}

export interface DashboardMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeSubscriptions: number;
  activeSubscriptionsGrowth: number; // percentage
  mrr: number; // Monthly Recurring Revenue in INR
  mrrGrowth: number; // percentage
  arr: number; // Annual Recurring Revenue in INR
  arrGrowth: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  failedPaymentsCount: number;
  churnRate: number; // e.g. 2.4%
  arpu: number; // Average Revenue Per User
  clv: number; // Customer Lifetime Value
  paymentSuccessRate: number; // percentage
  healthScoreAvg: number;
}
