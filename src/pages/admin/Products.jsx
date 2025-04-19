import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Avatar,
  Chip,
  LinearProgress,
  TablePagination,
  Alert,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Snackbar,
  Switch,
  FormControlLabel,
  InputAdornment,
  Card,
  alpha,
  styled,
  useTheme,
  Tabs,
  Tab,
  Stack,
  Divider,
  Badge,
  Tooltip,
  tooltipClasses
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  GridView as GridViewIcon,
  FormatListBulleted as ListViewIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { productsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

// Default model URL to use as fallback when model loading fails
const DEFAULT_MODEL_URL = '/models/ftm.glb';

const categoryOptions = ['Beard Care', 'Skincare', 'Hair Care', 'Body Care', 'Accessories'];

// Styled components
const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  height: '100%',
}));

const ProductCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  borderRadius: 16,
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
    '& .product-actions': {
      opacity: 1,
      transform: 'translateY(0)',
    },
    '& .model-view': {
      opacity: 1,
    }
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: 6,
    top: 6,
    padding: '0 4px',
    height: 20,
    minWidth: 20,
    borderRadius: 10,
  },
}));

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    color: theme.palette.text.primary,
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: 8,
    fontSize: 12,
    padding: theme.spacing(1, 1.5),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
}));

// Add 3D model component
const ModelViewer = ({ modelUrl, alt, height = 180 }) => {
  const [modelLoaded, setModelLoaded] = React.useState(false);
  const [showError, setShowError] = React.useState(false);
  const [currentModelUrl, setCurrentModelUrl] = React.useState('');
  const theme = useTheme();

  // Set up model URL with validation
  React.useEffect(() => {
    // Validate if the provided URL is valid and use it, otherwise set to null
    if (modelUrl && typeof modelUrl === 'string') {
      // Make sure URL has leading slash if it's a relative path
      const validUrl = !modelUrl.startsWith('/') && !modelUrl.startsWith('http') 
        ? `/${modelUrl}` 
        : modelUrl;
      
      setCurrentModelUrl(validUrl);
    } else {
      setCurrentModelUrl(DEFAULT_MODEL_URL);
    }

    // Reset states when modelUrl changes
    setModelLoaded(false);
    setShowError(false);
  }, [modelUrl]);

  const handleLoad = () => {
    console.log(`Successfully loaded model: ${currentModelUrl}`);
    setModelLoaded(true);
    setShowError(false);
  };

  const handleError = () => {
    console.error(`Failed to load model from ${currentModelUrl}`);
    // If the primary model URL fails, try the default model
    if (currentModelUrl !== DEFAULT_MODEL_URL) {
      console.log(`Falling back to default model: ${DEFAULT_MODEL_URL}`);
      setCurrentModelUrl(DEFAULT_MODEL_URL);
      setModelLoaded(false);
    } else {
      // If default model also fails, show error state
      console.error("Both custom and default models failed to load");
      setShowError(true);
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        height,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderTopLeftRadius: 'inherit',
        borderTopRightRadius: 'inherit',
        overflow: 'hidden',
      }}
    >
      {!modelLoaded && !showError && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha('#000', 0.04),
            zIndex: 1
          }}
        >
          <LinearProgress 
            sx={{ 
              width: '60%', 
              borderRadius: 1,
              backgroundColor: alpha('#fff', 0.2)
            }} 
          />
        </Box>
      )}
      
      {showError ? (
        <Box
          component="img"
          src="https://via.placeholder.com/300x300?text=No+Model"
          alt={alt}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          component="model-viewer"
          src={currentModelUrl}
          alt={alt}
          auto-rotate
          camera-controls
          shadow-intensity="1"
          exposure="0.5"
          sx={{
            width: '100%',
            height: '100%',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
            '--poster-color': 'transparent',
            backgroundColor: 'transparent',
            '&::part(default-progress-bar)': {
              display: 'none',
            }
          }}
          ar
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* Only show 3D indicator when model is successfully loaded */}
      {modelLoaded && !showError && (
        <Box 
          className="model-view"
          sx={{ 
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            color: theme.palette.text.primary,
            fontSize: '0.7rem',
            fontWeight: 500,
            px: 1,
            py: 0.5,
            borderRadius: 4,
            backdropFilter: 'blur(4px)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: theme.palette.primary.main,
              boxShadow: `0 0 8px ${theme.palette.primary.main}`,
            }} 
          />
          3D View
        </Box>
      )}
    </Box>
  );
};

// Add product item renderer hook
const useProductRenderer = () => {
  const theme = useTheme();

  // Add this at the top of your file to ensure model-viewer is loaded
  React.useEffect(() => {
    // Load the model-viewer script if it's not already loaded
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      script.type = 'module';
      document.body.appendChild(script);
    }
  }, []);

  const renderGridItem = (product, handleOpenDialog, handleDeleteProduct) => {
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
        <ProductCard>
          <Box className="model-container" sx={{ position: 'relative' }}>
            {product.modelUrl ? (
              <ModelViewer 
                modelUrl={product.modelUrl} 
                alt={product.name} 
              />
            ) : (
              <Box 
                component="img"
                src={product.thumbnailUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
                alt={product.name}
                sx={{ 
                  width: '100%',
                  height: 180,
                  objectFit: 'cover',
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              />
            )}
            {product.discount > 0 && (
              <Chip
                label={`-${product.discount}%`}
                color="error"
                size="small"
                sx={{ 
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 2
                }}
              />
            )}
            <Chip
              label={product.inStock ? `${product.stockQuantity} in stock` : 'Out of Stock'}
              color={product.inStock ? (product.stockQuantity > 10 ? 'success' : 'warning') : 'error'}
              size="small"
              variant="outlined"
              sx={{ 
                position: 'absolute',
                bottom: 12,
                left: 12,
                fontWeight: 500,
                fontSize: '0.7rem',
                backgroundColor: alpha(
                  theme.palette[product.inStock ? (product.stockQuantity > 10 ? 'success' : 'warning') : 'error'].main, 
                  0.1
                ),
                zIndex: 2
              }}
            />
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600, 
              mb: 0.75,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              mb: 1.5,
              height: 40,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {product.description || 'No description available'}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mt: 1.5
            }}>
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 0.75
                }}>
                  ${(product.price / 100).toFixed(2)}
                  {product.discount > 0 && (
                    <Typography 
                      variant="caption" 
                      component="span" 
                      sx={{ 
                        color: 'text.secondary', 
                        textDecoration: 'line-through',
                        fontWeight: 400,
                        fontSize: '0.75rem',
                        opacity: 0.7
                      }}
                    >
                      ${((product.price / 100) * (1 + product.discount / 100)).toFixed(2)}
                    </Typography>
                  )}
                </Typography>
              </Box>
              <Chip label={product.category} size="small" sx={{ 
                fontSize: '0.7rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 500,
                height: 22
              }} />
            </Box>
          </Box>
          <Divider sx={{ opacity: 0.1 }} />
          <Box sx={{ 
            p: 1.5, 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: 1,
            backgroundColor: alpha(theme.palette.background.paper, 0.3),
          }}>
            <StyledTooltip title="View Details">
              <IconButton 
                size="small" 
                onClick={() => {/* View product details */}}
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </StyledTooltip>
            <StyledTooltip title="Edit Product">
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => handleOpenDialog(product)}
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </StyledTooltip>
            <StyledTooltip title="Delete Product">
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => handleDeleteProduct(product._id)}
                sx={{ 
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </StyledTooltip>
          </Box>
        </ProductCard>
      </Grid>
    );
  };

  return { renderGridItem };
};

const Products = () => {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [showAlert, setShowAlert] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'list'
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subCategory: '',
    images: [],
    sizes: [],
    ingredients: [],
    features: [],
    stockQuantity: 0,
    inStock: true,
    discount: 0,
    brand: 'AURA',
    weight: { value: 0, unit: 'g' },
    modelUrl: '',
    thumbnailUrl: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Add these at the beginning of the Products component
  const { renderGridItem } = useProductRenderer();

  useEffect(() => {
    // Initial data loading
    fetchProducts();
    
    // Return cleanup function
    return () => {
      // Any cleanup needed
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Define fetch parameters for possible future pagination or filtering
      const params = {};
      
      // Fetch products from the API
      const response = await productsAPI.getAllAdmin();
      
      // Check if the response contains data
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Ensure we have an array of products
      const productsData = Array.isArray(response.data) ? response.data : [];
      console.log('Fetched products:', productsData.length);
      
      // Update state with fetched products
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showNotification(`Failed to load products: ${error.message || 'Unknown error'}`, 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setProductForm({
        ...product,
        price: product.price / 100, // Convert cents to dollars for form display
      });
      setSelectedProduct(product);
    } else {
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        subCategory: '',
        images: [],
        sizes: [],
        ingredients: [],
        features: [],
        stockQuantity: 0,
        inStock: true,
        discount: 0,
        brand: 'AURA',
        weight: { value: 0, unit: 'g' },
        modelUrl: '',
        thumbnailUrl: '',
      });
      setSelectedProduct(null);
    }
    setValidationErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      subCategory: '',
      images: [],
      sizes: [],
      ingredients: [],
      features: [],
      stockQuantity: 0,
      inStock: true,
      discount: 0,
      brand: 'AURA',
      weight: { value: 0, unit: 'g' },
      modelUrl: '',
      thumbnailUrl: '',
    });
    setValidationErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setProductForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setProductForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleNestedInputChange = (parent, field, value) => {
    setProductForm((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleArrayInputChange = (field, value) => {
    // Convert comma-separated string to array
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    
    setProductForm((prev) => ({
      ...prev,
      [field]: arrayValue
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!productForm.name?.trim()) errors.name = 'Product name is required';
    if (!productForm.description?.trim()) errors.description = 'Description is required';
    
    // Price validation
    if (!productForm.price) {
      errors.price = 'Price is required';
    } else if (isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) < 0) {
      errors.price = 'Price must be a valid positive number';
    }
    
    // Category validation
    if (!productForm.category) errors.category = 'Category is required';
    
    // Image validation
    if (!productForm.images || productForm.images.length === 0) {
      errors.images = 'At least one image URL is required';
    } else if (productForm.images.some(url => !isValidUrl(url.trim()))) {
      errors.images = 'One or more image URLs are invalid';
    }
    
    // Thumbnail validation
    if (!productForm.thumbnailUrl?.trim()) {
      errors.thumbnailUrl = 'Thumbnail URL is required';
    } else if (!isValidUrl(productForm.thumbnailUrl)) {
      errors.thumbnailUrl = 'Invalid thumbnail URL format';
    }
    
    // 3D Model URL validation
    if (productForm.modelUrl?.trim()) {
      const modelUrl = productForm.modelUrl.trim();
      
      // Check if it's a valid URL
      if (!isValidUrl(modelUrl) && !isValidRelativePath(modelUrl)) {
        errors.modelUrl = 'Invalid model URL format. Use a valid URL or relative path.';
      }
      
      // Verify it has .glb extension
      if (!modelUrl.endsWith('.glb')) {
        errors.modelUrl = 'Model URL must point to a .glb file';
      }
    }
    // Model URL is optional, so no validation error if it's empty
    
    // Stock quantity validation
    if (productForm.stockQuantity < 0) {
      errors.stockQuantity = 'Stock quantity cannot be negative';
    }
    
    // Discount validation
    if (productForm.discount < 0 || productForm.discount > 100) {
      errors.discount = 'Discount must be between 0 and 100';
    }
    
    // Weight validation
    if (productForm.weight.value < 0) {
      errors.weightValue = 'Weight cannot be negative';
    }
    
    // Set validation errors to state
    setValidationErrors(errors);
    
    // Return true if no errors, false otherwise
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      // Check if it's an absolute URL
      new URL(url);
      return true;
    } catch (e) {
      // Not a valid absolute URL
      return false;
    }
  };

  const isValidRelativePath = (path) => {
    // Valid relative paths should start with / or not start with protocol (http://, https://)
    return path.startsWith('/') || 
      !(path.startsWith('http://') || path.startsWith('https://') || path.startsWith('ftp://'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix validation errors', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format the data for submission
      const submissionData = {
        ...productForm,
        price: Math.round(parseFloat(productForm.price) * 100), // Convert dollars to cents for API
        stockQuantity: parseInt(productForm.stockQuantity, 10),
        discount: parseInt(productForm.discount, 10),
        weight: {
          value: parseFloat(productForm.weight.value),
          unit: productForm.weight.unit
        }
      };

      // For debugging
      console.log('Submitting product data:', submissionData);

      let response;
      if (selectedProduct) {
        // Update existing product
        response = await productsAPI.update(selectedProduct._id, submissionData);
        showNotification('Product updated successfully');
      } else {
        // Create new product
        response = await productsAPI.create(submissionData);
        showNotification('Product created successfully');
      }
      
      // Reload products to reflect changes
      fetchProducts();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save product';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        await productsAPI.delete(productId);
        showNotification('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
        showNotification('Failed to delete product', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterCategory(e.target.value);
  };

  const handleViewChange = (newView) => {
    setViewType(newView);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    let matchesSearch = true;
    let matchesFilter = true;
    
    if (searchTerm) {
      matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (filterCategory) {
      matchesFilter = product.category === filterCategory;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Add a refresh function that users can call
  const handleRefresh = () => {
    fetchProducts();
    toast.success('Products list refreshed successfully');
  };

  if (loading) {
    return <LinearProgress sx={{ 
      height: 4, 
      borderRadius: 2,
      background: alpha(theme.palette.primary.main, 0.1)
    }} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              background: 'linear-gradient(90deg, #fff 30%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 0.5
            }}
          >
            Products
        </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.8 }}>
            Manage your product catalog in one place
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 2, md: 0 } }}>
        <Button
          variant="contained"
            color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
            sx={{ 
              borderRadius: 2,
              px: 2.5,
              py: 1,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`
            }}
        >
          Add Product
        </Button>
        </Box>
      </Box>

      {/* Search and Filter Bar */}
      <GlassCard sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2, 
          flexWrap: 'wrap' 
        }}>
            <TextField
            placeholder="Search products..."
            variant="outlined"
            size="small"
              value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              sx: {
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.15),
                }
              }
            }}
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 220 } }}
          />
          
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.15),
                }
              }
            }}
          >
            <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            ml: { xs: 0, md: 'auto' }, 
            gap: 1,
            borderLeft: { xs: 'none', md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
            pl: { xs: 0, md: 2 }
          }}>
            <StyledTooltip title="Grid View">
              <IconButton 
                color={viewType === 'grid' ? 'primary' : 'default'} 
                onClick={() => handleViewChange('grid')}
                sx={{ 
                  backgroundColor: viewType === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  borderRadius: 1.5,
                }}
              >
                <GridViewIcon />
              </IconButton>
            </StyledTooltip>
            <StyledTooltip title="List View">
              <IconButton 
                color={viewType === 'list' ? 'primary' : 'default'} 
                onClick={() => handleViewChange('list')}
                sx={{ 
                  backgroundColor: viewType === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  borderRadius: 1.5,
                }}
              >
                <ListViewIcon />
              </IconButton>
            </StyledTooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.2 }} />
            <StyledTooltip title="Refresh Products">
              <IconButton 
                onClick={handleRefresh}
                sx={{ 
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.background.paper, 0.1),
                }}
              >
                <RefreshIcon />
              </IconButton>
            </StyledTooltip>
          </Box>
        </Box>
      </GlassCard>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <GlassCard sx={{ p: 6, textAlign: 'center', mb: 2 }}>
          <Box sx={{ mb: 2 }}>
            <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4 }} />
          </Box>
          <Typography variant="h6" gutterBottom sx={{ opacity: 0.8 }}>
            No Products Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            {searchTerm || filterCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'There are no products in the system yet. Start by adding a product.'}
          </Typography>
          {!products.length && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mt: 3, borderRadius: 2 }}
            >
              Add Your First Product
            </Button>
          )}
        </GlassCard>
      ) : viewType === 'grid' ? (
        // Grid View
        <Box>
          <Grid container spacing={3}>
            {filteredProducts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((product) => renderGridItem(product, handleOpenDialog, handleDeleteProduct))}
        </Grid>
      </Box>
      ) : (
        // List View
        <GlassCard>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Stock</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow 
                      key={product._id}
                      sx={{ 
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={product.thumbnailUrl}
                          variant="rounded"
                            alt={product.name}
                            sx={{ width: 50, height: 50, borderRadius: 2 }}
                          />
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {product.name}
                        </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              maxWidth: 300
                            }}>
                              {product.description || 'No description'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.category} 
                          size="small" 
                          sx={{ 
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            height: 24
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${(product.price / 100).toFixed(2)}
                        </Typography>
                        {product.discount > 0 && (
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 500 }}>
                            {product.discount}% off
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.inStock ? `In Stock: ${product.stockQuantity}` : 'Out of Stock'}
                          color={product.inStock ? (product.stockQuantity > 10 ? 'success' : 'warning') : 'error'}
                          size="small"
                          sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <StyledTooltip title="View Details">
                        <IconButton
                              size="small" 
                              onClick={() => {/* View product details */}}
                              sx={{ 
                                backgroundColor: alpha(theme.palette.background.paper, 0.2),
                                '&:hover': { backgroundColor: alpha(theme.palette.background.paper, 0.3) }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </StyledTooltip>
                          <StyledTooltip title="Edit Product">
                            <IconButton 
                              size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog(product)}
                              sx={{ 
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
                              }}
                        >
                              <EditIcon fontSize="small" />
                        </IconButton>
                          </StyledTooltip>
                          <StyledTooltip title="Delete Product">
                        <IconButton
                              size="small" 
                          color="error"
                          onClick={() => handleDeleteProduct(product._id)}
                              sx={{ 
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) }
                              }}
                        >
                              <DeleteIcon fontSize="small" />
                        </IconButton>
                          </StyledTooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {/* Pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={filteredProducts.length}
              page={page}
              onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[8, 16, 24, 32]}
          sx={{ 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.4),
            '.MuiTablePagination-select': {
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.1),
            }
          }}
        />
      </Box>

      {/* Product Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundImage: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 3,
          fontWeight: 600
        }}>
          {selectedProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* Product form fields go here */}
          {/* Additional form fields as needed */}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, p: 2, px: 3 }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              color: theme.palette.text.secondary,
              borderColor: alpha(theme.palette.text.secondary, 0.2),
              '&:hover': {
                borderColor: alpha(theme.palette.text.secondary, 0.3),
                backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
                    color="primary"
            onClick={handleSubmit}
            sx={{ 
              borderRadius: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              px: 3
            }}
          >
            {selectedProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showAlert}
        autoHideDuration={5000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity={alertSeverity} 
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Products; 