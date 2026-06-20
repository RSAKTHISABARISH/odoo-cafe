// ============================================================
// Café Totaram — Orders Management (Café Theme + QR per Order)
// ============================================================
import { useState, useMemo } from 'react';
import { useOrderStore, useSettingsStore } from '../store';
import {
  Search, Clock, CheckCircle, XCircle,
  ChefHat, Utensils, CreditCard, Eye, X, Package, QrCode
} from 'lucide-react';
import type { Order, OrderStatus } from '../types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  draft:      { label: 'Draft',      color: 'text-surface-500',   bg: 'bg-surface-100',    border: 'border-surface-300',   icon: <Package size={14} /> },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600',      bg: 'bg-blue-50',        border: 'border-blue-200',      icon: <CheckCircle size={14} /> },
  preparing:  { label: 'Preparing',  color: 'text-orange-600',    bg: 'bg-orange-50',      border: 'border-orange-200',    icon: <ChefHat size={14} /> },
  ready:      { label: 'Ready',      color: 'text-accent-700',    bg: 'bg-accent-50',      border: 'border-accent-300',    icon: <CheckCircle size={14} /> },
  served:     { label: 'Served',     color: 'text-cyan-700',      bg: 'bg-cyan-50',        border: 'border-cyan-200',      icon: <Utensils size={14} /> },
  paid:       { label: 'Paid',       color: 'text-primary-700',   bg: 'bg-primary-100',    border: 'border-primary-300',   icon: <CreditCard size={14} /> },
  cancelled:  { label: 'Cancelled',  color: 'text-red-600',       bg: 'bg-red-50',         border: 'border-red-200',       icon: <XCircle size={14} /> },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function timeSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

function QRCodeBadge({ orderNumber }: { orderNumber: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setShow(s => !s)}
        title="Show QR Code"
        className="p-1.5 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
      >
        <QrCode size={15} />
      </button>
      {show && (
        <div className="absolute right-0 bottom-8 z-50 bg-white border-2 border-primary-200 rounded-xl shadow-float p-3 animate-scale-in">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(orderNumber)}&bgcolor=ffffff&color=6E4F30&qzone=1`}
            alt={`QR ${orderNumber}`}
            className="w-28 h-28 object-contain"
          />
          <p className="text-center text-xs text-surface-500 mt-1 font-mono">{orderNumber}</p>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const { orders, updateOrderStatus } = useOrderStore();
  const { settings } = useSettingsStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showQR, setShowQR] = useState(false);
  const sym = settings.currencySymbol;

  const filtered = useMemo(() => {
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return orders.filter(o => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      if (dateFilter === 'today' && new Date(o.createdAt).toDateString() !== today) return false;
      if (dateFilter === 'week' && new Date(o.createdAt) < weekAgo) return false;
      if (search) {
        const q = search.toLowerCase();
        return o.orderNumber.toLowerCase().includes(q) ||
          o.tableName.toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [orders, filterStatus, dateFilter, search]);

  const statusCounts = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    return Object.keys(STATUS_CONFIG).reduce((acc, s) => {
      acc[s] = todayOrders.filter(o => o.status === s).length;
      return acc;
    }, {} as Record<string, number>);
  }, [orders]);

  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(o => o.status === 'paid' && new Date(o.paidAt || o.updatedAt).toDateString() === today)
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">☕ Order Management</h1>
          <p className="text-surface-500 text-sm mt-1 italic">Where Comfort Meets Flavor — {filtered.length} orders shown</p>
        </div>
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl p-3 shadow-solid">
          <CreditCard size={18} className="text-primary-600" />
          <div>
            <p className="text-xs text-surface-500">Today's Revenue</p>
            <p className="text-surface-900 font-bold">{sym}{todayRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            filterStatus === 'all' ? 'bg-primary-600 text-white border-primary-600 shadow-solid' : 'bg-white border-surface-300 text-surface-600 hover:text-surface-900 hover:border-primary-300'
          }`}
        >
          All ({orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length})
        </button>
        {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(status => {
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                filterStatus === status ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-solid` : 'bg-white border-surface-300 text-surface-500 hover:text-surface-900 hover:border-surface-400'
              }`}
            >
              {cfg.icon}
              {cfg.label}
              {statusCounts[status] > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{statusCounts[status]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Date Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search order #, table, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-surface-300 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-surface-200 p-1 rounded-xl border border-surface-300">
          {(['today', 'week', 'all'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${dateFilter === d ? 'bg-primary-600 text-white shadow-solid' : 'text-surface-600 hover:text-surface-900'}`}
            >
              {d === 'all' ? 'All Time' : d === 'week' ? 'This Week' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-surface-300 rounded-2xl overflow-hidden shadow-solid">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Order</th>
                <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Table</th>
                <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map(order => {
                const cfg = STATUS_CONFIG[order.status];
                return (
                  <tr key={order.id} className="hover:bg-primary-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-surface-900 font-semibold text-sm font-mono">{order.orderNumber}</p>
                        {order.customerName && <p className="text-surface-400 text-xs">👤 {order.customerName}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-600 text-sm">🪑 {order.tableName}</td>
                    <td className="px-4 py-3 text-surface-600 text-sm">{order.lines.length} items</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-surface-900 font-bold text-sm">{sym}{order.total.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-surface-700 text-xs">{formatTime(order.createdAt)}</p>
                        <p className="text-surface-400 text-xs">{timeSince(order.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <QRCodeBadge orderNumber={order.orderNumber} />
                        <button
                          onClick={() => setSelected(order)}
                          className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-surface-400">
              <Package size={40} className="mx-auto mb-3 opacity-30 text-primary-400" />
              <p className="font-medium text-surface-600">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-surface-300 rounded-2xl w-full max-w-lg shadow-float max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-surface-200 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-surface-900 font-mono">{selected.orderNumber}</h2>
                <p className="text-surface-500 text-sm">{selected.tableName} • {formatDate(selected.createdAt)} {formatTime(selected.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQR(s => !s)}
                  className={`p-2 rounded-xl transition-colors ${showQR ? 'bg-primary-100 text-primary-700' : 'text-surface-400 hover:text-primary-600 hover:bg-primary-50'}`}
                  title="Toggle QR Code"
                >
                  <QrCode size={18} />
                </button>
                <button onClick={() => { setSelected(null); setShowQR(false); }} className="p-2 text-surface-400 hover:text-surface-900 hover:bg-surface-100 rounded-xl transition-colors"><X size={18} /></button>
              </div>
            </div>

            {/* QR Section in modal */}
            {showQR && (
              <div className="p-5 border-b border-surface-200 bg-primary-50 flex items-center gap-5 animate-fade-in">
                <div className="bg-white p-2 rounded-xl border-2 border-primary-200 shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selected.orderNumber)}&bgcolor=ffffff&color=6E4F30&qzone=1`}
                    alt={`QR for ${selected.orderNumber}`}
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div>
                  <p className="text-primary-700 font-semibold text-sm mb-1">📱 Order QR Code</p>
                  <p className="text-surface-600 text-xs leading-relaxed">Customer can scan this QR to track their order status in real-time.</p>
                  <p className="font-mono text-primary-600 font-bold text-sm mt-2">{selected.orderNumber}</p>
                </div>
              </div>
            )}

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].color} ${STATUS_CONFIG[selected.status].border}`}>
                  {STATUS_CONFIG[selected.status].icon}
                  {STATUS_CONFIG[selected.status].label}
                </span>
                {selected.customerName && (
                  <span className="text-surface-500 text-sm">👤 {selected.customerName}</span>
                )}
              </div>

              {/* Order Lines */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Items Ordered</p>
                {selected.lines.map(line => (
                  <div key={line.id} className="flex items-center justify-between py-2 border-b border-surface-100">
                    <div>
                      <p className="text-surface-900 text-sm font-medium">{line.productName}</p>
                      {line.notes && <p className="text-surface-400 text-xs">📝 {line.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-surface-500 text-sm">×{line.quantity}</p>
                      <p className="text-primary-600 font-semibold text-sm">{sym}{line.total}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-surface-500">
                  <span>Subtotal</span><span>{sym}{selected.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-surface-500">
                  <span>Tax ({selected.taxRate}%)</span><span>{sym}{selected.tax}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-sm text-accent-700">
                    <span>Discount {selected.couponCode && `(${selected.couponCode})`}</span>
                    <span>-{sym}{selected.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-surface-900 border-t border-surface-200 pt-2">
                  <span>Total</span><span className="text-primary-600">{sym}{selected.total}</span>
                </div>
              </div>

              {/* Update Status */}
              {!['paid', 'cancelled'].includes(selected.status) && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 mb-2 uppercase tracking-wider">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled'] as OrderStatus[])
                      .filter(s => s !== selected.status)
                      .map(s => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <button
                            key={s}
                            onClick={() => { updateOrderStatus(selected.id, s); setSelected({ ...selected, status: s }); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80 ${cfg.bg} ${cfg.color} ${cfg.border}`}
                          >
                            {cfg.icon}{cfg.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}