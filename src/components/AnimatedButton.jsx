import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import '../styles/components/AnimatedButton.css';

const AnimatedButton = ({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  variant = 'primary',
  disabled = false,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  const contentRef = useRef(null);
  const [contentPosition, setContentPosition] = useState({ x: 0, y: 0 });
  
  // Handle button hover effect - more subtle than before
  const handleMouseMove = (e) => {
    if (!buttonRef.current || disabled) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate position relative to center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate normalized distances (between -1 and 1)
    const normalizedX = (x - centerX) / (rect.width / 2);
    const normalizedY = (y - centerY) / (rect.height / 2);
    
    // Apply a very subtle movement to the content
    const contentX = normalizedX * 3; // Maximum 3px movement (very subtle)
    const contentY = normalizedY * 2; // Maximum 2px movement
    
    setContentPosition({ x: contentX, y: contentY });
  };
  
  const resetPosition = () => {
    if (disabled) return;
    setContentPosition({ x: 0, y: 0 });
  };
  
  const buttonVariants = {
    initial: {
      scale: 1,
    },
    hover: {
      scale: 1.01, // Very subtle scale effect
    },
    tap: {
      scale: 0.99,
    },
  };
  
  const buttonClasses = `animated-button ${variant} ${className} ${disabled ? 'disabled' : ''}`;
  
  return (
    <motion.div
      className="button-container"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        resetPosition();
      }}
    >
      <motion.button
        ref={buttonRef}
        className={buttonClasses}
        onClick={disabled ? undefined : onClick}
        type={type}
        disabled={disabled}
        variants={buttonVariants}
        initial="initial"
        animate={isHovered ? "hover" : "initial"}
        whileTap={disabled ? undefined : "tap"}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        {...props}
      >
        <motion.span 
          className="button-content"
          ref={contentRef}
          style={{
            x: contentPosition.x,
            y: contentPosition.y,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.span>
        
        {isHovered && !disabled && (
          <motion.div 
            className="button-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>
    </motion.div>
  );
};

export default AnimatedButton; 