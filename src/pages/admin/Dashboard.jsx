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
  alpha,
  styled
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
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px 0 rgba(0, 0, 0, 0.1)',
  }
}));

const StatIcon = styled(Avatar)(({ theme, bgColor }) => ({
  backgroundColor: alpha(theme.palette[bgColor].main, 0.15),
  color: theme.palette[bgColor].main,
  width: 64,
  height: 64,
  borderRadius: 16,
  boxShadow: `0 4px 14px 0 ${alpha(theme.palette[bgColor].main, 0.2)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: 28,
  }
}));

const GradientBackground = styled(Box)(({ theme, startColor, endColor }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '100%',
  opacity: 0.05,
  borderRadius: 16,
  background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
  zIndex: 0,
}));

const StatCard = ({ title, value, icon, color, percentage, subtitle, timeframeText }) => {
  const theme = useTheme();
  
  // Determine trend direction based on percentage
  const trendDirection = percentage >= 0 ? 'up' : 'down';
  const displayPercentage = Math.abs(percentage || 0);

  // Define gradient colors based on the status color
  const gradientColors = {
    primary: { start: '#2196f3', end: '#21CBF3' },
    success: { start: '#66BB6A', end: '#43A047' },
    info: { start: '#29B6F6', end: '#0288D1' },
    warning: { start: '#FFA726', end: '#F57C00' },
    error: { start: '#EF5350', end: '#C62828' },
  };
  
  return (
    <GlassCard>
      <GradientBackground 
        startColor={gradientColors[color]?.start || '#000'} 
        endColor={gradientColors[color]?.end || '#000'} 
      />
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <StatIcon bgColor={color}>
              {icon}
            </StatIcon>
          </Grid>
          <Grid item sx={{ flexGrow: 1 }}>
            <Typography 
              color="textSecondary" 
              variant="subtitle2" 
              sx={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                opacity: 0.7, 
                mb: 0.5,
                letterSpacing: 0.5 
              }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="700" letterSpacing={0.2}>{value}</Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary" sx={{ opacity: 0.7, fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
          </Grid>
        </Grid>
        
        {percentage !== undefined && (
          <Box sx={{ 
            mt: 2.5, 
            display: 'flex', 
            alignItems: 'center', 
            p: 1, 
            borderRadius: 1.5,
            backgroundColor: alpha(
              theme.palette[trendDirection === 'up' ? 'success' : 'error'].main, 
              0.1
            ),
            width: 'fit-content'
          }}>
            {trendDirection === 'up' ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              sx={{
                color: theme.palette[trendDirection === 'up' ? 'success' : 'error'].main,
                ml: 0.75,
                fontWeight: 'medium',
                fontSize: '0.8rem'
              }}
            >
              {displayPercentage.toFixed(1)}%
            </Typography>
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.7, fontSize: '0.7rem' }}>
              Since last {timeframeText}
            </Typography>
          </Box>
        )}
      </CardContent>
    </GlassCard>
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
      
      // Track previous stats for change percentage calculation
      const prevStats = { ...stats };
      
      // Fetch all required data using Promise.all for parallel requests
      const [ordersResponse, usersResponse, productsResponse, revenueResponse, topProductsResponse, lowStockResponse] = await Promise.all([
        ordersAPI.getStats(),
        authAPI.getStats(),
        productsAPI.getStats(),
        ordersAPI.getRevenueReport(timeframe),
        productsAPI.getTopSelling(),
        productsAPI.getLowStock(),
      ]);
      
      // Extract data from responses
      const ordersData = ordersResponse.data || {};
      const usersData = usersResponse.data || {};
      const productsData = productsResponse.data || {};
      const revenueData = revenueResponse.data || {};
      
      // Calculate profit - In real world, this would come from the API
      // For now using a 30% profit margin estimate
      const totalRevenue = ordersData.totalRevenue || 0;
      const profit = totalRevenue * 0.3;
      
      // Calculate growth percentages (compared to previous period)
      const orderGrowth = calculateGrowthPercentage(
        prevStats.totalOrders, 
        ordersData.totalOrders || 0
      );
      
      const revenueGrowth = calculateGrowthPercentage(
        prevStats.totalRevenue, 
        totalRevenue
      );
      
      const profitGrowth = calculateGrowthPercentage(
        prevStats.profit, 
        profit
      );
      
      const userGrowth = calculateGrowthPercentage(
        prevStats.totalUsers, 
        usersData.totalUsers || 0
      );
      
      // Update stats state
      setStats({
        totalOrders: ordersData.totalOrders || 0,
        totalUsers: usersData.totalUsers || 0,
        totalRevenue: totalRevenue,
        profit: profit,
        totalProducts: productsData.totalProducts || 0,
        orderGrowth,
        revenueGrowth,
        profitGrowth,
        userGrowth
      });
      
      // Update other states
      setRecentOrders(ordersData.recentOrders || []);
      setSalesData(revenueData.salesData || getDefaultChartData());
      setRevenueData(revenueData.revenueData || getDefaultChartData());
      setTopSellingProducts(topProductsResponse.data?.products || []);
      setLowStockProducts(lowStockResponse.data?.products || []);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to calculate growth percentage
  const calculateGrowthPercentage = (oldValue, newValue) => {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    const growth = ((newValue - oldValue) / oldValue) * 100;
    return parseFloat(growth.toFixed(1));
  };
  
  // Helper function to generate default chart data if API returns empty
  const getDefaultChartData = () => {
    return [
      { name: 'Jan', revenue: 0, sales: 0, profit: 0 },
      { name: 'Feb', revenue: 0, sales: 0, profit: 0 },
      { name: 'Mar', revenue: 0, sales: 0, profit: 0 },
      { name: 'Apr', revenue: 0, sales: 0, profit: 0 },
      { name: 'May', revenue: 0, sales: 0, profit: 0 },
      { name: 'Jun', revenue: 0, sales: 0, profit: 0 },
    ];
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
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.8 }}>
            Here's a summary of your store performance and recent activity.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 2, md: 0 } }}>
          <FormControl 
            variant="outlined" 
            size="small" 
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

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingBagIcon />}
            color="primary"
            percentage={stats.orderGrowth}
            timeframeText={timeframe === 'daily' ? 'day' : 
                           timeframe === 'weekly' ? 'week' : 
                           timeframe === 'yearly' ? 'year' : 'month'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<AttachMoneyIcon />}
            color="success"
            percentage={stats.revenueGrowth}
            subtitle="Gross revenue from all sales"
            timeframeText={timeframe === 'daily' ? 'day' : 
                           timeframe === 'weekly' ? 'week' : 
                           timeframe === 'yearly' ? 'year' : 'month'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profit"
            value={formatCurrency(stats.profit)}
            icon={<ProfitIcon />}
            color="info"
            percentage={stats.profitGrowth}
            subtitle="Estimated net profit"
            timeframeText={timeframe === 'daily' ? 'day' : 
                           timeframe === 'weekly' ? 'week' : 
                           timeframe === 'yearly' ? 'year' : 'month'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Customers"
            value={stats.totalUsers}
            icon={<PersonIcon />}
            color="warning"
            percentage={stats.userGrowth}
            timeframeText={timeframe === 'daily' ? 'day' : 
                           timeframe === 'weekly' ? 'week' : 
                           timeframe === 'yearly' ? 'year' : 'month'}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <GlassCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Revenue & Sales Overview
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ opacity: 0.7 }}>
                    Monthly performance
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ height: 400, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: theme.palette.text.secondary }} 
                      axisLine={{ stroke: theme.palette.divider }} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      stroke={theme.palette.primary.main}
                      tick={{ fill: theme.palette.text.secondary }}
                      axisLine={{ stroke: theme.palette.divider }} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke={theme.palette.success.main}
                      tick={{ fill: theme.palette.text.secondary }}
                      axisLine={{ stroke: theme.palette.divider }} 
                    />
                    <ChartTooltip 
                      contentStyle={{ 
                        backgroundColor: alpha(theme.palette.background.paper, 0.9),
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: 'none'
                      }} 
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      activeDot={{ r: 8, strokeWidth: 0, fill: theme.palette.primary.main }}
                      dot={{ r: 0 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke={theme.palette.success.main}
                      strokeWidth={3}
                      activeDot={{ r: 8, strokeWidth: 0, fill: theme.palette.success.main }}
                      dot={{ r: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} lg={4}>
          <GlassCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Selling Products
                </Typography>
                <IconButton size="small" sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              {topSellingProducts.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: 200,
                  backgroundColor: alpha(theme.palette.background.paper, 0.3),
                  borderRadius: 2,
                  mt: 2
                }}>
                  <Typography color="text.secondary" sx={{ opacity: 0.7 }}>
                    No product sales data available
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0, mt: 1 }}>
                  {topSellingProducts.map((product, index) => (
                    <React.Fragment key={product._id}>
                      <ListItem sx={{ 
                        px: 1, 
                        py: 1.5,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}>
                        <ListItemAvatar>
                          <Avatar
                            src={product.thumbnailUrl}
                            variant="rounded"
                            alt={product.name}
                            sx={{ 
                              width: 50, 
                              height: 50, 
                              borderRadius: 2,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={product.name}
                          secondary={`${product.salesCount} units · ${formatCurrency(product.price * product.salesCount / 100)}`}
                          primaryTypographyProps={{ 
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            mb: 0.5
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: alpha(theme.palette.text.secondary, 0.8)
                          }}
                        />
                      </ListItem>
                      {index < topSellingProducts.length - 1 && (
                        <Divider sx={{ opacity: 0.1, my: 0.5 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 