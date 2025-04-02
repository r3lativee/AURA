const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Verify required environment variables
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Create transporter with more detailed configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // For development only, remove in production
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

// Company Info for Email Templates
const companyInfo = {
  name: 'AURA 3D Store',
  logo: 'https://i.imgur.com/JzpuEZT.png', // Replace with your actual logo URL
  website: 'https://aura3dstore.com',
  address: '123 Tech Plaza, Innovation District, 10001',
  socials: {
    facebook: 'https://facebook.com/aura3dstore',
    instagram: 'https://instagram.com/aura3dstore',
    twitter: 'https://twitter.com/aura3dstore'
  },
  primaryColor: '#646cff',
  secondaryColor: '#1A1A1A',
  textColor: '#ffffff'
};

// Common footer for all emails
const getEmailFooter = () => `
  <div style="margin-top: 40px; padding: 20px; background-color: ${companyInfo.secondaryColor}; color: #a0a0a0; text-align: center; border-radius: 0 0 10px 10px;">
    <div style="margin-bottom: 15px;">
      <a href="${companyInfo.socials.facebook}" style="margin: 0 10px; color: #a0a0a0; text-decoration: none;">
        <img src="https://i.imgur.com/j1eWQQd.png" alt="Facebook" style="width: 24px; height: 24px;">
      </a>
      <a href="${companyInfo.socials.instagram}" style="margin: 0 10px; color: #a0a0a0; text-decoration: none;">
        <img src="https://i.imgur.com/V3UYGFT.png" alt="Instagram" style="width: 24px; height: 24px;">
      </a>
      <a href="${companyInfo.socials.twitter}" style="margin: 0 10px; color: #a0a0a0; text-decoration: none;">
        <img src="https://i.imgur.com/DrtIBJJ.png" alt="Twitter" style="width: 24px; height: 24px;">
      </a>
    </div>
    <p style="margin-bottom: 10px; font-size: 14px;">
      © ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.
    </p>
    <p style="margin-bottom: 5px; font-size: 12px;">${companyInfo.address}</p>
    <p style="font-size: 12px;">
      <a href="${companyInfo.website}" style="color: ${companyInfo.primaryColor}; text-decoration: none;">Visit our website</a>
    </p>
    <p style="margin-top: 15px; font-size: 11px; color: #777777;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
`;

// About the company section for emails
const getCompanyAbout = () => `
  <div style="margin-top: 30px; padding: 20px; background-color: rgba(255, 255, 255, 0.05); border-radius: 10px;">
    <h3 style="color: ${companyInfo.primaryColor}; margin-bottom: 15px;">About AURA 3D Store</h3>
    <p style="color: #d0d0d0; line-height: 1.6; margin-bottom: 15px;">
      AURA 3D Store is a premier destination for cutting-edge 3D printing products and accessories. 
      We specialize in offering high-quality filaments, innovative 3D printers, and meticulously 
      designed 3D models to transform your creative ideas into tangible reality.
    </p>
    <p style="color: #d0d0d0; line-height: 1.6;">
      Explore our extensive collection of products designed for both beginners and professional 
      creators. From educational resources to industrial-grade equipment, we're committed to 
      advancing the world of 3D printing technology.
    </p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${companyInfo.website}" style="display: inline-block; padding: 10px 20px; background-color: ${companyInfo.primaryColor}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore Our Collection</a>
    </div>
  </div>
`;

const sendVerificationEmail = async (email, code) => {
  try {
    console.log(`Attempting to send verification email to: ${email}`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `${companyInfo.name} - Verify Your Email`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121212; color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <div style="background-color: ${companyInfo.secondaryColor}; padding: 20px; text-align: center; border-bottom: 3px solid ${companyInfo.primaryColor};">
            <img src="${companyInfo.logo}" alt="${companyInfo.name}" style="max-width: 150px; margin-bottom: 10px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Verify Your Email</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background-color: #1e1e1e;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/8sRsCKr.png" alt="Email Verification" style="max-width: 100px;">
            </div>
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
              Thank you for registering with ${companyInfo.name}! To complete your registration and access your account, please verify your email using the code below:
            </p>
            
            <div style="background-color: #2a2a2a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 25px;">
              <h2 style="color: ${companyInfo.primaryColor}; font-size: 32px; letter-spacing: 5px; margin: 0; font-weight: 700;">${code}</h2>
            </div>
            
            <p style="color: #b0b0b0; font-size: 14px; line-height: 1.5; margin-bottom: 5px;">
              This verification code will expire in 10 minutes.
            </p>
            
            <p style="color: #b0b0b0; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              If you didn't create an account with us, please ignore this email.
            </p>
            
            ${getCompanyAbout()}
          </div>
          
          ${getEmailFooter()}
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', {
      error: error.message,
      stack: error.stack,
      email: email
    });
    return false;
  }
};

const sendOTP = async (email, otp) => {
  try {
    console.log(`Attempting to send OTP email to: ${email}`);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `${companyInfo.name} - Password Reset Code`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121212; color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <div style="background-color: ${companyInfo.secondaryColor}; padding: 20px; text-align: center; border-bottom: 3px solid ${companyInfo.primaryColor};">
            <img src="${companyInfo.logo}" alt="${companyInfo.name}" style="max-width: 150px; margin-bottom: 10px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background-color: #1e1e1e;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/J6QCqPL.png" alt="Password Reset" style="max-width: 100px;">
            </div>
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
              We received a request to reset your password. Use the verification code below to complete the password reset process:
            </p>
            
            <div style="background-color: #2a2a2a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 25px;">
              <h2 style="color: ${companyInfo.primaryColor}; font-size: 32px; letter-spacing: 5px; margin: 0; font-weight: 700;">${otp}</h2>
            </div>
            
            <p style="color: #b0b0b0; font-size: 14px; line-height: 1.5; margin-bottom: 5px;">
              This verification code will expire in 10 minutes.
            </p>
            
            <p style="color: #b0b0b0; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              If you didn't request a password reset, please contact our support team immediately or ignore this email.
            </p>
            
            <div style="text-align: center; margin-top: 20px; margin-bottom: 25px;">
              <a href="${companyInfo.website}/login" style="display: inline-block; padding: 12px 24px; background-color: ${companyInfo.primaryColor}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Back to Login</a>
            </div>
            
            ${getCompanyAbout()}
          </div>
          
          ${getEmailFooter()}
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', {
      error: error.message,
      stack: error.stack,
      email: email
    });
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendOTP
}; 