import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Card, CardContent, Container, Grid, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { API_URL } from '../config/Constants';

// Error boundary to catch and display 3D model loading errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Model loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ModelError error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Fallback component when model fails to load
function ModelError({ error }) {
  return (
    <>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <directionalLight position={[1, 2, 3]} intensity={1.5} />
      <ambientLight intensity={0.5} />
    </>
  );
}

// Debug model component to display model information
function DebugModel({ url }) {
  const { scene, animations } = useGLTF(url);
  const { camera } = useThree();
  const modelRef = useRef();

  useEffect(() => {
    if (modelRef.current) {
      // Get the bounding box of the model
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Position camera based on model size
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));
      
      // Set a minimum distance
      cameraZ = Math.max(cameraZ * 1.5, 5);
      
      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
    }
  }, [camera, scene]);

  return (
    <>
      <primitive ref={modelRef} object={scene} position={[0, 0, 0]} scale={1} />
      <directionalLight position={[1, 2, 3]} intensity={1.5} />
      <ambientLight intensity={0.5} />
      <OrbitControls />
    </>
  );
}

// Main TestModelLoader component
function TestModelLoader() {
  const [modelUrl, setModelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [modelLoaded, setModelLoaded] = useState(false);

  // Function to resolve model URL based on input
  const resolveModelUrl = (url) => {
    if (!url) return '';
    
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    
    // For relative URLs
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    // For API paths
    if (url.startsWith('models/') || url.startsWith('uploads/')) {
      // Extract base URL from API_URL (remove "/api" suffix if present)
      const baseUrl = API_URL.endsWith('/api') 
        ? API_URL.slice(0, -4) // Remove "/api" 
        : API_URL;
      
      return `${baseUrl}/${url}`;
    }
    
    // Default case
    return url;
  };

  // Handle loading the model
  const handleLoadModel = () => {
    if (!modelUrl.trim()) {
      setError('Please enter a model URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    setModelLoaded(false);
    
    try {
      const resolved = resolveModelUrl(modelUrl);
      setResolvedUrl(resolved);
      
      console.log('Model Loading Details:');
      console.log('- Original URL:', modelUrl);
      console.log('- Resolved URL:', resolved);
      console.log('- API_URL used for resolution:', API_URL);
      
      // Simulate checking if URL is accessible
      fetch(resolved, { method: 'HEAD' })
        .then(response => {
          console.log('Fetch response status:', response.status);
          
          // Get and log all headers
          const headers = Object.fromEntries([...response.headers]);
          console.log('Fetch response headers:', headers);
          
          // Log content type specifically
          console.log('Content-Type:', headers['content-type']);
          
          if (!response.ok) {
            throw new Error(`Failed to access model: ${response.status} ${response.statusText}`);
          }
          
          // Check if content type is correct for GLB files
          const contentType = headers['content-type'];
          if (resolved.endsWith('.glb') && contentType && !contentType.includes('model/gltf-binary')) {
            console.warn(`Warning: GLB file has incorrect content type: ${contentType}. Should be 'model/gltf-binary'.`);
          }
          
          setModelLoaded(true);
          console.log('Model URL verified, preparing to load in viewer');
        })
        .catch(err => {
          console.error('Error accessing model URL:', err);
          setError(`Error accessing model: ${err.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      console.error('Error resolving URL:', err);
      setError(`Error resolving URL: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        3D Model Loader Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This tool helps you test loading 3D models (.glb files) from different sources.
        Sample models can be found in <code>/uploads/models/</code> on the server. 
        Try with <code>/uploads/models/ftm.glb</code> for a quick test.
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enter Model URL
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Model URL"
                  variant="outlined"
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                  placeholder="e.g., /uploads/models/chair.glb or models/product.glb"
                  sx={{ mr: 2 }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleLoadModel}
                  disabled={loading}
                  sx={{ height: '56px' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Load Model'}
                </Button>
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                Debug Information:
              </Typography>
              <Typography variant="body2">
                Original URL: {modelUrl || '(none)'}
              </Typography>
              <Typography variant="body2">
                Resolved URL: {resolvedUrl || '(none)'}
              </Typography>
              <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
                For GLB files to load correctly, the server should respond with Content-Type: model/gltf-binary. 
                Check the console for content type headers in the response.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3D Model Viewer
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: '400px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                {resolvedUrl && modelLoaded ? (
                  <Canvas>
                    <ErrorBoundary>
                      <DebugModel url={resolvedUrl} />
                    </ErrorBoundary>
                  </Canvas>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {loading ? (
                      <CircularProgress />
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        {resolvedUrl ? 'Loading model...' : 'No model loaded'}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TestModelLoader; 