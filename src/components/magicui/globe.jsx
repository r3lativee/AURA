import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

export const Globe = ({ className = '' }) => {
  const canvasRef = useRef();
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);
  
  useEffect(() => {
    let phi = 0;
    let width = 0;
    let globe;
    
    // Track pointer interactions for realistic movement
    const onPointerDown = (e) => {
      pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
      canvasRef.current.style.cursor = 'grabbing';
    };
    
    const onPointerUp = () => {
      pointerInteracting.current = null;
      canvasRef.current.style.cursor = 'grab';
    };
    
    const onPointerOut = () => {
      pointerInteracting.current = null;
      canvasRef.current.style.cursor = 'grab';
    };
    
    const onPointerMove = (e) => {
      if (pointerInteracting.current !== null) {
        const delta = e.clientX - pointerInteracting.current;
        pointerInteractionMovement.current = delta;
        phi += delta / 200;
      }
    };
    
    // Handle window resize
    const onResize = () => {
      if (globe) {
        globe.resize();
      }
    };
    
    // Update canvas
    const updateSize = () => {
      width = canvasRef.current.offsetWidth;
    };
    
    // Add event listeners
    canvasRef.current.addEventListener('pointerdown', onPointerDown);
    canvasRef.current.addEventListener('pointerup', onPointerUp);
    canvasRef.current.addEventListener('pointerout', onPointerOut);
    canvasRef.current.addEventListener('pointermove', onPointerMove);
    window.addEventListener('resize', onResize);
    
    // Set initial size
    updateSize();
    
    // Initialize globe
    globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 7.0,
      baseColor: [0.1, 0.1, 0.1],
      markerColor: [0.4, 0.7, 1],
      glowColor: [0.3, 0.5, 1],
      markers: [
        // Add your markers here
        { location: [26.2006, 92.9376], size: 0.07 }, // Assam (Dispur)
        { location: [28.6139, 77.2090], size: 0.06 }, // Delhi
        { location: [19.0760, 72.8777], size: 0.06 }, // Maharashtra (Mumbai)
        { location: [13.0827, 80.2707], size: 0.06 }, // Tamil Nadu (Chennai)
        { location: [12.9716, 77.5946], size: 0.06 }, // Karnataka (Bengaluru)
        { location: [22.5726, 88.3639], size: 0.06 }, // West Bengal (Kolkata)
        { location: [23.0225, 72.5714], size: 0.06 }, // Gujarat (Ahmedabad)
        { location: [17.3850, 78.4867], size: 0.06 }, // Telangana (Hyderabad)
        { location: [26.9124, 75.7873], size: 0.06 }, // Rajasthan (Jaipur)
        { location: [23.2599, 77.4126], size: 0.06 }, // Madhya Pradesh (Bhopal)
        { location: [20.2961, 85.8245], size: 0.06 }, // Odisha (Bhubaneswar)
        { location: [15.2993, 74.1240], size: 0.05 }, // Goa (Panaji)
      ],
      onRender: (state) => {
        // Auto-rotate the globe when not interacting
        if (pointerInteracting.current !== null) {
          // When users drag, we change phi
          state.phi = phi;
        } else {
          // Auto-rotate
          phi += 0.002;
          state.phi = phi;
        }
        state.width = width * 2;
        state.height = width * 2;
      }
    });
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('pointerdown', onPointerDown);
        canvasRef.current.removeEventListener('pointerup', onPointerUp);
        canvasRef.current.removeEventListener('pointerout', onPointerOut);
        canvasRef.current.removeEventListener('pointermove', onPointerMove);
      }
      window.removeEventListener('resize', onResize);
      if (globe) {
        globe.destroy();
      }
    };
  }, []);
  
  return (
    <div className={`relative ${className}`} style={{ filter: 'drop-shadow(0 0 35px rgba(32, 107, 255, 0.7))' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '1',
          cursor: 'grab',
          contain: 'layout paint size',
          opacity: 1,
        }}
      />
    </div>
  );
}; 