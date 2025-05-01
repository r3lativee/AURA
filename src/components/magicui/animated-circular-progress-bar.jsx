import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const AnimatedCircularProgressBar = ({
  min = 0,
  max = 100,
  value = 0,
  className = '',
  gaugePrimaryColor = '#6A11CB',
  gaugeSecondaryColor = '#2575FC',
  showPercentage = false
}) => {
  // Calculate progress percentage
  const percentage = ((value - min) / (max - min)) * 100;
  const [displayValue, setDisplayValue] = useState(0);
  
  // Animate the display value
  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayValue < value) {
        setDisplayValue(prev => Math.min(prev + 1, value));
      }
    }, 30);
    
    return () => clearTimeout(timer);
  }, [value, displayValue]);

  // Calculate the stroke dash offset based on the percentage
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: '120px', height: '120px' }}>
      <svg
        className="transform -rotate-90"
        width="120"
        height="120"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Inner glow effect */}
        <circle
          cx="50"
          cy="50"
          r={radius - 10}
          className="fill-none"
          style={{ 
            filter: 'blur(8px)',
            stroke: 'rgba(37, 117, 252, 0.2)',
            strokeWidth: 10
          }}
        />
        
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="fill-none"
          style={{ 
            stroke: 'rgba(0, 0, 0, 0.2)',
            strokeWidth: 2
          }}
        />
        
        {/* Progress circle with linear gradient */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="fill-none"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset,
            stroke: `url(#gradient-${className})`,
            transition: 'stroke-dashoffset 0.5s ease-in-out',
            strokeWidth: 2,
            strokeLinecap: 'round'
          }}
        />
        
        {/* Define the gradient */}
        <defs>
          <linearGradient
            id={`gradient-${className}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#2575FC" />
            <stop offset="100%" stopColor="#6A11CB" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Display the percentage in the center (optional) */}
      {showPercentage && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {displayValue}%
        </div>
      )}
    </div>
  );
}; 