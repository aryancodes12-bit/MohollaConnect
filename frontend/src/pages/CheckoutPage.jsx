import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  QrCode,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { sendOrderPlacedEmail } from '../services/emailService';
import OrderBookingAnimation from '../components/booking/OrderBookingAnimation';
import { launchOrderRazorpayCheckout } from '../utils/razorpay';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', handle: '@okaxis', icon: '🟢' },
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl', icon: '🟣' },
  { id: 'paytm', name: 'Paytm', handle: '@paytm', icon: '🔵' },
  { id: 'bhim', name: 'BHIM UPI', handle: '@upi', icon: '🟠' },
  { id: 'cred', name: 'CRED UPI', handle: '@cred', icon: '⚪' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    addressLine: '',
    locality: '',
    pinCode: '',
    deliveryLatitude: null,
    deliveryLongitude: null,
  });

  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'RAZORPAY'
  const [selectedUpiApp, setSelectedUpiApp] = useState(UPI_APPS[0]);
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [showQrCode, setShowQrCode] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [razorpayPaymentDetails, setRazorpayPaymentDetails] = useState(null);

  const [isPlacingOrders, setIsPlacingOrders] = useState(false);
  const [showBookingAnimation, setShowBookingAnimation] = useState(false);
  const [placedOrders, setPlacedOrders] = useState([]);

  if (cart.length === 0 && !isPlacingOrders && currentStep !== 4 && !showBookingAnimation) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-warmwhite rounded-2xl text-center shadow-warm border border-clay/20 space-y-4">
        <ShoppingBag className="w-12 h-12 text-clay mx-auto opacity-40" />
        <h2 className="text-2xl font-display text-indigo">Your Cart is Empty</h2>
        <p className="text-indigo/70">Add artisanal and daily items from your Mohalla to proceed with checkout.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-clay text-warmwhite font-semibold hover:bg-saffron transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Mohalla Bazaar
        </Link>
      </div>
    );
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.locality) {
      showToast('Please fill all delivery address and location fields', 'error');
      return;
    }
    setCurrentStep(2);
  };

  const handleSimulatedUpiPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentDone(true);
      setCurrentStep(3);
      showToast(`UPI authorization verified via ${selectedUpiApp.name}!`, 'success');
    }, 1200);
  };

  const handleRazorpayPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const result = await launchOrderRazorpayCheckout({
        amount: totalAmount,
        customerName: address.name,
        customerEmail: user?.email || 'buyer@localconnect.in',
        customerPhone: address.phone,
        orderDescription: `Mohalla Order (${cart.length} items)`,
      });

      setRazorpayPaymentDetails(result);
      setPaymentDone(true);
      setCurrentStep(3);
      showToast('Razorpay payment authorization completed!', 'success');
    } catch (err) {
      console.warn('Razorpay checkout notice:', err);
      showToast(err.message || 'Razorpay checkout cancelled', 'warning');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePlaceFinalOrders = async () => {
    setIsPlacingOrders(true);
    setShowBookingAnimation(true);

    const fullAddress = address.addressLine 
      ? `${address.addressLine}, ${address.locality}${address.pinCode ? `, PIN: ${address.pinCode}` : ''}`
      : address.locality;
    
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        deliveryAddress: fullAddress,
        customerPhone: address.phone,
        customerName: address.name,
        deliveryLatitude: address.deliveryLatitude,
        deliveryLongitude: address.deliveryLongitude,
      };

      const res = await api.post('/orders/checkout', payload);
      const createdOrders = res.data;

      setPlacedOrders(createdOrders);

      // Trigger Order Placed EmailJS notification
      const recipientEmail = user?.email || createdOrders[0]?.buyerEmail;
      if (recipientEmail) {
        const orderIdentifier = createdOrders[0]?.checkoutGroupId || `#${createdOrders.map(o => o.id).join(', #')}`;
        const totalPlaced = createdOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
        
        sendOrderPlacedEmail({
          toEmail: recipientEmail,
          toName: address.name || user?.name || 'Valued Customer',
          orderId: orderIdentifier,
          items: createdOrders.map(o => ({
            title: o.productTitle,
            quantity: o.quantity,
            price: o.totalPrice,
          })),
          totalAmount: totalPlaced,
          deliveryAddress: fullAddress,
          trackingLink: `${window.location.origin}/orders`,
        }).then((emailRes) => {
          if (emailRes.success) {
            showToast(`Order confirmation email sent to ${recipientEmail}`, 'info');
          } else {
            console.warn('EmailJS Order Placed Notice:', emailRes.error);
            showToast("Order placed successfully, but we couldn't send the confirmation email", 'warning');
          }
        }).catch((err) => {
          console.warn('EmailJS unexpected error:', err);
        });
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      setShowBookingAnimation(false);
      showToast(err.response?.data?.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsPlacingOrders(false);
    }
  };

  const handleAnimationComplete = () => {
    clearCart();
    setShowBookingAnimation(false);
    setCurrentStep(4);
    showToast(`Order placed successfully with Mohalla OTP protection!`, 'success');
  };

  if (currentStep === 4 && placedOrders.length > 0) {
    const isGroup = placedOrders.length > 1;
    const checkoutGroupId = placedOrders[0]?.checkoutGroupId;
    const totalPlaced = placedOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-warmwhite rounded-3xl p-8 border border-clay/20 shadow-warm text-center space-y-5 jali-bg">
          <div className="w-16 h-16 rounded-full bg-neem/15 text-neem flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neem/10 text-neem text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> {isGroup ? 'Multi-Item Checkout Complete' : 'Order Placed Successfully'}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-indigo">
              {isGroup ? 'Order Group Confirmation' : 'Order Confirmed!'}
            </h1>
            <p className="text-sm text-indigo/70 mt-1 max-w-md mx-auto">
              {isGroup
                ? `All ${placedOrders.length} items from your cart were placed together under a single checkout session.`
                : 'Your order has been placed with the local seller.'}
            </p>
          </div>

          {/* Group details pill */}
          {isGroup && checkoutGroupId && (
            <div className="inline-block bg-ivory border border-clay/20 rounded-xl px-4 py-2 text-xs font-mono text-indigo/80">
              Checkout Group: <strong className="text-clay font-bold">{checkoutGroupId}</strong>
            </div>
          )}

          {/* Ordered Line Items summary */}
          <div className="text-left bg-white/90 rounded-2xl p-5 border border-clay/15 space-y-3 mt-4">
            <h3 className="font-display text-sm text-indigo font-bold border-b border-clay/10 pb-2">
              Ordered Items ({placedOrders.length})
            </h3>
            <div className="divide-y divide-clay/10 max-h-64 overflow-y-auto pr-1">
              {placedOrders.map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo">{ord.productTitle}</span>
                    <span className="text-indigo/50 block text-[11px]">
                      Sold by: {ord.storeName} &bull; Qty: {ord.quantity} &bull; Order #{ord.id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-clay text-sm">₹{ord.totalPrice}</span>
                    <span className="text-[10px] block font-semibold text-neem uppercase">{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-clay/15 flex justify-between items-center text-sm font-bold text-indigo">
              <span>Total Paid:</span>
              <span className="text-clay font-display text-lg">₹{totalPlaced.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/orders"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm transition-all flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" /> View My Orders & Delivery OTPs
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-warmwhite hover:bg-white text-indigo font-semibold text-sm border border-clay/20 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-display text-indigo">
          Mohalla Direct Checkout
        </h1>
        <p className="text-sm text-indigo/70">
          Hand-to-hand neighbourly delivery with verified 6-digit delivery OTP protection.
        </p>
      </div>

      {/* 3-Step Indicator matching Indian Design System */}
      <div className="bg-warmwhite p-4 md:p-6 rounded-2xl border border-clay/20 shadow-warm">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-10 right-10 -translate-y-1/2 h-1 bg-clay/20 z-0">
            <div 
              className="h-full bg-clay transition-all duration-500"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            />
          </div>

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center space-y-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              currentStep >= 1 ? 'bg-clay text-warmwhite shadow-md' : 'bg-warmwhite border-2 border-clay/30 text-indigo/50'
            }`}>
              {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
            </div>
            <span className={`text-xs font-semibold ${currentStep === 1 ? 'text-clay font-bold' : 'text-indigo/70'}`}>
              1. Delivery Address
            </span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center space-y-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              currentStep >= 2 ? 'bg-clay text-warmwhite shadow-md' : 'bg-warmwhite border-2 border-clay/30 text-indigo/50'
            }`}>
              {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <span className={`text-xs font-semibold ${currentStep === 2 ? 'text-clay font-bold' : 'text-indigo/70'}`}>
              2. UPI Payment
            </span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center space-y-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              currentStep >= 3 ? 'bg-neem text-warmwhite shadow-md' : 'bg-warmwhite border-2 border-clay/30 text-indigo/50'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className={`text-xs font-semibold ${currentStep === 3 ? 'text-neem font-bold' : 'text-indigo/70'}`}>
              3. Confirm & OTP
            </span>
          </div>
        </div>
      </div>

      {/* Step Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Step Interaction Column */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-indigo/10 shadow-warm">
          {/* STEP 1: Address Form */}
          {currentStep === 1 && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-clay/10 pb-3">
                <MapPin className="w-5 h-5 text-clay" />
                <h3 className="font-display text-xl text-indigo">Delivery Address</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo">Recipient Full Name</label>
                  <input
                    type="text"
                    required
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-warmwhite text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo">Phone Number (for Delivery)</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-warmwhite text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo">House / Flat / Building / Floor</label>
                <input
                  type="text"
                  required
                  value={address.addressLine}
                  onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-warmwhite text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
                  placeholder="e.g. Flat 402, Shanti Nilayam, 4th Cross"
                />
              </div>

              {/* Free Nominatim Search + Draggable Leaflet Pin */}
              <div className="pt-1">
                <LocationPicker
                  initialAddress={address.locality}
                  initialLat={address.deliveryLatitude}
                  initialLng={address.deliveryLongitude}
                  label="Search Delivery Locality / Mohalla & Drop Pin"
                  helperText="Search any neighbourhood or colony in India. Drag the terracotta pin on the OpenStreetMap to specify your exact delivery doorstep."
                  onLocationSelect={({ addressText, latitude, longitude }) => {
                    setAddress((prev) => ({
                      ...prev,
                      locality: addressText,
                      deliveryLatitude: latitude,
                      deliveryLongitude: longitude,
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo">PIN Code (Optional)</label>
                  <input
                    type="text"
                    value={address.pinCode}
                    onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-clay/30 bg-warmwhite text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30"
                    placeholder="e.g. 560038"
                  />
                </div>
                <div className="flex items-end">
                  {address.deliveryLatitude && (
                    <div className="text-xs text-neem font-semibold bg-neem/10 border border-neem/20 rounded-xl px-3 py-2.5 w-full flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-neem shrink-0" />
                      <span>GPS Geocoded: {address.deliveryLatitude.toFixed(4)}, {address.deliveryLongitude.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Method Choice (UPI Demo vs Razorpay Demo) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-clay/10 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-clay" />
                  <h3 className="font-display text-xl text-indigo">Select Payment Mode (Demo)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-clay font-semibold hover:underline cursor-pointer"
                >
                  Edit Address
                </button>
              </div>

              {/* Mode Selection Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'UPI'
                      ? 'border-clay bg-clay/10 shadow-sm'
                      : 'border-clay/20 bg-warmwhite hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">⚡</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      paymentMode === 'UPI' ? 'bg-clay text-warmwhite' : 'bg-gray-200 text-gray-700'
                    }`}>
                      FASTEST
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="font-display text-base font-bold text-indigo">Instant UPI (Demo)</div>
                    <div className="text-xs text-indigo/60">GPay, PhonePe, Paytm, QR Code</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('RAZORPAY')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'RAZORPAY'
                      ? 'border-clay bg-clay/10 shadow-sm'
                      : 'border-clay/20 bg-warmwhite hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      paymentMode === 'RAZORPAY' ? 'bg-clay text-warmwhite' : 'bg-gray-200 text-gray-700'
                    }`}>
                      TEST SANDBOX
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="font-display text-base font-bold text-indigo">Razorpay (Demo)</div>
                    <div className="text-xs text-indigo/60">Official Test Modal (Cards, UPI, Netbanking)</div>
                  </div>
                </button>
              </div>

              {/* UPI Mode View */}
              {paymentMode === 'UPI' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl glass-indigo text-warmwhite space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-widest text-marigold">
                        Mohalla Escrow UPI Gateway
                      </span>
                      <span className="text-xs bg-clay/40 px-2 py-0.5 rounded text-warmwhite font-mono">
                        Demo Mode
                      </span>
                    </div>

                    {/* App Chips */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-warmwhite/80 font-semibold">Select UPI App</label>
                      <div className="grid grid-cols-5 gap-2">
                        {UPI_APPS.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              setSelectedUpiApp(app);
                              setUpiId(`user${app.handle}`);
                            }}
                            className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center ${
                              selectedUpiApp.id === app.id
                                ? 'bg-white/20 border-marigold shadow-sm'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-lg">{app.icon}</span>
                            <span className="text-[10px] text-warmwhite font-medium mt-1 truncate w-full">
                              {app.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-warmwhite/70">Verified Gateway ID</span>
                        <p className="font-mono text-xs font-bold text-marigold">localconnect.mohalla@upi</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowQrCode(!showQrCode)}
                        className="text-xs text-warmwhite font-semibold hover:text-marigold flex items-center gap-1 cursor-pointer bg-white/10 px-3 py-1.5 rounded-lg border border-white/15"
                      >
                        <QrCode className="w-3.5 h-3.5" /> {showQrCode ? 'Hide QR' : 'Scan QR'}
                      </button>
                    </div>

                    {showQrCode ? (
                      <div className="p-4 bg-white text-indigo rounded-xl text-center space-y-2">
                        <div className="w-32 h-32 mx-auto flex items-center justify-center border border-clay/20 rounded-xl p-2 bg-warmwhite">
                          <QrCode className="w-28 h-28 text-indigo" />
                        </div>
                        <p className="text-xs text-indigo/70 font-mono font-semibold">
                          Scan with any UPI app to pay ₹{totalAmount.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-xs text-warmwhite/80">Your UPI ID (VPA)</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-deepdark border border-white/20 text-warmwhite text-sm focus:outline-none focus:border-marigold font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-warmwhite text-indigo text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulatedUpiPayment}
                      disabled={isProcessingPayment}
                      className="px-6 py-3.5 rounded-xl bg-neem hover:bg-neem/90 text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying UPI...
                        </>
                      ) : (
                        <>
                          Authorize ₹{totalAmount.toFixed(2)} via UPI <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Razorpay Mode View */}
              {paymentMode === 'RAZORPAY' && (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo/5 to-clay/5 border-2 border-clay/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                        ₹
                      </div>
                      <div>
                        <h4 className="font-display text-base font-bold text-indigo">
                          Official Razorpay Test Gateway
                        </h4>
                        <p className="text-xs text-indigo/60">
                          Supports test Credit/Debit Cards, Netbanking, UPI, and Wallets
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-clay/15 space-y-1.5 text-xs">
                      <div className="flex justify-between text-indigo/70">
                        <span>Test Key ID:</span>
                        <code className="font-mono text-clay font-bold">rzp_test_T3Fhdi7QvZzqdQ</code>
                      </div>
                      <div className="flex justify-between text-indigo/70">
                        <span>Merchant Name:</span>
                        <strong className="text-indigo">LocalConnect Mohalla</strong>
                      </div>
                      <div className="flex justify-between text-indigo/70">
                        <span>Total Checkout:</span>
                        <strong className="text-clay font-bold">₹{totalAmount.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-warmwhite text-indigo text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back
                    </button>

                    <button
                      type="button"
                      onClick={handleRazorpayPayment}
                      disabled={isProcessingPayment}
                      className="px-6 py-3.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Opening Razorpay...
                        </>
                      ) : (
                        <>
                          Pay ₹{totalAmount.toFixed(2)} with Razorpay Modal <CreditCard className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirm & Place Order */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-clay/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-neem" />
                  <h3 className="font-display text-xl text-indigo">Review & Authorize Order</h3>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neem/10 border border-neem/30 text-neem text-sm flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold">Payment Authorized:</span> ₹{totalAmount.toFixed(2)} secured via{' '}
                  <strong>{paymentMode === 'RAZORPAY' ? 'Razorpay (Demo)' : `UPI (${selectedUpiApp.name})`}</strong>. Delivery OTP will be generated on dispatch.
                </div>
              </div>

              <div className="space-y-3 bg-warmwhite p-4 rounded-xl border border-clay/20 text-xs text-indigo/80">
                <div className="font-bold text-sm text-indigo border-b border-clay/10 pb-2">Delivery Summary</div>
                <div><span className="font-semibold text-indigo">Deliver to:</span> {address.name} ({address.phone})</div>
                <div><span className="font-semibold text-indigo">Address:</span> {address.addressLine}, {address.locality} - {address.pinCode}</div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-warmwhite text-indigo text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Change Payment
                </button>

                <button
                  type="button"
                  onClick={handlePlaceFinalOrders}
                  disabled={isPlacingOrders}
                  className="px-8 py-3.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isPlacingOrders ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Booking Order...
                    </>
                  ) : (
                    <>
                      Confirm & Book Order <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Cart Summary Column */}
        <div className="lg:col-span-5 bg-warmwhite p-6 rounded-2xl border border-clay/20 shadow-warm space-y-4">
          <h3 className="font-display text-lg text-indigo border-b border-clay/10 pb-2">
            Order Items ({cart.length})
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 divide-y divide-clay/10">
            {cart.map((item) => (
              <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                <div className="space-y-0.5 max-w-[200px]">
                  <div className="font-bold text-indigo line-clamp-1">{item.title}</div>
                  <div className="text-indigo/60">Qty: {item.quantity} × ₹{item.price}</div>
                </div>
                <div className="font-bold text-clay text-sm">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-clay/20 space-y-2 text-xs">
            <div className="flex justify-between text-indigo/70">
              <span>Items Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neem font-semibold">
              <span>Mohalla Delivery Fee</span>
              <span>FREE (Neighbourhood)</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-indigo pt-2 border-t border-clay/20">
              <span>Total Payable</span>
              <span className="font-display text-xl text-clay">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Animation Overlay */}
      {showBookingAnimation && (
        <OrderBookingAnimation
          amount={totalAmount}
          paymentMethod={paymentMode === 'RAZORPAY' ? 'Razorpay (Demo)' : `UPI (${selectedUpiApp.name})`}
          storeName={cart[0]?.sellerName || cart[0]?.storeName || 'Local Mohalla Artisan'}
          deliveryAddress={address.locality || 'Doorstep Delivery'}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  );
}
