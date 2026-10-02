import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Crown,
  BarChart3,
  MapPin,
  MessageSquare,
  HelpCircle,
  Truck,
  CreditCard,
  Lock,
} from 'lucide-react';

export const SELLER_PLANS = [
  {
    id: 'STARTER',
    name: 'Mohalla Starter',
    hindiName: 'आरंभिक शिल्पकार',
    tagline: 'Ideal for independent home artisans taking their craft digital.',
    price: 99,
    period: '/ month',
    badge: 'Starter',
    accentColor: 'border-clay/20 bg-warmwhite',
    buttonClass: 'bg-indigo hover:bg-indigo/90 text-warmwhite',
    features: [
      { text: 'Up to 15 craft product listings', included: true },
      { text: 'Standard pin on Mohalla Bazaar Map', included: true },
      { text: 'Secure buyer OTP delivery protection', included: true },
      { text: 'Automated order status emails (EmailJS)', included: true },
      { text: 'Community forum participation & buyer comments', included: true },
      { text: 'AI Saathi multilingual voice assistant', included: false },
      { text: 'Metabase BI store analytics & sentiment reports', included: false },
      { text: 'Priority Admin review queue', included: false },
    ],
  },
  {
    id: 'ARTISAN_PRO',
    name: 'Artisan Pro',
    hindiName: 'शिल्पकार प्रो (लोकप्रिय)',
    tagline: 'Our most popular plan for active workshops & traditional makers.',
    price: 499,
    period: '/ month',
    badge: 'Most Popular',
    isPopular: true,
    accentColor: 'border-clay bg-warmwhite ring-2 ring-clay/30 shadow-warm-lg',
    buttonClass: 'bg-clay hover:bg-clay/90 text-warmwhite shadow-warm',
    features: [
      { text: 'Unlimited craft product listings', included: true },
      { text: 'Terracotta featured pin on Bazaar Map & search boost', included: true },
      { text: 'Verified Mohalla Artisan badge on your storefront', included: true },
      { text: 'AI Saathi Voice & Chat in Hindi & English', included: true },
      { text: 'Automated order status emails (EmailJS)', included: true },
      { text: 'Fast-track Admin verification queue', included: true },
      { text: 'Customer reviews & high-rating promotion', included: true },
      { text: 'Metabase BI store analytics & sentiment reports', included: false },
    ],
  },
  {
    id: 'HERITAGE_GUILD',
    name: 'Heritage Guild',
    hindiName: 'विरासत गिल्ड (प्रीमियम)',
    tagline: 'For master craftspeople, GI heritage studios & artisan collectives.',
    price: Number(import.meta.env.VITE_PREMIUM_PRICE_INR) || 999,
    period: '/ month',
    badge: 'Premium Guild',
    isPremium: true,
    accentColor: 'border-marigold/80 bg-warmwhite shadow-warm-xl',
    buttonClass: 'bg-gradient-to-r from-clay via-marigold to-saffron text-warmwhite font-extrabold shadow-warm',
    features: [
      { text: 'Everything in Artisan Pro, plus:', included: true },
      { text: 'Featured banner spotlight on LocalConnect homepage', included: true },
      { text: 'Custom Metabase BI analytics & buyer sentiment dashboard', included: true },
      { text: 'Zero commission on first ₹1,00,000 in monthly sales', included: true },
      { text: 'Priority Mohalla logistics partner dispatch support', included: true },
      { text: 'Top priority instant Admin queue approval', included: true },
      { text: 'Dedicated 24/7 Artisan Support Concierge', included: true },
      { text: 'Invitations to exclusive regional artisan buyer festivals', included: true },
    ],
  },
];

export default function SellerPricingChart({
  selectedPlanId = 'ARTISAN_PRO',
  onSelectPlan,
  onProceedPayment,
  isProcessing = false,
  showActionButtons = true,
  actionButtonText,
}) {
  return (
    <div className="space-y-6">
      {/* Test Sandbox Alert Notice */}
      <div className="p-3.5 rounded-2xl bg-clay/5 border border-clay/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-clay text-warmwhite flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-indigo flex items-center gap-1.5">
              <span>Razorpay Test Gateway Enabled</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-clay/10 text-clay font-semibold">
                SANDBOX
              </span>
            </div>
            <p className="text-indigo/70 text-[11px] leading-tight">
              Test mode active with API Key <code className="font-mono text-clay">rzp_test_T3Fhdi7QvZzqdQ</code>. Demo subscriptions simulate real bank approvals safely.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-clay font-bold shrink-0 self-end sm:self-auto text-[11px]">
          <ShieldCheck className="w-4 h-4" />
          <span>PCI-DSS Demo Certified</span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SELLER_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan && onSelectPlan(plan)}
              className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? `${plan.accentColor} ring-2 ring-clay shadow-warm-lg scale-[1.02]`
                  : 'bg-warmwhite border border-clay/20 hover:border-clay/50 hover:shadow-warm opacity-90 hover:opacity-100'
              }`}
            >
              {/* Badges */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-clay text-warmwhite text-[11px] font-bold tracking-wide flex items-center gap-1 shadow-warm uppercase">
                  <Sparkles className="w-3 h-3" /> {plan.badge}
                </div>
              )}
              {plan.isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-marigold text-indigo text-[11px] font-extrabold tracking-wide flex items-center gap-1 shadow-warm uppercase">
                  <Crown className="w-3 h-3" /> {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl text-indigo font-bold">{plan.name}</h3>
                    <p className="font-indic text-xs text-clay font-medium">{plan.hindiName}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-clay bg-clay text-warmwhite'
                        : 'border-clay/30 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-indigo/70 min-h-[34px] leading-relaxed">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="py-2 border-y border-clay/10 flex items-baseline gap-1">
                  <span className="text-xs text-indigo/70 font-semibold">₹</span>
                  <span className="font-display text-3xl text-indigo font-bold">
                    {plan.price}
                  </span>
                  <span className="text-xs text-indigo/60">{plan.period}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 pt-2">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`text-xs flex items-start gap-2 ${
                        feature.included ? 'text-indigo/90' : 'text-indigo/35 line-through'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          feature.included
                            ? 'bg-neem/15 text-neem'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Selection Action */}
              {showActionButtons && (
                <div className="pt-6 mt-4 border-t border-clay/10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPlan) onSelectPlan(plan);
                      if (onProceedPayment) onProceedPayment(plan);
                    }}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.buttonClass
                    } ${isSelected ? 'ring-2 ring-offset-2 ring-clay' : ''}`}
                  >
                    {isProcessing && isSelected ? (
                      <>
                        <div className="w-4 h-4 border-2 border-warmwhite border-t-transparent rounded-full animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>
                          {actionButtonText
                            ? actionButtonText(plan)
                            : `Select & Pay ₹${plan.price}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
