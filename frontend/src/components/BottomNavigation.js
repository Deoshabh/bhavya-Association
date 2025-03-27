import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Store, Users, Search, Grid } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/BottomNavigation.css';

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  // Only show protected routes if user is logged in
  const menuItems = [
    {
      name: 'Home',
      path: '/',
      icon: <Home size={20} />
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
      },
      {
        name: 'Promote Bussiness',
        path: '/service-listings',
        icon: <Store size={20} />
      }
    );
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
