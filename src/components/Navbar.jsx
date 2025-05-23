import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiUser, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './AnimatedButton';
import { getImageUrl } from '../utils/imageUtils';
import './Navbar.css';

const CartPreview = ({ isAuthenticated }) => {
  const { cart, removeItem, total } = useCart();
  const cartItems = cart?.items || [];

  if (!cartItems.length) {
    return (
      <div className="cart-preview">
        <p className="empty-cart">Your cart is empty</p>
        <Link to="/products" className="view-products">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-preview">
      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item._id} className="cart-item">
            <img src={item.image} alt={item.name} />
            <div className="item-details">
              <h4>{item.name}</h4>
              <p>${item.price}</p>
            </div>
            <button onClick={() => removeItem(item._id)} className="remove-item">
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <div className="cart-total">
          <span>Total:</span>
          <span>${total}</span>
        </div>
        <div className="cart-actions">
          <Link to="/cart" className="view-cart">
            View Cart
          </Link>
          {isAuthenticated && (
            <Link to="/checkout" className="checkout">
              Checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ to, children }) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = location.pathname === to;
  
  return (
    <motion.div
      className="nav-button-container"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to={to} className={`nav-button ${isActive ? 'active' : ''}`}>
        <span className="nav-button-text">{children}</span>
        <AnimatePresence>
          {(isHovered || isActive) && (
            <motion.div 
              className="nav-button-highlight"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const { cart } = useCart();
  const cartItems = cart?.items || [];
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuVariants = {
    closed: { 
      opacity: 0,
      y: -10,
      pointerEvents: "none" 
    },
    open: {
      opacity: 1,
      y: 0,
      pointerEvents: "auto",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      pointerEvents: "none"
    },
    open: {
      opacity: 1,
      pointerEvents: "auto",
      transition: {
        ease: [0.16, 1, 0.3, 1],
        duration: 0.5
      }
    }
  };

  return (
    <header className={`lusion-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-left">
        <motion.div 
          className="logo-container"
          whileHover={{ opacity: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <Link to="/" className="logo">AURA</Link>
        </motion.div>
        
        <div className="header-links desktop-links">
          <NavButton to="/products">Products</NavButton>
          <NavButton to="/about">About</NavButton>
          {/* <NavButton to="/contact">Contact</NavButton> */}
          {user?.isAdmin && (
            <NavButton to="/admin">Admin</NavButton>
          )}
        </div>
        
        <div className="mobile-menu-toggle" onClick={toggleMenu}>
          <div className={`burger ${isMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
          >
            <div className="mobile-links">
              <Link to="/" className="mobile-link">Home</Link>
              <Link to="/products" className="mobile-link">Products</Link>
              <Link to="/about" className="mobile-link">About</Link>
              <Link to="/contact" className="mobile-link">Contact</Link>
              {user?.isAdmin && (
                <Link to="/admin" className="mobile-link">Admin</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="header-right">
        <div className="header-icons">
          <motion.div
            whileHover={{ opacity: 1 }}
            initial={{ opacity: 0.7 }}
            transition={{ duration: 0.3 }}
          >
            <Link to={isAuthenticated ? "/favorites" : "/login"} className="icon-link">
              <FiHeart className="nav-icon" />
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ opacity: 1 }}
            initial={{ opacity: 0.7 }}
            transition={{ duration: 0.3 }}
            className="cart-preview-container"
          >
            <Link to={isAuthenticated ? "/cart" : "/login"} className="icon-link">
              <FiShoppingCart className="nav-icon" />
              {cartItems.length > 0 && (
                <motion.span 
                  className="cart-badge"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {cartItems.length}
                </motion.span>
              )}
            </Link>
            <CartPreview isAuthenticated={isAuthenticated} />
          </motion.div>
        </div>
        
        {isAuthenticated ? (
          <div className="profile-section">
            <motion.button
              ref={buttonRef}
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Profile menu"
              whileHover={{ opacity: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {user?.profileImage ? (
                <img 
                  src={getImageUrl(user.profileImage)} 
                  className="profile-avatar" 
                  alt={user?.name || 'User'}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getImageUrl('https://i.imgur.com/3tVgsra.png');
                  }}
                />
              ) : (
                <div className="profile-circle">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.button>
            
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  ref={menuRef} 
                  className="profile-menu"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={menuVariants}
                >
                  <div className="profile-menu-header">
                    <div className="profile-header-content">
                      <div className="profile-image">
                        {user?.profileImage ? (
                          <img 
                            src={getImageUrl(user.profileImage)} 
                            alt={user?.name || 'User'} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getImageUrl('https://i.imgur.com/3tVgsra.png');
                            }}
                          />
                        ) : (
                          <div className="profile-circle large">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="profile-info">
                        <p className="profile-greeting">Welcome, </p>
                        <h3 className="profile-name">{user?.name}</h3>
                        <p className="profile-email">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="menu-divider"></div>
                  <div className="profile-menu-options">
                    <Link to="/profile" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                      <FiUser /> <span>My Profile</span>
                    </Link>
                    <Link to="/orders" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                      <FiPackage /> <span>My Orders</span>
                    </Link>
                    <Link to="/favorites" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                      <FiHeart /> <span>My Favorites</span>
                    </Link>
                    {user?.isAdmin && (
                      <Link to="/admin" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                        <FiSettings /> <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>
                  <div className="menu-divider"></div>
                  <div className="sign-out-container">
                    <button onClick={handleSignOut} className="sign-out-btn">
                      <FiLogOut /> <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <AnimatedButton 
            variant="secondary" 
            onClick={() => navigate('/login')}
            className="login-button"
          >
            <div className="button-content">
              <FiUser className="nav-icon" /> Sign In
            </div>
          </AnimatedButton>
        )}
      </div>
    </header>
  );
};

export default Navbar; 