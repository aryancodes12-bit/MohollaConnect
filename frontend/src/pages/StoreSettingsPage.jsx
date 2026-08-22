import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  MapPin, 
  Tag, 
  FileText, 
  ShieldCheck, 
  Clock, 
  XCircle, 
  ArrowLeft, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STORE_CATEGORIES = [
  'Kirana Store',
  'Tailoring & Ironing',
  'Handicrafts/Artisan',
  'Spices & Groceries',
  'Home Bakery',
  'Pottery & Ceramic',
  'Electrical & Repairs',
  'Other'
];

export default function StoreSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    storeName: '',
    category: 'Kirana Store',
    location: '',
    description: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadStore();
    }
  }, [user]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stores/owner/${user.id}`);
      setStore(res.data);
      if (res.data) {
        setForm({
          storeName: res.data.storeName || '',
          category: res.data.category || 'Kirana Store',
          location: res.data.location || '',
          description: res.data.description || '',
        });
      }
    } catch (err) {
      // Store not found for fresh seller
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.storeName || !form.location) {
      showToast('Store name and locality/location are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (store?.id) {
        const res = await api.put(`/stores/${store.id}`, form);
        setStore(res.data);
        showToast(
          store.status === 'REJECTED'
            ? 'Store updated and resubmitted for admin review!'
            : 'Store settings saved successfully!',
          'success'
        );
      } else {
        const res = await api.post('/stores', form);
        setStore(res.data);
        showToast('Store created successfully! Pending admin approval.', 'success');
      }
    } catch (err) {
      console.error('Failed to save store settings:', err);
      showToast(err.response?.data?.message || 'Failed to save store settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-clay/30 border-t-clay rounded-full animate-spin"></div>
        <p className="font-display text-indigo/70">Loading store configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header with back link */}
      <div className="space-y-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-clay hover:underline mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Seller Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-3xl font-display text-indigo flex items-center gap-2">
            <Store className="w-7 h-7 text-clay" /> Store Profile & Settings
          </h1>

          {/* Status Badge */}
          {store && (
            <div>
              {store.status === 'APPROVED' ? (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold badge-seller flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Approved & Live
                </span>
              ) : store.status === 'REJECTED' ? (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-saffron text-warmwhite flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Application Rejected
                </span>
              ) : (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold badge-pending flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Verification Pending
                </span>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-indigo/70">
          Configure your digital storefront details visible to local neighbours in the Mohalla Bazaar.
        </p>
      </div>

      {/* Rejection Notice Banner */}
      {store && store.status === 'REJECTED' && (
        <div className="p-5 rounded-2xl bg-saffron/10 border border-saffron/30 text-indigo text-sm space-y-2">
          <div className="flex items-center gap-2 text-saffron font-bold">
            <AlertCircle className="w-5 h-5" /> Store Rejection Feedback
          </div>
          <p className="text-xs text-indigo/80">
            {store.rejectionReason || 'Please update your store details and resubmit for verification.'}
          </p>
          <p className="text-[11px] text-indigo/60">
            Saving updated store settings will automatically reset your status to <span className="font-semibold text-clay">PENDING</span> and re-enter the administrator approval queue.
          </p>
        </div>
      )}

      {/* Store Settings Form */}
      <div className="bg-warmwhite p-6 md:p-8 rounded-3xl border border-clay/20 shadow-warm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-clay" /> Store Name
            </label>
            <input
              type="text"
              required
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              placeholder="e.g. Ramesh Kirana & General Store"
              className="w-full px-4 py-2.5 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 font-body"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-indigo flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-clay" /> Business Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
              >
                {STORE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-indigo flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-clay" /> Locality / Mohalla Area
              </label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Indiranagar, 12th Main"
                className="w-full px-4 py-2.5 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 font-body"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-clay" /> Store Description & Story
            </label>
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell your local customers about your heritage, specialties, or shop hours..."
              className="w-full p-4 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 font-body"
            />
          </div>

          <div className="pt-4 border-t border-clay/10 flex items-center justify-between">
            {store?.id && (
              <Link
                to={`/stores/${store.id}`}
                className="text-xs font-bold text-clay hover:underline"
              >
                Preview Public Storefront →
              </Link>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 ml-auto"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving Settings...
                </>
              ) : (
                <>
                  Save Store Settings <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
