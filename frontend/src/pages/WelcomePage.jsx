import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Store, 
  ArrowRight, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  LogIn, 
  MessageSquareText, 
  PackageCheck,
  Coins,
  Lock,
  Star,
  Users,
  Quote,
  MapPin,
  ChevronDown,
  ChevronUp,
  Heart,
  Truck,
  BadgeCheck,
  Handshake,
  Mail,
  Globe,
  TrendingUp,
  Clock,
  Award,
  Zap,
  ShoppingBag,
  Search,
  Bookmark,
  Share2,
  HelpCircle,
  Shield,
  KeyRound,
  Fingerprint,
  Smartphone,
  Wifi,
  BarChart3,
  Banknote,
  Layers,
  CreditCard,
  Eye,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ScrollScrubHero from '../components/ScrollScrubHero';
import WelcomeFooter from '../components/WelcomeFooter';

/* ─── Navigation Links ───────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'Categories', href: '#categories' },
  { label: 'OTP Safety', href: '#otp-safety' },
  { label: 'For Sellers', href: '#sellers' },
  { label: 'Trust & Safety', href: '#trust' },
  { label: 'Stories', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

/* ─── Data: Categories ───────────────────────────────────────── */
const CATEGORIES = [
  {
    name: 'Woodwork & Carving',
    nameHi: 'काठ का काम',
    description: 'Saharanpur Sheesham woodcarvings, furniture, and decorative items handcrafted by skilled artisans.',
    icon: '🪵',
    items: ['Sheesham Wood Carvings', 'Decorative Furniture', 'Kitchen Utensils', 'Temple Fixtures'],
  },
  {
    name: 'Textiles & Block Prints',
    nameHi: 'कपड़ा और ब्लॉक प्रिंट',
    description: 'Jaipur block prints, handloom fabrics, and traditional embroidery directly from master weavers.',
    icon: '🧵',
    items: ['Block Print Suits', 'Handloom Sarees', 'Embroidered Dupattas', 'Cotton Bedsheets'],
  },
  {
    name: 'Spices & Organic Produce',
    nameHi: 'मसाले और जैविक उत्पाद',
    description: 'Kerala spice growers, organic farms, and local producers offering pure, unadulterated goods.',
    icon: '🌿',
    items: ['Turmeric Powder', 'Cardamom', 'Black Pepper', 'Organic Jaggery'],
  },
  {
    name: 'Brassware & Metal Craft',
    nameHi: 'पीतल और धातु शिल्प',
    description: 'Moradabad brassware, copper vessels, and decorative metalwork from generations-old workshops.',
    icon: '🪙',
    items: ['Brass Pooja Thali', 'Copper Lota', 'Decorative Vases', 'Measuring Cups'],
  },
  {
    name: 'Pottery & Ceramics',
    nameHi: 'मिट्टी के बर्तन',
    description: 'Blue pottery from Jaipur, terracotta works, and hand-thrown pottery from traditional kilns.',
    icon: '🏺',
    items: ['Blue Pottery Plates', 'Terracotta Pots', 'Decorative Vases', 'Cooking Vessels'],
  },
  {
    name: 'Jewelry & Accessories',
    nameHi: 'गहने और एक्सेसरीज',
    description: 'Kundan, Meenakari, and traditional silver jewelry from Rajasthan and Uttar Pradesh artisans.',
    icon: '💍',
    items: ['Kundan Necklace', 'Meenakari Earrings', 'Silver Anklets', 'Bangles'],
  },
  {
    name: 'Kirana & Groceries',
    nameHi: 'किराना और किराने का सामान',
    description: 'Your neighborhood kirana store essentials — fresh groceries, pulses, and daily needs delivered with care.',
    icon: '🏪',
    items: ['Basmati Rice', 'Toor Dal', 'Mustard Oil', 'Wheat Flour'],
  },
  {
    name: 'Art & Decor',
    nameHi: 'कला और सजावट',
    description: 'Madhubani paintings, Warli art, Pattachitra, and handcrafted home decor from folk artists.',
    icon: '🎨',
    items: ['Madhubani Canvas', 'Warli Wall Art', 'Pattachitra Scroll', 'Hand-painted Plates'],
  },
];

/* ─── Data: FAQ ──────────────────────────────────────────────── */
const FAQ_DATA = [
  {
    question: 'What is LocalConnect and how does it work?',
    questionHi: 'LocalConnect क्या है और यह कैसे काम करता है?',
    answer: 'LocalConnect is a neighborhood marketplace that connects local artisans, kirana stores, and small businesses directly with buyers in their community. Simply browse verified sellers near you, place an order, and receive OTP-secured delivery at your doorstep. No middlemen, no high commissions — just direct trust-based commerce.',
  },
  {
    question: 'How does OTP-secured delivery work?',
    questionHi: 'OTP-सुरक्षित डिलीवरी कैसे काम करती है?',
    answer: 'When you place an order, a unique 6-digit OTP is generated and sent to your registered email and phone. When the seller or delivery person arrives, you share this OTP with them. They enter it into the LocalConnect app to confirm delivery. This ensures the right person receives the right package — protecting both buyer and seller from fraud.',
  },
  {
    question: 'Is LocalConnect free for buyers?',
    questionHi: 'क्या LocalConnect खरीदारों के लिए मुफ्त है?',
    answer: 'Yes! LocalConnect is completely free for buyers. There are no hidden charges, membership fees, or delivery surcharges. You pay only for the products you purchase, and 100% of your payment goes directly to the local artisan or seller.',
  },
  {
    question: 'How do sellers get verified?',
    questionHi: 'विक्रेता कैसे सत्यापित होते हैं?',
    answer: 'Every seller undergoes a strict identity verification process administered by our team. This includes document verification, shop/workshop validation, and quality checks. Once approved, sellers receive the "Verified Mohalla Seller" badge, which builds trust with buyers in the community.',
  },
  {
    question: 'What payment methods are accepted?',
    questionHi: 'कौन से भुगतान विधियाँ स्वीकार की जाती हैं?',
    answer: 'LocalConnect supports UPI payments (Google Pay, PhonePe, Paytm), debit cards, credit cards, and net banking. All transactions are secured with bank-grade encryption. Cash on delivery may also be available depending on the seller.',
  },
  {
    question: 'Can I return products if I am not satisfied?',
    questionHi: 'क्या मैं असंतुष्ट होने पर उत्पाद वापस कर सकता हूँ?',
    answer: 'Yes, LocalConnect has a buyer protection policy. If you receive a damaged or incorrect product, you can raise a return request within 7 days of delivery. Our support team will mediate between you and the seller to ensure a fair resolution.',
  },
  {
    question: 'How do I become a seller on LocalConnect?',
    questionHi: 'मैं LocalConnect पर विक्रेता कैसे बनूँ?',
    answer: 'Click "Get Started" and select the Seller registration option. Fill in your shop details, upload your identity documents, and submit your application. Our team will review your submission within 48 hours. Once verified, you receive the Verified Mohalla Seller badge and can start listing products immediately.',
  },
  {
    question: 'Are the products authentic and genuine?',
    questionHi: 'क्या उत्पाद प्रामाणिक और असली हैं?',
    answer: 'Absolutely. Every seller on LocalConnect is verified by our admin team before listing products. We cross-check artisan credentials, workshop locations, and product quality. Community reviews further ensure authenticity — real neighbors reviewing real products.',
  },
  {
    question: 'What areas does LocalConnect serve?',
    questionHi: 'LocalConnect किन क्षेत्रों में सेवा प्रदान करता है?',
    answer: 'LocalConnect currently operates in major cities across India including Delhi NCR, Jaipur, Saharanpur, Amritsar, Bengaluru, Mumbai, and is rapidly expanding to tier-2 and tier-3 cities. Our goal is to cover every mohalla in India.',
  },
  {
    question: 'How does LocalConnect support local communities?',
    questionHi: 'LocalConnect स्थानीय समुदायों का समर्थन कैसे करता है?',
    answer: 'By connecting buyers directly with local sellers, every transaction keeps money circulating within the neighborhood ecosystem. There are no corporate markups or aggregator commissions draining wealth from communities. This creates jobs, preserves traditional crafts, and strengthens neighborhood bonds.',
  },
];

/* ─── Animated Counter Component ─────────────────────────────── */
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const increment = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 16);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Accordion Item Component ───────────────────────────────── */
function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-clay/15 rounded-2xl overflow-hidden bg-warmwhite shadow-warm transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-clay/5 transition-colors"
      >
        <div className="flex items-start gap-3">
          <HelpCircle className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${isOpen ? 'text-clay' : 'text-indigo/40'}`} />
          <div>
            <h3 className="font-display text-base sm:text-lg text-indigo">{item.question}</h3>
            <p className="text-xs text-indigo/50 font-indic mt-0.5">{item.questionHi}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-clay shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-indigo/40 shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 pt-0 pl-12">
              <p className="text-sm text-indigo/75 leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Rocket SVG Icon ────────────────────────────────────────── */
function RocketIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN WELCOME PAGE COMPONENT                                   */
/* ═══════════════════════════════════════════════════════════════ */
export default function WelcomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  /* Scroll-spy for nav */
  useEffect(() => {
    const observers = [];
    NAV_LINKS.forEach(({ href }) => {
      const id = href.replace('#', '');
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-20% 0px -60% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleAnchorClick = useCallback((e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleGetStarted = () => {
    sessionStorage.setItem('hasSeenWelcome', 'true');
    navigate('/login?mode=register');
  };

  const handleExploreGuest = () => {
    sessionStorage.setItem('hasSeenWelcome', 'true');
    navigate('/');
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim() && emailInput.includes('@')) {
      setIsSubscribed(true);
      setEmailInput('');
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-ivory text-indigo flex flex-col">

      {/* ═══════════════════════════════════════════════════════════
          Sticky Anchor Nav Header
          ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-ivory/90 backdrop-blur-md border-b border-clay/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 shrink-0 group"
          >
            <img
              src="/logo.png"
              alt="LocalConnect"
              className="w-9 h-9 rounded-xl object-cover shadow-warm border border-clay/20 transition-transform group-hover:scale-105 shrink-0 bg-white"
            />
            <div className="hidden sm:block">
              <span className="font-display text-xl text-indigo tracking-tight">LocalConnect</span>
              <span className="block text-[10px] uppercase font-semibold text-clay -mt-1 tracking-widest">
                Mohalla Marketplace
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const sectionId = href.replace('#', '');
              const isActive = activeSection === sectionId;
              return (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => handleAnchorClick(e, href)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-clay/10 text-clay font-bold'
                      : 'text-indigo/70 hover:bg-clay/5 hover:text-indigo'
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          <Link
            to="/login"
            className="shrink-0 px-4 py-2 rounded-xl bg-clay text-warmwhite font-medium text-xs sm:text-sm hover:bg-saffron transition-all shadow-warm flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          Main Content Container
          ═══════════════════════════════════════════════════════════ */}
      <main
        id="top"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12 md:space-y-16"
      >

        {/* ── 1. Hero Card ──────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative rounded-3xl bg-indigo text-warmwhite p-8 sm:p-12 md:p-16 overflow-hidden jali-bg foil-border-indigo shadow-indigo"
        >
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-clay/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-marigold/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-warmwhite/10 text-marigold text-xs font-semibold backdrop-blur-md border border-marigold/20">
                <Sparkles className="w-4 h-4 text-marigold shrink-0" />
                <span>Social Commerce for Local Sellers & Neighborhoods</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="font-display text-4xl sm:text-5xl md:text-6xl text-warmwhite leading-tight">
                आपका मोहल्ला, आपकी दुकान — Local Artisan Heritage in Your Pocket
              </motion.h1>

              <motion.p variants={itemVariants} className="font-body text-base sm:text-lg text-warmwhite/85 leading-relaxed max-w-2xl">
                Discover Saharanpur woodworkers, Jaipur block printers, and Kerala spice growers right in your city. Direct connections, zero corporate markups, and OTP-secured neighborhood delivery.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={handleGetStarted}
                  className="px-7 py-3.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-display text-lg transition-all shadow-warm flex items-center justify-center gap-2 group"
                >
                  Get Started <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={handleExploreGuest}
                  className="px-7 py-3.5 rounded-xl bg-warmwhite/10 hover:bg-warmwhite/20 text-warmwhite font-medium text-sm border border-warmwhite/20 transition-all flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 text-marigold" /> Explore as Guest
                </button>
              </motion.div>
            </div>

            {/* Official Logo Showcase Emblem */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl bg-warmwhite/5 backdrop-blur-md border border-warmwhite/10 shadow-2xl text-center space-y-3"
            >
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-clay via-marigold to-neem rounded-full blur-md opacity-50 group-hover:opacity-80 transition duration-500"></div>
                <img
                  src="/logo.png"
                  alt="Official LocalConnect Logo"
                  className="relative w-48 h-48 rounded-full object-cover shadow-2xl ring-4 ring-marigold/40 bg-white"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] uppercase font-mono tracking-widest text-marigold font-bold block">
                  Official Community Emblem
                </span>
                <p className="text-xs text-warmwhite/70">
                  Trust &bull; Heritage &bull; Direct Mohalla Commerce
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
        {/* ── 3. What is LocalConnect — 3-Part Explainer ─────── */}
        <div className="space-y-6">
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">What is LocalConnect</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">
              Commerce Built on Neighborhood Trust
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Card 1: For Buyers */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7 bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-clay/10 text-clay flex items-center justify-center border border-clay/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-clay uppercase tracking-wider">For Buyers & Families</span>
                  <h3 className="font-display text-2xl text-indigo mt-1">Authentic Crafts & Fair Prices</h3>
                </div>
                <p className="text-sm text-indigo/75 leading-relaxed">
                  Browse genuine handcrafted items like Saharanpur Sheesham woodcarvings and Moradabad brassware directly from artisan workshops. Read verified neighbour reviews and receive every delivery protected by a 6-digit OTP.
                </p>
              </div>
              <div className="pt-2 border-t border-clay/10 flex items-center gap-2 text-xs font-semibold text-neem">
                <CheckCircle2 className="w-4 h-4" /> Verified Artisan Direct
              </div>
            </motion.div>

            {/* Card 2: For Sellers */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-5 bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-marigold/15 text-indigo flex items-center justify-center border border-marigold/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-marigold uppercase tracking-wider">For Mohalla Sellers</span>
                  <h3 className="font-display text-2xl text-indigo mt-1">Low Platform Fees</h3>
                </div>
                <p className="text-sm text-indigo/75 leading-relaxed">
                  List your products without losing high commission fees to mega-aggregators. Connect directly with nearby buyers who value your craft and store legacy.
                </p>
              </div>
              <div className="pt-2 border-t border-clay/10 flex items-center gap-2 text-xs font-semibold text-clay">
                <Store className="w-4 h-4" /> Admin-Verified Seller Badge
              </div>
            </motion.div>

            {/* Card 3: For the Mohalla */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:col-span-12 bg-ivory border border-clay/20 rounded-3xl p-6 sm:p-8 shadow-warm jali-bg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4 max-w-2xl">
                <div className="w-12 h-12 rounded-2xl bg-neem/15 text-neem flex items-center justify-center shrink-0 border border-neem/30 mt-1 sm:mt-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-neem uppercase tracking-wider">For the Mohalla Community</span>
                  <h3 className="font-display text-xl sm:text-2xl text-indigo">Circulate Prosperity Locally</h3>
                  <p className="text-sm text-indigo/75 leading-relaxed">
                    Every transaction keeps resources circulating within your neighborhood ecosystem instead of extracting capital into distant warehouses.
                  </p>
                </div>
              </div>
              <div className="shrink-0 px-4 py-2 rounded-xl bg-neem/10 text-neem font-indic font-semibold text-sm border border-neem/20">
                अपना मोहल्ला, सशक्त समाज
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── 4. Browse by Category ──────────────────────────── */}
        <motion.div
          id="categories"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">Marketplace</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">Browse by Category</h2>
            <p className="text-sm text-indigo/60 mt-1 max-w-xl">
              From handcrafted woodwork to organic spices — discover India's finest artisan traditions organized for easy browsing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map((category, i) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="group bg-warmwhite rounded-3xl p-5 border border-clay/15 shadow-warm jali-bg hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{category.icon}</span>
                    
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-indigo group-hover:text-clay transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-[11px] text-indigo/50 font-indic">{category.nameHi}</p>
                  </div>
                  <p className="text-xs text-indigo/70 leading-relaxed line-clamp-3">{category.description}</p>
                </div>
                <div className="pt-2 border-t border-clay/10">
                  <div className="flex flex-wrap gap-1.5">
                    {category.items.slice(0, 3).map((item) => (
                      <span key={item} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-ivory text-indigo/60 border border-clay/10">
                        {item}
                      </span>
                    ))}
                    {category.items.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-clay/10 text-clay">
                        +{category.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleExploreGuest}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo text-warmwhite font-display text-sm hover:bg-deepdark transition-all shadow-indigo group"
            >
              <Search className="w-4 h-4" /> Explore All Categories
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* ── 5. Why LocalConnect — 4 Value Props ────────────── */}
        <motion.div
          id="why-us"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">Why LocalConnect</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">
              इंसानियत और व्यापार — Why Neighborhood Commerce Wins
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Coins, title: 'Minimal Markup', desc: 'Eliminate middleman fees and high aggregator commissions. Payments support local artisans and neighborhood shops.', tag: 'Direct Pricing', tagColor: 'text-clay' },
              { icon: Lock, title: 'Secure Delivery', desc: 'Each order generates a 6‑digit OTP for delivery verification.', tag: 'Secure Delivery', tagColor: 'text-neem' },
              { icon: CheckCircle2, title: 'Verified Artisan Badges', desc: 'Identity checks verify workshops and stores before listing, ensuring authentic crafts and verified local sellers.', tag: 'Verified • Authentic', tagColor: 'text-marigold' },
              { icon: Users, title: 'Direct Connection', desc: 'Connect directly with local weavers, woodcarvers, and grocers in your city.', tag: 'Community • Connection', tagColor: 'text-indigo' },
            ].map((vp, i) => {
              const Icon = vp.icon;
              const borderColors = ['border-clay/20', 'border-neem/25', 'border-marigold/30', 'border-indigo/20'];
              const bgColors = ['bg-clay/10 text-clay', 'bg-neem/15 text-neem', 'bg-marigold/15 text-indigo', 'bg-indigo/10 text-indigo'];
              return (
                <div key={i} className="bg-warmwhite rounded-3xl p-6 border border-clay/15 shadow-warm jali-bg space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-2xl ${bgColors[i]} flex items-center justify-center border ${borderColors[i]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-xl text-indigo">{vp.title}</h3>
                    <p className="text-xs text-indigo/75 leading-relaxed">{vp.desc}</p>
                  </div>
                  <span className={`text-[11px] font-semibold ${vp.tagColor} uppercase tracking-wider`}>{vp.tag}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 6. Comparison Table ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">The Difference</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">
              LocalConnect vs Traditional Platforms
            </h2>
          </div>

          <div className="bg-warmwhite foil-border rounded-3xl overflow-hidden shadow-warm jali-bg">
            <div className="grid grid-cols-3 gap-0 border-b border-clay/15">
              <div className="p-4 sm:p-5 text-xs font-semibold text-indigo/50 uppercase tracking-wider">Feature</div>
              <div className="p-4 sm:p-5 text-center bg-clay/5 border-l border-clay/15">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clay text-warmwhite text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> LocalConnect
                </span>
              </div>
              <div className="p-4 sm:p-5 text-center border-l border-clay/15">
                <span className="text-xs font-semibold text-indigo/50">Traditional Platforms</span>
              </div>
            </div>

            {[
              { feature: 'Commission Fees', local: '0% — Zero commission', traditional: '15-35% platform commission' },
              { feature: 'Seller Verification', local: 'Admin-verified identity & workshop', traditional: 'Basic KYC only' },
              { feature: 'Delivery Security', local: '6-digit OTP at doorstep', traditional: 'Photo proof only' },
              { feature: 'Payment to Seller', local: 'Instant after OTP confirmation', traditional: '7-15 day settlement' },
              { feature: 'Buyer Reviews', local: 'Verified neighbor reviews', traditional: 'Any registered user' },
              { feature: 'Customer Support', local: 'Direct artisan communication', traditional: 'Automated ticket system' },
              { feature: 'Product Authenticity', local: 'Workshop-verified genuine crafts', traditional: 'Mixed quality, unverified' },
              { feature: 'Community Impact', local: '100% local wealth circulation', traditional: 'Corporate extraction' },
            ].map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 gap-0 ${i % 2 === 0 ? 'bg-warmwhite' : 'bg-ivory/50'} ${i < 7 ? 'border-b border-clay/10' : ''}`}
              >
                <div className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-indigo flex items-center">{row.feature}</div>
                <div className="p-4 sm:p-5 text-xs sm:text-sm text-neem font-medium flex items-center justify-center border-l border-clay/15 bg-neem/5">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />{row.local}
                </div>
                <div className="p-4 sm:p-5 text-xs sm:text-sm text-saffron/70 flex items-center justify-center border-l border-clay/15">
                  <span className="w-4 h-4 mr-1.5 shrink-0 text-center leading-4">✗</span>{row.traditional}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 7. How It Works — 4-Step Buyer Journey ─────────── */}
        <motion.div
          id="how-it-works"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">Buyer Journey</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: 1, icon: Compass, title: 'Discover', desc: 'Browse verified local sellers and real product listings by category — woodwork, textiles, spices, brassware — near you.', color: 'clay' },
              { step: 2, icon: PackageCheck, title: 'Order', desc: 'Choose normal or bulk quantity, add to your basket, and checkout with a clear order summary.', color: 'marigold' },
              { step: 3, icon: ShieldCheck, title: 'OTP-Verified Delivery', desc: 'When your order ships, you receive a private 6-digit OTP by email. Share it with the seller only at the moment of actual delivery.', color: 'neem' },
              { step: 4, icon: CheckCircle2, title: 'Confirmed', desc: 'The seller enters your OTP to mark the order delivered — proof the right person received the right order, protecting both sides.', color: 'indigo' },
            ].map((item, i) => {
              const Icon = item.icon;
              const colorMap = {
                clay: 'bg-clay/10 text-clay border-clay/20',
                marigold: 'bg-marigold/10 text-marigold border-marigold/25',
                neem: 'bg-neem/10 text-neem border-neem/25',
                indigo: 'bg-indigo/5 text-indigo border-indigo/15',
              };
              const numBg = {
                clay: 'bg-clay text-warmwhite',
                marigold: 'bg-marigold text-warmwhite',
                neem: 'bg-neem text-warmwhite',
                indigo: 'bg-indigo text-warmwhite',
              };
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                  className="relative bg-warmwhite rounded-2xl p-5 sm:p-6 border border-clay/15 shadow-warm space-y-4"
                >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${numBg[item.color]} flex items-center justify-center font-display text-sm shrink-0`}>
                        {item.step}
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${colorMap[item.color]} flex items-center justify-center border shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-indigo">{item.title}</h3>
                      <p className="text-xs text-indigo/70 leading-relaxed mt-1">{item.desc}</p>
                    </div>
                </motion.div>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center justify-center -mt-1">
            <svg width="80%" height="24" viewBox="0 0 800 24" fill="none" className="text-clay/30">
              <path d="M0 12 Q200 4 400 12 T800 12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>

        {/* ── 8. First Order Timeline ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 md:p-10 shadow-warm jali-bg space-y-8"
        >
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">Step by Step</span>
            <h2 className="font-display text-2xl md:text-3xl text-indigo">Your First Order in 5 Minutes</h2>
            <p className="text-sm text-indigo/60 max-w-lg mx-auto">
              From browsing to doorstep delivery — here is exactly what happens when you place your first order on LocalConnect.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-clay/15" />

            <div className="space-y-6 md:space-y-0">
              {[
                { time: '0:00', title: 'Open LocalConnect', desc: 'Visit the marketplace and browse verified sellers in your neighborhood. Use category filters to find exactly what you need.', icon: Smartphone, color: 'clay' },
                { time: '0:30', title: 'Find Your Artisan', desc: 'Read community reviews, check the seller\'s verified badge, and explore their product catalog with detailed photos and descriptions.', icon: Eye, color: 'marigold' },
                { time: '1:00', title: 'Add to Basket', desc: 'Select your items, choose quantity, and add to your basket. See the total with zero hidden charges — what you see is what you pay.', icon: ShoppingBag, color: 'neem' },
                { time: '2:00', title: 'Secure Checkout', desc: 'Pay via UPI, card, or net banking. Your payment is held securely in escrow until you confirm delivery with your OTP.', icon: CreditCard, color: 'indigo' },
                { time: '2:30', title: 'OTP Generated', desc: 'A unique 6-digit OTP is sent to your email and phone. Keep it confidential — you will share it only when the delivery arrives.', icon: KeyRound, color: 'clay' },
                { time: '3:00–5:00', title: 'Doorstep Delivery', desc: 'Your local artisan or neighborhood courier arrives with your order. Inspect the product, then share your OTP to confirm receipt.', icon: Truck, color: 'marigold' },
              ].map((step, i) => {
                const Icon = step.icon;
                const colorBg = {
                  clay: 'bg-clay text-warmwhite',
                  marigold: 'bg-marigold text-warmwhite',
                  neem: 'bg-neem text-warmwhite',
                  indigo: 'bg-indigo text-warmwhite',
                };
                return (
                  <motion.div
                    key={step.time}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="relative flex items-start gap-4 md:ml-16"
                  >
                    <div className={`hidden md:flex absolute -left-16 w-8 h-8 rounded-full ${colorBg[step.color]} items-center justify-center z-10 shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-ivory rounded-2xl p-4 border border-clay/10 hover:border-clay/25 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-clay bg-clay/10 px-2 py-0.5 rounded-full">{step.time}</span>
                        <span className="font-display text-sm text-indigo">{step.title}</span>
                      </div>
                      <p className="text-xs text-indigo/70 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── 9. OTP Verification Explainer ──────────────────── */}
        <motion.div
          id="otp-safety"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-indigo text-warmwhite p-6 sm:p-10 md:p-12 overflow-hidden jali-bg foil-border-indigo shadow-indigo space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-warmwhite/15 pb-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warmwhite/10 text-marigold text-xs font-semibold border border-marigold/20">
                <ShieldCheck className="w-4 h-4 text-marigold" /> Security Protocol
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-warmwhite">
                How 6-Digit OTP Delivery Protects You
              </h2>
              <p className="text-sm text-warmwhite/80 leading-relaxed">
                No missing packages, no courier disputes. Physical handoffs are verified in real time on the doorstep.
              </p>
            </div>
            <div className="shrink-0 px-4 py-2 rounded-xl bg-warmwhite/10 text-marigold font-mono text-sm font-bold border border-marigold/30 self-start md:self-auto">
              OTP: [ 8 4 9 2 0 1 ]
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, bg: 'bg-marigold', title: 'Order & Private Code', desc: 'When your order is placed, a unique 6-digit OTP is generated and sent directly to your registered email & phone notification.' },
              { step: 2, bg: 'bg-clay', title: 'Artisan Delivery Handoff', desc: 'The seller or neighborhood courier arrives with your packaged artisan goods. Keep your 6-digit OTP confidential until you inspect the parcel.' },
              { step: 3, bg: 'bg-neem', title: 'Instant Handoff Verification', desc: 'Share your OTP at the door. The seller enters it into the LocalConnect app to confirm delivery — funds instantly transfer to the artisan.' },
            ].map((item) => (
              <div key={item.step} className="bg-warmwhite/10 backdrop-blur-md rounded-2xl p-6 border border-warmwhite/15 space-y-3">
                <div className={`w-10 h-10 rounded-xl ${item.bg} text-warmwhite flex items-center justify-center font-display text-lg shadow-md`}>
                  {item.step}
                </div>
                <h3 className="font-display text-xl text-warmwhite">{item.title}</h3>
                <p className="text-xs text-warmwhite/80 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-warmwhite/10">
            {[
              { icon: Fingerprint, label: 'Unique per order', desc: 'Every order gets a new OTP' },
              { icon: Clock, label: 'Time-limited', desc: 'Expires after 30 minutes' },
              { icon: Shield, label: 'End-to-end', desc: 'Never shared with third parties' },
              { icon: Zap, label: 'Instant verify', desc: 'Real-time confirmation' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center space-y-2">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-warmwhite/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-marigold" />
                  </div>
                  <p className="text-[11px] font-semibold text-warmwhite">{item.label}</p>
                  <p className="text-[10px] text-warmwhite/60">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 10. ScrollScrubHero Interactive Storyline ──────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">Interactive Storyline</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">The Journey of a Mohalla Order</h2>
            <p className="text-sm text-indigo/70 mt-1 max-w-xl">
              Scroll down to watch how local craft turns into neighborhood trust — from kirana workshop to OTP delivery.
            </p>
          </div>
          <ScrollScrubHero scrollHeightVh={180} />
        </motion.div>

        {/* ── 11. For Sellers — Expanded Card ────────────────── */}
        <motion.div
          id="sellers"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg space-y-6"
        >
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-14 h-14 rounded-2xl bg-marigold/15 text-indigo flex items-center justify-center border border-marigold/30 shrink-0">
                <Store className="w-7 h-7" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <span className="text-xs font-semibold text-marigold uppercase tracking-wider">For Mohalla Sellers</span>
                  <h3 className="font-display text-2xl md:text-3xl text-indigo mt-1">Run Your Shop From Your Phone</h3>
                </div>
                <p className="text-sm text-indigo/75 leading-relaxed max-w-2xl">
                  Register as a seller, set up your storefront, and reach buyers in your neighbourhood who are actively looking for local products. Your store starts with a "Pending Review" status — once our team verifies your identity, you receive the "Verified Mohalla Seller" badge and your listings go live to buyers.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-marigold/10 text-marigold border border-marigold/25">
                    <Store className="w-3.5 h-3.5" /> Admin-Verified Badge
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neem/10 text-neem border border-neem/25">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full Store Visibility
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-clay/10 pt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-clay/10 text-clay flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-xs text-indigo/70 leading-relaxed">
                <span className="font-semibold text-indigo">Seller Dashboard:</span> manage orders, dispatch with OTP generation, and track delivery status — all from a single screen. No commission cuts, no hidden fees.
              </p>
            </div>
        </motion.div>

        {/* ── 12. Seller Success Features ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-marigold pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-marigold">Seller Toolkit</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">Everything You Need to Sell Locally</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track your store views, order trends, and customer demographics. Understand what sells best in your neighborhood and optimize your inventory.', color: 'clay' },
              { icon: MessageSquareText, title: 'Direct Buyer Chat', desc: 'Communicate directly with buyers for custom orders, size queries, and build relationships that turn one-time buyers into loyal neighborhood customers.', color: 'marigold' },
              { icon: TrendingUp, title: 'Growth Dashboard', desc: 'Monitor your revenue, track pending payments, and see your seller rating grow. Get insights on peak ordering times and seasonal demand.', color: 'neem' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              const colorBg = {
                clay: 'bg-clay/10 text-clay border-clay/20',
                marigold: 'bg-marigold/10 text-marigold border-marigold/25',
                neem: 'bg-neem/10 text-neem border-neem/25',
              };
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-warmwhite rounded-2xl p-6 border border-clay/15 shadow-warm jali-bg space-y-4"
                >
                  <div className={`w-12 h-12 rounded-2xl ${colorBg[feature.color]} flex items-center justify-center border`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg text-indigo">{feature.title}</h3>
                  <p className="text-xs text-indigo/75 leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="bg-ivory border border-clay/20 rounded-3xl p-6 sm:p-8 space-y-5">
            <h3 className="font-display text-xl text-indigo text-center">Get Started as a Seller in 3 Simple Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { step: '01', title: 'Register Your Shop', desc: 'Fill in your shop details, upload your Aadhaar/PAN, and submit photos of your workshop or store.', icon: FileCheck },
                { step: '02', title: 'Admin Verification', desc: 'Our team reviews your application within 48 hours. We verify your identity, location, and product quality.', icon: UserCheck },
                { step: '03', title: 'Start Selling', desc: 'Once verified, list your products, set prices, and start receiving orders from your neighborhood.', icon: RocketIcon },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-clay text-warmwhite flex items-center justify-center font-display text-sm shrink-0 shadow-warm">
                      {item.step}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-sm text-indigo flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-clay" />{item.title}
                      </h4>
                      <p className="text-xs text-indigo/70 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── 13. Community Impact Section ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-indigo text-warmwhite p-6 sm:p-10 md:p-12 overflow-hidden jali-bg foil-border-indigo shadow-indigo space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warmwhite/10 text-marigold text-xs font-semibold border border-marigold/20">
              <Heart className="w-4 h-4 text-marigold" /> Social Impact
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-warmwhite">Strengthening Neighborhood Economies</h2>
            <p className="text-sm text-warmwhite/80 max-w-2xl mx-auto leading-relaxed">
              Every order on LocalConnect creates a ripple effect — supporting families, preserving heritage crafts, and keeping wealth circulating within communities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Banknote, title: 'Zero Commission Drain', desc: 'Money saved by sellers from platform commissions stays in local economies instead of corporate bank accounts.' },
              { icon: Award, title: 'Craft Preservation', desc: 'Traditional artisan techniques are documented and preserved through our heritage craft catalog initiative.' },
              { icon: Users, title: 'Job Creation', desc: 'We aim to generate direct and indirect employment opportunities for artisans, delivery partners, and support staff.' },
              { icon: Globe, title: 'Connecting Cities', desc: 'Building active LocalConnect communities across major Indian cities, fostering inter-city cultural exchange.' },
              { icon: Handshake, title: 'Trust-Based Orders', desc: 'Focusing on high order completion rates with zero disputes — proving that neighborhood trust beats corporate logistics.' },
              { icon: Star, title: 'Genuine Seller Ratings', desc: 'Ensuring average seller ratings across the platform are verified by real community buyers, not anonymous reviews.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-warmwhite/10 backdrop-blur-md rounded-2xl p-5 border border-warmwhite/15 space-y-3 flex flex-col items-center text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-marigold/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-marigold" />
                    </div>
                    <h3 className="font-display text-lg text-warmwhite text-center">{item.title}</h3>
                  </div>
                  <p className="text-xs text-warmwhite/75 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 14. Trust & Safety — 3 Cards ───────────────────── */}
        <motion.div
          id="trust"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">Why Trust Us</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">Trust & Safety</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-warmwhite rounded-2xl p-6 border border-clay/15 shadow-warm space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold badge-seller flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Verified Mohalla Seller
                </span>
              </div>
              <h3 className="font-display text-lg text-indigo">Strict Admin Approval</h3>
              <p className="text-xs text-indigo/75 leading-relaxed">
                Sellers undergo identity verification before receiving the Verified Mohalla badge and store listing permissions, keeping the marketplace secure.
              </p>
            </div>

            <div className="glass-indigo text-warmwhite rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-marigold text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" /> Delivery Protection
              </div>
              <h3 className="font-display text-lg text-warmwhite">6-Digit Delivery OTP</h3>
              <p className="text-xs text-warmwhite/80 leading-relaxed">
                Every order generates a private 6-digit OTP sent only to the buyer. Deliveries are marked complete only when you share the OTP with the courier.
              </p>
            </div>

            <div className="bg-warmwhite rounded-2xl p-6 border border-clay/15 shadow-warm space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo/5 text-indigo border border-indigo/15 flex items-center gap-1.5">
                  <MessageSquareText className="w-3.5 h-3.5" /> Community-Reviewed
                </span>
              </div>
              <h3 className="font-display text-lg text-indigo">Real Neighbour Reviews</h3>
              <p className="text-xs text-indigo/75 leading-relaxed">
                Real reviews from real neighbourhood buyers on every product — visible before you order, not just a star average with no context.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── 15. Trust Framework Deep-Dive ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg space-y-6">
            <div className="text-center space-y-2">
              <h3 className="font-display text-2xl text-indigo">Our Trust Framework</h3>
              <p className="text-sm text-indigo/60 max-w-lg mx-auto">
                Every layer of LocalConnect is designed to protect buyers and sellers, building a marketplace rooted in neighborhood trust.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  icon: BadgeCheck,
                  title: 'Seller Identity Verification',
                  items: ['Aadhaar/PAN card verification', 'Workshop/shop photo validation', 'Physical location confirmation', 'Product quality assessment', 'Background check for complaints'],
                  dotColor: 'bg-neem',
                },
                {
                  icon: KeyRound,
                  title: 'OTP Delivery Protection',
                  items: ['Unique 6-digit code per order', 'Sent to buyer email & phone', 'Expires after 30 minutes', 'Cannot be guessed or reused', 'Real-time verification at doorstep'],
                  dotColor: 'bg-marigold',
                },
                {
                  icon: MessageSquareText,
                  title: 'Community Review System',
                  items: ['Only verified buyers can review', 'Reviews linked to actual orders', 'Seller response capability', 'Dispute resolution process', 'Review authenticity checks'],
                  dotColor: 'bg-clay',
                },
                {
                  icon: Shield,
                  title: 'Payment Security',
                  items: ['Escrow until delivery confirmed', 'Bank-grade encryption', 'Instant seller settlement', 'Refund protection policy', 'No cash handling risks'],
                  dotColor: 'bg-indigo',
                },
              ].map((section, i) => {
                const Icon = section.icon;
                const iconBg = [
                  'bg-neem/10 text-neem border-neem/25',
                  'bg-marigold/10 text-marigold border-marigold/25',
                  'bg-clay/10 text-clay border-clay/25',
                  'bg-indigo/10 text-indigo border-indigo/15',
                ];
                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="bg-ivory rounded-2xl p-5 border border-clay/15 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${iconBg[i]} flex items-center justify-center border`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-base text-indigo">{section.title}</h4>
                    </div>
                    <ul className="space-y-2">
                      {section.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-indigo/75">
                          <span className={`w-1.5 h-1.5 rounded-full ${section.dotColor} mt-1.5 shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>


        {/* ── 18. Artisan Spotlight ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="w-14 h-14 rounded-2xl bg-clay/15 text-clay flex items-center justify-center border border-clay/30 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <span className="text-xs font-semibold text-clay uppercase tracking-wider">Artisan Spotlight</span>
                <h3 className="font-display text-2xl md:text-3xl text-indigo mt-1">Meet the Hands Behind Your Crafts</h3>
              </div>
              <p className="text-sm text-indigo/75 leading-relaxed max-w-2xl">
                Behind every handcrafted item is a story of dedication, tradition, and artistry passed down through generations. LocalConnect brings these stories to life, connecting you with the artisans who pour their heart into every creation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Gurdev Singh', craft: 'Wood Carving', location: 'Saharanpur, UP', years: '35 years', story: 'Third-generation woodcarver carrying forward a family legacy. Specializes in Sheesham wood furniture and decorative pieces. Joined LocalConnect to reach buyers who appreciate the patience and skill of traditional Indian woodcraft.', products: 'Furniture, Decorative Panels, Kitchen Items' },
              { name: 'Meena Devi', craft: 'Block Printing', location: 'Jaipur, Rajasthan', years: '22 years', story: 'Master block printer who learned the art from her grandmother. Creates intricate floral and geometric patterns on cotton and silk fabrics. LocalConnect helped her find buyers who value authentic Rajasthani handblock prints.', products: 'Suits, Sarees, Bedsheets, Dupattas' },
              { name: 'Joseph Thomas', craft: 'Spice Processing', location: 'Idukki, Kerala', years: '18 years', story: 'Organic spice farmer from the Western Ghats. Grows cardamom, pepper, and cinnamon without chemicals. LocalConnect\'s direct model means he gets fair prices while buyers get pure, unadulterated Kerala spices.', products: 'Cardamom, Black Pepper, Cinnamon, Cloves' },
            ].map((artisan) => (
              <div key={artisan.name} className="bg-ivory rounded-2xl p-5 border border-clay/15 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-clay/15 text-clay flex items-center justify-center font-display text-sm">
                    {artisan.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-display text-sm text-indigo">{artisan.name}</h4>
                    <span className="text-[10px] text-indigo/50">{artisan.craft} &bull; {artisan.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-clay/10 text-clay">{artisan.years}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neem/10 text-neem">Verified Artisan</span>
                </div>
                <p className="text-xs text-indigo/75 leading-relaxed">{artisan.story}</p>
                <div className="pt-2 border-t border-clay/10">
                  <span className="text-[10px] font-semibold text-indigo/50 uppercase tracking-wider">Products:</span>
                  <p className="text-[11px] text-indigo/70 mt-0.5">{artisan.products}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 19. FAQ Section ────────────────────────────────── */}
        <motion.div
          id="faq"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-clay pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay">Got Questions?</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">Frequently Asked Questions</h2>
            <p className="text-sm text-indigo/60 mt-1 max-w-xl">
              Everything you need to know about buying, selling, and building trust on LocalConnect.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_DATA.map((item, i) => (
              <AccordionItem key={i} item={item} isOpen={openFaq === i} onToggle={() => toggleFaq(i)} />
            ))}
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-indigo/60 mb-3">Still have questions?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={handleGetStarted} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-clay text-warmwhite font-medium text-sm hover:bg-saffron transition-all shadow-warm">
                <Mail className="w-4 h-4" /> Contact Support
              </button>
              <button onClick={handleExploreGuest} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-transparent text-indigo font-medium text-sm border border-clay/30 hover:bg-clay/5 transition-all">
                <MessageSquareText className="w-4 h-4" /> Join Community
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── 20. Savings & Benefits Visual ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-neem pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neem">Why Artisans Choose Us</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">The Numbers Speak for Themselves</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seller Savings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neem/15 text-neem flex items-center justify-center border border-neem/30">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-indigo">Seller Savings</h3>
                  <p className="text-xs text-indigo/60">What you keep vs what you lose on other platforms</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { platform: 'LocalConnect', commission: '0%', keep: '₹100', width: '100%', color: 'bg-neem' },
                  { platform: 'Platform B', commission: '25%', keep: '₹75', width: '75%', color: 'bg-marigold' },
                  { platform: 'Platform C', commission: '35%', keep: '₹65', width: '65%', color: 'bg-saffron' },
                ].map((item) => (
                  <div key={item.platform} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo">{item.platform}</span>
                      <span className="text-indigo/60">Commission: {item.commission}</span>
                    </div>
                    <div className="h-6 bg-ivory rounded-lg overflow-hidden border border-clay/10">
                      <div className={`h-full ${item.color} rounded-lg flex items-center justify-end pr-2 transition-all duration-1000`} style={{ width: item.width }}>
                        <span className="text-[10px] font-bold text-warmwhite">{item.keep}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-neem font-semibold text-center pt-2">
                On a ₹1,000 order, you save ₹350 more with LocalConnect
              </p>
            </motion.div>

            {/* Buyer Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-clay/15 text-clay flex items-center justify-center border border-clay/30">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-indigo">Buyer Benefits</h3>
                  <p className="text-xs text-indigo/60">What you get that other platforms cannot offer</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { benefit: 'Direct Artisan Connection', score: 100 },
                  { benefit: 'OTP Delivery Protection', score: 100 },
                  { benefit: 'Verified Seller Badges', score: 100 },
                  { benefit: 'Community Reviews', score: 95 },
                  { benefit: 'Zero Hidden Charges', score: 100 },
                  { benefit: 'Local Delivery Speed', score: 90 },
                ].map((item) => (
                  <div key={item.benefit} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo">{item.benefit}</span>
                      <span className="text-neem font-bold">{item.score}%</span>
                    </div>
                    <div className="h-2 bg-ivory rounded-full overflow-hidden border border-clay/10">
                      <div className="h-full bg-neem rounded-full transition-all duration-1000" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-clay font-semibold text-center pt-2">
                Trusted by 45,000+ successful neighborhood deliveries
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ── 21. Platform Features Grid ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-indigo text-warmwhite p-6 sm:p-10 overflow-hidden jali-bg foil-border-indigo shadow-indigo space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warmwhite/10 text-marigold text-xs font-semibold border border-marigold/20">
              <Layers className="w-4 h-4 text-marigold" /> Platform Features
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-warmwhite">Built for the Mohalla</h2>
            <p className="text-sm text-warmwhite/80 max-w-2xl mx-auto">
              Every feature of LocalConnect is designed with Indian neighborhoods in mind — from multi-language support to local delivery logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: 'Multi-Language Support', desc: 'Browse and transact in Hindi, English, and regional languages. The marketplace speaks your language.' },
              { icon: Smartphone, title: 'Mobile-First Design', desc: 'Optimized for smartphones — because most neighborhood buyers and sellers browse on mobile.' },
              { icon: Wifi, title: 'Low-Bandwidth Friendly', desc: 'Works smoothly even on 2G/3G connections. Image compression and lazy loading ensure fast page loads.' },
              { icon: Truck, title: 'Same-Day Local Delivery', desc: 'Neighborhood couriers deliver within hours, not days. Speed of local commerce with digital trust.' },
              { icon: Clock, title: 'Real-Time Notifications', desc: 'Get instant updates on orders, deliveries, and messages via push notifications and SMS.' },
              { icon: Bookmark, title: 'Save & Wishlist', desc: 'Bookmark favorite artisans and products. Get notified when they launch new collections.' },
              { icon: Share2, title: 'Share with Neighbors', desc: 'Share product links via WhatsApp and SMS to spread the word in your neighborhood group.' },
              { icon: BarChart3, title: 'Seller Analytics', desc: 'Track your store performance, top products, and customer insights on a clean dashboard.' },
              { icon: Shield, title: 'Dispute Resolution', desc: 'Fair mediation for any issues. Our support team ensures both buyers and sellers are protected.' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="bg-warmwhite/10 backdrop-blur-md rounded-2xl p-5 border border-warmwhite/15 space-y-2 hover:bg-warmwhite/15 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-marigold/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-marigold" />
                  </div>
                  <h3 className="font-display text-base text-warmwhite">{feature.title}</h3>
                  <p className="text-xs text-warmwhite/75 leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 22. Newsletter / Stay Connected ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg space-y-6"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-clay/10 text-clay flex items-center justify-center border border-clay/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl text-indigo">Stay Connected with Your Mohalla</h3>
                </div>
                <p className="text-sm text-indigo/70 leading-relaxed max-w-xl">
                  Get weekly updates on new artisans, seasonal collections, and community stories from your neighborhood marketplace. No spam — just local commerce that matters.
                </p>
              </div>

              <div className="w-full md:w-auto">
                {isSubscribed ? (
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neem/10 text-neem border border-neem/25">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold text-sm">You are subscribed!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="px-4 py-3 rounded-xl bg-ivory border border-clay/20 text-sm text-indigo placeholder:text-indigo/40 focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay/20 w-full sm:w-64"
                    />
                    <button type="submit" className="px-6 py-3 rounded-xl bg-clay text-warmwhite font-semibold text-sm hover:bg-saffron transition-all shadow-warm whitespace-nowrap">
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-clay/10">
              {['New artisan launches', 'Seasonal collections', 'Community impact stories', 'Seller tips & guides'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-ivory text-indigo/60 border border-clay/10">
                  <CheckCircle2 className="w-3 h-3 text-neem" /> {item}
                </span>
              ))}
            </div>
        </motion.div>

        {/* ── 23. Heritage Preservation Section ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-marigold pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-marigold">Preserving Heritage</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">
              Keeping Ancient Crafts Alive
            </h2>
            <p className="text-sm text-indigo/60 mt-1 max-w-xl">
              Every purchase on LocalConnect helps preserve centuries-old Indian artisan traditions that are slowly disappearing in the age of mass production.
            </p>
          </div>

          <div className="bg-warmwhite foil-border rounded-3xl p-6 sm:p-8 shadow-warm jali-bg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Text content */}
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-display text-xl text-indigo">The Crisis of Vanishing Crafts</h3>
                    <p className="text-sm text-indigo/75 leading-relaxed">
                      India has over 3,000 traditional craft forms, but nearly 40% are at risk of disappearing within a generation. Young artisans are leaving for factory jobs because traditional selling channels — melas, weekly markets, and word-of-mouth — cannot sustain livelihoods anymore.
                    </p>
                    <p className="text-sm text-indigo/75 leading-relaxed">
                      LocalConnect changes this equation by giving artisans digital storefronts, direct access to buyers, and the trust infrastructure needed to compete with mass-produced alternatives.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Sheesham Woodcarving', region: 'Saharanpur', artisans: 340, status: 'Thriving' },
                      { label: 'Handblock Printing', region: 'Jaipur', artisans: 520, status: 'Growing' },
                      { label: 'Brass Metalwork', region: 'Moradabad', artisans: 195, status: 'Reviving' },
                      { label: 'Blue Pottery', region: 'Jaipur', artisans: 165, status: 'Preserved' },
                    ].map((craft) => (
                      <div key={craft.label} className="flex items-center justify-between py-2 px-3 rounded-xl bg-ivory border border-clay/10">
                        <div>
                          <span className="text-xs font-semibold text-indigo">{craft.label}</span>
                          <span className="text-[10px] text-indigo/50 ml-2">{craft.region}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-indigo/60">{craft.artisans} artisans</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neem/10 text-neem">
                            {craft.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Impact cards */}
                <div className="space-y-4">
                  <h3 className="font-display text-xl text-indigo">Our Heritage Impact</h3>

                  {[
                    {
                      icon: Award,
                      title: 'Documenting 120+ Techniques',
                      desc: 'We have partnered with craft historians and senior artisans to video-record and document 120+ traditional techniques — from wood grain selection to natural dye preparation — ensuring knowledge survives even as masters age.',
                    },
                    {
                      icon: Users,
                      title: 'Next-Generation Training',
                      desc: 'Over 450 young apprentices (ages 16-25) have been connected with master artisans through our mentorship program, learning heritage skills while earning through LocalConnect sales.',
                    },
                    {
                      icon: Globe,
                      title: 'Global Market Access',
                      desc: 'Artisans who previously sold only at local melas now reach buyers in 28 cities. Some have even received international inquiries through our platform, opening new revenue streams.',
                    },
                    {
                      icon: Heart,
                      title: 'Fair Pricing Revolution',
                      desc: 'By cutting out middlemen, artisans earn 30-40% more per item compared to traditional wholesale channels. This income differential is what makes continuing craft viable versus factory work.',
                    },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.08 }}
                        className="bg-ivory rounded-2xl p-4 border border-clay/10 space-y-2 hover:border-clay/25 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-marigold/15 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-marigold" />
                          </div>
                          <h4 className="font-display text-sm text-indigo">{item.title}</h4>
                        </div>
                        <p className="text-xs text-indigo/70 leading-relaxed">{item.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom quote */}
            <div className="border-t border-clay/10 pt-5 text-center">
              <p className="font-display text-lg text-indigo italic">
                "हर हाथ में कला है, हर खरीदारी में विरासत — Every hand holds art, every purchase preserves heritage"
              </p>
              <p className="text-xs text-indigo/50 mt-2">— LocalConnect Heritage Initiative</p>
            </div>
        </motion.div>

        {/* ── 24. Payments, Shipping & Policies ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-l-4 border-indigo pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo">Practical Details</span>
            <h2 className="font-display text-3xl md:text-4xl text-indigo mt-0.5">Payments, Shipping & Policies</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: CreditCard,
                title: 'Payment Methods',
                items: ['UPI (Google Pay, PhonePe, Paytm)', 'Debit & Credit Cards', 'Net Banking', 'Wallets (Paytm, PhonePe)', 'Cash on Delivery (select sellers)'],
                iconBg: 'bg-clay/10 text-clay border-clay/20',
              },
              {
                icon: Truck,
                title: 'Shipping & Delivery',
                items: ['Same-day delivery in select areas', 'Standard delivery: 2-5 business days', 'OTP verification at doorstep', 'Real-time order tracking', 'Free delivery on orders above ₹500'],
                iconBg: 'bg-marigold/10 text-marigold border-marigold/25',
              },
              {
                icon: ShieldCheck,
                title: 'Buyer Protection',
                items: ['7-day return policy', 'Full refund for damaged items', 'Dispute resolution within 48 hours', 'Escrow payment protection', 'Direct seller communication'],
                iconBg: 'bg-neem/10 text-neem border-neem/25',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-warmwhite rounded-2xl p-6 border border-clay/15 shadow-warm space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center border`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-lg text-indigo">{card.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-indigo/75">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neem shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 24. Closing CTA Block ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-indigo text-warmwhite p-8 sm:p-12 md:p-16 overflow-hidden jali-bg foil-border-indigo shadow-indigo text-center space-y-8"
        >
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-clay/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-marigold/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warmwhite/10 text-marigold text-xs font-semibold backdrop-blur-md border border-marigold/20"
            >
              <Sparkles className="w-4 h-4 text-marigold" />
              <span>Join our growing community of verified artisans</span>
            </motion.div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-warmwhite leading-tight">
              Start Exploring Your Neighborhood Market
            </h2>
            <p className="text-sm sm:text-base text-warmwhite/80 leading-relaxed max-w-xl mx-auto">
              Join thousands of artisans and buyers building trust across local communities. Every order strengthens your neighborhood.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-display text-base transition-all shadow-warm flex items-center justify-center gap-2 group"
            >
              Get Started Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={handleExploreGuest}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-transparent hover:bg-warmwhite/10 text-warmwhite font-medium text-sm border border-warmwhite/20 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-marigold" /> Explore as Guest
            </button>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-warmwhite/10">
            {[
              { icon: ShieldCheck, label: 'OTP Protected' },
              { icon: BadgeCheck, label: 'Verified Sellers' },
              { icon: Coins, label: 'Zero Commission' },
              { icon: Users, label: 'Community Trusted' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-warmwhite/70">
                  <Icon className="w-3.5 h-3.5 text-marigold" />
                  {item.label}
                </span>
              );
            })}
          </div>

          {/* Trust logos row */}
          <div className="relative z-10 pt-6 border-t border-warmwhite/10">
            <p className="text-[10px] uppercase tracking-widest text-warmwhite/40 mb-4">Trusted by artisans in</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {['Saharanpur', 'Jaipur', 'Moradabad', 'Amritsar', 'Bengaluru', 'Kerala', 'Hyderabad', 'Mumbai', 'Kochi', 'Delhi NCR', 'Lucknow', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Indore', 'Nagpur', 'Bhopal'].map((city) => (
                <span key={city} className="text-xs text-warmwhite/50 font-display">{city}</span>
              ))}
            </div>
          </div>

          {/* Final reassurance */}
          <div className="relative z-10 pt-4">
            <p className="text-xs text-warmwhite/60 max-w-lg mx-auto leading-relaxed">
              LocalConnect is committed to keeping your neighborhood economy strong. Every transaction you make supports a local family, preserves a traditional craft, and strengthens the bonds that make communities resilient.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Standalone Welcome Page Footer */}
      <WelcomeFooter onAnchorClick={handleAnchorClick} />

      <Toast />
    </div>
  );
}
