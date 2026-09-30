import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Smile,
  Frown,
  Meh,
  Store,
  ArrowLeft,
  Calendar,
  Sparkles,
  BarChart3,
  RefreshCw,
  Award,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api, { analyticsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Design system colors
const NEEM_GREEN = '#2B580C';   // Positive
const MARIGOLD = '#E6A100';     // Neutral / Accent
const SAFFRON = '#E05A47';      // Negative
const CLAY = '#9C413D';         // Primary brand
const INDIGO = '#1E224F';       // Deep text / headers
const SLATE_BORDER = '#E5E7EB';

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  // Analytics states
  const [salesTrend, setSalesTrend] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'ADMIN';

  // 1. Determine active storeId
  useEffect(() => {
    async function initStore() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all stores for admin switcher
        if (isAdmin) {
          const storesRes = await api.get('/stores');
          setAllStores(storesRes.data || []);
        }

        const paramStoreId = searchParams.get('storeId');
        if (paramStoreId) {
          setSelectedStoreId(parseInt(paramStoreId, 10));
          const sRes = await api.get(`/stores/${paramStoreId}`);
          setStore(sRes.data);
        } else if (user?.id) {
          try {
            const myStoreRes = await api.get(`/stores/owner/${user.id}`);
            if (myStoreRes.data?.id) {
              setStore(myStoreRes.data);
              setSelectedStoreId(myStoreRes.data.id);
            } else if (isAdmin) {
              // Admin without a store: default to store 7 (Sharma Kirana)
              setSelectedStoreId(7);
              const sRes = await api.get('/stores/7');
              setStore(sRes.data);
            }
          } catch (e) {
            if (isAdmin) {
              setSelectedStoreId(7);
              const sRes = await api.get('/stores/7');
              setStore(sRes.data);
            } else {
              setStore(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to init store:', err);
        setError('Could not locate seller store');
      } finally {
        setLoading(false);
      }
    }

    initStore();
  }, [user, searchParams, isAdmin]);

  // 2. Fetch analytics data whenever selectedStoreId changes
  useEffect(() => {
    if (!selectedStoreId) return;

    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const [trendRes, topProdRes, sentRes] = await Promise.all([
          analyticsApi.get(`/analytics/seller/${selectedStoreId}/sales-trend?days=45`),
          analyticsApi.get(`/analytics/seller/${selectedStoreId}/top-products?limit=5`),
          analyticsApi.get(`/analytics/seller/${selectedStoreId}/sentiment`),
        ]);

        setSalesTrend(trendRes.data);
        setTopProducts(topProdRes.data?.topProducts || []);
        setSentiment(sentRes.data);
      } catch (err) {
        console.error('Failed to fetch seller analytics:', err);
        setError('Failed to fetch analytics from Python Analytics service. Ensure analytics service is running on port 5000.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [selectedStoreId]);

  const handleStoreChange = (e) => {
    const newId = e.target.value;
    setSearchParams({ storeId: newId });
  };

  const hasSalesData = salesTrend && salesTrend.totalOrders > 0;

  // Donut data for sentiment
  const sentimentChartData = sentiment ? [
    { name: 'Positive', value: sentiment.distribution?.Positive || 0, color: NEEM_GREEN },
    { name: 'Neutral', value: sentiment.distribution?.Neutral || 0, color: MARIGOLD },
    { name: 'Negative', value: sentiment.distribution?.Negative || 0, color: SAFFRON },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-clay/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-clay hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
            </Link>
            <span className="text-xs text-indigo/40">&bull;</span>
            <span className="text-xs font-medium text-indigo/60 uppercase tracking-wider">
              Artisan's Sales Ledger
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-indigo flex items-center gap-3">
            <span>{store?.storeName || 'Store'} Sales Analytics</span>
            {store?.category && (
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-clay/10 text-clay font-semibold">
                {store.category}
              </span>
            )}
          </h1>
          <p className="text-xs text-indigo/70 mt-1">
            45-day comprehensive sales trends, order volumes, bestsellers, and customer sentiment signals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Store Switcher */}
          {isAdmin && allStores.length > 0 && (
            <div className="flex items-center gap-2 bg-warmwhite border border-clay/20 rounded-xl px-3 py-1.5 shadow-sm">
              <Store className="w-3.5 h-3.5 text-clay" />
              <label htmlFor="adminStoreSelect" className="text-xs font-medium text-indigo/70">View Store:</label>
              <select
                id="adminStoreSelect"
                value={selectedStoreId || ''}
                onChange={handleStoreChange}
                className="bg-transparent text-xs font-bold text-indigo focus:outline-none cursor-pointer"
              >
                {allStores.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.storeName} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-clay/10 border border-clay/20 text-clay text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" /> Past 45 Days
          </div>

          <button
            onClick={() => {
              if (selectedStoreId) {
                setLoading(true);
                analyticsApi.get(`/analytics/seller/${selectedStoreId}/sales-trend?days=45`)
                  .then(res => setSalesTrend(res.data))
                  .finally(() => setLoading(false));
              }
            }}
            disabled={loading}
            className="p-2 rounded-xl bg-warmwhite hover:bg-white border border-clay/20 text-indigo text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 text-clay ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-saffron/10 border border-saffron/30 text-saffron text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !salesTrend && (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-clay animate-spin mb-3" />
          <p className="text-sm font-medium text-indigo/70">Calculating sales insights from PostgreSQL...</p>
        </div>
      )}

      {/* Empty State for Newly Approved or 0-order Sellers */}
      {!loading && !hasSalesData && (
        <div className="bg-warmwhite rounded-2xl border border-clay/20 p-12 text-center max-w-xl mx-auto my-12 shadow-warm">
          <div className="w-16 h-16 rounded-2xl bg-clay/10 text-clay flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl text-indigo mb-2">Your Sales Insights Will Appear Here</h2>
          <p className="text-sm text-indigo/70 leading-relaxed mb-6">
            We haven't recorded any completed orders for <span className="font-semibold text-clay">{store?.storeName || 'your store'}</span> yet. Once buyers begin placing and receiving orders, your 45-day revenue trend, bestsellers, and customer sentiment signals will populate automatically.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/dashboard/products"
              className="px-4 py-2.5 rounded-xl bg-clay hover:bg-clay/90 text-warmwhite text-xs font-bold transition-all shadow-sm"
            >
              Manage Products
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-ivory border border-clay/20 text-indigo text-xs font-bold transition-all shadow-sm"
            >
              Go to Order Queue
            </Link>
          </div>
        </div>
      )}

      {/* Active Analytics Content */}
      {!loading && hasSalesData && (
        <div className="space-y-8">
          {/* Key Stat Cards — Artisan's Ledger Aesthetic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Revenue */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-warmwhite to-white border border-clay/20 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo/60 uppercase tracking-wider">
                  45-Day Revenue
                </span>
                <div className="w-8 h-8 rounded-lg bg-neem/10 text-neem flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display text-3xl text-indigo font-bold tracking-tight">
                ₹{salesTrend.totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-indigo/50 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-marigold" /> Backfilled & live verified history
              </p>
            </div>

            {/* Card 2: Total Orders */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-warmwhite to-white border border-clay/20 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo/60 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="w-8 h-8 rounded-lg bg-clay/10 text-clay flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display text-3xl text-indigo font-bold tracking-tight">
                {salesTrend.totalOrders}
              </div>
              <p className="text-[11px] text-indigo/50 mt-1">
                Completed orders across 45 days
              </p>
            </div>

            {/* Card 3: Average Order Value */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-warmwhite to-white border border-clay/20 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo/60 uppercase tracking-wider">
                  Avg. Order Value
                </span>
                <div className="w-8 h-8 rounded-lg bg-marigold/15 text-indigo flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-marigold" />
                </div>
              </div>
              <div className="font-display text-3xl text-indigo font-bold tracking-tight">
                ₹{Math.round(salesTrend.averageOrderValue).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-indigo/50 mt-1">
                Per basket average transaction
              </p>
            </div>

            {/* Card 4: Customer Sentiment Score */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-warmwhite to-white border border-clay/20 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo/60 uppercase tracking-wider">
                  Buyer Sentiment
                </span>
                <div className="w-8 h-8 rounded-lg bg-neem/10 text-neem flex items-center justify-center">
                  {sentiment?.percentages?.Positive >= 60 ? (
                    <Smile className="w-4 h-4 text-neem" />
                  ) : sentiment?.percentages?.Negative >= 30 ? (
                    <Frown className="w-4 h-4 text-saffron" />
                  ) : (
                    <Meh className="w-4 h-4 text-marigold" />
                  )}
                </div>
              </div>
              <div className="font-display text-3xl text-indigo font-bold tracking-tight flex items-baseline gap-2">
                <span>{sentiment?.percentages?.Positive ?? 0}%</span>
                <span className="text-xs font-sans font-semibold text-neem">Positive</span>
              </div>
              <p className="text-[11px] text-indigo/50 mt-1">
                Avg polarity: {sentiment?.averagePolarity > 0 ? `+${sentiment.averagePolarity}` : sentiment?.averagePolarity ?? '0.00'} &bull; {sentiment?.totalReviews || 0} reviews
              </p>
            </div>
          </div>

          {/* Section 1: 45-Day Revenue Trend (Area Chart) */}
          <div className="bg-white rounded-2xl border border-clay/20 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-display text-lg text-indigo">Daily Revenue Trend</h3>
                <p className="text-xs text-indigo/60">
                  Continuous daily revenue in ₹ over the last 45 days (gap-filled)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-clay"></span>
                <span className="text-xs font-medium text-indigo/70">Daily Sales (₹)</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTrend.trend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CLAY} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CLAY} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#8B8680"
                    fontSize={11}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke="#8B8680"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid rgba(156,65,61,0.2)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Daily Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CLAY}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 2: Order Volume Trend (Bar Chart) */}
          <div className="bg-white rounded-2xl border border-clay/20 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-display text-lg text-indigo">Daily Order Volume</h3>
                <p className="text-xs text-indigo/60">
                  Number of orders received per day across the 45-day window
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-marigold"></span>
                <span className="text-xs font-medium text-indigo/70">Order Count</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesTrend.trend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#8B8680"
                    fontSize={11}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke="#8B8680"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid rgba(230,161,0,0.3)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value} orders`, 'Volume']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar
                    dataKey="orderCount"
                    fill={MARIGOLD}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 3: Two Columns — Top 5 Products & Sentiment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 cols: Top 5 Bestselling Products */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-clay/20 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg text-indigo flex items-center gap-2">
                      <Award className="w-5 h-5 text-marigold" />
                      Top 5 Best-Selling Products
                    </h3>
                    <p className="text-xs text-indigo/60">
                      Ranked by cumulative revenue and units sold over 45 days
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-clay/10 text-clay">
                    Leaderboard
                  </span>
                </div>

                {topProducts.length === 0 ? (
                  <p className="text-xs text-indigo/50 py-8 text-center">No product sales recorded yet.</p>
                ) : (
                  <div className="divide-y divide-clay/10">
                    {topProducts.map((p, idx) => {
                      const maxRev = topProducts[0]?.totalRevenue || 1;
                      const pct = Math.round((p.totalRevenue / maxRev) * 100);

                      return (
                        <div key={p.productId} className="py-3.5 first:pt-1 last:pb-1">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0
                                  ? 'bg-marigold text-indigo'
                                  : idx === 1
                                  ? 'bg-clay/20 text-clay'
                                  : 'bg-ivory text-indigo/70 border border-clay/20'
                              }`}>
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-sm font-semibold text-indigo">
                                  {p.title}
                                </h4>
                                <span className="text-[11px] text-indigo/50">
                                  ₹{p.price} per unit &bull; {p.unitsSold} units sold
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-indigo">
                                ₹{p.totalRevenue.toLocaleString('en-IN')}
                              </span>
                              <span className="block text-[10px] text-indigo/40">Revenue</span>
                            </div>
                          </div>
                          {/* Relative progress bar */}
                          <div className="w-full bg-ivory rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-clay h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-clay/10 text-right">
                <Link
                  to="/dashboard/products"
                  className="text-xs font-bold text-clay hover:underline"
                >
                  Manage inventory & prices &rarr;
                </Link>
              </div>
            </div>

            {/* Right 5 cols: Customer Sentiment Breakdown */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-clay/20 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg text-indigo">Customer Sentiment</h3>
                    <p className="text-xs text-indigo/60">
                      NLP polarity classification on buyer reviews
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo/5 text-indigo">
                    TextBlob NLP
                  </span>
                </div>

                {sentimentChartData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-indigo/50">
                    No customer reviews to score yet for this store.
                  </div>
                ) : (
                  <div>
                    {/* Donut Chart */}
                    <div className="h-44 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {sentimentChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value} reviews`, name]}
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '8px',
                              border: '1px solid #E5E7EB',
                              fontSize: '11px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Breakdown bars with Design System Colors */}
                    <div className="space-y-2.5 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-indigo">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NEEM_GREEN }}></span>
                          Positive (Neem)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo/50 font-normal">
                            {sentiment?.distribution?.Positive || 0} reviews
                          </span>
                          <span className="font-bold text-neem">
                            {sentiment?.percentages?.Positive ?? 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-indigo">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MARIGOLD }}></span>
                          Neutral (Marigold)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo/50 font-normal">
                            {sentiment?.distribution?.Neutral || 0} reviews
                          </span>
                          <span className="font-bold text-marigold">
                            {sentiment?.percentages?.Neutral ?? 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-indigo">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SAFFRON }}></span>
                          Negative (Saffron)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo/50 font-normal">
                            {sentiment?.distribution?.Negative || 0} reviews
                          </span>
                          <span className="font-bold text-saffron">
                            {sentiment?.percentages?.Negative ?? 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Polarity Metric Box */}
              <div className="mt-4 pt-3 border-t border-clay/10 bg-warmwhite/60 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-indigo/70">
                    Net Polarity Index
                  </span>
                  <span className="text-[10px] text-indigo/50">
                    Score range: -1.0 (Critical) to +1.0 (Delighted)
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${
                    (sentiment?.averagePolarity || 0) >= 0.2 ? 'text-neem' : (sentiment?.averagePolarity || 0) < 0 ? 'text-saffron' : 'text-marigold'
                  }`}>
                    {sentiment?.averagePolarity > 0 ? `+${sentiment.averagePolarity}` : sentiment?.averagePolarity || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
