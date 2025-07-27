import { useEffect, useRef } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import AccountStatusManager from "./components/AccountStatusManager";
import AdminReferralDashboard from "./components/AdminReferralDashboard";
import BottomNavigation from "./components/BottomNavigation";
import Footer from "./components/Footer";
import EnhancedFormBuilder from "./components/FormBuilder/EnhancedFormBuilder";
import EnhancedSubmissionManagement from "./components/FormBuilder/EnhancedSubmissionManagement";
import FormPreview from "./components/FormBuilder/FormPreview";
import MetaTags from "./components/MetaTags";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ServerStatus from "./components/ServerStatus";
import { AuthProvider } from "./context/AuthContext";
import About from "./pages/About";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminSettings from "./pages/Admin/AdminSettings";
import FormManagement from "./pages/Admin/FormManagement";
import ListingManagement from "./pages/Admin/ListingManagement";
import MatrimonialManagement from "./pages/Admin/MatrimonialManagement";
import NewsManagement from "./pages/Admin/NewsManagement";
import QAManagement from "./pages/Admin/QAManagement";
import UserManagement from "./pages/Admin/UserManagement";
import AdminLogin from "./pages/AdminLogin";
import BahujanDirectory from "./pages/BahujanDirectory";
import CreateListing from "./pages/CreateListing";
import CreateQuestion from "./pages/CreateQuestion";
import Directory from "./pages/Directory";
import FAQ from "./pages/FAQ";
import Home from "./pages/Home";
import LatestEvents from "./pages/LatestEvents";
import ListingDetails from "./pages/ListingDetails";
import Login from "./pages/Login";
import MatrimonialListing from "./pages/MatrimonialListing";
import MatrimonialRegistration from "./pages/MatrimonialRegistration";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Profile from "./pages/Profile";
import ProfileDetail from "./pages/ProfileDetail";
import QuestionDetail from "./pages/QuestionDetail";
import QuestionsAnswers from "./pages/QuestionsAnswers";
import ReferralDashboard from "./pages/ReferralDashboard";
import Register from "./pages/Register";
import ServiceListings from "./pages/ServiceListings";
import Terms from "./pages/Terms";
import UpgradeMembership from "./pages/UpgradeMembership";
import UserProfilePage from "./pages/UserProfilePage";
import { generatePageMeta } from "./utils/socialShareConfig";

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
        console.log(
          "Rapid navigation detected - managing to prevent browser throttling"
        );
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
  const defaultMeta = generatePageMeta("home");

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
          {/* Public routes */} <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bahujan-directory" element={<BahujanDirectory />} />
          <Route path="/upgrade-membership" element={<UpgradeMembership />} />
          <Route path="/service-listings" element={<ServiceListings />} />
          <Route path="/service-listings/:id" element={<ListingDetails />} />
          {/* Matrimonial routes */}
          <Route path="/matrimonial" element={<MatrimonialListing />} />
          <Route path="/matrimonial/profile/:id" element={<ProfileDetail />} />
          <Route
            path="/matrimonial/register"
            element={
              <ProtectedRoute>
                <MatrimonialRegistration />
              </ProtectedRoute>
            }
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/latest-events" element={<LatestEvents />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
          <Route path="/questions-answers" element={<QuestionsAnswers />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route
            path="/create-question"
            element={
              <ProtectedRoute>
                <CreateQuestion />
              </ProtectedRoute>
            }
          />
          <Route path="/admin-login" element={<AdminLogin />} />
          {/* Protected routes without sidebar */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/directory"
            element={
              <ProtectedRoute>
                <Directory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-profile/:userId"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute>
                <CreateListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referral"
            element={
              <ProtectedRoute>
                <ReferralDashboard />
              </ProtectedRoute>
            }
          />
          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <ProtectedRoute>
                <ListingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/referrals"
            element={
              <ProtectedRoute>
                <AdminReferralDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute>
                <NewsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qa"
            element={
              <ProtectedRoute>
                <QAManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matrimonial"
            element={
              <ProtectedRoute>
                <MatrimonialManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/forms"
            element={
              <ProtectedRoute>
                <FormManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/forms/new"
            element={
              <ProtectedRoute>
                <EnhancedFormBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/forms/:id/edit"
            element={
              <ProtectedRoute>
                <EnhancedFormBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/forms/:formId/submissions"
            element={
              <ProtectedRoute>
                <EnhancedSubmissionManagement />
              </ProtectedRoute>
            }
          />
          <Route path="/forms/preview" element={<FormPreview />} />
          {/* Public Form Access Route */}
          <Route
            path="/forms/:slug"
            element={<FormPreview publicForm={true} />}
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          {/* 404 - Page not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNavigation />
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
