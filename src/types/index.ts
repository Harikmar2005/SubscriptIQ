export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string; // Tenant-level isolation identifier
  customerId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'suspended';

export interface Customer {
  id: string;
  tenantId?: string;
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
  overageApiRatePerThousand?: number; // e.g. ₹5 per 1,000 calls over quota
  overageStorageRatePerGb?: number; // e.g. ₹20 per GB over storage
}

export interface SubscriptionPlan {
  id: string;
  tenantId?: string;
  name: string;
  code: 'basic' | 'pro' | 'enterprise' | string;
  description: string;
  monthlyPrice: number; // in INR
  annualPrice: number;  // in INR
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
  tenantId: string;
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
  gracePeriodEnd?: string; // Grace period before suspension
  failedRetryCount?: number;
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
  tenantId: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: 'INR';
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  gateway: 'razorpay_simulated';
  transactionId: string;
  idempotencyKey?: string; // Duplicate payment prevention
  failureReason?: string;
  invoiceId?: string;
  reconciled: boolean; // Bank ledger reconciliation status
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
  hsnSacCode?: string; // 998313 for IT SaaS
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  paymentId?: string;
  subtotal: number;
  taxAmount: number; // 18% GST (CGST 9% + SGST 9% / IGST 18%)
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
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
  tenantId?: string;
  userId?: string;
  customerId?: string;
  title: string;
  message: string;
  type: 'renewal_reminder' | 'payment_failed' | 'payment_success' | 'subscription_expiring' | 'churn_risk' | 'anomaly' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface SubscriptionHistoryEvent {
  id: string;
  tenantId?: string;
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
    | 'payment_succeeded'
    | 'refund_issued';
  details: string;
  previousPlanId?: string;
  newPlanId?: string;
  timestamp: string;
  userEmail?: string;
}

export interface CustomerUsage {
  customerId: string;
  tenantId?: string;
  activeUsers: number;
  apiCallsMonth: number;
  storageUsedGb: number;
  storageGbUsed?: number;
  loginCountLast30Days: number;
  lastActiveDate: string;
  featuresAdoptedCount: number;
  billingCycle?: string;
  meteredOveragesInr?: number;
  // Overages
  apiOveragesUnits?: number;
  apiOverageAmount?: number;
  storageOveragesUnits?: number;
  storageOverageAmount?: number;
}

export interface ChurnFeatureContribution {
  feature: string;
  value: string | number;
  impactWeight: number; // e.g. +35% or -15%
  description: string;
}

export interface ChurnPrediction {
  customerId: string;
  tenantId?: string;
  customerName: string;
  company: string;
  churnRisk: 'low' | 'medium' | 'high';
  riskScore: number; // 0 - 100
  healthScore: number; // 0 - 100
  keyFactors: string[];
  contributions: ChurnFeatureContribution[];
  recommendedAction: string;
  retentionOfferEligible?: boolean;
  generatedAt: string;
  planName: string;
  monthlyValue: number;
  daysToRenewal: number;
  isTrainedModel: boolean;
}

export interface MLModelEvaluation {
  modelName: string;
  modelType?: string;
  version?: string;
  algorithm: string;
  accuracy: number;
  rocAuc: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingSamplesCount: number;
  trainedAt: string;
  featureImportances: {
    feature: string;
    importancePct?: number;
    importance?: number;
    description: string;
  }[];
  confusionMatrix: {
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
    truePositive: number;
  };
}

export interface FinancialLedgerEntry {
  id: string;
  tenantId: string;
  transactionId: string;
  entryType: 'debit' | 'credit';
  accountName: 'Cash/Razorpay Gateway' | 'Accounts Receivable' | 'Subscription Revenue' | 'GST Output Liability' | 'Refunds & Allowances' | string;
  amount: number;
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface RevenueAnomaly {
  id: string;
  tenantId: string;
  detectedAt: string;
  metric?: 'MRR' | 'Payment Failure Rate' | 'Expansion Revenue' | 'Churn Spurt' | string;
  anomalyType?: string;
  severity: 'low' | 'medium' | 'critical';
  expectedRange?: string;
  observedValue?: string;
  expectedValue?: number;
  actualValue?: number;
  zScore?: number;
  deviationScore?: number; // z-score
  rootCause?: string;
  rootCauseDescription?: string;
  suggestedAction?: string;
  status: 'active' | 'investigating' | 'resolved' | 'detected';
}

export interface SmartRetentionCampaign {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  company: string;
  campaignName?: string;
  triggerEvent: string;
  offerType: 'discount_20_percent' | 'pause_extension_60d' | 'complimentary_onboarding' | 'annual_upgrade_credit' | string;
  offerDiscountPct?: number;
  offerDurationMonths?: number;
  triggerRiskLevel?: string;
  discountValue: number;
  status: 'pending' | 'sent' | 'accepted' | 'declined';
  expiresAt: string;
  createdAt: string;
}

export interface WhatIfSimulationParams {
  growthRatePct: number; // e.g. 8%
  churnRatePct: number;  // e.g. 2.4%
  arpuChangePct: number; // e.g. +10%
  newSignupsPerMonth: number; // e.g. 5
}

export interface WhatIfSimulationResult {
  projectedArrIn12Months: number;
  currentArr: number;
  netNewArr: number;
  totalChurnLoss: number;
  monthlyTrajectory: {
    month: string;
    mrr: number;
    netNewCustomers: number;
    churnedCustomers: number;
  }[];
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
  activeSubscriptionsGrowth: number;
  mrr: number; // in INR
  mrrGrowth: number;
  arr: number; // in INR
  arrGrowth: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  failedPaymentsCount: number;
  churnRate: number; // percentage
  logoChurnRate: number;
  revenueChurnRate: number;
  arpu: number;
  clv: number;
  paymentSuccessRate: number;
  healthScoreAvg: number;
  reconciledVolume: number;
  unreconciledVolume: number;
}
