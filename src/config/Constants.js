/**
 * Application constants for the AURA app
 */

// API URL - Using environment variable with fallback to localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Other constants can be added here as needed
export const MAX_FILE_SIZE = {
  MODEL: 10 * 1024 * 1024, // 10MB for 3D models
  IMAGE: 2 * 1024 * 1024   // 2MB for images
};

// Model file constraints
export const SUPPORTED_MODEL_FORMATS = ['.glb'];

// Image file constraints
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif']; 