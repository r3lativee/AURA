import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircularProgress } from '@mui/material';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { FavoriteBorder, Favorite, Add, Remove, Star, StarHalf, StarBorder } from '@mui/icons-material';
import { productsAPI, reviewsAPI } from '../services/api';
import '../styles/pages/Products.css';
import { toast } from 'react-hot-toast';
import { FiShoppingCart } from 'react-icons/fi';

// Separate error boundary component to catch model loading errors
function ModelErrorBoundary({children}) {
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
    <React.Suspense fallback={null}>
      {React.cloneElement(children, {
        onError: () => setHasError(true)
      })}
    </React.Suspense>
  );
}

// Fixed Model component without state in render function
function Model({ url, onError }) {
  // Use default model if no URL is provided
  const ref = useRef();
  const modelUrl = url || '/models/ftm.glb';
  
  try {
    // Using useGLTF hook outside of render path
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
    
    // Return an empty group if there's an error
    return <group />;
  }
}

// Custom Rating component that matches Lusion aesthetic
const CustomRating = ({ value, onChange, readOnly = false }) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star 
            key={i} 
            sx={{ color: 'white', fontSize: '1.2rem', cursor: readOnly ? 'default' : 'pointer' }}
            onClick={() => !readOnly && onChange(i)}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarHalf 
            key={i} 
            sx={{ color: 'white', fontSize: '1.2rem', cursor: readOnly ? 'default' : 'pointer' }}
            onClick={() => !readOnly && onChange(i)}
          />
        );
      } else {
        stars.push(
          <StarBorder 
            key={i} 
            sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: readOnly ? 'default' : 'pointer' }}
            onClick={() => !readOnly && onChange(i)}
          />
        );
      }
    }
    
    return stars;
  };
  
  return (
    <div className="custom-rating">
      {renderStars()}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    review: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [adding, setAdding] = useState(false);
  
  const { currentUser, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  
  const modelRef = useRef();
  const [modelLoadFailed, setModelLoadFailed] = useState(false);

    const fetchProduct = async () => {
      try {
      setLoading(true);
      const { data } = await productsAPI.getOne(id);
          setProduct(data);
          if (data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
        }
      } catch (error) {
      console.error('Failed to fetch product:', error);
      setError('Failed to load product. Please try again later.');
      toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
      const { data } = await reviewsAPI.getByProduct(id);
      setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      if (error.response?.status !== 401) {
        // Don't show error to user if it's just an auth error
        setError('Failed to load reviews');
      }
      } finally {
        setReviewsLoading(false);
      }
    };

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (newValue) => {
    setNewReview(prev => ({
      ...prev,
      rating: newValue
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please log in to submit a review');
      toast.error('Please log in to submit a review');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Call the reviewsAPI with properly formatted data
      const response = await reviewsAPI.create(id, {
        rating: newReview.rating,
        title: newReview.title,
        review: newReview.review
      });
      
      // Check if this is the special case response for a server-side population error
      if (response.data && response.data.success) {
        // The review was saved but there was a display error
        setSuccess('Review submitted successfully!');
        toast.success('Review submitted successfully!');
        
        // Refresh reviews after a short delay
        setTimeout(() => {
          fetchReviews();
        }, 1000);
      } else {
        // Normal success path
        await fetchReviews();
      }
      
      // Reset form
      setNewReview({
        rating: 5,
        title: '',
        review: ''
      });
      
      setSuccess('Review submitted successfully!');
      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      
      if (error.response?.status === 401) {
        setError('Please log in to submit a review');
        toast.error('Your session has expired. Please log in again.');
      } else {
      setError(error.response?.data?.message || 'Failed to submit review');
        toast.error(error.response?.data?.message || 'Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your cart');
      toast.error('Please log in to add items to your cart');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id, quantity, selectedSize);
      setSuccess('Product added to cart successfully!');
      toast.success('Product added to cart successfully!');
      
      // Clear any previous error
      setError('');
    } catch (err) {
      setError('Failed to add product to cart. Please try again.');
      toast.error('Failed to add product to cart');
      console.error('Add to cart error:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      setError('Please log in to manage favorites');
      toast.error('Please log in to manage favorites');
      return;
    }

    try {
      if (isFavorite(product._id)) {
        await removeFromFavorites(product._id);
      } else {
        await addToFavorites(product._id);
      }
      // Clear any previous error
      setError('');
    } catch (err) {
      console.error('Favorite toggle error:', err);
    }
  };

  const handleQuantityChange = (amount) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1 && (!product.stockQuantity || newQuantity <= product.stockQuantity)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: 'white' }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2>Product not found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="product-detail-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div className="row" style={{ display: 'flex', flexWrap: 'wrap', marginLeft: '-1rem', marginRight: '-1rem' }}>
        {/* 3D Model Viewer */}
          <div className="col" style={{ flex: '0 0 60%', maxWidth: '60%', padding: '0 1rem', marginBottom: '2rem' }}>
            <div className="model-container">
            {modelLoadFailed ? (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '3rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                  Unable to load 3D model
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  We're having trouble loading the 3D model for this product. Please try again later.
                  </p>
                </div>
            ) : (
                <>
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
                    
                <Suspense fallback={null}>
                  <ModelErrorBoundary>
                    <Model 
                      url={product?.modelUrl}
                      onError={() => setModelLoadFailed(true)} 
                    />
                  </ModelErrorBoundary>
                </Suspense>
                    
                    <OrbitControls 
                      enableZoom={true} 
                      enablePan={false}
                      rotateSpeed={0.8}
                      maxPolarAngle={Math.PI / 1.5}
                      minPolarAngle={Math.PI / 6}
                      autoRotate={true}
                      autoRotateSpeed={0.5}
                    />
              </Canvas>
                  <div className="model-instructions">
                    Click and drag to rotate — Scroll to zoom
                  </div>
                </>
              )}
            </div>
          </div>

        {/* Product Information */}
          <div className="col" style={{ flex: '0 0 40%', maxWidth: '40%', padding: '0 1rem' }}>
            <div className="product-detail-header">
              <h1 className="product-title">{product.name}</h1>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <CustomRating value={product.ratings?.average || 0} readOnly />
                <span style={{ marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                {product.ratings?.average?.toFixed(1) || "0.0"} ({product.ratings?.count || 0} reviews)
                </span>
              </div>
              
              <h2 className="product-price">${product.price}</h2>
              
              <p className="product-description">{product.description}</p>
            </div>

            <div className="product-details-section">
              <h3 className="product-section-title">Category</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{product.category}</p>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 className="product-section-title">Size</h3>
                  <div className="size-selector">
                    {product.sizes.map((size) => (
                      <button 
                        key={size.name} 
                        className={`size-option ${selectedSize === size.name ? 'selected' : ''}`}
                        onClick={() => setSelectedSize(size.name)}
                        disabled={!size.inStock}
                        style={{ opacity: size.inStock ? 1 : 0.3 }}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.ingredients && product.ingredients.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 className="product-section-title">Ingredients</h3>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: '1rem 0 0', 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6'
                  }}>
                    {product.ingredients.map((ingredient, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>
                        • {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(255, 87, 87, 0.1)', 
                  border: '1px solid rgba(255, 87, 87, 0.2)',
                  color: 'rgba(255, 87, 87, 0.8)',
                  marginTop: '2rem',
                  fontSize: '0.85rem'
                }}>
                  {error}
                </div>
              )}
              
              {success && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(87, 255, 157, 0.1)', 
                  border: '1px solid rgba(87, 255, 157, 0.2)',
                  color: 'rgba(87, 255, 157, 0.8)',
                  marginTop: '2rem',
                  fontSize: '0.85rem'
                }}>
                  {success}
                </div>
              )}

            {/* Quantity and Add to Cart */}
              <div className="product-controls">
                {/* Quantity Selector */}
                <div className="quantity-selector">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      opacity: quantity <= 1 ? 0.5 : 1
                    }}
                  >
                    <Remove />
                  </button>
                  <span className="quantity-input" style={{
                    width: '40px',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>{quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                  disabled={product.stockQuantity && quantity >= product.stockQuantity}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      opacity: (product.stockQuantity && quantity >= product.stockQuantity) ? 0.5 : 1
                    }}
                  >
                    <Add />
                  </button>
                </div>
                
                <div className="product-actions">
                  <button
                    className="add-to-cart-btn lusion-button"
                    onClick={handleAddToCart}
                    disabled={adding || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                    style={{
                      flex: '1',
                      padding: '12px 30px',
                      opacity: adding || (product.sizes && product.sizes.length > 0 && !selectedSize) ? 0.6 : 1,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {adding ? (
                      <CircularProgress size={24} sx={{ color: '#000' }} />
                    ) : (
                      <>
                        <FiShoppingCart style={{ marginRight: '10px' }} />
                        Add to Cart - ${(product.price * quantity).toFixed(2)}
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={handleFavoriteToggle} 
                    className="favorite-btn"
                    style={{ 
                      padding: '12px 30px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: isFavorite(product._id) ? '#e74c3c' : 'white',
                      transition: 'all 0.3s ease',
                      minWidth: '50px'
                    }}
                  >
                    {isFavorite(product._id) ? (
                      <Favorite />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </button>
                </div>
              </div>

            {!product.inStock && (
                <p style={{ 
                  textAlign: 'center', 
                  marginTop: '1rem', 
                  color: 'rgba(255, 87, 87, 0.8)',
                  fontSize: '0.85rem'
                }}>
                This product is currently out of stock
                </p>
            )}
            </div>
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="product-divider"></div>
        
        <div className="reviews-section">
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '400', 
            marginBottom: '2.5rem',
            color: 'white'
          }}>
            Customer Reviews
          </h2>
          
          <div className="review-summary">
            <div>
              <div className="review-average">
                {product.ratings?.average?.toFixed(1) || "0.0"}
                <span style={{ fontSize: '1rem', opacity: 0.5, marginLeft: '0.25rem' }}>/5</span>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <CustomRating value={product.ratings?.average || 0} readOnly />
              </div>
              
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Based on {product.ratings?.count || 0} reviews
              </p>
            </div>
            
            {/* Write a Review Form */}
            <div className="review-form">
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '500', 
                marginBottom: '1.5rem',
                color: 'white'
              }}>
                Write a Review
              </h3>
              
              <form onSubmit={handleSubmitReview}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Your Rating
                  </label>
                  <CustomRating 
                    value={newReview.rating}
                    onChange={handleRatingChange}
                    readOnly={!isAuthenticated || submitting}
                  />
                </div>
                
                <input
                  type="text"
                  className="lusion-input"
                  placeholder="Review Title"
                  name="title"
                  value={newReview.title}
                  onChange={handleReviewChange}
                  required
                  disabled={submitting || !isAuthenticated}
                />
                
                <textarea
                  className="lusion-input lusion-textarea"
                  placeholder="Your Review"
                  name="review"
                  value={newReview.review}
                  onChange={handleReviewChange}
                  required
                  disabled={submitting || !isAuthenticated}
                />
                
                <div className="review-action-buttons">
                  <button
                  type="submit"
                    disabled={submitting || !isAuthenticated}
                    className="submit-review-btn lusion-button"
                    style={{
                      width: '100%',
                      padding: '12px 30px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {submitting ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Submit Review'}
                  </button>
                </div>
                
                {!isAuthenticated && (
                  <p style={{ 
                    fontSize: '0.85rem', 
                    marginTop: '1rem', 
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    Please log in to submit a review
                  </p>
                )}
              </form>
            </div>
          </div>
          
          {/* Reviews List */}
          <div style={{ marginTop: '4rem' }}>
          {reviewsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <CircularProgress sx={{ color: 'white' }} />
              </div>
          ) : reviews.length > 0 ? (
              <div>
              {reviews.map((review) => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="review-user-avatar">
                        {review.user.profileImage ? (
                          <img 
                        src={review.user.profileImage} 
                        alt={review.user.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '500'
                          }}>
                            {review.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="review-user-name">{review.user.name}</div>
                        <div className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {review.verified && (
                        <div className="verified-badge">Verified Purchase</div>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <CustomRating value={review.rating} readOnly />
                    </div>
                    
                    <h4 className="review-title">{review.title}</h4>
                    <p className="review-text">{review.review}</p>
                    
                    {review.images && review.images.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        marginTop: '1.5rem',
                        flexWrap: 'wrap'
                      }}>
                        {review.images.map((image, index) => (
                          <img 
                            key={index}
                            src={image}
                            alt={`Review image ${index + 1}`}
                            style={{ 
                              width: '70px', 
                              height: '70px', 
                              objectFit: 'cover'
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {review.replies && review.replies.length > 0 && (
                      <div style={{ 
                        marginTop: '1.5rem', 
                        paddingTop: '1.5rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <h5 style={{ 
                          fontSize: '0.85rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '1rem'
                        }}>
                          Replies
                        </h5>
                        
                        {review.replies.map((reply, index) => (
                          <div key={index} style={{ 
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderLeft: '2px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <div style={{ 
                              fontWeight: '500',
                              color: 'white',
                              fontSize: '0.9rem',
                              marginBottom: '0.25rem'
                            }}>
                              {reply.user.name}
                            </div>
                            
                            <div style={{ 
                              fontSize: '0.8rem',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </div>
                            
                            <div style={{ 
                              fontSize: '0.9rem',
                              color: 'rgba(255, 255, 255, 0.7)',
                              lineHeight: '1.5'
                            }}>
                              {reply.comment}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                No reviews yet. Be the first to review this product!
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Preload the default model
try {
  useGLTF.preload('/models/ftm.glb');
} catch (err) {
  console.error("Failed to preload default model:", err);
}

export default ProductDetail; 