// ============================================================
// Café POS — Self-Ordering (Customer Flow — No Payment)
// ============================================================
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  useProductStore, useTableStore, useOrderStore,
  useSettingsStore, useKDSStore
} from '../store';
import { api } from '../utils/api';
import {
  ShoppingBag, Plus, Minus, X, CheckCircle,
  Coffee, ChevronLeft, Search, Tag
} from 'lucide-react';
import type { OrderLine } from '../types';

type CartItem = OrderLine & { productEmoji: string };

export default function SelfOrder() {
  const { tableId } = useParams();
  const { categories, products } = useProductStore();
  const { tables } = useTableStore();
  const { addOrder, orders } = useOrderStore();
  const { addTicket } = useKDSStore();
  const { settings } = useSettingsStore();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const table = tables.find(t => t.id === tableId);
  const effectiveTable = table || tables[0];

  const filteredProducts = useMemo(() =>
    products.filter(p => {
      const catMatch = activeCategory === 'all' || p.categoryId === activeCategory;
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return p.available && catMatch && searchMatch;
    }),
    [products, activeCategory, searchQuery]
  );

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(subtotal * settings.taxRate / 100);
  const total = subtotal + taxAmount;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleAdd = (product: typeof products[0]) => {
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      setCart(cart.map(i => i.productId === product.id
        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
        : i
      ));
    } else {
      setCart([...cart, {
        id: `line-${Date.now()}`,
        orderId: '',
        productId: product.id,
        productName: product.name,
        productEmoji: product.image,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        notes: '',
        status: 'pending',
      }]);
    }
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(cart
      .map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta), total: Math.max(0, i.quantity + delta) * i.unitPrice } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0 || isPlacing) return;
    setIsPlacing(true);

    try {
      // Generate unique order ID from backend
      let orderNumber = '';
      try {
        const result = await api.generateOrderId();
        orderNumber = result.orderId;
      } catch {
        // Fallback: local generation
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        orderNumber = 'CF-' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      }

      const orderId = `ord-so-${Date.now()}`;
      const tableRef = effectiveTable;

      addOrder({
        id: orderId,
        orderNumber,
        tableId: tableId || 'counter',
        tableName: tableRef ? `Table ${tableRef.number}` : 'Counter',
        employeeId: 'system',
        employeeName: 'Self-Order',
        status: 'confirmed',
        lines: cart,
        subtotal,
        tax: taxAmount,
        taxRate: settings.taxRate,
        discount: 0,
        total,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      addTicket({
        id: `kds-${orderId}`,
        orderId,
        orderNumber,
        tableName: tableRef ? `Table ${tableRef.number}` : 'Counter',
        items: cart.map(l => ({ name: l.productName, quantity: l.quantity, notes: l.notes, status: 'queued' })),
        status: 'queued',
        createdAt: new Date().toISOString(),
        priority: 'normal',
      });

      setPlacedOrderNumber(orderNumber);
      setOrderPlaced(true);
      setShowCart(false);
    } finally {
      setIsPlacing(false);
    }
  };

  // ── ORDER PLACED SCREEN (with QR) ─────────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-surface-100 to-surface-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-200/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-sm w-full">

          {/* Success icon */}
          <div className="w-20 h-20 bg-accent-500/15 border-2 border-accent-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-accent-600" />
          </div>

          <h1 className="text-3xl font-bold text-surface-900 mb-2 font-display">Order Placed! ☕</h1>
          <p className="text-surface-600 text-sm mb-6 leading-relaxed italic">
            Where Comfort Meets Flavor — Your order is on its way!
          </p>

          {/* Order number card */}
          <div className="bg-white border border-primary-200 rounded-2xl p-5 mb-5 shadow-solid">
            <p className="text-surface-500 text-xs uppercase tracking-wider mb-1">Your Order Number</p>
            <p className="text-4xl font-bold text-primary-600 font-mono tracking-widest mb-2">{placedOrderNumber}</p>
            <p className="text-surface-400 text-xs">
              🪑 {effectiveTable ? `Table ${effectiveTable.number}` : 'Counter'} &bull; ☕ Payment at counter
            </p>
          </div>

          {/* QR Code section */}
          <div className="bg-white border border-surface-300 rounded-2xl p-5 mb-5 shadow-solid">
            <p className="text-surface-600 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
              <span>📱</span> Scan to Track Your Order
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl border-2 border-primary-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(placedOrderNumber)}&bgcolor=ffffff&color=6E4F30&qzone=1`}
                  alt={`QR for order ${placedOrderNumber}`}
                  className="w-40 h-40 object-contain"
                />
              </div>
            </div>
            <p className="text-surface-400 text-xs mt-3">Show this QR at the counter to track your order status</p>
          </div>

          {/* What's next */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-primary-700 text-sm font-semibold mb-1">🌿 What's next?</p>
            <p className="text-surface-600 text-xs leading-relaxed">
              Sit back and relax! Your order has been sent to the kitchen. A staff member will bring it to your table.
            </p>
          </div>

          <button
            onClick={() => { setOrderPlaced(false); setCart([]); setShowCart(false); }}
            className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors text-sm shadow-solid"
          >
            ☕ Order More Items
          </button>
        </div>
      </div>
    );
  }

  // ── ORDER PAGE ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-100/95 backdrop-blur border-b border-surface-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500/15 border border-primary-500/30 rounded-xl flex items-center justify-center">
              <Coffee className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-bold text-surface-900 text-sm">{settings.restaurantName}</p>
              <p className="text-surface-400 text-xs">{effectiveTable ? `Table ${effectiveTable.number}` : 'Self Order'}</p>
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="bg-surface-100/30 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-50 text-surface-600 hover:text-surface-900 hover:bg-surface-200'
              }`}
            >
              All Items
            </button>
            {categories.filter(c => c.active).map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-50 text-surface-600 hover:text-surface-900 hover:bg-surface-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex gap-6">

        {/* Product Grid */}
        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-300 rounded-xl text-surface-900 placeholder-gray-600 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const cartItem = cart.find(i => i.productId === product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white border border-surface-300 hover:border-primary-500/30 rounded-xl overflow-hidden transition-all group"
                >
                  <div className="aspect-square bg-surface-50 flex items-center justify-center text-5xl relative">
                    {product.image}
                    {product.tags.includes('bestseller') && (
                      <span className="absolute top-2 left-2 bg-primary-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-surface-900 text-sm leading-tight mb-1">{product.name}</h3>
                    <p className="text-surface-400 text-xs line-clamp-2 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-600 font-bold text-sm">
                        {settings.currencySymbol}{product.price.toFixed(0)}
                      </span>
                      {cartItem ? (
                        <div className="flex items-center gap-1 bg-surface-50 rounded-lg p-0.5">
                          <button
                            onClick={() => handleUpdateQty(cartItem.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-surface-600 hover:text-surface-900 hover:bg-surface-200 rounded-md transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-surface-900 text-xs font-bold w-5 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(cartItem.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-surface-600 hover:text-surface-900 hover:bg-surface-200 rounded-md transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAdd(product)}
                          className="w-7 h-7 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-surface-400">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm mt-1">Try a different category or search term</p>
            </div>
          )}
        </div>

        {/* Desktop Cart Sidebar */}
        <div className="hidden lg:flex flex-col w-80 bg-white border border-surface-300 rounded-2xl self-start sticky top-36 max-h-[calc(100vh-10rem)] overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-300 flex items-center justify-between">
            <h2 className="font-bold text-surface-900">Your Order</h2>
            <span className="text-xs text-surface-500">{itemCount} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-surface-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Your cart is empty</p>
                <p className="text-xs mt-1">Add items from the menu</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className="w-10 h-10 bg-surface-200 rounded-lg flex items-center justify-center text-xl shrink-0">
                    {item.productEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-900 text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-primary-600 text-xs font-semibold mt-0.5">
                      {settings.currencySymbol}{(item.unitPrice * item.quantity).toFixed(0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-200 rounded-lg p-0.5 shrink-0">
                    <button onClick={() => handleUpdateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-surface-600 hover:text-surface-900 rounded transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-surface-900 text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-surface-600 hover:text-surface-900 rounded transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-surface-300">
              <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex justify-between text-surface-500">
                  <span>Subtotal</span>
                  <span>{settings.currencySymbol}{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span>Tax ({settings.taxRate}%)</span>
                  <span>{settings.currencySymbol}{taxAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-surface-900 font-bold text-lg pt-2 border-t border-surface-300 mt-2">
                  <span>Total</span>
                  <span className="text-primary-600">{settings.currencySymbol}{total.toFixed(0)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={isPlacing}
                className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm"
              >
                {isPlacing ? 'Placing Order...' : 'Confirm Order'}
              </button>
              <p className="text-center text-surface-400 text-xs mt-3">Payment collected by staff at counter</p>
            </div>
          )}
        </div>
      </main>

      {/* Mobile floating cart button */}
      {!showCart && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-30">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-primary-500 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-5 shadow-2xl shadow-primary-500/30 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-surface-100/20 rounded-full flex items-center justify-center font-bold text-sm">{itemCount}</span>
              <span>View Cart</span>
            </div>
            <span>{settings.currencySymbol}{total.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Sheet */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-surface-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-300">
            <h2 className="text-lg font-bold text-surface-900">Your Order</h2>
            <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center text-surface-500 hover:text-surface-900 bg-surface-50 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-surface-300">
                <div className="w-12 h-12 bg-surface-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  {item.productEmoji}
                </div>
                <div className="flex-1">
                  <p className="text-surface-900 font-semibold text-sm">{item.productName}</p>
                  <p className="text-primary-600 text-sm font-bold mt-0.5">
                    {settings.currencySymbol}{(item.unitPrice * item.quantity).toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-surface-50 rounded-xl p-1">
                  <button onClick={() => handleUpdateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-surface-600 hover:text-surface-900 rounded-lg transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-surface-900 text-sm font-bold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => handleUpdateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-surface-600 hover:text-surface-900 rounded-lg transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 border-t border-surface-300">
            <div className="space-y-1.5 mb-4 text-sm">
              <div className="flex justify-between text-surface-500">
                <span>Subtotal</span>
                <span>{settings.currencySymbol}{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-surface-500">
                <span>Tax ({settings.taxRate}%)</span>
                <span>{settings.currencySymbol}{taxAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-surface-900 font-bold text-xl pt-2 border-t border-surface-300 mt-2">
                <span>Total</span>
                <span className="text-primary-600">{settings.currencySymbol}{total.toFixed(0)}</span>
              </div>
            </div>
            <button
              onClick={placeOrder}
              disabled={isPlacing}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-2xl text-base transition-colors"
            >
              {isPlacing ? 'Placing Order...' : 'Confirm Order'}
            </button>
            <p className="text-center text-surface-400 text-xs mt-3">Payment handled at counter by staff</p>
          </div>
        </div>
      )}
    </div>
  );
}
