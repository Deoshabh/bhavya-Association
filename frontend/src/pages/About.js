import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import UnderConstructionBanner from '../components/UnderConstructionBanner';

const About = () => {
  const navigate = useNavigate();
  
  // References for scroll animations
  const missionRef = useRef(null);
  const valuesRef = useRef(null);
  const historyRef = useRef(null);
  const teamRef = useRef(null);
  
  // Function to check if element is in viewport for animations
  const isInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8
    );
  };
  
  // Set up scroll event listeners for animations
  useEffect(() => {
    // Add fade-in class initially to hero section
    document.querySelector('.about-hero').classList.add('fade-in');
    
    const handleScroll = () => {
      // Check each section and add animation class when in viewport
      if (isInViewport(missionRef.current)) {
        missionRef.current.classList.add('slide-in-left');
      }
      
      if (isInViewport(valuesRef.current)) {
        valuesRef.current.classList.add('slide-in-right');
      }
      
      if (isInViewport(historyRef.current)) {
        historyRef.current.classList.add('fade-in');
      }
      
      if (isInViewport(teamRef.current)) {
        teamRef.current.classList.add('slide-in-bottom');
      }
    };
    
    // Run once on mount to check initial positions
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="about-container">
      {/* Replace inactive page notice with UnderConstructionBanner */}
      <UnderConstructionBanner message="This page is currently in preview mode and being updated." />
      
      <div className="about-header">
        <BackButton />
        <h1>About Bhavya Associates</h1>
      </div>
      
      {/* Hero section with background image and overlay */}
      <div className="about-hero">
        <div className="hero-overlay">
          <h2>Uniting the Bahujan Samaj Community</h2>
          <p>Building bridges, creating opportunities, and fostering connections since 2020</p>
        </div>
      </div>
      
      <div className="about-content">
        {/* Mission section */}
        <section className="about-section" ref={missionRef}>
          <div className="section-image mission-image">
            {/* Mission image with overlay */}
            <div className="image-overlay">
              <h3>Our Mission</h3>
            </div>
          </div>
          <div className="section-content">
            <h3>Our Mission</h3>
            <p>
              At Bhavya Associates, we are dedicated to connecting professionals and entrepreneurs from 
              the Bahujan Samaj community. Our mission is to create a collaborative platform where members 
              can network, share resources, and support each other's growth and development.
            </p>
            <p>
              We strive to build a strong, self-reliant community by facilitating meaningful connections 
              and providing valuable tools for personal and professional advancement.
            </p>
          </div>
        </section>
        
        {/* Values section */}
        <section className="about-section reverse" ref={valuesRef}>
          <div className="section-content">
            <h3>Our Values</h3>
            <ul className="values-list">
              <li>
                <span className="value-icon">🤝</span>
                <div>
                  <h4>Community</h4>
                  <p>Fostering a sense of belonging and mutual support among members</p>
                </div>
              </li>
              <li>
                <span className="value-icon">✨</span>
                <div>
                  <h4>Empowerment</h4>
                  <p>Providing tools and resources for personal and professional growth</p>
                </div>
              </li>
              <li>
                <span className="value-icon">🔄</span>
                <div>
                  <h4>Collaboration</h4>
                  <p>Encouraging cooperation and knowledge sharing within our network</p>
                </div>
              </li>
              <li>
                <span className="value-icon">🌟</span>
                <div>
                  <h4>Excellence</h4>
                  <p>Striving for the highest standards in all our initiatives</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="section-image values-image">
            {/* Values image with overlay */}
            <div className="image-overlay">
              <h3>Our Values</h3>
            </div>
          </div>
        </section>
        
        {/* History section */}
        <section className="about-section history-section" ref={historyRef}>
          <h3>Our Journey</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>2020</h4>
                <p>Bhavya Associates was founded with a vision to connect Bahujan Samaj professionals</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>2021</h4>
                <p>Launched our first online directory with 100+ members</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>2022</h4>
                <p>Added business directory to promote services within the community</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>2023</h4>
                <p>Reached 1000+ members milestone and introduced premium membership</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>2024</h4>
                <p>Launched our completely redesigned platform with enhanced features</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Team section */}
        <section className="about-section team-section" ref={teamRef}>
          <h3>Leadership Team</h3>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo photo-1"></div>
              <h4>Rahul Sharma</h4>
              <p>Founder & President</p>
            </div>
            <div className="team-member">
              <div className="member-photo photo-2"></div>
              <h4>Priya Ambedkar</h4>
              <p>Chief Operations Officer</p>
            </div>
            <div className="team-member">
              <div className="member-photo photo-3"></div>
              <h4>Vikram Jatav</h4>
              <p>Technology Director</p>
            </div>
            <div className="team-member">
              <div className="member-photo photo-4"></div>
              <h4>Meena Kumari</h4>
              <p>Community Relations</p>
            </div>
          </div>
        </section>
      </div>
      
      {/* Call to action section */}
      <div className="about-cta">
        <div className="cta-content">
          <h3>Join Our Growing Community</h3>
          <p>Connect with professionals from the Bahujan Samaj community and grow together</p>
          <button className="cta-button" onClick={() => navigate('/register')}>Become a Member</button>
        </div>
      </div>
    </div>
  );
};

export default About;
