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
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { productsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const categoryOptions = ['Beard Care', 'Skincare', 'Hair Care', 'Body Care', 'Accessories'];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [showAlert, setShowAlert] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAllAdmin();
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showNotification('Failed to load products', 'error');
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
    
    if (!productForm.name) errors.name = 'Name is required';
    if (!productForm.description) errors.description = 'Description is required';
    if (!productForm.price) errors.price = 'Price is required';
    if (!productForm.category) errors.category = 'Category is required';
    if (!productForm.thumbnailUrl) errors.thumbnailUrl = 'Thumbnail URL is required';
    if (!productForm.modelUrl) errors.modelUrl = 'Model URL is required';
    
    // Validate URLs
    if (productForm.thumbnailUrl && !isValidUrl(productForm.thumbnailUrl)) {
      errors.thumbnailUrl = 'Invalid URL format';
    }
    if (productForm.modelUrl && !isValidUrl(productForm.modelUrl)) {
      errors.modelUrl = 'Invalid URL format';
    }
    
    // Validate images array
    if (productForm.images && productForm.images.length === 0) {
      errors.images = 'At least one image URL is required';
    } else if (productForm.images.some(url => !isValidUrl(url))) {
      errors.images = 'One or more image URLs are invalid';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix validation errors', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const submissionData = {
        ...productForm,
        price: Math.round(productForm.price * 100), // Convert dollars to cents for API
      };

      if (selectedProduct) {
        await productsAPI.update(selectedProduct._id, submissionData);
        showNotification('Product updated successfully');
      } else {
        await productsAPI.create(submissionData);
        showNotification('Product created successfully');
      }
      
      fetchProducts();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save product:', error);
      showNotification(error.response?.data?.message || 'Failed to save product', 'error');
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === '' || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Snackbar 
        open={showAlert} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Products Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name or brand"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-filter-label">Filter by Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={filterCategory}
                onChange={handleFilterChange}
                label="Filter by Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Avatar
                          src={product.thumbnailUrl || product.images[0]}
                          alt={product.name}
                          variant="rounded"
                          sx={{ width: 48, height: 48 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{product.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {product.brand}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={product.category} size="small" />
                      </TableCell>
                      <TableCell>
                        ${(product.price / 100).toFixed(2)}
                        {product.discount > 0 && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ ml: 1 }}
                          >
                            -{product.discount}%
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.inStock ? 'In Stock' : 'Out of Stock'}
                          color={product.inStock ? 'success' : 'error'}
                          size="small"
                        />
                        <Typography variant="caption" display="block">
                          {product.stockQuantity} units
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}

      {/* Product Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Product Name"
                fullWidth
                value={productForm.name}
                onChange={handleInputChange}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="brand"
                label="Brand"
                fullWidth
                value={productForm.brand}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={productForm.description}
                onChange={handleInputChange}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Price ($)"
                type="number"
                fullWidth
                value={productForm.price}
                onChange={handleInputChange}
                error={!!validationErrors.price}
                helperText={validationErrors.price}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="discount"
                label="Discount (%)"
                type="number"
                fullWidth
                value={productForm.discount}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!validationErrors.category}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={productForm.category}
                  onChange={handleInputChange}
                  label="Category"
                >
                  {categoryOptions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.category && (
                  <Typography variant="caption" color="error">
                    {validationErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="subCategory"
                label="Sub-Category"
                fullWidth
                value={productForm.subCategory}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="stockQuantity"
                label="Stock Quantity"
                type="number"
                fullWidth
                value={productForm.stockQuantity}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="images"
                label="Images URLs (comma-separated)"
                fullWidth
                value={productForm.images.join(', ')}
                onChange={(e) => handleArrayInputChange('images', e.target.value)}
                error={!!validationErrors.images}
                helperText={validationErrors.images}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="thumbnailUrl"
                label="Thumbnail URL"
                fullWidth
                value={productForm.thumbnailUrl}
                onChange={handleInputChange}
                error={!!validationErrors.thumbnailUrl}
                helperText={validationErrors.thumbnailUrl}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="modelUrl"
                label="Model URL"
                fullWidth
                value={productForm.modelUrl}
                onChange={handleInputChange}
                error={!!validationErrors.modelUrl}
                helperText={validationErrors.modelUrl}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Ingredients (comma-separated)"
                fullWidth
                value={productForm.ingredients.join(', ')}
                onChange={(e) => handleArrayInputChange('ingredients', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Features (comma-separated)"
                fullWidth
                value={productForm.features.join(', ')}
                onChange={(e) => handleArrayInputChange('features', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Weight Value"
                type="number"
                fullWidth
                value={productForm.weight.value}
                onChange={(e) => handleNestedInputChange('weight', 'value', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="weight-unit-label">Weight Unit</InputLabel>
                <Select
                  labelId="weight-unit-label"
                  value={productForm.weight.unit}
                  onChange={(e) => handleNestedInputChange('weight', 'unit', e.target.value)}
                  label="Weight Unit"
                >
                  <MenuItem value="g">Grams (g)</MenuItem>
                  <MenuItem value="ml">Milliliters (ml)</MenuItem>
                  <MenuItem value="oz">Ounces (oz)</MenuItem>
                  <MenuItem value="lb">Pounds (lb)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products; 