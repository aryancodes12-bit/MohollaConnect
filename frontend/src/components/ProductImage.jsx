import React, { useState } from 'react';

// Category-specific visual icon & color config for graceful fallbacks
const CATEGORY_FALLBACKS = {
  KIRANA: { icon: '🌾', label: 'Kirana & Grocery', bg: 'from-amber-100 via-orange-50 to-warmwhite', text: 'text-amber-800' },
  DAIRY: { icon: '🥛', label: 'Dairy & Milk Booth', bg: 'from-blue-50 via-sky-50 to-warmwhite', text: 'text-sky-800' },
  VEGETABLES: { icon: '🥬', label: 'Fresh Mandi Produce', bg: 'from-emerald-50 via-green-50 to-warmwhite', text: 'text-emerald-800' },
  TAILORING: { icon: '🧵', label: 'Tailoring & Alterations', bg: 'from-rose-50 via-pink-50 to-warmwhite', text: 'text-rose-800' },
  LAUNDRY: { icon: '🧺', label: 'Ironing & Press Service', bg: 'from-indigo-50 via-blue-50 to-warmwhite', text: 'text-indigo-800' },
  HANDICRAFTS: { icon: '🪵', label: 'Artisan Wood & Metal', bg: 'from-amber-100 via-orange-100 to-warmwhite', text: 'text-orange-900' },
  FOOD: { icon: '🌿', label: 'Spices, Bakery & Food', bg: 'from-orange-50 via-amber-50 to-warmwhite', text: 'text-amber-900' },
  TEXTILES: { icon: '👘', label: 'Handloom & Block Print', bg: 'from-indigo-100 via-purple-50 to-warmwhite', text: 'text-indigo-900' },
  SERVICES: { icon: '⚡', label: 'Local Repair & Service', bg: 'from-slate-100 via-amber-50 to-warmwhite', text: 'text-slate-800' },
};

export default function ProductImage({
  src,
  alt = 'Product',
  category = 'KIRANA',
  className = '',
  marketFrame = true,
  aspectClass = 'aspect-square',
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Normalize category key
  const catUpper = (category || 'KIRANA').toUpperCase();
  const fallback =
    CATEGORY_FALLBACKS[catUpper] ||
    (catUpper.includes('SPICE')
      ? CATEGORY_FALLBACKS.FOOD
      : catUpper.includes('WOOD')
      ? CATEGORY_FALLBACKS.HANDICRAFTS
      : catUpper.includes('TEXTILE')
      ? CATEGORY_FALLBACKS.TEXTILES
      : CATEGORY_FALLBACKS.KIRANA);

  const hasValidImage = src && !imgError;

  return (
    <div
      className={`relative overflow-hidden ${aspectClass} ${
        marketFrame
          ? 'rounded-2xl border-2 border-clay/20 bg-warmwhite shadow-sm hover:border-clay/40 transition-colors'
          : 'rounded-xl'
      } ${className}`}
    >
      {/* Market-stall subtle decorative inner corner accents */}
      {marketFrame && (
        <>
          <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-clay/40 rounded-tl z-20 pointer-events-none" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-clay/40 rounded-tr z-20 pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-clay/40 rounded-bl z-20 pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-clay/40 rounded-br z-20 pointer-events-none" />
        </>
      )}

      {hasValidImage ? (
        <>
          {/* Skeleton placeholder while image streams */}
          {!imgLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${fallback.bg} animate-pulse flex items-center justify-center`}>
              <span className="text-3xl opacity-40">{fallback.icon}</span>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        </>
      ) : (
        /* Category-specific graceful fallback (No broken bag icon!) */
        <div
          className={`w-full h-full bg-gradient-to-br ${fallback.bg} flex flex-col items-center justify-center p-3 text-center select-none`}
        >
          <div className="text-4xl mb-1 filter drop-shadow-sm transition-transform hover:scale-110 duration-200">
            {fallback.icon}
          </div>
          <span className={`text-[11px] font-semibold font-display tracking-wide uppercase ${fallback.text}`}>
            {fallback.label}
          </span>
          <span className="text-[10px] text-indigo/50 line-clamp-1 mt-0.5 px-2">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
}
