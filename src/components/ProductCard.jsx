import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import ProductModel3D from './ProductModel3D';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

const ProductCard = ({ product }) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  // Load model-viewer Web Component if it doesn't exist
  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      script.type = 'module';
      document.body.appendChild(script);
    }
  }, []);

  // Effect to validate model URL before attempting to load it
  useEffect(() => {
    // Validate if model URL looks like a valid path
    if (!product.modelUrl || typeof product.modelUrl !== 'string' || !product.modelUrl.endsWith('.glb')) {
      setModelError(true);
    }
  }, [product]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    hover: { 
      y: -10, 
      transition: { 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1.0] 
      } 
    }
  };

  const imageVariants = {
    initial: {
      scale: 1
    },
    hover: { 
      scale: 1.05, 
      transition: { 
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1.0]
      } 
    }
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (isFavorite(product._id)) {
      removeFromFavorites(product._id);
    } else {
      addToFavorites(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1, product.sizes ? product.sizes[0] : null);
  };

  const handleModelLoad = () => {
    setModelLoaded(true);
  };

  const handleModelError = () => {
    setModelError(true);
  };

  // Image path including api url if needed
  const imagePath = product.images && product.images[0]?.startsWith('http') 
    ? product.images[0] 
    : `${import.meta.env.VITE_API_URL || ''}${product.images && product.images[0]}`;

  // Function to validate URL to prevent HTTP 404 errors showing as JSON parsing errors
  const validateModelUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Make sure URL starts with / if it's a relative path
    if (!url.startsWith('/') && !url.startsWith('http')) {
      return `/${url}`;
    }
    return url;
  };

  return (
    <motion.div
      className="work-item"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="work-image" style={{ position: 'relative', height: '300px', width: '100%' }}>
        {/* Only attempt to show 3D model if URL is valid and no previous errors */}
        {product.modelUrl && !modelError ? (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <ProductModel3D 
              modelUrl={validateModelUrl(product.modelUrl)} 
              height="100%" 
              onLoad={handleModelLoad}
              onError={handleModelError}
            />
            {/* Show loading indicator while model is loading */}
            {!modelLoaded && !modelError && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }}>
                <div className="model-loading-spinner"></div>
              </div>
            )}
          </div>
        ) : (
          /* Regular image shown if no model or model error */
          <motion.img 
            variants={imageVariants}
            initial="initial"
            src={imagePath || '/placeholder.jpg'}
            alt={product.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
            }}
          />
        )}

        {/* Favorite button overlay */}
        <button
          className={`favorite-button ${isFavorite(product._id) ? 'active' : ''}`}
          onClick={handleFavoriteToggle}
          aria-label={isFavorite(product._id) ? "Remove from favorites" : "Add to favorites"}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.4)',
            border: 'none',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isFavorite(product._id) ? '#e74c3c' : 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)'
          }}
        >
          <FiHeart size={16} />
        </button>
        
        {/* 3D Model indicator if available */}
        {product.modelUrl && !modelError && (
          <div 
            style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              zIndex: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              fontSize: '0.7rem',
              padding: '4px 8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(4px)'
            }}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: '#4a90e2',
              boxShadow: '0 0 6px #4a90e2' 
            }}></span>
            3D
          </div>
        )}
      </div>

      <div className="work-info">
        <h3>{product.name}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>${product.price}</p>
          <button
            onClick={handleAddToCart}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'background 0.2s ease'
            }}
            aria-label="Add to cart"
          >
            <FiShoppingCart size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard; 