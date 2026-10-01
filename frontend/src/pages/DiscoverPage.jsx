import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  MapPin, 
  Store, 
  Search, 
  ShoppingBag, 
  Check, 
  ShieldCheck, 
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  RotateCcw,
  Navigation
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';
import { calculateHaversineDistance } from '../utils/geoUtils';

// Friendly category display names & mapping to backend categories
const CATEGORY_MAP = [
  { label: 'All Categories', key: 'ALL' },
  { label: 'Kirana & Grocery', key: 'KIRANA' },
  { label: 'Dairy & Milk Booth', key: 'DAIRY' },
  { label: 'Fresh Mandi Produce', key: 'VEGETABLES' },
  { label: 'Tailoring & Alterations', key: 'TAILORING' },
  { label: 'Ironing & Press', key: 'LAUNDRY' },
  { label: 'Woodwork & Crafts', key: 'HANDICRAFTS' },
  { label: 'Spices, Bakery & Food', key: 'FOOD' },
  { label: 'Handloom & Textiles', key: 'TEXTILES' },
  { label: 'Repair & Home Services', key: 'SERVICES' },
];

export default function DiscoverPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Location state for distance-based discovery
  const [buyerLocation, setBuyerLocation] = useState(null); // { lat, lng }
  const [locationDenied, setLocationDenied] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'NEAR_ME' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'TITLE_ASC'

  // UI state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedIds, setAddedIds] = useState([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const { addToCart } = useCart();
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
    requestBuyerLocation();
  }, []);

  const requestBuyerLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuyerLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationDenied(false);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.info('Geolocation permission not granted or unavailable:', err.message);
        setLocationDenied(true);
        setIsDetectingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      if (res.data && res.data.length > 0) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to load products from backend:', err);
      toast.error('Could not load live catalog products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      storeName: product.storeName,
      location: product.storeLocation || product.location,
      imageUrl: product.imageUrl,
    });

    setAddedIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== product.id));
    }, 1500);

    toast.success(`Added "${product.title}" to cart!`);
  };

  // Distinct localities for dropdown
  const localities = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const loc = p.storeLocation || p.location;
      if (loc) {
        // e.g. "Sector 12, Dwarka, New Delhi" -> extract city/area
        const parts = loc.split(',');
        const area = parts.length > 1 ? parts.slice(-2).join(',').trim() : loc.trim();
        set.add(area);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const cat = (p.storeCategory || p.category || '').toUpperCase();

        // Category filter
        if (selectedCategory !== 'ALL') {
          if (selectedCategory === 'FOOD') {
            if (cat !== 'FOOD' && cat !== 'SPICES' && cat !== 'BAKERY') return false;
          } else if (cat !== selectedCategory) {
            return false;
          }
        }

        // Search query (title, storeName, description, location)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (p.title || '').toLowerCase().includes(q);
          const matchStore = (p.storeName || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          const matchLoc = (p.storeLocation || p.location || '').toLowerCase().includes(q);
          if (!matchTitle && !matchStore && !matchDesc && !matchLoc) {
            return false;
          }
        }

        // Price range filter
        const priceNum = Number(p.price) || 0;
        if (minPrice !== '' && priceNum < Number(minPrice)) {
          return false;
        }
        if (maxPrice !== '' && priceNum > Number(maxPrice)) {
          return false;
        }

        // Locality filter
        if (selectedLocality !== 'ALL') {
          const loc = (p.storeLocation || p.location || '').toLowerCase();
          if (!loc.includes(selectedLocality.toLowerCase())) {
            return false;
          }
        }

        // In Stock Only
        if (inStockOnly && (!p.stockQty || p.stockQty <= 0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEAR_ME' && buyerLocation) {
          const distA = calculateHaversineDistance(
            buyerLocation.lat,
            buyerLocation.lng,
            a.storeLatitude,
            a.storeLongitude
          ) ?? 999999;
          const distB = calculateHaversineDistance(
            buyerLocation.lat,
            buyerLocation.lng,
            b.storeLatitude,
            b.storeLongitude
          ) ?? 999999;
          return distA - distB;
        }
        if (sortBy === 'PRICE_ASC') {
          return Number(a.price) - Number(b.price);
        }
        if (sortBy === 'PRICE_DESC') {
          return Number(b.price) - Number(a.price);
        }
        if (sortBy === 'TITLE_ASC') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'NEWEST') {
          return (b.id || 0) - (a.id || 0);
        }
        return 0; // Default order
      });
  }, [products, selectedCategory, searchQuery, minPrice, maxPrice, selectedLocality, inStockOnly, sortBy, buyerLocation]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    if (minPrice !== '' || maxPrice !== '') count++;
    if (selectedLocality !== 'ALL') count++;
    if (inStockOnly) count++;
    return count;
  }, [selectedCategory, searchQuery, minPrice, maxPrice, selectedLocality, inStockOnly]);

  const handleClearAllFilters = () => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedLocality('ALL');
    setInStockOnly(false);
    setSortBy('DEFAULT');
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner with Functional Search */}
      <div className="relative rounded-3xl bg-indigo text-warmwhite p-8 md:p-12 overflow-hidden jali-bg foil-border-indigo shadow-warm-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay/20 text-marigold text-xs font-semibold backdrop-blur-md border border-marigold/30">
              <Sparkles className="w-3.5 h-3.5" /> Mohalla Marketplace & Local Direct
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-warmwhite leading-tight">
              Discover Authentic Mohalla Creators & Daily Essentials
            </h1>
            <p className="text-warmwhite/80 text-sm md:text-base font-body leading-relaxed max-w-2xl">
              Fresh kirana groceries, pure dairy, handloom textiles, woodcrafts, tailoring, and doorstep services from verified local sellers with 6-digit OTP delivery security.
            </p>

            {/* Search Bar */}
            <div className="pt-2 flex items-center gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-indigo/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, artisans, stores, or cities (e.g. Atta, Jaipur, Chai)..."
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-ivory text-indigo text-sm placeholder:text-indigo/40 focus:outline-none focus:ring-2 focus:ring-marigold transition-all shadow-md font-body"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo/40 hover:text-indigo p-1"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hero Right Brand Graphic */}
          <div className="lg:col-span-4 hidden lg:flex justify-center">
            <div className="relative p-3 rounded-full bg-warmwhite/10 backdrop-blur-md border border-warmwhite/15 shadow-2xl">
              <img
                src="/logo.png"
                alt="LocalConnect Mohalla Emblem"
                className="w-44 h-44 rounded-full object-cover shadow-warm ring-4 ring-marigold/30 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-indigo border-l-4 border-clay pl-3">
            Mohalla Categories
          </h2>
          <span className="text-xs text-indigo/70 font-medium">
            Showing <strong className="text-clay font-bold text-sm">{filteredProducts.length}</strong> of {products.length} items
          </span>
        </div>

        {/* Horizontal Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_MAP.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 border flex items-center gap-2 ${
                  isActive
                    ? 'bg-clay text-warmwhite border-clay shadow-warm'
                    : 'bg-warmwhite text-indigo/80 border-clay/15 hover:border-clay/30 hover:bg-clay/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Sort Control Toolbar */}
      <div className="bg-warmwhite p-4 rounded-2xl border border-clay/20 shadow-warm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Price Filter Popover / Inputs */}
            <div className="flex items-center gap-2 bg-ivory px-3 py-1.5 rounded-xl border border-clay/15 text-xs text-indigo/80">
              <span className="font-semibold text-clay">Price (₹):</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-16 px-2 py-1 rounded-lg bg-white border border-clay/20 text-xs focus:ring-1 focus:ring-clay outline-none"
              />
              <span>–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-16 px-2 py-1 rounded-lg bg-white border border-clay/20 text-xs focus:ring-1 focus:ring-clay outline-none"
              />
            </div>

            {/* Locality Dropdown */}
            <div className="flex items-center gap-2 bg-ivory px-3 py-1.5 rounded-xl border border-clay/15 text-xs text-indigo/80">
              <MapPin className="w-3.5 h-3.5 text-clay shrink-0" />
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="bg-transparent text-xs font-medium text-indigo focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Localities</option>
                {localities.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* In Stock Only Checkbox */}
            <label className="flex items-center gap-2 bg-ivory px-3 py-2 rounded-xl border border-clay/15 text-xs text-indigo/80 cursor-pointer select-none hover:bg-clay/5 transition-colors">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-clay/30 text-clay focus:ring-clay w-3.5 h-3.5"
              />
              <span className="font-medium">In Stock Only</span>
            </label>
          </div>

          {/* Right: Sort By Dropdown & Location Toggle */}
          <div className="flex items-center gap-2 text-xs">
            {buyerLocation ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neem/10 text-neem font-medium border border-neem/25 text-[11px]" title="Location detected">
                <Navigation className="w-3 h-3 text-neem fill-neem" /> Near You
              </span>
            ) : (
              <button
                type="button"
                onClick={requestBuyerLocation}
                disabled={isDetectingLocation}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-clay/10 text-clay font-medium border border-clay/20 hover:bg-clay/20 text-[11px] transition-colors cursor-pointer"
                title="Enable browser GPS to sort by distance"
              >
                <Navigation className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                {isDetectingLocation ? 'Detecting...' : 'Enable Near Me'}
              </button>
            )}

            <span className="text-indigo/60 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-clay" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                if (e.target.value === 'NEAR_ME' && !buyerLocation) {
                  requestBuyerLocation();
                }
                setSortBy(e.target.value);
              }}
              className="bg-ivory border border-clay/15 rounded-xl px-3 py-2 font-medium text-indigo focus:outline-none focus:ring-1 focus:ring-clay cursor-pointer text-xs"
            >
              <option value="DEFAULT">Featured</option>
              <option value="NEAR_ME">📍 Near Me (Distance)</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="NEWEST">Newest First</option>
              <option value="TITLE_ASC">Alphabetical (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips Summary Row */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-clay/10">
            <span className="text-xs text-indigo/50 font-medium">Active Filters:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-clay/10 text-clay border border-clay/20">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-indigo">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-clay/10 text-clay border border-clay/20">
                Category: {CATEGORY_MAP.find((c) => c.key === selectedCategory)?.label || selectedCategory}
                <button onClick={() => setSelectedCategory('ALL')} className="hover:text-indigo">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(minPrice !== '' || maxPrice !== '') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-clay/10 text-clay border border-clay/20">
                Price: ₹{minPrice || '0'} – ₹{maxPrice || '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="hover:text-indigo">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedLocality !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-clay/10 text-clay border border-clay/20">
                Area: {selectedLocality}
                <button onClick={() => setSelectedLocality('ALL')} className="hover:text-indigo">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neem/15 text-neem border border-neem/30">
                In Stock Only
                <button onClick={() => setInStockOnly(false)} className="hover:text-indigo">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-1 text-xs text-saffron hover:underline font-semibold ml-auto"
            >
              <RotateCcw className="w-3 h-3" /> Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="text-center py-16 text-indigo/50 font-medium flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-clay/30 border-t-clay rounded-full animate-spin" />
          <p>Loading authentic Mohalla products & services...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-warmwhite rounded-3xl border border-clay/20 space-y-4 p-8 max-w-xl mx-auto shadow-warm">
          <Filter className="w-12 h-12 text-clay/40 mx-auto" />
          <h3 className="text-xl font-display text-indigo">No items match your active filters</h3>
          <p className="text-indigo/60 text-sm">
            Try adjusting your price range, searching for another keyword, or resetting filters.
          </p>
          <button
            onClick={handleClearAllFilters}
            className="px-5 py-2.5 rounded-xl bg-clay text-warmwhite text-xs font-bold hover:bg-saffron transition-all shadow-warm inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isJustAdded = addedIds.includes(product.id);
            const categoryName = product.storeCategory || product.category || 'KIRANA';
            const distanceKm = buyerLocation && product.storeLatitude && product.storeLongitude
              ? calculateHaversineDistance(buyerLocation.lat, buyerLocation.lng, product.storeLatitude, product.storeLongitude)
              : null;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedProduct(product)}
                className="bg-warmwhite rounded-2xl border border-clay/15 shadow-warm hover:shadow-warm-lg transition-all flex flex-col justify-between overflow-hidden cursor-pointer group relative"
              >
                {/* Product Image with Market-Stall Irregular Frame */}
                <div className="p-3 pb-0 relative">
                  {distanceKm !== null && (
                    <div className="absolute top-5 right-5 z-20 bg-ivory/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-neem shadow-sm border border-neem/30 flex items-center gap-1">
                      <Navigation className="w-2.5 h-2.5 fill-neem" /> {distanceKm} km away
                    </div>
                  )}
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.title}
                    category={categoryName}
                    aspectClass="aspect-[4/3]"
                    marketFrame={true}
                  />
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-indigo/60 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-clay font-mono">
                        {categoryName}
                      </span>
                      <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                        <MapPin className="w-3 h-3 text-clay shrink-0" />
                        <span className="truncate">{product.storeLocation || product.location || 'Local Area'}</span>
                      </span>
                    </div>

                    <h3 className="font-display text-base text-indigo group-hover:text-clay transition-colors leading-snug line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-xs text-indigo/60 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-clay/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-indigo/70">
                        <Store className="w-3.5 h-3.5 text-clay shrink-0" />
                        <span className="truncate max-w-[130px] font-medium">
                          {product.storeName || 'Neighbourhood Store'}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold ${product.stockQty > 0 ? 'text-neem' : 'text-saffron'}`}>
                        {product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-indigo/50 font-medium block">Price</span>
                        <p className="font-display text-lg text-indigo leading-none">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stockQty <= 0}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-warm cursor-pointer ${
                          product.stockQty <= 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isJustAdded
                            ? 'bg-neem text-warmwhite'
                            : 'bg-clay hover:bg-saffron text-warmwhite'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-warmwhite rounded-3xl max-w-lg w-full p-6 space-y-5 border border-clay/20 shadow-warm-lg relative jali-bg max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-indigo/60 hover:text-indigo hover:bg-clay/10 transition-colors z-20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Image */}
              <div className="w-full">
                <ProductImage
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  category={selectedProduct.storeCategory || selectedProduct.category}
                  aspectClass="aspect-[16/9]"
                  marketFrame={true}
                />
              </div>

              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-clay/10 text-clay font-mono uppercase">
                  {selectedProduct.storeCategory || selectedProduct.category}
                </span>
                <h3 className="font-display text-2xl text-indigo leading-tight mt-2">
                  {selectedProduct.title}
                </h3>
              </div>

              <div className="space-y-2 text-sm text-indigo/80">
                <p className="leading-relaxed">{selectedProduct.description}</p>
                <div className="flex items-center gap-4 text-xs text-indigo/60 pt-2">
                  <span className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-clay" /> {selectedProduct.storeName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-clay" /> {selectedProduct.storeLocation || selectedProduct.location}
                  </span>
                  {buyerLocation && selectedProduct.storeLatitude && selectedProduct.storeLongitude && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-neem/15 text-neem border border-neem/30">
                      <Navigation className="w-2.5 h-2.5 fill-neem" />
                      {calculateHaversineDistance(
                        buyerLocation.lat,
                        buyerLocation.lng,
                        selectedProduct.storeLatitude,
                        selectedProduct.storeLongitude
                      )} km away
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-ivory rounded-2xl p-4 border border-clay/15 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo/50">Local Price</span>
                  <p className="font-display text-2xl text-indigo">
                    ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neem font-semibold flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5" /> 6-Digit OTP Protected
                  </span>
                  <span className="text-[11px] text-indigo/50">
                    {selectedProduct.stockQty > 0 ? `${selectedProduct.stockQty} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={(e) => {
                    handleAddToCart(selectedProduct, e);
                    setSelectedProduct(null);
                  }}
                  disabled={selectedProduct.stockQty <= 0}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all shadow-warm flex items-center justify-center gap-2 cursor-pointer ${
                    selectedProduct.stockQty <= 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-clay hover:bg-saffron text-warmwhite'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </button>
                <a
                  href={`/products/${selectedProduct.id}`}
                  className="px-4 py-3 rounded-xl bg-indigo hover:bg-deepdark text-warmwhite text-xs font-semibold transition-all text-center"
                >
                  Full Page →
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
