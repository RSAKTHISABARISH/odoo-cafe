// ============================================================
// Velora Café — Products & Categories Management
// Shows the 10 official café menu items with real photos
// ============================================================
import { useState } from 'react';
import { useProductStore, useSettingsStore } from '../store';
import { Search, Plus, Edit2, Trash2, Package, Tag, X, Star, Flame, Clock } from 'lucide-react';
import type { Product, Category } from '../types';

// ── Official Velora Café Menu ────────────────────────────────
const OFFICIAL_MENU = [
  {
    id: 'off-espresso',
    name: 'Espresso',
    price: 120,
    taxRate: 10,
    category: 'Hot Drinks',
    catId: 'cat-hotdrink',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=700&q=85',
    description: 'Rich, bold single-origin espresso with a smooth golden crema. The perfect pick-me-up.',
    badge: 'Bestseller',
    prepTime: 3,
    tags: ['hot', 'bestseller', 'caffeine'],
  },
  {
    id: 'off-cappuccino',
    name: 'Cappuccino',
    price: 150,
    taxRate: 6,
    category: 'Hot Drinks',
    catId: 'cat-hotdrink',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=700&q=85',
    description: 'Espresso crowned with velvety steamed milk and a thick layer of dense, creamy foam.',
    badge: 'Popular',
    prepTime: 4,
    tags: ['hot', 'popular', 'milk'],
  },
  {
    id: 'off-latte',
    name: 'Latte',
    price: 160,
    taxRate: 5,
    category: 'Hot Drinks',
    catId: 'cat-hotdrink',
    image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=700&q=85',
    description: 'Silky espresso layered with steamed milk and delicate latte art on top.',
    badge: null,
    prepTime: 4,
    tags: ['hot', 'milk', 'smooth'],
  },
  {
    id: 'off-tea',
    name: 'Tea',
    price: 80,
    taxRate: 7,
    category: 'Hot Drinks',
    catId: 'cat-hotdrink',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=85',
    description: 'Premium whole-leaf tea steeped to perfection, served piping hot with warmth and character.',
    badge: null,
    prepTime: 5,
    tags: ['hot', 'herbal', 'light'],
  },
  {
    id: 'off-cold-coffee',
    name: 'Cold Coffee',
    price: 180,
    taxRate: 5,
    category: 'Cold Drinks',
    catId: 'cat-colddrink',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=85',
    description: '16-hour cold-steeped coffee poured over ice — naturally sweet, smooth and refreshing.',
    badge: 'Bestseller',
    prepTime: 2,
    tags: ['cold', 'bestseller', 'iced'],
  },
  {
    id: 'off-juice',
    name: 'Juice & Smoothies',
    price: 170,
    taxRate: 3,
    category: 'Cold Drinks',
    catId: 'cat-colddrink',
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=700&q=85',
    description: 'Freshly blended seasonal fruits and vegetables, no added sugar or preservatives. Pure goodness.',
    badge: 'New',
    prepTime: 5,
    tags: ['cold', 'healthy', 'fresh'],
  },
  {
    id: 'off-sandwich',
    name: 'Sandwich',
    price: 150,
    taxRate: 9,
    category: 'Food',
    catId: 'cat-food',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=85',
    description: 'Grilled sourdough loaded with premium fillings, fresh herbs, and our signature house sauce.',
    badge: 'Popular',
    prepTime: 8,
    tags: ['food', 'grilled', 'popular'],
  },
  {
    id: 'off-burger',
    name: 'Burger',
    price: 200,
    taxRate: 5,
    category: 'Food',
    catId: 'cat-food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=85',
    description: 'Juicy patty with fresh lettuce, ripe tomato, aged cheese and our special secret sauce.',
    badge: 'Bestseller',
    prepTime: 12,
    tags: ['food', 'bestseller', 'hearty'],
  },
  {
    id: 'off-pizza',
    name: 'Pizza',
    price: 250,
    taxRate: 5,
    category: 'Food',
    catId: 'cat-food',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=85',
    description: 'Stone-baked thin crust topped with hand-crushed tomato, fresh mozzarella and basil.',
    badge: null,
    prepTime: 18,
    tags: ['food', 'stone-baked', 'sharing'],
  },
  {
    id: 'off-pastries',
    name: 'Pastries & Cakes',
    price: 140,
    taxRate: 2,
    category: 'Pastries & Cakes',
    catId: 'cat-bakes',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=85',
    description: 'Freshly baked daily — buttery croissants, muffins, and our signature celebration cakes.',
    badge: 'Popular',
    prepTime: 2,
    tags: ['baked', 'sweet', 'daily fresh'],
  },
];

const BADGE_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  'Bestseller': { bg: '#C4862A', color: '#fff', icon: '⭐' },
  'Popular':    { bg: '#6B3A2A', color: '#fff', icon: '🔥' },
  'New':        { bg: '#16A34A', color: '#fff', icon: '✦' },
};

const CATEGORIES = [
  { id: 'all',            label: 'All Items',       icon: '🍽️' },
  { id: 'cat-hotdrink',  label: 'Hot Drinks',       icon: '☕' },
  { id: 'cat-colddrink', label: 'Cold Drinks',       icon: '🥤' },
  { id: 'cat-food',      label: 'Food',              icon: '🍔' },
  { id: 'cat-bakes',     label: 'Pastries & Cakes',  icon: '🥐' },
];

export default function Products() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory } = useProductStore();
  const { settings } = useSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sym = settings.currencySymbol;

  // Filter from official menu
  const filtered = OFFICIAL_MENU.filter(item => {
    const catMatch = selectedCategory === 'all' || item.catId === selectedCategory;
    const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return catMatch && searchMatch;
  });

  const inputCls = 'w-full px-3 py-2.5 bg-white border-2 border-red-100 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-primary-500 transition-colors';

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-500 text-sm mt-1">{OFFICIAL_MENU.length} items across 4 categories • Velora Café Official Menu</p>
        </div>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl font-semibold transition-all shadow-solid hover:shadow-solid-hover text-sm"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-red-100 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white border-transparent shadow-solid'
                  : 'bg-white text-gray-600 border-red-100 hover:border-primary-300 hover:text-gray-900'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(item => {
          const isHovered = hoveredId === item.id;
          const badge = item.badge ? BADGE_STYLES[item.badge] : null;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                overflow: 'hidden',
                border: `1.5px solid ${isHovered ? '#6B3A2A' : '#EDE3D6'}`,
                boxShadow: isHovered ? '0 12px 40px rgba(107,58,42,0.18)' : '0 3px 12px rgba(107,58,42,0.08)',
                transition: 'all 0.28s ease',
                display: 'flex',
                flexDirection: 'column',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              {/* ── Photo ───────────────────────────────────── */}
              <div style={{ position: 'relative', height: 230, overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                  }}
                />
                {/* Bottom gradient */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, background: 'linear-gradient(to top, rgba(26,15,0,0.7), transparent)' }} />

                {/* Badge */}
                {badge && (
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: badge.bg, color: badge.color,
                    borderRadius: 20, padding: '4px 11px',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  }}>
                    <span style={{ fontSize: 12 }}>{badge.icon}</span>
                    {item.badge}
                  </div>
                )}

                {/* Tax chip */}
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(26,15,0,0.65)', backdropFilter: 'blur(4px)',
                  color: '#E8D5B7', borderRadius: 8, padding: '4px 9px',
                  fontSize: 10, fontWeight: 600,
                }}>
                  {item.taxRate}% GST
                </div>

                {/* Prep time (bottom-left on gradient) */}
                <div style={{
                  position: 'absolute', bottom: 10, left: 14,
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: '#E8D5B7', fontSize: 11,
                }}>
                  <Clock size={11} />
                  <span>{item.prepTime} min</span>
                </div>

                {/* Category badge (bottom-right) */}
                <div style={{
                  position: 'absolute', bottom: 10, right: 12,
                  background: 'rgba(196,134,42,0.9)', color: '#fff',
                  borderRadius: 6, padding: '3px 8px',
                  fontSize: 10, fontWeight: 600,
                }}>
                  {CATEGORIES.find(c => c.id === item.catId)?.icon} {item.category}
                </div>
              </div>

              {/* ── Card Body ───────────────────────────────── */}
              <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{
                  fontFamily: '"Lucida Calligraphy", cursive',
                  fontWeight: 700, fontSize: 19, fontStyle: 'italic',
                  color: '#1A0F00', marginBottom: 6, lineHeight: 1.2,
                }}>
                  {item.name}
                </h3>
                <p style={{
                  fontSize: 13, color: '#5C3D1E', lineHeight: 1.65,
                  marginBottom: 14, flex: 1,
                }}>
                  {item.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                  {item.tags.map(tag => (
                    <span key={tag} style={{
                      background: '#F5EFE8', color: '#6B3A2A',
                      borderRadius: 6, padding: '3px 9px',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Price row + action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 24, color: '#6B3A2A' }}>
                      {sym}{item.price}
                    </span>
                    <span style={{ fontSize: 11, color: '#9B7B58', marginLeft: 4 }}>+ GST</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setIsAddingProduct(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #8B5E3C, #6B3A2A)',
                        color: '#fff', fontWeight: 700, fontSize: 12,
                        boxShadow: '0 3px 10px rgba(107,58,42,0.3)',
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: 10, border: '1px solid #FCA5A5',
                        background: '#FEE2E2', color: '#DC2626', cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold text-gray-500">No items found</p>
          <p className="text-sm mt-1">Try a different search term or category</p>
        </div>
      )}

      {/* ── Add/Edit Product Modal ───────────────────────────── */}
      {(isAddingProduct || isEditingProduct) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-100 rounded-2xl w-full max-w-lg shadow-float">
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{isEditingProduct ? '✏️ Edit Item' : '➕ Add Menu Item'}</h2>
              <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Item Name *</label>
                  <input className={inputCls} placeholder="e.g. Cappuccino" defaultValue={isEditingProduct?.name} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹) *</label>
                  <input className={inputCls} type="number" placeholder="120" defaultValue={isEditingProduct?.price} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
                  <input className={inputCls} type="number" placeholder="5" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select className={inputCls}>
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Describe this item..." defaultValue={isEditingProduct?.description} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
                  <input className={inputCls} placeholder="https://..." defaultValue={isEditingProduct?.image} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }}
                  className="flex-1 py-2.5 bg-gray-50 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl font-bold transition-all shadow-solid"
                >
                  {isEditingProduct ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ───────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-200 rounded-2xl w-full max-w-sm shadow-float p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Remove Item?</h3>
              <p className="text-gray-500 text-sm mt-1">This will remove the item from the menu display.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-50 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}