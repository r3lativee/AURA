import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCircularProgressBar } from './magicui/animated-circular-progress-bar';
import { Globe } from './magicui/globe';

const LoadingScreen = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Animate progress from 0 to 100 over 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 90); // 90ms * 50 steps = ~4.5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Once progress reaches 100, trigger exit animation after a short delay
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onFinished) onFinished();
        }, 500); // Call onFinished after exit animation completes
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [progress, onFinished]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black z-50"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw'
          }}
        >
          {/* Loading animation container */}
          <div style={{ 
            position: 'relative',
            width: '400px',
            height: '400px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Globe component - positioned to fill the container */}
            <div style={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Globe className="w-full h-full" />
            </div>
            
            {/* Progress indicator - positioned absolutely to overlap the globe */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                position: 'absolute',
                zIndex: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <AnimatedCircularProgressBar 
                value={progress} 
                gaugePrimaryColor="#2575FC"
                gaugeSecondaryColor="#6A11CB"
                className="scale-150"
                showPercentage={false}
              />
            </motion.div>
          </div>
          
          {/* Text content */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-4xl font-bold text-white text-center mt-8"
          >
            Welcome to AURA
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-lg text-gray-300 text-center max-w-md mt-4"
          >
            For Men by Men. Made for the best, luxury and the best experience.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen; 