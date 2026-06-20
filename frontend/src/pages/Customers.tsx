// ============================================================
// CaféFlow POS — Customers Management
// ============================================================
import { useState } from 'react';
import { useCustomerStore, useOrderStore, useSettingsStore } from '../store';
import { Search, UserPlus, Phone, Mail, Award, X, Edit2, Trash2, Star, TrendingUp, Users } from 'lucide-react';
import type { Customer } from '../types';

const TIER_CONFIG = {
  platinum: { color: 'from-slate-400 to-slate-600', badge: 'bg-slate-700 text-slate-200 border-slate-500', label: 'Platinum', stars: 4 },
  gold:     { color: 'from-yellow-400 to-primary-600',  badge: 'bg-yellow-900/40 text-yellow-400 border-yellow-600', label: 'Gold', stars: 3 },
  silver:   { color: 'from-gray-300 to-gray-500',     badge: 'bg-surface-50 text-gray-300 border-gray-600', label: 'Silver', stars: 2 },
  bronze:   { color: 'from-orange-400 to-orange-700', badge: 'bg-orange-900/30 text-orange-400 border-orange-600', label: 'Bronze', stars: 1 },
};

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore();
  const { orders } = useOrderStore();
  const { settings } = useSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const sym = settings.currencySymbol;

  const filteredCustomers = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTier = filterTier === 'all' || c.loyaltyTier === filterTier;
    return matchSearch && matchTier;
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
    };
    if (editMode && selectedCustomer) {
      updateCustomer(selectedCustomer.id, data);
      setSelectedCustomer({ ...selectedCustomer, ...data });
      setEditMode(false);
    } else {
      const newCust: Customer = {
        ...data,
        id: 'cust-' + Date.now(),
        totalVisits: 0,
        totalSpent: 0,
        loyaltyTier: 'bronze',
        createdAt: new Date().toISOString(),
      };
      addCustomer(newCust);
      setIsAdding(false);
    }
  };

  const customerOrders = selectedCustomer
    ? orders.filter(o => o.customerId === selectedCustomer.id && o.status === 'paid').slice(0, 5)
    : [];

  const totals = {
    platinum: customers.filter(c => c.loyaltyTier === 'platinum').length,
    gold: customers.filter(c => c.loyaltyTier === 'gold').length,
    silver: customers.filter(c => c.loyaltyTier === 'silver').length,
    bronze: customers.filter(c => c.loyaltyTier === 'bronze').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Customer Management</h1>
          <p className="text-slate-400 text-sm mt-1">{customers.length} registered customers</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setSelectedCustomer(null); setEditMode(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      {/* Tier Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(TIER_CONFIG) as Array<keyof typeof TIER_CONFIG>).map(tier => (
          <button
            key={tier}
            onClick={() => setFilterTier(filterTier === tier ? 'all' : tier)}
            className={`p-4 rounded-2xl border transition-all text-left ${
              filterTier === tier
                ? 'bg-indigo-600/20 border-indigo-500'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {Array.from({ length: TIER_CONFIG[tier].stars }).map((_, i) => (
                <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-bold text-surface-900">{totals[tier]}</p>
            <p className="text-xs text-slate-400 capitalize mt-0.5">{tier}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-surface-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredCustomers.map(customer => {
          const tier = TIER_CONFIG[customer.loyaltyTier];
          return (
            <div
              key={customer.id}
              onClick={() => { setSelectedCustomer(customer); setEditMode(false); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all hover:border-indigo-500/50 ${
                selectedCustomer?.id === customer.id
                  ? 'bg-indigo-900/20 border-indigo-500'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-surface-900 font-bold text-lg flex-shrink-0`}>
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-surface-900 truncate">{customer.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${tier.badge} capitalize`}>
                      {customer.loyaltyTier}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
                    <Phone size={11} />{customer.phone}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-surface-900 font-bold text-sm">{sym}{customer.totalSpent.toLocaleString()}</p>
                  <p className="text-slate-500 text-xs">{customer.totalVisits} visits</p>
                </div>
              </div>
            </div>
          );
        })}
        {filteredCustomers.length === 0 && (
          <div className="col-span-2 text-center py-20 text-slate-500">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No customers found</p>
          </div>
        )}
      </div>

      {/* Customer Detail Panel */}
      {selectedCustomer && !isAdding && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-surface-900">Customer Profile</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditMode(!editMode)} className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => setDeleteConfirm(selectedCustomer.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-surface-900 transition-colors"><X size={18} /></button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {editMode ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                    <input name="name" defaultValue={selectedCustomer.name} required className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                    <input name="phone" defaultValue={selectedCustomer.phone} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Email</label>
                    <input name="email" type="email" defaultValue={selectedCustomer.email} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditMode(false)} className="flex-1 py-2 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl transition-colors">Save</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${TIER_CONFIG[selectedCustomer.loyaltyTier].color} flex items-center justify-center text-surface-900 font-bold text-2xl`}>
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-surface-900">{selectedCustomer.name}</h3>
                      <span className={`px-2.5 py-1 text-xs rounded-full border ${TIER_CONFIG[selectedCustomer.loyaltyTier].badge} capitalize`}>
                        {selectedCustomer.loyaltyTier} Member
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">Total Spent</p>
                      <p className="text-surface-900 font-bold text-lg">{sym}{selectedCustomer.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">Total Visits</p>
                      <p className="text-surface-900 font-bold text-lg">{selectedCustomer.totalVisits}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Phone size={14} className="text-slate-500" />{selectedCustomer.phone}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Mail size={14} className="text-slate-500" />{selectedCustomer.email}
                    </div>
                  </div>
                  {customerOrders.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">Recent Orders</p>
                      <div className="space-y-2">
                        {customerOrders.map(o => (
                          <div key={o.id} className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg px-3 py-2">
                            <span className="text-slate-300">{o.orderNumber} • {o.tableName}</span>
                            <span className="text-indigo-400 font-medium">{sym}{o.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-surface-900">Add Customer</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-surface-900 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                <input name="name" required className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone *</label>
                <input name="phone" required className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input name="email" type="email" className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl transition-colors">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/50 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto"><Trash2 size={24} className="text-red-400" /></div>
            <div>
              <h3 className="text-lg font-semibold text-surface-900">Delete Customer?</h3>
              <p className="text-slate-400 text-sm mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => { deleteCustomer(deleteConfirm); setDeleteConfirm(null); setSelectedCustomer(null); }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-surface-900 rounded-xl transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}