import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Package, Store, RefreshCw, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { sendOtpEmail } from '../services/emailService';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

const SellerDashboard = ({ storeId }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpInputs, setOtpInputs] = useState({});
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = storeId ? `/orders/store/${storeId}` : '/orders';
      const res = await api.get(endpoint);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setToast({
        message: err.response?.data?.message || 'Failed to load orders',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [storeId]);

  const handleGenerateOtp = async (order) => {
    try {
      // 1. Backend generate-otp call
      const res = await api.post(`/orders/${order.id}/generate-otp`);
      const { otp, status } = res.data;

      setToast({
        message: `Order #${order.id} status updated to ${status}. Sending OTP email...`,
        type: 'info',
      });

      // 2. Call EmailJS from frontend
      const emailResult = await sendOtpEmail({
        toEmail: order.buyerEmail || 'buyer@example.com',
        toName: order.buyerName || 'Buyer',
        otpCode: otp,
        orderId: order.id,
      });

      if (emailResult.success) {
        setToast({
          message: `OTP sent to buyer's email (${order.buyerName || 'Buyer'}) successfully!`,
          type: 'success',
        });
      } else {
        setToast({
          message: `OTP generated (${otp}), but EmailJS failed: ${emailResult.error}`,
          type: 'error',
        });
      }

      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate OTP';
      setToast({ message: msg, type: 'error' });
    }
  };

  const handleVerifyOtp = async (orderId) => {
    const otp = otpInputs[orderId];
    if (!otp || !otp.trim()) {
      setToast({ message: 'Please enter the delivery OTP', type: 'error' });
      return;
    }

    try {
      await api.post(`/orders/${orderId}/verify-otp`, { otp: otp.trim() });
      setToast({
        message: `Order #${orderId} verified & updated to DELIVERED!`,
        type: 'success',
      });
      setOtpInputs((prev) => ({ ...prev, [orderId]: '' }));
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify OTP';
      setToast({ message: msg, type: 'error' });
    }
  };

  const handleInputChange = (orderId, value) => {
    setOtpInputs((prev) => ({ ...prev, [orderId]: value }));
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'PLACED':
      case 'CONFIRMED':
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'OUT_FOR_DELIVERY':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'DELIVERED':
        return { backgroundColor: '#d1fae5', color: '#065f46' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-clay/20">
        <div>
          <h2 className="font-display text-2xl md:text-3xl text-indigo">Seller Order Management</h2>
          <p className="text-xs text-indigo/60">Dispatch orders with delivery OTP verification</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/products"
            className="px-3.5 py-2 rounded-xl bg-warmwhite hover:bg-white text-indigo border border-clay/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Package className="w-3.5 h-3.5 text-clay" /> Products
          </Link>

          <Link
            to="/dashboard/store"
            className="px-3.5 py-2 rounded-xl bg-warmwhite hover:bg-white text-indigo border border-clay/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Store className="w-3.5 h-3.5 text-clay" /> Store Profile
          </Link>

          <Link
            to="/dashboard/analytics"
            className="px-3.5 py-2 rounded-xl bg-clay text-warmwhite hover:bg-clay/90 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Analytics
          </Link>

          <button
            type="button"
            onClick={fetchOrders}
            className="px-3.5 py-2 rounded-xl bg-indigo hover:bg-deepdark text-warmwhite text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-marigold' : ''}`} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-saffron/10 hover:bg-saffron text-saffron hover:text-white border border-saffron/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280' }}>No orders found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Order #{order.id} &bull; {order.productTitle}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    Buyer: {order.buyerName} | Qty: {order.quantity} | Total: ${order.totalPrice}
                  </p>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...getStatusBadgeStyle(order.status),
                  }}
                >
                  {order.status}
                </span>
              </div>

              {/* Order Actions */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                {order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'DELIVERED' && (
                  <button
                    onClick={() => handleGenerateOtp(order)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Dispatch Order & Generate OTP
                  </button>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Enter Delivery OTP:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={otpInputs[order.id] || ''}
                      onChange={(e) => handleInputChange(order.id, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '140px',
                        letterSpacing: '2px',
                        textAlign: 'center',
                      }}
                    />
                    <button
                      onClick={() => handleVerifyOtp(order.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Verify Delivery OTP
                    </button>
                    <button
                      onClick={() => handleGenerateOtp(order)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

                {order.status === 'DELIVERED' && (
                  <p style={{ fontSize: '14px', color: '#059669', fontWeight: '500', margin: 0 }}>
                    &check; Order delivered successfully.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
