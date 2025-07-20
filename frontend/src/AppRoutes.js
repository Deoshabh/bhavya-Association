import { Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminRoute from "./components/Auth/AdminRoute";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from './components/UI/LoadingSpinner';
import { AuthProvider } from './context/AuthContext';

// Lazy load components for better performance
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Directory = lazy(() => import("./pages/Directory"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const QuestionsAnswers = lazy(() => import("./pages/QuestionsAnswers"));
const QuestionDetail = lazy(() => import("./pages/QuestionDetail"));
const Referrals = lazy(() => import("./pages/ReferralDashboard"));

// Admin Components
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/Admin/UserManagement"));
const AdminNews = lazy(() => import("./pages/Admin/NewsManagement"));
const AdminListings = lazy(() => import("./pages/Admin/ListingManagement"));
const AdminQuestions = lazy(() => import("./pages/Admin/QAManagement"));
const AdminAnswers = lazy(() => import("./pages/Admin/QAManagement")); // Same as questions
const AdminReferrals = lazy(() => import("./pages/Admin/AdminDashboard")); // Use dashboard for now

// Enhanced Form Builder Components
const FormBuilder = lazy(() => import("./components/FormBuilder/FormBuilder"));
const EnhancedFormBuilder = lazy(() =>
  import("./components/FormBuilder/EnhancedFormBuilder")
);
const FormPreview = lazy(() => import("./components/FormBuilder/FormPreview"));
const EnhancedSubmissionManagement = lazy(() =>
  import("./components/FormBuilder/EnhancedSubmissionManagement")
);
const FormEmbedder = lazy(() =>
  import("./components/FormBuilder/FormEmbedder")
);
const FormManagementDashboard = lazy(() =>
  import("./components/FormBuilder/FormManagementDashboard")
);

// Create a comprehensive Form Management Dashboard component
const FormManagementRoutes = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Form Management Dashboard - Default route */}
        <Route index element={<FormManagementDashboard />} />
        {/* Form Builder Routes */}
        <Route path="list" element={<FormBuilder />} />
        <Route path="create" element={<EnhancedFormBuilder />} />
        <Route path="edit/:formId" element={<EnhancedFormBuilder />} />
        <Route path="preview/:formId" element={<FormPreview />} />
        <Route path="submissions" element={<EnhancedSubmissionManagement />} />
        <Route
          path="submissions/:formId"
          element={<EnhancedSubmissionManagement />}
        />
        <Route path="embed/:formId" element={<FormEmbedder />} />
      </Routes>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />

          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/questions" element={<QuestionsAnswers />} />
                <Route path="/questions/:id" element={<QuestionDetail />} />

                {/* Protected User Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <Referrals />
                    </ProtectedRoute>
                  }
                />

                {/* Enhanced Form Builder Routes - Admin Only */}
                <Route
                  path="/admin/forms/*"
                  element={
                    <AdminRoute>
                      <FormManagementRoutes />
                    </AdminRoute>
                  }
                />

                {/* Traditional Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/news"
                  element={
                    <AdminRoute>
                      <AdminNews />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/listings"
                  element={
                    <AdminRoute>
                      <AdminListings />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/questions"
                  element={
                    <AdminRoute>
                      <AdminQuestions />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/answers"
                  element={
                    <AdminRoute>
                      <AdminAnswers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/referrals"
                  element={
                    <AdminRoute>
                      <AdminReferrals />
                    </AdminRoute>
                  }
                />

                {/* Legacy Form Builder Route - Redirect to Enhanced */}
                <Route
                  path="/admin/form-builder"
                  element={<Navigate to="/admin/forms" replace />}
                />

                {/* Public Form Display Routes */}
                <Route
                  path="/forms/view/:formId"
                  element={<FormPreview readOnly={true} />}
                />
                <Route
                  path="/forms/embed/:formId"
                  element={<FormPreview embedded={true} />}
                />

                {/* 404 - Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default AppRoutes;
