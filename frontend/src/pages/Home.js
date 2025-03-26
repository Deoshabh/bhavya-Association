import React, { useRef, useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Menu, X, Home as HomeIcon, User, Users, Briefcase, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import bannerImage from '../assets/banner for home.jpg';
// Import the events image
import eventsImage from '../assets/events.png';

// Category data
const categories = [
  { name: 'TV Repairing', icon: '🔧' },
  { name: 'Data Entry', icon: '💻' },
  { name: 'Photographer', icon: '📸' },
  { name: 'Carpenter', icon: '🪚' },
  { name: 'Electrician', icon: '⚡' },
  { name: 'Plumber', icon: '🚿' },
  { name: 'Teacher', icon: '📚' },
  { name: 'Doctor', icon: '🩺' }
];

const Home = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const explanationRef = useRef(null);
  const [showBenefits, setShowBenefits] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Create blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 1000); // Toggle every second
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Revert to the original combined function
  const scrollToExplanation = () => {
    explanationRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowBenefits(!showBenefits);  // Toggle benefits when scrolling
  };

  // Handle hero button click based on authentication status
  const handleHeroButtonClick = () => {
    if (loading) {
      scrollToExplanation();
    } else if (user) {
      navigate('/directory');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero/Banner Section */}
        <section className="relative w-full">
          {/* Container for the background image */}
          <div className="w-full h-[25vh] md:h-[35vh] relative overflow-hidden">
            <img 
              src={bannerImage} 
              alt="Bhavya Association Banner" 
              className="w-full h-full object-cover object-center scale-125" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            {/* More horizontal card with less vertical padding */}
            <div className={`bg-secondary text-white py-2 px-4 md:px-6 rounded-lg shadow-lg max-w-xs md:max-w-md text-center transform transition-transform ${isBlinking ? 'scale-105' : 'scale-100'}`}>
              <h2 className="text-lg md:text-2xl font-bold mb-0.5">International Bahujan Directory</h2>
              <p className="text-xs md:text-sm mb-1.5">Connect with community members worldwide</p>
              <button 
                onClick={handleHeroButtonClick}
                className="bg-white text-secondary hover:bg-gray-100 font-bold py-1 px-4 rounded-lg transition-colors text-sm md:text-base"
              >
                {user ? 'Explore Directory' : 'Join Now'}
              </button>
            </div>
          </div>
        </section>

        

        {/* Explanation section with dropdown functionality */}
        <section ref={explanationRef} className="py-6 md:py-8 bg-white">
          <div className="container mx-auto max-w-4xl">
            {/* Replace the heading and side button with a single button */}
            <button 
              onClick={scrollToExplanation}
              className="flex items-center justify-center mx-auto mb-6 bg-transparent border-none cursor-pointer group"
              aria-expanded={showBenefits}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center">Why Join Bhavya Association?</h2>
              <ChevronDown 
                size={24} 
                className={`ml-2 text-gray-600 group-hover:text-primary transition-transform ${showBenefits ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>
            
            {/* Dropdown content */}
            <div className={`transition-all duration-500 overflow-hidden ${showBenefits ? 'max-h-[1000px]' : 'max-h-0'}`}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-3">Find Community Members</h3>
                  <p>Connect with Bahujan community members globally and expand your network.</p>
                </div>
                {/* ...other grid items... */}
                <div className="bg-white p-5 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-3">Business Opportunities</h3>
                  <p>Promote your services and discover business connections within the community.</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-3">Premium Benefits</h3>
                  <p>Gain full access to contact information and enhanced visibility with premium membership.</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-3">Cultural Connection</h3>
                  <p>Stay connected to your roots and participate in community events.</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button 
                  onClick={() => navigate(user ? '/directory' : '/register')}
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                  {user ? 'Explore Directory' : 'Register Now'}
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Events Banner Section - Modified for full width */}
        <section className="w-full px-0 py-6">
          <div 
            className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] bg-cover bg-center overflow-hidden shadow-md border border-gray-200 mb-8"
            style={{ backgroundImage: `url(${eventsImage})` }}
          >
            {/* Fallback background color */}
            <div className="absolute inset-0 bg-blue-600 z-[-1]"></div>
            
            {/* Dark overlay for better text visibility */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center text-white">
                    
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 px-3 py-2 bg-black bg-opacity-50 rounded-md max-w-[90%] md:max-w-[80%] shadow-lg text-yellow-300" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    Coming Events
                    </h2>
                    
                    <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-[95%] sm:max-w-[90%] md:max-w-xl px-3 py-2 bg-black bg-opacity-50 rounded-md text-cyan-200" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                    Join our upcoming cultural, networking, Business events
                    </p>
                    
                    <a 
                    href="https://bhavya.org.in" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-600 text-white font-bold px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 rounded-full text-sm sm:text-base shadow-lg border-2 border-white/30 hover:border-white/80 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/20"
                    >
                    Visit Events
                    <span className="transform group-hover:translate-x-1 transition-all duration-300">→</span>
                    </a>
                    
                  </div>
                  </div>
                </section>
                
                {/* Categories Section */}
        <section className="py-10 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Browse by Category</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <div key={index} className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h3 className="text-sm md:text-base font-medium text-center">{category.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
        <div className="flex justify-around items-center py-2">
          <Link to="/" className="flex flex-col items-center px-3 py-2 text-primary">
            <HomeIcon size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/directory" className="flex flex-col items-center px-3 py-2 text-gray-600">
            <Users size={20} />
            <span className="text-xs mt-1">Directory</span>
          </Link>
          <Link to="/services" className="flex flex-col items-center px-3 py-2 text-gray-600">
            <Briefcase size={20} />
            <span className="text-xs mt-1">Business</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center px-3 py-2 text-gray-600">
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
