import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Store,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Star,
  RefreshCw,
  AlertTriangle,
  Send
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TIMELINE_STEPS = [
  {
    status: 'PLACED',
    label: 'Order Placed',
    sublabel: 'Payment verified & sent to artisan',
    icon: Clock,
  },
  {
    status: 'CONFIRMED',
    label: 'Artisan Preparing',
    sublabel: 'Crafting & packaging your item',
    icon: Package,
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    sublabel: 'Mohalla delivery partner in transit',
    icon: Truck,
  },
  {
    status: 'DELIVERED',
    label: 'Delivered',
    sublabel: 'Verified with 6-digit OTP',
    icon: CheckCircle2,
  },
];

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Seller verification state
  const [sellerOtpInput, setSellerOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to fetch order tracking:', err);
      toast.error(err.response?.data?.message || 'Could not load order tracking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleGenerateOtp = async () => {
    setIsGeneratingOtp(true);
    try {
      const res = await api.post(`/orders/${orderId}/generate-otp`);
      setGeneratedOtp(res.data.otp);
      setOtpExpiresAt(res.data.expiresAt);
      toast.success('New 6-digit Delivery OTP generated successfully!');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate delivery OTP');
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  const handleVerifySellerOtp = async (e) => {
    e.preventDefault();
    if (!sellerOtpInput.trim() || sellerOtpInput.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit OTP provided by the buyer');
      return;
    }

    setIsVerifying(true);
    try {
      await api.post(`/orders/${orderId}/verify-otp`, { otp: sellerOtpInput.trim() });
      toast.success('OTP verified! Package successfully marked as DELIVERED.');
      setSellerOtpInput('');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedOtp(true);
    toast.success('OTP copied to clipboard!');
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'PLACED':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-3 border-clay/20 border-t-clay rounded-full animate-spin" />
        <p className="text-sm font-semibold text-indigo/70">Connecting to Mohalla tracking network...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-warmwhite foil-border text-center space-y-4 shadow-warm">
        <div className="w-12 h-12 rounded-full bg-saffron/10 text-saffron flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-xl text-indigo">Order Not Found</h2>
        <p className="text-xs text-indigo/70">We could not locate tracking information for Order #{orderId}.</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo text-warmwhite text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to My Orders
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isBuyer = user && order.buyerId === user.id;
  const isSeller = user && (user.role === 'SELLER' || user.role === 'PENDING_SELLER');
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-clay/15 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-warmwhite hover:bg-white text-indigo border border-clay/20 transition-all shadow-sm"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl text-indigo">
                Order Tracking
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-clay/10 text-clay text-xs font-bold">
                #{order.id}
              </span>
            </div>
            <p className="text-xs text-indigo/60">
              Live delivery verification & dispatch updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrder}
            className="px-3.5 py-2 rounded-xl bg-warmwhite hover:bg-white text-indigo border border-clay/20 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-clay" /> Refresh Status
          </button>
          {isBuyer && (
            <Link
              to="/orders"
              className="px-3.5 py-2 rounded-xl bg-indigo hover:bg-deepdark text-warmwhite text-xs font-bold shadow-sm transition-all"
            >
              All My Orders
            </Link>
          )}
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="rounded-3xl bg-warmwhite foil-border p-6 sm:p-8 shadow-warm-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg sm:text-xl text-indigo flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-marigold" /> Delivery Progress
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo/10 text-indigo">
            Status: {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isUpcoming = idx > currentStep;

            return (
              <div
                key={step.status}
                className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-clay/10 border-clay shadow-sm ring-2 ring-clay/20'
                    : isCompleted
                    ? 'bg-neem/10 border-neem/40 text-indigo'
                    : 'bg-ivory/50 border-clay/15 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isCurrent
                        ? 'bg-clay text-warmwhite shadow-warm-sm animate-bounce'
                        : isCompleted
                        ? 'bg-neem text-warmwhite'
                        : 'bg-clay/20 text-indigo/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-indigo/50">
                    0{idx + 1}
                  </span>
                </div>

                <div>
                  <p className="font-display text-sm font-bold text-indigo">{step.label}</p>
                  <p className="text-[11px] text-indigo/70 mt-0.5 leading-snug">{step.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: OTP Verification & Order Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Delivery OTP Card (Buyer / Seller views) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* OTP Box */}
          <div className="rounded-3xl bg-indigo text-warmwhite p-6 sm:p-8 jali-bg relative overflow-hidden shadow-warm space-y-6">
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warmwhite/10 text-marigold text-xs font-semibold border border-marigold/20">
                <ShieldCheck className="w-4 h-4" /> 6-Digit Delivery OTP
              </div>
              <span className="text-xs text-warmwhite/70">Encrypted Handover</span>
            </div>

            {order.status === 'DELIVERED' ? (
              <div className="relative z-10 p-6 rounded-2xl bg-neem/20 border border-neem/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neem text-warmwhite flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl text-warmwhite">Delivery Completed!</h3>
                <p className="text-xs text-warmwhite/80">
                  This order was successfully verified with delivery OTP and handed over.
                </p>
                {order.productId && (
                  <Link
                    to={`/products/${order.productId}/review`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-marigold hover:bg-marigold/90 text-indigo text-xs font-bold transition-all shadow-sm"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" /> Rate & Review Artisan
                  </Link>
                )}
              </div>
            ) : (
              <div className="relative z-10 space-y-4">
                {generatedOtp ? (
                  <div className="p-5 rounded-2xl bg-warmwhite/10 border border-marigold/30 text-center space-y-3">
                    <p className="text-xs text-marigold font-semibold tracking-wide">
                      YOUR SECURE DELIVERY OTP
                    </p>
                    <div className="text-3xl sm:text-4xl font-mono font-black text-warmwhite tracking-[0.25em]">
                      {generatedOtp}
                    </div>
                    {otpExpiresAt && (
                      <p className="text-[11px] text-warmwhite/60">
                        Expires at: {new Date(otpExpiresAt).toLocaleTimeString()}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedOtp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-warmwhite/20 hover:bg-warmwhite/30 text-xs font-bold text-warmwhite transition-all cursor-pointer"
                    >
                      {copiedOtp ? <Check className="w-3.5 h-3.5 text-neem" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedOtp ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-warmwhite/5 border border-warmwhite/10 text-center space-y-3">
                    <p className="text-xs text-warmwhite/80">
                      {order.status === 'OUT_FOR_DELIVERY'
                        ? 'Package is in transit. Generate your 6-digit delivery passcode to show the courier.'
                        : 'Once the artisan dispatches your package, you can generate your 6-digit delivery passcode.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateOtp}
                      disabled={isGeneratingOtp}
                      className="px-5 py-2.5 rounded-xl bg-marigold hover:bg-marigold/90 text-indigo font-bold text-xs shadow-warm transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGeneratingOtp ? 'Generating Secure OTP...' : 'Generate 6-Digit OTP'}
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-warmwhite/70 leading-relaxed bg-warmwhite/5 p-3 rounded-xl border border-warmwhite/10">
                  <strong className="text-marigold">Security Note:</strong> Only share this 6-digit OTP with the delivery person once you physically inspect and receive your handcrafted item.
                </p>
              </div>
            )}
          </div>

          {/* Seller OTP Verification Section (if logged in as seller/admin) */}
          {(isSeller || isAdmin) && order.status === 'OUT_FOR_DELIVERY' && (
            <div className="rounded-3xl bg-warmwhite foil-border p-6 shadow-warm-sm space-y-4">
              <h3 className="font-display text-base text-indigo flex items-center gap-2">
                <Truck className="w-4 h-4 text-clay" /> Seller Handover Verification
              </h3>
              <p className="text-xs text-indigo/70">
                Ask the customer for their 6-digit delivery OTP to confirm package handover:
              </p>
              <form onSubmit={handleVerifySellerOtp} className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={sellerOtpInput}
                  onChange={(e) => setSellerOtpInput(e.target.value)}
                  placeholder="6-digit OTP"
                  className="w-36 px-3 py-2 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-clay/30 bg-ivory text-indigo focus:outline-none focus:border-clay"
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-2 rounded-xl bg-neem text-warmwhite text-xs font-bold shadow-sm hover:bg-neem/90 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {isVerifying ? 'Verifying...' : 'Verify & Complete'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Order & Delivery Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl bg-warmwhite foil-border p-6 sm:p-8 shadow-warm-sm space-y-6">
            <h2 className="font-display text-xl text-indigo border-b border-clay/10 pb-3">
              Order Summary
            </h2>

            {/* Item Details */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg text-indigo">
                    {order.productTitle}
                  </h3>
                  {order.storeId && (
                    <Link
                      to={`/stores/${order.storeId}`}
                      className="inline-flex items-center gap-1.5 text-xs text-clay hover:underline font-semibold mt-1"
                    >
                      <Store className="w-3.5 h-3.5" /> {order.storeName || 'Visit Artisan Storefront'}
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-clay font-bold">
                    ₹{order.totalPrice || '—'}
                  </p>
                  <p className="text-[11px] text-indigo/60">
                    Qty: {order.quantity} &bull; ₹{order.unitPrice}/unit
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Recipient Info */}
            <div className="p-4 rounded-2xl bg-ivory border border-clay/15 space-y-3">
              <p className="text-xs font-bold text-indigo tracking-wider uppercase">
                Delivery Details
              </p>
              
              <div className="space-y-2 text-xs text-indigo/80">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-clay shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo">{order.customerName || order.buyerName}</span>
                    {order.customerPhone && (
                      <span className="text-indigo/60 block">{order.customerPhone}</span>
                    )}
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-clay shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Mode */}
            <div className="flex items-center justify-between text-xs text-indigo/80 pt-2 border-t border-clay/10">
              <span>Payment Mode:</span>
              <span className="font-bold text-indigo">UPI / Pay on Delivery</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
