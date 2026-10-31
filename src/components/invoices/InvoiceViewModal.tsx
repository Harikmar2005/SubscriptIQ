import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Invoice } from '../../types';
import { Download, Printer, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.status === 'paid';
  const isFailed = invoice.status === 'failed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice ${invoice.invoiceNumber}`}
      description="Official GST-compliant recurring subscription tax invoice and payment receipt."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Printable Paper Canvas */}
        <div
          ref={printRef}
          className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-xs text-slate-800"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  S
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  SubFlow Enterprise
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <div>SubFlow Cloud Technologies India Pvt Ltd</div>
                <div>Tower 3, Global Cyber Tech Park, Sector 48</div>
                <div>Gurugram, Haryana - 122001, India</div>
                <div className="font-mono text-slate-700">GSTIN: 06AAACS9281N1ZG</div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Tax Invoice
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {invoice.invoiceNumber}
              </div>

              {/* Status Badge */}
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isFailed
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isPaid && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                  {isFailed && <XCircle className="w-3.5 h-3.5 mr-1" />}
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Bill-To & Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Billed To:
              </div>
              <div className="font-bold text-slate-900 text-sm">{invoice.customer?.company || invoice.customer?.name}</div>
              <div className="text-slate-600 mt-0.5">Attn: {invoice.customer?.name}</div>
              <div className="text-slate-500">{invoice.customer?.email}</div>
              <div className="text-slate-500">{invoice.customer?.address}</div>
              <div className="font-mono text-slate-800 mt-1 font-semibold">
                GSTIN: {invoice.customer?.taxId || 'UNREGISTERED'}
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              <div className="flex sm:justify-end gap-3">
                <span className="text-slate-400 font-medium">Invoice Date:</span>
                <span className="font-bold text-slate-800">
                  {new Date(invoice.issueDate).toLocaleDateString([], { dateStyle: 'medium' })}
                </span>
              </div>
              <div className="flex sm:justify-end gap-3">
                <span className="text-slate-400 font-medium">Due Date:</span>
                <span className="font-bold text-slate-800">
                  {new Date(invoice.dueDate).toLocaleDateString([], { dateStyle: 'medium' })}
                </span>
              </div>
              <div className="flex sm:justify-end gap-3">
                <span className="text-slate-400 font-medium">Billing Period:</span>
                <span className="text-slate-700">
                  {new Date(invoice.billingPeriodStart).toLocaleDateString()} &rarr;{' '}
                  {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              {invoice.paymentId && (
                <div className="flex sm:justify-end gap-3 text-[11px] font-mono text-slate-500">
                  <span>Payment Ref:</span>
                  <span className="text-indigo-600 font-semibold">{invoice.paymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6 border-b border-slate-200">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100 pb-2">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="py-2.5">
                    <td className="py-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">₹{item.unitPrice.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-slate-900">₹{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Calculation Breakdown */}
          <div className="pt-4 flex justify-end text-xs">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net Amount):</span>
                <span className="font-medium text-slate-800">₹{invoice.subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Integrated GST (IGST @ 18%):</span>
                <span className="font-medium text-slate-800">₹{invoice.taxAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total (INR):</span>
                <span className="text-indigo-600">₹{invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <div>This is a computer-generated tax invoice. No signature required.</div>
            <div className="font-mono">SubFlow Enterprise Billing Engine v2.4</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Format: Electronic Tax Invoice with GSTIN</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
