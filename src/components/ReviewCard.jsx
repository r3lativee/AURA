import React from 'react';
import { motion } from 'framer-motion';
import { Star, StarHalf, StarBorder } from '@mui/icons-material';

const ReviewCard = ({ review }) => {
  const { user, rating, title, review: reviewText } = review;
  
  // Function to render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star 
            key={i} 
            sx={{ color: 'white', fontSize: '1rem' }}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarHalf 
            key={i} 
            sx={{ color: 'white', fontSize: '1rem' }}
          />
        );
      } else {
        stars.push(
          <StarBorder 
            key={i} 
            sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}
          />
        );
      }
    }
    
    return stars;
  };
  
  return (
    <motion.div 
      className="review-card-marquee"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="review-avatar">
        {user.profileImage ? (
          <img 
            src={user.profileImage} 
            alt={user.name}
            className="avatar-image"
          />
        ) : (
          <div className="avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="review-content">
        <div className="review-header">
          <h3 className="review-title">{title}</h3>
          <div className="review-stars">
            {renderStars(rating)}
          </div>
        </div>
        
        <p className="review-text">
          {reviewText.length > 100
            ? `${reviewText.substring(0, 100)}...`
            : reviewText}
        </p>
        
        <div className="review-user">
          <span className="user-name">{user.name}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCard; 