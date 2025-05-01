import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// Circular cursor
const CircularCursorSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="white" />
  </svg>
);

// Dot that follows the cursor with a slight delay
const CursorDot = ({ springConfig }) => {
  const dotX = useMotionValue(0);
  const dotY = useMotionValue(0);
  
  const springDotX = useSpring(dotX, {
    ...springConfig,
    damping: springConfig.damping * 1.5, // Slower dot for trail effect
  });
  
  const springDotY = useSpring(dotY, {
    ...springConfig,
    damping: springConfig.damping * 1.5, // Slower dot for trail effect
  });
  
  useEffect(() => {
    const updateDotPosition = (e) => {
      const { clientX, clientY } = e;
      dotX.set(clientX);
      dotY.set(clientY);
    };
    
    document.addEventListener('mousemove', updateDotPosition);
    
    return () => {
      document.removeEventListener('mousemove', updateDotPosition);
    };
  }, [dotX, dotY]);
  
  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: springDotX,
        y: springDotY,
        width: '4px',
        height: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: '50%',
        zIndex: 9999,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
};

export const SmoothCursor = ({
  cursor = <CircularCursorSVG />,
  springConfig = {
    damping: 25,
    stiffness: 300,
    mass: 0.5,
    restDelta: 0.001,
  },
  showDot = true,
}) => {
  const cursorRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isOverClickable, setIsOverClickable] = useState(false);

  // Motion values for cursor position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Create springs for smooth animation
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Track previous position for velocity calculation
  const prevX = useRef(0);
  const prevY = useRef(0);

  useEffect(() => {
    const updateMousePosition = (e) => {
      const { clientX, clientY } = e;
      
      // Update mouse position
      mouseX.set(clientX);
      mouseY.set(clientY);
      
      // Store current position for next frame
      prevX.current = clientX;
      prevY.current = clientY;
      
      // Show cursor when mouse moves
      if (!isVisible) {
        setIsVisible(true);
      }
    };
    
    const handleMouseDown = () => {
      setIsClicking(true);
    };
    
    const handleMouseUp = () => {
      setIsClicking(false);
    };
    
    const handleMouseLeave = () => {
      setIsVisible(false);
    };
    
    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Check if mouse is over a clickable element
    const checkClickableElement = (e) => {
      const target = e.target;
      const clickableElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
      const isClickable = 
        clickableElements.includes(target.tagName) || 
        target.getAttribute('role') === 'button' || 
        target.onclick || 
        target.closest('a, button, [role="button"]');
      
      setIsOverClickable(!!isClickable);
    };

    // Attach event listeners
    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mousemove', checkClickableElement);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Hide the default cursor
    const style = document.createElement('style');
    style.textContent = `
      * {
        cursor: none !important;
      }
      a, button, [role="button"], input, select, textarea, [onclick] {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup event listeners
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mousemove', checkClickableElement);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.head.removeChild(style);
    };
  }, [mouseX, mouseY, isVisible]);

  // Don't render on server
  if (typeof window === 'undefined') return null;

  return (
    <>
      {showDot && <CursorDot springConfig={springConfig} />}
      
      <motion.div
        ref={cursorRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          x: springX,
          y: springY,
          scale: isClicking ? 0.8 : 1,
          zIndex: 9999,
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isVisible ? 1 : 0,
          scale: isClicking ? 0.8 : 1,
        }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { duration: 0.1 },
        }}
      >
        {isOverClickable ? (
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="14" cy="14" r="9" stroke="white" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4" fill="white" />
          </svg>
        ) : (
          cursor
        )}
      </motion.div>
    </>
  );
}; 