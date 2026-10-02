import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Store,
  CreditCard,
  Lock,
  ChevronDown,
  Gift,
  Award,
} from 'lucide-react';
import SellerPricingChart, { SELLER_PLANS } from '../components/pricing/SellerPricingChart';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { launchRazorpayCheckout } from '../utils/razorpay';

export default function PricingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState(SELLER_PLANS[1]); // Default to Artisan Pro
  const [isProcessing, setIsProcessing] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handlePlanAction = async (plan) => {
    setSelectedPlan(plan);

    // If user is not logged in, take them to registration with this plan selected
    if (!user) {
      navigate(`/register?role=seller&plan=${plan.id}`);
      return;
    }

    // If user is logged in as a seller or pending seller, launch Razorpay test payment
    setIsProcessing(true);
    try {
      showToast(`Initiating demo Razorpay checkout for ${plan.name}...`, 'info');
      const paymentResult = await launchRazorpayCheckout({
        plan,
        sellerName: user.name,
        sellerEmail: user.email,
        storeName: user.name + "'s Workshop",
      });

      if (paymentResult.success) {
        showToast(
          `Demo Payment Verified! Reference: ${paymentResult.paymentId}. Plan active.`,
          'success'
        );
        navigate('/dashboard');
      }
    } catch (err) {
      console.warn('Payment dismiss / error:', err);
      showToast(err.message || 'Payment was cancelled.', 'warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const FAQS = [
    {
      q: 'Why do sellers need a subscription before landing on LocalConnect?',
      a: 'To protect local craft communities from spam and unverified listings, Mohalla Sellers activate a subscription before their shop application is sent to the Mohalla Admin for verification. In this demo environment, test mode is enabled with live test credentials (rzp_test_T3Fhdi7QvZzqdQ).',
    },
    {
      q: 'Will my credit or debit card be charged real money during demo?',
      a: 'No! The platform uses Razorpay Test Mode with test key credentials. You can use standard test card numbers or UPI handles. No real money is deducted.',
    },
    {
      q: 'What happens after I complete the test payment?',
      a: 'Your subscription status is automatically tagged as PAID, and your store application lands in the Admin Seller Queue with your payment reference ID. Once approved by Mohalla Admin, your shop opens for direct neighborhood orders.',
    },
    {
      q: 'Can I upgrade my plan later?',
      a: 'Yes! You can upgrade from Mohalla Starter to Artisan Pro or Heritage Guild at any time directly through your Seller Store Settings.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-clay/10 text-clay text-xs font-bold border border-clay/20 shadow-warm-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>LocalConnect Mohalla Artisan Subscriptions</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display text-indigo tracking-tight leading-tight">
          Empowering Indian Craftspeople with Fair, Transparent Pricing
        </h1>
        <p className="text-sm sm:text-base text-indigo/70 leading-relaxed font-indic">
          सीधे खरीदारों से जुड़ें, बिना किसी बिचौलिए के। अपनी दुकान को मोहल्ला स्तर पर पहचान दिलाएं।
        </p>
      </div>

      {/* Pricing Chart Component */}
      <SellerPricingChart
        selectedPlanId={selectedPlan.id}
        onSelectPlan={(plan) => setSelectedPlan(plan)}
        onProceedPayment={handlePlanAction}
        isProcessing={isProcessing}
        showActionButtons={true}
        actionButtonText={(plan) =>
          user ? `Subscribe to ${plan.name} (₹${plan.price})` : `Get Started with ${plan.name}`
        }
      />

      {/* Trust & Guarantee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-clay/20">
        <div className="p-6 rounded-2xl bg-warmwhite border border-clay/10 shadow-warm-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-clay/10 text-clay shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-indigo">Admin Verified Quality</h4>
            <p className="text-xs text-indigo/70 leading-relaxed">
              Every subscribing seller undergoes Mohalla Governance verification for genuine artisan provenance.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-warmwhite border border-clay/10 shadow-warm-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-neem/10 text-neem shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-indigo">Safe Razorpay Test Sandbox</h4>
            <p className="text-xs text-indigo/70 leading-relaxed">
              Instant test payment simulation with official Razorpay test keys and webhooks.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-warmwhite border border-clay/10 shadow-warm-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-marigold/10 text-clay shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-indigo">Bazaar Map Priority</h4>
            <p className="text-xs text-indigo/70 leading-relaxed">
              Subscribed workshops receive highlighted pins and discovery ranking on the interactive Leaflet map.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display text-indigo">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-indigo/60">
            Clear answers about onboarding, test subscriptions, and store approvals.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-warmwhite border border-clay/20 overflow-hidden shadow-warm-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm text-indigo">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-clay transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-indigo/80 leading-relaxed border-t border-clay/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-indigo text-warmwhite relative overflow-hidden jali-bg shadow-warm-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 text-center sm:text-left">
          <h3 className="text-2xl sm:text-3xl font-display text-warmwhite">
            Ready to bring your craft to LocalConnect?
          </h3>
          <p className="text-xs sm:text-sm text-warmwhite/80 max-w-xl">
            Register your artisan workshop, choose your plan, and experience our seamless Razorpay checkout simulation.
          </p>
        </div>

        <Link
          to="/register?role=seller"
          className="relative z-10 px-6 py-3.5 rounded-xl bg-clay hover:bg-clay/90 text-warmwhite font-bold text-xs shadow-warm flex items-center gap-2 shrink-0 transition-all cursor-pointer"
        >
          <span>Start Seller Registration</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
