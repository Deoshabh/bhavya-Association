import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Store, Users } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

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
        name: 'Business',
        path: '/service-listings',
        icon: <Store size={20} />
      }
    );
  }

  return (
    <nav className="bottom-nav">
      <ul>
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link 
              to={item.path} 
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-text">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNavigation;
