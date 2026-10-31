import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { Modal } from '../common/Modal';
import {
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';

interface CustomerListProps {
  onAssignSubscription?: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onAssignSubscription }) => {
  const { customers, deleteCustomer, createCustomer, updateCustomer, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Filtered list
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (cust: Customer) => {
    setEditingCustomer(cust);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
    } else {
      createCustomer(data);
    }
    setEditingCustomer(null);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Customer Accounts & Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage enterprise entities, subscription status, GST billing profiles, and retention risk.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Customer
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
            placeholder="Search by name, company, email, phone..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs w-full sm:w-auto overflow-x-auto">
            {(['all', 'active', 'inactive', 'suspended'] as const).map((st) => (
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
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Customer & Entity</th>
                <th className="px-5 py-3.5">Contact & Tax ID</th>
                <th className="px-5 py-3.5">Active Plan</th>
                <th className="px-5 py-3.5">MRR</th>
                <th className="px-5 py-3.5">Health & Churn</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                            {c.company.charAt(0) || c.name.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                            >
                              {c.name}
                            </button>
                            <div className="text-[11px] text-slate-500">{c.company}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-slate-700">{c.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {c.taxId ? c.taxId : c.phone}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {c.currentPlanName && c.currentPlanName !== 'No active plan' ? (
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {c.currentPlanName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No Active Plan</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{c.mrr ? c.mrr.toLocaleString() : '0'}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs ${
                              (c.healthScore || 80) >= 80
                                ? 'text-emerald-600'
                                : (c.healthScore || 80) >= 50
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {c.healthScore || 80}/100
                          </span>

                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                              c.churnRisk === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : c.churnRisk === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {c.churnRisk || 'low'}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : c.status === 'suspended'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              c.status === 'active'
                                ? 'bg-emerald-500'
                                : c.status === 'suspended'
                                ? 'bg-rose-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {c.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            title="View Customer 360"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(c)}
                            title="Edit customer details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCustomerToDelete(c)}
                            title="Delete customer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCustomer}
      />

      {/* Customer 360 Detail Drawer */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onEdit={(cust) => {
          setSelectedCustomer(null);
          handleEditClick(cust);
        }}
        onManageSubscription={(cust) => {
          setSelectedCustomer(null);
          if (onAssignSubscription) {
            onAssignSubscription(cust);
          } else {
            setActiveTab('subscriptions');
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        title="Confirm Customer Deletion"
        description="Are you sure you want to permanently delete this customer account?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              Deleting <strong>{customerToDelete?.name}</strong> ({customerToDelete?.company}) will immediately cancel
              any active subscriptions and archive their billing history.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setCustomerToDelete(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
