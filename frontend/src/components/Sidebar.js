import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Store, Users } from 'lucide-react'; 
import '../styles/Sidebar.css';

const Sidebar = ({ isCollapsed }) => {
  const location = useLocation();
  
  const menuItems = [
    {
      name: 'Home',
      path: '/',
      icon: <Home size={20} />
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <User size={20} />
    },
    {
      name: 'Member Directory',
      path: '/directory',
      icon: <Users size={20} />
    },
    {
      name: 'Business Directory',
      path: '/service-listings',
      icon: <Store size={20} />
    }
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ul>
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link 
              to={item.path} 
              className={location.pathname === item.path ? 'active' : ''}
              title={isCollapsed ? item.name : null} // Add tooltip when collapsed
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-text">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;