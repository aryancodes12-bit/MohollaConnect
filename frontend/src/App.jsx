import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import DiscoverPage from './pages/DiscoverPage';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import BazaarMapPage from './pages/BazaarMapPage';
import CommunityPage from './pages/CommunityPage';
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import StorefrontPage from './pages/StorefrontPage';
import CheckoutPage from './pages/CheckoutPage';
import ReviewSubmissionPage from './pages/ReviewSubmissionPage';
import SellerProductsPage from './pages/SellerProductsPage';
import StoreSettingsPage from './pages/StoreSettingsPage';
import AdminSellerQueuePage from './pages/AdminSellerQueuePage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import DesignTokens from './pages/DesignTokens';

// Components
import SellerDashboard from './components/SellerDashboard';
import UserProfile from './components/UserProfile';

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome') === 'true';
  if (!user && !hasSeenWelcome) {
    return <Navigate to="/welcome" replace />;
  }
  return <DiscoverPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Standalone Welcome Page — NO AppShell, NO in-app navigation */}
              <Route path="/welcome" element={<WelcomePage />} />

              {/* All In-App Routes — Wrapped inside AppShell */}
              <Route
                path="/*"
                element={
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<HomeRoute />} />
                      <Route path="/login" element={<AuthPage />} />
                      <Route path="/register" element={<AuthPage />} />
                      <Route path="/bazaar-map" element={<BazaarMapPage />} />
                      
                      {/* Public Marketplace Views */}
                      <Route path="/products/:productId" element={<ProductDetailPage />} />
                      <Route path="/stores/:storeId" element={<StorefrontPage />} />

                      <Route
                        path="/community"
                        element={
                          <ProtectedRoute>
                            <CommunityPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/cart"
                        element={
                          <ProtectedRoute roles={['BUYER', 'ADMIN']}>
                            <CartPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute roles={['BUYER', 'ADMIN']}>
                            <CheckoutPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <MyOrdersPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/orders/:orderId"
                        element={
                          <ProtectedRoute>
                            <OrderTrackingPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/products/:productId/review"
                        element={
                          <ProtectedRoute>
                            <ReviewSubmissionPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute roles={['SELLER', 'PENDING_SELLER', 'ADMIN']}>
                            <SellerDashboard />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/dashboard/products"
                        element={
                          <ProtectedRoute roles={['SELLER', 'PENDING_SELLER', 'ADMIN']}>
                            <SellerProductsPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/dashboard/store"
                        element={
                          <ProtectedRoute roles={['SELLER', 'PENDING_SELLER', 'ADMIN']}>
                            <StoreSettingsPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/sellers"
                        element={
                          <ProtectedRoute roles={['ADMIN']}>
                            <AdminSellerQueuePage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <UserProfile />
                          </ProtectedRoute>
                        }
                      />

                      {import.meta.env.DEV && (
                        <Route path="/design-tokens" element={<DesignTokens />} />
                      )}
                    </Routes>
                  </AppShell>
                }
              />
            </Routes>
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
