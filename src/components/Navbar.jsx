import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiUser, FiLogOut, FiPackage, FiEdit, FiSettings, FiHome } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const CartPreview = ({ isAuthenticated }) => {
  const { cart, removeItem, total } = useCart();
  const cartItems = cart?.items || [];

  if (!cartItems.length) {
    return (
      <div className="cart-preview">
        <p className="empty-cart">Your cart is empty</p>
        <Link to="/products" className="view-products">
          View Products
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

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const { cart } = useCart();
  const cartItems = cart?.items || [];

  // Debug logging for navbar state
  useEffect(() => {
    console.log('Navbar state:', { isAuthenticated, user: user ? { ...user, password: undefined } : null });
  }, [isAuthenticated, user, forceUpdate]);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Auth state change detected in Navbar');
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
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

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  return (
    <header className="lusion-header">
      <div className="header-left">
        <Link to="/" className="logo">AURA</Link>
        <div className="header-links">
          <Link to="/products">Products</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          {user?.isAdmin && <Link to="/admin">Admin Dashboard</Link>}
        </div>
      </div>
      <div className="header-right">
        <div className="header-icons">
          <Link to={isAuthenticated ? "/favorites" : "/login"} className="icon-link">
            <FiHeart className="nav-icon" />
          </Link>
          <div className="cart-preview-container">
            <Link to={isAuthenticated ? "/cart" : "/login"} className="icon-link">
              <FiShoppingCart className="nav-icon" />
              {cartItems.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </Link>
            <CartPreview isAuthenticated={isAuthenticated} />
          </div>
        </div>
        {isAuthenticated ? (
          <div className="profile-section">
            <button
              ref={buttonRef}
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Profile menu"
            >
              {user?.profileImage ? (
                <img 
                  src={user.profileImage || 'https://i.imgur.com/3tVgsra.png'} 
                  className="profile-avatar" 
                  alt={user?.name || 'User'}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://i.imgur.com/3tVgsra.png';
                  }}
                />
              ) : (
                <div className="profile-circle">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            {showProfileMenu && (
              <div ref={menuRef} className="profile-menu">
                <div className="profile-menu-header">
                  <div className="profile-header-content">
                    <div className="profile-image">
                      {user?.profileImage ? (
                        <img 
                          src={user.profileImage || 'https://i.imgur.com/3tVgsra.png'} 
                          alt={user?.name || 'User'} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://i.imgur.com/3tVgsra.png';
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
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-button">
            <FiUser className="nav-icon" /> Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar; 