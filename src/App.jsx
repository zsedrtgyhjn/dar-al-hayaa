import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import WhatsAppButton from './components/common/WhatsAppButton';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CheckoutPage from './pages/Checkout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/client/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminStock from './pages/admin/AdminStock';
import AdminReviews from './pages/admin/AdminReviews';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';
import Forbidden from './pages/Forbidden';
import { AccountPage, WishlistPage } from './pages/Account';
import { 
  ContactPage, FAQPage, AboutPage, 
  PrivacyPage, TermsPage, ShippingPage, OrderTrackingPage 
} from './pages/Pages';
import { 
  WomenPage, MenPage, BeautyPage, 
  ElectronicsPage, AccessoriesPage, 
  PromotionsPage, NewArrivalsPage,
  AbayasPage, HijabsPage, JilbabsPage, RobesPage, KhimarsPage, AccessoiresFemmePage, ChaussuresFemmePage,
  QamisPage, SarouelsPage, ChaussuresHommePage,
  CheveuxPage, ParfumsPage, SacsPage, SoinVisagePage,
  CuisinePage, AudioPage, MontresPage,
  IslamPage, ChaussettesPage, GantsPage
} from './pages/CategoryPages';
import ResetPassword from './pages/auth/ResetPassword';
import { useAuthStore } from './store/authStore';
import { useCatalogStore } from './store/catalogStore';
import { useWishlistStore } from './store/wishlistStore';

// ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Initialise la session Supabase, le catalogue et les favoris au démarrage.
const AppBootstrap = () => {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const initAuthListener = useAuthStore((s) => s.initAuthListener);
  const user = useAuthStore((s) => s.user);
  const loadCatalog = useCatalogStore((s) => s.load);
  const loadFavorites = useWishlistStore((s) => s.loadFavorites);

  useEffect(() => {
    checkAuth();
    loadCatalog();
    const { data } = initAuthListener();
    return () => data?.subscription?.unsubscribe();
  }, [checkAuth, loadCatalog, initAuthListener]);

  // Synchronise les favoris avec le compte connecté.
  useEffect(() => {
    if (user?.id) loadFavorites(user.id);
    else useWishlistStore.setState({ userId: null });
  }, [user?.id, loadFavorites]);

  return null;
};

// Protected Route component for admin routes
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
};

// Layout component to hide Header/Footer on specific routes (like Admin)
const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin') && pathname !== '/admin';
  const isAuth =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';
  const isAdminLogin = pathname === '/admin';
  const isForbidden = pathname === '/forbidden';

  if (isAdmin || isAuth || isAdminLogin || isForbidden) {
    return children;
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh' }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <AppBootstrap />
        <Toaster position="top-right" />
        <Layout>
          <Routes>
            {/* Core */}
            <Route path="/" element={<Home />} />
            <Route path="/boutique" element={<Shop />} />
            <Route path="/produit/:id" element={<ProductDetail />} />
            <Route path="/paiement" element={<CheckoutPage />} />
            
            {/* Auth & Account */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/compte" element={<Dashboard />} />
            <Route path="/favoris" element={<WishlistPage />} />
            
            {/* Categories */}
            <Route path="/femmes" element={<WomenPage />} />
            <Route path="/hommes" element={<MenPage />} />
            <Route path="/beaute" element={<BeautyPage />} />
            <Route path="/electronique" element={<ElectronicsPage />} />
            <Route path="/accessoires" element={<AccessoriesPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/nouveautes" element={<NewArrivalsPage />} />

            {/* Subcategories - Femmes */}
            <Route path="/femmes/abayas" element={<AbayasPage />} />
            <Route path="/femmes/hijabs" element={<HijabsPage />} />
            <Route path="/femmes/jilbabs" element={<JilbabsPage />} />
            <Route path="/femmes/robes" element={<RobesPage />} />
            <Route path="/femmes/khimars" element={<KhimarsPage />} />
            <Route path="/femmes/accessoires" element={<AccessoiresFemmePage />} />
            <Route path="/femmes/chaussures" element={<ChaussuresFemmePage />} />

            {/* Subcategories - Hommes */}
            <Route path="/hommes/qamis" element={<QamisPage />} />
            <Route path="/hommes/sarouels" element={<SarouelsPage />} />
            <Route path="/hommes/chaussures" element={<ChaussuresHommePage />} />

            {/* Subcategories - Beauté */}
            <Route path="/beaute/cheveux" element={<CheveuxPage />} />
            <Route path="/beaute/parfums" element={<ParfumsPage />} />
            <Route path="/beaute/sacs" element={<SacsPage />} />
            <Route path="/beaute/soin_visage" element={<SoinVisagePage />} />

            {/* Subcategories - Électronique */}
            <Route path="/electronique/cuisine" element={<CuisinePage />} />
            <Route path="/electronique/audio" element={<AudioPage />} />
            <Route path="/electronique/montres" element={<MontresPage />} />

            {/* Subcategories - Accessoires */}
            <Route path="/accessoires/islam" element={<IslamPage />} />
            <Route path="/accessoires/chaussettes" element={<ChaussettesPage />} />
            <Route path="/accessoires/gants" element={<GantsPage />} />
            
            {/* Utility Pages */}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/confidentialite" element={<PrivacyPage />} />
            <Route path="/cgv" element={<TermsPage />} />
            <Route path="/mentions-legales" element={<TermsPage />} />
            <Route path="/livraison" element={<ShippingPage />} />
            <Route path="/retours" element={<ShippingPage />} />
            <Route path="/suivi-commande" element={<OrderTrackingPage />} />
            
            {/* Admin */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminProducts /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminOrders /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminCustomers /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/stock" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminStock /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/reviews" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminReviews /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/promotions" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminPromotions /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminSettings /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            
            {/* 403 Forbidden */}
            <Route path="/forbidden" element={<Forbidden />} />
            
            {/* 404 */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '120px 20px', minHeight: '60vh' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', color: 'var(--navy)' }}>404</h1>
                <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Page introuvable</p>
                <a href="/" style={{ background: 'var(--navy)', color: 'white', padding: '12px 24px', borderRadius: 'var(--radius-full)', textDecoration: 'none' }}>
                  Retour à l'accueil
                </a>
              </div>
            } />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}
