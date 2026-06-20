// ============================================================
// CaféFlow POS — Products & Categories Management (Red/Orange Theme)
// ============================================================
import { useState } from 'react';
import { useProductStore, useSettingsStore } from '../store';
import { Search, Plus, Edit2, Trash2, Package, Tag, X } from 'lucide-react';
import type { Product, Category } from '../types';

const EMOJI_OPTIONS = ['☕', '🍵', '🧋', '🥤', '🍺', '🍷', '🧃', '🍹', '🥛', '🍫', '🍕', '🍔', '🍟', '🌮', '🌯', '🥗', '🍜', '🍣', '🍩', '🎂', '🍰', '🧁', '🍪', '🍦'];

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

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsStr = formData.get('tags') as string;
    const productData: Partial<Product> = {
      name: formData.get('name') as string,
      categoryId: formData.get('categoryId') as string,
      price: Number(formData.get('price')),
      image: formData.get('image') as string,
      description: formData.get('description') as string,
      available: formData.get('available') === 'on',
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      preparationTime: Number(formData.get('preparationTime')) || 10,
    };
    if (isEditingProduct) {
      updateProduct(isEditingProduct.id, productData);
      setIsEditingProduct(null);
    } else {
      addProduct({ ...productData as Product, id: 'prod-' + Date.now() });
      setIsAddingProduct(false);
    }
  };

  const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addCategory({
      id: 'cat-' + Date.now(),
      name: formData.get('name') as string,
      icon: formData.get('icon') as string || '☕',
      color: formData.get('color') as string || '#ef4444',
      active: true,
    });
    setIsAddingCategory(false);
  };

  const sym = settings.currencySymbol;

  const inputCls = 'w-full px-3 py-2.5 bg-white border-2 border-red-100 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-primary-500 transition-colors';

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products across {categories.length} categories</p>
        </div>
        <button
          onClick={() => activeTab === 'products' ? setIsAddingProduct(true) : setIsAddingCategory(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl font-semibold transition-all shadow-solid hover:shadow-solid-hover text-sm"
        >
          <Plus size={18} />
          Add {activeTab === 'products' ? 'Product' : 'Category'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-red-50 border border-red-100 p-1 rounded-xl w-fit">
        {(['products', 'categories'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-solid'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab === 'products'
              ? <span className="flex items-center gap-2"><Package size={15}/>{tab}</span>
              : <span className="flex items-center gap-2"><Tag size={15}/>{tab}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-red-100 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white border-transparent shadow-solid'
                    : 'bg-white text-gray-600 border-red-100 hover:border-primary-300 hover:text-gray-900'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white border-transparent shadow-solid'
                      : 'bg-white text-gray-600 border-red-100 hover:border-primary-300 hover:text-gray-900'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const cat = categories.find(c => c.id === product.categoryId);
              return (
                <div
                  key={product.id}
                  className="bg-white border-2 border-red-100 hover:border-primary-300 rounded-2xl overflow-hidden transition-all group hover:shadow-solid"
                >
                  {/* Image area */}
                  <div className="relative h-36 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center text-5xl">
                    {product.image || '🍽️'}
                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${product.available ? 'bg-green-500' : 'bg-red-400'}`} />
                    {!product.available && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-1 rounded-full">Unavailable</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{product.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{cat?.icon} {cat?.name}</p>
                      </div>
                      <span className="text-primary-600 font-bold text-sm whitespace-nowrap">{sym}{product.price}</span>
                    </div>

                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{product.description}</p>
                    )}

                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-red-50 text-primary-600 text-xs rounded-full border border-red-100 font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setIsEditingProduct(product); setIsAddingProduct(false); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold rounded-xl transition-colors border border-orange-100"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition-colors border border-red-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-semibold text-gray-500">No products found</p>
              <p className="text-sm mt-1">Try adjusting your search or category filter</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const productCount = products.filter(p => p.categoryId === cat.id).length;
            return (
              <div key={cat.id} className="bg-white border-2 border-red-100 hover:border-primary-300 rounded-2xl p-5 transition-all hover:shadow-solid group">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-solid"
                    style={{ backgroundColor: cat.color + '20', border: `2px solid ${cat.color}50` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base">{cat.name}</h3>
                    <p className="text-gray-500 text-sm">{productCount} products</p>
                  </div>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Product Modal ── */}
      {(isAddingProduct || isEditingProduct) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-100 rounded-2xl w-full max-w-lg shadow-float">
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{isEditingProduct ? '✏️ Edit Product' : '➕ Add Product'}</h2>
              <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>
                  <input name="name" required defaultValue={isEditingProduct?.name} placeholder="e.g. Cappuccino" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
                  <select name="categoryId" required defaultValue={isEditingProduct?.categoryId} className={inputCls}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price ({sym}) *</label>
                  <input name="price" type="number" min="0" step="0.01" required defaultValue={isEditingProduct?.price} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emoji Icon</label>
                  <input name="image" defaultValue={isEditingProduct?.image || '🍽️'} className={inputCls} placeholder="e.g. ☕" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Prep Time (min)</label>
                  <input name="preparationTime" type="number" min="1" defaultValue={isEditingProduct?.preparationTime || 10} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea name="description" rows={2} defaultValue={isEditingProduct?.description} className={inputCls + ' resize-none'} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
                  <input name="tags" defaultValue={isEditingProduct?.tags?.join(', ')} placeholder="e.g. hot, bestseller, vegan" className={inputCls} />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input name="available" type="checkbox" id="available" defaultChecked={isEditingProduct ? isEditingProduct.available : true} className="w-4 h-4 accent-primary-500" />
                  <label htmlFor="available" className="text-sm font-semibold text-gray-700">Available for ordering</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }} className="flex-1 py-2.5 bg-gray-50 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl font-bold transition-all shadow-solid">
                  {isEditingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Category Modal ── */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-100 rounded-2xl w-full max-w-md shadow-float">
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">➕ Add Category</h2>
              <button onClick={() => setIsAddingCategory(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category Name *</label>
                <input name="name" required placeholder="e.g. Hot Beverages" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Icon Emoji</label>
                <div className="grid grid-cols-8 gap-2 mb-2">
                  {EMOJI_OPTIONS.map(e => (
                    <label key={e} className="cursor-pointer">
                      <input type="radio" name="icon" value={e} className="sr-only peer" />
                      <div className="w-9 h-9 flex items-center justify-center text-xl rounded-lg bg-red-50 border-2 border-red-100 peer-checked:border-primary-500 peer-checked:bg-red-100 hover:bg-orange-50 transition-colors">
                        {e}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
                <input name="color" type="color" defaultValue="#ef4444" className="w-full h-10 rounded-xl border-2 border-red-100 bg-white cursor-pointer" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 py-2.5 bg-gray-50 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl font-bold transition-all shadow-solid">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-200 rounded-2xl w-full max-w-sm shadow-float p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete Product?</h3>
              <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-50 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={() => { deleteProduct(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}