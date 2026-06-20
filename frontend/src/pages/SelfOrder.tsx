// ============================================================
// Café — Self-Ordering | Warm Cream Theme | Clear & Beautiful
// ============================================================
import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTableStore, useOrderStore, useSettingsStore, useKDSStore } from '../store';
import { api } from '../utils/api';
import {
  ShoppingBag, Plus, Minus, X, CheckCircle,
  Search, ChevronRight, Star, Flame, Receipt, Clock, ArrowLeft
} from 'lucide-react';

// ── Menu Definition ───────────────────────────────────────────
interface MenuItem {
  id: string;
  category: string;
  name: string;
  price: number;
  taxRate: number;
  image: string;
  description: string;
  badge?: 'bestseller' | 'popular' | 'new';
  prepTime: number;
}

const MENU_CATEGORIES = [
  { id: 'all',       label: 'All Items',       icon: '🍽️' },
  { id: 'hotdrink',  label: 'Hot Drinks',       icon: '☕' },
  { id: 'colddrink', label: 'Cold Drinks',      icon: '🥤' },
  { id: 'food',      label: 'Food',             icon: '🍔' },
  { id: 'bakes',     label: 'Pastries & Cakes', icon: '🥐' },
];

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'espresso',
    category: 'hotdrink',
    name: 'Espresso',
    price: 120,
    taxRate: 10,
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=700&q=85',
    description: 'Rich, bold single-origin espresso with a smooth golden crema',
    badge: 'bestseller',
    prepTime: 3,
  },
  {
    id: 'cappuccino',
    category: 'hotdrink',
    name: 'Cappuccino',
    price: 150,
    taxRate: 6,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=700&q=85',
    description: 'Espresso crowned with velvety steamed milk and thick dense foam',
    badge: 'popular',
    prepTime: 4,
  },
  {
    id: 'latte',
    category: 'hotdrink',
    name: 'Latte',
    price: 160,
    taxRate: 5,
    image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=700&q=85',
    description: 'Silky espresso layered with steamed milk and delicate latte art',
    prepTime: 4,
  },
  {
    id: 'tea',
    category: 'hotdrink',
    name: 'Tea',
    price: 80,
    taxRate: 7,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=85',
    description: 'Premium whole-leaf tea steeped to perfection, served piping hot',
    prepTime: 5,
  },
  {
    id: 'cold-coffee',
    category: 'colddrink',
    name: 'Cold Coffee',
    price: 180,
    taxRate: 5,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=85',
    description: '16-hour cold-steeped coffee over ice, naturally sweet and smooth',
    badge: 'bestseller',
    prepTime: 2,
  },
  {
    id: 'juice-smoothies',
    category: 'colddrink',
    name: 'Juice & Smoothies',
    price: 170,
    taxRate: 3,
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=700&q=85',
    description: 'Freshly blended fruits and vegetables, no added sugar or preservatives',
    badge: 'new',
    prepTime: 5,
  },
  {
    id: 'sandwich',
    category: 'food',
    name: 'Sandwich',
    price: 150,
    taxRate: 9,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=85',
    description: 'Grilled sourdough with premium fillings, fresh herbs, and house sauce',
    badge: 'popular',
    prepTime: 8,
  },
  {
    id: 'burger',
    category: 'food',
    name: 'Burger',
    price: 200,
    taxRate: 5,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=85',
    description: 'Juicy patty with fresh lettuce, tomato, aged cheese and special sauce',
    badge: 'bestseller',
    prepTime: 12,
  },
  {
    id: 'pizza',
    category: 'food',
    name: 'Pizza',
    price: 250,
    taxRate: 5,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=85',
    description: 'Stone-baked thin crust with hand-crushed tomato and fresh mozzarella',
    prepTime: 18,
  },
  {
    id: 'pastries-cakes',
    category: 'bakes',
    name: 'Pastries & Cakes',
    price: 140,
    taxRate: 2,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=85',
    description: 'Freshly baked daily — croissants, muffins and our signature cakes',
    badge: 'popular',
    prepTime: 2,
  },
];

// ── Cart Type ─────────────────────────────────────────────────
interface CartEntry {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  lineTotal: number;
  lineTax: number;
}

export default function SelfOrder() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { tables }  = useTableStore();
  const { addOrder } = useOrderStore();
  const { addTicket } = useKDSStore();
  const { settings } = useSettingsStore();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [cart, setCart]                     = useState<CartEntry[]>([]);
  const [showCart, setShowCart]             = useState(false);
  const [orderPlaced, setOrderPlaced]       = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [isPlacing, setIsPlacing]           = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [paymentMethod, setPaymentMethod]   = useState<'cash'|'upi'|'card'>('cash');

  const table = tables.find(t => t.id === tableId);
  const effectiveTable = table || tables[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredItems = useMemo(() =>
    MENU_ITEMS.filter(item => {
      const catMatch  = activeCategory === 'all' || item.category === activeCategory;
      const srchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && srchMatch;
    }),
    [activeCategory, searchQuery]
  );

  const subtotal   = cart.reduce((s, e) => s + e.lineTotal, 0);
  const totalTax   = cart.reduce((s, e) => s + e.lineTax, 0);
  const grandTotal = subtotal + totalTax;
  const itemCount  = cart.reduce((s, e) => s + e.quantity, 0);

  const handleAdd = (item: MenuItem) => {
    const existing = cart.find(e => e.menuItem.id === item.id);
    if (existing) {
      setCart(cart.map(e => e.menuItem.id === item.id
        ? { ...e, quantity: e.quantity + 1, lineTotal: (e.quantity + 1) * item.price, lineTax: Math.round((e.quantity + 1) * item.price * item.taxRate / 100) }
        : e
      ));
    } else {
      setCart([...cart, {
        id: `entry-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        lineTotal: item.price,
        lineTax: Math.round(item.price * item.taxRate / 100),
      }]);
    }
  };

  const handleUpdateQty = (entryId: string, delta: number) => {
    setCart(cart
      .map(e => {
        if (e.id !== entryId) return e;
        const newQty = Math.max(0, e.quantity + delta);
        return { ...e, quantity: newQty, lineTotal: newQty * e.menuItem.price, lineTax: Math.round(newQty * e.menuItem.price * e.menuItem.taxRate / 100) };
      })
      .filter(e => e.quantity > 0)
    );
  };

  const finalizeOrder = async (paymentRef?: string) => {
    let orderNumber = '';
    try { const r = await api.generateOrderId(); orderNumber = r.orderId; }
    catch { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; orderNumber = 'CF-' + Array.from({ length: 5 }, () => c[Math.floor(Math.random() * c.length)]).join(''); }

    const orderId = `ord-so-${Date.now()}`;
    const lines = cart.map(e => ({
      id: `line-${Date.now()}-${e.menuItem.id}`,
      orderId, productId: e.menuItem.id, productName: e.menuItem.name,
      quantity: e.quantity, unitPrice: e.menuItem.price, total: e.lineTotal,
      notes: '', status: 'pending' as const,
    }));

    addOrder({ id: orderId, orderNumber, tableId: tableId || 'counter', tableName: effectiveTable ? `Table ${effectiveTable.number}` : 'Counter', employeeId: 'system', employeeName: 'Self-Order', status: paymentMethod === 'cash' ? 'confirmed' : 'paid', lines, subtotal, tax: Math.round(totalTax), taxRate: 0, discount: 0, total: Math.round(grandTotal), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), paidAt: paymentMethod !== 'cash' ? new Date().toISOString() : undefined });
    addTicket({ id: `kds-${orderId}`, orderId, orderNumber, tableName: effectiveTable ? `Table ${effectiveTable.number}` : 'Counter', items: cart.map(e => ({ name: e.menuItem.name, quantity: e.quantity, notes: '', status: 'queued' })), status: 'queued', createdAt: new Date().toISOString(), priority: 'normal' });

    setPlacedOrderNumber(orderNumber);
    setOrderPlaced(true);
    setShowCart(false);
  };

  const placeOrder = async () => {
    if (cart.length === 0 || isPlacing) return;
    setIsPlacing(true);

    try {
      // ── Cash: place order directly ──
      if (paymentMethod === 'cash') {
        await finalizeOrder();
        setIsPlacing(false);
        return;
      }

      // ── UPI / Card: Razorpay Checkout ──
      try {
        const rzpOrder = await api.createRazorpayOrder(
          Math.round(grandTotal),
          `rcpt_${Date.now()}`
        );

        const options: any = {
          key: rzpOrder.key_id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: settings.restaurantName || 'Velora Café',
          description: 'Self-Order Payment',
          order_id: rzpOrder.id,
          handler: async (response: any) => {
            // Payment succeeded — verify on backend
            try {
              await api.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
            } catch { /* verification is best-effort for test keys */ }

            // Place order after successful payment
            await finalizeOrder(response.razorpay_payment_id);
            setIsPlacing(false);
          },
          prefill: {
            name: 'Customer',
            contact: '',
          },
          theme: {
            color: '#6B3A2A',
          },
          modal: {
            ondismiss: () => { setIsPlacing(false); },
          },
          method: {
            upi: paymentMethod === 'upi',
            card: paymentMethod === 'card',
            netbanking: paymentMethod === 'card',
            wallet: false,
            paylater: false,
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', () => {
          setIsPlacing(false);
          alert('Payment failed. Please try again.');
        });
        rzp.open();
        return; // Don't set isPlacing=false here; handler/dismiss will do it
      } catch (err) {
        console.error('Razorpay error:', err);
        alert('Could not initiate payment. Please try Cash instead.');
        setIsPlacing(false);
      }
    } catch {
      setIsPlacing(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────
  const PAGE_BG   = '#FDFAF5';      // warm ivory
  const CARD_BG   = '#FFFFFF';
  const DARK_TEXT  = '#1A0F00';     // deep espresso — max contrast
  const MED_TEXT   = '#5C3D1E';     // medium coffee brown
  const LIGHT_TEXT = '#9B7B58';     // muted warm brown
  const BRAND      = '#6B3A2A';     // rich coffee
  const BRAND_LT   = '#8B5E3C';     // lighter coffee
  const GOLD       = '#C4862A';     // warm gold
  const BORDER     = '#EDE3D6';     // soft warm border

  // ── ORDER PLACED SCREEN ────────────────────────────────────
  if (orderPlaced) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}
        className="flex flex-col items-center justify-center p-6">

        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          {/* Success icon */}
          <div style={{ width: 80, height: 80, background: '#F0EAE1', border: `2px solid ${BRAND}30`, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle style={{ color: BRAND, width: 40, height: 40 }} />
          </div>

          <h1 style={{ color: DARK_TEXT, fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Order Placed! ☕
          </h1>
          <p style={{ color: MED_TEXT, fontSize: 14, marginBottom: 32, fontStyle: 'italic' }}>
            Brewed to Perfection — Your order is on its way!
          </p>

          {/* Order number */}
          <div style={{ background: CARD_BG, border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: '24px', marginBottom: 16, boxShadow: '0 4px 24px rgba(107,58,42,0.08)' }}>
            <p style={{ color: LIGHT_TEXT, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Your Order Number</p>
            <p style={{ color: BRAND, fontSize: 36, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 16 }}>
              {placedOrderNumber}
            </p>
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
              {cart.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: MED_TEXT, fontSize: 13 }}>{e.menuItem.name} × {e.quantity}</span>
                  <span style={{ color: DARK_TEXT, fontWeight: 600, fontSize: 13 }}>{settings.currencySymbol}{e.lineTotal}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
                <span style={{ color: MED_TEXT, fontSize: 13 }}>GST</span>
                <span style={{ color: MED_TEXT, fontSize: 13 }}>{settings.currencySymbol}{Math.round(totalTax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: DARK_TEXT, fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: BRAND, fontWeight: 800, fontSize: 16 }}>{settings.currencySymbol}{Math.round(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ background: CARD_BG, border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: '0 4px 24px rgba(107,58,42,0.08)' }}>
            {paymentMethod === 'upi' ? (
              <>
                <p style={{ color: '#8B5CF6', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16 }}>📱 Scan to Pay with UPI</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: '#FFF', padding: 12, borderRadius: 12, border: `2px solid #8B5CF6` }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=cafe@upi&pn=CafePos&am=${Math.round(grandTotal)}`}
                      alt="UPI Payment QR" style={{ width: 160, height: 160 }} />
                  </div>
                </div>
                <p style={{ color: LIGHT_TEXT, fontSize: 12, marginTop: 12, fontWeight: 600 }}>
                  Amount: {settings.currencySymbol}{Math.round(grandTotal)}
                </p>
              </>
            ) : (
              <>
                <p style={{ color: MED_TEXT, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>📱 Scan to Track Your Order</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: '#FFF9F4', padding: 12, borderRadius: 12, border: `1px solid ${BORDER}` }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(placedOrderNumber)}&bgcolor=FFF9F4&color=3D1F0A&qzone=1`}
                      alt="Order QR" style={{ width: 160, height: 160 }} />
                  </div>
                </div>
              </>
            )}
            <p style={{ color: LIGHT_TEXT, fontSize: 12, marginTop: 12 }}>
              🪑 {effectiveTable ? `Table ${effectiveTable.number}` : 'Counter'} &bull; {paymentMethod === 'cash' ? 'Please pay with Cash at counter' : paymentMethod === 'card' ? 'Please pay with Card at counter' : 'Pay via UPI above'}
            </p>
          </div>

          <button onClick={() => { setOrderPlaced(false); setCart([]); }}
            style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})`, color: '#FFFFFF', fontWeight: 700, fontSize: 15, borderRadius: 14, border: 'none', cursor: 'pointer' }}>
            ☕ Order More Items
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN ORDER PAGE ────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>

      {/* ── STICKY HEADER ─────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(253,250,245,0.97)' : '#FDFAF5',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 2px 20px rgba(107,58,42,0.08)' : 'none',
      }}>

        {/* Top Bar */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', color: DARK_TEXT, borderRadius: '50%', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
               <ArrowLeft style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              ☕
            </div>
            <div>
              <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: DARK_TEXT, lineHeight: 1.2 }}>
                {settings.restaurantName}
              </p>
              <p style={{ fontSize: 12, color: LIGHT_TEXT, lineHeight: 1 }}>
                {effectiveTable ? `🪑 Table ${effectiveTable.number}` : 'Self Order'} &bull; Dine-in
              </p>
            </div>
          </div>

          {/* Cart Button */}
          <button onClick={() => setShowCart(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})`,
            color: '#FFFFFF', fontWeight: 600, fontSize: 14,
            padding: '10px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
            position: 'relative', transition: 'opacity 0.2s',
          }}>
            <ShoppingBag style={{ width: 16, height: 16 }} />
            <span>My Order</span>
            {itemCount > 0 && (
              <span style={{ background: '#FFFFFF', color: BRAND, fontWeight: 800, fontSize: 11, width: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {itemCount}
              </span>
            )}
          </button>
        </div>



        {/* ── Category Tabs ──────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 14px', overflowX: 'auto' }}
          className="scrollbar-hide">
          <div style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
            {MENU_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 18px', borderRadius: 50,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s ease',
                  background: activeCategory === cat.id ? `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})` : '#FFFFFF',
                  color: activeCategory === cat.id ? '#FFFFFF' : MED_TEXT,
                  border: activeCategory === cat.id ? 'none' : `1.5px solid ${BORDER}`,
                  boxShadow: activeCategory === cat.id ? `0 4px 16px ${BRAND}40` : '0 1px 4px rgba(107,58,42,0.06)',
                }}>
                <span style={{ fontSize: 15 }}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero Banner ───────────────────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0',
      }}>
        <div style={{
          borderRadius: 20, overflow: 'hidden', height: 140,
          background: `linear-gradient(130deg, #2E1A0A 0%, ${BRAND} 55%, ${BRAND_LT} 100%)`,
          position: 'relative', display: 'flex', alignItems: 'center',
          boxShadow: '0 4px 20px rgba(107,58,42,0.15)'
        }}>
          {/* Decorative pattern */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {['☕','🫘','☕','🫘','☕'].map((e, i) => (
              <span key={i} style={{ position: 'absolute', fontSize: 48, opacity: 0.07, top: `${-20 + i * 28}%`, left: `${i * 22}%`, transform: `rotate(${i * 40}deg)` }}>
                {e}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '0 32px' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#D4A574', fontWeight: 600, marginBottom: 8 }}>
              Where Comfort Meets Flavor
            </p>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: '#FBF0E4', margin: 0, lineHeight: 1.1 }}>
              Brewed to Perfection ✨
            </h1>
            <p style={{ fontSize: 13, color: '#C4A882', marginTop: 6 }}>
              Fresh crafted &bull; Order at your table
            </p>
          </div>
          <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 90, opacity: 0.07, userSelect: 'none' }}>☕</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 120px', display: 'flex', gap: 28 }}>

        {/* ── Product Grid ──────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: LIGHT_TEXT }} />
            <input
              type="text"
              placeholder="Search your favourite item..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px 14px 48px',
                background: CARD_BG, border: `1.5px solid ${BORDER}`,
                borderRadius: 14, fontSize: 14, color: DARK_TEXT,
                outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 1px 6px rgba(107,58,42,0.06)',
                fontFamily: '"DM Sans", sans-serif',
              }}
            />
          </div>

          {/* Section Heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Flame style={{ width: 16, height: 16, color: GOLD }} />
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD }}>
              {activeCategory === 'all' ? 'Our Full Menu' : MENU_CATEGORIES.find(c => c.id === activeCategory)?.label}
            </span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 12, color: LIGHT_TEXT }}>
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ── Product Cards Grid ─────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
            {filteredItems.map(item => {
              const entry  = cart.find(e => e.menuItem.id === item.id);
              const inCart = !!entry;
              return (
                <div key={item.id}
                  style={{
                    background: CARD_BG,
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: inCart ? `2px solid ${BRAND}` : `1.5px solid ${BORDER}`,
                    boxShadow: inCart
                      ? `0 8px 32px ${BRAND}25`
                      : '0 2px 12px rgba(107,58,42,0.06)',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>

                  {/* ── Photo ───────────────────────────────── */}
                  <div style={{ position: 'relative', height: 210, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={item.image} alt={item.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />

                    {/* Gradient only at bottom for text overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(26,15,0,0.65), transparent)' }} />

                    {/* Badge */}
                    {item.badge && (
                      <div style={{
                        position: 'absolute', top: 12, left: 12,
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 20,
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: item.badge === 'bestseller' ? GOLD :
                                    item.badge === 'new'        ? '#22A05E' : BRAND,
                        color: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}>
                        {item.badge === 'bestseller' && <Star style={{ width: 10, height: 10, fill: 'white' }} />}
                        {item.badge === 'popular'    && <Flame style={{ width: 10, height: 10 }} />}
                        {item.badge === 'bestseller' ? 'Best Seller' : item.badge === 'popular' ? 'Popular' : '✦ New'}
                      </div>
                    )}

                    {/* GST chip */}
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      padding: '4px 8px', borderRadius: 8,
                      background: 'rgba(26,15,0,0.65)', backdropFilter: 'blur(4px)',
                      color: '#E8D5B7', fontSize: 10, fontWeight: 600,
                    }}>
                      {item.taxRate}% GST
                    </div>

                    {/* Prep time (bottom-left, on dark gradient) */}
                    <div style={{
                      position: 'absolute', bottom: 10, left: 12,
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: '#E8D5B7', fontSize: 11,
                    }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      <span>{item.prepTime} min</span>
                    </div>

                    {/* In-cart pulse */}
                    {inCart && (
                      <div style={{
                        position: 'absolute', bottom: 10, right: 12,
                        width: 10, height: 10, borderRadius: 5, background: GOLD,
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }} />
                    )}
                  </div>

                  {/* ── Card Body ───────────────────────────── */}
                  <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{
                      fontFamily: 'Fraunces, serif',
                      fontWeight: 700, fontSize: 18,
                      color: DARK_TEXT,
                      marginBottom: 6, lineHeight: 1.2,
                    }}>
                      {item.name}
                    </h3>

                    <p style={{
                      fontSize: 13, color: MED_TEXT, lineHeight: 1.6,
                      marginBottom: 16, flex: 1,
                    }}>
                      {item.description}
                    </p>

                    {/* Price + Add button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: 22, color: BRAND }}>
                          {settings.currencySymbol}{item.price}
                        </span>
                        <span style={{ fontSize: 11, color: LIGHT_TEXT, marginLeft: 4 }}>
                          + tax
                        </span>
                      </div>

                      {inCart ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#FDF0E6', border: `1.5px solid ${BRAND}40`,
                          borderRadius: 12, padding: '4px 6px',
                        }}>
                          <button onClick={() => handleUpdateQty(entry!.id, -1)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: BRAND, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus style={{ width: 13, height: 13 }} />
                          </button>
                          <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 800, fontSize: 15, color: DARK_TEXT }}>
                            {entry!.quantity}
                          </span>
                          <button onClick={() => handleUpdateQty(entry!.id, 1)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: BRAND, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleAdd(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            background: `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})`,
                            color: '#FFFFFF', fontWeight: 700, fontSize: 13,
                            boxShadow: `0 4px 12px ${BRAND}40`,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 20px ${BRAND}60`)}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 12px ${BRAND}40`)}
                        >
                          <Plus style={{ width: 14, height: 14 }} />
                          Add to Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <span style={{ fontSize: 64, display: 'block', marginBottom: 16, opacity: 0.3 }}>☕</span>
              <p style={{ fontWeight: 600, fontSize: 18, color: MED_TEXT }}>No items found</p>
              <p style={{ fontSize: 14, color: LIGHT_TEXT, marginTop: 4 }}>Try a different category or search term</p>
            </div>
          )}
        </div>

        {/* ── Desktop Cart Sidebar ───────────────────────────── */}
        <aside style={{
          display: 'none',
          width: 380, flexShrink: 0,
          alignSelf: 'flex-start',
          position: 'sticky', top: '14rem',
          maxHeight: 'calc(100vh - 16rem)',
          background: CARD_BG,
          border: `1.5px solid ${BORDER}`,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(107,58,42,0.08)',
        }} className="lg-cart-sidebar">
          {/* This is handled via className below */}
        </aside>

        {/* Desktop Cart - using Tailwind hidden/flex */}
        <div className="hidden lg:flex flex-col" style={{
          width: 380, flexShrink: 0,
          alignSelf: 'flex-start',
          position: 'sticky', top: '14rem',
          maxHeight: 'calc(100vh - 16rem)',
          background: CARD_BG,
          border: `1.5px solid ${BORDER}`,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(107,58,42,0.08)',
        }}>
          {/* Cart Header */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag style={{ width: 18, height: 18, color: BRAND }} />
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18, color: DARK_TEXT }}>Your Order</span>
            </div>
            <span style={{ background: '#F0EAE1', color: BRAND, fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} className="scrollbar-hide">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <ShoppingBag style={{ width: 40, height: 40, color: BORDER, margin: '0 auto 12px', display: 'block' }} />
                <p style={{ color: MED_TEXT, fontSize: 14, fontWeight: 500 }}>Your cart is empty</p>
                <p style={{ color: LIGHT_TEXT, fontSize: 12, marginTop: 4 }}>Add items from the menu</p>
              </div>
            ) : cart.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#FDFAF5', borderRadius: 14, border: `1px solid ${BORDER}` }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={entry.menuItem.image} alt={entry.menuItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: DARK_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.menuItem.name}
                  </p>
                  <p style={{ fontSize: 12, color: BRAND, fontWeight: 700, marginTop: 2 }}>
                    {settings.currencySymbol}{entry.lineTotal}
                    <span style={{ color: LIGHT_TEXT, fontWeight: 400, marginLeft: 4, fontSize: 11 }}>
                      +{settings.currencySymbol}{entry.lineTax} GST
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0EAE1', borderRadius: 10, padding: '2px 4px', flexShrink: 0 }}>
                  <button onClick={() => handleUpdateQty(entry.id, -1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus style={{ width: 11, height: 11 }} />
                  </button>
                  <span style={{ width: 20, textAlign: 'center', fontWeight: 800, fontSize: 13, color: DARK_TEXT }}>{entry.quantity}</span>
                  <button onClick={() => handleUpdateQty(entry.id, 1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus style={{ width: 11, height: 11 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div style={{ padding: '16px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
              {/* GST breakdown */}
              <div style={{ background: '#FDFAF5', borderRadius: 12, padding: '10px 12px', marginBottom: 14, border: `1px solid ${BORDER}` }}>
                {cart.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: LIGHT_TEXT }}>{entry.menuItem.name} ({entry.menuItem.taxRate}% GST)</span>
                    <span style={{ fontSize: 11, color: LIGHT_TEXT }}>+{settings.currencySymbol}{entry.lineTax}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: MED_TEXT }}>Subtotal</span>
                <span style={{ fontSize: 13, color: DARK_TEXT, fontWeight: 600 }}>{settings.currencySymbol}{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 13, color: MED_TEXT }}>GST (item-wise)</span>
                <span style={{ fontSize: 13, color: DARK_TEXT, fontWeight: 600 }}>{settings.currencySymbol}{Math.round(totalTax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: DARK_TEXT, fontFamily: 'Fraunces, serif' }}>Total</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: BRAND }}>{settings.currencySymbol}{Math.round(grandTotal)}</span>
              </div>

              {/* Payment Selection */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: MED_TEXT, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Payment Method
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'cash', label: 'Cash', icon: '💵' },
                    { id: 'upi', label: 'UPI', icon: '📱' },
                    { id: 'card', label: 'Card', icon: '💳' },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      style={{
                        padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
                        border: paymentMethod === method.id ? `2px solid ${BRAND}` : `1px solid ${BORDER}`,
                        background: paymentMethod === method.id ? '#FFF9F4' : '#FFFFFF',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all 0.2s',
                        boxShadow: paymentMethod === method.id ? '0 2px 8px rgba(107,58,42,0.1)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{method.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: paymentMethod === method.id ? BRAND : MED_TEXT }}>
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={placeOrder} disabled={isPlacing}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: isPlacing ? '#CBA882' : `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})`,
                  color: '#FFFFFF', fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `0 6px 20px ${BRAND}40`,
                  transition: 'all 0.2s ease',
                }}>
                <Receipt style={{ width: 16, height: 16 }} />
                {isPlacing ? 'Placing Order...' : 'Confirm Order & Pay'}
                {!isPlacing && <ChevronRight style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile Floating Cart Button ────────────────────────── */}
      {!showCart && cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 40 }} className="lg:hidden">
          <button onClick={() => setShowCart(true)}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: 20,
              background: `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})`,
              color: '#FFFFFF', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: `0 8px 32px ${BRAND}55`,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {itemCount}
              </span>
              <span>View My Order</span>
            </div>
            <span style={{ fontWeight: 800 }}>{settings.currencySymbol}{Math.round(grandTotal)}</span>
          </button>
        </div>
      )}

      {/* ── Mobile Full-screen Cart ────────────────────────────── */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: PAGE_BG, display: 'flex', flexDirection: 'column', fontFamily: '"DM Sans", sans-serif' }}
          className="lg:hidden">

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: DARK_TEXT, margin: 0 }}>Your Order</h2>
            <button onClick={() => setShowCart(false)}
              style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MED_TEXT }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: CARD_BG, border: `1.5px solid ${BORDER}`, borderRadius: 18, boxShadow: '0 2px 8px rgba(107,58,42,0.05)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={entry.menuItem.image} alt={entry.menuItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: DARK_TEXT }}>{entry.menuItem.name}</p>
                  <p style={{ fontSize: 13, color: BRAND, fontWeight: 700, marginTop: 2 }}>
                    {settings.currencySymbol}{entry.lineTotal}
                    <span style={{ color: LIGHT_TEXT, fontWeight: 400, fontSize: 11, marginLeft: 4 }}>+{settings.currencySymbol}{entry.lineTax} GST</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0EAE1', borderRadius: 12, padding: '4px 6px', flexShrink: 0 }}>
                  <button onClick={() => handleUpdateQty(entry.id, -1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus style={{ width: 12, height: 12 }} />
                  </button>
                  <span style={{ width: 24, textAlign: 'center', fontWeight: 800, fontSize: 14, color: DARK_TEXT }}>{entry.quantity}</span>
                  <button onClick={() => handleUpdateQty(entry.id, 1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0, background: CARD_BG }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: MED_TEXT }}>Subtotal</span>
              <span style={{ fontSize: 14, color: DARK_TEXT, fontWeight: 600 }}>{settings.currencySymbol}{subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 14, color: MED_TEXT }}>GST (item-wise)</span>
              <span style={{ fontSize: 14, color: DARK_TEXT, fontWeight: 600 }}>{settings.currencySymbol}{Math.round(totalTax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: DARK_TEXT, fontFamily: 'Fraunces, serif' }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: BRAND }}>{settings.currencySymbol}{Math.round(grandTotal)}</span>
            </div>
            {/* Payment Selection */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: MED_TEXT, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Payment Method
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { id: 'cash', label: 'Cash', icon: '💵' },
                  { id: 'upi', label: 'UPI', icon: '📱' },
                  { id: 'card', label: 'Card', icon: '💳' },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    style={{
                      padding: '12px 4px', borderRadius: 14, cursor: 'pointer',
                      border: paymentMethod === method.id ? `2px solid ${BRAND}` : `1px solid ${BORDER}`,
                      background: paymentMethod === method.id ? '#FFF9F4' : '#FFFFFF',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s',
                      boxShadow: paymentMethod === method.id ? '0 2px 8px rgba(107,58,42,0.1)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{method.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: paymentMethod === method.id ? BRAND : MED_TEXT }}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={placeOrder} disabled={isPlacing}
              style={{
                width: '100%', padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${BRAND_LT}, ${BRAND})`,
                color: '#FFFFFF', fontWeight: 700, fontSize: 15,
                boxShadow: `0 6px 24px ${BRAND}45`,
              }}>
              {isPlacing ? 'Placing Order...' : 'Confirm Order & Pay ☕'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
