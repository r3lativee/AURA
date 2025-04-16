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
        delay: custom * 0.2,
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1]
      } 
    })
  };
  
  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };
  
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    },
    hover: {
      y: -5,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };
  
  const imageVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
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
          <div className="filters-section">
            <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Filters:
            </Typography>
            
            <div className="filters-container">
              <div>
                <label className="filter-label">Price</label>
                <select 
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e)}
                >
                  <option className="filter-option" value="newest">Newest</option>
                  <option className="filter-option" value="price_low">Price: Low to High</option>
                  <option className="filter-option" value="price_high">Price: High to Low</option>
                  <option className="filter-option" value="popular">Most Popular</option>
                </select>
              </div>
              
              <div>
                <label className="filter-label">Product</label>
                <select 
                  className="filter-select"
                  value={category}
                  onChange={(e) => handleCategoryChange(e)}
                >
                  <option className="filter-option" value="all">All Categories</option>
                  <option className="filter-option" value="Beard Care">Beard Care</option>
                  <option className="filter-option" value="Skincare">Skincare</option>
                  <option className="filter-option" value="Hair Care">Hair Care</option>
                  <option className="filter-option" value="Accessories">Accessories</option>
                  <option className="filter-option" value="Body Care">Body Care</option>
                </select>
              </div>
              
              <div>
                <label className="filter-label">Relevance</label>
                <select 
                  className="filter-select"
                  value="relevance"
                >
                  <option className="filter-option" value="relevance">Most Relevant</option>
                  <option className="filter-option" value="trending">Trending</option>
                  <option className="filter-option" value="bestseller">Best Seller</option>
                </select>
              </div>
            </div>
          </div>
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
                    custom={index}
                    variants={cardVariants}
                    whileHover="hover"
                    className="product-card"
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
                      <button
                        className={`favorite-button ${isFavorite(product._id) ? 'active' : ''}`}
                        onClick={(e) => handleFavoriteToggle(e, product._id)}
                        aria-label={isFavorite(product._id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <FiHeart size={16} />
                      </button>
                      
                      {/* Product image - clickable to navigate to product detail */}
                      <div 
                        className="product-image"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        <motion.img
                          variants={imageVariants}
                          src={`${import.meta.env.VITE_API_URL}${product.images[0]}`}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = '/placeholder.jpg';
                          }}
                        />
                      </div>
                      
                      {/* Product info */}
                      <div className="product-info">
                        <div className="product-category">{product.category}</div>
                        <h3 className="product-name">{product.name}</h3>
                        
                        <div className="product-meta">
                          <div className="product-price">${product.price}</div>
                          <div className={`product-status ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="add-to-cart"
                          onClick={() => handleAddToCart(product, quantities[product._id] || 1)}
                          disabled={!product.inStock}
                        >
                          <span className="button-text">Add to Cart</span>
                          <FiShoppingCart size={16} />
                        </motion.button>
                      </div>
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
                    color: '#fff',
                    borderRadius: '50px'
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
            sx={{ width: '100%', borderRadius: '15px' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Products; 