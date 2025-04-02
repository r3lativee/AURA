import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Login.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
    <Container component="main" maxWidth="md" sx={{ pt: '150px', pb: 8 }}>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">
              {showOtpVerification 
                ? "Enter the verification code sent to your email" 
                : "Sign in to continue shopping"}
            </p>
          </div>

          {error && <Alert severity="error" className="error-message">{error}</Alert>}

          <form onSubmit={showOtpVerification ? handleVerifyAndLogin : handleSubmit} className="login-form">
            {!showOtpVerification ? (
              // Email and Password Form
              <>
                <div className="form-group">
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
                </div>
                
                <div className="form-group">
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
                </div>

                <div className="forgot-password">
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? 'Sending Code...' : 'Sign In'}
                </button>
              </>
            ) : (
              // OTP Verification Form
              <>
                <div className="otp-section">
                  <p style={{ textAlign: 'center', color: '#a0a0a0', marginBottom: '15px' }}>
                    We've sent a verification code to <strong>{formData.email}</strong>
                  </p>
                  <div className="otp-inputs">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        className="otp-input"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <div className="resend-otp">
                    Didn't receive the code?
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      Resend
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    type="button"
                    className="login-button"
                    onClick={() => setShowOtpVerification(false)}
                    disabled={loading}
                    style={{ flex: '1', background: '#222222' }}
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                    style={{ flex: '1' }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="register-link">
            Don't have an account?
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Login; 