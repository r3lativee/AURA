import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, TextField, Box, InputAdornment, IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Login.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Lottie from 'lottie-react';
import loginAnimation from '../assets/animations/login-animation.json';

const Login = () => {
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1
      } 
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 22 
      }
    },
    hover: { 
      scale: 1.03, 
      boxShadow: "0 8px 15px rgba(0, 0, 0, 0.3)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.97 }
  };

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const handleOtpChange = (value, index) => {
    // Only allow numeric input
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Instead of directly logging in, request OTP first
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/request-otp`, {
        email: formData.email.trim().toLowerCase()
      });
      
      toast.success('Verification code sent to your email');
      setShowOtpVerification(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    
    // Validate OTP
    const otpValue = otp.join('');
    if (otpValue.length !== 6 || !/^\d+$/.test(otpValue)) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      // First verify the OTP
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-otp`, {
        email: formData.email.trim().toLowerCase(),
        otp: otpValue
      });
      
      // Then proceed with login
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid verification code or credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/request-otp`, {
        email: formData.email.trim().toLowerCase()
      });
      
      setOtp(['', '', '', '', '', '']);
      toast.success('Verification code resent to your email');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ pt: '120px', pb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="login-container"
      >
        <motion.div
          className="login-card"
          variants={itemVariants}
        >
          <motion.div 
            className="lottie-container"
            variants={itemVariants}
            custom={1}
          >
            <Lottie 
              animationData={loginAnimation} 
              className="login-animation" 
            />
          </motion.div>

          <motion.div variants={itemVariants} custom={2}>
            <Typography variant="h4" component="h1" className="login-header">
              Login
            </Typography>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="error" className="error-message">{error}</Alert>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!showOtpVerification ? (
              // Email and Password Form
              <motion.form 
                key="login-form"
                onSubmit={handleSubmit} 
                className="login-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div className="form-group" variants={itemVariants}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="email" className="form-label">Email</label>
                </motion.div>
                
                <motion.div className="form-group" variants={itemVariants}>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-input"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="password" className="form-label">Password</label>
                </motion.div>

                <motion.div 
                  className="forgot-password" 
                  variants={itemVariants}
                >
                  <Link to="/forgot-password">Forgot Password?</Link>
                </motion.div>

                <motion.button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {loading ? 'Sending Code...' : 'Sign In'}
                </motion.button>
                
                <motion.div 
                  className="register-link"
                  variants={itemVariants}
                >
                  Don't have an account?
                  <Link to="/register">Sign up</Link>
                </motion.div>
              </motion.form>
            ) : (
              // OTP Verification Form
              <motion.form 
                key="otp-form"
                onSubmit={handleVerifyAndLogin} 
                className="login-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div 
                  className="otp-section"
                  variants={itemVariants}
                >
                  <motion.p 
                    style={{ textAlign: 'center', color: '#a0a0a0', marginBottom: '15px' }}
                    variants={itemVariants}
                  >
                    We've sent a verification code to <strong>{formData.email}</strong>
                  </motion.p>
                  <motion.div 
                    className="otp-inputs"
                    variants={itemVariants}
                  >
                    {otp.map((digit, index) => (
                      <motion.input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        className="otp-input"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        autoFocus={index === 0}
                        variants={itemVariants}
                        whileFocus={{ scale: 1.05, borderColor: "#646cff" }}
                      />
                    ))}
                  </motion.div>
                  <motion.div 
                    className="resend-otp"
                    variants={itemVariants}
                  >
                    Didn't receive the code?
                    <motion.button
                      type="button"
                      className="resend-btn"
                      onClick={handleResendOtp}
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Resend
                    </motion.button>
                  </motion.div>
                </motion.div>

                <motion.div 
                  style={{ display: 'flex', gap: '15px' }}
                  variants={itemVariants}
                >
                  <motion.button
                    type="button"
                    className="login-button"
                    onClick={() => setShowOtpVerification(false)}
                    disabled={loading}
                    style={{ flex: '1', background: '#222222' }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                    style={{ flex: '1' }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </motion.button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default Login; 