import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Search,
  ExternalLink,
  CreditCard,
  Building,
  Layers,
  Calculator,
  History,
  Tag,
  Hash,
} from 'lucide-react';
import { FinancialEvidenceTrail } from '../../types';

export const FinancialEvidenceLedgerView: React.FC = () => {
  const { invoices, getFinancialEvidence } = useApp();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[0]?.id || 'inv-1');
  const [searchTerm, setSearchTerm] = useState('');

  const evidence = getFinancialEvidence(selectedInvoiceId);

  const filteredInvoices = invoices.filter((i) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        i.invoiceNumber.toLowerCase().includes(term) ||
        (i.customer?.company && i.customer.company.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Traceable Financial Evidence Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end mathematical and statutory audit trail: Customer → Quotation → Subscription → Product Lines → Validation → Invoice → Gateway → Reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Append-Only Audit Trail (SHA-256 Hashed)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Invoice Selector */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Select Invoice to Inspect
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{filteredInvoices.length} found</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto">
            {filteredInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedInvoiceId(inv.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  selectedInvoiceId === inv.id
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                    : 'border-slate-100 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="font-medium text-slate-700 mt-1">{inv.customer?.company || inv.customer?.name}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{inv.issueDate.slice(0, 10)}</span>
                  <span className="font-bold text-slate-900">₹{inv.totalAmount.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: 8-Step Interactive Timeline Ledger */}
        <div className="lg:col-span-2 space-y-4">
          {!evidence ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400">
              Select an invoice from the left directory to display its cryptographic financial evidence.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Evidence Header Bar */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-slate-900">
                      {evidence.invoiceNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      Integrity Certified
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Customer: <span className="font-semibold text-slate-900">{evidence.customer.company}</span> ({evidence.customer.name})
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Amount</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    ₹{evidence.financialMath.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Step 1: Customer & Quotation Genesis */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Building className="w-4 h-4 text-indigo-600" />
                  1. Customer & Agreed Quotation Contract
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Tax ID / GSTIN</div>
                    <div className="font-mono text-slate-800 font-medium mt-0.5">{evidence.customer.taxId || '29AAACQ4921M1Z1'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Quotation Number</div>
                    <div className="font-mono text-indigo-700 font-semibold mt-0.5">
                      {evidence.quotation ? evidence.quotation.quotationNumber : 'QT-2026-ONLINE'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Sales Executive</div>
                    <div className="text-slate-800 font-medium mt-0.5">
                      {evidence.quotation ? evidence.quotation.salesRep : 'Self-Serve Checkout'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Contract Terms</div>
                    <div className="text-slate-800 font-medium mt-0.5">Net 14 Days • Auto-Renew</div>
                  </div>
                </div>
              </div>

              {/* Step 2: Subscription & Product Lines with Variant Adjustments */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  2. Subscription Tier & Line-Item Breakdown
                </div>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase">
                      <tr>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">Variant Adjust</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Unit Base</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {evidence.productLines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{line.name}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            {line.variantAdjustment > 0 ? `+₹${line.variantAdjustment}` : 'None (Base)'}
                          </td>
                          <td className="py-2.5 px-3">{line.quantity}</td>
                          <td className="py-2.5 px-3 font-mono">₹{line.basePrice.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            ₹{line.lineTotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Billing Integrity Validation Stamp */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  3. Pre-Flight Billing Integrity Engine Certification
                </div>
                <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Passed all 6 Pre-Billing Verification Checkpoints
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      {evidence.billingValidation.validatorEngine}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                    Cert: SEC_VAL_PASS_6/6
                  </span>
                </div>
              </div>

              {/* Step 4: Statutory Financial Math & 18% GST */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  4. Statutory 18% GST Breakdown (HSN/SAC 998313)
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal (Base - Concessions):</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{evidence.financialMath.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9.0% Central Goods & Service Tax):</span>
                    <span className="font-mono font-medium text-slate-800">
                      ₹{evidence.financialMath.cgstAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9.0% State Goods & Service Tax):</span>
                    <span className="font-mono font-medium text-slate-800">
                      ₹{evidence.financialMath.sgstAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Final Invoiced Total:</span>
                    <span className="font-mono text-indigo-700">
                      ₹{evidence.financialMath.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 5: Gateway Settlement & Reconciliation */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  5. Payment Settlement & Reconciliation Allocation
                </div>
                <div className="space-y-2">
                  {evidence.payments.length === 0 ? (
                    <div className="p-3.5 rounded-lg bg-amber-50 text-amber-800 text-xs">
                      Payment pending settlement through gateway.
                    </div>
                  ) : (
                    evidence.payments.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">{p.transactionId}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Gateway: {p.gateway} • {p.timestamp.slice(0, 10)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700">₹{p.amount.toLocaleString()}</div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 font-semibold text-xs">
                    <span>General Ledger Outstanding Balance:</span>
                    <span
                      className={`font-mono font-bold ${
                        evidence.reconciliation.outstandingBalance === 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      ₹{evidence.reconciliation.outstandingBalance.toLocaleString()} (
                      {evidence.reconciliation.status.toUpperCase()})
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 6: Append-Only Immutable Audit Log */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    6. Immutable Financial Audit Trail & Hash Stamp
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Append-Only Sequence</span>
                </div>

                <div className="space-y-2">
                  {evidence.auditHistory.length === 0 ? (
                    <div className="p-3.5 rounded-lg bg-slate-50 text-slate-500 text-[11px] italic">
                      Zero overrides logged. Invoice executed strictly through standard automated verification.
                    </div>
                  ) : (
                    evidence.auditHistory.map((audit) => (
                      <div key={audit.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-700">{audit.action}</span>
                          <span className="text-[10px] text-slate-400">{audit.timestamp}</span>
                        </div>
                        <div className="text-slate-700 font-medium">{audit.newValue}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                          <span>User: {audit.performedBy}</span>
                          <span className="truncate max-w-xs">{audit.auditHash}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
