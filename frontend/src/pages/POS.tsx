// ============================================================
// Café POS — POS Terminal (Employee View — Payment Prominent)
// ============================================================
import { useState, useMemo } from 'react';
import {
  useProductStore, useOrderStore, useAuthStore,
  useSettingsStore, useCustomerStore, useCouponStore, usePaymentStore
} from '../store';
import { api } from '../utils/api';
import { Product, OrderLine, Order } from '../types';
import {
  ShoppingCart, Search, Trash2, Plus, Minus, CreditCard,
  Users, Tag, CheckCircle, X, ChevronDown, Gift
} from 'lucide-react';

export default function POS() {
  const { products, categories } = useProductStore();
  const { addOrder, orders } = useOrderStore();
  const { currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const { customers } = useCustomerStore();
  const { validateCoupon } = useCouponStore();
  const { addPayment } = usePaymentStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount: number; message: string; code?: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [earnedCoupons, setEarnedCoupons] = useState<any[]>([]);
  const [showEarnedModal, setShowEarnedModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const filteredProducts = useMemo(() =>
    products.filter(p => {
      const catMatch = activeCategory === 'all' || p.categoryId === activeCategory;
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch && p.available;
    }),
    [products, activeCategory, searchQuery]
  );

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const couponDiscount = couponResult?.valid ? (couponResult.discount || 0) : 0;
  const tax = Math.round((subtotal - couponDiscount) * (settings.taxRate / 100));
  const total = subtotal - couponDiscount + tax;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
          : i
        );
      }
      return [...prev, {
        id: `line-${Date.now()}`,
        orderId: '',
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        notes: '',
        status: 'pending',
      }];
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id));
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty, total: qty * i.unitPrice } : i));
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setCouponResult(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await api.validateCoupon(couponCode.trim(), subtotal);
      setCouponResult({
        valid: result.valid,
        discount: result.discount || 0,
        message: result.message,
        code: result.valid ? result.coupon?.code : undefined,
      });
    } catch {
      // Fallback to local validation
      const local = validateCoupon(couponCode.trim(), subtotal);
      setCouponResult({
        valid: local.valid,
        discount: local.discount || 0,
        message: local.message,
        code: local.valid ? local.coupon?.code : undefined,
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const processPayment = async (method: 'cash' | 'card' | 'upi') => {
    if (processingPayment) return;
    setProcessingPayment(true);
    const customer = customers.find(c => c.id === selectedCustomer);

    // Generate unique order ID from backend
    let orderNumber = '';
    try {
      const result = await api.generateOrderId();
      orderNumber = result.orderId;
    } catch {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      orderNumber = 'CF-' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    const orderId = `ord-pos-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      tableId: 'counter',
      tableName: 'POS Counter',
      employeeId: currentUser?.id || 'system',
      employeeName: currentUser?.name || 'Staff',
      customerId: customer?.id,
      customerName: customer?.name,
      status: 'paid',
      lines: cart,
      subtotal,
      tax,
      taxRate: settings.taxRate,
      discount: couponDiscount,
      total,
      couponCode: couponResult?.valid ? couponResult.code : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    addOrder(newOrder);

    addPayment({
      id: `pmt-${Date.now()}`,
      orderId,
      method,
      amount: total,
      paidAt: new Date().toISOString(),
    });

    // Check if customer earned coupons
    if (customer) {
      try {
        const earnResult = await api.earnCoupon(customer.id, total, customer.name);
        if (earnResult.earnedCoupons && earnResult.earnedCoupons.length > 0) {
          setEarnedCoupons(earnResult.earnedCoupons);
          setShowEarnedModal(true);
        }
      } catch {
        // Silently ignore coupon earning errors
      }
    }

    clearCart();
    setPaymentModalOpen(false);
    setSelectedCustomer('');
    setProcessingPayment(false);
  };

  return (
    <div className="flex h-full gap-4 animate-fade-in">

      {/* ── Left: Product Catalog ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide shrink-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all' ? 'bg-primary-500 text-white' : 'bg-surface-50 text-surface-600 hover:text-surface-900'
            }`}
          >
            All Items
          </button>
          {categories.filter(c => c.active).map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-surface-50 text-surface-600 hover:text-surface-900'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 placeholder-surface-400 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
          />
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.productId === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white hover:bg-red-50 border border-surface-200 hover:border-primary-500/40 rounded-xl p-3 text-left transition-all group relative"
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-primary-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {inCart.quantity}
                    </span>
                  )}
                  <div className="w-14 h-14 mb-3 rounded-lg overflow-hidden flex items-center justify-center bg-surface-200 text-4xl group-hover:scale-110 transition-transform duration-200">
                    {product.image.startsWith('http') ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      product.image
                    )}
                  </div>
                  <p className="font-semibold text-surface-900 text-sm leading-tight mb-1 truncate">{product.name}</p>
                  <p className="text-primary-600 font-bold text-sm">{settings.currencySymbol}{product.price.toFixed(0)}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Cart / Receipt ───────────────────────────────── */}
      <div className="w-80 xl:w-96 shrink-0 flex flex-col h-full bg-white border border-surface-300 rounded-2xl overflow-hidden">

        {/* Cart header */}
        <div className="px-4 py-3.5 border-b border-surface-300 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 text-surface-900 font-bold">
            <ShoppingCart className="w-4 h-4 text-primary-600" />
            <span>Current Order</span>
          </div>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Customer selector */}
        <div className="px-4 py-2.5 border-b border-surface-300 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-surface-400 shrink-0" />
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="bg-transparent text-sm text-surface-700 outline-none w-full cursor-pointer"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-surface-400 py-10">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs mt-1 opacity-70">Click products to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-300">
                <div className="flex-1 min-w-0">
                  <p className="text-surface-900 text-sm font-semibold truncate">{item.productName}</p>
                  <p className="text-surface-500 text-xs mt-0.5">{settings.currencySymbol}{item.unitPrice.toFixed(0)} each</p>
                </div>
                <div className="flex items-center gap-1 bg-surface-200 rounded-lg p-0.5 shrink-0">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-surface-600 hover:text-surface-900 rounded-md transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-surface-900 text-xs font-bold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-surface-600 hover:text-surface-900 rounded-md transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-primary-600 font-bold text-sm shrink-0 w-14 text-right">{settings.currencySymbol}{item.total.toFixed(0)}</span>
              </div>
            ))
          )}
        </div>

        {/* Coupon input */}
        {cart.length > 0 && (
          <div className="px-3 pb-2 border-t border-surface-300 pt-3 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                  className="w-full pl-8 pr-3 py-2 bg-surface-50 border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 text-xs focus:outline-none focus:border-primary-500/50 transition-colors uppercase"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-3 py-2 bg-surface-200 hover:bg-gray-600 disabled:opacity-40 text-surface-900 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
            {couponResult && (
              <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${couponResult.valid ? 'text-accent-600' : 'text-red-400'}`}>
                {couponResult.valid ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {couponResult.message}
              </p>
            )}
          </div>
        )}

        {/* ── Payment Summary ── */}
        <div className="p-4 border-t border-surface-300 bg-white shrink-0">
          {cart.length > 0 && (
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-surface-500 text-xs">
                <span>Subtotal</span>
                <span>{settings.currencySymbol}{subtotal.toFixed(0)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-accent-600 text-xs">
                  <span>Coupon Discount</span>
                  <span>-{settings.currencySymbol}{couponDiscount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-surface-500 text-xs">
                <span>Tax ({settings.taxRate}%)</span>
                <span>{settings.currencySymbol}{tax.toFixed(0)}</span>
              </div>
              <div className="pt-2 border-t border-surface-300 mt-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-surface-600 text-sm font-semibold">Amount Due</span>
                  <span className="text-3xl font-bold text-primary-600">{settings.currencySymbol}{total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}
          {cart.length === 0 ? (
            <button disabled className="w-full py-4 bg-surface-200 text-surface-500 font-bold rounded-xl text-sm transition-all">
              Add Items to Cart
            </button>
          ) : (
            <div className="mt-4 border-t border-surface-300 pt-4">
              {!showQR ? (
                <>
                  <p className="text-surface-500 text-xs font-semibold uppercase tracking-wider mb-2">Select Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { method: 'cash' as const, label: 'Cash', emoji: '💵', color: 'hover:border-accent-500/60 hover:bg-accent-500/5' },
                      { method: 'card' as const, label: 'Card', emoji: '💳', color: 'hover:border-blue-500/60 hover:bg-blue-500/5' },
                      { method: 'upi' as const, label: 'UPI', emoji: '📱', color: 'hover:border-purple-500/60 hover:bg-purple-500/5' },
                    ].map(({ method, label, emoji, color }) => (
                      <button
                        key={method}
                        onClick={() => method === 'upi' ? setShowQR(true) : processPayment(method)}
                        disabled={processingPayment}
                        className={`flex flex-col items-center justify-center gap-1 p-2 bg-surface-50 border border-surface-300 ${color} rounded-xl transition-all disabled:opacity-50`}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-surface-900 font-semibold text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center animate-fade-in">
                  <div className="bg-white p-2 rounded-xl inline-block mx-auto mb-2 border border-surface-300">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=cafe@upi&pn=CafePos&am=${total.toFixed(0)}`}
                      alt="UPI QR" 
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowQR(false)}
                      className="py-2.5 px-3 bg-surface-200 hover:bg-surface-300 text-surface-900 font-medium rounded-xl transition-colors text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => { setShowQR(false); processPayment('upi'); }}
                      disabled={processingPayment}
                      className="flex-1 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      {processingPayment ? '...' : 'Confirm Paid'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      {/* ── Earned Coupons Modal ───────────────────────────────── */}
      {showEarnedModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-primary-500/30 rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-500/15 border border-primary-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 mb-2">Coupons Earned!</h3>
            <p className="text-surface-500 text-sm mb-5">Customer earned the following coupons for their next visit:</p>
            <div className="space-y-2 mb-6">
              {earnedCoupons.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-50 border border-primary-500/20 rounded-xl">
                  <code className="text-primary-600 font-mono font-bold tracking-wider text-sm">{c.code}</code>
                  <span className="text-surface-600 text-xs">{c.description}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowEarnedModal(false); setEarnedCoupons([]); }}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}