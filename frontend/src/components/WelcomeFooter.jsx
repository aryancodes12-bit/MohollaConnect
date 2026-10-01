import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Store, Heart, Sparkles, Lock } from 'lucide-react';

export default function WelcomeFooter({ onAnchorClick }) {
  const handleLinkClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      if (onAnchorClick) {
        onAnchorClick(e, href);
      } else {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <footer className="w-full bg-indigo text-warmwhite border-t border-clay/20 jali-bg relative overflow-hidden mt-16">
      {/* Decorative Glow Elements */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-clay/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-marigold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Brand Info Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="LocalConnect"
                className="w-11 h-11 rounded-2xl object-cover shadow-warm border border-marigold/30 shrink-0 bg-white"
              />
              <div>
                <span className="font-display text-2xl text-warmwhite tracking-tight block">LocalConnect</span>
                <span className="text-[10px] uppercase font-semibold text-marigold tracking-widest block -mt-1">
                  Mohalla Marketplace
                </span>
              </div>
            </div>

            <p className="font-body text-sm text-warmwhite/80 leading-relaxed max-w-md">
              आपका मोहल्ला, आपकी दुकान — Empowering local artisans, kirana stores, and neighborhood buyers through zero-markup direct commerce and OTP-secured delivery.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warmwhite/10 text-marigold border border-marigold/20">
                <ShieldCheck className="w-3.5 h-3.5 text-marigold" /> 6-Digit OTP Protected
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warmwhite/10 text-neem border border-neem/20">
                <Store className="w-3.5 h-3.5 text-neem" /> Admin-Verified Artisans
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {/* Column 1: Marketplace */}
            <div className="space-y-3">
              <h4 className="font-display text-sm uppercase tracking-wider text-marigold">Explore</h4>
              <ul className="space-y-2 text-xs text-warmwhite/75 font-body">
                <li>
                  <a href="#how-it-works" onClick={(e) => handleLinkClick(e, '#how-it-works')} className="hover:text-warmwhite transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#why-us" onClick={(e) => handleLinkClick(e, '#why-us')} className="hover:text-warmwhite transition-colors">
                    Why LocalConnect
                  </a>
                </li>
                <li>
                  <a href="#otp-safety" onClick={(e) => handleLinkClick(e, '#otp-safety')} className="hover:text-warmwhite transition-colors">
                    OTP Verification
                  </a>
                </li>
                <li>
                  <a href="#testimonials" onClick={(e) => handleLinkClick(e, '#testimonials')} className="hover:text-warmwhite transition-colors">
                    Community Stories
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Users */}
            <div className="space-y-3">
              <h4 className="font-display text-sm uppercase tracking-wider text-marigold">For Users</h4>
              <ul className="space-y-2 text-xs text-warmwhite/75 font-body">
                <li>
                  <a href="#sellers" onClick={(e) => handleLinkClick(e, '#sellers')} className="hover:text-warmwhite transition-colors">
                    For Sellers
                  </a>
                </li>
                <li>
                  <a href="#trust" onClick={(e) => handleLinkClick(e, '#trust')} className="hover:text-warmwhite transition-colors">
                    Trust & Safety
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-warmwhite transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/login?mode=register" className="hover:text-warmwhite transition-colors">
                    Register Store
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Trust & Legal */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="font-display text-sm uppercase tracking-wider text-marigold">Trust & Legal</h4>
              <ul className="space-y-2 text-xs text-warmwhite/75 font-body">
                <li className="hover:text-warmwhite cursor-pointer transition-colors">OTP Protection Policy</li>
                <li className="hover:text-warmwhite cursor-pointer transition-colors">Artisan Seller Standards</li>
                <li className="hover:text-warmwhite cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-warmwhite cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-warmwhite/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-warmwhite/60">
          <p>© {new Date().getFullYear()} LocalConnect. Mohalla Marketplace & Community. All rights reserved.</p>
          <div className="flex items-center gap-1 text-warmwhite/70">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-clay fill-clay" />
            <span>for Indian Artisans & Neighborhoods</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
