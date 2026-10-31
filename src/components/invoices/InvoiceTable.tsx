import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { InvoiceViewModal } from './InvoiceViewModal';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Calendar,
} from 'lucide-react';

interface InvoiceTableProps {
  selectedInvoiceId?: string | null;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ selectedInvoiceId }) => {
  const { invoices } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(
    selectedInvoiceId ? invoices.find((i) => i.id === selectedInvoiceId) || null : null
  );

  React.useEffect(() => {
    if (selectedInvoiceId) {
      const match = invoices.find((i) => i.id === selectedInvoiceId);
      if (match) setActiveInvoice(match);
    }
  }, [selectedInvoiceId, invoices]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.customer?.company && inv.customer.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.planName && inv.planName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Invoice Number', 'Customer', 'Company', 'Plan', 'Subtotal', 'Tax (18% GST)', 'Total Amount', 'Status', 'Issue Date'];
    const rows = filteredInvoices.map((i) => [
      i.invoiceNumber,
      `"${i.customer?.name || ''}"`,
      `"${i.customer?.company || ''}"`,
      `"${i.planName || ''}"`,
      i.subtotal,
      i.taxAmount,
      i.totalAmount,
      i.status,
      new Date(i.issueDate).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subscriptiq_invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Invoice Management & Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated tax invoice generation, 18% GST calculation, customer receipts, and PDF download.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export CSV Ledger
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, customer, company..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs w-full md:w-auto overflow-x-auto">
          {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium capitalize whitespace-nowrap transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Invoice Number</th>
                <th className="px-5 py-3.5">Billed Entity & GSTIN</th>
                <th className="px-5 py-3.5">Plan Description</th>
                <th className="px-5 py-3.5">Subtotal</th>
                <th className="px-5 py-3.5">GST (18%)</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Invoice Status</th>
                <th className="px-5 py-3.5">Issue Date</th>
                <th className="px-5 py-3.5 text-right">View / PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isFailed = inv.status === 'failed';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setActiveInvoice(inv)}
                          className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {inv.invoiceNumber}
                        </button>
                        <div className="text-[10px] text-slate-400">ID: {inv.id}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {inv.customer?.company || inv.customer?.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.customer?.taxId || 'GSTIN Pending'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {inv.planName || 'SaaS Tier'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        ₹{inv.subtotal.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        ₹{inv.taxAmount.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{inv.totalAmount.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : isFailed ? (
                            <XCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        {new Date(inv.issueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setActiveInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Open PDF Tax Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceViewModal
        invoice={activeInvoice}
        isOpen={!!activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />
    </div>
  );
};
