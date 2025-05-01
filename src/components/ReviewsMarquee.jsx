import React, { useState, useEffect } from 'react';
import { Marquee } from './magicui/marquee';
import ReviewCard from './ReviewCard';

// Sample reviews data to display while real data is loading
const sampleReviews = [
  {
    id: '1',
    user: {
      name: 'John Doe',
      profileImage: null
    },
    rating: 5,
    title: 'Absolutely amazing product!',
    review: 'The quality of these products is unmatched. I\'ve tried many men\'s grooming products, but AURA is on another level. Highly recommend!'
  },
  {
    id: '2',
    user: {
      name: 'Michael S.',
      profileImage: null
    },
    rating: 4.5,
    title: 'Great products, excellent service',
    review: 'These products have completely transformed my skincare routine. The packaging is premium and the results are visible after just a few weeks.'
  },
  {
    id: '3',
    user: {
      name: 'Alex Johnson',
      profileImage: null
    },
    rating: 5,
    title: 'Worth every penny',
    review: 'The attention to detail in formulation is evident. These products feel luxurious and perform even better. My skin has never looked healthier.'
  },
  {
    id: '4',
    user: {
      name: 'Robert K.',
      profileImage: null
    },
    rating: 4,
    title: 'Great products!',
    review: 'I was skeptical at first, but these products exceeded my expectations. My girlfriend even noticed the difference after a few weeks of use.'
  },
  {
    id: '5',
    user: {
      name: 'David Wilson',
      profileImage: null
    },
    rating: 5,
    title: 'Premium experience',
    review: 'From ordering to unboxing to using the products - the entire experience feels premium and well thought out. The 3D product view is also very helpful.'
  },
  {
    id: '6',
    user: {
      name: 'Thomas B.',
      profileImage: null
    },
    rating: 4.5,
    title: 'Finally, products for men that work',
    review: 'I\'ve been looking for effective men\'s skincare that doesn\'t feel like an afterthought. AURA delivers on all fronts - quality, effectiveness, and experience.'
  }
];

const ReviewsMarquee = ({ apiReviews = [] }) => {
  const [reviews, setReviews] = useState([]);
  
  useEffect(() => {
    // If we have reviews from API, use those, otherwise use sample data
    if (apiReviews && apiReviews.length > 0) {
      setReviews(apiReviews);
    } else {
      setReviews(sampleReviews);
    }
  }, [apiReviews]);
  
  return (
    <section className="reviews-marquee-section animate-section">
      <div className="reviews-marquee-heading">
        <h2>What Our Customers Say</h2>
        <p>
          Join thousands of satisfied customers who have transformed their grooming routine with AURA
        </p>
      </div>
      
      <div className="reviews-marquee-container marquee-3d-perspective">
        {/* Top row - first group of reviews, left-to-right direction */}
        <Marquee pauseOnHover is3D={true} className="mb-8" speed={60}>
          {reviews.slice(0, Math.ceil(reviews.length / 2)).map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </Marquee>
        
        {/* Bottom row - second group of reviews, same direction (not reversed) with slight offset for visual effect */}
        <Marquee pauseOnHover is3D={true} speed={70}>
          {reviews.slice(Math.ceil(reviews.length / 2)).map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default ReviewsMarquee; 