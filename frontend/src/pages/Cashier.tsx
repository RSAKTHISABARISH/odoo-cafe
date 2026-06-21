// ============================================================
// Velora Café — Cashier Dashboard
// Features: Live table status, active orders, payment processing
// ============================================================
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useTableStore, useOrderStore, usePaymentStore,
  useSettingsStore, useAuthStore, useCouponStore,
} from '../store';
import {
  CreditCard, Banknote, Smartphone, CheckCircle2, Clock,
  UtensilsCrossed, X, ChevronRight, Search, LogOut,
  Table2, Receipt, Tag, RefreshCw, TrendingUp, Users,
  Coffee, AlertCircle, Printer,
} from 'lucide-react';

type PayMethod = 'cash' | 'card' | 'upi';

const COLORS = {
  bg:       '#FDFAF5',
  sidebar:  '#2E1A0A',
  card:     '#FFFFFF',
  border:   '#EDE3D6',
  brand:    '#6B3A2A',
  brandLt:  '#8B5E3C',
  gold:     '#C4862A',
  text:     '#1A0F00',
  textMed:  '#5C3D1E',
  textLt:   '#9B7B58',
  green:    '#16A34A',
  red:      '#DC2626',
  amber:    '#D97706',
};
// ── Product image lookup (matches SelfOrder menu) ────────────
const PRODUCT_IMAGES: Record<string, string> = {
  'Espresso':          'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=120&q=80',
  'Cappuccino':        'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=120&q=80',
  'Latte':             'https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=120&q=80',
  'Tea':               'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=120&q=80',
  'Cold Coffee':       'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=120&q=80',
  'Juice & Smoothies': 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=120&q=80',
  'Sandwich':          'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=120&q=80',
  'Burger':            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&q=80',
  'Pizza':             'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=120&q=80',
  'Pastries & Cakes':  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=120&q=80',
};

// Fallback image for products not in the map
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=120&q=80';

export default function Cashier() {
  const navigate = useNavigate();
  const { tables } = useTableStore();
  const { orders, updateOrderStatus } = useOrderStore();
  const { addPayment } = usePaymentStore();
  const { settings } = useSettingsStore();
  const { logout, currentUser } = useAuthStore();
  const { validateCoupon, updateCoupon, coupons } = useCouponStore();

  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount?: number; message: string } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'tables' | 'summary'>('orders');

  const sym = settings.currencySymbol;

  // Live active orders (excluding paid/cancelled)
  const activeOrders = useMemo(() =>
    orders
      .filter(o => !['paid', 'cancelled'].includes(o.status))
      .filter(o =>
        !search ||
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.tableName?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, search]
  );

  const selectedOrder = orders.find(o => o.id === selectedOrderId) ?? null;
  const discount = couponResult?.valid ? (couponResult.discount ?? 0) : 0;
  const grandTotal = selectedOrder ? Math.max(0, selectedOrder.total - discount) : 0;
  const change = payMethod === 'cash' && cashReceived
    ? Math.max(0, Number(cashReceived) - grandTotal)
    : 0;

  // Table overview
  const occupiedTables = tables.filter(t => t.status === 'occupied');
  const availableTables = tables.filter(t => t.status === 'available');

  // Today revenue
  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(o => o.status === 'paid' && new Date(o.createdAt).toDateString() === today)
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);

  const todayPaidCount = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => o.status === 'paid' && new Date(o.createdAt).toDateString() === today).length;
  }, [orders]);

  const handleApplyCoupon = () => {
    if (!selectedOrder || !couponCode.trim()) return;
    const result = validateCoupon(couponCode.trim(), selectedOrder.total);
    setCouponResult(result);
  };

  const handlePayment = async () => {
    if (!selectedOrder || processingPayment) return;
    setProcessingPayment(true);
    try {
      const paymentId = `pay-${Date.now()}`;
      addPayment({
        id: paymentId,
        orderId: selectedOrder.id,
        amount: grandTotal,
        method: payMethod,
        status: 'completed',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        reference: `${payMethod.toUpperCase()}-${paymentId.slice(-6)}`,
      });

      // Apply coupon usage
      if (couponResult?.valid && couponCode) {
        const c = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
        if (c) updateCoupon(c.id, { usageCount: c.usageCount + 1 });
      }

      updateOrderStatus(selectedOrder.id, 'paid');
      setPaidOrderId(selectedOrder.id);
      setSelectedOrderId(null);
      setCouponCode('');
      setCouponResult(null);
      setCashReceived('');
    } finally {
      setProcessingPayment(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: '#FEF3C7', text: '#92400E', dot: COLORS.amber };
      case 'preparing': return { bg: '#FEE2E2', text: '#7F1D1D', dot: COLORS.red };
      case 'ready':     return { bg: '#DCFCE7', text: '#14532D', dot: COLORS.green };
      default:          return { bg: '#F5F5F4', text: '#44403C', dot: '#78716C' };
    }
  };

  const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const elapsed = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    return diff < 60 ? `${diff}m ago` : `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Lucida Calligraphy", cursive' }}>

      {/* ── Main Panel ───────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'transparent' }}>

        {/* Header */}
        <header style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.border}`, padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Coffee style={{ width: 18, height: 18, color: COLORS.brand }} />
            {/* Tab buttons */}
            <div style={{ display: 'flex', gap: 4, background: '#F5EFE8', borderRadius: 10, padding: 3 }}>
              {([
                { id: 'orders', icon: Receipt, label: 'Active Orders', count: activeOrders.length },
                { id: 'tables', icon: Table2,  label: 'Tables',  count: occupiedTables.length },
                { id: 'summary', icon: TrendingUp, label: 'Summary', count: null },
              ] as { id: typeof activeTab; icon: typeof Receipt; label: string; count: number | null }[]).map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: active ? COLORS.card : 'transparent',
                      color: active ? COLORS.brand : COLORS.textMed,
                      fontWeight: active ? 700 : 500, fontSize: 12,
                      boxShadow: active ? '0 1px 4px rgba(107,58,42,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    <Icon style={{ width: 14, height: 14 }} />
                    {item.label}
                    {item.count !== null && (
                      <span style={{
                        background: active ? COLORS.brand : COLORS.textLt,
                        color: '#fff',
                        borderRadius: 20, fontSize: 10, fontWeight: 800,
                        padding: '1px 6px', minWidth: 16, textAlign: 'center',
                      }}>{item.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Summary chips */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Active Orders', val: activeOrders.length, color: COLORS.amber },
                { label: 'Tables Occupied', val: occupiedTables.length, color: COLORS.red },
                { label: "Today's Revenue", val: `${sym}${todayRevenue.toLocaleString()}`, color: COLORS.green },
              ].map(c => (
                <div key={c.label} style={{ background: 'rgba(255,255,255,0.8)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '4px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: c.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: COLORS.textMed, fontWeight: 600 }}>{c.label}:</span>
                  <span style={{ fontSize: 12, color: COLORS.text, fontWeight: 800 }}>{c.val}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/app/dashboard')}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textMed, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Admin View
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left: Order / Table / Summary List ─────────── */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

            {/* ACTIVE ORDERS TAB */}
            {activeTab === 'orders' && (
              <>
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: COLORS.textLt }} />
                  <input
                    placeholder="Search by order # or table…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: `1.5px solid ${COLORS.border}`, background: COLORS.card, fontSize: 13, color: COLORS.text, outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(107,58,42,0.06)' }}
                  />
                </div>

                {activeOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '80px 0', color: COLORS.textLt }}>
                    <Receipt style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 16, fontWeight: 600 }}>No active orders</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>All orders have been settled</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                  {activeOrders.map(order => {
                    const sc = statusColor(order.status);
                    const isSelected = order.id === selectedOrderId;
                    return (
                      <button key={order.id} onClick={() => { setSelectedOrderId(order.id); setCouponCode(''); setCouponResult(null); setCashReceived(''); }}
                        style={{
                          background: isSelected ? '#FFF7ED' : COLORS.card,
                          border: `2px solid ${isSelected ? COLORS.gold : COLORS.border}`,
                          borderRadius: 16, padding: '16px', cursor: 'pointer', textAlign: 'left',
                          boxShadow: isSelected ? `0 4px 20px ${COLORS.gold}30` : '0 2px 8px rgba(107,58,42,0.06)',
                          transition: 'all 0.2s',
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 15, color: COLORS.text }}>{order.orderNumber}</p>
                            <p style={{ fontSize: 12, color: COLORS.textMed, marginTop: 2 }}>
                              🪑 {order.tableName} &bull; {order.employeeName}
                            </p>
                          </div>
                          <span style={{ background: sc.bg, color: sc.text, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {statusLabel(order.status)}
                          </span>
                        </div>
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: COLORS.textLt }}>
                            <Clock style={{ width: 11, height: 11, display: 'inline', marginRight: 3 }} />
                            {elapsed(order.createdAt)}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: 16, color: COLORS.brand }}>
                            {sym}{order.total.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {order.lines.slice(0, 3).map((l, i) => (
                            <span key={i} style={{ background: '#F5EFE8', color: COLORS.textMed, borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
                              {l.productName} ×{l.quantity}
                            </span>
                          ))}
                          {order.lines.length > 3 && (
                            <span style={{ background: '#F5EFE8', color: COLORS.textLt, borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
                              +{order.lines.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* TABLE STATUS TAB */}
            {activeTab === 'tables' && (
              <>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 16 }}>
                  Live Table Overview — {tables.length} Tables
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {tables.map(table => {
                    const tableOrders = orders.filter(o => o.tableId === table.id && !['paid', 'cancelled'].includes(o.status));
                    const tableTotal = tableOrders.reduce((s, o) => s + o.total, 0);
                    const statusMeta = {
                      available: { bg: '#DCFCE7', text: '#14532D', label: 'Available', emoji: '✅' },
                      occupied:  { bg: '#FEE2E2', text: '#7F1D1D', label: 'Occupied',  emoji: '🔴' },
                      reserved:  { bg: '#FEF3C7', text: '#92400E', label: 'Reserved',  emoji: '🟡' },
                      cleaning:  { bg: '#E0F2FE', text: '#0C4A6E', label: 'Cleaning',  emoji: '🧹' },
                    }[table.status] ?? { bg: '#F5F5F4', text: '#57534E', label: table.status, emoji: '⬜' };
                    return (
                      <div key={table.id} style={{
                        background: COLORS.card, border: `1.5px solid ${COLORS.border}`,
                        borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(107,58,42,0.06)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontWeight: 800, fontSize: 18, color: COLORS.text }}>T{table.number}</span>
                          <span style={{ background: statusMeta.bg, color: statusMeta.text, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {statusMeta.emoji} {statusMeta.label}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: COLORS.textLt, marginBottom: 4 }}>
                          Seats: {table.seats ?? '—'} &bull; Floor: {table.floorId?.replace('floor-', '') ?? '1'}
                        </p>
                        {tableOrders.length > 0 && (
                          <>
                            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 8, marginTop: 8 }}>
                              <p style={{ fontSize: 12, color: COLORS.textMed, fontWeight: 600 }}>
                                {tableOrders.length} active order{tableOrders.length > 1 ? 's' : ''}
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.brand, marginTop: 2 }}>
                                {sym}{tableTotal.toLocaleString()} pending
                              </p>
                            </div>
                            <button onClick={() => { setSelectedOrderId(tableOrders[0].id); setActiveTab('orders'); }}
                              style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 8, border: 'none', background: COLORS.brand, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Collect Payment
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
              <>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 20 }}>Today's Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                  {[
                    { icon: TrendingUp, label: 'Revenue', value: `${sym}${todayRevenue.toLocaleString()}`, color: COLORS.green },
                    { icon: Receipt,    label: 'Orders Paid',     value: todayPaidCount, color: COLORS.brand },
                    { icon: Clock,      label: 'Active Orders',   value: activeOrders.length, color: COLORS.amber },
                    { icon: Users,      label: 'Tables Occupied', value: occupiedTables.length, color: COLORS.red },
                    { icon: Table2,     label: 'Tables Free',     value: availableTables.length, color: COLORS.green },
                  ].map(stat => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(107,58,42,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon style={{ width: 18, height: 18, color: stat.color }} />
                          </div>
                          <span style={{ fontSize: 12, color: COLORS.textMed, fontWeight: 600 }}>{stat.label}</span>
                        </div>
                        <p style={{ fontWeight: 800, fontSize: 28, color: stat.color }}>{stat.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Paid Orders */}
                <h3 style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, marginBottom: 12 }}>Recent Payments</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {orders
                    .filter(o => o.status === 'paid')
                    .slice(0, 10)
                    .map(o => (
                      <div key={o.id} style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 13, color: COLORS.text }}>{o.orderNumber}</p>
                          <p style={{ fontSize: 11, color: COLORS.textLt, marginTop: 2 }}>{o.tableName} &bull; {elapsed(o.updatedAt)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ background: '#DCFCE7', color: '#14532D', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✅ Paid</span>
                          <p style={{ fontWeight: 800, fontSize: 14, color: COLORS.green, marginTop: 4 }}>{sym}{o.total.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* ── Right: Payment Panel ────────────────────────── */}
          <aside style={{
            width: 360, flexShrink: 0,
            borderLeft: `1px solid ${COLORS.border}`,
            display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
          }}>

            {/* Success flash */}
            {paidOrderId && (
              <div style={{
                position: 'absolute', top: 80, right: 20, zIndex: 100,
                background: '#DCFCE7', border: '1.5px solid #86EFAC', borderRadius: 14,
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(22,163,74,0.2)',
                animation: 'fadeInDown 0.3s ease',
              }}>
                <CheckCircle2 style={{ width: 22, height: 22, color: COLORS.green }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#14532D' }}>Payment Successful!</p>
                  <p style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>Order {paidOrderId.slice(-6).toUpperCase()} settled</p>
                </div>
                <button onClick={() => setPaidOrderId(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}

            {!selectedOrder ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                <CreditCard style={{ width: 52, height: 52, color: COLORS.border, marginBottom: 16 }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: COLORS.textMed }}>Select an order</p>
                <p style={{ fontSize: 13, color: COLORS.textLt, marginTop: 6 }}>Click any active order to process payment</p>
              </div>
            ) : (
              <>
                {/* Order Header */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: COLORS.text }}>{selectedOrder.orderNumber}</p>
                    <p style={{ fontSize: 12, color: COLORS.textMed, marginTop: 2 }}>🪑 {selectedOrder.tableName}</p>
                  </div>
                  <button onClick={() => setSelectedOrderId(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: COLORS.textMed }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>

                {/* Order Lines */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
                  {/* Order Lines — with images */}
                  <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLt, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Order Items</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedOrder.lines.map((line, i) => {
                      const img = PRODUCT_IMAGES[line.productName] ?? FALLBACK_IMG;
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px',
                          background: '#FDFAF5',
                          borderRadius: 14,
                          border: `1px solid ${COLORS.border}`,
                        }}>
                          {/* Food Image */}
                          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${COLORS.border}` }}>
                            <img
                              src={img}
                              alt={line.productName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                            />
                          </div>
                          {/* Item Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {line.productName}
                            </p>
                            <p style={{ fontSize: 11, color: COLORS.textLt, marginTop: 2 }}>
                              ×{line.quantity} @ {sym}{line.unitPrice}
                            </p>
                          </div>
                          {/* Line Total */}
                          <p style={{ fontWeight: 800, color: COLORS.brand, fontSize: 14, flexShrink: 0 }}>
                            {sym}{line.total}
                          </p>
                        </div>
                      );
                    })}
                  </div>


                  {/* Coupon */}
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLt, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Apply Coupon</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        placeholder="Coupon code…"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 13, color: COLORS.text, outline: 'none', fontFamily: 'monospace' }}
                      />
                      <button onClick={handleApplyCoupon}
                        style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: COLORS.brand, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag style={{ width: 13, height: 13 }} /> Apply
                      </button>
                    </div>
                    {couponResult && (
                      <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: couponResult.valid ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${couponResult.valid ? '#86EFAC' : '#FCA5A5'}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {couponResult.valid
                          ? <CheckCircle2 style={{ width: 14, height: 14, color: COLORS.green }} />
                          : <AlertCircle style={{ width: 14, height: 14, color: COLORS.red }} />}
                        <p style={{ fontSize: 12, color: couponResult.valid ? '#14532D' : '#7F1D1D', fontWeight: 600 }}>{couponResult.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Bill Summary */}
                  <div style={{ marginTop: 16, background: '#FDFAF5', borderRadius: 12, padding: '12px', border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: COLORS.textMed }}>Subtotal</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{sym}{selectedOrder.subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: COLORS.textMed }}>Tax</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{sym}{selectedOrder.tax}</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: COLORS.green }}>Coupon Discount</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.green }}>−{sym}{discount}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${COLORS.border}`, marginTop: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Total</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.brand }}>{sym}{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLt, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Payment Method</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([
                        { id: 'cash', icon: Banknote,    label: 'Cash' },
                        { id: 'card', icon: CreditCard,  label: 'Card' },
                        { id: 'upi',  icon: Smartphone,  label: 'UPI' },
                      ] as { id: PayMethod; icon: typeof Banknote; label: string }[]).map(pm => {
                        const Icon = pm.icon;
                        const active = payMethod === pm.id;
                        return (
                          <button key={pm.id} onClick={() => { setPayMethod(pm.id); setCashReceived(''); }}
                            style={{
                              flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                              border: `2px solid ${active ? COLORS.gold : COLORS.border}`,
                              background: active ? '#FFF7ED' : 'transparent',
                              color: active ? COLORS.brand : COLORS.textMed,
                              fontWeight: active ? 700 : 500, fontSize: 12,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                              transition: 'all 0.2s',
                            }}>
                            <Icon style={{ width: 18, height: 18 }} />
                            {pm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cash Input */}
                  {payMethod === 'cash' && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLt, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cash Received</label>
                      <input
                        type="number"
                        placeholder={`${sym}0.00`}
                        value={cashReceived}
                        onChange={e => setCashReceived(e.target.value)}
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 16, fontWeight: 700, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }}
                      />
                      {cashReceived && Number(cashReceived) >= grandTotal && (
                        <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>Change to Return:</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#78350F' }}>{sym}{change.toFixed(2)}</span>
                        </div>
                      )}
                      {/* Quick amounts */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {[grandTotal, Math.ceil(grandTotal / 50) * 50, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4).map(amt => (
                          <button key={amt} onClick={() => setCashReceived(String(amt))}
                            style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.card, fontSize: 12, fontWeight: 600, color: COLORS.textMed, cursor: 'pointer' }}>
                            {sym}{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Input */}
                  {payMethod === 'card' && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F0F9FF', border: '1.5px solid #BAE6FD' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <CreditCard style={{ width: 16, height: 16, color: '#0284C7' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0C4A6E' }}>Card Payment</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#0369A1', lineHeight: 1.5 }}>
                          Swipe, tap, or insert the customer's card on the POS terminal. Click confirm once the terminal shows approval.
                        </p>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLt, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reference # (optional)</label>
                        <input
                          type="text"
                          placeholder="Last 4 digits or approval code"
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          style={{ width: '100%', marginTop: 6, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 13, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* UPI Input */}
                  {payMethod === 'upi' && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F5F3FF', border: '1.5px solid #C4B5FD' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Smartphone style={{ width: 16, height: 16, color: '#7C3AED' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95' }}>UPI Payment</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#5B21B6', lineHeight: 1.5 }}>
                          Show the QR code or enter the customer's UPI ID to collect payment. Click confirm once payment is received.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                          <div style={{ background: '#FFF', padding: 8, borderRadius: 8, border: '1px solid #C4B5FD' }}>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${settings.upiId || 'cafe@upi'}&pn=${encodeURIComponent(settings.upiName || 'Velora Cafe')}&am=${grandTotal}&cu=INR`}
                              alt="UPI QR" 
                              style={{ width: 120, height: 120, objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLt, letterSpacing: '0.1em', textTransform: 'uppercase' }}>UPI Transaction ID (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 1234567890"
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          style={{ width: '100%', marginTop: 6, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 13, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Payment Button */}
                <div style={{ padding: '16px 20px', borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                  <button onClick={handlePayment}
                    disabled={processingPayment || (payMethod === 'cash' && (!cashReceived || Number(cashReceived) < grandTotal))}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                      cursor: (processingPayment || (payMethod === 'cash' && (!cashReceived || Number(cashReceived) < grandTotal))) ? 'not-allowed' : 'pointer',
                      background: processingPayment ? '#CBA882' : `linear-gradient(135deg, ${COLORS.brandLt}, ${COLORS.brand})`,
                      color: '#FFFFFF', fontWeight: 800, fontSize: 15,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: `0 4px 16px ${COLORS.brand}40`,
                      opacity: (processingPayment || (payMethod === 'cash' && (!cashReceived || Number(cashReceived) < grandTotal))) ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}>
                    <CheckCircle2 style={{ width: 18, height: 18 }} />
                    {processingPayment ? 'Processing…' : `Confirm ${payMethod.toUpperCase()} Payment — ${sym}${grandTotal.toLocaleString()}`}
                  </button>
                  <button style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textMed, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Printer style={{ width: 13, height: 13 }} /> Print Bill
                  </button>
                </div>
              </>
            )}
          </aside>

        </div>
      </main>
    </div>
  );
}
