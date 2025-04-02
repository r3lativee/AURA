import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  useTheme,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  ShoppingBag as ShoppingBagIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  MonetizationOn as ProfitIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, productsAPI, authAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon, color, trend, percentage, subtitle }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                backgroundColor: `${color}.light`,
                color: `${color}.main`,
                height: 56,
                width: 56,
              }}
            >
              {icon}
            </Avatar>
          </Grid>
          <Grid item sx={{ flexGrow: 1 }}>
            <Typography color="textSecondary" variant="subtitle2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Grid>
        </Grid>
        {percentage !== undefined && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            {trend === 'up' ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              sx={{
                color: trend === 'up' ? 'success.main' : 'error.main',
                ml: 1,
                fontWeight: 'medium',
              }}
            >
              {percentage}%
            </Typography>
            <Typography variant="caption" sx={{ ml: 1 }}>
              Since last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    profit: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [timeframe, setTimeframe] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard data refreshed');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersStats, usersData, productsStats, revenueSales, topProducts, lowStockItems] = await Promise.all([
        ordersAPI.getStats(),
        authAPI.getStats(),
        productsAPI.getStats(),
        ordersAPI.getRevenueReport(timeframe),
        productsAPI.getTopSelling(),
        productsAPI.getLowStock(),
      ]);

      // Calculate profit (estimated as 30% of revenue)
      const profit = ordersStats.totalRevenue * 0.3;

      setStats({
        totalOrders: ordersStats.totalOrders || 0,
        totalUsers: usersData.totalUsers || 0,
        totalRevenue: ordersStats.totalRevenue || 0,
        profit: profit || 0,
        totalProducts: productsStats.totalProducts || 0,
      });

      // Process recent orders
      setRecentOrders(ordersStats.recentOrders || []);
      
      // Process sales and revenue data for charts
      setSalesData(revenueSales.salesData || []);
      setRevenueData(revenueSales.revenueData || []);
      
      // Set top selling products
      setTopSellingProducts(topProducts.products || []);
      
      // Set low stock products
      setLowStockProducts(lowStockItems.products || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here's a summary of your store performance and recent activity.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
            <Select
              labelId="timeframe-select-label"
              id="timeframe-select"
              value={timeframe}
              onChange={handleTimeframeChange}
              label="Timeframe"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingBagIcon />}
            color="primary"
            trend="up"
            percentage={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<AttachMoneyIcon />}
            color="success"
            trend="up"
            percentage={15}
            subtitle="Gross revenue from all sales"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profit"
            value={formatCurrency(stats.profit)}
            icon={<ProfitIcon />}
            color="info"
            trend="up"
            percentage={18}
            subtitle="Estimated net profit"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Customers"
            value={stats.totalUsers}
            icon={<PersonIcon />}
            color="warning"
            trend="up"
            percentage={8}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Revenue & Sales Overview
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Monthly performance
                </Typography>
              </Box>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                    <YAxis yAxisId="right" orientation="right" stroke={theme.palette.success.main} />
                    <ChartTooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={theme.palette.primary.main}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke={theme.palette.success.main}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Selling Products
              </Typography>
              {topSellingProducts.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: 200 
                }}>
                  <Typography color="text.secondary">
                    No product sales data available
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {topSellingProducts.map((product) => (
                    <ListItem key={product._id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={product.thumbnailUrl}
                          variant="rounded"
                          alt={product.name}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={product.name}
                        secondary={`${product.salesCount} units · ${formatCurrency(product.price * product.salesCount / 100)}`}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 