// ============================================================
// Café Totaram — Dashboard (Red & Orange Theme)
// ============================================================
import { useOrderStore, useProductStore, useTableStore, useSettingsStore, useEmployeeStore } from '../store';
import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, ShoppingCart, IndianRupee, Clock, ArrowUpRight, Flame } from 'lucide-react';

export default function Dashboard() {
  const { orders } = useOrderStore();
  const { tables } = useTableStore();
  const { products } = useProductStore();
  const { settings } = useSettingsStore();
  const { employees } = useEmployeeStore();

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status === 'paid');

    const revenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
    const customers = new Set(todaysOrders.filter(o => o.customerId).map(o => o.customerId)).size
      + todaysOrders.filter(o => !o.customerId).length;
    const itemsSold = todaysOrders.reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.quantity, 0), 0);

    const hourlyData = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 9;
      const ordersInHour = todaysOrders.filter(o => new Date(o.createdAt).getHours() === hour);
      return {
        time: `${hour}:00`,
        sales: ordersInHour.reduce((sum, o) => sum + o.total, 0),
        orders: ordersInHour.length
      };
    });

    const activeTables = tables.filter(t => t.status === 'occupied').length;
    return { revenue, customers, itemsSold, hourlyData, activeTables };
  }, [orders, tables]);

  const kpis = [
    {
      label: "Today's Revenue",
      value: `${settings.currencySymbol}${metrics.revenue.toLocaleString()}`,
      icon: IndianRupee,
      from: 'from-red-500', to: 'to-rose-600',
      bg: 'bg-gradient-to-br from-red-500 to-rose-600',
      light: 'bg-red-50 border-red-200',
      trend: '+12.5%',
    },
    {
      label: 'Items Sold',
      value: metrics.itemsSold,
      icon: ShoppingCart,
      from: 'from-orange-500', to: 'to-amber-500',
      bg: 'bg-gradient-to-br from-orange-500 to-amber-500',
      light: 'bg-orange-50 border-orange-200',
      trend: '+5.2%',
    },
    {
      label: 'Customers Served',
      value: metrics.customers,
      icon: Users,
      from: 'from-red-400', to: 'to-orange-500',
      bg: 'bg-gradient-to-br from-red-400 to-orange-500',
      light: 'bg-amber-50 border-amber-200',
      trend: '+18.1%',
    },
    {
      label: 'Active Tables',
      value: `${metrics.activeTables} / ${tables.length}`,
      icon: Clock,
      from: 'from-orange-600', to: 'to-red-700',
      bg: 'bg-gradient-to-br from-orange-600 to-red-700',
      light: 'bg-rose-50 border-rose-200',
      trend: 'Live',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-solid">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">🔥 Dashboard</h1>
          <p className="text-surface-500 text-sm italic">Live café overview — Where Comfort Meets Flavor</p>
        </div>
      </div>

      {/* ── KPI Cards ── 4-col grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl border p-5 shadow-solid hover:shadow-solid-hover hover:-translate-y-1 transition-all duration-300 ${k.light}`}
          >
            {/* Decorative blob */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-xl ${k.bg}`} />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-3xl font-bold text-surface-900">{k.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${k.bg} flex items-center justify-center shadow-solid text-white shrink-0`}>
                <k.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-green-600 relative z-10">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{k.trend}</span>
              <span className="text-surface-400 font-normal ml-1">vs yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sales Chart — spans 2 cols */}
        <div className="lg:col-span-2 bg-white border border-red-100 rounded-2xl shadow-solid p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-surface-900">📈 Sales Timeline</h3>
              <p className="text-xs text-surface-400 mt-0.5">Hourly revenue today</p>
            </div>
            <select className="text-sm border border-red-200 rounded-xl px-3 py-1.5 bg-red-50 text-surface-700 outline-none focus:border-primary-500">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD5C8" vertical={false} />
                <XAxis dataKey="time" stroke="#C06450" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#C06450" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={v => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #FFD5C8',
                    borderRadius: '12px',
                    color: '#3D1610',
                    boxShadow: '0 4px 20px rgba(220,38,38,0.12)',
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#EF4444" strokeWidth={3}
                  fillOpacity={1} fill="url(#redGradient)" dot={{ fill: '#EF4444', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-red-100 rounded-2xl shadow-solid flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50">
            <h3 className="text-base font-bold text-surface-900">🧾 Recent Orders</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {orders.length === 0
              ? <p className="text-center text-surface-400 py-8 text-sm">No orders yet</p>
              : orders.slice(-6).reverse().map(order => (
                  <div key={order.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl hover:border-red-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-surface-900 font-mono">{order.orderNumber}</p>
                      <p className="text-[10px] text-surface-400">{order.lines.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary-600">{settings.currencySymbol}{order.total.toFixed(0)}</p>
                      <p className="text-[10px] text-surface-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
          </div>
          <div className="px-4 py-3 border-t border-red-100 bg-red-50/50">
            <button className="w-full text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
              View All Orders →
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── 3-col mini grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Menu Items', value: products.length, emoji: '🍽️', color: 'from-red-400 to-rose-500', light: 'bg-red-50 border-red-200' },
          { label: 'Total Orders Today', value: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length, emoji: '📋', color: 'from-orange-400 to-amber-500', light: 'bg-orange-50 border-orange-200' },
          { label: 'Total Tables', value: tables.length, emoji: '🪑', color: 'from-rose-500 to-orange-500', light: 'bg-rose-50 border-rose-200' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border shadow-solid flex items-center gap-4 ${s.light}`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl shadow-solid`}>
              {s.emoji}
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Staff Grid ── */}
      <div className="bg-white border border-red-100 rounded-2xl shadow-solid p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white">
            <Users className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-base font-bold text-surface-900">Staff Overview</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {employees.map(emp => (
            <div
              key={emp.id}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-b from-red-50 to-orange-50 border border-red-100 hover:border-primary-400 hover:shadow-solid transition-all text-center"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 border-2 border-primary-300 flex items-center justify-center text-2xl">
                {emp.avatar}
              </div>
              <div>
                <p className="font-bold text-surface-900 text-xs truncate w-full">{emp.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 capitalize font-semibold border border-primary-200 mt-1 inline-block">
                  {emp.role}
                </span>
              </div>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${emp.active ? 'text-green-600' : 'text-surface-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${emp.active ? 'bg-green-500' : 'bg-surface-400'}`} />
                {emp.active ? 'Active' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}