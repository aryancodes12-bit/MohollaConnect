import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Search, MapPin, Loader2, Navigation, Check } from 'lucide-react';
import { searchNominatim } from '../utils/geoUtils';
import { createClayMarkerIcon } from '../utils/mapIcons';

// Helper component to smoothly center/fly map when position changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

export default function LocationPicker({
  initialAddress = '',
  initialLat = null,
  initialLng = null,
  onLocationSelect,
  label = 'Search Address / Locality',
  helperText = 'Type to search local areas in India. Drag the clay pin on the map to fine-tune your exact doorstep.',
}) {
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Position state: defaults to given initial or Central New Delhi (28.6139, 77.2090)
  const defaultPos = [28.6139, 77.2090];
  const [markerPos, setMarkerPos] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : defaultPos
  );
  const [hasSelectedLocation, setHasSelectedLocation] = useState(Boolean(initialLat && initialLng));
  const markerRef = useRef(null);

  // Debounced search (600ms) to respect Nominatim rate limit (<= 1 req/sec)
  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchNominatim(query);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error('Nominatim search error:', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle suggestion pick
  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const newPos = [lat, lon];

    setQuery(item.display_name);
    setMarkerPos(newPos);
    setHasSelectedLocation(true);
    setShowDropdown(false);

    if (onLocationSelect) {
      onLocationSelect({
        addressText: item.display_name,
        latitude: lat,
        longitude: lon,
      });
    }
  };

  // Marker drag end handler to capture precise pin drop
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          const newLat = latLng.lat;
          const newLng = latLng.lng;
          setMarkerPos([newLat, newLng]);
          setHasSelectedLocation(true);

          if (onLocationSelect) {
            onLocationSelect({
              addressText: query,
              latitude: newLat,
              longitude: newLng,
            });
          }
        }
      },
    }),
    [query, onLocationSelect]
  );

  // Use current browser GPS location if requested
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setMarkerPos([lat, lon]);
        setHasSelectedLocation(true);
        if (onLocationSelect) {
          onLocationSelect({
            addressText: query || 'My Current Device Location',
            latitude: lat,
            longitude: lon,
          });
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
      }
    );
  };

  const clayIcon = useMemo(() => createClayMarkerIcon(true), []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-indigo">{label}</label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-clay hover:text-saffron transition-colors cursor-pointer"
        >
          <Navigation className="w-3 h-3" /> Detect My Location
        </button>
      </div>

      {/* Autocomplete Input */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search locality, sector, colony, or city in India..."
            className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl border border-clay/30 bg-warmwhite text-indigo text-sm focus:outline-none focus:ring-2 focus:ring-clay/40"
          />
          <Search className="w-4 h-4 text-clay/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-clay animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-xl shadow-warm-lg border border-clay/20 divide-y divide-clay/10 text-xs">
            {suggestions.map((item, idx) => (
              <li
                key={item.place_id || idx}
                onClick={() => handleSelectSuggestion(item)}
                className="p-3 hover:bg-clay/10 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-clay shrink-0 mt-0.5" />
                <span className="text-indigo/90 leading-relaxed">{item.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-indigo/60 leading-normal">{helperText}</p>

      {/* Interactive Leaflet Map with Draggable Pin */}
      <div className="h-60 w-full rounded-2xl overflow-hidden border border-clay/25 relative shadow-sm z-0">
        <MapContainer
          center={markerPos}
          zoom={hasSelectedLocation ? 15 : 5}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={markerPos} />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={markerPos}
            ref={markerRef}
            icon={clayIcon}
          />
        </MapContainer>

        {/* Pin drop instruction badge on top of map */}
        <div className="absolute bottom-2 left-2 z-[400] bg-warmwhite/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-clay/20 text-[10px] text-indigo font-medium shadow-sm flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3 h-3 text-clay shrink-0" />
          <span>Pin: {markerPos[0].toFixed(4)}, {markerPos[1].toFixed(4)} (Drag to fine-tune)</span>
        </div>
      </div>
    </div>
  );
}
