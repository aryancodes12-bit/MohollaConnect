import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  ShoppingBag,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  X,
  Calendar,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  Star,
  RefreshCw,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminUserDirectoryPage() {
  const { showToast } = useToast();

  // Filter & Pagination States
  const [activeTab, setActiveTab] = useState('BUYER'); // 'BUYER' | 'SELLER' | 'ALL'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Data States
  const [usersPage, setUsersPage] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // Detail Modal States
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // reset to first page on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch users when filters change
  useEffect(() => {
    loadUsers();
  }, [activeTab, debouncedSearch, page, pageSize, sortBy, sortDir]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        sortBy: sortBy,
        sortDir: sortDir,
      });

      if (activeTab !== 'ALL') {
        params.append('role', activeTab);
      }

      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.append('search', debouncedSearch.trim());
      }

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsersPage(res.data);
    } catch (err) {
      console.error('Failed to load admin user directory:', err);
      showToast(err.response?.data?.message || 'Failed to fetch user directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open user detail modal
  const handleOpenDetail = async (userId) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setDetailUser(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setDetailUser(res.data);
    } catch (err) {
      console.error('Failed to load user details:', err);
      showToast('Failed to load user profile details', 'error');
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Sort toggle handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-indigo/30 group-hover:text-indigo/70" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-clay" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-clay" />
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neem/15 text-neem border border-neem/30">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'PENDING':
      case 'PLACED':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-marigold/20 text-indigo border border-marigold/40">
            <Clock className="w-3 h-3 text-marigold" /> {status}
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-marigold/30 text-indigo border border-marigold">
            <Package className="w-3 h-3 text-clay" /> Out for Delivery
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-saffron/15 text-saffron border border-saffron/30">
            <XCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-ivory text-indigo/70 border border-clay/10">
            {status || 'N/A'}
          </span>
        );
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo text-warmwhite">ADMIN</span>;
      case 'SELLER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-clay text-warmwhite">SELLER</span>;
      case 'PENDING_SELLER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-marigold text-indigo">PENDING SELLER</span>;
      case 'BUYER':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ivory text-indigo border border-clay/20">BUYER</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-clay/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-clay text-warmwhite text-[10px] font-bold uppercase tracking-wider">
              <img src="/logo.png" alt="LocalConnect" className="w-3.5 h-3.5 rounded-full object-cover" />
              Admin Portal
            </span>
            <span className="text-xs text-indigo/40">&bull;</span>
            <span className="text-xs font-semibold text-indigo/60">Directory & CRM</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-indigo flex items-center gap-2">
            <Users className="w-7 h-7 text-clay" />
            Platform User Directory
          </h1>
          <p className="text-xs text-indigo/70 mt-1 max-w-2xl">
            Complete database of buyers and mohalla merchants. Search, sort, paginate, and inspect full customer order histories and store catalogs.
          </p>
        </div>

        {/* Quick links to approval queue & BI */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/sellers"
            className="px-3.5 py-2 rounded-xl bg-warmwhite hover:bg-white border border-clay/20 text-indigo text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-clay" /> Approval Queue
          </Link>
          <Link
            to="/admin/bi-dashboard"
            className="px-3.5 py-2 rounded-xl bg-warmwhite hover:bg-white border border-clay/20 text-indigo text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-clay" /> BI Dashboard
          </Link>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-xl bg-clay hover:bg-clay/90 text-warmwhite text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-ivory rounded-2xl border border-clay/20 w-fit">
          <button
            onClick={() => { setActiveTab('BUYER'); setPage(0); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'BUYER'
                ? 'bg-clay text-warmwhite shadow-sm'
                : 'text-indigo/70 hover:text-indigo hover:bg-white/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Buyers
          </button>

          <button
            onClick={() => { setActiveTab('SELLER'); setPage(0); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'SELLER'
                ? 'bg-clay text-warmwhite shadow-sm'
                : 'text-indigo/70 hover:text-indigo hover:bg-white/60'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Sellers & Merchants
          </button>

          <button
            onClick={() => { setActiveTab('ALL'); setPage(0); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-clay text-warmwhite shadow-sm'
                : 'text-indigo/70 hover:text-indigo hover:bg-white/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            All Accounts
          </button>
        </div>

        {/* Search bar & Page size */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-indigo/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or store..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-clay/20 text-xs text-indigo focus:outline-none focus:ring-2 focus:ring-clay/40 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo/40 hover:text-indigo text-sm font-bold"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-indigo/60">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="bg-white border border-clay/20 rounded-xl px-2 py-1.5 text-xs font-bold text-indigo focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-clay/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="bg-ivory border-b border-clay/15 text-indigo/70 uppercase tracking-wider font-semibold">
              {activeTab === 'BUYER' ? (
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Buyer Name</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Email</span>
                      {renderSortIcon('email')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Joined Date</span>
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalOrders')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Total Orders</span>
                      {renderSortIcon('totalOrders')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalSpent')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Spent (₹)</span>
                      {renderSortIcon('totalSpent')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Locality</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              ) : (
                /* Sellers or All Tab Header */
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Merchant / Owner</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Email</span>
                      {renderSortIcon('email')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Store Name</th>
                  <th className="py-3.5 px-4 text-center">Category</th>
                  <th className="py-3.5 px-4 text-center">Store Status</th>
                  <th
                    onClick={() => handleSort('productCount')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Products</span>
                      {renderSortIcon('productCount')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('ordersReceived')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Orders Rec'd</span>
                      {renderSortIcon('ordersReceived')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-clay/5 group transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Joined</span>
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              )}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-clay/10">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'BUYER' ? 7 : 9} className="py-16 text-center text-indigo/60">
                    <RefreshCw className="w-6 h-6 mx-auto text-clay animate-spin mb-2" />
                    Loading user records...
                  </td>
                </tr>
              ) : usersPage.content.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'BUYER' ? 7 : 9} className="py-16 text-center text-indigo/60">
                    <p className="font-semibold text-sm text-indigo">No matching users found</p>
                    <p className="text-xs text-indigo/50 mt-1">
                      {searchTerm ? `No results matching "${searchTerm}"` : 'No accounts recorded under this category.'}
                    </p>
                  </td>
                </tr>
              ) : (
                usersPage.content.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenDetail(u.id)}
                    className="hover:bg-ivory/50 cursor-pointer transition-colors"
                  >
                    {activeTab === 'BUYER' ? (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-clay/10 text-clay font-bold flex items-center justify-center shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-semibold text-indigo block">{u.name}</span>
                              <span className="text-[10px] text-indigo/40">ID #{u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo/80">{u.email}</td>
                        <td className="py-3.5 px-4 text-center text-indigo/60">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo">
                          {u.totalOrders}
                        </td>
                        <td className="py-3.5 px-4 text-right font-display text-sm font-bold text-clay">
                          ₹{u.totalSpent ? u.totalSpent.toLocaleString('en-IN') : '0'}
                        </td>
                        <td className="py-3.5 px-4 text-indigo/70 max-w-[200px] truncate" title={u.locality}>
                          {u.locality || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(u.id); }}
                            className="px-2.5 py-1 rounded-lg bg-warmwhite hover:bg-white text-indigo border border-clay/20 text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                          >
                            <Eye className="w-3 h-3 text-clay" /> View
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-clay text-warmwhite font-bold flex items-center justify-center shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-indigo">{u.name}</span>
                                {getRoleBadge(u.role)}
                              </div>
                              <span className="text-[10px] text-indigo/40">ID #{u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo/80">{u.email}</td>
                        <td className="py-3.5 px-4 font-semibold text-indigo">
                          {u.storeName || <span className="text-indigo/40 italic">No Store</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {u.storeCategory ? (
                            <span className="px-2 py-0.5 rounded-full bg-clay/10 text-clay text-[10px] font-semibold">
                              {u.storeCategory}
                            </span>
                          ) : (
                            <span className="text-indigo/40">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {u.storeStatus ? getStatusBadge(u.storeStatus) : <span className="text-indigo/40">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo">
                          {u.productCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-clay">
                          {u.ordersReceived || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center text-indigo/60">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(u.id); }}
                            className="px-2.5 py-1 rounded-lg bg-warmwhite hover:bg-white text-indigo border border-clay/20 text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                          >
                            <Eye className="w-3 h-3 text-clay" /> View
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-warmwhite/50 border-t border-clay/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo/70">
          <div>
            Showing <span className="font-bold text-indigo">{usersPage.content.length > 0 ? page * pageSize + 1 : 0}</span> to{' '}
            <span className="font-bold text-indigo">
              {Math.min((page + 1) * pageSize, usersPage.totalElements)}
            </span>{' '}
            of <span className="font-bold text-indigo">{usersPage.totalElements}</span> users
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-1.5 rounded-lg border border-clay/20 bg-white hover:bg-ivory disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: usersPage.totalPages || 1 }, (_, i) => i)
              .filter((i) => i === 0 || i === usersPage.totalPages - 1 || Math.abs(i - page) <= 1)
              .map((i, idx, arr) => {
                const showEllipsis = idx > 0 && i - arr[idx - 1] > 1;
                return (
                  <React.Fragment key={i}>
                    {showEllipsis && <span className="px-1 text-indigo/40">&hellip;</span>}
                    <button
                      onClick={() => setPage(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                        page === i
                          ? 'bg-clay text-warmwhite'
                          : 'bg-white border border-clay/20 text-indigo hover:bg-ivory'
                      }`}
                    >
                      {i + 1}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((p) => Math.min(usersPage.totalPages - 1, p + 1))}
              disabled={page >= usersPage.totalPages - 1 || loading}
              className="p-1.5 rounded-lg border border-clay/20 bg-white hover:bg-ivory disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-clay/20 max-h-[90vh] overflow-y-auto animate-fade-in space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-clay/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-clay text-warmwhite font-display text-xl flex items-center justify-center shadow-sm">
                  {detailUser?.name ? detailUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl md:text-2xl text-indigo">
                      {detailUser?.name || 'Loading user...'}
                    </h2>
                    {detailUser && getRoleBadge(detailUser.role)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-indigo/60 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-clay" /> {detailUser?.email}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-clay" /> Member since{' '}
                      {detailUser?.createdAt ? new Date(detailUser.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserId(null)}
                className="w-8 h-8 rounded-full bg-ivory text-indigo/60 hover:text-indigo hover:bg-clay/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading || !detailUser ? (
              <div className="py-16 text-center text-indigo/60">
                <RefreshCw className="w-8 h-8 mx-auto text-clay animate-spin mb-3" />
                Fetching full customer activity and order ledger...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contact & Location Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-ivory/60 rounded-2xl border border-clay/15 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-clay shrink-0" />
                    <div>
                      <span className="text-[10px] text-indigo/50 uppercase font-bold block">Primary Locality / Address</span>
                      <span className="font-medium text-indigo">{detailUser.locality || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-clay shrink-0" />
                    <div>
                      <span className="text-[10px] text-indigo/50 uppercase font-bold block">Contact Phone</span>
                      <span className="font-medium text-indigo">{detailUser.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* BUYER ACTIVITY SECTION */}
                <div className="space-y-4">
                  <h3 className="font-display text-base text-indigo flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-clay" />
                    Buyer Order History ({detailUser.totalOrders || 0} orders placed)
                  </h3>

                  {/* Buyer KPI Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-warmwhite border border-clay/15 text-center">
                      <span className="block text-[10px] font-bold uppercase text-indigo/50">Total Orders</span>
                      <span className="font-display text-xl font-bold text-indigo">{detailUser.totalOrders}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-warmwhite border border-clay/15 text-center">
                      <span className="block text-[10px] font-bold uppercase text-indigo/50">Delivered</span>
                      <span className="font-display text-xl font-bold text-neem">{detailUser.deliveredOrders}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-warmwhite border border-clay/15 text-center">
                      <span className="block text-[10px] font-bold uppercase text-indigo/50">Total Spend</span>
                      <span className="font-display text-xl font-bold text-clay">
                        ₹{detailUser.totalSpent ? detailUser.totalSpent.toLocaleString('en-IN') : '0'}
                      </span>
                    </div>
                  </div>

                  {/* Compact Orders Table */}
                  {detailUser.buyerOrders?.length === 0 ? (
                    <p className="text-xs text-indigo/50 italic py-2">No orders placed by this buyer.</p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto border border-clay/10 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-ivory sticky top-0 border-b border-clay/10 text-indigo/60 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Order ID</th>
                            <th className="py-2 px-3">Product</th>
                            <th className="py-2 px-3">Seller Store</th>
                            <th className="py-2 px-3 text-center">Date</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3 text-right">Total (₹)</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-clay/5">
                          {detailUser.buyerOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-ivory/30">
                              <td className="py-2 px-3 font-mono font-bold text-indigo">#{o.id}</td>
                              <td className="py-2 px-3 font-medium text-indigo">{o.productTitle}</td>
                              <td className="py-2 px-3 text-indigo/70">{o.storeName}</td>
                              <td className="py-2 px-3 text-center text-indigo/60">
                                {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-2 px-3 text-center text-indigo/80">{o.quantity}</td>
                              <td className="py-2 px-3 text-right font-bold text-clay">₹{o.totalPrice}</td>
                              <td className="py-2 px-3 text-center">{getStatusBadge(o.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Written Reviews */}
                  {detailUser.buyerReviews?.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase text-indigo/60 mb-2">
                        Customer Reviews Written ({detailUser.buyerReviews.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {detailUser.buyerReviews.map((r) => (
                          <div key={r.id} className="p-2.5 rounded-xl bg-ivory/50 border border-clay/10 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-indigo">{r.productTitle}</span>
                              <div className="flex items-center gap-1 text-marigold">
                                {Array.from({ length: r.rating || 5 }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-marigold" />
                                ))}
                              </div>
                            </div>
                            <p className="text-indigo/70 italic text-[11px]">"{r.commentText}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SELLER ACTIVITY SECTION (if applicable) */}
                {detailUser.store && (
                  <div className="space-y-4 pt-4 border-t border-clay/15">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base text-indigo flex items-center gap-2">
                        <Store className="w-4 h-4 text-clay" />
                        Merchant Storefront: {detailUser.store.storeName}
                      </h3>
                      <Link
                        to={`/stores/${detailUser.store.id}`}
                        target="_blank"
                        className="text-xs font-bold text-clay hover:underline flex items-center gap-1"
                      >
                        Public Storefront <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Seller KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-warmwhite border border-clay/15 text-center">
                        <span className="block text-[10px] font-bold uppercase text-indigo/50">Category</span>
                        <span className="font-semibold text-xs text-indigo">{detailUser.store.category}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-warmwhite border border-clay/15 text-center">
                        <span className="block text-[10px] font-bold uppercase text-indigo/50">Store Status</span>
                        <div className="mt-0.5">{getStatusBadge(detailUser.store.status)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-warmwhite border border-clay/15 text-center">
                        <span className="block text-[10px] font-bold uppercase text-indigo/50">Catalog SKUs</span>
                        <span className="font-display text-xl font-bold text-indigo">{detailUser.productCount}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-warmwhite border border-clay/15 text-center">
                        <span className="block text-[10px] font-bold uppercase text-indigo/50">Total Revenue</span>
                        <span className="font-display text-xl font-bold text-clay">
                          ₹{detailUser.totalRevenueReceived ? detailUser.totalRevenueReceived.toLocaleString('en-IN') : '0'}
                        </span>
                      </div>
                    </div>

                    {/* Product Catalog List */}
                    {detailUser.products?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-indigo/60 mb-2">
                          Store Catalog Products ({detailUser.products.length})
                        </h4>
                        <div className="max-h-44 overflow-y-auto border border-clay/10 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-ivory sticky top-0 border-b border-clay/10 text-indigo/60 font-semibold">
                              <tr>
                                <th className="py-2 px-3">Title</th>
                                <th className="py-2 px-3">Category</th>
                                <th className="py-2 px-3 text-right">Price (₹)</th>
                                <th className="py-2 px-3 text-center">Stock</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-clay/5">
                              {detailUser.products.map((p) => (
                                <tr key={p.id} className="hover:bg-ivory/30">
                                  <td className="py-2 px-3 font-semibold text-indigo">{p.title}</td>
                                  <td className="py-2 px-3 text-indigo/60">{p.storeCategory || 'General'}</td>
                                  <td className="py-2 px-3 text-right font-bold text-clay">₹{p.price}</td>
                                  <td className="py-2 px-3 text-center text-indigo/70">{p.stockQty}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-clay/15 text-right">
              <button
                onClick={() => setSelectedUserId(null)}
                className="px-5 py-2.5 rounded-xl bg-clay text-warmwhite text-xs font-bold hover:bg-clay/90 transition-all cursor-pointer shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
