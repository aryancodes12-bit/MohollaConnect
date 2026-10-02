import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Smartphone, 
  CreditCard, 
  ShieldCheck, 
  Minus, 
  Plus, 
  CheckCircle2, 
  QrCode, 
  Truck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { launchOrderRazorpayCheckout } from '../../utils/razorpay';
import OrderBookingAnimation from './OrderBookingAnimation';
import { sendOrderPlacedEmail } from '../../services/emailService';
import { useNavigate } from 'react-router-dom';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', handle: '@okaxis', icon: '🟢' },
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl', icon: '🟣' },
  { id: 'paytm', name: 'Paytm', handle: '@paytm', icon: '🔵' },
  { id: 'bhim', name: 'BHIM UPI', handle: '@upi', icon: '🟠' },
  { id: 'cred', name: 'CRED UPI', handle: '@cred', icon: '⚪' },
];

export default function QuickOrderModal({ product, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '9876543210',
    addressLine: 'House 42, 2nd Cross, Near Mohalla Park',
    locality: product?.storeLocation || 'Local Mohalla Bazar',
  });

  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'RAZORPAY'
  const [selectedUpiApp, setSelectedUpiApp] = useState(UPI_APPS[0]);
  const [customUpiId, setCustomUpiId] = useState('neighbour@okhdfcbank');
  const [showQrCode, setShowQrCode] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showBookingAnimation, setShowBookingAnimation] = useState(false);
  const [confirmedOrders, setConfirmedOrders] = useState(null);

  if (!isOpen || !product) return null;

  const unitPrice = Number(product.price) || 0;
  const totalAmount = unitPrice * quantity;

  const handleOrderSubmit = async () => {
    if (!address.name || !address.phone || !address.addressLine) {
      showToast('Please fill delivery address details', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      let paymentDetails = {
        method: paymentMode,
        paymentId: 'pay_upi_demo_' + Date.now().toString(36),
      };

      // 1. If Razorpay Demo is selected, launch real test modal
      if (paymentMode === 'RAZORPAY') {
        try {
          const rzpResult = await launchOrderRazorpayCheckout({
            amount: totalAmount,
            customerName: address.name,
            customerEmail: user?.email || 'buyer@localconnect.in',
            customerPhone: address.phone,
            orderDescription: `${quantity}x ${product.title} (${product.storeName})`,
          });
          paymentDetails = rzpResult;
        } catch (rzpErr) {
          setIsProcessing(false);
          showToast(rzpErr.message || 'Razorpay payment was cancelled', 'warning');
          return;
        }
      }

      // 2. Start booking animation overlay!
      setShowBookingAnimation(true);

      // 3. Place order via backend API
      const fullAddress = `${address.addressLine}, ${address.locality}`;
      const payload = {
        items: [
          {
            productId: product.id,
            quantity: quantity,
          },
        ],
        deliveryAddress: fullAddress,
        customerPhone: address.phone,
        customerName: address.name,
        deliveryLatitude: product.storeLatitude || null,
        deliveryLongitude: product.storeLongitude || null,
      };

      const res = await api.post('/orders/checkout', payload);
      const createdOrders = res.data;
      setConfirmedOrders(createdOrders);

      // Trigger Order Placed EmailJS notification
      const recipientEmail = user?.email || createdOrders[0]?.buyerEmail;
      if (recipientEmail) {
        sendOrderPlacedEmail({
          toEmail: recipientEmail,
          toName: address.name,
          orderId: `#${createdOrders[0]?.id || 'NEW'}`,
          items: [
            {
              title: product.title,
              quantity: quantity,
              price: totalAmount,
            },
          ],
          totalAmount: totalAmount,
          deliveryAddress: fullAddress,
          trackingLink: `${window.location.origin}/orders/${createdOrders[0]?.id}`,
        }).catch((err) => console.warn('EmailJS error:', err));
      }

      showToast(`Order for ${product.title} placed successfully!`, 'success');
      if (onSuccess) onSuccess(createdOrders);
    } catch (err) {
      console.error('Quick order failed:', err);
      setShowBookingAnimation(false);
      setIsProcessing(false);
      showToast(err.response?.data?.message || 'Failed to place order. Please try again.', 'error');
    }
  };

  const handleAnimationComplete = () => {
    setShowBookingAnimation(false);
    setIsProcessing(false);
    onClose();
    if (confirmedOrders && confirmedOrders[0]) {
      navigate(`/orders/${confirmedOrders[0].id}`);
    } else {
      navigate('/orders');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-warmwhite rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 border-2 border-clay/20 shadow-2xl relative jali-bg max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-indigo/60 hover:text-indigo hover:bg-clay/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="space-y-1 pr-6 border-b border-clay/15 pb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-clay uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Direct Mohalla Quick Order
            </div>
            <h2 className="font-display text-2xl text-indigo">{product.title}</h2>
            <p className="text-xs text-indigo/60">
              Sold by <strong className="text-indigo">{product.storeName || 'Neighbourhood Store'}</strong> &bull; {product.storeLocation || 'Local Bazaar'}
            </p>
          </div>

          {/* Product & Quantity Card */}
          <div className="bg-white/80 p-4 rounded-2xl border border-clay/15 flex items-center justify-between gap-4 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] text-indigo/50 font-medium">Item Price</span>
              <div className="font-display text-xl text-clay">₹{unitPrice}</div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-indigo">Quantity:</span>
              <div className="flex items-center border border-clay/30 rounded-xl bg-warmwhite overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-indigo/70 hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-indigo text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockQty || 99, q + 1))}
                  className="p-2 text-indigo/70 hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-indigo/50 font-medium">Subtotal</span>
              <div className="font-display text-2xl text-indigo font-bold">₹{totalAmount.toFixed(2)}</div>
            </div>
          </div>

          {/* Delivery Details Form */}
          <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-clay/10">
            <h4 className="font-display text-sm font-bold text-indigo flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-clay" /> Delivery Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-indigo/70 block mb-1">Your Name</label>
                <input
                  type="text"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-warmwhite border border-clay/20 text-indigo text-xs focus:ring-1 focus:ring-clay"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="font-semibold text-indigo/70 block mb-1">Phone (Delivery Handover)</label>
                <input
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-warmwhite border border-clay/20 text-indigo text-xs focus:ring-1 focus:ring-clay"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-indigo/70 block mb-1 text-xs">Doorstep / Flat Address</label>
              <input
                type="text"
                value={address.addressLine}
                onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-warmwhite border border-clay/20 text-indigo text-xs focus:ring-1 focus:ring-clay"
                placeholder="House / Flat / Street name"
              />
            </div>
          </div>

          {/* Payment Method Selector (UPI Demo vs Razorpay Demo) */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-indigo flex items-center justify-between">
              <span>Choose Payment Method (Demo)</span>
              <span className="text-[11px] font-mono text-neem font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Mohalla Escrow Secured
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Instant UPI Demo */}
              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMode === 'UPI'
                    ? 'border-clay bg-clay/10 shadow-sm'
                    : 'border-clay/20 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">⚡</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    paymentMode === 'UPI' ? 'bg-clay text-warmwhite' : 'bg-gray-100 text-gray-600'
                  }`}>
                    POPULAR
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-display text-sm font-bold text-indigo">Instant UPI (Demo)</div>
                  <div className="text-[11px] text-indigo/60">GPay, PhonePe, Paytm, QR</div>
                </div>
              </button>

              {/* Option 2: Razorpay Demo */}
              <button
                type="button"
                onClick={() => setPaymentMode('RAZORPAY')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMode === 'RAZORPAY'
                    ? 'border-clay bg-clay/10 shadow-sm'
                    : 'border-clay/20 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    paymentMode === 'RAZORPAY' ? 'bg-clay text-warmwhite' : 'bg-gray-100 text-gray-600'
                  }`}>
                    SANDBOX
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-display text-sm font-bold text-indigo">Razorpay (Demo)</div>
                  <div className="text-[11px] text-indigo/60">Cards, Netbanking, Official Modal</div>
                </div>
              </button>
            </div>

            {/* Dynamic Payment Body */}
            {paymentMode === 'UPI' ? (
              <div className="p-4 rounded-2xl bg-white border border-clay/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo">Quick UPI Apps</span>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-xs text-clay font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> {showQrCode ? 'Hide QR' : 'Show QR Code'}
                  </button>
                </div>

                {/* Popular App Chips */}
                <div className="grid grid-cols-5 gap-1.5">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        setSelectedUpiApp(app);
                        setCustomUpiId(`user${app.handle}`);
                      }}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center ${
                        selectedUpiApp.id === app.id
                          ? 'border-clay bg-clay/10 shadow-xs'
                          : 'border-clay/15 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base">{app.icon}</span>
                      <span className="text-[10px] font-semibold text-indigo mt-0.5 truncate w-full">
                        {app.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>

                {showQrCode ? (
                  <div className="p-3 bg-ivory rounded-xl border border-clay/20 text-center space-y-2">
                    <div className="w-28 h-28 bg-white p-2 rounded-xl mx-auto shadow-sm border border-clay/20 flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-indigo" />
                    </div>
                    <p className="text-[11px] text-indigo/70 font-mono">
                      localconnect.mohalla@upi &bull; ₹{totalAmount.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-indigo/70 block mb-1">
                      UPI ID / Virtual Payment Address
                    </label>
                    <input
                      type="text"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-warmwhite border border-clay/20 text-indigo text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-clay/15 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-blue-700 font-bold">
                  <CreditCard className="w-4 h-4" /> Razorpay Test Sandbox
                </div>
                <p className="text-indigo/70 text-[11px]">
                  Clicking below will open the official Razorpay test checkout window with key <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-clay">rzp_test_T3Fhdi7QvZzqdQ</code>.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-clay/15">
            <div>
              <span className="text-[11px] text-indigo/50 font-medium block">Total Payable</span>
              <div className="font-display text-2xl text-clay font-bold">₹{totalAmount.toFixed(2)}</div>
            </div>

            <button
              type="button"
              onClick={handleOrderSubmit}
              disabled={isProcessing}
              className="px-6 py-3.5 rounded-2xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Order...
                </>
              ) : (
                <>
                  Pay ₹{totalAmount.toFixed(2)} & Book Order <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Booking Animation Overlay */}
      <AnimatePresence>
        {showBookingAnimation && (
          <OrderBookingAnimation
            amount={totalAmount}
            paymentMethod={paymentMode === 'RAZORPAY' ? 'Razorpay (Demo)' : `UPI (${selectedUpiApp.name})`}
            storeName={product.storeName || 'Local Mohalla Artisan'}
            deliveryAddress={address.addressLine}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}
