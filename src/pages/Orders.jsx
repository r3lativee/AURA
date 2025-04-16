import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ordersAPI } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await ordersAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await ordersAPI.cancel(orderId);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#ffd54f';
      case 'processing':
        return '#81d4fa';
      case 'shipped':
        return '#e0e0e0';
      case 'delivered':
        return '#a5d6a7';
      case 'cancelled':
        return '#ef9a9a';
      default:
        return '#e0e0e0';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const rowVariant = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 } 
    }
  };

  if (loading) {
    return (
      <Container sx={{ pt: '160px', pb: 8, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={30} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: '160px', pb: 8, minHeight: '100vh' }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            fontWeight: 400, 
            fontSize: { xs: '1.8rem', sm: '2.2rem' },
            letterSpacing: '-0.5px',
            mb: 3
          }}
        >
          Orders
        </Typography>

        {orders.length === 0 ? (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              backgroundColor: '#050505',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 400,
                mb: 2 
              }}
            >
              You haven't placed any orders yet.
            </Typography>
            <Button
              variant="contained"
              href="/shop"
              sx={{
                padding: '10px 20px',
                textTransform: 'none',
                fontWeight: 400,
                borderRadius: '20px',
                backgroundColor: '#fff',
                color: '#000',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }
              }}
            >
              Browse Products
            </Button>
          </Paper>
        ) : (
          <TableContainer 
            component={Paper}
            sx={{ 
              backgroundColor: '#050505',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <TableCell sx={{ py: 1.8, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, borderBottom: 'none', width: '40px' }} />
                  <TableCell sx={{ py: 1.8, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, borderBottom: 'none' }}>Order ID</TableCell>
                  <TableCell sx={{ py: 1.8, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, borderBottom: 'none' }}>Date</TableCell>
                  <TableCell sx={{ py: 1.8, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, borderBottom: 'none' }}>Total</TableCell>
                  <TableCell sx={{ py: 1.8, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, borderBottom: 'none' }}>Status</TableCell>
                  <TableCell sx={{ py: 1.8, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, borderBottom: 'none' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody
                component={motion.tbody}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {orders.map((order) => (
                  <React.Fragment key={order._id}>
                    <TableRow 
                      component={motion.tr}
                      variants={rowVariant}
                      sx={{ 
                        borderBottom: expandedOrder === order._id ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.02)'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>
                        <IconButton
                          size="small"
                          onClick={() => setExpandedOrder(
                            expandedOrder === order._id ? null : order._id
                          )}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            padding: '4px'
                          }}
                        >
                          {expandedOrder === order._id ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          py: 2, 
                          color: '#fff',
                          fontWeight: 300,
                          fontSize: '0.9rem',
                          borderBottom: 'none'
                        }}
                      >
                        {order._id.substring(0, 8)}...
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          py: 2, 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 300,
                          fontSize: '0.9rem',
                          borderBottom: 'none'
                        }}
                      >
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          py: 2, 
                          color: '#fff',
                          fontWeight: 300,
                          fontSize: '0.9rem',
                          borderBottom: 'none'
                        }}
                      >
                        ${order.total.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1.2,
                            py: 0.5,
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 300,
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            color: getStatusColor(order.status),
                            border: `1px solid ${getStatusColor(order.status)}`,
                          }}
                        >
                          {order.status}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2, borderBottom: 'none' }} align="right">
                        {order.status === 'pending' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleCancelOrder(order._id)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 300,
                              fontSize: '0.8rem',
                              borderRadius: '20px',
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              color: 'rgba(255, 255, 255, 0.7)',
                              padding: '3px 10px',
                              '&:hover': {
                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)'
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: expandedOrder === order._id ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }} colSpan={6}>
                        <Collapse in={expandedOrder === order._id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2, pt: 1, pb: 2 }}>
                            <Typography 
                              variant="subtitle1" 
                              gutterBottom 
                              sx={{ 
                                fontWeight: 400,
                                fontSize: '1rem',
                                mb: 2,
                                color: '#fff'
                              }}
                            >
                              Order Details
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <Typography 
                                  variant="subtitle2" 
                                  gutterBottom
                                  sx={{ 
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontWeight: 300,
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                  }}
                                >
                                  Shipping Address
                                </Typography>
                                <Typography 
                                  variant="body2"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontWeight: 300,
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6
                                  }}
                                >
                                  {order.shippingAddress.name}<br />
                                  {order.shippingAddress.address1}<br />
                                  {order.shippingAddress.address2 && (
                                    <>{order.shippingAddress.address2}<br /></>
                                  )}
                                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                  {order.shippingAddress.country}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography 
                                  variant="subtitle2" 
                                  gutterBottom
                                  sx={{ 
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontWeight: 300,
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                  }}
                                >
                                  Payment Information
                                </Typography>
                                <Typography 
                                  variant="body2"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontWeight: 300,
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6
                                  }}
                                >
                                  Method: {order.paymentMethod}<br />
                                  Status: {order.paymentStatus}
                                </Typography>
                              </Grid>
                            </Grid>
                            <Box sx={{ mt: 3, mb: 1 }}>
                              <Typography 
                                variant="subtitle2"
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  fontWeight: 300,
                                  fontSize: '0.85rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px',
                                  mb: 1
                                }}
                              >
                                Order Items
                              </Typography>
                            </Box>
                            <Table size="small" sx={{ 
                              '& .MuiTableCell-root': {
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                              }
                            }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, fontSize: '0.8rem' }}>Product</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, fontSize: '0.8rem' }}>Size</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, fontSize: '0.8rem' }}>Color</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, fontSize: '0.8rem' }} align="right">Quantity</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, fontSize: '0.8rem' }} align="right">Price</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300, fontSize: '0.8rem' }} align="right">Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.items.map((item) => (
                                  <TableRow key={item._id}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 300, fontSize: '0.85rem' }}>{item.product.name}</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, fontSize: '0.85rem' }}>{item.size || '-'}</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, fontSize: '0.85rem' }}>{item.color || '-'}</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, fontSize: '0.85rem' }} align="right">{item.quantity}</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, fontSize: '0.85rem' }} align="right">
                                      ${item.product.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 300, fontSize: '0.85rem' }} align="right">
                                      ${(item.product.price * item.quantity).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell colSpan={4} sx={{ border: 'none' }} />
                                  <TableCell align="right" sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)', 
                                    fontWeight: 300,
                                    fontSize: '0.85rem',
                                    border: 'none',
                                    pt: 2
                                  }}>
                                    Subtotal<br />
                                    Shipping<br />
                                    <Box sx={{ color: '#fff', fontWeight: 400, mt: 1 }}>Total</Box>
                                  </TableCell>
                                  <TableCell align="right" sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)', 
                                    fontWeight: 300,
                                    fontSize: '0.85rem',
                                    border: 'none',
                                    pt: 2
                                  }}>
                                    ${order.subtotal.toFixed(2)}<br />
                                    ${order.shippingCost.toFixed(2)}<br />
                                    <Box sx={{ color: '#fff', fontWeight: 400, mt: 1 }}>
                                      ${order.total.toFixed(2)}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </motion.div>
    </Container>
  );
};

export default Orders; 