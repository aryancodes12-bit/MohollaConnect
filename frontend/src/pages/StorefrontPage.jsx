import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Store, 
  ShieldCheck, 
  MapPin, 
  Package, 
  ArrowLeft, 
  ShoppingBag, 
  AlertTriangle,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { createClayMarkerIcon } from '../utils/mapIcons';

export default function StorefrontPage() {
  const { storeId } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStoreAndProducts();
  }, [storeId]);

  const fetchStoreAndProducts = async () => {
    setLoading(true);
    try {
      const [storeRes, prodRes] = await Promise.all([
        api.get(`/stores/${storeId}`),
        api.get(`/products/store/${storeId}`).catch(() => ({ data: [] }))
      ]);
      setStore(storeRes.data);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Failed to load store:', err);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQty <= 0) {
      showToast('Product is currently out of stock', 'error');
      return;
    }
    addToCart(product, 1);
    showToast(`Added ${product.title} to cart!`, 'success');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-clay/30 border-t-clay rounded-full animate-spin"></div>
        <p className="font-display text-indigo/70">Entering Mohalla Storefront...</p>
      </div>
    );
  }

  // If store does not exist or is not approved and the viewer is not the owner/admin
  const isOwner = user && store && String(user.id) === String(store.ownerId);
  const isAdmin = user && user.role === 'ADMIN';
  const isApproved = store && store.status === 'APPROVED';

  if (!store || (!isApproved && !isOwner && !isAdmin)) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-warmwhite rounded-2xl text-center shadow-warm border border-clay/20 space-y-4">
        <AlertTriangle className="w-12 h-12 text-marigold mx-auto" />
        <h2 className="text-2xl font-display text-indigo">Store Not Available</h2>
        <p className="text-indigo/70">
          This local store is currently under review or not open for public browsing.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-clay text-warmwhite font-semibold hover:bg-saffron transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Explore Active Stores
        </Link>
      </div>
    );
  }

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Back Links & Pending Owner Notice */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/bazaar-map"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo/80 hover:text-clay transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Bazaar Map
            </Link>
            <span className="text-indigo/30">•</span>
            <Link
              to="/"
              className="text-xs font-semibold text-indigo/60 hover:text-clay transition-colors"
            >
              Discover
            </Link>
          </div>

          {isOwner && (
            <Link
              to="/dashboard/store"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-warmwhite border border-clay/20 text-clay hover:bg-white transition-all shadow-sm"
            >
              Edit Store Settings
            </Link>
          )}
        </div>

        {!isApproved && (isOwner || isAdmin) && (
          <div className="p-4 rounded-xl bg-marigold/10 border border-marigold/30 flex items-center gap-3 text-indigo text-sm">
            <Clock className="w-5 h-5 text-marigold shrink-0" />
            <div>
              <span className="font-bold">Store Status: {store.status}</span> — This storefront is currently pending administrator verification and is only visible to you.
            </div>
          </div>
        )}
      </div>

      {/* Storefront Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo via-indigo/95 to-deepdark text-warmwhite p-6 sm:p-8 md:p-10 shadow-2xl foil-border-indigo">
        {/* Lattice overlay */}
        <div className="absolute inset-0 jali-bg opacity-15 pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Store Info */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-clay text-warmwhite shadow-sm">
                {store.category}
              </span>

              {isApproved ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-neem/25 text-emerald-300 border border-neem/40">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Mohalla Seller
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-marigold/20 text-marigold border border-marigold/40">
                  <Clock className="w-4 h-4 text-marigold" /> Approval Pending
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-warmwhite tracking-tight leading-tight">
              {store.storeName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-warmwhite/80 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-warmwhite">
                <MapPin className="w-4 h-4 text-marigold shrink-0" />
                {store.location}
              </span>
              <span className="text-warmwhite/30 hidden sm:inline">•</span>
              <span>Proprietor: <strong className="text-warmwhite font-semibold">{store.ownerName}</strong></span>
            </div>

            {store.description && (
              <p className="text-warmwhite/90 text-sm leading-relaxed bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 max-w-2xl">
                {store.description}
              </p>
            )}
          </div>

          {/* Interactive Mini-Map / Location Preview */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            <div className="h-52 sm:h-56 w-full rounded-2xl overflow-hidden border border-white/20 shadow-indigo relative bg-indigo/80">
              {store.latitude && store.longitude ? (
                <MapContainer
                  center={[store.latitude, store.longitude]}
                  zoom={15}
                  scrollWheelZoom={false}
                  dragging={true}
                  className="w-full h-full z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[store.latitude, store.longitude]}
                    icon={createClayMarkerIcon(true)}
                  />
                </MapContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-clay/20 text-clay flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-display text-sm text-warmwhite">{store.location}</h4>
                  <p className="text-xs text-warmwhite/60">Workshop location verified in mohalla</p>
                </div>
              )}

              <div className="absolute bottom-2.5 right-2.5 z-[400]">
                <Link
                  to="/bazaar-map"
                  className="px-3 py-1.5 text-xs font-bold bg-indigo/90 hover:bg-clay text-warmwhite rounded-lg shadow-md flex items-center gap-1.5 transition-all backdrop-blur-md border border-white/20 hover:scale-105"
                >
                  <MapPin className="w-3.5 h-3.5 text-marigold" /> View on Bazaar Map
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-warmwhite/60 px-1">
              <span>Verified Workshop Location</span>
              <span>Click pin to view on Bazaar Map</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Search & Product Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display text-indigo flex items-center gap-2">
              <Package className="w-6 h-6 text-clay" /> Shop Listings ({filteredProducts.length})
            </h2>
            <p className="text-sm text-indigo/70">Locally prepared products available for immediate order</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-indigo/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products in store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-warmwhite border border-clay/20 text-indigo focus:outline-none focus:ring-2 focus:ring-clay/30"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-warmwhite text-center border border-clay/10 space-y-3">
            <Package className="w-10 h-10 text-indigo/30 mx-auto" />
            <h3 className="font-display text-lg text-indigo">No listings found</h3>
            <p className="text-xs text-indigo/60">
              {searchTerm ? 'No products match your search keyword.' : 'This seller has not listed any items yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group bg-warmwhite rounded-2xl overflow-hidden border border-clay/20 shadow-warm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                {/* Stall Frame Image Area */}
                <div className="h-44 bg-gradient-to-br from-ivory to-warmwhite relative p-6 flex flex-col items-center justify-center text-center border-b border-clay/10 overflow-hidden">
                  <div className="absolute inset-0 jali-bg opacity-15 pointer-events-none"></div>
                  <div className="w-16 h-16 rounded-full bg-clay/10 text-clay flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                    <Package className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-clay font-bold">
                    {store.category}
                  </span>
                  <h4 className="font-display text-indigo font-bold text-lg line-clamp-1 mt-1">
                    {p.title}
                  </h4>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-indigo/70 line-clamp-2">
                    {p.description || 'Artisanal local product.'}
                  </p>

                  <div className="pt-3 border-t border-clay/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo/50 uppercase tracking-wider block">Price</span>
                      <div className="font-display text-xl text-clay">₹{p.price}</div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(p, e)}
                      disabled={p.stockQty <= 0}
                      className="px-3.5 py-2 rounded-xl bg-indigo group-hover:bg-clay text-warmwhite text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {p.stockQty > 0 ? 'Add' : 'Sold Out'}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
