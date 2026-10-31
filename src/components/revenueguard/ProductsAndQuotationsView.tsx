import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Plus,
  Tag,
  FileText,
  CheckCircle2,
  Percent,
  Layers,
  ArrowRight,
  Sparkles,
  Building,
  User,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Product, DiscountRule, Quotation } from '../../types';

export const ProductsAndQuotationsView: React.FC = () => {
  const {
    products,
    discounts,
    quotations,
    createProduct,
    addProductVariant,
    createDiscount,
    createQuotation,
    confirmQuotation,
    customers,
    plans,
    showToast,
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'products' | 'discounts' | 'quotations'>('products');

  // Product modal
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('core_platform');
  const [newProdPrice, setNewProdPrice] = useState<number>(799);
  const [newProdDesc, setNewProdDesc] = useState('');

  // Variant modal
  const [selectedProdForVariant, setSelectedProdForVariant] = useState<Product | null>(null);
  const [variantName, setVariantName] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantAdjustment, setVariantAdjustment] = useState<number>(300);

  // Discount modal
  const [isDiscModalOpen, setIsDiscModalOpen] = useState(false);
  const [discCode, setDiscCode] = useState('');
  const [discDesc, setDiscDesc] = useState('');
  const [discType, setDiscType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discVal, setDiscVal] = useState<number>(20);
  const [discMin, setDiscMin] = useState<number>(500);

  // Quotation modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteCustId, setQuoteCustId] = useState<string>(customers[0]?.id || '');
  const [quotePlanId, setQuotePlanId] = useState<string>(plans[0]?.id || '');
  const [quoteDiscountCode, setQuoteDiscountCode] = useState('');

  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdCode) return;
    createProduct({
      name: newProdName,
      code: newProdCode,
      category: newProdCategory,
      basePrice: newProdPrice,
      currency: 'INR',
      taxCode: '998313',
      isActive: true,
      description: newProdDesc || 'Enterprise SaaS capability pack',
      variants: [],
    });
    setIsProdModalOpen(false);
    setNewProdName('');
    setNewProdCode('');
  };

  const handleCreateNewVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdForVariant || !variantName || !variantSku) return;
    addProductVariant(selectedProdForVariant.id, {
      name: variantName,
      sku: variantSku,
      priceAdjustment: variantAdjustment,
      billingType: 'flat',
      isActive: true,
    });
    setSelectedProdForVariant(null);
    setVariantName('');
    setVariantSku('');
  };

  const handleCreateNewDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discCode) return;
    createDiscount({
      code: discCode.toUpperCase(),
      description: discDesc,
      discountType: discType,
      value: discVal,
      minPurchaseAmount: discMin,
      minQuantity: 1,
      usageLimit: 50,
      startDate: new Date().toISOString(),
      endDate: '2026-12-31T23:59:59Z',
      applicablePlanIds: [],
      applicableProductIds: [],
      isActive: true,
    });
    setIsDiscModalOpen(false);
    setDiscCode('');
    setDiscDesc('');
  };

  const handleCreateNewQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === quoteCustId) || customers[0];
    const plan = plans.find((p) => p.id === quotePlanId) || plans[0];
    if (!cust || !plan) return;

    const baseAmount = plan.annualPrice;
    let discAmt = 0;
    if (quoteDiscountCode) {
      discAmt = Math.round(baseAmount * 0.2); // 20%
    }
    const taxable = baseAmount - discAmt;
    const tax = Math.round(taxable * 0.18);
    const total = taxable + tax;

    createQuotation({
      customerId: cust.id,
      customerName: cust.name,
      company: cust.company,
      salesRep: 'Alexander Vance',
      items: [
        {
          id: `item-${Date.now()}`,
          planId: plan.id,
          description: `${plan.name} (Annual Tier)`,
          quantity: 1,
          unitPrice: baseAmount,
          variantAdjustment: 0,
          subtotal: baseAmount,
        },
      ],
      subtotal: baseAmount,
      discountCode: quoteDiscountCode || undefined,
      discountAmount: discAmt,
      taxAmount: tax,
      totalAmount: total,
      status: 'sent',
      validUntil: '2026-12-31T23:59:59Z',
    });
    setIsQuoteModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Products, Variants, Discounts & Quotations
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete pricing catalog, variant modifiers, promotional rules, and commercial quotation lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTabSub === 'products' && (
            <button
              onClick={() => setIsProdModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          )}
          {activeTabSub === 'discounts' && (
            <button
              onClick={() => setIsDiscModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Discount Rule
            </button>
          )}
          {activeTabSub === 'quotations' && (
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue Quotation
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTabSub('products')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTabSub === 'products'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Product Catalog & Variants ({products.length})
        </button>
        <button
          onClick={() => setActiveTabSub('discounts')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTabSub === 'discounts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Promotional Discount Rules ({discounts.length})
        </button>
        <button
          onClick={() => setActiveTabSub('quotations')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTabSub === 'quotations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Commercial Quotations ({quotations.length})
        </button>
      </div>

      {/* 1. PRODUCTS & VARIANTS TAB */}
      {activeTabSub === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {prod.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    HSN {prod.taxCode}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-2">{prod.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{prod.description}</p>
                <div className="text-base font-extrabold text-slate-900 mt-2">
                  ₹{prod.basePrice.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ base unit</span>
                </div>

                {/* Variants List */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Configured Variants ({prod.variants?.length || 0})</span>
                  </div>
                  <div className="space-y-1.5">
                    {(prod.variants || []).map((v) => (
                      <div key={v.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{v.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">SKU: {v.sku}</div>
                        </div>
                        <div className="font-bold text-indigo-700">
                          {v.priceAdjustment > 0 ? `+₹${v.priceAdjustment}` : 'Base Price'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedProdForVariant(prod)}
                  className="w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200"
                >
                  + Configure New Variant
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. DISCOUNTS TAB */}
      {activeTabSub === 'discounts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {discounts.map((disc) => (
            <div key={disc.id} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span className="font-mono text-base font-extrabold text-slate-900">{disc.code}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    disc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {disc.isActive ? 'Active' : 'Expired'}
                </span>
              </div>

              <p className="text-xs text-slate-600">{disc.description}</p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Discount Concession:</span>
                  <span className="font-bold text-slate-900">
                    {disc.value}{disc.discountType === 'percentage' ? '%' : '₹'} Off
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Purchase:</span>
                  <span className="font-medium text-slate-800">₹{disc.minPurchaseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Redemption Quota:</span>
                  <span className="font-medium text-slate-800">
                    {disc.currentUsageCount} / {disc.usageLimit} uses
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid Until:</span>
                  <span className="font-medium text-slate-800">{disc.endDate.slice(0, 10)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. QUOTATIONS TAB */}
      {activeTabSub === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer & Account</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">18% GST</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{q.quotationNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{q.company}</div>
                      <div className="text-[10px] text-slate-400">{q.customerName}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">₹{q.subtotal.toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium text-emerald-700">
                      {q.discountAmount > 0 ? `-₹${q.discountAmount.toLocaleString()} (${q.discountCode})` : 'None'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">₹{q.taxAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{q.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          q.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.status === 'accepted'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {q.status !== 'converted' ? (
                        <button
                          onClick={() => confirmQuotation(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-xs"
                        >
                          Customer Confirm & Activate
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sub Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <form onSubmit={handleCreateNewProduct} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create New Catalog Product</h3>
              <button type="button" onClick={() => setIsProdModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Revenue Guard Enterprise"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REV-GUARD-ENT"
                  value={newProdCode}
                  onChange={(e) => setNewProdCode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Base Price (INR):</label>
                <input
                  type="number"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button type="button" onClick={() => setIsProdModalOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold">Publish Product</button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE VARIANT MODAL */}
      {selectedProdForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <form onSubmit={handleCreateNewVariant} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Variant for {selectedProdForVariant.name}</h3>
              <button type="button" onClick={() => setSelectedProdForVariant(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Variant Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Multi-Tenant HA Cluster"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Variant SKU:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REV-HA-CLUSTER"
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Price Adjustment (+₹):</label>
                <input
                  type="number"
                  required
                  value={variantAdjustment}
                  onChange={(e) => setVariantAdjustment(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedProdForVariant(null)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold">Save Variant</button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE DISCOUNT MODAL */}
      {isDiscModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <form onSubmit={handleCreateNewDiscount} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create Promotional Discount Rule</h3>
              <button type="button" onClick={() => setIsDiscModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ASSURANCE25"
                  value={discCode}
                  onChange={(e) => setDiscCode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 uppercase font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type:</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Value:</label>
                  <input
                    type="number"
                    required
                    value={discVal}
                    onChange={(e) => setDiscVal(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Purchase Amount (INR):</label>
                <input
                  type="number"
                  value={discMin}
                  onChange={(e) => setDiscMin(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description:</label>
                <input
                  type="text"
                  placeholder="e.g. 25% executive incentive for annual RevenueGuard deployment"
                  value={discDesc}
                  onChange={(e) => setDiscDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button type="button" onClick={() => setIsDiscModalOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold">Activate Discount</button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE QUOTATION MODAL */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <form onSubmit={handleCreateNewQuotation} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Issue New Sales Quotation</h3>
              <button type="button" onClick={() => setIsQuoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Account:</label>
                <select
                  value={quoteCustId}
                  onChange={(e) => setQuoteCustId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Subscription Plan:</label>
                <select
                  value={quotePlanId}
                  onChange={(e) => setQuotePlanId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.annualPrice.toLocaleString()} / year
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attach Discount Voucher (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. ASSURANCE25"
                  value={quoteDiscountCode}
                  onChange={(e) => setQuoteDiscountCode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 uppercase font-mono"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button type="button" onClick={() => setIsQuoteModalOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold">Generate Quotation</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
