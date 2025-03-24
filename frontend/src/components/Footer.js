import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowUp, Mail, Phone } from 'lucide-react';
import '../styles/Footer.css';
import logo from '../assets/logo4-1.png';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState({ text: '', type: '' });
  const [showScrollButton, setShowScrollButton] = useState(false);
  const currentYear = new Date().getFullYear();

  // Show/hide scroll button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle newsletter subscription
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }
    
    // Here you would typically handle the subscription via API
    console.log(`Newsletter subscription for: ${email}`);
    setEmailMessage({ text: 'Thank you for subscribing!', type: 'success' });
    setEmail('');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setEmailMessage({ text: '', type: '' });
    }, 3000);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Remove the separate logo container that was here */}
        
        <div className="footer-content">
          {/* Footer Main Content */}
          <div className="footer-columns">
            {/* About Column */}
            <div className="footer-col">
              <div className="footer-about">
                {/* Updated footer logo section with image preceding text */}
                <Link to="/" className="footer-logo">
                  <img src={logo} alt="Bhavya Association Logo" className="footer-logo-image" />
                  <div className="footer-logo-text-container">
                    <span className="footer-logo-text">Bhavya</span>
                    <span className="footer-logo-accent">Association</span>
                  </div>
                </Link>
                <p>
                  Bhavya Association connects professionals and entrepreneurs from the Bahujan Samaj. 
                  Join our community to collaborate and grow together with like-minded individuals.
                </p>
                <Link 
                  to="/about" 
                  className="footer-link-highlight"
                >
                  Learn more about us →
                </Link>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="footer-col">
              <h3 className="footer-heading">Quick Links</h3>
              <ul className="footer-links">
                <li>
                  <Link to="/" className="footer-link">Home</Link>
                </li>
                <li>
                  <Link to="/directory" className="footer-link">Member Directory</Link>
                </li>
                <li>
                  <Link to="/service-listings" className="footer-link">Business Directory</Link>
                </li>
                <li>
                  <Link to="/profile" className="footer-link">My Profile</Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms" className="footer-link">Terms & Conditions</Link>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="footer-col">
              <h3 className="footer-heading">Support</h3>
              <ul className="footer-links">
                <li>
                  <Link to="/faq" className="footer-link">FAQ</Link>
                </li>
                <li>
                  <Link to="/help" className="footer-link">Help Center</Link>
                </li>
                <li>
                  <Link to="/report" className="footer-link">Report an Issue</Link>
                </li>
                <li>
                  <Link to="/feedback" className="footer-link">Feedback Form</Link>
                </li>
              </ul>
            </div>

            {/* Contact & Newsletter Column */}
            <div className="footer-col">
              <h3 className="footer-heading">Contact Us</h3>
              
              {/* Contact Information */}
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">
                    <Mail size={16} />
                  </div>
                  <span>contact@bhavyaassociation.org</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <Phone size={16} />
                  </div>
                  <span>+91 12345 67890</span>
                </div>
              </div>
              
              {/* Newsletter Subscription */}
              <div className="newsletter">
                <h4 className="newsletter-heading">Subscribe to Newsletter</h4>
                <form className="newsletter-form" onSubmit={handleSubmit}>
                  <input
                    type="email"
                    className="newsletter-input"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email for newsletter"
                  />
                  <button type="submit" className="newsletter-button">Subscribe</button>
                  {emailMessage.text && (
                    <div className={`newsletter-message ${emailMessage.type}`}>
                      {emailMessage.text}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom Section */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <div className="copyright">
                © {currentYear} Developed by DevSum IT Solutions. All rights reserved.
              </div>
              
              {/* Social Media Links */}
              <div className="social-links">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="YouTube"
                >
                  <Youtube size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll to top button */}
        {showScrollButton && (
          <button
            onClick={scrollToTop}
            className="scroll-top-button"
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;
