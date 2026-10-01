import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Store, 
  MapPin, 
  User, 
  Calendar, 
  RefreshCw, 
  Sparkles,
  AlertTriangle,
  Search
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminSellerQueuePage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'APPROVED'
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Rejection modal
  const [rejectModalStore, setRejectModalStore] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStores();
  }, [activeTab]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stores?status=${activeTab}`);
      setStores(res.data || []);
    } catch (err) {
      console.error('Failed to load stores queue:', err);
      showToast('Failed to fetch store queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (storeId) => {
    setProcessingId(storeId);
    try {
      await api.put(`/stores/${storeId}/approve`);
      showToast('Store approved and seller promoted to SELLER role!', 'success');
      setStores((prev) => prev.filter((s) => s.id !== storeId));
    } catch (err) {
      console.error('Failed to approve store:', err);
      showToast(err.response?.data?.message || 'Failed to approve store', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (store) => {
    setRejectModalStore(store);
    setRejectReason('Store details or documentation require revision before approval.');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalStore) return;

    setProcessingId(rejectModalStore.id);
    try {
      await api.put(`/stores/${rejectModalStore.id}/reject`, {
        reason: rejectReason.trim(),
      });
      showToast('Store application rejected and feedback recorded.', 'info');
      setStores((prev) => prev.filter((s) => s.id !== rejectModalStore.id));
      setRejectModalStore(null);
    } catch (err) {
      console.error('Failed to reject store:', err);
      showToast(err.response?.data?.message || 'Failed to reject store', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStores = stores.filter((s) =>
    s.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-clay/20 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-clay font-bold text-xs uppercase tracking-wider">
            <img src="/logo.png" alt="LocalConnect" className="w-4 h-4 rounded-full object-cover" />
            <span>Mohalla Marketplace Governance</span>
          </div>
          <h1 className="text-3xl font-display text-indigo flex items-center gap-2">
            Seller Approval Queue
          </h1>
          <p className="text-xs text-indigo/70">
            Verify new artisan and merchant registrations to grant live public listing privileges.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStores}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-warmwhite border border-clay/20 text-indigo text-xs font-semibold hover:bg-white flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-clay' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-warmwhite rounded-2xl border border-clay/20 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-clay text-warmwhite shadow-sm'
                : 'text-indigo/70 hover:text-indigo'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-indigo text-warmwhite shadow-sm'
                : 'text-indigo/70 hover:text-indigo'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approved Sellers
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-indigo/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search queue by store, owner, area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-warmwhite border border-clay/20 text-indigo focus:outline-none focus:ring-2 focus:ring-clay/30"
          />
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-clay/30 border-t-clay rounded-full animate-spin"></div>
          <p className="font-display text-indigo/70 text-sm">Querying verification records...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="p-12 rounded-3xl bg-warmwhite border border-clay/20 text-center shadow-warm space-y-3">
          <CheckCircle className="w-12 h-12 text-neem mx-auto opacity-60" />
          <h3 className="font-display text-2xl text-indigo">
            {activeTab === 'PENDING' ? 'No Pending Approvals' : 'No Approved Sellers Found'}
          </h3>
          <p className="text-xs text-indigo/60 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? 'All seller applications have been reviewed and processed.'
              : 'Approved sellers will appear here once approved through the queue.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-warmwhite p-6 rounded-2xl border border-clay/20 shadow-warm flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-clay/10 text-clay font-bold uppercase tracking-wider">
                      {store.category}
                    </span>
                    <h3 className="font-display text-xl text-indigo font-bold mt-1">
                      {store.storeName}
                    </h3>
                  </div>

                  {store.status === 'APPROVED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-seller flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-pending flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-indigo/80 bg-white/60 p-3 rounded-xl border border-clay/10">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-clay" />
                    <span>Owner: <strong className="text-indigo">{store.ownerName}</strong> (ID #{store.ownerId})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-clay" />
                    <span>Locality: {store.location}</span>
                  </div>
                  {store.createdAt && (
                    <div className="flex items-center gap-2 text-[11px] text-indigo/50">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Applied on: {new Date(store.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {store.description && (
                  <p className="text-xs text-indigo/70 italic line-clamp-2">
                    "{store.description}"
                  </p>
                )}
              </div>

              {/* Action Buttons for Pending Queue */}
              {activeTab === 'PENDING' && (
                <div className="pt-3 border-t border-clay/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => openRejectModal(store)}
                    disabled={processingId === store.id}
                    className="px-4 py-2 rounded-xl bg-white border border-saffron/30 text-saffron text-xs font-bold hover:bg-saffron/10 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(store.id)}
                    disabled={processingId === store.id}
                    className="px-5 py-2 rounded-xl bg-neem hover:bg-neem/90 text-warmwhite text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {processingId === store.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve & Promote
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalStore && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-saffron font-bold text-lg">
              <AlertTriangle className="w-5 h-5" /> Reject Store Application
            </div>
            <p className="text-xs text-indigo/70">
              Provide feedback for <strong className="text-indigo">{rejectModalStore.storeName}</strong>. The seller will see this reason in their store settings and can correct the information to resubmit.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-3 rounded-xl border border-clay/30 bg-warmwhite text-indigo text-xs focus:outline-none focus:ring-2 focus:ring-saffron/30 font-body"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalStore(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-indigo text-xs font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectModalStore.id}
                  className="px-5 py-2 rounded-xl bg-saffron hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
