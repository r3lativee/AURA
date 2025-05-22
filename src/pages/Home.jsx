import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { motion } from 'framer-motion';
import JustGirlScene from '../components/justagirl';
import AnimatedButton from '../components/AnimatedButton';
import LoadingScreen from '../components/LoadingScreen';
import ReviewsMarquee from '../components/ReviewsMarquee';
import HomeProductCard from '../components/HomeProductCard';
import { productsAPI } from '../services/api';
import '../styles/pages/Home.css';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Handle loading screen completion
  const handleLoadingFinished = () => {
    setIsLoading(false);
  };

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setFeaturedLoading(true);
        const response = await productsAPI.getAll({ 
          page: 1, 
          limit: 6, 
          sortBy: 'newest' 
        });
        const products = response.data.products || [];
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setFeaturedLoading(false);
      }
    };

    if (!isLoading) {
      fetchFeaturedProducts();
    }
  }, [isLoading]);

  useEffect(() => {
    // Only run animations after loading screen is done
    if (isLoading) return;

    // Split text into characters
    const text = new SplitType(textRef.current, {
      types: 'chars',
      tagName: 'span'
    });

    // Initial setup
    gsap.set(text.chars, {
      opacity: 0,
      y: 100,
      rotateX: -90
    });

    gsap.set(".animate-section", {
      opacity: 0,
      y: 50
    });

    // Hero text animation
    gsap.to(text.chars, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 1.5,
      stagger: {
        amount: 1,
        from: "random"
      },
      ease: "power4.out",
    });

    // Scroll animations
    gsap.utils.toArray('.animate-section').forEach((section) => {
      gsap.to(section, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none reverse",
          markers: false
        }
      });
    });

    // Scroll indicator animation
    gsap.to(".scroll-line", {
      scaleY: 0,
      transformOrigin: "top",
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom center",
        scrub: true
      }
    });

    return () => {
      text.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [isLoading]);

  return (
    <>
      {isLoading && <LoadingScreen onFinished={handleLoadingFinished} />}
      
      <div className={`lusion-wrapper ${isLoading ? 'hidden' : ''}`} ref={containerRef}>
      
      <main style={{ paddingTop: 0 }}>
        <section className="hero-section">
          <JustGirlScene />
          <h1 ref={textRef} className="hero-title">
            For Men by Men made for best, luxury and the best experience.
          </h1>
          <div className="scroll-indicator">
            <span className="scroll-text">Scroll to explore</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        <section className="featured-work animate-section">
          <div className="section-header">
            <h2>Featured Products</h2>
            <span className="year">2024</span>
          </div>
          <div className="work-grid">
            {featuredLoading ? (
              // Loading state
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading featured products...</p>
              </div>
            ) : featuredProducts.length > 0 ? (
              // Display products
              featuredProducts.map((product) => (
                <div key={product._id} className="work-item">
                  <HomeProductCard product={product} />
                </div>
              ))
            ) : (
              // Fallback if no products
              <div className="no-products">
                <p>No featured products available at the moment.</p>
              </div>
            )}
          </div>
        </section>
          
          {/* Customer Reviews Marquee */}
          <ReviewsMarquee />

        <section className="manifesto-section animate-section">
          <div className="vision-text">
            <h2>Beyond Ordinary</h2>
            <h2>Within AURA</h2>
          </div>
          <div className="manifesto-content">
            <p>
              Aura revolutionizes men's cosmetics shopping with 3D visualization using Three.js. 
              Unlike static images, it offers an interactive, web-based experience, enhancing 
              engagement and product understanding. With seamless navigation and high-quality 
              visuals, Aura sets a new standard for online grooming retail.
            </p>
            
            <AnimatedButton variant="primary" onClick={() => window.location.href = '/products'}>
              Explore our work
            </AnimatedButton>
          </div>
        </section>

        <section className="capabilities-section animate-section">
          <div className="vision-text capabilities-header">
            <h2>Our Core Expertise</h2>
          </div>
          <div className="capabilities-grid">
            <motion.div 
              className="capability"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <h3>Design</h3>
              <ul>
                <li>UI/UX Design</li>
                <li>Brand Identity</li>
                <li>Motion Design</li>
              </ul>
            </motion.div>
            <motion.div 
              className="capability"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <h3>Development</h3>
              <ul>
                <li>Web Applications</li>
                <li>Interactive Experiences</li>
                <li>E-commerce Solutions</li>
              </ul>
            </motion.div>
            <motion.div 
              className="capability"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <h3>Strategy</h3>
              <ul>
                <li>Digital Strategy</li>
                <li>Brand Strategy</li>
                <li>Content Strategy</li>
              </ul>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
    </>
  );
};

export default Home; 