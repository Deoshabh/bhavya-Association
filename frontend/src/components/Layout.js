import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Menu, X, Home, User, Users, Briefcase } from 'lucide-react';

const Layout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Nav */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo and Site Name */}
            <div className="flex items-center">
              <div className="w-16 h-16 mr-3 flex items-center justify-center">
                <Store className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">BHAVYA</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-800 hover:text-primary font-medium">Home</Link>
              <Link to="/directory" className="text-gray-800 hover:text-primary font-medium">Directory</Link>
              <Link to="/services" className="text-gray-800 hover:text-primary font-medium">Services</Link>
              <Link to="/about" className="text-gray-800 hover:text-primary font-medium">About</Link>
              <Link to="/login" className="text-white bg-primary hover:bg-blue-700 font-medium px-4 py-2 rounded">Login</Link>
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-800"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {menuOpen && (
            <div className="mt-3 md:hidden">
              <div className="flex flex-col space-y-3 py-3">
                <Link to="/" className="text-gray-800 hover:text-primary font-medium py-2">Home</Link>
                <Link to="/directory" className="text-gray-800 hover:text-primary font-medium py-2">Directory</Link>
                <Link to="/services" className="text-gray-800 hover:text-primary font-medium py-2">Services</Link>
                <Link to="/about" className="text-gray-800 hover:text-primary font-medium py-2">About</Link>
                <Link to="/login" className="text-white bg-primary hover:bg-blue-700 font-medium px-4 py-2 rounded text-center">Login</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
        <div className="flex justify-around items-center py-2">
          <Link to="/" className="flex flex-col items-center px-3 py-2 text-primary">
            <Home size={20} />
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

export default Layout;
