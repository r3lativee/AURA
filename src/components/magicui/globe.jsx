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
      mapBrightness: 2.0,
      baseColor: [0.1, 0.1, 0.1],
      markerColor: [0.4, 0.7, 1],
      glowColor: [0.3, 0.5, 1],
      markers: [
        // Add your markers here
        { location: [37.7595, -122.4367], size: 0.05 }, // San Francisco
        { location: [40.7128, -74.006], size: 0.05 }, // New York
        { location: [51.5074, -0.1278], size: 0.05 }, // London
        { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
        { location: [22.3193, 114.1694], size: 0.05 }, // Hong Kong
      ],
      onRender: (state) => {
        // Auto-rotate the globe when not interacting
        if (pointerInteracting.current !== null) {
          // When users drag, we change phi
          state.phi = phi;
        } else {
          // Auto-rotate
          phi += 0.003;
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