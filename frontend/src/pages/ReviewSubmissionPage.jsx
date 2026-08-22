import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MessageSquare, ArrowLeft, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ReviewSubmissionPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Error fetching product for review:', err);
      showToast('Product not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      showToast('Please enter your review feedback comment', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        productId: Number(productId),
        rating: rating,
        commentText: commentText.trim(),
      });
      showToast('Review submitted successfully! Thank you.', 'success');
      navigate(`/products/${productId}`);
    } catch (err) {
      console.error('Failed to submit review:', err);
      const msg = err.response?.data?.message || 'Failed to submit review. Verified delivery order is required.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-clay/30 border-t-clay rounded-full animate-spin"></div>
        <p className="font-display text-indigo/70">Loading product for review...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-warmwhite rounded-2xl text-center shadow-warm border border-clay/20 space-y-4">
        <AlertCircle className="w-12 h-12 text-saffron mx-auto" />
        <h2 className="text-2xl font-display text-indigo">Product Not Found</h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-clay text-warmwhite font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <Link
        to={`/products/${productId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo/70 hover:text-clay transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Product
      </Link>

      <div className="bg-warmwhite p-6 md:p-8 rounded-3xl border border-clay/20 shadow-warm space-y-6">
        {/* Header */}
        <div className="space-y-2 border-b border-clay/10 pb-4">
          <div className="flex items-center gap-2 text-clay text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Verified Buyer Review
          </div>
          <h1 className="text-2xl md:text-3xl font-display text-indigo">
            Write a Review for {product.title}
          </h1>
          <p className="text-xs text-indigo/60">
            Sold by <span className="font-semibold text-indigo">{product.storeName}</span>
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Interactive Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-indigo">
              Your Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isFilled ? 'fill-marigold text-marigold' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-sm font-bold text-indigo ml-2">
                {hoverRating || rating} Star{(hoverRating || rating) > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-indigo">
              Review Comments & Experience
            </label>
            <textarea
              required
              rows="5"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="How was the craftsmanship, freshness, or delivery speed of this neighbourhood product?"
              className="w-full p-4 rounded-xl border border-clay/30 bg-white text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/30 placeholder:text-indigo/40 font-body"
            />
          </div>

          {/* Reassurance Badge */}
          <div className="flex items-center gap-2 text-xs text-neem font-medium bg-neem/10 p-3 rounded-xl border border-neem/20">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Only verified buyers with a delivered order can submit public reviews.</span>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/products/${productId}`)}
              className="px-5 py-2.5 rounded-xl bg-white border border-clay/20 text-indigo text-sm font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-bold text-sm shadow-warm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Review <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
