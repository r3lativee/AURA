import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { motion } from 'framer-motion';
import JustGirlScene from '../components/justagirl';
import CursorRipple from '../components/CursorRipple';
import AnimatedButton from '../components/AnimatedButton';
import LoadingScreen from '../components/LoadingScreen';
import ReviewsMarquee from '../components/ReviewsMarquee';
import '../styles/pages/Home.css';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle loading screen completion
  const handleLoadingFinished = () => {
    setIsLoading(false);
  };

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
      <CursorRipple />
      
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
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <motion.div 
                key={item} 
                className="work-item"
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="work-image" style={{ backgroundImage: `url('/images/project${item}.jpg')` }}></div>
                <div className="work-info">
                  <h3>Product {item}</h3>
                  <p>Digital Experience</p>
                </div>
              </motion.div>
            ))}
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