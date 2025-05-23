import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export const Marquee = ({
  children,
  className = '',
  reverse = false,
  pauseOnHover = true,
  vertical = false,
  repeat = 4,
  is3D = true,
  speed = 60, // Slower default speed (higher number = slower)
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (!scrollerRef.current || !containerRef.current) return;
    
    let scrollerContent = Array.from(scrollerRef.current.children);
    
    // If we need to repeat the items
    if (scrollerContent.length && repeat > 1) {
      const clonedItems = [];
      for (let i = 0; i < repeat - 1; i++) {
        const clonedNodes = scrollerContent.map((item) => item.cloneNode(true));
        clonedNodes.forEach((node) => {
          clonedItems.push(node);
        });
      }
      clonedItems.forEach((node) => {
        scrollerRef.current.appendChild(node);
      });
    }
  }, [repeat, children]);
  
  const renderMarquee = () => {
    // For 3D effect with transform
    if (is3D) {
      return (
        <div 
          ref={containerRef}
          className={`relative flex overflow-hidden ${vertical ? 'flex-col h-[500px]' : 'w-full'} ${className}`}
          style={{ 
            perspective: '600px', 
            transformStyle: 'preserve-3d',
            maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          }}
        >
          <motion.div
            ref={scrollerRef}
            className={`flex gap-4 ${vertical ? 'flex-col py-4' : 'py-4'} ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
            animate={{
              [vertical ? 'y' : 'x']: vertical
                ? reverse
                  ? ['0%', '-50%']
                  : ['-50%', '0%']
                : reverse
                  ? ['0%', '-50%']
                  : ['-50%', '0%'],
              rotateX: vertical ? 0 : 15, // Reduced tilt
              rotateY: vertical ? -15 : 0, // Reduced tilt
            }}
            transition={{
              ease: 'linear',
              duration: speed, // Use the speed prop
              repeat: Infinity,
              repeatType: 'loop',
            }}
            style={{
              willChange: 'transform',
              transformStyle: 'preserve-3d',
            }}
          >
            {children}
          </motion.div>
        </div>
      );
    }
  
    // Regular marquee
    return (
      <div 
        ref={containerRef}
        className={`relative flex overflow-hidden ${vertical ? 'flex-col h-[500px]' : 'w-full'} ${className}`}
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        <motion.div
          ref={scrollerRef}
          className={`flex gap-4 ${vertical ? 'flex-col py-4' : 'py-4'} ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
          animate={{
            [vertical ? 'y' : 'x']: vertical
              ? reverse
                ? ['0%', '-50%']
                : ['-50%', '0%']
              : reverse
                ? ['0%', '-50%']
                : ['-50%', '0%'],
          }}
          transition={{
            ease: 'linear',
            duration: speed, // Use the speed prop
            repeat: Infinity,
            repeatType: 'loop',
          }}
        >
          {children}
        </motion.div>
      </div>
    );
  };
  
  return renderMarquee();
}; 