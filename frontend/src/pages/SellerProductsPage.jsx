import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SellerProductsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    stockQty: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSellerStoreAndProducts();
    }
  }, [user]);

  const loadSellerStoreAndProducts = async () => {
    setLoading(true);
    try {
      const storeRes = await api.get(`/stores/owner/${user.id}`);
      setStore(storeRes.data);
      if (storeRes.data?.id) {
        const prodRes = await api.get(`/products/store/${storeRes.data.id}`);
        setProducts(prodRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load seller catalog:', err);
      // Store might not exist yet if fresh account
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setForm({ title: '', description: '', price: '', stockQty: '10' });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setIsEditing(true);
    setSelectedProduct(p);
    setForm({
      title: p.title,
      description: p.description || '',
      price: p.price,
      stockQty: p.stockQty,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!store?.id) {
      showToast('Store not found. Please set up store settings first.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        storeId: store.id,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        stockQty: parseInt(form.stockQty, 10),
      };

      if (isEditing && selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product created successfully!', 'success');
      }

      setIsModalOpen(false);
      loadSellerStoreAndProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setDeleting(true);
    try {
      await api.delete(`/products/${productId}`);
      showToast('Product removed from catalog', 'success');
      setDeleteConfirmId(null);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error('Failed to delete product:', err);
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-clay/30 border-t-clay rounded-full animate-spin"></div>
        <p className="font-display text-indigo/70">Loading your store catalog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-clay hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-display text-indigo flex items-center gap-2">
            <Package className="w-7 h-7 text-clay" /> Product Catalog & Inventory
          </h1>
          <p className="text-xs text-indigo/70">
            Manage your listings, pricing, and available stocks for {store?.storeName || 'your store'}.
          </p>
        </div>

        {store && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        )}
      </div>

      {/* Pending Store Banner */}
      {store && store.status === 'PENDING' && (
        <div className="p-4 rounded-2xl bg-marigold/10 border border-marigold/30 flex items-start gap-3 text-indigo text-sm shadow-warm">
          <Clock className="w-5 h-5 text-marigold shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-indigo">Your store is pending verification</div>
            <p className="text-xs text-indigo/80">
              Products you add now will be saved in your inventory, but will not be visible to public buyers until your store is approved by the admin.
            </p>
          </div>
        </div>
      )}

      {/* No Store Setup Warning */}
      {!store ? (
        <div className="p-12 rounded-3xl bg-warmwhite border border-clay/20 text-center shadow-warm space-y-4">
          <AlertTriangle className="w-12 h-12 text-marigold mx-auto" />
          <h3 className="font-display text-2xl text-indigo">No Store Configured</h3>
          <p className="text-sm text-indigo/70 max-w-md mx-auto">
            You need to create your store identity first before you can list products in the Mohalla Bazaar.
          </p>
          <Link
            to="/dashboard/store"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-clay text-warmwhite font-bold text-sm shadow-warm hover:bg-saffron transition-all"
          >
            Create Store Profile →
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 rounded-3xl bg-warmwhite border border-clay/20 text-center shadow-warm space-y-4">
          <Package className="w-12 h-12 text-clay/40 mx-auto" />
          <h3 className="font-display text-2xl text-indigo">Your Catalog is Empty</h3>
          <p className="text-sm text-indigo/70 max-w-md mx-auto">
            Start listing your artisanal handicrafts, kirana items, or services for your local neighbours.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-clay text-warmwhite font-bold text-sm shadow-warm hover:bg-saffron transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Your First Product
          </button>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-warmwhite rounded-2xl border border-clay/20 shadow-warm p-6 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-clay/10 text-clay font-bold">
                    ID #{p.id}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    p.stockQty > 0 ? 'bg-neem/10 text-neem' : 'bg-saffron/10 text-saffron'
                  }`}>
                    {p.stockQty > 0 ? `Stock: ${p.stockQty}` : 'Out of Stock'}
                  </span>
                </div>

                <h3 className="font-display text-xl text-indigo font-bold">{p.title}</h3>
                <p className="text-xs text-indigo/70 line-clamp-2">{p.description || 'No description'}</p>
              </div>

              <div className="pt-3 border-t border-clay/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo/50 uppercase tracking-wider block">Price</span>
                  <div className="font-display text-2xl text-clay">₹{p.price}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-2 rounded-xl bg-white border border-clay/20 text-indigo hover:text-clay hover:bg-clay/5 transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(p.id)}
                    className="p-2 rounded-xl bg-white border border-saffron/20 text-saffron hover:bg-saffron/10 transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warmwhite w-full max-w-lg rounded-3xl border border-clay/30 shadow-2xl p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-clay/10 pb-4">
              <h3 className="font-display text-2xl text-indigo flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-clay" />
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-indigo/50 hover:text-indigo p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo">Product Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Handmade Glazed Terracotta Teacup"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo">Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe materials, handmade process, or specifics..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 font-body"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 18.50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stockQty}
                    onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                    placeholder="e.g. 30"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-clay/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white border border-clay/20 text-indigo text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-xs shadow-warm cursor-pointer transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <AlertTriangle className="w-10 h-10 text-saffron mx-auto" />
            <h4 className="font-display text-lg text-indigo">Delete this Product?</h4>
            <p className="text-xs text-indigo/70">
              Are you sure you want to remove this listing? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-indigo text-xs font-semibold hover:bg-gray-200"
              >
                Keep Product
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-saffron hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
