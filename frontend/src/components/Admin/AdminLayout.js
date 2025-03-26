import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  DollarSign, 
  Settings, 
  LogOut, 
  ChevronLeft
} from 'lucide-react';

const AdminLayout = ({ children, title, currentPage }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Navigation items
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { id: 'users', name: 'User Management', icon: <Users size={20} />, path: '/admin/users' },
    { id: 'listings', name: 'Listings', icon: <Briefcase size={20} />, path: '/admin/listings' },
    { id: 'payments', name: 'Payments', icon: <DollarSign size={20} />, path: '/admin/payments' },
    { id: 'settings', name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' }
  ];
  
  // Only allow access if user is admin
  if (!user || user.planType !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h1>Unauthorized</h1>
        <p>You do not have permission to access the admin area.</p>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <div className="admin-user-info">
            <span className="admin-user-name">{user.name}</span>
            <span className="admin-badge">Administrator</span>
          </div>
        </div>
        
        <nav className="admin-nav">
          <ul>
            {navItems.map(item => (
              <li key={item.id}>
                <Link 
                  to={item.path} 
                  className={currentPage === item.id ? 'active' : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="admin-sidebar-footer">
          <button onClick={() => navigate('/')} className="back-to-site">
            <ChevronLeft size={16} />
            Back to Site
          </button>
          <Link to="/logout" className="admin-logout">
            <LogOut size={16} />
            Logout
          </Link>
        </div>
      </aside>
      
      <main className="admin-content">
        <header className="admin-content-header">
          <h1>{title}</h1>
        </header>
        
        <div className="admin-content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
