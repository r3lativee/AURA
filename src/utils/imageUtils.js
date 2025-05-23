// Helper function to construct full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://i.imgur.com/3tVgsra.png';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // If it's the default placeholder, return as is
  if (imagePath.includes('3tVgsra.png')) return imagePath;
  
  // Construct full URL for uploaded images
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const serverUrl = baseUrl.replace('/api', ''); // Remove /api from the end
  
  // Ensure the path starts with /
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${serverUrl}${cleanPath}`;
}; 