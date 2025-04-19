import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// Default model path - ensure this file exists in the public folder
const DEFAULT_MODEL_URL = '/models/ftm.glb';

// Preload the default model to improve performance
try {
  useGLTF.preload(DEFAULT_MODEL_URL);
} catch (err) {
  console.error("Failed to preload default model:", err);
}

// Model component that handles the actual 3D model rendering
function Model({ url, onError }) {
  const ref = useRef();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState(false);
  
  // Set up model URL with fallback pattern
  useEffect(() => {
    // Check if the provided URL is valid and use it, otherwise fall back to default
    if (url && typeof url === 'string') {
      setCurrentUrl(url);
    } else {
      setCurrentUrl(DEFAULT_MODEL_URL);
    }
  }, [url]);
  
  // Use a safe loading mechanism for the GLB file
  const { scene } = (() => {
    try {
      if (!currentUrl) return { scene: null }; // Don't try to load if URL is empty
      
      // Attempt to use useGLTF hook with error handling
      return useGLTF(currentUrl, 
        // Success callback
        () => {
          console.log(`Successfully loaded model: ${currentUrl}`);
          setModelLoaded(true);
          setError(false);
        },
        // Error callback
        (e) => {
          console.error(`Failed to load model from ${currentUrl}:`, e);
          setError(true);
          
          // If not already using default model, try to fall back to it
          if (currentUrl !== DEFAULT_MODEL_URL) {
            console.log(`Falling back to default model: ${DEFAULT_MODEL_URL}`);
            setCurrentUrl(DEFAULT_MODEL_URL);
          } else {
            // If even the default model fails, notify parent component
            console.error("Both custom and default models failed to load");
            if (onError) onError();
          }
        }
      );
    } catch (e) {
      console.error("Exception during model loading:", e);
      setError(true);
      if (onError) onError();
      return { scene: null };
    }
  })();
  
  // Set up the model to cast and receive shadows
  useEffect(() => {
    if (ref.current && scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Enhance material properties for better visual appearance
          if (child.material) {
            child.material.roughness = Math.min(child.material.roughness || 0.5, 0.7);
            child.material.metalness = Math.max(child.material.metalness || 0, 0.3);
          }
        }
      });
    }
  }, [scene]);
  
  // No scene available, render fallback geometry
  if (error || !scene) {
    return (
      <mesh>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial 
          color="#4a90e2" 
          wireframe={true} 
        />
      </mesh>
    );
  }
  
  // Add smooth animation to the model
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      
      // Smooth rotation on Y axis
      ref.current.rotation.y = Math.sin(t * 0.3) * 0.2 + Math.PI / 4;
      
      // Subtle floating movement
      ref.current.position.y = Math.sin(t * 0.8) * 0.05 - 1;
      
      // Very subtle tilt
      ref.current.rotation.z = Math.sin(t * 0.2) * 0.05;
    }
  });
  
  return <primitive ref={ref} object={scene} scale={[1.2, 1.2, 1.2]} position={[0, -1, 0]} />;
}

// Error boundary component - provides a fallback visualization 
function ModelErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const boxRef = useRef();
  
  // Animate the fallback cube
  useFrame(({ clock }) => {
    if (boxRef.current && hasError) {
      const t = clock.getElapsedTime();
      boxRef.current.rotation.x = Math.sin(t * 0.5) * 0.1 + Math.PI / 5;
      boxRef.current.rotation.y = Math.sin(t * 0.3) * 0.1 + Math.PI / 5;
    }
  });
  
  if (hasError) {
    return (
      <group ref={boxRef}>
        {/* Wireframe cube */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial 
            color="#4a90e2" 
            wireframe={true} 
            emissive="#2c3e50"
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Solid cube inside for better appearance */}
        <mesh scale={[0.95, 0.95, 0.95]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial 
            color="#2c3e50" 
            roughness={0.3}
            metalness={0.7}
            opacity={0.7}
            transparent
          />
        </mesh>
      </group>
    );
  }
  
  return (
    <Suspense fallback={null}>
      {React.cloneElement(children, {
        onError: () => setHasError(true)
      })}
    </Suspense>
  );
}

// Main component that renders the canvas
const ProductModel3D = ({ modelUrl, height = '250px', onLoad, onError }) => {
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  
  const handleModelError = () => {
    setModelLoadFailed(true);
    if (onError) onError();
  };
  
  const handleModelLoad = () => {
    if (onLoad) onLoad();
  };
  
  if (modelLoadFailed) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '15px',
          padding: '1rem',
          textAlign: 'center'
        }}
      >
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
          Model preview unavailable
        </p>
      </div>
    );
  }
  
  // Validate modelUrl before passing it to the Canvas
  // This helps prevent passing invalid URLs to the 3D renderer
  const validatedModelUrl = typeof modelUrl === 'string' && modelUrl.trim() !== '' ? modelUrl : null;
  
  return (
    <div style={{ height, borderRadius: '15px', overflow: 'hidden', position: 'relative' }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }} 
        shadows 
        onCreated={handleModelLoad}
        onError={(error) => {
          console.error("Canvas error:", error);
          handleModelError();
        }}
      >
        {/* Key light */}
        <ambientLight intensity={0.5} />
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={0.8} 
          castShadow
          shadow-mapSize={[512, 512]} 
        />
        {/* Fill light */}
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Use ModelErrorBoundary to handle errors */}
        <ModelErrorBoundary>
          <Model 
            url={validatedModelUrl} 
            onError={handleModelError} 
          />
        </ModelErrorBoundary>
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          rotateSpeed={0.8}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 3}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default ProductModel3D; 