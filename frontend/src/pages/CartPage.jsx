import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/EmptyState';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="space-y-6">
        <div className="border-b border-clay/15 pb-4">
          <h1 className="font-display text-3xl text-indigo">Shopping Basket</h1>
          <p className="text-sm text-indigo/70">
            Review your selected artisan items before placing an OTP-secured order.
          </p>
        </div>
        <EmptyState variant="cart" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-clay/15 pb-4">
        <h1 className="font-display text-3xl text-indigo">Shopping Basket</h1>
        <p className="text-sm text-indigo/70">
          {cart.length} {cart.length === 1 ? 'item' : 'items'} from your Mohalla sellers.
        </p>
      </div>

      {/* Basket — receipt/chit style */}
      <div className="bg-warmwhite foil-border shadow-warm rounded-2xl p-5 md:p-8 jali-bg">
        <div className="divide-y divide-clay/10">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 py-4"
              >
                <div className="w-16 h-16 rounded-xl bg-ivory border border-clay/15 flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🏺</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base text-indigo truncate">{item.title}</h3>
                  <p className="text-xs text-indigo/60">{item.sellerName || 'Local Seller'}</p>
                  <p className="text-sm font-semibold text-clay mt-1">₹{item.price?.toLocaleString('en-IN')}</p>
                </div>

                <div className="flex items-center gap-2 border border-clay/20 rounded-lg px-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1.5 text-indigo/70 hover:text-clay transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold text-indigo w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1.5 text-indigo/70 hover:text-clay transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-indigo/40 hover:text-saffron transition-colors"
                  aria-label={`Remove ${item.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Receipt-style total */}
        <div className="mt-6 pt-5 border-t-2 border-dashed border-clay/25 flex items-center justify-between">
          <span className="font-display text-lg text-indigo">Total</span>
          <span className="font-display text-2xl text-clay">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Security reassurance + checkout CTA */}
      <div className="flex items-center gap-2 text-xs text-indigo/60 px-1">
        <ShieldCheck className="w-4 h-4 text-neem" />
        Every order is protected by a 6-digit delivery OTP sent to your email.
      </div>

      <Link
        to="/checkout"
        className="block w-full text-center px-6 py-3.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-display text-lg transition-all shadow-warm"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
