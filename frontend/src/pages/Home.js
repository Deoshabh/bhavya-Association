import React, { useRef, useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  User,
  Users,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getDefaultShareImage } from "../utils/sharingImageUtil";
import MetaTags from "../components/MetaTags";
import LatestNews from "../components/LatestNews";

// Local assets
import bannerImage from "../assets/banner for home.jpg";
import eventsImage from "../assets/events.png";
import businessImage from "../assets/business.webp";
import jobImage from "../assets/Job.webp";
import marriagesImage from "../assets/matra.webp";
import trainingImage from "../assets/Traning.webp";

// Define your categories here
const categories = [
  { name: "TV Repairing", icon: "🔧" },
  { name: "Data Entry", icon: "💻" },
  { name: "Photographer", icon: "📸" },
  { name: "Carpenter", icon: "🪚" },
  { name: "Electrician", icon: "⚡" },
  { name: "Plumber", icon: "🚿" },
  { name: "Teacher", icon: "📚" },
  { name: "Doctor", icon: "🩺" },
  { name: "Web Developer", icon: "🌐" },
  { name: "Chef", icon: "👨‍🍳" },
  { name: "Designer", icon: "🎨" },
  { name: "Writer", icon: "✍️" },
  { name: "Consultant", icon: "💼" },
];

const Home = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Explanation section reference
  const explanationRef = useRef(null);

  // State for toggling the “Why Join Bhavya Associates?” content
  const [showBenefits, setShowBenefits] = useState(false);

  // State for blinking hero text effect
  const [isBlinking, setIsBlinking] = useState(false);

  // For potential mobile menu toggling
  const [menuOpen, setMenuOpen] = useState(false);

  // Structured data for organization
  const organizationStructuredData = {
    "@type": "Organization",
    "name": "BHAVYA - Bharat Vyapar Associates",
    "url": "https://bhavyasangh.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bhavyasangh.com/logo192.png",
      "width": "192",
      "height": "192"
    },
    "sameAs": [
      "https://www.facebook.com/bhavyasangh",
      "https://twitter.com/bhavyasangh",
      "https://www.linkedin.com/company/bhavyasangh"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "customer service",
      "availableLanguage": ["English", "Hindi"]
    },
    "description": "Connect with professionals and entrepreneurs from the Bahujan Samaj. Join our community to collaborate and grow together."
  };
  
  // Website structured data
  const websiteStructuredData = {
    "@type": "WebSite",
    "url": "https://bhavyasangh.com",
    "name": "BHAVYA - Bharat Vyapar Associates",
    "description": "Join Bharat Vyapar Associates (BHAVYA) - Connect with Bahujan community professionals & entrepreneurs worldwide. Expand your business network & discover opportunities.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://bhavyasangh.com/directory?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Effect for blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking((prev) => !prev);
    }, 1000); // Toggle every second

    return () => clearInterval(blinkInterval);
  }, []);

  // Scroll to Explanation and toggle benefits
  const scrollToExplanation = () => {
    explanationRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowBenefits((prev) => !prev);
  };

  // Handle hero button click based on authentication status
  const handleHeroButtonClick = () => {
    if (loading) {
      scrollToExplanation();
    } else if (user) {
      navigate("/directory");
    } else {
      navigate("/register");
    }
  };

  return (
    <>
      {/* Enhanced meta tags for the home page with comprehensive structured data */}
      <MetaTags 
        title="BHAVYA - Bharat Vyapar Associates | Community Network"
        description="Join Bharat Vyapar Associates (BHAVYA) - Connect with Bahujan community professionals & entrepreneurs worldwide. Expand your business network & discover opportunities."
        url="https://bhavyasangh.com"
        image={getDefaultShareImage()}
        type="website"
        schemaType="Organization"
        structuredData={{
          ...organizationStructuredData,
          "mainEntity": websiteStructuredData
        }}
      />
      
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          {/* Hero/Banner Section */}
          <section className="relative w-full">
            <div className="w-full h-[25vh] md:h-[35vh] relative overflow-hidden">
              <img
                src={bannerImage}
                alt="Bhavya Associates Banner"
                className="w-full h-full object-cover object-center scale-125"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div
                className={`bg-secondary text-white py-2 px-4 md:px-6 rounded-lg shadow-lg max-w-xs md:max-w-md text-center transform transition-transform ${
                  isBlinking ? "scale-105" : "scale-100"
                }`}
              >
                <h2 className="text-lg md:text-2xl font-bold mb-0.5">
                  International Bahujan Directory
                </h2>
                <p className="text-xs md:text-sm mb-1.5">
                  Connect with community worldwide
                </p>
                <button
                  onClick={handleHeroButtonClick}
                  className="bg-white text-secondary hover:bg-gray-100 font-bold py-1 px-4 rounded-lg transition-colors text-sm md:text-base"
                >
                  {user ? "Explore Directory" : "Join Now"}
                </button>
              </div>
            </div>
          </section>

          {/* Text Marquee (fast on mobile, slower on bigger screens) */}
          <div className="overflow-hidden mb-4 bg-gray-100 py-2 px-4 rounded-lg">
            {/* On mobile: .animate-marquee-fast, on sm+ screens: .animate-marquee */}
            <div className="whitespace-nowrap flex animate-marquee-fast sm:animate-marquee">
              <span className="inline-block text-primary font-medium mr-8">
                Connect with Bahujan community worldwide • Expand your business
                network • Discover new opportunities • Join cultural events • Find
                community members globally
              </span>
              <span className="inline-block text-primary font-medium mr-8">
                Connect with Bahujan community worldwide • Expand your business
                network • Discover new opportunities • Join cultural events • Find
                community members globally
              </span>
            </div>
          </div>

          {/* Explanation Section */}
          <section ref={explanationRef} className="py-6 md:py-8 bg-white">
            <div className="container mx-auto max-w-4xl">
              <button
                onClick={scrollToExplanation}
                className="flex items-center justify-center mx-auto mb-6 bg-transparent border-none cursor-pointer group"
                aria-expanded={showBenefits}
              >
                <h2 className="text-xl md:text-2xl font-bold text-center truncate text-nowrap">
                  Why Join Bhavya Associates?
                </h2>
                <ChevronDown
                  size={24}
                  className={`ml-2 text-gray-600 group-hover:text-primary transition-transform ${
                    showBenefits ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {/* Dropdown content */}
              <div
                className={`transition-all duration-500 overflow-hidden ${
                  showBenefits ? "max-h-[1000px]" : "max-h-0"
                }`}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3">
                      Find Community Members
                    </h3>
                    <p>
                      Connect with Bahujan community members globally and expand
                      your network.
                    </p>
                  </div>
                  {/* ...other grid items... */}
                  <div className="bg-white p-5 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3">
                      Business Opportunities
                    </h3>
                    <p>
                      Promote your services and discover business connections
                      within the community.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3">
                      Member Directory
                    </h3>
                    <p>
                      Access the complete directory of members with full contact
                      information.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3">
                      Cultural Connection
                    </h3>
                    <p>
                      Stay connected to your roots and participate in community
                      events.
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate(user ? "/directory" : "/register")}
                    className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                  >
                    {user ? "Explore Directory" : "Register Now"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Image Marquee Banner (fast on mobile, slower on bigger screens) */}
          <section className="py-4 px-4 bg-neutral-100">
            <h3 className="text-center text-xl font-semibold mb-4">
              Our Services
            </h3>
            <div className="relative overflow-hidden w-full h-36">
              {/* Double track: .animate-marquee-fast on mobile, .animate-marquee on sm+ */}
              <div className="flex animate-marquee-fast sm:animate-marquee whitespace-nowrap">
                {/* First copy of images */}
                <div className="inline-flex items-center mx-4">
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/business">
                      <img
                        src={businessImage}
                        alt="Business Services"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Business
                      </div>
                    </Link>
                  </div>
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/jobs">
                      <img
                        src={jobImage}
                        alt="Job Opportunities"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Jobs
                      </div>
                    </Link>
                  </div>
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/marriages">
                      <img
                        src={marriagesImage}
                        alt="Marriage Services"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Marriages
                      </div>
                    </Link>
                  </div>
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/training">
                      <img
                        src={trainingImage}
                        alt="Training Programs"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Training
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Second copy for seamless looping */}
                <div className="inline-flex items-center mx-4">
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/business">
                      <img
                        src={businessImage}
                        alt="Business Services"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Business
                      </div>
                    </Link>
                  </div>
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/jobs">
                      <img
                        src={jobImage}
                        alt="Job Opportunities"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Jobs
                      </div>
                    </Link>
                  </div>
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/marriages">
                      <img
                        src={marriagesImage}
                        alt="Marriage Services"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Marriages
                      </div>
                    </Link>
                  </div>
                  <div className="w-40 h-28 relative mx-2">
                    <Link to="/services/training">
                      <img
                        src={trainingImage}
                        alt="Training Programs"
                        className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer"
                      />
                      <div className="absolute bottom-0 w-full bg-primary-600 bg-opacity-80 py-1 text-white text-center text-xs">
                        Training
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Promote Business Banner Section - Clickable */}
          <section className="w-full px-0 py-6">
            <Link to={user ? "/create-listing" : "/register"} className="block">
              <div
                className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] bg-cover bg-center overflow-hidden shadow-xl rounded-lg mb-8 transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                style={{ backgroundImage: `url(${businessImage})` }}
              >
                {/* Overlay for better text visibility */}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                
                {/* Content container with centered text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="max-w-3xl px-4">
                    <h2
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-6 py-3 bg-black bg-opacity-50 rounded-md inline-block text-yellow-300"
                      style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                    >
                      Promote Your Business
                    </h2>
                    
                    <p className="text-white text-lg md:text-xl mb-6 px-4 py-2 bg-black bg-opacity-40 rounded-md">
                      Connect with potential clients and grow your network in our community
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          {/* Coming Events Section - Clickable */}
          <section className="w-full px-0 py-6">
            <a 
              href="https://bhavya.org.in"
              target="_blank" 
              rel="noopener noreferrer"
              className="block" 
            >
              <div
                className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] bg-cover bg-center overflow-hidden shadow-xl rounded-lg mb-8 transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                style={{ backgroundImage: `url(${eventsImage})` }}
              >
                <div className="absolute inset-0 bg-blue-600 z-[-1]"></div>

                {/* Dark overlay for better text visibility */}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center text-white">
                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 px-3 py-2 bg-black bg-opacity-50 rounded-md max-w-[90%] md:max-w-[80%] shadow-lg text-yellow-300"
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    Coming Events
                  </h2>

                  <p
                    className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-[95%] sm:max-w-[90%] md:max-w-xl px-3 py-2 bg-black bg-opacity-50 rounded-md text-cyan-200"
                    style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
                  >
                    Join our upcoming cultural, networking, Business events
                  </p>

                  <span className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-600 text-white font-bold px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 rounded-full text-sm sm:text-base shadow-lg border-2 border-white/30 hover:border-white/80 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl">
                    Visit Events
                    <span className="transform group-hover:translate-x-1 transition-all duration-300">
                      →
                    </span>
                  </span>
                </div>
              </div>
            </a>
          </section>
          
          {/* Latest News & Events Section */}
          <LatestNews />
          
          {/* Browse by Category Section */}
          <section className="py-6">
            <div className="container mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Browse by Category
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-neutral-50 transition-all cursor-pointer"
                    onClick={() => {
                      if (user) {
                        // Redirect to directory with search query for this category
                        navigate(`/directory?search=${encodeURIComponent(category.name)}`);
                      } else {
                        // Redirect to login page
                        navigate('/login', { 
                          state: { 
                            redirectAfterLogin: `/directory?search=${encodeURIComponent(category.name)}`,
                            message: "Please login to browse this category" 
                          } 
                        });
                      }
                    }}
                  >
                    <div className="text-3xl mb-3">{category.icon}</div>
                    <h3 className="text-sm md:text-base font-medium text-center">
                      {category.name}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
          <div className="flex justify-around items-center py-2">
            <Link
              to="/"
              className="flex flex-col items-center px-3 py-2 text-primary"
            >
              <HomeIcon size={20} />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              to="/directory"
              className="flex flex-col items-center px-3 py-2 text-gray-600"
            >
              <Users size={20} />
              <span className="text-xs mt-1">Directory</span>
            </Link>
            <Link
              to="/services"
              className="flex flex-col items-center px-3 py-2 text-gray-600"
            >
              <Briefcase size={20} />
              <span className="text-xs mt-1">Business</span>
            </Link>
            <Link
              to="/profile"
              className="flex flex-col items-center px-3 py-2 text-gray-600"
            >
              <User size={20} />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
