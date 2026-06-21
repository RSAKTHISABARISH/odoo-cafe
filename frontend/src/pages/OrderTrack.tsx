// ============================================================
// Velora Café — Order Tracking Page (Public)
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore, useSettingsStore } from '../store';
import { Search, ArrowLeft, CheckCircle2, Clock, ChefHat, PackageCheck, XCircle } from 'lucide-react';
import type { Order } from '../types';

const STATUS_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2, desc: 'Your order has been received.' },
  { key: 'preparing', label: 'Being Prepared', icon: ChefHat, desc: 'Our kitchen is crafting your items.' },
  { key: 'ready', label: 'Ready to Serve', icon: PackageCheck, desc: 'Your order is ready!' },
  { key: 'paid', label: 'Completed', icon: CheckCircle2, desc: 'Order completed. Enjoy!' },
];

function getStepIndex(status: Order['status']) {
  const map: Record<string, number> = {
    pending: 0, confirmed: 0, preparing: 1, ready: 2, paid: 3
  };
  return map[status] ?? -1;
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-emerald-100 text-emerald-700',
    paid: 'bg-primary-100 text-primary-700',
    cancelled: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${colors[status] || 'bg-surface-100 text-surface-600'}`}>
      {status}
    </span>
  );
}

export default function OrderTrack() {
  const navigate = useNavigate();
  const { orders } = useOrderStore();
  const { settings } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState<Order | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    const order = orders.find(o => o.orderNumber.toUpperCase() === q || o.id === q);
    setFound(order || null);
    setSearched(true);
  };

  const stepIndex = found ? getStepIndex(found.status) : -1;

  return (
    <div className="min-h-screen font-sans relative overflow-hidden">
      
      {/* Animated Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center animate-slow-zoom fixed"
          style={{ backgroundImage: 'url(/images/veloura_cafe_bg.png)' }}
        />
        <div className="absolute inset-0 bg-black/60 fixed" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-primary-700/80 backdrop-blur-md text-surface-900 sticky top-0 z-40 shadow-lg border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
            <button onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-xl tracking-wide">{settings.restaurantName}</h1>
              <p className="text-surface-900/60 text-xs">Order Tracker</p>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">

          {/* Search Box */}
          <div className="text-center mb-10">
            <div className="text-5xl mb-4 drop-shadow-lg">🔍</div>
            <h2 className="font-display text-4xl text-surface-900 mb-3 drop-shadow-md">Track Your Order</h2>
            <p className="text-surface-900/80 text-lg">Enter your order number to see its current status.</p>
          </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. ORD-1001"
              className="w-full pl-12 pr-5 py-4 bg-white border-2 border-surface-200 focus:border-primary-500 rounded-2xl text-surface-900 font-semibold text-lg outline-none transition-colors shadow-sm"
              autoFocus
            />
          </div>
          <button type="submit"
            className="px-7 py-4 bg-primary-600 hover:bg-primary-700 text-accent-400 font-bold rounded-2xl transition-colors shadow-md text-sm tracking-widest uppercase">
            Track
          </button>
        </form>

        {/* Result */}
        {searched && !found && (
          <div className="text-center py-14 bg-white rounded-2xl border border-surface-200 shadow-sm">
            <XCircle className="w-14 h-14 text-rose-400 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-surface-700 mb-2">Order Not Found</h3>
            <p className="text-surface-400">No order matches <strong>{query}</strong>. Please double-check your order number.</p>
          </div>
        )}

        {found && found.status !== 'cancelled' && (
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">

            {/* Order Header */}
            <div className="bg-primary-600 text-surface-900 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-surface-900/60 text-xs uppercase tracking-widest mb-1">Order Number</p>
                  <h3 className="font-display text-3xl tracking-wide">{found.orderNumber}</h3>
                </div>
                <StatusBadge status={found.status} />
              </div>
              <div className="mt-4 text-sm text-surface-900/70 flex gap-6">
                <span>🪑 {found.tableName || 'Counter'}</span>
                <span>🕒 {new Date(found.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Progress Steps */}
            {found.status !== 'paid' && (
              <div className="p-6 border-b border-surface-100">
                <h4 className="text-sm font-bold uppercase tracking-widest text-surface-500 mb-6">Order Progress</h4>
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-surface-200">
                    <div
                      className="h-full bg-primary-500 transition-all duration-700"
                      style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                    />
                  </div>
                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, i) => {
                      const StepIcon = step.icon;
                      const done = i <= stepIndex;
                      const active = i === stepIndex;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2 w-20 text-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all ${
                            done
                              ? 'bg-primary-600 border-primary-600 text-surface-900 shadow-lg shadow-primary-500/30'
                              : 'bg-white border-surface-300 text-surface-400'
                          } ${active ? 'scale-110' : ''}`}>
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <p className={`text-xs font-semibold leading-tight ${done ? 'text-primary-700' : 'text-surface-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <Clock className="w-4 h-4 text-primary-600 shrink-0" />
                  <p className="text-sm text-primary-700 font-medium">{STATUS_STEPS[Math.max(0, stepIndex)]?.desc}</p>
                </div>
              </div>
            )}

            {found.status === 'paid' && (
              <div className="p-6 border-b border-surface-100">
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700 font-semibold">Order completed and paid. Thank you for visiting!</p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="p-6 border-b border-surface-100">
              <h4 className="text-sm font-bold uppercase tracking-widest text-surface-500 mb-4">Items Ordered</h4>
              <div className="space-y-3">
                {found.lines.map(line => (
                  <div key={line.id} className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {line.quantity}×
                      </span>
                      <span className="font-medium text-surface-800">{line.productName}</span>
                    </div>
                    <span className="font-bold text-surface-900">
                      {settings.currencySymbol}{line.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-6 bg-surface-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-surface-600">
                  <span>Subtotal</span>
                  <span>{settings.currencySymbol}{found.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-surface-600">
                  <span>Tax ({found.taxRate}%)</span>
                  <span>{settings.currencySymbol}{found.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-display text-xl text-primary-700 pt-3 border-t border-surface-200 mt-2">
                  <span>Total</span>
                  <span>{settings.currencySymbol}{found.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {found && found.status === 'cancelled' && (
          <div className="text-center py-14 bg-white rounded-2xl border border-rose-200 shadow-sm">
            <XCircle className="w-14 h-14 text-rose-400 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-surface-700 mb-2">Order Cancelled</h3>
            <p className="text-surface-400">Order <strong>{found.orderNumber}</strong> has been cancelled.</p>
          </div>
        )}

        {/* Back to home */}
        <div className="text-center mt-8">
          <button onClick={() => navigate('/')}
            className="text-surface-900/70 hover:text-surface-900 font-semibold text-sm transition-colors drop-shadow-sm">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
