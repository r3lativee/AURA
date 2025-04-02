import React from 'react';
import { FiAward, FiShield, FiSmile } from 'react-icons/fi';
import '../styles/pages/About.css';

const About = () => {
  const teamMembers = [
    {
      name: "Shashanka Gogoi",
      role: "Development Team",
      image: "\public\team-temple.jpg",
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

  return (
    <div className="about-container">
      <div className="about-hero">
        <div className="hero-content">
          <h1>About AURA</h1>
          <p>Elevating Men's Grooming Since 2023</p>
        </div>
      </div>

      <div className="about-section mission">
        <div className="section-content">
          <h2>Our Mission</h2>
          <p>
            At AURA, we're dedicated to revolutionizing men's grooming experience through 
            premium quality products and exceptional service. We believe every man deserves 
            access to high-quality grooming essentials that enhance their natural confidence 
            while maintaining ethical standards and sustainable practices.
          </p>
        </div>
      </div>

      <div className="about-section values">
        <h2>Our Values</h2>
        <div className="values-grid">
          {values.map((value, index) => (
            <div key={index} className="value-card">
              <div className="value-icon">{value.icon}</div>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="about-section team">
        <h2>Project Team</h2>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card">
              <div className="member-image">
                <img src={member.image} alt={member.name} />
              </div>
              <div className="member-info">
                <h3>{member.name}</h3>
                <h4>{member.role}</h4>
                <p>{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="about-section stats">
        <div className="stat-card">
          <h3>500+</h3>
          <p>Happy Customers</p>
        </div>
        <div className="stat-card">
          <h3>50+</h3>
          <p>Premium Products</p>
        </div>
        <div className="stat-card">
          <h3>100%</h3>
          <p>Natural Ingredients</p>
        </div>
        <div className="stat-card">
          <h3>24/7</h3>
          <p>Customer Support</p>
        </div>
      </div>
    </div>
  );
};

export default About; 