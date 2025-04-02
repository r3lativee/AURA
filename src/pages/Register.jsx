import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Register.css';
import { Container } from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const { registerRequest, verifyAndRegister, pendingRegistration } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

    setLoading(true);

    try {
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim().toLowerCase(),
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
    <Container component="main" maxWidth="md" sx={{ pt: '150px', pb: 8 }}>
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h2 className="register-title">Create Account</h2>
            <p className="register-subtitle">
              {showOtpForm 
                ? 'Enter the verification code sent to your email' 
                : 'Join our community of fashion enthusiasts'}
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error.split('\n').map((err, index) => (
                <div key={index}>{err}</div>
              ))}
            </div>
          )}

          {!showOtpForm ? (
            // Registration Form
            <form onSubmit={handleSubmit} className="register-form">
              <div className="name-row">
                <div className="form-group">
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
                </div>

                <div className="form-group">
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
                </div>
              </div>

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

              <div className="form-group">
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
              </div>

              <div className="password-requirements">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className={`requirement ${req.met ? 'met' : 'not-met'}`}>
                    <span className="requirement-icon">
                      {req.met ? '✓' : '○'}
                    </span>
                    {req.text}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="register-button"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </form>
          ) : (
            // OTP Verification Form
            <form onSubmit={handleVerifyOtp} className="register-form">
              <div className="otp-form-container">
                <p className="otp-instructions">
                  We've sent a verification code to <strong>{pendingRegistration?.email}</strong>
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
                      required
                    />
                  ))}
                </div>
                
                <div className="otp-actions">
                  <button
                    type="button"
                    className="resend-otp-button"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                  
                  <button
                    type="submit"
                    className="register-button"
                    disabled={loading || otp.join('').length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                  
                  <button
                    type="button"
                    className="back-button"
                    onClick={handleGoBack}
                    disabled={loading}
                  >
                    Back to Registration
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="login-link">
            Already have an account?
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Register; 