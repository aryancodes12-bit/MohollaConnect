import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Store,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  MapPin,
  Tag,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LocationPicker from '../components/LocationPicker';

const STORE_CATEGORIES = [
  { value: 'HANDICRAFTS', label: 'Handicrafts & Pottery (हस्तशिल्प)' },
  { value: 'TEXTILES', label: 'Handloom & Textiles (हथकरघा व वस्त्र)' },
  { value: 'FOOD', label: 'Artisan Food & Spices (मसाले एवं खाद्य)' },
  { value: 'JEWELRY', label: 'Traditional Jewelry (पारंपरिक आभूषण)' },
  { value: 'HOME_DECOR', label: 'Home Decor & Woodwork (सजावट)' },
  { value: 'OTHER', label: 'Other Mohalla Crafts (अन्य)' },
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialRole = searchParams.get('role') === 'seller' ? 'SELLER' : 'BUYER';
  
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [roleSelection, setRoleSelection] = useState(initialRole); // 'BUYER' | 'SELLER'
  const [sellerStep, setSellerStep] = useState(1); // 1 = Account, 2 = Store Profile

  // Form Fields - User
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields - Seller Store
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('HANDICRAFTS');
  const [storeLocation, setStoreLocation] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeLatitude, setStoreLatitude] = useState(null);
  const [storeLongitude, setStoreLongitude] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    if (isGoogleSubmitting || isSubmitting) return;
    setIsGoogleSubmitting(true);
    try {
      const result = await loginWithGoogle(mode, roleSelection);
      if (result.success) {
        if (mode === 'register') {
          if (result.role === 'PENDING_SELLER') {
            toast.warning('Account created! Your Mohalla seller application has been submitted for admin approval.');
            navigate('/dashboard');
          } else if (result.role === 'SELLER') {
            toast.success('Welcome! Your Mohalla seller shop is active.');
            navigate('/dashboard');
          } else {
            toast.success('Account created successfully! Discover local artisans nearby.');
            navigate('/');
          }
        } else {
          toast.success(`Welcome back! Signed in as ${result.role || 'user'}`);
          if (result.role === 'ADMIN') {
            navigate('/admin/sellers');
          } else if (result.role === 'SELLER' || result.role === 'PENDING_SELLER') {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        }
      } else if (result.notRegistered) {
        toast.warning('Account not found! Please register first as a Buyer or Mohalla Seller.');
        setMode('register');
      } else {
        toast.error(result.error || 'Google authentication failed');
      }
    } catch (err) {
      toast.error('Could not complete Google sign-in.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-saffron' };
    if (score <= 4) return { score: 2, label: 'Moderate', color: 'bg-marigold' };
    return { score: 3, label: 'Strong', color: 'bg-neem' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (mode === 'login') {
      setIsSubmitting(true);
      try {
        const result = await login(email, password);
        if (result.success) {
          toast.success(`Welcome back! Logged in as ${result.role || 'user'}`);
          if (result.role === 'ADMIN') {
            navigate('/admin/sellers');
          } else if (result.role === 'SELLER' || result.role === 'PENDING_SELLER') {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        } else {
          toast.error(result.error || 'Invalid credentials');
        }
      } catch (err) {
        toast.error('An unexpected error occurred during login.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Register Mode
    if (mode === 'register') {
      // If Seller and currently on Step 1, advance to Step 2
      if (roleSelection === 'SELLER' && sellerStep === 1) {
        if (!name.trim()) {
          toast.error('Please enter your full name');
          return;
        }
        if (!email.trim()) {
          toast.error('Please enter your email');
          return;
        }
        if (!password || password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        // Advance to step 2
        setSellerStep(2);
        return;
      }

      // Step 2 validation for Seller
      if (roleSelection === 'SELLER' && sellerStep === 2) {
        if (!storeName.trim()) {
          toast.error('Please provide your Store / Workshop name');
          return;
        }
        if (!storeLocation.trim()) {
          toast.error('Please specify your Mohalla / Locality address');
          return;
        }
      }

      setIsSubmitting(true);
      try {
        const result = await register(name, email, password, roleSelection);
        if (result.success) {
          if (roleSelection === 'SELLER') {
            // Automatically create the store with the newly acquired credentials
            try {
              await api.post('/stores', {
                storeName: storeName.trim(),
                category: storeCategory,
                location: storeLocation.trim(),
                description: storeDescription.trim() || 'Authentic handmade creations.',
                latitude: storeLatitude,
                longitude: storeLongitude,
              });
              toast.success('Store application submitted! Awaiting Mohalla Admin approval.');
            } catch (storeErr) {
              console.warn('Auto store creation notice:', storeErr);
              toast.warning('Account created! You can finish setting up your store in the dashboard.');
            }
            navigate('/dashboard');
          } else {
            toast.success('Account created successfully! Welcome to LocalConnect.');
            navigate('/');
          }
        } else {
          toast.error(result.error || 'Registration failed');
        }
      } catch (err) {
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-5xl rounded-3xl bg-warmwhite foil-border shadow-warm-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Panel — Editorial Hero Moment (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-indigo text-warmwhite p-8 flex-col justify-between overflow-hidden jali-bg">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-clay/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-marigold/20 rounded-full blur-3xl" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warmwhite/10 text-marigold text-xs font-semibold backdrop-blur-md border border-marigold/20">
              <Sparkles className="w-3.5 h-3.5" /> Direct from Artisan Homes
            </div>
            <h2 className="font-display text-4xl text-warmwhite leading-tight">
              सीधे कारीगरों से आपके घर तक
            </h2>
          </div>

          {/* Middle Context */}
          <div className="relative z-10 my-6 p-6 rounded-2xl bg-warmwhite/5 backdrop-blur-md border border-warmwhite/10 space-y-3">
            <p className="font-indic text-base text-warmwhite/90 italic leading-relaxed">
              "LocalConnect brings Saharanpur woodwork, Kolhapuri leather, and home-cooked spices directly into neighborhood trust networks."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-clay text-warmwhite flex items-center justify-center font-bold text-xs">
                M
              </div>
              <div>
                <p className="text-xs font-semibold text-warmwhite">Meera Sharma</p>
                <p className="text-[10px] text-warmwhite/60">Verified Mohalla Artisan, Jaipur</p>
              </div>
            </div>
          </div>

          {/* Footer Proof */}
          <div className="relative z-10 pt-4 border-t border-warmwhite/10 flex items-center justify-between text-xs text-warmwhite/70">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-marigold" /> 6-Digit OTP Security
            </span>
            <span>12,400+ Local Members</span>
          </div>
        </div>

        {/* Right Panel — Interactive Auth Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center space-y-6">
          
          {/* Mode Switch Tabs */}
          <div className="flex items-center justify-between border-b border-clay/15 pb-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-indigo">
                {mode === 'login'
                  ? 'Welcome Back'
                  : roleSelection === 'SELLER' && sellerStep === 2
                  ? 'Store Profile Setup'
                  : 'Join LocalConnect'}
              </h1>
              <p className="text-xs sm:text-sm text-indigo/70 mt-0.5">
                {mode === 'login'
                  ? 'Access your orders, OTP verifications, and saved stores.'
                  : roleSelection === 'SELLER' && sellerStep === 2
                  ? 'Step 2 of 2: Tell buyers about your craft & workshop location.'
                  : 'Create an account to support local artisans or start selling.'}
              </p>
            </div>

            <div className="flex p-1 bg-ivory rounded-xl border border-clay/20 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setSellerStep(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-clay text-warmwhite shadow-sm'
                    : 'text-indigo/70 hover:text-indigo'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setSellerStep(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-clay text-warmwhite shadow-sm'
                    : 'text-indigo/70 hover:text-indigo'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Register Role Selector Cards */}
            <AnimatePresence mode="wait">
              {mode === 'register' && sellerStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-semibold uppercase tracking-wider text-indigo/80">
                    I want to join as:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Buyer Card */}
                    <div
                      onClick={() => setRoleSelection('BUYER')}
                      className={`cursor-pointer relative p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                        roleSelection === 'BUYER'
                          ? 'border-clay bg-clay/5 ring-2 ring-clay/20 shadow-warm'
                          : 'border-clay/20 bg-ivory/50 hover:border-clay/40'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${roleSelection === 'BUYER' ? 'bg-clay text-warmwhite' : 'bg-clay/10 text-clay'}`}>
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-sm text-indigo">
                          Buyer <span className="font-indic text-xs text-clay">(क्रेता)</span>
                        </div>
                        <p className="text-xs text-indigo/70 leading-snug">
                          Buy authentic handmade creations with OTP security.
                        </p>
                      </div>
                      {roleSelection === 'BUYER' && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-clay text-warmwhite flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Seller Card */}
                    <div
                      onClick={() => setRoleSelection('SELLER')}
                      className={`cursor-pointer relative p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                        roleSelection === 'SELLER'
                          ? 'border-clay bg-clay/5 ring-2 ring-clay/20 shadow-warm'
                          : 'border-clay/20 bg-ivory/50 hover:border-clay/40'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${roleSelection === 'SELLER' ? 'bg-clay text-warmwhite' : 'bg-clay/10 text-clay'}`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-sm text-indigo">
                          Mohalla Artisan <span className="font-indic text-xs text-clay">(कारीगर)</span>
                        </div>
                        <p className="text-xs text-indigo/70 leading-snug">
                          Open your digital shop & sell directly to neighbors.
                        </p>
                      </div>
                      {roleSelection === 'SELLER' && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-clay text-warmwhite flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields: Step 1 (Account Info) */}
            {(mode === 'login' || sellerStep === 1) && (
              <div className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-indigo/80">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-4 py-3 rounded-xl border border-clay/20 bg-ivory/60 focus:bg-warmwhite focus:outline-none focus:border-clay text-sm text-indigo transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-indigo/80">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-clay/20 bg-ivory/60 focus:bg-warmwhite focus:outline-none focus:border-clay text-sm text-indigo transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-indigo/80">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-clay/20 bg-ivory/60 focus:bg-warmwhite focus:outline-none focus:border-clay text-sm text-indigo transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo/40 hover:text-indigo transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {mode === 'register' && password && (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-indigo/60">
                        <span>Password Strength:</span>
                        <span className="font-semibold text-indigo">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Fields: Step 2 (Seller Store Info) */}
            {mode === 'register' && roleSelection === 'SELLER' && sellerStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-clay/10 border border-clay/20 flex items-center gap-2.5 text-xs text-indigo">
                  <Sparkles className="w-4 h-4 text-clay shrink-0" />
                  <span>
                    Your shop profile will be reviewed by Mohalla Admin before opening for sales.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-indigo/80">Store / Workshop Name</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Royal Blue Pottery Works"
                    className="w-full px-4 py-3 rounded-xl border border-clay/20 bg-ivory/60 focus:bg-warmwhite focus:outline-none focus:border-clay text-sm text-indigo transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-indigo/80">Craft Category</label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-clay/20 bg-ivory/60 focus:bg-warmwhite focus:outline-none focus:border-clay text-sm text-indigo transition-all cursor-pointer"
                  >
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <LocationPicker
                    initialAddress={storeLocation}
                    initialLat={storeLatitude}
                    initialLng={storeLongitude}
                    label="Workshop / Store Address & Map Location"
                    helperText="Search your locality in India. Drag the terracotta pin to mark your workshop location on the Bazaar Map."
                    onLocationSelect={({ addressText, latitude, longitude }) => {
                      setStoreLocation(addressText);
                      setStoreLatitude(latitude);
                      setStoreLongitude(longitude);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-indigo/80">Workshop Bio / Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Describe your artisan legacy, techniques, or specialties..."
                    className="w-full px-4 py-2.5 rounded-xl border border-clay/20 bg-ivory/60 focus:bg-warmwhite focus:outline-none focus:border-clay text-sm text-indigo transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {mode === 'register' && roleSelection === 'SELLER' && sellerStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setSellerStep(1)}
                    className="px-4 py-3 rounded-xl bg-ivory hover:bg-clay/10 text-indigo border border-clay/20 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-clay hover:bg-clay/90 text-warmwhite font-bold text-sm shadow-warm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-warmwhite border-t-transparent rounded-full animate-spin" />
                  ) : mode === 'login' ? (
                    <>
                      <span>Sign In to Mohalla</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : roleSelection === 'SELLER' && sellerStep === 1 ? (
                    <>
                      <span>Continue to Store Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : roleSelection === 'SELLER' && sellerStep === 2 ? (
                    <>
                      <span>Submit Store Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Complete Buyer Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Google OAuth (only for login or step 1) */}
              {(mode === 'login' || sellerStep === 1) && (
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleSubmitting || isSubmitting}
                  className="w-full py-3 px-4 rounded-xl border border-clay/20 bg-warmwhite hover:bg-ivory text-xs font-bold text-indigo transition-all flex items-center justify-center gap-3 shadow-warm-sm disabled:opacity-50 cursor-pointer"
                >
                  {isGoogleSubmitting ? (
                    <div className="w-4 h-4 border-2 border-clay border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {mode === 'login'
                          ? 'Continue with Google'
                          : `Join as ${roleSelection === 'SELLER' ? 'Artisan' : 'Buyer'} with Google`}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
