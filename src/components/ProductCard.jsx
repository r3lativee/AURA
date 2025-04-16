import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import ProductModel3D from './ProductModel3D';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

const ProductCard = ({ product }) => {
  const [showModel, setShowModel] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

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

  // Image path including api url if needed
  const imagePath = product.images && product.images[0]?.startsWith('http') 
    ? product.images[0] 
    : `${import.meta.env.VITE_API_URL || ''}${product.images && product.images[0]}`;

  return (
    <motion.div
      className="work-item"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => setShowModel(true)}
      onMouseLeave={() => setShowModel(false)}
    >
      <div className="work-image" style={{ position: 'relative', height: '300px', width: '100%' }}>
        {/* 3D Model shown on hover */}
        {showModel && product.modelUrl ? (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <ProductModel3D modelUrl={product.modelUrl} height="100%" />
          </div>
        ) : (
          /* Regular image shown by default */
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