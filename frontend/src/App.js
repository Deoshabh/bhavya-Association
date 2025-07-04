import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ServerStatus from './components/ServerStatus';
import AccountStatusManager from './components/AccountStatusManager';
import BottomNavigation from './components/BottomNavigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Directory from './pages/Directory';
import UserProfilePage from './pages/UserProfilePage';
import UpgradeMembership from './pages/UpgradeMembership';
import Footer from './components/Footer';
import ServiceListings from './pages/ServiceListings';
import CreateListing from './pages/CreateListing';
import ListingDetails from './pages/ListingDetails';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';
import About from './pages/About';
import NotFound from './pages/NotFound';
import BahujanDirectory from './pages/BahujanDirectory';
import MetaTags from './components/MetaTags';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import ListingManagement from './pages/Admin/ListingManagement';
import AdminSettings from './pages/Admin/AdminSettings';
import NewsManagement from './pages/Admin/NewsManagement';
import AdminLogin from './pages/AdminLogin';
import LatestEvents from './pages/LatestEvents';
import NewsDetail from './pages/NewsDetail';
import RouteCacheDebugger from './components/RouteCacheDebugger';
import { generatePageMeta } from './utils/socialShareConfig';

// ScrollToTopAndGuard component for navigation safety and scroll management
const ScrollToTopAndGuard = () => {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef(pathname);
  const lastNavigationTimeRef = useRef(Date.now());
  
  useEffect(() => {
    // If this is a new navigation (pathname changed)
    if (prevPathnameRef.current !== pathname) {
      const now = Date.now();
      const timeSinceLastNav = now - lastNavigationTimeRef.current;
      
      // If navigation happens too quickly (less than 300ms since last one)
      if (timeSinceLastNav < 300) {
        console.log('Rapid navigation detected - managing to prevent browser throttling');
      } else {
        // Normal navigation - scroll to top
        window.scrollTo(0, 0);
      }
      
      // Update timestamps and refs
      lastNavigationTimeRef.current = now;
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);
  
  // This component doesn't render anything
  return null;
};

function App() {
  // Generate default meta configuration for home page
  const defaultMeta = generatePageMeta('home');
  
  return (
    <AuthProvider>
      <Router>
        {/* Add global default meta tags for home page */}
        <MetaTags 
          title={defaultMeta.title}
          description={defaultMeta.description}
          url={defaultMeta.url}
          image={defaultMeta.image}
          keywords={defaultMeta.keywords}
          type="website"
        />
      
        {/* Include ScrollToTopAndGuard component for navigation safety */}
        <ScrollToTopAndGuard />
        <ServerStatus />
        <AccountStatusManager />
        <Navbar />
        <Routes>
          {/* Public routes */}          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bahujan-directory" element={<BahujanDirectory />} />
          <Route path="/upgrade-membership" element={<UpgradeMembership />} />
          <Route path="/service-listings" element={<ServiceListings />} />
          <Route path="/service-listings/:id" element={<ListingDetails />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/latest-events" element={<LatestEvents />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Protected routes without sidebar */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/directory" element={
            <ProtectedRoute>
              <Directory />
            </ProtectedRoute>
          } />
          <Route path="/user-profile/:userId" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/create-listing" element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/listings" element={
            <ProtectedRoute>
              <ListingManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/news" element={
            <ProtectedRoute>
              <NewsManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          } />
            {/* 404 - Page not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNavigation />
        <Footer />
        {/* Add the route cache debugger for development */}
        <RouteCacheDebugger />
      </Router>
    </AuthProvider>
  );
}

export default App;
