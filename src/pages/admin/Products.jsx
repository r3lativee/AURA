import React, { useState, useEffect, Suspense, useRef } from 'react';
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
  tooltipClasses,
  FormHelperText,
  CircularProgress
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
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  VideogameAsset as VideogameAssetIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Info as InfoIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { productsAPI, uploadAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import axios from 'axios';
import * as THREE from 'three';

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
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.6) 
    : '#ffffff',
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

// Add a utility function to format model URLs consistently
const formatModelUrl = (url) => {
  if (!url) return null;
  
  // If it's a blob URL (local file), return as is
  if (typeof url === 'string' && url.startsWith('blob:')) {
    return url;
  }
  
  // Handle relative URLs that are missing the leading slash
  if (typeof url === 'string' && !url.startsWith('/') && !url.startsWith('http')) {
    return `/${url}`;
  }
  
  // For URLs starting with /uploads, make them absolute by adding API_URL
  if (typeof url === 'string' && url.startsWith('/uploads') && import.meta.env.VITE_API_URL) {
    // Remove any trailing slash from API_URL to avoid double slashes
    const baseUrl = import.meta.env.VITE_API_URL.endsWith('/') 
      ? import.meta.env.VITE_API_URL.slice(0, -1) 
      : import.meta.env.VITE_API_URL;
    return `${baseUrl}${url}`;
  }
  
  return url;
};

// Add a utility function to format thumbnail URLs
const formatThumbnailUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/300x300?text=No+Image';
  
  // If it's already an absolute URL, return as is
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  
  // Add API URL prefix for relative paths
  if (url.startsWith('/') && import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL.endsWith('/') 
      ? import.meta.env.VITE_API_URL.slice(0, -1) 
      : import.meta.env.VITE_API_URL;
    return `${baseUrl}${url}`;
  }
  
  return url;
};

// Add 3D model component
const ModelViewer = ({ modelUrl, alt, height = 180 }) => {
  const [modelLoaded, setModelLoaded] = React.useState(false);
  const [showError, setShowError] = React.useState(false);
  const [currentModelUrl, setCurrentModelUrl] = React.useState('');
  const theme = useTheme();
  const modelViewerRef = React.useRef(null);

  // Set up model URL with validation
  React.useEffect(() => {
    // Skip pending uploads
    if (modelUrl === 'pending-upload') {
      console.log("ModelViewer - Model is pending upload, not displaying yet");
      setShowError(true);
      return;
    }
    
    // Format the URL and use it
    const formattedUrl = formatModelUrl(modelUrl);
    
    if (formattedUrl) {
      console.log("ModelViewer - Using formatted URL:", formattedUrl);
      setCurrentModelUrl(formattedUrl);
    } else {
      console.log("ModelViewer - No valid URL provided, using default:", DEFAULT_MODEL_URL);
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

  // Use effect to detect when model-viewer element is loaded
  React.useEffect(() => {
    const checkModelLoaded = () => {
      if (modelViewerRef.current) {
        // Access the model-viewer element
        const modelViewer = modelViewerRef.current;
        
        // Check if model is loaded
        if (modelViewer.modelIsVisible) {
          handleLoad();
          return;
        }
        
        // Add event listeners to detect loading and errors
        modelViewer.addEventListener('load', handleLoad);
        modelViewer.addEventListener('error', handleError);
        
        // Set a timeout to handle cases where the load event might not fire
        const loadingTimeout = setTimeout(() => {
          if (!modelLoaded) {
            // Check again if model is loaded 
            if (modelViewer.modelIsVisible) {
              handleLoad();
            }
          }
        }, 3000);
        
        return () => {
          modelViewer.removeEventListener('load', handleLoad);
          modelViewer.removeEventListener('error', handleError);
          clearTimeout(loadingTimeout);
        };
      }
    };
    
    // Wait for model-viewer script to load completely
    if (document.querySelector('script[src*="model-viewer"]')) {
      // Small delay to ensure the component is mounted
      const timer = setTimeout(checkModelLoaded, 100);
      return () => clearTimeout(timer);
    }
  }, [currentModelUrl, modelLoaded]);

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      backgroundColor: '#f5f5f5',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden'
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.1)',
            zIndex: 2,
          }}
        >
          <CircularProgress size={30} sx={{ color: theme.palette.primary.main, mb: 1 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Loading 3D Model
          </Typography>
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
            color: 'text.secondary',
            zIndex: 1,
            p: 2,
            textAlign: 'center'
          }}
        >
          <ErrorOutlineIcon sx={{ mb: 1, fontSize: '2rem', color: theme.palette.error.main }} />
          <Typography variant="caption">
            Model could not be loaded
          </Typography>
        </Box>
      ) : (
        <Box
          component="model-viewer"
          ref={modelViewerRef}
          src={currentModelUrl}
          alt={alt}
          auto-rotate
          camera-controls
          shadow-intensity="1"
          exposure="0.5"
          sx={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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

// Update ModelPreview component
const ModelPreview = ({ url }) => {
  const [error, setError] = useState(false);
  const [isLocalFile, setIsLocalFile] = useState(false);
  const [formattedUrl, setFormattedUrl] = useState('');
  const [loadingModel, setLoadingModel] = useState(true);
  
  // Format the URL and check if it's a local file URL
  useEffect(() => {
    const formatted = formatModelUrl(url);
    setFormattedUrl(formatted);
    setLoadingModel(true);
    setError(false);
    
    if (formatted && typeof formatted === 'string' && formatted.startsWith('blob:')) {
      setIsLocalFile(true);
    } else {
      setIsLocalFile(false);
    }
    
    // Log the URL for debugging
    console.log("ModelPreview - Original URL:", url);
    console.log("ModelPreview - Formatted URL:", formatted);
  }, [url]);
  
  // Simple Model component for all URLs including local blob URLs
  const PreviewModel = () => {
    try {
      if (!formattedUrl) {
        return <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#3f51b5" /></mesh>;
      }
      
      // Load the model (works for both remote and blob URLs)
      const { scene } = useGLTF(formattedUrl, undefined, (e) => {
        console.error(`Error loading GLTF model from ${formattedUrl}:`, e);
        setError(true);
        setLoadingModel(false);
      });
      
      useEffect(() => {
        if (scene) {
          setLoadingModel(false);
          
          // Log success for debugging
          console.log(`Successfully loaded model preview for ${isLocalFile ? 'local' : 'remote'} file:`, formattedUrl);
        }
      }, [scene]);
      
      // Auto-rotate the model for better visualization
      const modelRef = useRef();
      useFrame((state) => {
        if (modelRef.current) {
          // Gentle rotation
          modelRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
      });
      
      return (
        <group>
          <primitive 
            ref={modelRef} 
            object={scene} 
            scale={[1, 1, 1]} 
            position={[0, 0, 0]} 
          />
        </group>
      );
    } catch (err) {
      console.error("Error loading model preview:", err);
      setError(true);
      setLoadingModel(false);
      return <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#f44336" /></mesh>;
    }
  };
  
  if (error) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '200px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: alpha('#000', 0.2),
          borderRadius: 2
        }}
      >
        <Typography color="error">Failed to load model</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%', height: '200px', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={null}>
          <PreviewModel />
        </Suspense>
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          rotateSpeed={0.8}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>
      
      {loadingModel && (
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
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1,
          }}
        >
          <CircularProgress color="primary" size={30} />
        </Box>
      )}
      
      {isLocalFile && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '0.7rem',
            borderRadius: 4,
            padding: '4px 8px',
            zIndex: 2,
          }}
        >
          Local File Preview
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

  // Helper function to convert prices from cents to dollars
  const formatPrice = (price) => {
    if (!price) return '0.00';
    
    // Ensure the price is a number
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) return '0.00';
    
    // Convert cents to dollars with 2 decimal places
    return (numericPrice / 100).toFixed(2);
  };

  const renderGridItem = (product, handleOpenDialog, handleDeleteProduct) => {
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
        <ProductCard>
          <Box className="model-container" sx={{ position: 'relative', height: 200, width: '100%' }}>
            {product.modelUrl ? (
              <ModelViewer 
                modelUrl={product.modelUrl} 
                alt={product.name}
              />
            ) : (
              <Box 
                component="img"
                src={formatThumbnailUrl(product.thumbnailUrl)}
                alt={product.name}
                sx={{ 
                  width: '100%',
                  height: 200,
                  objectFit: 'cover',
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  backgroundColor: '#f5f5f5',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
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
              variant="filled"
              sx={{ 
                position: 'absolute',
                bottom: 12,
                left: 12,
                fontWeight: 500,
                fontSize: '0.7rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 2,
                '& .MuiChip-label': {
                  px: 1
                }
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
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              mb: 1.5,
              minHeight: 40,
              maxHeight: 40,
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
                  ${formatPrice(product.price)}
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
                      ${formatPrice(product.price * (1 + product.discount / 100))}
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
          <Divider sx={{ opacity: theme.palette.mode === 'dark' ? 0.1 : 0.2 }} />
          <Box sx={{ 
            p: 1.5, 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: 1,
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.3)
              : alpha(theme.palette.background.default, 0.5),
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
  const [modelFile, setModelFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [modelPreviewUrl, setModelPreviewUrl] = useState('');
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      
      // Set preview URLs if product has model/thumbnail
      if (product.modelUrl) {
        setModelPreviewUrl(product.modelUrl);
      } else {
        setModelPreviewUrl('');
      }
      
      if (product.thumbnailUrl) {
        setThumbnailPreviewUrl(product.thumbnailUrl);
      } else {
        setThumbnailPreviewUrl('');
      }
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
      setModelPreviewUrl('');
      setThumbnailPreviewUrl('');
    }
    
    // Reset file states
    setModelFile(null);
    setThumbnailFile(null);
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

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Reset upload progress
    setUploadProgress(0);
    
    // Validate file
    if (fileType === 'model') {
      // Check if file is .glb
      if (file.name.split('.').pop().toLowerCase() !== 'glb') {
        showNotification('Only .glb files are allowed for 3D models', 'error');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Model file size should be less than 10MB', 'error');
        return;
      }
      
      showNotification('3D model selected. Preview loading...', 'info');
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setModelPreviewUrl(objectUrl);
      setModelFile(file);
      
      // Update form with placeholder until file is uploaded
      setProductForm(prev => ({
        ...prev,
        modelUrl: 'pending-upload'
      }));
      
      console.log('3D model file selected:', file.name, 'size:', Math.round(file.size / 1024), 'KB');
    } else if (fileType === 'thumbnail') {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        showNotification('Only image files are allowed for thumbnails', 'error');
        return;
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Thumbnail file size should be less than 2MB', 'error');
        return;
      }
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreviewUrl(objectUrl);
      setThumbnailFile(file);
      
      // Update form with placeholder until file is uploaded
      setProductForm(prev => ({
        ...prev,
        thumbnailUrl: 'pending-upload'
      }));
      
      console.log('Thumbnail file selected:', file.name, 'size:', Math.round(file.size / 1024), 'KB');
    }
  };

  const uploadFiles = async () => {
    if (!modelFile && !thumbnailFile) {
      return true; // Nothing to upload
    }
    
    try {
      setUploadingFiles(true);
      setUploadProgress(0);

      const uploadPromise = new Promise((resolve, reject) => {
        // Create FormData for upload
        const formData = new FormData();
        
        if (modelFile) {
          formData.append('model', modelFile);
          console.log('Adding model file to upload:', modelFile.name, `(${Math.round(modelFile.size / 1024)} KB)`);
        }
        
        if (thumbnailFile) {
          formData.append('thumbnail', thumbnailFile);
          console.log('Adding thumbnail file to upload:', thumbnailFile.name, `(${Math.round(thumbnailFile.size / 1024)} KB)`);
        }
        
        // Create custom axios instance for this upload
        const uploadInstance = axios.create({
          baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Make request with progress tracking
        uploadInstance.post('/upload/product-files', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
            setUploadProgress(percentCompleted);
          }
        })
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
      });
      
      // Wait for upload to complete
      showNotification('Uploading files...', 'info');
      const response = await uploadPromise;
      const data = response.data;
      
      console.log('Server response data:', data);
      
      // Validate the response contains the expected URLs
      let isValidResponse = true;
      
      if (modelFile && !data.modelUrl && !data.modelFullUrl) {
        console.error('Server did not return model URL in response');
        isValidResponse = false;
      }
      
      if (thumbnailFile && !data.thumbnailUrl && !data.thumbnailFullUrl) {
        console.error('Server did not return thumbnail URL in response');
        isValidResponse = false;
      }
      
      if (!isValidResponse) {
        showNotification('Server returned an invalid response - missing file URLs', 'error');
        return false;
      }
      
      // Update form with URLs from server (prefer full URLs when available)
      const updatedForm = {
        ...productForm
      };
      
      if (modelFile) {
        // Use full URL if available, otherwise fall back to relative URL
        updatedForm.modelUrl = data.modelFullUrl || data.modelUrl;
        console.log('Model uploaded successfully, URL:', updatedForm.modelUrl);
      }
      
      if (thumbnailFile) {
        // Use full URL if available, otherwise fall back to relative URL
        updatedForm.thumbnailUrl = data.thumbnailFullUrl || data.thumbnailUrl;
        console.log('Thumbnail uploaded successfully, URL:', updatedForm.thumbnailUrl);
      }
      
      // Update product form with new URLs
      setProductForm(updatedForm);
      
      showNotification('Files uploaded successfully', 'success');
      
      // Clean up object URLs to prevent memory leaks
      if (modelPreviewUrl && modelPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(modelPreviewUrl);
      }
      
      if (thumbnailPreviewUrl && thumbnailPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
      
      return true;
    } catch (error) {
      console.error('Error uploading files:', error);
      const errorMessage = error.response?.data?.message || error.message;
      showNotification(`Failed to upload files: ${errorMessage}`, 'error');
      return false;
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate required fields
    if (!productForm.name) errors.name = 'Name is required';
    if (!productForm.description) errors.description = 'Description is required';
    if (!productForm.price) errors.price = 'Price is required';
    if (!productForm.category) errors.category = 'Category is required';
    if (!productForm.stockQuantity && productForm.stockQuantity !== 0) errors.stockQuantity = 'Stock quantity is required';
    
    // Validate new product has either model/thumbnail or URLs
    if (!selectedProduct) {
      if (!modelFile && !productForm.modelUrl) errors.modelUrl = 'Model file is required';
      if (!thumbnailFile && !productForm.thumbnailUrl) errors.thumbnailUrl = 'Thumbnail image is required';
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix validation errors', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if we have files that need upload but weren't uploaded yet
      if ((modelFile && productForm.modelUrl === 'pending-upload') || 
          (thumbnailFile && productForm.thumbnailUrl === 'pending-upload')) {
        
        console.log('Files need to be uploaded before saving');
        showNotification('Uploading files before saving product...', 'info');
        
        // Upload files first if needed
        const filesUploaded = await uploadFiles();
        if (!filesUploaded) {
          showNotification('Failed to upload files', 'error');
          setLoading(false);
          return;
        }
        
        // Verify that the upload provided actual URLs
        if (modelFile && (productForm.modelUrl === 'pending-upload' || !productForm.modelUrl)) {
          showNotification('Model upload failed - no URL received from server', 'error');
          setLoading(false);
          return;
        }
        
        if (thumbnailFile && (productForm.thumbnailUrl === 'pending-upload' || !productForm.thumbnailUrl)) {
          showNotification('Thumbnail upload failed - no URL received from server', 'error');
          setLoading(false);
          return;
        }
      }
      
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
      
      console.log('API Response:', response);
      
      // Reset form and close dialog
      handleCloseDialog();
      
      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification(`Failed to save product: ${error.message}`, 'error');
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
                        ${formatPrice(product.price)}
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
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, opacity: 0.8 }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={productForm.name}
                    onChange={handleInputChange}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price (USD)"
                    name="price"
                    type="number"
                    value={productForm.price}
                    onChange={handleInputChange}
                    error={!!validationErrors.price}
                    helperText={validationErrors.price}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    multiline
                    rows={4}
                    value={productForm.description}
                    onChange={handleInputChange}
                    error={!!validationErrors.description}
                    helperText={validationErrors.description}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth
                    error={!!validationErrors.category}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  >
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={productForm.category}
                      name="category"
                      onChange={handleInputChange}
                      label="Category"
                    >
                      {categoryOptions.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                    {validationErrors.category && (
                      <FormHelperText>{validationErrors.category}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Sub-Category"
                    name="subCategory"
                    value={productForm.subCategory}
                    onChange={handleInputChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Inventory */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, mt: 1, fontWeight: 500, opacity: 0.8 }}>
                Inventory
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Stock Quantity"
                    name="stockQuantity"
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={handleInputChange}
                    error={!!validationErrors.stockQuantity}
                    helperText={validationErrors.stockQuantity}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productForm.inStock}
                        onChange={handleInputChange}
                        name="inStock"
                        color="primary"
                      />
                    }
                    label="In Stock"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Media Files */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, mt: 1, fontWeight: 500, opacity: 0.8 }}>
                Media Files
              </Typography>
              <Grid container spacing={3}>
                {/* 3D Model Upload */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    3D Model (.glb)
                  </Typography>
                  
                  {modelPreviewUrl ? (
                    <Box sx={{ mb: 2 }}>
                      <ModelPreview url={modelPreviewUrl} />
                      
                      {uploadingFiles && modelFile && (
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                            Uploading: {uploadProgress}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress} 
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: alpha(theme.palette.primary.main, 0.8),
                          display: 'flex',
                          alignItems: 'center' 
                        }}>
                          {modelFile ? (
                            <>
                              <CheckCircleOutlineIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {modelFile.name} ({Math.round(modelFile.size / 1024)} KB)
                            </>
                          ) : (
                            <>
                              <InfoIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              Using existing model
                            </>
                          )}
                        </Typography>
                        
                        <Button 
                          variant="outlined" 
                          size="small"
                          color="error"
                          onClick={() => {
                            setModelPreviewUrl('');
                            setModelFile(null);
                            setProductForm(prev => ({
                              ...prev,
                              modelUrl: ''
                            }));
                          }}
                          disabled={uploadingFiles}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderRadius: 2,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: alpha(theme.palette.background.paper, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.paper, 0.2),
                          borderColor: alpha(theme.palette.primary.main, 0.5)
                        }
                      }}
                      component="label"
                    >
                      <input
                        type="file"
                        accept=".glb"
                        hidden
                        onChange={(e) => handleFileChange(e, 'model')}
                        disabled={uploadingFiles}
                      />
                      <VideogameAssetIcon 
                        sx={{ 
                          fontSize: 40, 
                          color: alpha(theme.palette.primary.main, 0.7),
                          mb: 1.5
                        }} 
                      />
                      <Typography variant="body2">
                        Drag & drop your 3D model here or click to browse
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6, mt: 0.5 }}>
                        Supported format: .glb (Max: 10MB)
                      </Typography>
                    </Box>
                  )}
                  
                  {validationErrors.modelUrl && (
                    <Typography color="error" variant="caption">
                      {validationErrors.modelUrl}
                    </Typography>
                  )}
                </Grid>
                
                {/* Thumbnail Upload */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Thumbnail Image
                  </Typography>
                  
                  {thumbnailPreviewUrl ? (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        component="img"
                        src={thumbnailPreviewUrl}
                        alt="Thumbnail preview"
                        sx={{ 
                          width: '100%', 
                          height: '200px', 
                          objectFit: 'cover',
                          borderRadius: 2,
                          mb: 1
                        }}
                      />
                      
                      {uploadingFiles && thumbnailFile && (
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                            Uploading: {uploadProgress}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress} 
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: alpha(theme.palette.primary.main, 0.8),
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {thumbnailFile ? (
                            <>
                              <CheckCircleOutlineIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)} KB)
                            </>
                          ) : (
                            <>
                              <InfoIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              Using existing thumbnail
                            </>
                          )}
                        </Typography>
                        
                        <Button 
                          variant="outlined" 
                          size="small"
                          color="error"
                          onClick={() => {
                            setThumbnailPreviewUrl('');
                            setThumbnailFile(null);
                            setProductForm(prev => ({
                              ...prev,
                              thumbnailUrl: ''
                            }));
                          }}
                          disabled={uploadingFiles}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderRadius: 2,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: alpha(theme.palette.background.paper, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.paper, 0.2),
                          borderColor: alpha(theme.palette.primary.main, 0.5)
                        }
                      }}
                      component="label"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleFileChange(e, 'thumbnail')}
                        disabled={uploadingFiles}
                      />
                      <CloudUploadIcon 
                        sx={{ 
                          fontSize: 40, 
                          color: alpha(theme.palette.primary.main, 0.7),
                          mb: 1.5
                        }} 
                      />
                      <Typography variant="body2">
                        Drag & drop your image here or click to browse
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6, mt: 0.5 }}>
                        Supported formats: JPG, PNG, WEBP (Max: 2MB)
                      </Typography>
                    </Box>
                  )}
                  
                  {validationErrors.thumbnailUrl && (
                    <Typography color="error" variant="caption">
                      {validationErrors.thumbnailUrl}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Grid>
            
            {/* Additional Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, mt: 1, fontWeight: 500, opacity: 0.8 }}>
                Additional Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ingredients (comma separated)"
                    name="ingredients"
                    value={Array.isArray(productForm.ingredients) ? productForm.ingredients.join(', ') : ''}
                    onChange={(e) => handleArrayInputChange('ingredients', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Features (comma separated)"
                    name="features"
                    value={Array.isArray(productForm.features) ? productForm.features.join(', ') : ''}
                    onChange={(e) => handleArrayInputChange('features', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Discount (%)"
                    name="discount"
                    type="number"
                    value={productForm.discount}
                    onChange={handleInputChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Brand"
                    name="brand"
                    value={productForm.brand}
                    onChange={handleInputChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.1)
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          
          {uploadingFiles && (
            <Box sx={{ width: '100%', mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Uploading files...</Typography>
              <LinearProgress color="primary" />
            </Box>
          )}
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
            disabled={loading || uploadingFiles}
            sx={{ 
              borderRadius: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              px: 3
            }}
          >
            {loading || uploadingFiles ? 
              <CircularProgress size={24} sx={{ color: '#fff' }} /> : 
              (selectedProduct ? 'Update' : 'Create')
            }
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