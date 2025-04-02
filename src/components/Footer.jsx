import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiMail, FiMapPin } from 'react-icons/fi';
import '../styles/components/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <div className="branding">
            <h2 className="footer-brand">AURA</h2>
            <p className="tagline">Elevate Your Grooming Game</p>
          </div>
          <div className="quick-links">
            <h3>Quick Links</h3>
            <nav>
              <Link to="/">Home</Link>
              <Link to="/products">Products</Link>
              <Link to="/cart">Cart</Link>
              <Link to="/admin">Admin Panel</Link>
            </nav>
          </div>
        </div>
        <div className="footer-center">
          <div className="contact-info">
            <h3>Contact Information</h3>
            <div className="contact-details">
              <a href="mailto:shashankagogoi25@gmail.com" className="contact-item">
                <FiMail />
                <span>shashankagogoi25@gmail.com</span>
              </a>
              <a href="https://linkedin.com/in/ShashankaGogoi" target="_blank" rel="noopener noreferrer" className="contact-item">
                <FiLinkedin />
                <span>Shashanka Gogoi</span>
              </a>
              <a href="https://github.com/ShashankaGogoi" target="_blank" rel="noopener noreferrer" className="contact-item">
                <FiGithub />
                <span>ShashankaGogoi</span>
              </a>
              <div className="contact-item">
                <FiMapPin />
                <span>Don Bosco University, Azara, Guwahati, Assam</span>
              </div>
              <a 
                href="https://maps.google.com/?q=Don+Bosco+University+Azara+Guwahati+Assam" 
                target="_blank" 
                rel="noopener noreferrer"
                className="map-link"
              >
                View on Google Maps →
              </a>
            </div>
          </div>
        </div>
        <div className="footer-right">
          <div className="social-links">
            <h3>Connect With Us</h3>
            <div className="social-icons">
              <a href="https://github.com/ShashankaGogoi" target="_blank" rel="noopener noreferrer">
                <FiGithub />
              </a>
              <a href="https://linkedin.com/in/ShashankaGogoi" target="_blank" rel="noopener noreferrer">
                <FiLinkedin />
              </a>
              <a href="mailto:shashankagogoi25@gmail.com">
                <FiMail />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-nav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/cookies">Cookie Policy</Link>
        </div>
        <p className="copyright">© 2025 Aura. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 