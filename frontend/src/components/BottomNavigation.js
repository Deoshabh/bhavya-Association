import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Store, Users, MessageCircle, Calendar } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/BottomNavigation.css';

const BottomNavigation = () => {
  const { user } = useContext(AuthContext);
  
  // Base menu items available to all users
  const menuItems = [
    {
      name: 'Home',
      path: '/',
      icon: <Home size={20} />
    },
    {
      name: 'Latest News',
      path: '/latest-events',
      icon: <Calendar size={20} />
    },
    {
      name: 'Q&A',
      path: '/questions-answers',
      icon: <MessageCircle size={20} />
    }
  ];
  
  // Add the protected routes if user is logged in
  if (user) {
    menuItems.push(
      {
        name: 'Profile',
        path: '/profile',
        icon: <User size={20} />
      },
      {
        name: 'Directory',
        path: '/directory',
        icon: <Users size={20} />
      }
    );
  } else {
    // For guest users, add a services listing as public page
    menuItems.push({
      name: 'Services',
      path: '/service-listings',
      icon: <Store size={20} />
    });
  }

  return (
    <nav className="bottom-navigation block md:hidden">
      {menuItems.map((item, index) => (
        <NavLink 
          key={index} 
          to={item.path} 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon">
            {item.icon}
          </div>
          <span className="bottom-nav-label">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavigation;
