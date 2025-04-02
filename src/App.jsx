import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import theme from './theme';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Products from './pages/Products';
import About from './pages/About.jsx';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastOverlay from './components/ToastOverlay';
import { CartProvider } from './context/CartContext';
import './styles/globals.css';
import './styles/formFix.css';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import { FavoritesProvider } from './context/FavoritesContext';
import AdminLayout from './layouts/AdminLayout';

function App() {
  const textRef = useRef(null);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Register the ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Check if we're on the home page
    const isHomePage = location.pathname === '/';
    
    // Only run hero animations on the home page
    if (isHomePage && textRef.current) {
      // Split text into characters
      const text = new SplitType(textRef.current, {
        types: 'chars',
        tagName: 'span'
      });

      // Initial setup
      gsap.set(text.chars, {
        opacity: 0,
        y: 100,
        rotateX: -90
      });

      // Hero text animation
      gsap.to(text.chars, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1.5,
        stagger: {
          amount: 1,
          from: "random"
        },
        ease: "power4.out",
      });
      
      // Scroll indicator animation (only on home page)
      gsap.to(".scroll-line", {
        scaleY: 0,
        transformOrigin: "top",
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom center",
          scrub: true
        }
      });

      // Header parallax (only on home page)
      gsap.to(".lusion-header", {
        yPercent: -100,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "bottom 80%",
          end: "bottom top",
          scrub: true
        }
      });
      
      return () => {
        text.revert();
      };
    }
    
    // Cleanup all ScrollTriggers on component unmount
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [location.pathname]);
  
  // Handle section animations separately to exclude form elements
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Set initial state for animate sections
    gsap.set(".animate-section", {
      opacity: 0,
      y: 50
    });
    
    // Completely skip animation for any element containing a form or any interactive input
    document.querySelectorAll('form, input, textarea, select, .MuiTextField-root, .MuiFormControl-root').forEach(el => {
      // Find the parent animate-section if exists
      let section = el.closest('.animate-section');
      if (section) {
        section.classList.remove('animate-section');
        gsap.set(section, { opacity: 1, y: 0 });
      }
    });
    
    // Scroll animations - carefully exclude form-containing sections
    gsap.utils.toArray('.animate-section').forEach((section) => {
      // Skip animation for sections containing form elements - double check
      if (section.querySelector('input, textarea, select, .MuiTextField-root, .MuiFormControl-root, form, button')) {
        // For form sections, just set them visible without animation
        gsap.set(section, { opacity: 1, y: 0 });
        return;
      }
      
      // For non-form sections, apply the scroll animation
      gsap.to(section, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none reverse",
          markers: false
        }
      });
    });
    
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [location.pathname]);

  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <div className="app" style={{ 
            background: '#121212', 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {!isAdminRoute && <Navbar />}
            <ToastOverlay />
            <main style={{ 
              paddingTop: '0', 
              background: '#121212',
              flex: '1 0 auto'
            }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/about" element={<About />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/forgot-password" 
                  element={
                    <PublicRoute>
                      <ForgotPassword />
                    </PublicRoute>
                  } 
                />

                {/* Protected Routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                </Route>
              </Routes>
            </main>
            {!isAdminRoute && <Footer />}
          </div>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#121212',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // Redirect to home if trying to access admin route without admin privileges
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // If user is authenticated and trying to access login/register, redirect to profile
  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default App; 