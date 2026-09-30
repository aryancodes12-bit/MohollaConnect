import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Store,
  Users,
  Smile,
  ShieldCheck,
  Calendar,
  Sparkles,
  RefreshCw,
  Database,
  ArrowUpRight,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Info
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
  Cell,
  Legend
} from 'recharts';
import { analyticsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Design tokens
const NEEM_GREEN = '#2B580C';
const MARIGOLD = '#E6A100';
const SAFFRON = '#E05A47';
const CLAY = '#9C413D';
const INDIGO = '#1E224F';
const PURPLE = '#6B46C1';
const TEAL = '#0D9488';

const CATEGORY_COLORS = [
  '#9C413D', '#2B580C', '#E6A100', '#1E224F', '#0D9488',
  '#6B46C1', '#D97706', '#2563EB', '#4F46E5', '#059669',
  '#DC2626', '#7C3AED'
];

export default function MarketplaceBIDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [segments, setSegments] = useState(null);
  const [showMetabaseModal, setShowMetabaseModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchBIData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovRes, segRes] = await Promise.all([
        analyticsApi.get('/analytics/overview?days=45'),
        analyticsApi.get('/analytics/segments'),
      ]);
      setOverview(ovRes.data);
      setSegments(segRes.data);
    } catch (err) {
      console.error('Failed to load BI data:', err);
      setError('Failed to fetch data from Python Analytics service (localhost:5000). Check if service is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBIData();
  }, []);

  const handleRefreshAnalytics = async () => {
    try {
      setRefreshing(true);
      await analyticsApi.post('/analytics/refresh');
      showToast('K-Means clustering & TextBlob sentiment recomputed successfully!', 'success');
      await fetchBIData();
    } catch (err) {
      console.error('Failed to refresh analytics:', err);
      showToast('Failed to trigger analytics refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Sentiment donut data
  const sentimentData = overview?.sentimentDistribution ? [
    { name: 'Positive', value: overview.sentimentDistribution.Positive || 0, color: NEEM_GREEN },
    { name: 'Neutral', value: overview.sentimentDistribution.Neutral || 0, color: MARIGOLD },
    { name: 'Negative', value: overview.sentimentDistribution.Negative || 0, color: SAFFRON },
  ].filter(d => d.value > 0) : [];

  // Order status funnel steps
  const orderFunnel = overview?.orderStatusFunnel || {};
  const statusSteps = [
    { key: 'PLACED', label: 'Placed', count: orderFunnel.PLACED || 0, color: 'bg-blue-500' },
    { key: 'CONFIRMED', label: 'Confirmed', count: orderFunnel.CONFIRMED || 0, color: 'bg-indigo-600' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: orderFunnel.OUT_FOR_DELIVERY || 0, color: 'bg-marigold' },
    { key: 'DELIVERED', label: 'Delivered', count: orderFunnel.DELIVERED || 0, color: 'bg-neem' },
  ];

  // Seller approval funnel
  const sellerFunnel = overview?.sellerApprovalFunnel || {};
  const sellerApproved = sellerFunnel.APPROVED || 0;
  const sellerPending = sellerFunnel.PENDING || 0;
  const sellerRejected = sellerFunnel.REJECTED || 0;
  const totalSellerSubmissions = sellerApproved + sellerPending + sellerRejected;

  // Segment breakdown
  const segmentDist = segments?.distribution || {};
  const segmentCards = [
    {
      label: 'High-Spenders',
      count: segmentDist['High-Spenders'] || 0,
      description: 'Frequent buyers with large basket sizes',
      color: 'border-neem/30 bg-neem/5 text-neem',
    },
    {
      label: 'Frequent Shoppers',
      count: segmentDist['Frequent Shoppers'] || 0,
      description: 'Repeat purchases of everyday staples',
      color: 'border-marigold/40 bg-marigold/10 text-indigo',
    },
    {
      label: 'Occasional Buyers',
      count: segmentDist['Occasional Buyers'] || 0,
      description: 'Infrequent or single-purchase shoppers',
      color: 'border-clay/30 bg-clay/5 text-clay',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-clay/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-clay text-warmwhite text-[10px] font-bold uppercase tracking-wider">
              BI & Analytics Suite
            </span>
            <span className="text-xs text-indigo/40">&bull;</span>
            <span className="text-xs font-semibold text-neem flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neem animate-pulse"></span> Read-Only Postgres Replica Connected
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-indigo">
            Mohalla Marketplace Business Intelligence
          </h1>
          <p className="text-xs text-indigo/70 mt-1 max-w-2xl">
            Marketplace-wide 45-day financial trends, cross-category revenue share, fulfillment funnels, NLP sentiment scoring, and Scikit-learn K-Means customer segmentation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowMetabaseModal(true)}
            className="px-3.5 py-2 rounded-xl bg-warmwhite hover:bg-white border border-clay/20 text-indigo text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-clay" /> Metabase / SQL Config
          </button>

          <button
            onClick={handleRefreshAnalytics}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-clay hover:bg-clay/90 text-warmwhite text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Recomputing...' : 'Recompute ML Models'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-saffron/10 border border-saffron/30 text-saffron text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchBIData}
            className="text-xs font-bold underline ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !overview && (
        <div className="py-24 text-center">
          <RefreshCw className="w-9 h-9 mx-auto text-clay animate-spin mb-3" />
          <p className="text-sm font-medium text-indigo/70">
            Querying marketplace data & computing Scikit-learn clusters...
          </p>
        </div>
      )}

      {!loading && overview && (
        <div className="space-y-8">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-clay/15 shadow-sm">
              <span className="block text-[11px] font-bold uppercase text-indigo/60">Gross Revenue (45d)</span>
              <div className="font-display text-2xl text-indigo font-bold mt-1">
                ₹{(overview.totals?.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-neem font-semibold mt-0.5 block">
                Across 13 demo sellers
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-clay/15 shadow-sm">
              <span className="block text-[11px] font-bold uppercase text-indigo/60">Total Orders</span>
              <div className="font-display text-2xl text-indigo font-bold mt-1">
                {overview.totals?.totalOrders || 0}
              </div>
              <span className="text-[10px] text-indigo/50 mt-0.5 block">
                45-day backfilled volume
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-clay/15 shadow-sm">
              <span className="block text-[11px] font-bold uppercase text-indigo/60">Active Merchants</span>
              <div className="font-display text-2xl text-indigo font-bold mt-1">
                {overview.totals?.totalSellers || 0}
              </div>
              <span className="text-[10px] text-marigold font-semibold mt-0.5 block">
                {sellerPending} pending approval
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-clay/15 shadow-sm">
              <span className="block text-[11px] font-bold uppercase text-indigo/60">Catalog SKUs</span>
              <div className="font-display text-2xl text-indigo font-bold mt-1">
                {overview.totals?.totalProducts || 0}
              </div>
              <span className="text-[10px] text-indigo/50 mt-0.5 block">
                {overview.categories?.length || 0} distinct categories
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-clay/15 shadow-sm col-span-2 sm:col-span-1">
              <span className="block text-[11px] font-bold uppercase text-indigo/60">Customer Reviews</span>
              <div className="font-display text-2xl text-indigo font-bold mt-1">
                {overview.totalReviews || 0}
              </div>
              <span className="text-[10px] text-neem font-semibold mt-0.5 block">
                {Math.round(((overview.sentimentDistribution?.Positive || 0) / (overview.totalReviews || 1)) * 100)}% positive rating
              </span>
            </div>
          </div>

          {/* Row 1: Marketplace 45-Day Revenue & Volume Trend */}
          <div className="bg-white rounded-2xl border border-clay/20 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-display text-lg text-indigo flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-clay" />
                  Marketplace 45-Day Revenue Trend (All Sellers)
                </h3>
                <p className="text-xs text-indigo/60">
                  Daily aggregate Gross Merchandise Value in ₹ and daily order counts across all 13 mohalla merchants
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-indigo">
                  <span className="w-3 h-3 rounded-full bg-clay"></span> Gross Revenue (₹)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-indigo/70">
                  <span className="w-3 h-3 rounded-full bg-marigold"></span> Orders / Day
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={overview.marketplaceTrend || []}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="marketRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CLAY} stopOpacity={0.25} />
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
                    formatter={(val, name) => [
                      name === 'revenue' ? `₹${Number(val).toLocaleString('en-IN')}` : `${val} orders`,
                      name === 'revenue' ? 'Marketplace Revenue' : 'Order Count'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CLAY}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#marketRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Category Breakdown (Bar Chart + Table) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 cols: Category Bar Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-clay/20 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg text-indigo flex items-center gap-2">
                    <Layers className="w-5 h-5 text-clay" />
                    Top Categories by Cumulative Revenue
                  </h3>
                  <p className="text-xs text-indigo/60">
                    Gross sales distribution across grocery, crafts, bakery, handloom, and services
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={overview.categories || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#8B8680"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="category"
                      type="category"
                      stroke="#1E224F"
                      fontSize={11}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        fontSize: '11px',
                      }}
                      formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Bar
                      dataKey="totalRevenue"
                      fill={CLAY}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 5 cols: Category Data Table */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-clay/20 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display text-lg text-indigo mb-1">
                  Category Market Share
                </h3>
                <p className="text-xs text-indigo/60 mb-4">
                  Merchant participation & order volume by sector
                </p>

                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-clay/10 text-indigo/60 font-semibold">
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-center">Stores</th>
                        <th className="pb-2 text-center">Orders</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clay/5">
                      {(overview.categories || []).map((cat) => (
                        <tr key={cat.category} className="hover:bg-ivory/50">
                          <td className="py-2 font-medium text-indigo">{cat.category}</td>
                          <td className="py-2 text-center text-indigo/70">{cat.storeCount}</td>
                          <td className="py-2 text-center text-indigo/70">{cat.orderCount}</td>
                          <td className="py-2 text-right font-bold text-clay">
                            ₹{cat.totalRevenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-clay/10 text-xs text-indigo/50">
                Kirana, Mandi, and Dairy drive high order frequency, while Artisanal Crafts generate high average order values.
              </div>
            </div>
          </div>

          {/* Row 3: Funnels & Sentiment Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Order Status Funnel */}
            <div className="bg-white rounded-2xl border border-clay/20 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base text-indigo flex items-center gap-2">
                    <Package className="w-4 h-4 text-clay" />
                    Order Status Funnel
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neem/10 text-neem">
                    Lifecycle
                  </span>
                </div>
                <p className="text-xs text-indigo/60 mb-4">
                  Order fulfillment pipeline across current order records
                </p>

                <div className="space-y-3">
                  {statusSteps.map((step) => {
                    const totalO = overview.totals?.totalOrders || 1;
                    const pct = Math.round((step.count / totalO) * 100);

                    return (
                      <div key={step.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-indigo">{step.label}</span>
                          <span className="font-mono text-indigo/70">
                            {step.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-ivory rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${step.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-clay/10 text-[11px] text-indigo/60">
                All 540 historical seed orders carry DELIVERED status with backdated delivery timestamps.
              </div>
            </div>

            {/* Card 2: Seller Approval Funnel */}
            <div className="bg-white rounded-2xl border border-clay/20 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base text-indigo flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-clay" />
                    Merchant Approval Funnel
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-marigold/20 text-indigo">
                    Admin Queue
                  </span>
                </div>
                <p className="text-xs text-indigo/60 mb-4">
                  Merchant onboarding conversion rate from application to live storefront
                </p>

                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-neem/10 border border-neem/20 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-neem">APPROVED (Live)</span>
                      <span className="text-[11px] text-indigo/60">Active storefronts in Bazaar</span>
                    </div>
                    <span className="font-display text-2xl font-bold text-neem">{sellerApproved}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-marigold/10 border border-marigold/20 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-indigo">PENDING (Review Queue)</span>
                      <span className="text-[11px] text-indigo/60">Awaiting admin document verification</span>
                    </div>
                    <span className="font-display text-2xl font-bold text-indigo">{sellerPending}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-saffron/10 border border-saffron/20 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-saffron">REJECTED / SUSPENDED</span>
                      <span className="text-[11px] text-indigo/60">Non-compliant applications</span>
                    </div>
                    <span className="font-display text-2xl font-bold text-saffron">{sellerRejected}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-clay/10 text-[11px] text-indigo/60 flex items-center justify-between">
                <span>Application pass rate: {totalSellerSubmissions > 0 ? Math.round((sellerApproved / totalSellerSubmissions) * 100) : 0}%</span>
                <Link to="/admin/sellers" className="font-bold text-clay hover:underline">
                  Open Queue &rarr;
                </Link>
              </div>
            </div>

            {/* Card 3: Whole-Marketplace Sentiment Distribution */}
            <div className="bg-white rounded-2xl border border-clay/20 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base text-indigo flex items-center gap-2">
                    <Smile className="w-4 h-4 text-clay" />
                    Marketplace Sentiment
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo/5 text-indigo">
                    NLP Analysis
                  </span>
                </div>
                <p className="text-xs text-indigo/60 mb-2">
                  NLP polarity scored across all 99 customer reviews
                </p>

                <div className="h-40 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`bi-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} reviews`, name]}
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

                <div className="space-y-1.5 mt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-indigo">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NEEM_GREEN }}></span>
                      Positive (Neem)
                    </span>
                    <span className="font-bold text-neem">
                      {overview.sentimentDistribution?.Positive || 0} reviews ({Math.round(((overview.sentimentDistribution?.Positive || 0) / (overview.totalReviews || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-indigo">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MARIGOLD }}></span>
                      Neutral (Marigold)
                    </span>
                    <span className="font-bold text-marigold">
                      {overview.sentimentDistribution?.Neutral || 0} reviews ({Math.round(((overview.sentimentDistribution?.Neutral || 0) / (overview.totalReviews || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-indigo">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SAFFRON }}></span>
                      Negative (Saffron)
                    </span>
                    <span className="font-bold text-saffron">
                      {overview.sentimentDistribution?.Negative || 0} reviews ({Math.round(((overview.sentimentDistribution?.Negative || 0) / (overview.totalReviews || 1)) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-clay/10 text-[11px] text-indigo/60">
                Varied feedback signals include authentic delivery critique and praise.
              </div>
            </div>
          </div>

          {/* Row 4: Scikit-learn Customer Segments (K-Means Clustering) */}
          <div className="bg-white rounded-2xl border border-clay/20 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-display text-lg text-indigo flex items-center gap-2">
                  <Users className="w-5 h-5 text-clay" />
                  Customer Segmentation (Scikit-Learn K-Means, k=3)
                </h3>
                <p className="text-xs text-indigo/60">
                  Unsupervised clustering across RFM vectors (Total Spent, Order Frequency, AOV, Recency)
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-clay/10 text-clay">
                {segments?.totalCustomers || 0} Profiled Buyers
              </span>
            </div>

            {/* Segment summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {segmentCards.map((seg) => (
                <div
                  key={seg.label}
                  className={`p-4 rounded-xl border ${seg.color} shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-base font-bold">{seg.label}</span>
                    <span className="font-display text-2xl font-bold">{seg.count} buyers</span>
                  </div>
                  <p className="text-xs opacity-80">{seg.description}</p>
                </div>
              ))}
            </div>

            {/* Clustered Customers Table */}
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-clay/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory sticky top-0 border-b border-clay/10 text-indigo/70 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Buyer Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4 text-center">Orders</th>
                    <th className="py-2.5 px-4 text-right">Total Spent</th>
                    <th className="py-2.5 px-4 text-right">Avg Order Value</th>
                    <th className="py-2.5 px-4 text-center">Last Active</th>
                    <th className="py-2.5 px-4 text-center">Segment Cluster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clay/5">
                  {(segments?.customers || []).map((c) => (
                    <tr key={c.user_id} className="hover:bg-ivory/40">
                      <td className="py-2.5 px-4 font-semibold text-indigo">{c.buyer_name}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-indigo/60">{c.email}</td>
                      <td className="py-2.5 px-4 text-center font-medium text-indigo">{c.order_frequency}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-clay">
                        ₹{c.total_spent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-right text-indigo/80">
                        ₹{Math.round(c.average_order_value).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-center text-indigo/60">
                        {c.days_since_last_order === 0 ? 'Today' : `${c.days_since_last_order}d ago`}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.segment_label === 'High-Spenders'
                            ? 'bg-neem/15 text-neem'
                            : c.segment_label === 'Frequent Shoppers'
                            ? 'bg-marigold/20 text-indigo'
                            : 'bg-clay/10 text-clay'
                        }`}>
                          {c.segment_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Metabase / Read-Only Postgres Credentials Modal */}
      {showMetabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-clay/20 animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-clay/10">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-clay" />
                <h3 className="font-display text-lg text-indigo">Metabase / External BI Credentials</h3>
              </div>
              <button
                onClick={() => setShowMetabaseModal(false)}
                className="text-indigo/50 hover:text-indigo text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-indigo/70 leading-relaxed mb-4">
              To visualize this data inside an external BI tool such as <strong>Metabase (metabase.jar)</strong>, <strong>Power BI Desktop</strong>, or <strong>DBeaver</strong>, connect directly to PostgreSQL using the sandboxed read-only credentials created for the analytics layer:
            </p>

            <div className="bg-ivory rounded-xl p-4 space-y-2 text-xs font-mono border border-clay/10 mb-5">
              <div className="flex justify-between">
                <span className="text-indigo/60">Host:</span>
                <span className="font-bold text-indigo">localhost</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo/60">Port:</span>
                <span className="font-bold text-indigo">5432</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo/60">Database:</span>
                <span className="font-bold text-indigo">localconnect_db</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo/60">Username:</span>
                <span className="font-bold text-clay">analytics_reader</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo/60">Password:</span>
                <span className="font-bold text-indigo">AnalyticsReader@1234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo/60">Access Privileges:</span>
                <span className="font-bold text-neem">SELECT-only on transactional tables</span>
              </div>
            </div>

            <div className="p-3 bg-neem/10 rounded-xl border border-neem/20 text-[11px] text-neem mb-5 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Setup Required:</strong> The built-in Recharts BI Dashboard above renders all required visual models natively in React without needing a separate Metabase installation.
              </span>
            </div>

            <button
              onClick={() => setShowMetabaseModal(false)}
              className="w-full py-2.5 rounded-xl bg-clay hover:bg-clay/90 text-warmwhite text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Close Information
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
