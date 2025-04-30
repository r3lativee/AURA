import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Register.css';
import { Container, Typography, Button, TextField, Box, InputAdornment, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import registerAnimation from '../assets/animations/register-animation.json';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const { registerRequest, verifyAndRegister, pendingRegistration } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

  // Check if there is a pending registration and show OTP form
  useEffect(() => {
    if (pendingRegistration) {
      setShowOtpForm(true);
    }
  }, [pendingRegistration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
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

  const validatePhone = () => {
    const phoneNumber = formData.phoneNumber.replace(/[^0-9]/g, '');
    return phoneNumber.length >= 10 && phoneNumber.length <= 15;
  };

  const validatePassword = () => {
    const { password, confirmPassword } = formData;
    const errors = [];

    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    if (!validatePhone()) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.replace(/[^0-9]/g, ''),
        password: formData.password
      };

      console.log('Submitting registration data:', { ...userData, password: '[REDACTED]' });
      
      // Request OTP instead of registering directly
      const response = await registerRequest(userData);
      console.log('OTP request successful, showing OTP form');
      setOtpSent(true);
      setShowOtpForm(true);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Status code:', err.response.status);
        
        const serverMessage = err.response.data?.message || 
                             (err.response.data?.errors && err.response.data.errors[0]?.msg) ||
                             'Server validation failed';
        setError(serverMessage);
      } else if (err.errors) {
        setError(Object.values(err.errors).join('\n'));
      } else {
        setError(err.message || 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate OTP
    const otpValue = otp.join('');
    if (otpValue.length !== 6 || !/^\d+$/.test(otpValue)) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      // Complete registration with OTP verification
      await verifyAndRegister(otpValue);
    } catch (err) {
      console.error('OTP verification error:', err);
      if (err.response) {
        const serverMessage = err.response.data?.message || 'Verification failed';
        setError(serverMessage);
      } else {
        setError(err.message || 'An error occurred during verification');
      }
      // Don't reset the form on error
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    
    try {
      if (!pendingRegistration) {
        setError('No pending registration found. Please start over.');
        return;
      }
      
      const userData = {
        name: pendingRegistration.name,
        email: pendingRegistration.email,
        password: pendingRegistration.password
      };
      
      await registerRequest(userData);
      setOtp(['', '', '', '', '', '']);
      setError('');
      setOtpSent(true);
    } catch (err) {
      console.error('Resend OTP error:', err);
      if (err.response) {
        const serverMessage = err.response.data?.message || 'Failed to resend verification code';
        setError(serverMessage);
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setShowOtpForm(false);
    setOtp(['', '', '', '', '', '']);
  };

  const passwordRequirements = [
    {
      text: 'At least 8 characters',
      met: formData.password.length >= 8
    },
    {
      text: 'Contains a number',
      met: /\d/.test(formData.password)
    },
    {
      text: 'Contains a special character (!@#$%^&*)',
      met: /[!@#$%^&*]/.test(formData.password)
    },
    {
      text: 'Contains an uppercase letter',
      met: /[A-Z]/.test(formData.password)
    },
    {
      text: 'Passwords match',
      met: formData.password && formData.password === formData.confirmPassword
    }
  ];

  // Debug info - remove in production
  console.log('Render state:', { showOtpForm, otpSent, pendingRegistration: !!pendingRegistration });

  return (
    <Container component="main" maxWidth="sm" sx={{ pt: '120px', pb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="register-container"
      >
        <motion.div
          className="register-card"
          variants={itemVariants}
        >
          <motion.div 
            className="lottie-container"
            variants={itemVariants}
            custom={1}
          >
            <Lottie 
              animationData={registerAnimation} 
              className="register-animation" 
            />
          </motion.div>

          <motion.div variants={itemVariants} custom={2}>
            <Typography variant="h4" component="h1" className="register-header">
              Create Account
            </Typography>
          </motion.div>

          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error.split('\n').map((err, index) => (
                <div key={index}>{err}</div>
              ))}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!showOtpForm ? (
              <motion.form 
                key="register-form"
                onSubmit={handleSubmit} 
                className="register-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div 
                  className="name-row"
                  variants={itemVariants}
                >
                  <motion.div className="form-group" variants={itemVariants}>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="form-input"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder=" "
                      required
                    />
                    <label htmlFor="firstName" className="form-label">First Name</label>
                  </motion.div>
                  
                  <motion.div className="form-group" variants={itemVariants}>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="form-input"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder=" "
                      required
                    />
                    <label htmlFor="lastName" className="form-label">Last Name</label>
                  </motion.div>
                </motion.div>
                
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
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    className="form-input"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                  <div className="input-hint">10-15 digits</div>
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
                
                <motion.div className="form-group" variants={itemVariants}>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                </motion.div>

                <motion.div 
                  className="password-requirements"
                  variants={itemVariants}
                >
                  {passwordRequirements.map((req, index) => (
                    <motion.div 
                      key={index} 
                      className={`requirement ${req.met ? 'met' : ''}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <span className="requirement-icon">
                        {req.met ? '✓' : '○'}
                      </span>
                      {req.text}
                    </motion.div>
                  ))}
                </motion.div>

                <motion.button
                  type="submit"
                  className="register-button"
                  disabled={loading}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {loading ? 'Processing...' : 'Create Account'}
                </motion.button>
                
                <motion.div 
                  className="login-link"
                  variants={itemVariants}
                >
                  Already have an account?
                  <Link to="/login">Sign In</Link>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div 
                key="otp-form"
                className="otp-form-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.p 
                  className="otp-instructions"
                  variants={itemVariants}
                >
                  We've sent a verification code to <strong>{pendingRegistration?.email}</strong>
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
                  className="otp-actions"
                  variants={itemVariants}
                >
                  <motion.button
                    type="button"
                    className="resend-otp-button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Resend verification code
                  </motion.button>
                </motion.div>
                
                <motion.div 
                  style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '20px' }}
                  variants={itemVariants}
                >
                  <motion.button
                    type="button"
                    className="register-button back-button"
                    onClick={handleGoBack}
                    style={{ flex: '1', background: '#222222' }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Back
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="register-button"
                    disabled={loading}
                    style={{ flex: '1' }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {loading ? 'Verifying...' : 'Complete Registration'}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default Register; 