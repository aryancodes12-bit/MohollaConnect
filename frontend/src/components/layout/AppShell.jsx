import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Users, 
  ShoppingBag, 
  LayoutDashboard, 
  User as UserIcon, 
  LogIn, 
  LogOut,
  Sparkles,
  ShieldCheck,
  Store,
  MapPin,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import Toast from '../Toast';
import ChatWidget from '../ChatWidget';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    showToast('You have been logged out successfully', 'info');
    navigate('/login');
  };

  const isSeller = user?.role === 'SELLER';
  const isPendingSeller = user?.role === 'PENDING_SELLER';
  const isAdmin = user?.role === 'ADMIN';

  // Mobile Bottom Tab Bar Links
  const navItems = [
    { label: 'Discover', path: '/', icon: Compass },
    { label: 'Bazaar Map', path: '/bazaar-map', icon: MapPin },
    ...(user ? [{ label: 'Community', path: '/community', icon: Users }] : []),
    ...(user
      ? isSeller || isPendingSeller || isAdmin
        ? [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }]
        : [{ label: 'Cart', path: '/cart', icon: ShoppingBag }]
      : []),
    user
      ? { label: 'Profile', path: '/profile', icon: UserIcon }
      : { label: 'Sign In', path: '/login', icon: LogIn },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-indigo pb-20 md:pb-0">
      {/* Top Desktop Navigation Header */}
      <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur-md border-b border-clay/15 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="LocalConnect"
              className="w-10 h-10 rounded-xl object-cover shadow-warm border border-clay/20 transition-transform group-hover:scale-105 shrink-0 bg-white"
            />
            <div>
              <span className="font-display text-2xl text-indigo tracking-tight">LocalConnect</span>
              <span className="block text-[10px] uppercase font-semibold text-clay -mt-1 tracking-widest">
                Mohalla Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                }`
              }
            >
              Discover
            </NavLink>
            <NavLink
              to="/bazaar-map"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                }`
              }
            >
              <MapPin className="w-3.5 h-3.5 text-clay" />
              Bazaar Map
            </NavLink>
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                }`
              }
            >
              Pricing
            </NavLink>
            {user && (
              <NavLink
                to="/community"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                  }`
                }
              >
                Community
              </NavLink>
            )}
            {user && (isSeller || isPendingSeller) && (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/dashboard/products"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                    }`
                  }
                >
                  Products
                </NavLink>
                <NavLink
                  to="/dashboard/store"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                    }`
                  }
                >
                  Store Settings
                </NavLink>
                <NavLink
                  to="/dashboard/analytics"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                      isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                    }`
                  }
                >
                  <TrendingUp className="w-3.5 h-3.5 text-clay" />
                  Analytics
                </NavLink>
              </>
            )}
            {user && (user.role === 'BUYER' || user.role === 'ADMIN') && (
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                  }`
                }
              >
                My Orders
              </NavLink>
            )}
            {user && (user.role === 'BUYER' || user.role === 'ADMIN') && (
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-clay/10 text-clay font-semibold' : 'text-indigo/80 hover:bg-clay/5 hover:text-indigo'
                  }`
                }
              >
                Cart
              </NavLink>
            )}
            {user && isAdmin && (
              <div className="flex items-center gap-1 bg-indigo/5 border border-clay/15 rounded-2xl p-1">
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive ? 'bg-clay text-warmwhite shadow-xs' : 'text-indigo/80 hover:text-indigo hover:bg-clay/10'
                    }`
                  }
                >
                  <Users className="w-3.5 h-3.5 text-clay" />
                  User Directory
                </NavLink>
                <NavLink
                  to="/admin/sellers"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive ? 'bg-indigo text-warmwhite shadow-xs' : 'text-indigo/80 hover:text-indigo hover:bg-clay/10'
                    }`
                  }
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-marigold" />
                  Approval Queue
                </NavLink>
                <NavLink
                  to="/admin/bi-dashboard"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive ? 'bg-marigold text-indigo shadow-xs' : 'text-indigo/80 hover:text-indigo hover:bg-clay/10'
                    }`
                  }
                >
                  <BarChart3 className="w-3.5 h-3.5 text-clay" />
                  BI Dashboard
                </NavLink>
              </div>
            )}
            <NavLink
              to="/welcome"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-semibold transition-all text-clay/90 hover:text-clay hover:bg-clay/5 ${
                  isActive ? 'bg-clay/10 text-clay font-bold' : ''
                }`
              }
            >
              What is LocalConnect?
            </NavLink>
          </nav>

          {/* Right Action / Auth Status */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {isSeller && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold badge-seller">
                    <Store className="w-3.5 h-3.5" /> Seller
                  </span>
                )}
                {isPendingSeller && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold badge-pending">
                    <Sparkles className="w-3.5 h-3.5" /> Pending Seller
                  </span>
                )}
                {isAdmin && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold badge-admin">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-clay/10 transition-colors border border-clay/20"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-lg bg-clay/20 text-clay flex items-center justify-center font-bold text-sm">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden lg:inline text-sm font-semibold text-indigo pr-1">
                    {user.name?.split(' ')[0]}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-indigo/60 hover:text-saffron hover:bg-saffron/10 border border-transparent hover:border-saffron/20 transition-all cursor-pointer"
                  title="Sign Out / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl bg-clay text-warmwhite font-medium text-sm hover:bg-saffron transition-all shadow-warm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Desktop Footer Link */}
      <footer className="hidden md:flex items-center justify-center gap-2 py-6 border-t border-clay/10 text-xs text-indigo/60">
        <img
          src="/logo.png"
          alt="LocalConnect"
          className="w-5 h-5 rounded-full object-cover shrink-0"
        />
        <span>LocalConnect — Mohalla Marketplace & Community &bull; </span>
        <Link to="/welcome" className="text-clay hover:underline font-semibold">
          What is LocalConnect?
        </Link>
      </footer>

      {/* Mobile Primary Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ivory/95 backdrop-blur-lg border-t border-clay/20 px-2 py-2 shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-clay font-bold' : 'text-indigo/60 hover:text-indigo'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileTabIndicator"
                    className="absolute inset-0 bg-clay/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 z-10 stroke-[2] ${isActive ? 'text-clay' : ''}`} />
                <span className="text-[11px] font-medium z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Global Toast Component */}
      <Toast />

      {/* Global AI Chat Support Widget */}
      <ChatWidget />
    </div>
  );
}
