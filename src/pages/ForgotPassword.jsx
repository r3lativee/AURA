import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import '../styles/pages/ForgotPassword.css'; // Using dedicated styles instead of Register.css

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP Verification, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Request OTP from server
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/request-otp`, {
        email: email.trim().toLowerCase()
      });

      toast.success(response.data.message || 'Verification code sent to your email');
      setStep(2); // Move to OTP verification step
    } catch (err) {
      console.error('Request OTP error:', err);
      
      const errorMessage = err.response?.data?.message || 
                         'We could not find an account with that email address';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/request-otp`, {
        email: email.trim().toLowerCase()
      });
      
      setOtp(['', '', '', '', '', '']);
      toast.success(response.data.message || 'Verification code resent');
    } catch (err) {
      console.error('Resend OTP error:', err);
      const errorMessage = err.response?.data?.message || 
                          'Failed to resend verification code';
      setError(errorMessage);
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
      // Verify OTP
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-otp`, {
        email: email.trim().toLowerCase(),
        otp: otpValue
      });
      
      toast.success(response.data.message || 'Verification successful');
      setStep(3); // Move to password reset step
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMessage = err.response?.data?.message || 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const errors = [];

    if (newPassword !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    if (newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/\d/.test(newPassword)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      errors.push('Password must contain at least one special character');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      // Reset password
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
        email: email.trim().toLowerCase(),
        password: newPassword
      });

      toast.success(response.data.message || 'Password has been reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    {
      text: 'At least 8 characters',
      met: newPassword.length >= 8
    },
    {
      text: 'Contains a number',
      met: /\d/.test(newPassword)
    },
    {
      text: 'Contains a special character (!@#$%^&*)',
      met: /[!@#$%^&*]/.test(newPassword)
    },
    {
      text: 'Contains an uppercase letter',
      met: /[A-Z]/.test(newPassword)
    },
    {
      text: 'Passwords match',
      met: newPassword && newPassword === confirmPassword
    }
  ];

  return (
    <Container component="main" maxWidth="md" sx={{ pt: '150px', pb: 8 }}>
      <div className="forgot-password-page">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h2>Reset Password</h2>
            <p>
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && "Enter the verification code sent to your email"}
              {step === 3 && "Create a new password for your account"}
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error.split('\n').map((err, index) => (
                <div key={index}>{err}</div>
              ))}
            </div>
          )}

          {step === 1 && (
            // Email Form
            <form onSubmit={handleEmailSubmit} className="forgot-password-form">
              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            // OTP Verification Form
            <form onSubmit={handleVerifyOtp} className="forgot-password-form">
              <div className="otp-section">
                <p style={{ textAlign: 'center', color: '#a0a0a0', marginBottom: '15px' }}>
                  We've sent a verification code to <strong>{email}</strong>
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
                  className="submit-btn"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  style={{ flex: '1', background: '#222222' }}
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  style={{ flex: '1' }}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            // New Password Form
            <form onSubmit={handleResetPassword} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="password-requirements" style={{ margin: '10px 0 20px' }}>
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`requirement ${req.met ? 'met' : ''}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      fontSize: '0.85rem', 
                      marginBottom: '5px',
                      color: req.met ? '#4caf50' : '#a0a0a0'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>
                      {req.met ? '✓' : '○'}
                    </span>
                    {req.text}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="back-to-login">
            Remember your password?
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ForgotPassword; 