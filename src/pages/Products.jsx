import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiMinus, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import {
  Container,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Pagination,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  ButtonGroup,
  Paper,
} from '@mui/material';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';
import '../styles/pages/Products.css';
import { toast } from 'react-hot-toast';

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Products = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState({});
  const [quantities, setQuantities] = useState({});
  const [sortBy, setSortBy] = useState('newest');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });

  // Animation refs
  const productsHeadingRef = useRef(null);
  
  // Animation variants for Framer Motion
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (custom) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: custom * 0.1,
        duration: 0.8, 
        ease: [0.215, 0.61, 0.355, 1.0] 
      } 
    })
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30, 
      scale: 0.95,
      boxShadow: '0px 0px 0px rgba(0,0,0,0)'
    },
    visible: (custom) => ({ 
      opacity: 1, 
      y: 0, 
      scale: 1,
      boxShadow: '0px 10px 30px rgba(0,0,0,0.15)',
      transition: { 
        delay: custom * 0.05, 
        duration: 0.6, 
        ease: [0.215, 0.61, 0.355, 1.0] 
      } 
    }),
    hover: { 
      y: -15,
      boxShadow: '0px 15px 40px rgba(0,0,0,0.2)',
      transition: { 
        duration: 0.3, 
        ease: "easeOut" 
      }
    }
  };
  
  const imageVariants = {
    hover: { 
      scale: 1.15, 
      filter: 'contrast(1.1) brightness(1.1)',
      transition: { duration: 0.5 }
    }
  };
  
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sortBy, category, searchQuery]);

  // Effect for GSAP animations
  useEffect(() => {
    // Products heading animation
    if (productsHeadingRef.current) {
      gsap.fromTo(
        productsHeadingRef.current, 
        { 
          opacity: 0, 
          y: 30 
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: productsHeadingRef.current,
            start: "top bottom-=100",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!import.meta.env.VITE_API_URL) {
        throw new Error('API URL is not configured. Please check your environment variables.');
      }

      const response = await productsAPI.getAll({
        page,
        sort: sortBy,
        category: category !== 'all' ? category : undefined,
        search: searchQuery || undefined,
      });
      
      // Check if response exists
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      // Handle both array and object responses
      let fetchedProducts = [];
      let total = 1;
      let currentPage = page;

      if (Array.isArray(response.data)) {
        // Direct array of products
        fetchedProducts = response.data;
      } else if (typeof response.data === 'object') {
        // Response with pagination structure
        fetchedProducts = response.data.products || response.data;
        total = response.data.totalPages || 1;
        currentPage = response.data.currentPage || page;
      }
      
      // Ensure products is an array
      if (!Array.isArray(fetchedProducts)) {
        console.error('Unexpected response format:', response.data);
        fetchedProducts = [];
      }

      setProducts(fetchedProducts);
      setTotalPages(total);
      if (currentPage !== page) {
        setPage(currentPage);
      }

      // Initialize quantities for each product
      const initialQuantities = {};
      fetchedProducts.forEach(product => {
        initialQuantities[product._id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load products. Please try again later.');
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, delta) => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 1;
      const newQty = Math.max(1, Math.min(currentQty + delta, 10)); // Limit between 1 and 10
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      return;
    }
    
    try {
      await addToCart(product._id, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleFavoriteToggle = async (e, productId) => {
    e.stopPropagation(); // Prevent navigating to product page when clicking favorite button
    if (!isAuthenticated) {
      toast.error('Please log in to save favorites');
      return;
    }
    
    try {
      if (isFavorite(productId)) {
        await removeFromFavorites(productId);
        toast.success('Removed from favorites');
      } else {
        await addToFavorites(productId);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ open: true, message, type });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading products...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ py: 8 }}>
          <Alert 
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchProducts}>
                Try Again
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Box className="products-page" sx={{ bgcolor: '#121212', minHeight: '100vh', color: 'white' }}>
      <Container sx={{ py: 8, pt: '200px' }} maxWidth="lg">
        <Typography 
          ref={productsHeadingRef}
          variant="h3" 
          component="h1" 
          align="center" 
          sx={{ 
            mb: 1, 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #ffffff, #4a90e2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          Our Products
        </Typography>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box sx={{ mb: 6 }}>
            <Typography variant="subtitle1" align="center" mb={4} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Filters:
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={4} md={3}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    bgcolor: '#222222', 
                    color: '#fff', 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                    '& .MuiSelect-icon': {
                      color: '#fff',
                    },
                  }}
                >
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Price</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={handleSortChange}
                      label="Price"
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                      }}
                    >
                      <MenuItem value="newest">Newest</MenuItem>
                      <MenuItem value="price_low">Price: Low to High</MenuItem>
                      <MenuItem value="price_high">Price: High to Low</MenuItem>
                      <MenuItem value="popular">Most Popular</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    bgcolor: '#222222', 
                    color: '#fff',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                    '& .MuiSelect-icon': {
                      color: '#fff',
                    },
                  }}
                >
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={category}
                      onChange={handleCategoryChange}
                      label="Product"
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                      }}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="Beard Care">Beard Care</MenuItem>
                      <MenuItem value="Skincare">Skincare</MenuItem>
                      <MenuItem value="Hair Care">Hair Care</MenuItem>
                      <MenuItem value="Accessories">Accessories</MenuItem>
                      <MenuItem value="Body Care">Body Care</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    bgcolor: '#222222', 
                    color: '#fff',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                  }}
                >
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Relevance</InputLabel>
                    <Select
                      value="relevance"
                      label="Relevance"
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                      }}
                    >
                      <MenuItem value="relevance">Most Relevant</MenuItem>
                      <MenuItem value="trending">Trending</MenuItem>
                      <MenuItem value="bestseller">Best Seller</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <Grid container spacing={3}>
            {products.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No products found
                  </Typography>
                </Box>
              </Grid>
            ) : (
              products.map((product, index) => (
                <Grid item key={product._id} xs={12} sm={6} md={4}>
                  <motion.div
                    variants={cardVariants}
                    custom={index}
                    whileHover="hover"
                  >
                    <Box 
                      sx={{ 
                        position: 'relative',
                        bgcolor: 'rgba(34, 34, 34, 0.8)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        willChange: 'transform, box-shadow'
                      }}
                    >
                      {/* Favorite button */}
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="contained"
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            minWidth: 'auto',
                            width: 36,
                            height: 36,
                            p: 0,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: isFavorite(product._id) ? '#ff4d4d' : '#fff',
                            borderRadius: '50%',
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.7)',
                            },
                            zIndex: 2,
                            backdropFilter: 'blur(4px)'
                          }}
                          onClick={(e) => handleFavoriteToggle(e, product._id)}
                        >
                          <FiHeart 
                            size={16} 
                            fill={isFavorite(product._id) ? '#ff4d4d' : 'none'} 
                          />
                        </Button>
                      </motion.div>
                      
                      {/* Product image - clickable to navigate to product detail */}
                      <motion.div
                        whileHover="hover"
                      >
                        <Box
                          sx={{ 
                            cursor: 'pointer',
                            height: 260,
                            bgcolor: '#1a1a1a',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden'
                          }}
                          onClick={() => navigate(`/product/${product._id}`)}
                        >
                          <motion.img
                            variants={imageVariants}
                            src={`${import.meta.env.VITE_API_URL}${product.images[0]}`}
                            alt={product.name}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              willChange: 'transform'
                            }}
                            onError={(e) => {
                              e.target.src = '/placeholder.jpg';
                            }}
                          />
                        </Box>
                      </motion.div>
                      
                      {/* Product info */}
                      <Box p={3}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#fff',
                            fontWeight: 600,
                            mb: 1
                          }}
                        >
                          {product.name}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)',
                            mb: 2,
                            height: 60,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {product.description}
                        </Typography>
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: 0.3 + (index * 0.1), 
                            type: "spring", 
                            stiffness: 100, 
                            damping: 10
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: '#4a90e2',
                              fontWeight: 700,
                              mb: 2
                            }}
                          >
                            ${product.price}
                          </Typography>
                        </motion.div>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <motion.div
                            variants={buttonVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            style={{ flex: 1 }}
                          >
                            <Button
                              variant="outlined"
                              sx={{
                                width: '100%',
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '&:hover': {
                                  borderColor: '#4a90e2',
                                  bgcolor: 'rgba(74, 144, 226, 0.1)'
                                }
                              }}
                              onClick={() => handleAddToCart(product, quantities[product._id] || 1)}
                            >
                              Add to Cart
                            </Button>
                          </motion.div>
                          
                          <motion.div
                            variants={buttonVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <Button
                              variant="contained"
                              sx={{
                                bgcolor: '#4a90e2',
                                color: '#fff',
                                '&:hover': {
                                  bgcolor: '#357abd',
                                }
                              }}
                              onClick={() => navigate(`/product/${product._id}`)}
                            >
                              Buy Now
                            </Button>
                          </motion.div>
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
              ))
            )}
          </Grid>
        </motion.div>

        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#fff'
                  },
                  '& .Mui-selected': {
                    bgcolor: 'rgba(74, 144, 226, 0.3)'
                  }
                }}
              />
            </Box>
          </motion.div>
        )}

        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={handleCloseNotification}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Products; 