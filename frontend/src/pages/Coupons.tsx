// ============================================================
// Café POS — Coupons (Auto Assign Threshold)
// ============================================================
import { useState } from 'react';
import { useCouponStore } from '../store';
import { api } from '../utils/api';
import { Search, Plus, X, Edit2, Trash2, Tag, Percent, Receipt, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import type { Coupon } from '../types';

export default function Coupons() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useCouponStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [modalMode, setModalMode] = useState<'add'|'edit'|'delete'>('add');

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Partial<Coupon> = {
      code: (fd.get('code') as string).toUpperCase(),
      type: fd.get('type') as 'percentage' | 'fixed',
      value: Number(fd.get('value')),
      minOrderAmount: Number(fd.get('minOrderAmount')) || 0,
      maxDiscount: fd.get('maxDiscount') ? Number(fd.get('maxDiscount')) : undefined,
      validFrom: fd.get('validFrom') as string,
      validUntil: fd.get('validUntil') as string,
      usageLimit: Number(fd.get('usageLimit')) || 100,
      active: fd.get('active') === 'on',
      description: fd.get('description') as string,
      autoAssignThreshold: fd.get('autoAssignThreshold') ? Number(fd.get('autoAssignThreshold')) : undefined,
    };

    if (modalMode === 'edit' && selected) {
      try { await api.updateCoupon(selected.id, data); } catch {}
      updateCoupon(selected.id, data);
    } else {
      const newCoupon = { ...data, id: 'coupon-' + Date.now(), usageCount: 0 } as Coupon;
      try { await api.createCoupon(newCoupon); } catch {}
      addCoupon(newCoupon);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (selected) {
      try { await api.deleteCoupon(selected.id); } catch {}
      deleteCoupon(selected.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-600" /> Coupons & Offers
          </h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage discounts and auto-assign rules</p>
        </div>
        <button 
          onClick={() => { setSelected(null); setModalMode('add'); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input 
          type="text" placeholder="Search coupon code or description..." 
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-300 rounded-xl text-surface-900 placeholder-gray-600 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map(coupon => {
          const isExpired = new Date() > new Date(coupon.validUntil);
          const isExhausted = coupon.usageCount >= coupon.usageLimit;
          const status = !coupon.active ? 'Inactive' : (isExpired ? 'Expired' : (isExhausted ? 'Exhausted' : 'Active'));
          
          return (
            <div key={coupon.id} className={`bg-white border ${coupon.active && !isExpired && !isExhausted ? 'border-primary-500/30' : 'border-surface-300'} rounded-2xl p-5 relative overflow-hidden group`}>
              {coupon.autoAssignThreshold && (
                <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1">
                  Auto-Assign ≥ ₹{coupon.autoAssignThreshold}
                </div>
              )}
              <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                  <h3 className="text-xl font-bold text-surface-900 font-mono tracking-wider">{coupon.code}</h3>
                  <p className="text-surface-500 text-xs mt-1">{coupon.description}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${coupon.type === 'percentage' ? 'bg-purple-900/30 text-purple-400' : 'bg-emerald-900/30 text-accent-600'}`}>
                  {coupon.type === 'percentage' ? <Percent className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-50 rounded-xl p-3">
                  <p className="text-surface-500 text-[10px] uppercase font-bold tracking-wider mb-1">Value</p>
                  <p className="text-surface-900 text-sm font-semibold">{coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3">
                  <p className="text-surface-500 text-[10px] uppercase font-bold tracking-wider mb-1">Usage</p>
                  <p className="text-surface-900 text-sm font-semibold">{coupon.usageCount} / {coupon.usageLimit}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-surface-300">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                  status === 'Active' ? 'bg-emerald-900/30 text-accent-600' : 'bg-surface-50 text-surface-500'
                }`}>
                  {status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => { setSelected(coupon); setModalMode('edit'); setIsModalOpen(true); }} className="p-2 bg-surface-50 hover:bg-surface-200 text-surface-600 hover:text-surface-900 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setSelected(coupon); setModalMode('delete'); setIsModalOpen(true); }} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && modalMode !== 'delete' && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-surface-300 rounded-2xl w-full max-w-xl shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-surface-300 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-surface-900">{modalMode === 'edit' ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-surface-500 hover:text-surface-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Coupon Code *</label>
                  <input name="code" required defaultValue={selected?.code} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 font-mono uppercase focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Description</label>
                  <input name="description" defaultValue={selected?.description} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Discount Type *</label>
                  <select name="type" defaultValue={selected?.type || 'percentage'} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Discount Value *</label>
                  <input name="value" type="number" step="0.01" required defaultValue={selected?.value} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Min Order Amount (₹)</label>
                  <input name="minOrderAmount" type="number" defaultValue={selected?.minOrderAmount || 0} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Max Discount (₹) [Optional]</label>
                  <input name="maxDiscount" type="number" defaultValue={selected?.maxDiscount} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block flex items-center gap-1">
                    Auto-Assign Threshold (₹) <AlertCircle className="w-3 h-3 text-primary-600" title="Automatically award this coupon to customers when their order exceeds this amount" />
                  </label>
                  <input name="autoAssignThreshold" type="number" defaultValue={selected?.autoAssignThreshold} placeholder="Leave blank to disable" className="w-full px-3 py-2.5 bg-surface-50 border border-primary-500/30 rounded-xl text-surface-900 focus:border-primary-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Usage Limit *</label>
                  <input name="usageLimit" type="number" required defaultValue={selected?.usageLimit || 100} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Valid From *</label>
                  <input name="validFrom" type="datetime-local" required defaultValue={selected?.validFrom ? selected.validFrom.slice(0,16) : ''} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 font-semibold mb-1 block">Valid Until *</label>
                  <input name="validUntil" type="datetime-local" required defaultValue={selected?.validUntil ? selected.validUntil.slice(0,16) : ''} className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 focus:border-primary-500 [color-scheme:dark]" />
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-surface-50 p-4 rounded-xl mt-2">
                  <input name="active" type="checkbox" id="coupon_active" defaultChecked={selected ? selected.active : true} className="w-4 h-4 accent-primary-500" />
                  <label htmlFor="coupon_active" className="text-sm font-semibold text-surface-900">Coupon is active and ready to use</label>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-surface-300">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-surface-50 text-surface-900 rounded-xl font-semibold hover:bg-surface-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && modalMode === 'delete' && selected && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-red-900/50 rounded-2xl p-6 w-full max-w-sm text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-bold text-surface-900 mb-2">Delete Coupon?</h3>
            <p className="text-surface-500 text-sm mb-6">Are you sure you want to delete <strong className="text-surface-900">{selected.code}</strong>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-surface-50 text-surface-900 rounded-xl font-semibold hover:bg-surface-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-surface-900 rounded-xl font-bold hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}