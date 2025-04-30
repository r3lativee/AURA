import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ModelViewer = ({ modelUrl, alt, height }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    // Clean up function to handle component unmounting
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update container size when it changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerSize({ 
        width: clientWidth || 1, 
        height: height || clientHeight || 1 
      });
    };
    
    // Set initial size
    updateSize();
    
    // Set up resize observer to detect container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [height]);

  useEffect(() => {
    if (!containerRef.current || containerSize.width <= 0 || containerSize.height <= 0) return;
    
    setLoading(true);
    setError(null);

    // Clear previous content if any
    if (rendererRef.current) {
      rendererRef.current.dispose();
      containerRef.current.innerHTML = '';
    }
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Initialize scene, camera, and renderer
    const container = containerRef.current;
    const { width, height: modelHeight } = containerSize;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / modelHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, modelHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Make the canvas fill its container
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Load model
    const loader = new GLTFLoader();
    let resolvedUrl = modelUrl;
    
    // Resolve URL for local development
    if (resolvedUrl && resolvedUrl.startsWith('/') && !resolvedUrl.startsWith('//')) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        resolvedUrl = `${window.location.origin}${resolvedUrl}`;
      }
    }

    if (!resolvedUrl) {
      setError('Model URL is missing');
      setLoading(false);
      return;
    }

    loader.load(
      resolvedUrl,
      (gltf) => {
        try {
          const model = gltf.scene;
          scene.add(model);

          // Center and scale model to fit viewport
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // Protect against invalid dimensions
          const maxDim = Math.max(0.001, size.x, size.y, size.z);
          const scale = 3.0 / maxDim;
          model.scale.set(scale, scale, scale);

          // Center model
          model.position.x = -center.x * scale;
          model.position.y = -center.y * scale;
          model.position.z = -center.z * scale;

          // Position camera to see the whole model
          const distance = maxDim * 1.5;
          camera.position.set(distance, distance / 2, distance);
          camera.lookAt(0, 0, 0);
          controls.update();

          setLoading(false);

          // Animation loop
          const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          };

          animate();
        } catch (err) {
          console.error('Error processing loaded model:', err);
          setError('Error processing model');
          setLoading(false);
        }
      },
      (xhr) => {
        // Progress callback
        // console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('Error loading 3D model:', error);
        setError('Failed to load 3D model');
        setLoading(false);
      }
    );

    // Handle window and container resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const { width, height } = containerSize;
      
      if (width <= 0 || height <= 0) return;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [modelUrl, containerSize]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: height || '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: '#f5f5f5',
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="caption" sx={{ mt: 1 }}>
            Loading model...
          </Typography>
        </Box>
      )}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'error.main',
            textAlign: 'center',
            p: 2,
          }}
        >
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ModelViewer; 