import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  LinearProgress,
  TablePagination,
  Collapse,
  Alert,
  Snackbar,
  alpha,
  styled,
  useTheme,
  InputAdornment
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { ordersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

// Styled components
const GlassCard = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.common.white, 0.03),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  transition: 'all 0.2s',
}));

const StyledChip = styled(Chip)(({ theme, color }) => ({
  borderRadius: 8,
  fontWeight: 500,
  fontSize: '0.75rem',
  padding: '0 6px',
  height: 24,
  '& .MuiChip-label': {
    padding: '0 8px',
  },
  boxShadow: `0 2px 8px ${alpha(
    theme.palette[color]?.main || theme.palette.grey[500], 
    0.2
  )}`,
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderColor: alpha(theme.palette.divider, 0.1),
  padding: '12px 16px',
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(2, 3),
}));

const Orders = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    status: '',
    paymentStatus: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add pagination parameters
      const params = {
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage
      };
      
      const response = await ordersAPI.getAllOrders(params);
      
      // Properly handle the response
      if (response.data && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
        setTotalOrders(response.data.total || response.data.orders.length);
      } else if (Array.isArray(response.data)) {
        // Fallback if API returns just an array
        setOrders(response.data);
        setTotalOrders(response.data.length);
      } else {
        // Handle unexpected response
        setOrders([]);
        setTotalOrders(0);
        setError('Received unexpected data format from server');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError(error.message || 'Failed to fetch orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setOrderForm({
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setOrderForm({
      status: '',
      paymentStatus: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Check if we have the expected API method
      if (!ordersAPI.updateOrderStatus) {
        throw new Error('Update order status method not available');
      }
      
      // Prepare request data
      const updateData = {
        status: orderForm.status,
        paymentStatus: orderForm.paymentStatus
      };
      
      // Call API to update the order
      await ordersAPI.updateOrderStatus(selectedOrder._id, updateData);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Order ${selectedOrder._id} has been updated successfully`,
        severity: 'success'
      });
      
      // Refresh orders list
      fetchOrders();
      
      // Close the dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to update order:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update order',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
    toast.success('Orders list refreshed');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };
  
  const filteredOrders = orders.filter(order => {
    let matchesSearch = true;
    let matchesFilter = true;
    
    if (searchTerm) {
      matchesSearch = order._id.includes(searchTerm) || 
                     (order.user && order.user.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (filterStatus) {
      matchesFilter = order.status && order.status.toLowerCase() === filterStatus.toLowerCase();
    }
    
    return matchesSearch && matchesFilter;
  });

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
          Orders Management
        </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.8 }}>
            View and manage all customer orders in one place
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 2, md: 0 } }}>
          <TextField 
            placeholder="Search orders..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
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
            sx={{ minWidth: 200 }}
          />
          
          <TextField
            select
            label="Status"
            variant="outlined"
            size="small"
            value={filterStatus}
            onChange={handleFilterChange}
            sx={{ 
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.15),
                }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="shipped">Shipped</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Orders Table */}
      <GlassCard>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="orders table">
            <TableHead>
              <TableRow>
                <StyledTableCell />  {/* For expand/collapse */}
                <StyledTableCell sx={{ fontWeight: 600 }}>Order ID</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Customer</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Date</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Total</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Status</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Payment</StyledTableCell>
                <StyledTableCell align="right" sx={{ fontWeight: 600 }}>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                      <Typography variant="h6" sx={{ opacity: 0.8, mb: 1 }}>No Orders Found</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || filterStatus 
                          ? 'Try adjusting your search or filter criteria'
                          : 'There are no orders in the system yet'}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                    <React.Fragment key={order._id || `order-${order.id}`}>
                      <StyledTableRow>
                        <StyledTableCell>
                        <IconButton
                            aria-label="expand row"
                          size="small"
                            onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                            sx={{ 
                              backgroundColor: expandedOrder === order._id 
                                ? alpha(theme.palette.primary.main, 0.1) 
                                : 'transparent',
                              transition: 'all 0.2s'
                            }}
                          >
                            {expandedOrder === order._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </StyledTableCell>
                        <StyledTableCell sx={{ fontWeight: 500 }}>
                          {order._id?.substring(0, 8) || 'N/A'}
                        </StyledTableCell>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {order.user?.profileImage ? (
                              <Box
                                component="img"
                                src={order.user.profileImage}
                                alt={order.user?.name || 'Customer'}
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`  
                                }}
                              />
                            ) : (
                              <Box 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%', 
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: theme.palette.primary.main,
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {(order.user?.name || 'U')[0]}
                              </Box>
                            )}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {order.user?.name || 'Guest User'}
                        </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.user?.email || 'No email'}
                        </Typography>
                            </Box>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>{formatDate(order.createdAt)}</StyledTableCell>
                        <StyledTableCell sx={{ fontWeight: 500 }}>{formatCurrency(order.totalAmount)}</StyledTableCell>
                        <StyledTableCell>
                          <StyledChip
                            label={order.status || 'Pending'}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                        </StyledTableCell>
                        <StyledTableCell>
                          <StyledChip
                            label={order.paymentStatus || 'Pending'}
                            color={getStatusColor(order.paymentStatus)}
                          size="small"
                            variant="outlined"
                        />
                        </StyledTableCell>
                        <StyledTableCell align="right">
                        <Button
                            variant="contained"
                          size="small"
                            color="primary"
                          onClick={() => handleOpenDialog(order)}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                              '&:hover': {
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                              }
                            }}
                        >
                          Update
                        </Button>
                        </StyledTableCell>
                      </StyledTableRow>
                      {/* Order Details Expansion Panel */}
                    <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0, borderBottom: 'none' }}>
                        <Collapse in={expandedOrder === order._id} timeout="auto" unmountOnExit>
                            <Box sx={{ 
                              m: 2, 
                              p: 2, 
                              borderRadius: 2, 
                              backgroundColor: alpha(theme.palette.background.paper, 0.4)
                            }}>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              Order Details
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Shipping Address
                                </Typography>
                                <Typography variant="body2">
                                    {order.shippingAddress?.line1}, {order.shippingAddress?.line2}
                                  </Typography>
                                  <Typography variant="body2">
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                                  </Typography>
                                  <Typography variant="body2">
                                    {order.shippingAddress?.country}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Payment Information
                                </Typography>
                                <Typography variant="body2">
                                    Method: {order.paymentMethod || 'Card'}
                                  </Typography>
                                  <Typography variant="body2">
                                    Status: {order.paymentStatus || 'Pending'}
                                  </Typography>
                                  {order.paymentId && (
                                    <Typography variant="body2">
                                      Payment ID: {order.paymentId}
                                </Typography>
                                  )}
                              </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 1 }}>
                                    Order Items
                                  </Typography>
                                  <TableContainer component={Paper} elevation={0} sx={{ 
                                    backgroundColor: 'transparent',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    borderRadius: 2
                                  }}>
                                    <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Product</TableCell>
                                          <TableCell>Quantity</TableCell>
                                          <TableCell>Price</TableCell>
                                  <TableCell align="right">Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                        {(order.items || []).map((item, index) => (
                                          <TableRow key={`${order._id}-item-${index}`}>
                                            <TableCell>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {item.product?.thumbnailUrl && (
                                                  <Box
                                                    component="img"
                                                    src={item.product.thumbnailUrl}
                                                    alt={item.product?.name || 'Product'}
                                                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                                                  />
                                                )}
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                  {item.product?.name || 'Product'}
                                                </Typography>
                                              </Box>
                                    </TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{formatCurrency(item.price)}</TableCell>
                                            <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                          <TableCell colSpan={2} />
                                          <TableCell sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                                  <TableCell align="right">
                                            {formatCurrency(order.subtotal || order.totalAmount)}
                                  </TableCell>
                                        </TableRow>
                                        {order.shippingCost > 0 && (
                                          <TableRow>
                                            <TableCell colSpan={2} />
                                            <TableCell>Shipping</TableCell>
                                            <TableCell align="right">{formatCurrency(order.shippingCost)}</TableCell>
                                          </TableRow>
                                        )}
                                        {order.taxAmount > 0 && (
                                          <TableRow>
                                            <TableCell colSpan={2} />
                                            <TableCell>Tax</TableCell>
                                            <TableCell align="right">{formatCurrency(order.taxAmount)}</TableCell>
                                          </TableRow>
                                        )}
                                        <TableRow>
                                          <TableCell colSpan={2} />
                                          <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(order.totalAmount)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                                  </TableContainer>
                                </Grid>
                              </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
          <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
          count={totalOrders || filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '.MuiTablePagination-select': {
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.1),
            }
          }}
        />
      </GlassCard>

      {/* Status Update Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundImage: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }
        }}
      >
        <StyledDialogTitle>
          Update Order Status
        </StyledDialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, opacity: 0.8 }}>
                    Order ID: <span style={{ fontWeight: 600 }}>{selectedOrder._id}</span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Order Status"
                    name="status"
                    value={orderForm.status}
                    onChange={handleInputChange}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.05),
                      }
                    }}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Payment Status"
                    name="paymentStatus"
                    value={orderForm.paymentStatus}
                    onChange={handleInputChange}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.05),
                      }
                    }}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          )}
          </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
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
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              px: 3
            }}
          >
              Update
            </Button>
          </DialogActions>
        </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders; 