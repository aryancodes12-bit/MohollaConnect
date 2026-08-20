import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Star,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DELIVERED'
  const [expandedGroups, setExpandedGroups] = useState({});

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/orders/buyer/${user.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load buyer orders:', err);
      toast.error(err.response?.data?.message || 'Could not load your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key], // default is expanded
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo/10 text-indigo border border-indigo/20">
            <Clock className="w-3.5 h-3.5" /> Order Placed
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-marigold/15 text-marigold border border-marigold/30">
            <Package className="w-3.5 h-3.5" /> Artisan Preparing
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-clay/15 text-clay border border-clay/30 animate-pulse">
            <Truck className="w-3.5 h-3.5" /> Out for Delivery
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neem/15 text-neem border border-neem/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Group orders by checkoutGroupId (or standalone single order)
  const groupedOrders = useMemo(() => {
    const groupsMap = new Map();

    orders.forEach((order) => {
      const key = order.checkoutGroupId ? `group_${order.checkoutGroupId}` : `single_${order.id}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          groupId: order.checkoutGroupId || null,
          key,
          items: [],
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
        });
      }
      groupsMap.get(key).items.push(order);
    });

    const list = Array.from(groupsMap.values()).map((group) => {
      const isMulti = group.items.length > 1;
      const totalAmount = group.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
      const deliveredCount = group.items.filter((item) => item.status === 'DELIVERED').length;
      const isAllDelivered = deliveredCount === group.items.length;
      const isPartiallyDelivered = deliveredCount > 0 && !isAllDelivered;

      return {
        ...group,
        isMulti,
        totalAmount,
        deliveredCount,
        isAllDelivered,
        isPartiallyDelivered,
      };
    });

    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders]);

  const filteredGroups = useMemo(() => {
    return groupedOrders.filter((group) => {
      if (filter === 'ACTIVE') {
        return !group.isAllDelivered;
      }
      if (filter === 'DELIVERED') {
        return group.isAllDelivered;
      }
      return true;
    });
  }, [groupedOrders, filter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-clay/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay/10 text-clay text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Direct Artisan Deliveries
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-indigo tracking-tight">
            My Mohalla Orders
          </h1>
          <p className="text-sm text-indigo/70 mt-1">
            Track live package dispatches, access delivery OTPs, and review your handcrafted purchases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-warmwhite hover:bg-white text-indigo border border-clay/20 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-clay' : ''}`} />
          </button>
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl bg-clay hover:bg-clay/90 text-warmwhite text-xs font-bold shadow-warm transition-all flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Explore Bazaar
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-clay/10 pb-3">
        {[
          { key: 'ALL', label: `All Checkouts (${groupedOrders.length})` },
          {
            key: 'ACTIVE',
            label: `In Progress (${groupedOrders.filter((g) => !g.isAllDelivered).length})`,
          },
          {
            key: 'DELIVERED',
            label: `Delivered (${groupedOrders.filter((g) => g.isAllDelivered).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              filter === tab.key
                ? 'bg-indigo text-warmwhite shadow-sm'
                : 'bg-warmwhite/70 hover:bg-warmwhite text-indigo/70 hover:text-indigo'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-3 border-clay/20 border-t-clay rounded-full animate-spin" />
          <p className="text-sm text-indigo/60">Fetching your order history...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-3xl bg-warmwhite foil-border p-12 text-center max-w-lg mx-auto space-y-4 shadow-warm-sm">
          <div className="w-16 h-16 rounded-full bg-clay/10 text-clay flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl text-indigo">No orders found</h3>
          <p className="text-sm text-indigo/70">
            {filter === 'ACTIVE'
              ? 'You do not have any active orders in transit.'
              : 'You have not placed any orders yet. Discover authentic handmade creations from local artisans!'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-warmwhite text-sm font-bold shadow-warm hover:bg-clay/90 transition-all"
          >
            Browse Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups[group.key] !== false; // Default expanded

            // Multi-Item Order Group Card
            if (group.isMulti) {
              return (
                <div
                  key={group.key}
                  className="rounded-3xl bg-warmwhite foil-border border-2 border-clay/20 shadow-warm-sm hover:shadow-warm transition-all overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    onClick={() => toggleGroup(group.key)}
                    className="p-5 sm:p-6 bg-gradient-to-r from-ivory to-warmwhite border-b border-clay/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-clay text-warmwhite shadow-sm">
                          <Layers className="w-3.5 h-3.5" /> Order Group ({group.items.length} items)
                        </span>

                        {group.groupId && (
                          <span className="text-xs font-mono font-bold text-indigo/60 px-2.5 py-0.5 rounded-lg bg-white border border-clay/15">
                            #{group.groupId.substring(0, 8)}
                          </span>
                        )}

                        {group.createdAt && (
                          <span className="text-xs text-indigo/50">
                            {new Date(group.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Group status & delivery address */}
                      <div className="flex flex-wrap items-center gap-2">
                        {group.isAllDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neem/15 text-neem border border-neem/30">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All {group.items.length} Items Delivered
                          </span>
                        ) : group.isPartiallyDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-marigold/20 text-indigo border border-marigold/40">
                            <Truck className="w-3.5 h-3.5 text-clay" /> {group.deliveredCount} of {group.items.length} items delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo/10 text-indigo border border-indigo/20">
                            <Clock className="w-3.5 h-3.5" /> All Items In Progress
                          </span>
                        )}

                        {group.deliveryAddress && (
                          <span className="text-xs text-indigo/60 truncate max-w-md">
                            &bull; Delivering to: {group.deliveryAddress}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group Total & Toggle Chevron */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-clay/10">
                      <div className="text-right">
                        <span className="text-[11px] text-indigo/50 font-medium block">Combined Total</span>
                        <span className="font-display text-xl text-clay font-bold">
                          ₹{group.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white border border-clay/20 flex items-center justify-center text-indigo/60 hover:text-indigo">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Group Line Items */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="divide-y divide-clay/10 bg-warmwhite p-2 sm:p-4"
                      >
                        {group.items.map((order) => (
                          <div
                            key={order.id}
                            className="p-4 rounded-2xl hover:bg-white transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            {/* Line Item Info */}
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-indigo/50">
                                  Line Item #{order.id}
                                </span>
                                {getStatusBadge(order.status)}
                              </div>

                              <h4 className="font-display text-base text-indigo font-bold">
                                {order.productTitle}
                              </h4>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-indigo/70">
                                <span>
                                  Sold by:{' '}
                                  <strong className="text-indigo">{order.storeName || 'Local Artisan'}</strong>
                                </span>
                                <span>&bull;</span>
                                <span>
                                  Qty: <strong>{order.quantity}</strong>
                                </span>
                                <span>&bull;</span>
                                <span>
                                  Price: <strong>₹{order.unitPrice}</strong>
                                </span>
                                <span>&bull;</span>
                                <span>
                                  Line Total: <strong className="text-clay">₹{order.totalPrice}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Line Item Actions: Independent Track & Review */}
                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                to={`/orders/${order.id}`}
                                className="px-4 py-2 rounded-xl bg-indigo hover:bg-deepdark text-warmwhite text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <Truck className="w-3.5 h-3.5 text-marigold" /> Track & OTP
                              </Link>

                              {order.status === 'DELIVERED' && order.productId && (
                                <Link
                                  to={`/products/${order.productId}/review`}
                                  className="px-3.5 py-2 rounded-xl bg-marigold/15 hover:bg-marigold text-marigold hover:text-indigo border border-marigold/30 text-xs font-bold transition-all flex items-center gap-1"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" /> Review
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Single Item Order Card (Clean, standard single card — no unnecessary group wrapper!)
            const singleOrder = group.items[0];
            return (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-warmwhite foil-border p-5 sm:p-6 shadow-warm-sm hover:shadow-warm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Order Info Left */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-indigo/50 tracking-wider">
                      ORDER #{singleOrder.id}
                    </span>
                    {getStatusBadge(singleOrder.status)}
                    {singleOrder.createdAt && (
                      <span className="text-xs text-indigo/50">
                        {new Date(singleOrder.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-lg sm:text-xl text-indigo">
                      {singleOrder.productTitle}
                    </h3>
                    <p className="text-xs text-indigo/70 mt-0.5">
                      Sold by:{' '}
                      <span className="font-semibold text-indigo">
                        {singleOrder.storeName || 'Verified Mohalla Artisan'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-indigo/80 pt-1">
                    <span>
                      Quantity: <strong className="text-indigo">{singleOrder.quantity}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Item Price: <strong>₹{singleOrder.unitPrice || '—'}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Total: <strong className="text-clay text-sm">₹{singleOrder.totalPrice || '—'}</strong>
                    </span>
                  </div>

                  {singleOrder.deliveryAddress && (
                    <p className="text-xs text-indigo/60 truncate max-w-xl">
                      <span className="font-medium text-indigo/80">Delivering to:</span> {singleOrder.deliveryAddress}
                    </p>
                  )}
                </div>

                {/* Action Buttons Right */}
                <div className="flex flex-row md:flex-col items-center sm:items-end justify-between md:justify-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-clay/10">
                  <Link
                    to={`/orders/${singleOrder.id}`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo hover:bg-deepdark text-warmwhite text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-marigold" /> Track & OTP
                  </Link>

                  {singleOrder.status === 'DELIVERED' && singleOrder.productId && (
                    <Link
                      to={`/products/${singleOrder.productId}/review`}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-marigold/15 hover:bg-marigold text-marigold hover:text-indigo border border-marigold/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" /> Write Review
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
