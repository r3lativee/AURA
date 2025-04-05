import React, { useEffect, useRef } from 'react';
import { FiAward, FiShield, FiSmile } from 'react-icons/fi';
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
    // Hero Text Animation
    if (heroTextRef.current) {
      const text = new SplitType(heroTextRef.current, { types: 'chars' });
      gsap.from(text.chars, {
        opacity: 0,
        y: 30,
        rotateX: -90,
        stagger: 0.02,
        duration: 1,
        ease: 'power4.out',
      });
    }
    
    // Mission Text Animation - Fade-in to bold effect
    if (missionTextRef.current) {
      gsap.fromTo(
        missionTextRef.current, 
        { fontWeight: 300, opacity: 0.5 }, 
        {
          fontWeight: 600,
          opacity: 1,
          duration: 1.5,
          scrollTrigger: {
            trigger: missionTextRef.current,
            start: 'top bottom-=100',
            end: 'bottom center',
            scrub: true,
          }
        }
      );
    }
    
    // Section Headings Animation - Bold Scroll Flip Effect
    headingRefs.current.forEach((heading) => {
      gsap.fromTo(
        heading,
        { 
          rotationX: 90, 
          opacity: 0, 
          y: 50 
        },
        {
          rotationX: 0,
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top bottom-=150',
            end: 'bottom bottom-=150',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
    
  }, []);

  const teamMembers = [
    {
      name: "Shashanka Gogoi",
      role: "Development Team",
      image: "https://www.instagram.com/p/CvFhI3UpUKL/?utm_source=ig_web_button_share_sheet",
      description: "A versatile Full Stack Developer, Designer and 3D Artist with a passion for creative problem-solving, bringing ideas to life through innovative web solutions and immersive digital experiences"
    },
    {
      name: "Sonia Maam",
      role: "Internal Guide",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=500",
      description: "Experienced mentor guiding the technical development and implementation"
    },
    {
      name: "Lord Krishna",
      role: "External Guide",
      image: "https://images.unsplash.com/photo-1641730259879-ad98e7db7bcb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8a3Jpc2huYXxlbnwwfHwwfHx8MA%3D%3D",
      description: "Divine guidance and wisdom in project development and execution"
    }
  ];

  const values = [
    {
      icon: <FiAward />,
      title: "Premium Quality",
      description: "We source and deliver only the finest men's grooming products."
    },
    {
      icon: <FiShield />,
      title: "Natural Ingredients",
      description: "Our products are crafted with carefully selected natural ingredients."
    },
    {
      icon: <FiSmile />,
      title: "Customer Satisfaction",
      description: "We're committed to enhancing your grooming experience."
    }
  ];

  // Animation variants for Framer Motion
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (custom) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: custom * 0.1,
        duration: 0.8, 
        ease: [0.215, 0.61, 0.355, 1.0] 
      } 
    })
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const statCountVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 10,
        delay: 0.4,
      }
    }
  };

  return (
    <div className="about-container">
      <div className="about-hero">
        <div className="hero-content">
          <h1 ref={heroTextRef} className="animated-hero-text">About AURA</h1>
          <p className="animated-subtitle">Elevating Men's Grooming Since 2023</p>
        </div>
      </div>

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
            access to high-quality grooming essentials that enhance their natural confidence 
            while maintaining ethical standards and sustainable practices.
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
              <div className="value-icon">{value.icon}</div>
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
        <motion.div className="stat-card" variants={fadeInUp} custom={0}>
          <motion.h3 variants={statCountVariants}>500+</motion.h3>
          <p>Happy Customers</p>
        </motion.div>
        <motion.div className="stat-card" variants={fadeInUp} custom={1}>
          <motion.h3 variants={statCountVariants}>50+</motion.h3>
          <p>Premium Products</p>
        </motion.div>
        <motion.div className="stat-card" variants={fadeInUp} custom={2}>
          <motion.h3 variants={statCountVariants}>100%</motion.h3>
          <p>Natural Ingredients</p>
        </motion.div>
        <motion.div className="stat-card" variants={fadeInUp} custom={3}>
          <motion.h3 variants={statCountVariants}>24/7</motion.h3>
          <p>Customer Support</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About; 