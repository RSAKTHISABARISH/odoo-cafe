// ============================================================
// Café POS — Reports & Analytics (Excel Download)
// ============================================================
import { useMemo, useState } from 'react';
import { useOrderStore, usePaymentStore, useProductStore, useTableStore, useSettingsStore, computeDashboardMetrics } from '../store';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, Clock, BarChart3, Download, Award, Star,
  CalendarDays, MapPin
} from 'lucide-react';

type DateRange = 'today' | 'week' | 'month' | 'all';

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function MiniBar({ value, max, color = 'bg-primary-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 bg-surface-50 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ title, value, sub, icon, trend, color = 'amber' }: {
  title: string; value: string; sub?: string;
  icon: React.ReactNode; trend?: number; color?: string;
}) {
  const colorMap: Record<string, string> = {
    amber:   'text-primary-600 bg-primary-500/10 border-primary-500/20',
    indigo:  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-accent-600 bg-accent-500/10 border-accent-500/20',
    cyan:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };
  
  return (
    <div className="bg-white border border-surface-300 hover:border-surface-300 rounded-2xl p-5 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-surface-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-surface-900 mt-2 font-mono tracking-tight">{value}</p>
          {sub && <p className="text-surface-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-4 text-xs font-semibold ${trend >= 0 ? 'text-accent-600' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}% vs previous
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { orders } = useOrderStore();
  const { payments } = usePaymentStore();
  const { products } = useProductStore();
  const { tables } = useTableStore();
  const { settings } = useSettingsStore();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const sym = settings.currencySymbol;

  const metrics = useMemo(() => computeDashboardMetrics(orders, payments, tables, products), [orders, payments, tables, products]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cutoffs: Record<DateRange, Date> = {
      today: new Date(now.toDateString()),
      week:  new Date(now.getTime() - 7 * 86400000),
      month: new Date(now.getTime() - 30 * 86400000),
      all:   new Date(0),
    };
    return orders.filter(o => o.status === 'paid' && new Date(o.createdAt) >= cutoffs[dateRange]);
  }, [orders, dateRange]);

  const revenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = filteredOrders.length;
  const avgOrder = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
  const uniqueCustomers = new Set(filteredOrders.filter(o => o.customerId).map(o => o.customerId)).size;

  // Payment breakdown
  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const p = payments.find(pmt => pmt.orderId === o.id);
      if (p) { methods[p.method] = (methods[p.method] || 0) + p.amount; }
    });
    return Object.entries(methods).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders, payments]);

  const paymentMax = Math.max(...paymentBreakdown.map(([, v]) => v), 1);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.lines.forEach(l => {
        if (!map[l.productId]) map[l.productId] = { name: l.productName, count: 0, revenue: 0 };
        map[l.productId].count += l.quantity;
        map[l.productId].revenue += l.total;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);
  const topMax = Math.max(...topProducts.map(p => p.revenue), 1);

  // Download Excel/CSV
  const handleDownload = () => {
    // 1. Headers
    const headers = ['Order ID', 'Date', 'Time', 'Customer', 'Table', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method'];
    
    // 2. Rows
    const rows = filteredOrders.map(o => {
      const d = new Date(o.createdAt);
      const pmt = payments.find(p => p.orderId === o.id);
      return [
        o.orderNumber,
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        o.customerName || 'Walk-in',
        o.tableName,
        o.subtotal.toFixed(2),
        o.tax.toFixed(2),
        o.discount.toFixed(2),
        o.total.toFixed(2),
        pmt ? pmt.method : 'Unknown'
      ].map(field => `"${field}"`).join(','); // quote to handle commas
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // 3. Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CafeFlow_Report_${dateRange}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PAYMENT_ICONS: Record<string, string> = { cash: '💵', card: '💳', upi: '📱', wallet: '👛' };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> Analytics & Reports
          </h1>
          <p className="text-surface-500 text-sm mt-0.5">Business performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-surface-300">
            {(['today', 'week', 'month', 'all'] as DateRange[]).map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  dateRange === r ? 'bg-indigo-600 text-surface-900 shadow-lg shadow-indigo-600/20' : 'text-surface-500 hover:text-surface-900 hover:bg-surface-50'
                }`}
              >
                {r === 'all' ? 'All Time' : r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : 'Today'}
              </button>
            ))}
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-accent-500 text-surface-900 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`${sym}${formatINR(revenue)}`} sub={`${orderCount} orders completed`} icon={<DollarSign size={20} />} color="amber" trend={12} />
        <StatCard title="Total Orders" value={String(orderCount)} sub={`Avg Ticket: ${sym}${avgOrder}`} icon={<ShoppingBag size={20} />} color="indigo" trend={8} />
        <StatCard title="Dine-in Customers" value={String(uniqueCustomers)} sub="Unique registered visits" icon={<Users size={20} />} color="cyan" trend={-2} />
        <StatCard title="Kitchen Speed" value={`${metrics.avgPrepTime}m`} sub="Average prep time" icon={<Clock size={20} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white border border-surface-300 rounded-2xl p-5">
          <h2 className="font-bold text-surface-900 mb-5 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" /> Top Selling Items
          </h2>
          <div className="space-y-4">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${
                      i === 0 ? 'bg-primary-500/20 text-primary-600 border border-primary-500/30' : 
                      i === 1 ? 'bg-surface-200 text-surface-900' : 
                      i === 2 ? 'bg-orange-900/30 text-orange-400 border border-orange-700/30' : 
                      'bg-surface-50 text-surface-500'
                    }`}>{i + 1}</span>
                    <span className="text-surface-700 font-medium truncate max-w-[160px]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-surface-500 text-xs font-mono">{p.count} qty</span>
                    <span className="text-indigo-400 font-bold font-mono">{sym}{formatINR(p.revenue)}</span>
                  </div>
                </div>
                <MiniBar value={p.revenue} max={topMax} color={i === 0 ? 'bg-primary-500' : 'bg-indigo-500'} />
              </div>
            )) : (
              <div className="text-center py-10">
                <p className="text-surface-500 text-sm">No sales data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-surface-300 rounded-2xl p-5">
          <h2 className="font-bold text-surface-900 mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent-600" /> Payment Distribution
          </h2>
          <div className="space-y-5">
            {paymentBreakdown.length > 0 ? paymentBreakdown.map(([method, amount]) => {
              const pct = paymentMax > 0 ? (amount / paymentMax) * 100 : 0;
              const colors = { cash: 'bg-accent-500', card: 'bg-blue-500', upi: 'bg-purple-500', wallet: 'bg-orange-500' };
              return (
                <div key={method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-700 flex items-center gap-2 capitalize font-medium">
                      {PAYMENT_ICONS[method] || '💰'} {method}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-surface-500 text-xs font-mono">{Math.round((amount / revenue) * 100)}%</span>
                      <span className="text-surface-900 font-bold font-mono">{sym}{formatINR(amount)}</span>
                    </div>
                  </div>
                  <MiniBar value={amount} max={paymentMax} color={colors[method as keyof typeof colors] || 'bg-gray-600'} />
                </div>
              );
            }) : (
              <div className="text-center py-10">
                <p className="text-surface-500 text-sm">No payment data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}