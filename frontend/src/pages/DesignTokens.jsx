import React from 'react';
import { ShieldCheck, Store, ShoppingBag, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DesignTokens() {
  const colors = [
    { name: 'Indigo (#1B1F3B)', class: 'bg-indigo text-warmwhite', role: 'Primary Dark, Security, Calmer Surfaces' },
    { name: 'Clay (#D96B43)', class: 'bg-clay text-warmwhite', role: 'Primary Warm Accent, CTAs, Focus Rings' },
    { name: 'Ivory (#FBF8F3)', class: 'bg-ivory text-indigo border border-clay/20', role: 'Base Background Light Mode' },
    { name: 'Marigold (#E6A100)', class: 'bg-marigold text-indigo', role: 'Highlight Accent, Badges, Stars' },
    { name: 'Neem (#2B580C)', class: 'bg-neem text-warmwhite', role: 'Freshness, Produce, Success States' },
    { name: 'Saffron (#E05A47)', class: 'bg-saffron text-warmwhite', role: 'Festival Flourish, Alerts, Errors' },
    { name: 'Warmwhite (#FAF6F0)', class: 'bg-warmwhite text-indigo border border-indigo/10', role: 'Card Container Fill' },
    { name: 'Deepdark (#121420)', class: 'bg-deepdark text-warmwhite', role: 'Footer, Contrast Dark Surfaces' },
  ];

  return (
    <div className="min-h-screen bg-ivory p-6 md:p-12 space-y-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto space-y-3 border-b border-clay/20 pb-6">
        <div className="flex items-center gap-2 text-clay font-semibold text-sm tracking-wider uppercase">
          <Sparkles className="w-4 h-4" /> Internal Styleguide — PS-7
        </div>
        <h1 className="text-4xl md:text-5xl font-display text-indigo">
          Indian Premium Design Tokens
        </h1>
        <p className="text-indigo/70 text-lg">
          Single source of truth for LocalConnect colors, typography, textures, and badge utilities.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-2xl font-display text-indigo border-l-4 border-clay pl-3">
            Color Palette
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {colors.map((c) => (
              <div key={c.name} className={`p-4 rounded-xl shadow-warm ${c.class} space-y-2 transition-transform hover:-translate-y-1`}>
                <div className="font-bold text-sm">{c.name}</div>
                <div className="text-xs opacity-90">{c.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4 bg-warmwhite p-6 rounded-2xl foil-border shadow-warm">
          <h2 className="text-2xl font-display text-indigo">Typography Scale</h2>

          <div className="space-y-4 divide-y divide-clay/10">
            <div className="pt-2">
              <span className="text-xs font-mono text-clay">Display (Rozha One)</span>
              <p className="font-display text-3xl md:text-4xl text-indigo mt-1">
                मोहल्ला बाज़ार & Artisan Heritage
              </p>
            </div>
            <div className="pt-4">
              <span className="text-xs font-mono text-clay">Body (Plus Jakarta Sans)</span>
              <p className="font-body text-base text-indigo/80 mt-1">
                Handcrafted Sheesham wood carved directly by artisans in Saharanpur. Verified Mohalla Seller with delivery OTP protection.
              </p>
            </div>
            <div className="pt-4">
              <span className="text-xs font-mono text-clay">Indic Script (Noto Sans Devanagari)</span>
              <p className="font-indic text-lg text-indigo mt-1">
                सीधे कारीगरों के घर से आपके मोहल्ले तक — ₹1,299
              </p>
            </div>
          </div>
        </section>

        {/* Badges & Tags */}
        <section className="space-y-4">
          <h2 className="text-2xl font-display text-indigo border-l-4 border-marigold pl-3">
            Role & Status Badges
          </h2>
          <div className="flex flex-wrap gap-4 items-center bg-white p-6 rounded-xl shadow-warm">
            <span className="px-3 py-1 rounded-full text-xs font-semibold badge-buyer flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Buyer (क्रेता)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold badge-seller flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Verified Mohalla Seller
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold badge-pending flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Pending Seller Approval
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold badge-admin flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> System Admin
            </span>
          </div>
        </section>

        {/* Textures & Masks */}
        <section className="space-y-4">
          <h2 className="text-2xl font-display text-indigo border-l-4 border-neem pl-3">
            Textures & Metallic Accents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jali Texture */}
            <div className="relative p-8 rounded-2xl bg-warmwhite jali-bg border border-clay/20 shadow-warm space-y-2">
              <h3 className="font-display text-xl text-indigo">Jali Lattice Texture</h3>
              <p className="text-sm text-indigo/70">
                Geometric Indian jali background texture mask used on hero cards, seller badges, and background panels.
              </p>
            </div>

            {/* Foil Border */}
            <div className="p-8 rounded-2xl foil-border shadow-warm space-y-2">
              <h3 className="font-display text-xl text-indigo">Metallic Foil Stamp Border</h3>
              <p className="text-sm text-indigo/70">
                Marigold/Clay gradient accent border utility (.foil-border) for premium cards and highlight callouts.
              </p>
            </div>
          </div>
        </section>

        {/* Security Screen Glass Surface */}
        <section className="space-y-4">
          <h2 className="text-2xl font-display text-indigo border-l-4 border-indigo pl-3">
            Calmer Security Surface (OTP / Payment)
          </h2>
          <div className="p-8 rounded-2xl glass-indigo text-warmwhite space-y-3">
            <div className="flex items-center gap-2 text-marigold text-sm font-semibold">
              <ShieldCheck className="w-5 h-5" /> 6-Digit Delivery OTP Secure Gate
            </div>
            <p className="text-warmwhite/80 text-sm">
              Calmer indigo tone used intentionally for OTP generation & verification to signal security and trust.
            </p>
            <button className="px-5 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-semibold text-sm transition-all shadow-warm flex items-center gap-2">
              Verify OTP <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
