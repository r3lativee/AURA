import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { Box, Typography, CircularProgress } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { toast } from 'react-hot-toast';

export const ModelViewer = ({ modelUrl, alt, isVisible }) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showError, setShowError] = useState(false);
  const [formatError, setFormatError] = useState(false);
  const modelViewerRef = useRef(null);
  
  useEffect(() => {
    // Load the model-viewer script if it's not already loaded
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      script.type = 'module';
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);
  
  useEffect(() => {
    if (!isVisible || !modelUrl) return;

    let formattedUrl = modelUrl;
    
    // Handle relative URLs by adding API URL if needed
    if (modelUrl.startsWith('/') && !modelUrl.startsWith('//') && import.meta.env.VITE_API_URL) {
      const baseUrl = import.meta.env.VITE_API_URL.endsWith('/') 
        ? import.meta.env.VITE_API_URL.slice(0, -1) 
        : import.meta.env.VITE_API_URL;
      formattedUrl = `${baseUrl}${modelUrl}`;
    }
    
    // Validate model URL
    if (!formattedUrl.endsWith('.glb')) {
      console.error('Model URL does not end with .glb:', formattedUrl);
      setFormatError(true);
      return;
    }
    
    if (modelViewerRef.current) {
      modelViewerRef.current.src = formattedUrl;
      
      // Set up event listeners
      modelViewerRef.current.addEventListener('load', handleLoad);
      modelViewerRef.current.addEventListener('error', handleError);
    }
    
    return () => {
      if (modelViewerRef.current) {
        modelViewerRef.current.removeEventListener('load', handleLoad);
        modelViewerRef.current.removeEventListener('error', handleError);
      }
    };
  }, [isVisible, modelUrl]);
  
  const handleLoad = () => {
    console.log('Model loaded successfully:', modelUrl);
    setModelLoaded(true);
    setShowError(false);
  };
  
  const handleError = (event) => {
    console.error('Error loading model:', modelUrl, event);
    setModelLoaded(false);
    setShowError(true);
  };
  
  if (!isVisible) {
    return null;
  }
  
  if (formatError) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          zIndex: 1,
        }}
      >
        <Typography variant="caption">Invalid 3D model format</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1
    }}>
      {!modelLoaded && !showError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 2,
          }}
        >
          <CircularProgress size={30} sx={{ color: 'white' }} />
        </Box>
      )}
      
      {showError ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            zIndex: 1,
          }}
        >
          <Typography variant="caption">Model could not be loaded</Typography>
        </Box>
      ) : (
        <model-viewer
          ref={modelViewerRef}
          alt={alt}
          auto-rotate
          camera-controls
          shadow-intensity="1"
          exposure="0.5"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
          }}
          loading="lazy"
        />
      )}
    </Box>
  );
};

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const theme = useTheme();
  
  // Handle card click to navigate to product detail
  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };
  
  // Handle favorite toggle
  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    
    if (isFavorite(product._id)) {
      removeFromFavorites(product._id);
    } else {
      addToFavorites(product._id);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      addToCart(product._id, quantity);
      toast.success(`${product.name} added to cart`);
    }
  };
  
  const formatThumbnailUrl = (url) => {
    if (!url) return '/placeholder.jpg';
    
    // If it's already an absolute URL, return as is
    if (url.startsWith('http')) return url;
    
    // Add API URL prefix for relative paths
    if (url.startsWith('/') && import.meta.env.VITE_API_URL) {
      const baseUrl = import.meta.env.VITE_API_URL.endsWith('/') 
        ? import.meta.env.VITE_API_URL.slice(0, -1) 
        : import.meta.env.VITE_API_URL;
      return `${baseUrl}${url}`;
    }
    
    return url;
  };
  
  return (
    <motion.div
      className="product-card"
      whileHover="hover"
      variants={{
        hover: { y: -5 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <Box 
        sx={{ 
          position: 'relative',
          backgroundColor: '#1A1A1A',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          height: '100%',
          borderRadius: '15px',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Favorite button */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 3,
            backgroundColor: alpha('#000', 0.5),
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha('#000', 0.7),
            }
          }}
          onClick={handleFavoriteToggle}
        >
          <FiHeart 
            size={16} 
            color={isFavorite(product._id) ? '#ff6b6b' : 'white'} 
            fill={isFavorite(product._id) ? '#ff6b6b' : 'transparent'} 
          />
        </Box>
        
        {/* Product image container - with 3D model on hover */}
        <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
          {/* Thumbnail image always visible */}
          <Box
            component="img"
            src={formatThumbnailUrl(product.thumbnailUrl)}
            alt={product.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.3s ease',
              opacity: isHovered && product.modelUrl ? 0.3 : 1,
              zIndex: 0
            }}
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
            }}
          />
          
          {/* 3D Model conditionally loaded on hover */}
          {product.modelUrl && (
            <ModelViewer 
              modelUrl={product.modelUrl} 
              alt={product.name}
              isVisible={isHovered} 
            />
          )}
        </Box>
        
        {/* Product info */}
        <Box sx={{ p: 2, zIndex: 2, position: 'relative' }}>
          <Typography variant="overline" sx={{ color: alpha('#fff', 0.6), fontSize: '0.7rem' }}>
            {product.category}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 500,
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {product.name}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              ${product.price}
            </Typography>
            
            <Box 
              sx={{ 
                fontSize: '0.75rem', 
                color: product.inStock ? '#4caf50' : '#f44336',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: product.inStock ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1)
              }}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </Box>
          </Box>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '50px',
              backgroundColor: product.inStock ? 'white' : alpha('#777', 0.3),
              color: 'black',
              border: 'none',
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="add-to-cart-button"
          >
            <span style={{ color: 'black', fontWeight: 'bold' }}>Add to Cart</span>
            <FiShoppingCart size={16} color="black" />
          </motion.button>
        </Box>
      </Box>
    </motion.div>
  );
};

export default ProductCard; 