import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Truck, 
  Package, 
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';
import QuickOrderModal from '../components/booking/QuickOrderModal';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [showQuickOrder, setShowQuickOrder] = useState(false);

  useEffect(() => {
    fetchProductAndReviews();
  }, [productId]);

  useEffect(() => {
    if (user && product) {
      checkReviewEligibility();
    }
  }, [user, product]);

  const fetchProductAndReviews = async () => {
    setLoading(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get(`/reviews/product/${productId}`).catch(() => ({ data: [] }))
      ]);
      setProduct(prodRes.data);
      setReviews(revRes.data || []);
    } catch (err) {
      console.error('Failed to load product details:', err);
      showToast('Product not found or unavailable', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    if (!user || user.role === 'ADMIN') {
      if (user?.role === 'ADMIN') setHasDeliveredOrder(true);
      return;
    }
    setCheckingEligibility(true);
    try {
      const ordersRes = await api.get(`/orders/buyer/${user.id}`);
      const eligible = ordersRes.data?.some(
        (o) => o.productId === Number(productId) && o.status === 'DELIVERED'
      );
      setHasDeliveredOrder(eligible);
    } catch (err) {
      setHasDeliveredOrder(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleQuantityChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
    } else if (product && num > product.stockQty) {
      setQuantity(product.stockQty);
    } else {
      setQuantity(num);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stockQty <= 0) {
      showToast('This item is currently out of stock', 'error');
      return;
    }
    addToCart(product, quantity);
    showToast(`Added ${quantity} × ${product.title} to cart!`, 'success');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-clay/30 border-t-clay rounded-full animate-spin"></div>
        <p className="font-display text-indigo/70">Fetching artisanal details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-warmwhite rounded-2xl text-center shadow-warm border border-clay/20 space-y-4">
        <AlertCircle className="w-12 h-12 text-saffron mx-auto" />
        <h2 className="text-2xl font-display text-indigo">Product Not Found</h2>
        <p className="text-indigo/70">The product you are looking for does not exist or has been removed.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-clay text-warmwhite font-semibold hover:bg-saffron transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Breadcrumbs / Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo/70 hover:text-clay transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-mono px-3 py-1 bg-warmwhite border border-clay/20 rounded-full text-indigo/60">
          ID: #{product.id}
        </span>
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Image in Market-stall-style Frame */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden foil-border bg-white shadow-warm p-4 group">
            {/* Indian Jali Lattice Texture overlay */}
            <div className="absolute inset-0 jali-bg opacity-20 pointer-events-none" />

            <ProductImage
              src={product.imageUrl}
              alt={product.title}
              category={product.storeCategory}
              aspectClass="aspect-square"
              marketFrame={true}
              className="w-full h-full shadow-inner"
            />

            {/* Stock Badge */}
            <div className="absolute top-6 right-6 z-20">
              {product.stockQty > 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-neem text-warmwhite flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stockQty} available)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-saffron text-warmwhite shadow-sm">
                  Out of Stock
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product Details & Action Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-marigold/20 text-indigo border border-marigold/30">
                {product.storeCategory || 'Mohalla Item'}
              </span>
              {avgRating && (
                <span className="flex items-center gap-1 text-xs font-bold text-marigold bg-indigo px-2.5 py-0.5 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-marigold" /> {avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-indigo tracking-tight">
              {product.title}
            </h1>
            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-display text-3xl md:text-4xl text-clay">
                ₹{product.price}
              </span>
              <span className="text-xs text-indigo/60 font-body">inclusive of all local taxes</span>
            </div>
          </div>

          <p className="text-indigo/80 text-base leading-relaxed bg-warmwhite/80 p-4 rounded-xl border border-clay/10">
            {product.description || 'No description provided by the artisan seller.'}
          </p>

          {/* Seller Mini Card */}
          <div className="p-5 rounded-2xl bg-warmwhite border border-clay/20 shadow-warm space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-clay font-bold">
                  Sold By Artisan / Store
                </span>
                <Link
                  to={`/stores/${product.storeId}`}
                  className="block font-display text-xl text-indigo hover:text-clay transition-colors"
                >
                  {product.storeName}
                </Link>
                <div className="flex items-center gap-2 text-xs text-indigo/70">
                  <Store className="w-3.5 h-3.5 text-clay" />
                  <span>{product.storeLocation || 'Local Mohalla Bazar'}</span>
                </div>
              </div>

              {product.storeStatus === 'APPROVED' ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold badge-seller flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Mohalla Seller
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold badge-pending flex items-center gap-1">
                  Pending Verification
                </span>
              )}
            </div>

            <Link
              to={`/stores/${product.storeId}`}
              className="text-xs font-semibold text-clay hover:text-saffron flex items-center gap-1 transition-colors"
            >
              Visit Seller Storefront →
            </Link>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="p-6 rounded-2xl bg-white border border-indigo/10 shadow-warm space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-indigo">Select Quantity</label>
              <span className="text-xs text-indigo/60">Supports single piece or bulk order</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-clay/30 rounded-xl bg-warmwhite overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-3 text-indigo/70 hover:text-clay hover:bg-clay/10 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stockQty}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-16 text-center font-bold text-indigo bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stockQty}
                  className="p-3 text-indigo/70 hover:text-clay hover:bg-clay/10 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-sm font-semibold text-indigo/70">
                Total: <span className="text-clay text-lg font-bold">₹{(product.price * quantity).toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stockQty <= 0}
                className="w-full py-3.5 px-6 rounded-xl bg-clay hover:bg-saffron disabled:bg-gray-300 disabled:cursor-not-allowed text-warmwhite font-bold text-sm transition-all shadow-warm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>

              <button
                type="button"
                onClick={() => setShowQuickOrder(true)}
                disabled={product.stockQty <= 0}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo hover:bg-deepdark disabled:bg-gray-300 disabled:cursor-not-allowed text-warmwhite font-bold text-sm transition-all shadow-warm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-marigold" /> Buy Now (UPI / Razorpay)
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-neem font-medium pt-1">
              <Truck className="w-4 h-4" /> Direct hand-to-hand delivery with 6-digit delivery OTP verification.
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="space-y-6 pt-6 border-t border-clay/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display text-indigo flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-clay" /> Customer Reviews & Ratings
            </h2>
            <p className="text-sm text-indigo/70 mt-0.5">
              Verified feedback from neighbours who ordered this local product.
            </p>
          </div>

          <div>
            {user ? (
              hasDeliveredOrder ? (
                <Link
                  to={`/products/${product.id}/review`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-semibold text-sm transition-all shadow-warm"
                >
                  <Sparkles className="w-4 h-4" /> Write a Review
                </Link>
              ) : (
                <div className="text-xs text-indigo/60 bg-warmwhite px-4 py-2 rounded-xl border border-clay/10">
                  <span className="font-semibold text-indigo">Verified Buyers Only:</span> You can leave a review after receiving your delivered order.
                </div>
              )
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-warmwhite hover:bg-white text-indigo text-xs font-semibold border border-clay/20"
              >
                Sign in to review
              </Link>
            )}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 rounded-2xl bg-warmwhite text-center border border-clay/10 space-y-2">
            <Star className="w-8 h-8 text-marigold mx-auto opacity-40" />
            <p className="font-display text-indigo text-lg">No reviews yet</p>
            <p className="text-xs text-indigo/60">Be the first verified neighbour to share feedback once your order arrives!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 rounded-2xl bg-warmwhite border border-clay/10 shadow-warm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-clay text-warmwhite font-bold text-xs flex items-center justify-center">
                      {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-indigo">{rev.userName || 'Local Neighbour'}</div>
                      <div className="text-[10px] text-indigo/50">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-marigold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rev.rating ? 'fill-marigold' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-indigo/80 leading-relaxed font-body">
                  "{rev.commentText}"
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sticky Mobile Add to Cart Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-warmwhite/95 backdrop-blur-md border-t border-clay/20 shadow-2xl z-40 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-indigo/60">Total Amount</span>
          <div className="font-display text-xl text-clay">₹{(product.price * quantity).toFixed(2)}</div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stockQty <= 0}
          className="flex-1 py-3 px-6 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>
      </div>

      {/* Quick Order Modal with Booking Animation */}
      {product && (
        <QuickOrderModal
          product={product}
          isOpen={showQuickOrder}
          onClose={() => setShowQuickOrder(false)}
          onSuccess={() => setShowQuickOrder(false)}
        />
      )}
    </div>
  );
}
