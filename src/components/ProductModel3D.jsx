import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// Default model path
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
  const modelUrl = url || DEFAULT_MODEL_URL; // Fallback model URL
  
  try {
    const { scene } = useGLTF(modelUrl);
    
    // Set up the model to cast and receive shadows
    useEffect(() => {
      if (ref.current) {
        ref.current.traverse((child) => {
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
    
    // Add more detailed animation to the model
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
  } catch (err) {
    console.error("Error loading model:", err);
    if (onError) onError();
    
    // Return an empty group on error
    return <group />;
  }
}

// Error boundary component
function ModelErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <group>
        {/* Wireframe cube */}
        <mesh rotation={[Math.PI / 5, Math.PI / 5, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial 
            color="#4a90e2" 
            wireframe={true} 
            emissive="#2c3e50"
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Solid cube inside for better appearance */}
        <mesh rotation={[Math.PI / 5, Math.PI / 5, 0]} scale={[0.95, 0.95, 0.95]}>
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
const ProductModel3D = ({ modelUrl, height = '250px' }) => {
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  
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
  
  return (
    <div style={{ height, borderRadius: '15px', overflow: 'hidden', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} shadows>
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
        
        {/* Add a subtle rotation animation to the scene */}
        <ModelErrorBoundary>
          <Model 
            url={modelUrl} 
            onError={() => setModelLoadFailed(true)} 
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