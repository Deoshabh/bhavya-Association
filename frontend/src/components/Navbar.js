import {
  Briefcase,
  Calendar,
  Heart,
  Home,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  RefreshCw,
  Share2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import logo from "../assets/logo4-1.png"; // Adjust to your logo path
import "../styles/Navbar.css"; // Make sure this path is correct

const Navbar = () => {
  const { user, loading, logout, clearCacheAndResetCookies } =
    useContext(AuthContext);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Show a shadow when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // If loading is too long, show login/register anyway
  useEffect(() => {
    let timeoutId;
    if (loading) {
      timeoutId = setTimeout(() => {
        setLoadingTooLong(true);
      }, 3000);
    } else {
      setLoadingTooLong(false);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // Handle cache clearing
  const handleClearCache = () => {
    clearCacheAndResetCookies();
  };

  // Define nav items
  const navItems = user
    ? [
        { label: "Home", path: "/", icon: <Home size={18} /> },
        { label: "Directory", path: "/directory", icon: <Users size={18} /> },
        {
          label: "Services",
          path: "/service-listings",
          icon: <Briefcase size={18} />,
        },
        {
          label: "Matrimonial",
          path: "/matrimonial",
          icon: <Heart size={18} />,
        },
        {
          label: "Latest News",
          path: "/latest-events",
          icon: <Calendar size={18} />,
        },
        {
          label: "Q&A",
          path: "/questions-answers",
          icon: <MessageCircle size={18} />,
        },
        { label: "Referrals", path: "/referral", icon: <Share2 size={18} /> },
        { label: "Profile", path: "/profile", icon: <User size={18} /> },
        user.planType === "admin" && {
          label: "Admin Panel",
          path: "/admin/dashboard",
          icon: <User size={18} />,
        },
      ].filter(Boolean)
    : [
        { label: "Home", path: "/", icon: <Home size={18} /> },
        {
          label: "Matrimonial",
          path: "/matrimonial",
          icon: <Heart size={18} />,
        },
        {
          label: "Latest News",
          path: "/latest-events",
          icon: <Calendar size={18} />,
        },
        {
          label: "Q&A",
          path: "/questions-answers",
          icon: <MessageCircle size={18} />,
        },
      ];

  // Toggle the mobile menu
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className={`navbar-container ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Bhavya Associates Logo" className="logo-image" />
          <div className="logo-container">
            <div className="main-logo-text" style={{ fontSize: "0.9em" }}>
              <span className="logo-text">BHAVYA</span>
            </div>
            <div className="sub-logo-text" style={{ fontSize: "0.9em" }}>
              <span className="highlighted">Bh</span>arat{" "}
              <span className="highlighted">Vy</span>apar{" "}
              <span className="highlighted">A</span>ssociates
            </div>
          </div>
        </Link>

        {/* Desktop Nav (hidden on mobile) */}
        <nav className="desktop-nav">
          <ul className="nav-menu">
            {navItems.map((item, idx) => (
              <li className="nav-item" key={idx}>
                <Link
                  to={item.path}
                  className={`nav-link ${
                    location.pathname === item.path ? "active" : ""
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            <li className="nav-item">
              <a
                href="https://bhavya.org.in"
                className="nav-link events"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar size={18} />
                <span>Events</span>
              </a>
            </li>
            <li className="nav-item">
              <button
                onClick={handleClearCache}
                className="nav-link clear-cache"
                aria-label="Clear Cache"
              >
                <RefreshCw size={18} />
                <span>Clear Cache</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Auth section (desktop only) */}
        <div className="auth-section">
          {loading && !loadingTooLong ? (
            <div className="loading-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : user ? (
            <div className="user-actions">
              <div className="user-info">
                <span className="welcome-text">
                  <Link to="/profile">Hello, {user.name.split(" ")[0]}</Link>
                </span>
              </div>
              <button
                onClick={logout}
                className="logout-button"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-button login">
                <LogIn size={18} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="auth-button register">
                <UserPlus size={18} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle (shown below 992px) */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav (only visible if isOpen = true) */}
      {isOpen && (
        <div className="mobile-nav">
          <ul className="mobile-nav-menu">
            {navItems.map((item, idx) => (
              <li className="mobile-nav-item" key={idx}>
                <Link
                  to={item.path}
                  className={`mobile-nav-link ${
                    location.pathname === item.path ? "active" : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            <li className="mobile-nav-item">
              <a
                href="https://bhavya.org.in"
                className="mobile-nav-link events"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                <Calendar size={18} />
                <span>Events</span>
              </a>
            </li>

            {/* Mobile Auth items */}
            {!loading &&
              (user ? (
                <li className="mobile-nav-item mobile-logout">
                  <button onClick={logout} className="mobile-nav-button">
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </li>
              ) : (
                <>
                  <li className="mobile-nav-item">
                    <Link
                      to="/login"
                      className="mobile-nav-link"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogIn size={18} />
                      <span>Login</span>
                    </Link>
                  </li>
                  <li className="mobile-nav-item">
                    <Link
                      to="/register"
                      className="mobile-nav-link register"
                      onClick={() => setIsOpen(false)}
                    >
                      <UserPlus size={18} />
                      <span>Register</span>
                    </Link>
                  </li>
                </>
              ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
