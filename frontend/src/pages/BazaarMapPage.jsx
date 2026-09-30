import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Store as StoreIcon, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Tag, 
  Phone,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { createClayMarkerIcon, createUserLocationIcon } from '../utils/mapIcons';
import { calculateHaversineDistance } from '../utils/geoUtils';

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

// Helper to recenter map viewport
function MapFlyTo({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function BazaarMapPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    fetchApprovedStores();
    detectBuyerLocation();
  }, []);

  const detectBuyerLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuyerLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsDetectingLocation(false);
      },
      (err) => {
        console.info('Buyer geolocation unavailable:', err.message);
        setIsDetectingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  const fetchApprovedStores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stores?status=APPROVED');
      setStores(res.data || []);
    } catch (err) {
      console.error('Failed to load approved stores:', err);
      // Fallback: try loading all stores and filtering client-side
      try {
        const fallbackRes = await api.get('/stores');
        const approved = (fallbackRes.data || []).filter((s) => s.status === 'APPROVED');
        setStores(approved);
      } catch (e) {
        setStores([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter stores by category & coordinates presence
  const visibleStores = useMemo(() => {
    return stores.filter((s) => {
      // Must have valid coordinates
      if (!s.latitude || !s.longitude) return false;

      // Category filter
      if (selectedCategory !== 'ALL') {
        const cat = (s.category || '').toUpperCase();
        if (selectedCategory === 'FOOD') {
          if (cat !== 'FOOD' && cat !== 'SPICES' && cat !== 'BAKERY') return false;
        } else if (cat !== selectedCategory) {
          return false;
        }
      }
      return true;
    });
  }, [stores, selectedCategory]);

  // Compute centroid of all available stores if buyer location is not available
  const initialCenter = useMemo(() => {
    if (buyerLocation) {
      return [buyerLocation.lat, buyerLocation.lng];
    }
    const withCoords = stores.filter((s) => s.latitude && s.longitude);
    if (withCoords.length > 0) {
      const sumLat = withCoords.reduce((acc, s) => acc + s.latitude, 0);
      const sumLng = withCoords.reduce((acc, s) => acc + s.longitude, 0);
      return [sumLat / withCoords.length, sumLng / withCoords.length];
    }
    // Default fallback to India center / New Delhi
    return [28.6139, 77.2090];
  }, [buyerLocation, stores]);

  const clayPin = useMemo(() => createClayMarkerIcon(false), []);
  const activeClayPin = useMemo(() => createClayMarkerIcon(true), []);
  const userPin = useMemo(() => createUserLocationIcon(), []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-indigo text-warmwhite p-6 md:p-8 overflow-hidden jali-bg foil-border-indigo shadow-warm-lg">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay/20 text-marigold text-xs font-semibold backdrop-blur-md border border-marigold/30">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Mohalla Bazaar Map
          </div>
          <h1 className="font-display text-2xl md:text-4xl text-warmwhite leading-tight">
            Explore Verified Neighbourhood Artisans & Local Stores
          </h1>
          <p className="text-warmwhite/80 text-xs md:text-sm font-body leading-relaxed max-w-2xl">
            Locate approved home studios, kirana shops, and craft workshops mapped across India. Click any terracotta pin to preview storefront items and discover direct local makers.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={detectBuyerLocation}
              disabled={isDetectingLocation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-warmwhite text-indigo font-bold text-xs hover:bg-clay hover:text-warmwhite transition-all shadow-sm cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 text-clay ${isDetectingLocation ? 'animate-spin' : ''}`} />
              {buyerLocation ? 'Recenter to My Location' : 'Locate Near Me'}
            </button>
            <span className="text-xs text-warmwhite/70">
              Showing <strong className="text-marigold font-bold">{visibleStores.length}</strong> verified sellers on map
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-indigo border-l-4 border-clay pl-3">
            Filter by Craft & Service
          </h2>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="inline-flex items-center gap-1 text-xs text-saffron hover:underline font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Show All
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_MAP.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 cursor-pointer ${
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

      {/* Main Map Canvas & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Map Viewport */}
        <div className="lg:col-span-8 bg-warmwhite rounded-3xl p-2 border border-clay/20 shadow-warm">
          <div className="h-[560px] w-full rounded-2xl overflow-hidden relative z-0">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 bg-ivory">
                <div className="w-10 h-10 border-4 border-clay/30 border-t-clay rounded-full animate-spin" />
                <p className="text-xs text-indigo/60 font-medium">Plotting Mohalla sellers on OpenStreetMap...</p>
              </div>
            ) : (
              <MapContainer
                center={initialCenter}
                zoom={buyerLocation ? 13 : 5}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                {/* Free OpenStreetMap tile layer with required attribution */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapFlyTo center={initialCenter} zoom={buyerLocation ? 13 : 6} />

                {/* Buyer Current Device Marker */}
                {buyerLocation && (
                  <Marker position={[buyerLocation.lat, buyerLocation.lng]} icon={userPin}>
                    <Popup>
                      <div className="p-1 text-center font-body text-xs">
                        <span className="font-bold text-neem block">📍 You Are Here</span>
                        <span className="text-[11px] text-indigo/70">Buyer Device Location</span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Approved Seller Markers */}
                {visibleStores.map((s) => {
                  const isSelected = selectedStore?.id === s.id;
                  const distanceKm = buyerLocation
                    ? calculateHaversineDistance(buyerLocation.lat, buyerLocation.lng, s.latitude, s.longitude)
                    : null;

                  return (
                    <Marker
                      key={s.id}
                      position={[s.latitude, s.longitude]}
                      icon={isSelected ? activeClayPin : clayPin}
                      eventHandlers={{
                        click: () => setSelectedStore(s),
                      }}
                    >
                      <Popup className="custom-popup">
                        <div className="p-2 space-y-2 min-w-[200px] font-body text-indigo">
                          <div className="flex items-center justify-between border-b border-clay/10 pb-1.5">
                            <span className="text-[10px] font-mono uppercase text-clay font-bold">
                              {s.category}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-neem bg-neem/10 px-1.5 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          </div>

                          <div>
                            <h4 className="font-display text-sm font-bold text-indigo leading-tight">
                              {s.storeName}
                            </h4>
                            <p className="text-[11px] text-indigo/70 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-clay shrink-0" />
                              <span className="truncate">{s.location}</span>
                            </p>
                          </div>

                          {distanceKm !== null && (
                            <div className="text-[10px] font-bold text-neem bg-neem/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Navigation className="w-2.5 h-2.5 fill-neem" /> {distanceKm} km away
                            </div>
                          )}

                          <div className="pt-1">
                            <Link
                              to={`/storefront/${s.id}`}
                              className="w-full py-1.5 px-3 rounded-lg bg-clay text-warmwhite text-xs font-bold hover:bg-saffron flex items-center justify-center gap-1 transition-all shadow-sm"
                            >
                              <span>Visit Storefront</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}

            {/* Bottom floating hint */}
            <div className="absolute bottom-3 left-3 z-[400] bg-warmwhite/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-clay/20 shadow-sm text-[11px] text-indigo/80 font-medium flex items-center gap-2 pointer-events-none">
              <span className="w-3 h-3 rounded-full bg-clay inline-block shadow-sm"></span>
              <span>Terracotta pins mark verified artisan workshops & stores</span>
            </div>
          </div>
        </div>

        {/* Right Store Detail Card / Selected Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-warmwhite p-6 rounded-3xl border border-clay/20 shadow-warm space-y-4">
            <div className="flex items-center justify-between border-b border-clay/10 pb-3">
              <h3 className="font-display text-lg text-indigo flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-clay" /> Seller Spotlight
              </h3>
              {selectedStore && (
                <button
                  onClick={() => setSelectedStore(null)}
                  className="text-xs text-indigo/50 hover:text-indigo cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedStore ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-clay font-bold mb-1">
                    <Tag className="w-3.5 h-3.5" /> {selectedStore.category}
                  </div>
                  <h4 className="font-display text-xl text-indigo leading-tight">
                    {selectedStore.storeName}
                  </h4>
                  <p className="text-xs text-indigo/60 flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-clay shrink-0" />
                    <span>{selectedStore.location}</span>
                  </p>
                </div>

                {buyerLocation && selectedStore.latitude && selectedStore.longitude && (
                  <div className="bg-neem/10 border border-neem/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-neem font-bold flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 fill-neem" /> Calculated Distance
                    </span>
                    <span className="font-mono font-bold text-neem">
                      {calculateHaversineDistance(
                        buyerLocation.lat,
                        buyerLocation.lng,
                        selectedStore.latitude,
                        selectedStore.longitude
                      )} km
                    </span>
                  </div>
                )}

                <p className="text-xs text-indigo/80 leading-relaxed bg-ivory p-3.5 rounded-xl border border-clay/15">
                  {selectedStore.description || 'Verified local shop offering direct products to mohalla neighbours.'}
                </p>

                <div className="pt-2">
                  <Link
                    to={`/storefront/${selectedStore.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-clay text-warmwhite text-sm font-bold hover:bg-saffron flex items-center justify-center gap-2 transition-all shadow-warm"
                  >
                    <span>View Full Storefront & Catalog</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-clay/10 text-clay flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="font-display text-base text-indigo">Select a Pin on the Map</h4>
                <p className="text-xs text-indigo/60 max-w-xs mx-auto">
                  Click on any terracotta pin on the map to inspect the artisan's bio, verified locality, and direct products.
                </p>
              </div>
            )}
          </div>

          {/* Quick List of Visible Stores */}
          <div className="bg-warmwhite p-5 rounded-3xl border border-clay/20 shadow-warm space-y-3">
            <h4 className="font-display text-sm text-indigo">
              Nearby Sellers ({visibleStores.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {visibleStores.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStore(st)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedStore?.id === st.id
                      ? 'bg-clay/10 border-clay text-indigo font-bold'
                      : 'bg-ivory border-clay/15 hover:border-clay/40 text-indigo/80'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate font-semibold">{st.storeName}</p>
                    <p className="text-[10px] text-indigo/60 truncate">{st.location}</p>
                  </div>
                  {buyerLocation && (
                    <span className="text-[10px] font-mono text-clay whitespace-nowrap">
                      {calculateHaversineDistance(
                        buyerLocation.lat,
                        buyerLocation.lng,
                        st.latitude,
                        st.longitude
                      )} km
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
