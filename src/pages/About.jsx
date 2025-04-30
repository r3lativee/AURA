import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SplitType from 'split-type';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import '../styles/pages/About.css';

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const heroTextRef = useRef(null);
  const missionTextRef = useRef(null);
  const headingRefs = useRef([]);
  
  // Initialize refs array
  headingRefs.current = [];
  
  // Add ref to the headingRefs array
  const addToHeadingRefs = (el) => {
    if (el && !headingRefs.current.includes(el)) {
      headingRefs.current.push(el);
    }
  };

  useEffect(() => {
    // Hero Text Animation - More subtle split text animation
    if (heroTextRef.current) {
      const text = new SplitType(heroTextRef.current, { types: 'chars' });
      gsap.from(text.chars, {
        opacity: 0,
        y: 20,
        stagger: 0.01,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
    
    // Mission Text Animation - Simple fade-in
    if (missionTextRef.current) {
      gsap.fromTo(
        missionTextRef.current, 
        { opacity: 0, y: 20 }, 
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: missionTextRef.current,
            start: 'top bottom-=100',
            toggleActions: 'play none none none',
          }
        }
      );
    }
    
    // Section Headings Animation - Simple fade-in
    headingRefs.current.forEach((heading) => {
      gsap.fromTo(
        heading,
        { 
          opacity: 0, 
          y: 20 
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top bottom-=150',
            toggleActions: 'play none none none',
          },
        }
      );
    });
    
  }, []);

  const teamMembers = [
    {
      name: "Shashanka Gogoi",
      role: "Development Team",
      image: "",
      description: "Full Stack Developer, Designer and 3D Artist"
    },
    {
      name: "Sonia Maam",
      role: "Internal Guide",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=500",
      description: "Experienced mentor guiding the technical development"
    },
    {
      name: "Lord Krishna",
      role: "External Guide",
      image: "https://images.unsplash.com/photo-1641730259879-ad98e7db7bcb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8a3Jpc2huYXxlbnwwfHwwfHx8MA%3D%3D",
      description: "Divine guidance in project development and execution"
    }
  ];

  const values = [
    {
      title: "Premium Quality",
      description: "We source and deliver only the finest men's grooming products."
    },
    {
      title: "Natural Ingredients",
      description: "Our products are crafted with carefully selected natural ingredients."
    },
    {
      title: "Customer Satisfaction",
      description: "We're committed to enhancing your grooming experience."
    }
  ];

  // Animation variants for Framer Motion - More subtle and minimal
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: custom * 0.1,
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1.0] 
      } 
    })
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.2
      }
    }
  };

  const statCountVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        duration: 0.5,
        delay: 0.2,
      }
    }
  };

  return (
    <div className="about-container">
      <motion.div 
        className="about-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <h1 ref={heroTextRef} className="animated-hero-text">About AURA</h1>
          <p className="animated-subtitle">Elevating Men's Grooming Since 2023</p>
        </div>
      </motion.div>

      <motion.div 
        className="about-section mission"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeInUp}
      >
        <div className="section-content">
          <h2 ref={(el) => addToHeadingRefs(el)} className="section-heading">Our Mission</h2>
          <p ref={missionTextRef} className="mission-text">
            At AURA, we're dedicated to revolutionizing men's grooming experience through 
            premium quality products and exceptional service. We believe every man deserves 
            access to high-quality grooming essentials that enhance their natural confidence.
          </p>
        </div>
      </motion.div>

      <div className="about-section values">
        <h2 ref={(el) => addToHeadingRefs(el)} className="section-heading">Our Values</h2>
        <motion.div 
          className="values-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {values.map((value, index) => (
            <motion.div 
              key={index} 
              className="value-card"
              variants={fadeInUp}
              custom={index}
            >
              <h3 className="value-title">{value.title}</h3>
              <p>{value.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="about-section team">
        <h2 ref={(el) => addToHeadingRefs(el)} className="section-heading">Project Team</h2>
        <motion.div 
          className="team-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index} 
              className="team-card"
              variants={fadeInUp}
              custom={index}
            >
              <div className="member-image">
                <img src={member.image} alt={member.name} />
              </div>
              <div className="member-info">
                <h3>{member.name}</h3>
                <h4>{member.role}</h4>
                <p>{member.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div 
        className="about-section stats"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2 ref={(el) => addToHeadingRefs(el)} className="section-heading">Our Impact</h2>
        <div className="stats-grid">
          <motion.div className="stat-card" variants={fadeInUp} custom={0}>
            <motion.h3 variants={statCountVariants}>2000+</motion.h3>
            <p>Happy Customers</p>
          </motion.div>
          <motion.div className="stat-card" variants={fadeInUp} custom={1}>
            <motion.h3 variants={statCountVariants}>50+</motion.h3>
            <p>Premium Products</p>
          </motion.div>
          <motion.div className="stat-card" variants={fadeInUp} custom={2}>
            <motion.h3 variants={statCountVariants}>15+</motion.h3>
            <p>Years Experience</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default About; 