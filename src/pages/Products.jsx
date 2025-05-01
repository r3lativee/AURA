import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiMinus, FiPlus, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lottie from 'lottie-react';
import loadingAnimation from '/public/lottie/loading.json';
import { Globe } from '../components/magicui/globe';
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
  InputAdornment,
} from '@mui/material';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';
import '../styles/pages/Products.css';
import { toast } from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Animated text component
const AnimatedText = ({ text, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{ overflow: 'hidden', display: 'inline-block' }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: delay + index * 0.03,
            ease: [0.215, 0.61, 0.355, 1] 
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

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
  const [activeSearch, setActiveSearch] = useState(''); // Store the active search term
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

  // Initial data fetch with logging
  useEffect(() => {
    console.log('useEffect triggered with:', {
      page,
      sortBy,
      category,
      activeSearch
    });
    fetchProducts();
  }, [page, sortBy, category, activeSearch]);

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
      console.log('Fetching products with search:', activeSearch); // Debug log
      setLoading(true);
      setError(null);
      
      if (!import.meta.env.VITE_API_URL) {
        throw new Error('API URL is not configured. Please check your environment variables.');
      }

      const response = await productsAPI.getAll({
        page,
        sort: sortBy,
        category: category !== 'all' ? category : undefined,
        search: activeSearch || undefined,
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

      console.log('Fetched products:', fetchedProducts.length); // Debug log
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

  // Updated search handlers
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    console.log('Search submitted with query:', searchQuery); // Debug log
    
    // Ensure we have an actual search term
    const trimmedQuery = searchQuery.trim();
    
    // Update activeSearch and trigger a new search
    setActiveSearch(trimmedQuery);
    
    // Reset to page 1 when performing a new search
    setPage(1);
    
    // Force a new fetch if the useEffect doesn't trigger it
    setTimeout(() => {
      fetchProducts();
    }, 0);
  };

  const handleClearSearch = () => {
    console.log('Clearing search'); // Debug log
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
    
    // Force a new fetch
    setTimeout(() => {
      fetchProducts();
    }, 0);
  };

  // Reset filters handler
  const handleResetFilters = () => {
    console.log('Resetting all filters'); // Debug log
    setSortBy('newest');
    setCategory('all');
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
  };

  if (loading && products.length === 0) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Lottie 
            animationData={loadingAnimation} 
            loop={true}
            style={{ width: '150px', height: '150px' }}
          />
        </Box>
      </Container>
    );
  }

  if (error && products.length === 0) {
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
      <Container sx={{ py: 4, pt: '120px' }} maxWidth="lg">
        {/* Globe and animated text header */}
        <div className="products-header">
          <div className="globe-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              style={{ width: '300px', height: '300px', margin: '0 auto' }}
            >
              <Globe />
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="products-title-container"
          >
            <h1 className="products-title">
              <AnimatedText text="Our" delay={0.2} />
              {" "}
              <AnimatedText text="Premium" delay={0.3} />
              {" "}
              <AnimatedText text="Products" delay={0.4} />
            </h1>
            <p className="products-subtitle">
              <AnimatedText text="Discover the finest men's grooming products crafted with care" delay={0.7} />
            </p>
          </motion.div>
        </div>
        
        {/* Search bar - Form with submit handler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="search-container"
        >
          <form 
            onSubmit={handleSearchSubmit} 
            className="search-form"
          >
            <div className="search-input-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products and press Enter..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="search-clear-button"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button 
              type="submit" 
              className="search-button"
            >
              Search
            </button>
          </form>
          
          {activeSearch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="search-status"
            >
              {loading ? (
                <div className="search-loading">
                  <CircularProgress size={16} sx={{ color: 'white', marginRight: '8px' }} />
                  <span>Searching...</span>
                </div>
              ) : (
                <>
                  <FiSearch className="search-status-icon" />
                  <span>Showing results for "{activeSearch}"</span>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <div className="filters-section">
            <div className="filters-title">
              <span>Refine Your Selection</span>
            </div>
            
            <div className="filters-container">
              <div className="filter-group">
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
                {sortBy !== 'newest' && <span className="filter-active"></span>}
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Category</label>
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
                {category !== 'all' && (
                  <span className="filter-badge">{category}</span>
                )}
              </div>
              
              <div className="filter-group">
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
            
            {(sortBy !== 'newest' || category !== 'all' || activeSearch) && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                  className="filter-reset"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Products Grid with optimized loading state */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={loading ? "hidden" : "visible"}
          className="products-grid-container"
        >
          <Grid container spacing={3}>
            {products.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    {loading ? "" : "No products found"}
                  </Typography>
                </Box>
              </Grid>
            ) : (
              products.map((product, index) => (
                <Grid item key={product._id} xs={12} sm={6} md={4}>
                  <motion.div
                    variants={cardVariants}
                    whileHover="hover"
                    custom={index}
                    style={{ height: '100%' }}
                  >
                    <ProductCard 
                      product={product} 
                      onAddToCart={(product, quantity) => handleAddToCart(product, quantity)}
                    />
                  </motion.div>
                </Grid>
              ))
            )}
          </Grid>
        </motion.div>

        {/* Loading indicator specifically for product updates */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="products-loading"
          >
            <CircularProgress size={40} sx={{ color: 'rgba(74, 144, 226, 0.8)' }} />
            <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.7)' }}>
              Updating products...
            </Typography>
          </motion.div>
        )}

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