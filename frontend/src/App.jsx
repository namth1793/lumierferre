import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AuthDrawer from './components/AuthDrawer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Collections from './pages/Collections';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminKiotViet from './pages/admin/AdminKiotViet';
import AdminLayout from './pages/admin/AdminLayout';
import { AdminProvider } from './context/AdminContext';
import { UserProvider } from './context/UserContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <AdminProvider>
      <UserProvider>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartDrawer />}
      {!isAdmin && <AuthDrawer />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/san-pham" element={<Products />} />
          <Route path="/san-pham/:slug" element={<ProductDetail />} />
          <Route path="/bo-suu-tap/:slug" element={<Collections />} />
          <Route path="/ve-chung-toi" element={<About />} />
          <Route path="/lien-he" element={<Contact />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
          <Route path="/admin/products/new" element={<AdminLayout><AdminProductForm /></AdminLayout>} />
          <Route path="/admin/products/:id/edit" element={<AdminLayout><AdminProductForm /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
          <Route path="/admin/kiotviet" element={<AdminLayout><AdminKiotViet /></AdminLayout>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      </UserProvider>
    </AdminProvider>
  );
}
