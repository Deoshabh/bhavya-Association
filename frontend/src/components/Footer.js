import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowUp, Mail, Phone } from 'lucide-react';
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
    <footer className="bg-neutral-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Column */}
          <div className="space-y-4">
            <div className="footer-about">
              {/* Updated footer logo section with image preceding text */}
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <img src={logo} alt="Bhavya Associates Logo" className="w-10 h-10" />
                <div>
                  <span className="text-xl font-bold">Bhavya</span>
                  <span className="text-xl font-bold text-primary-500">Associates</span>
                </div>
              </Link>
              <p className="text-neutral-300 mb-4">
                Bhavya Associates connects professionals and entrepreneurs from the Bahujan Samaj. 
                Join our community to collaborate and grow together with like-minded individuals.
              </p>
              <Link 
                to="/about" 
                className="text-primary-400 hover:text-primary-300 inline-flex items-center"
              >
                Learn more about us →
              </Link>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-neutral-700 pb-2">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-neutral-300 hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link to="/directory" className="text-neutral-300 hover:text-white transition">Member Directory</Link>
              </li>
              <li>
                <Link to="/service-listings" className="text-neutral-300 hover:text-white transition">Business Directory</Link>
              </li>
              <li>
                <Link to="/profile" className="text-neutral-300 hover:text-white transition">My Profile</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-neutral-300 hover:text-white transition">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="text-neutral-300 hover:text-white transition">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-neutral-700 pb-2">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-neutral-300 hover:text-white transition">FAQ</Link>
              </li>
              <li>
                <Link to="/help" className="text-neutral-300 hover:text-white transition">Help Center</Link>
              </li>
              <li>
                <Link to="/report" className="text-neutral-300 hover:text-white transition">Report an Issue</Link>
              </li>
              <li>
                <Link to="/feedback" className="text-neutral-300 hover:text-white transition">Feedback Form</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-neutral-700 pb-2">Contact Us</h3>
            
            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <div className="bg-neutral-700 p-1.5 rounded-full">
                  <Mail size={16} />
                </div>
                <span className="text-neutral-300">contact@bhavyaAssociates.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-neutral-700 p-1.5 rounded-full">
                  <Phone size={16} />
                </div>
                <span className="text-neutral-300">+91 12345 67890</span>
              </div>
            </div>
            
            {/* Newsletter Subscription */}
            <div>
              <h4 className="font-medium text-sm mb-2">Subscribe to Newsletter</h4>
              <form className="flex flex-col space-y-2" onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="bg-neutral-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email for newsletter"
                />
                <button 
                  type="submit" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded transition"
                >
                  Subscribe
                </button>
                {emailMessage.text && (
                  <div className={`text-sm ${emailMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {emailMessage.text}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom Section */}
        <div className="pt-8 mt-8 border-t border-neutral-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-neutral-400 text-sm">
              © {currentYear} Developed by DevSum IT Solutions. All rights reserved.
            </div>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neutral-700 p-2 rounded-full hover:bg-neutral-600 transition"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neutral-700 p-2 rounded-full hover:bg-neutral-600 transition"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neutral-700 p-2 rounded-full hover:bg-neutral-600 transition"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neutral-700 p-2 rounded-full hover:bg-neutral-600 transition"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neutral-700 p-2 rounded-full hover:bg-neutral-600 transition"
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
          className="fixed bottom-8 right-8 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </footer>
  );
};

export default Footer;
