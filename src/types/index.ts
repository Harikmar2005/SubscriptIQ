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

// ==========================================
// REVENUEGUARD CORE TYPES
// ==========================================

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceAdjustment: number; // e.g. +₹200 or -₹50
  billingType: 'flat' | 'per_seat' | 'usage';
  isActive: boolean;
}

export interface Product {
  id: string;
  tenantId?: string;
  name: string;
  code: string;
  description: string;
  category: 'core_platform' | 'security' | 'integration' | 'support' | 'custom';
  basePrice: number; // in INR
  currency: 'INR' | 'USD';
  taxCode: string; // e.g. 998313
  isActive: boolean;
  variants: ProductVariant[];
  createdAt: string;
}

export interface DiscountRule {
  id: string;
  tenantId?: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number; // e.g. 20 (percent) or 500 (flat INR)
  minPurchaseAmount: number;
  minQuantity: number;
  usageLimit: number;
  currentUsageCount: number;
  startDate: string;
  endDate: string;
  applicablePlanIds: string[];
  applicableProductIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface QuotationItem {
  id: string;
  productId?: string;
  planId?: string;
  variantId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  variantAdjustment: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  tenantId?: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  company: string;
  salesRep: string;
  items: QuotationItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  taxAmount: number; // 18% GST
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  validUntil: string;
  convertedSubscriptionId?: string;
  createdAt: string;
}

export interface TaxConfiguration {
  id: string;
  name: string;
  hsnSacCode: string; // 998313 for IT SaaS
  gstRatePct: number; // 18%
  cgstPct: number;    // 9%
  sgstPct: number;    // 9%
  igstPct: number;    // 18%
  isInterStateDefault: boolean;
}

export type ExceptionCategory =
  | 'subscription'
  | 'product'
  | 'price'
  | 'discount'
  | 'tax'
  | 'duplicate_billing';

export type ExceptionSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ResolutionStatus = 'open' | 'reviewed' | 'resolved' | 'overridden';

export interface BillingException {
  id: string;
  tenantId?: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  billingPeriod: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  title: string;
  description: string;
  expectedValue: string;
  actualValue: string;
  financialImpact: number;
  resolutionStatus: ResolutionStatus;
  overriddenBy?: string;
  overrideReason?: string;
  detectedAt: string;
  resolvedAt?: string;
  remediationAction?: string;
}

export interface SubscriptionValidationDetail {
  subscriptionId: string;
  customerId: string;
  customerName: string;
  planName: string;
  billingInterval: 'monthly' | 'annual';
  status: 'ready' | 'warning' | 'blocked';
  checks: {
    checkName: string;
    category: ExceptionCategory;
    passed: boolean;
    message: string;
    severity?: ExceptionSeverity;
  }[];
  exceptions: BillingException[];
  calculatedInvoice: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  };
}

export interface BillingValidationResult {
  totalChecked: number;
  readyCount: number;
  warningCount: number;
  blockedCount: number;
  totalExposure: number;
  subscriptions: SubscriptionValidationDetail[];
  validatedAt: string;
}

export interface BillingRun {
  id: string;
  tenantId?: string;
  runNumber: string;
  billingDate: string;
  billingPeriod: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partially_completed';
  totalSubscriptions: number;
  readyCount: number;
  warningCount: number;
  blockedCount: number;
  invoicesGeneratedCount: number;
  totalBilledAmount: number;
  duplicateAttemptsBlocked: number;
  initiatedBy: string;
  startedAt: string;
  completedAt?: string;
  exceptionsSummary: Record<ExceptionCategory, number>;
  idempotencyKey: string;
}

export interface PaymentAllocation {
  id: string;
  tenantId?: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  allocatedAt: string;
  reconciliationStatus: 'matched' | 'partially_matched' | 'exception';
  allocatedBy: string;
}

export type LeakageType =
  | 'missing_billing'
  | 'duplicate_billing'
  | 'incorrect_discount'
  | 'tax_mismatch'
  | 'price_mismatch'
  | 'unmatched_payment'
  | 'overdue_invoice';

export interface RevenueLeakageItem {
  id: string;
  tenantId?: string;
  type: LeakageType;
  title: string;
  customerName: string;
  customerId: string;
  subscriptionId?: string;
  invoiceId?: string;
  paymentId?: string;
  financialExposure: number; // Potential loss or unbilled/mismatched money
  recoveredAmount: number;
  severity: ExceptionSeverity;
  detectedAt: string;
  status: 'detected' | 'investigating' | 'resolved';
  rootCause: string;
  details: string;
  actionRequired: string;
}

export interface HealthScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  value: string;
  explanation: string;
  status: 'good' | 'warning' | 'critical';
}

export interface BillingHealthScoreBreakdown {
  overallScore: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  components: {
    validationRate: HealthScoreComponent;
    duplicateBilling: HealthScoreComponent;
    taxAccuracy: HealthScoreComponent;
    reconciliationRate: HealthScoreComponent;
    overdueReceivables: HealthScoreComponent;
  };
  calculatedAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId?: string;
  entityType: 'subscription' | 'invoice' | 'payment' | 'billing_run' | 'exception' | 'discount';
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  auditHash: string; // Cryptographic-style verification stamp
}

export interface FinancialEvidenceTrail {
  invoiceId: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    company: string;
    email: string;
    taxId?: string;
  };
  quotation?: Quotation;
  subscription: {
    id: string;
    planName: string;
    billingInterval: string;
    periodStart: string;
    periodEnd: string;
    status: string;
  };
  productLines: {
    name: string;
    variantName?: string;
    basePrice: number;
    variantAdjustment: number;
    quantity: number;
    lineTotal: number;
  }[];
  billingValidation: {
    status: 'passed' | 'warning' | 'overridden';
    validatedAt: string;
    passedChecksCount: number;
    validatorEngine: string;
  };
  financialMath: {
    subtotal: number;
    discountApplied: number;
    discountCode?: string;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
  };
  payments: {
    paymentId: string;
    transactionId: string;
    gateway: string;
    amount: number;
    status: string;
    timestamp: string;
  }[];
  reconciliation: {
    status: 'matched' | 'partially_matched' | 'unmatched';
    matchedAmount: number;
    outstandingBalance: number;
    reconciledAt?: string;
  };
  auditHistory: AuditEvent[];
}

export interface CalendarDayScheduledItem {
  date: string; // YYYY-MM-DD
  subscriptionsDueCount: number;
  expectedInvoiceAmount: number;
  expectedCollections: number;
  expiringDiscountsCount: number;
  expiringContractsCount: number;
  subscriptions: {
    id: string;
    customerId: string;
    customerName: string;
    company: string;
    planName: string;
    amount: number;
    billingInterval: string;
    churnRisk: string;
  }[];
  discountsExpiring: {
    code: string;
    description: string;
    expiryDate: string;
  }[];
}

