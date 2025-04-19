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
  Avatar,
  alpha,
  styled,
  useTheme,
  Snackbar,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { authAPI } from '../../services/api';
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

const Users = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await authAPI.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error.message || 'Failed to fetch users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      status: user.status || 'active',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setUserForm({
      name: '',
      email: '',
      role: '',
      status: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.updateUser(selectedUser._id, userForm);
      
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });
      
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to update user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update user',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      
      await authAPI.updateUser(userId, {
        status: newStatus
      });
      
      setSnackbar({
        open: true,
        message: `User ${newStatus === 'active' ? 'activated' : 'blocked'} successfully`,
        severity: 'success'
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update user status',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        await authAPI.deleteUser(userId);
        
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
        
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Failed to delete user',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    toast.success('Users list refreshed');
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

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'primary';
      case 'moderator':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    return (
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (loading && users.length === 0) {
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
            Users Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.8 }}>
            View and manage user accounts and permissions
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 2, md: 0 } }}>
          <TextField 
            placeholder="Search users..."
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

      {/* Users Table */}
      <GlassCard>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow>
                <StyledTableCell sx={{ fontWeight: 600 }}>User</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Email</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Role</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Status</StyledTableCell>
                <StyledTableCell sx={{ fontWeight: 600 }}>Joined</StyledTableCell>
                <StyledTableCell align="right" sx={{ fontWeight: 600 }}>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                      <Typography variant="h6" sx={{ opacity: 0.8, mb: 1 }}>No Users Found</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm 
                          ? 'Try adjusting your search criteria'
                          : 'There are no users in the system yet'}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <StyledTableRow key={user._id}>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={user.avatar}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                              background: !user.avatar ? alpha(theme.palette.primary.main, 0.15) : undefined,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          >
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {user.name || 'N/A'}
                            </Typography>
                            {user.lastLogin && (
                              <Typography variant="caption" color="text.secondary">
                                Last login: {formatDate(user.lastLogin)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>{user.email}</StyledTableCell>
                      <StyledTableCell>
                        <StyledChip
                          label={user.role || 'User'}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <StyledChip
                          label={user.status || 'Active'}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </StyledTableCell>
                      <StyledTableCell>{formatDate(user.createdAt)}</StyledTableCell>
                      <StyledTableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(user)}
                            sx={{ 
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={user.status === 'active' ? 'error' : 'success'}
                            onClick={() => handleToggleStatus(user._id, user.status)}
                            sx={{ 
                              backgroundColor: alpha(
                                user.status === 'active' ? theme.palette.error.main : theme.palette.success.main, 
                                0.1
                              ),
                              '&:hover': { 
                                backgroundColor: alpha(
                                  user.status === 'active' ? theme.palette.error.main : theme.palette.success.main, 
                                  0.2
                                ) 
                              }
                            }}
                          >
                            {user.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(user._id)}
                            sx={{ 
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
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

      {/* User Edit Dialog */}
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
          Edit User
        </StyledDialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedUser && (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Name"
                    fullWidth
                    value={userForm.name}
                    onChange={handleInputChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.05),
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email"
                    fullWidth
                    value={userForm.email}
                    onChange={handleInputChange}
                    disabled
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.05),
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="role"
                    label="Role"
                    select
                    fullWidth
                    value={userForm.role}
                    onChange={handleInputChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.05),
                      }
                    }}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="moderator">Moderator</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="status"
                    label="Status"
                    select
                    fullWidth
                    value={userForm.status}
                    onChange={handleInputChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.05),
                      }
                    }}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="blocked">Blocked</MenuItem>
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

export default Users; 