import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { FiHeart, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { toast } from 'react-hot-toast';
import { ModelViewer } from './ProductCard';

const HomeProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  
  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };
  
  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (isFavorite(product._id)) {
      removeFromFavorites(product._id);
      toast.success('Removed from favorites');
    } else {
      addToFavorites(product._id);
      toast.success('Added to favorites');
    }
  };
  
  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product._id, 1);
    toast.success(`${product.name} added to cart`);
  };
  
  const formatThumbnailUrl = (url) => {
    if (!url) return '/placeholder.jpg';
    if (url.startsWith('http')) return url;
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
      className="home-product-card"
      initial="initial"
      whileHover="hover"
      variants={{
        initial: { scale: 1 },
        hover: { scale: 1.05 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Box 
        sx={{ 
          position: 'relative',
          backgroundColor: '#111111',
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
          cursor: 'pointer'
        }}
        onClick={handleCardClick}
      >
        {/* Product Image & Model Container */}
        <Box 
          sx={{ 
            position: 'relative',
            height: '300px',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Thumbnail Image */}
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
              transition: 'opacity 0.5s ease, transform 1s ease',
              opacity: isHovered && product.modelUrl ? 0.3 : 1,
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              zIndex: 0
            }}
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
            }}
          />
          
          {/* 3D Model on hover */}
          {product.modelUrl && (
            <ModelViewer 
              modelUrl={product.modelUrl} 
              alt={product.name}
              isVisible={isHovered} 
            />
          )}
          
          {/* Product Price Tag */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: alpha(theme.palette.primary.main, 0.9),
              color: '#fff',
              padding: '5px 12px',
              borderRadius: '20px',
              fontWeight: '600',
              zIndex: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              fontSize: '14px'
            }}
          >
            ${product.price}
          </Box>
          
          {/* Action Buttons */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  zIndex: 10,
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <Tooltip title="Add to favorites">
                  <IconButton
                    onClick={handleFavoriteToggle}
                    sx={{
                      backgroundColor: alpha('#000000', 0.7),
                      backdropFilter: 'blur(5px)',
                      color: isFavorite(product._id) ? '#ff4d6d' : '#ffffff',
                      '&:hover': {
                        backgroundColor: alpha('#000000', 0.9),
                      },
                      width: 40,
                      height: 40
                    }}
                  >
                    <FiHeart 
                      size={20} 
                      fill={isFavorite(product._id) ? '#ff4d6d' : 'transparent'} 
                    />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Add to cart">
                  <IconButton
                    onClick={handleAddToCart}
                    sx={{
                      backgroundColor: alpha('#000000', 0.7),
                      backdropFilter: 'blur(5px)',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: alpha('#000000', 0.9),
                      },
                      width: 40,
                      height: 40
                    }}
                  >
                    <FiShoppingBag size={20} />
                  </IconButton>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
        
        {/* Product Info */}
        <Box 
          sx={{ 
            padding: '16px',
            position: 'relative',
            background: 'linear-gradient(to top, #000000, rgba(0,0,0,0.8))',
            height: '80px'
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              color: '#ffffff',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            {product.name}
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: '4px'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: alpha('#ffffff', 0.7),
                fontSize: '14px',
                fontWeight: 400
              }}
            >
              {product.category}
            </Typography>
            
            <motion.div
              initial="initial"
              whileHover="hover"
              variants={{
                initial: { x: 0 },
                hover: { x: 5 }
              }}
            >
              <IconButton
                size="small"
                onClick={handleCardClick}
                sx={{ 
                  color: theme.palette.primary.main,
                  padding: 0,
                  '&:hover': { color: theme.palette.primary.light }
                }}
              >
                <FiArrowRight size={18} />
              </IconButton>
            </motion.div>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default HomeProductCard; 