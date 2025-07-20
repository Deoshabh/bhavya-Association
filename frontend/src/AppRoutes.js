import { Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminRoute from './components/Auth/AdminRoute';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/UI/LoadingSpinner';
import { AuthProvider } from './context/AuthContext';

// Lazy load components for better performance
const Home = lazy(() => import('./components/Home/Home'));
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const Profile = lazy(() => import('./components/Profile/Profile'));
const Directory = lazy(() => import('./components/Directory/Directory'));
const News = lazy(() => import('./components/News/News'));
const NewsDetail = lazy(() => import('./components/News/NewsDetail'));
const QuestionsAnswers = lazy(() => import('./components/QA/QuestionsAnswers'));
const QuestionDetail = lazy(() => import('./components/QA/QuestionDetail'));
const Referrals = lazy(() => import('./components/Referrals/Referrals'));

// Admin Components
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/Admin/AdminUsers'));
const AdminNews = lazy(() => import('./components/Admin/AdminNews'));
const AdminListings = lazy(() => import('./components/Admin/AdminListings'));
const AdminQuestions = lazy(() => import('./components/Admin/AdminQuestions'));
const AdminAnswers = lazy(() => import('./components/Admin/AdminAnswers'));
const AdminReferrals = lazy(() => import('./components/Admin/AdminReferrals'));

// Enhanced Form Builder Components
const FormBuilder = lazy(() => import('./components/FormBuilder/FormBuilder'));
const EnhancedFormBuilder = lazy(() => import('./components/FormBuilder/EnhancedFormBuilder'));
const FormPreview = lazy(() => import('./components/FormBuilder/FormPreview'));
const EnhancedSubmissionManagement = lazy(() => import('./components/FormBuilder/EnhancedSubmissionManagement'));
const FormEmbedder = lazy(() => import('./components/FormBuilder/FormEmbedder'));

// Create a comprehensive Form Management Dashboard component
const FormManagementDashboardComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Form Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create, manage, and analyze your forms with our enhanced form builder
          </p>
        </div>
        
        <Routes>
          {/* Form Builder Routes */}
          <Route index element={<FormBuilder />} />
          <Route path="create" element={<EnhancedFormBuilder />} />
          <Route path="edit/:formId" element={<EnhancedFormBuilder />} />
          <Route path="preview/:formId" element={<FormPreview />} />
          <Route path="submissions" element={<EnhancedSubmissionManagement />} />
          <Route path="submissions/:formId" element={<EnhancedSubmissionManagement />} />
          <Route path="embed/:formId" element={<FormEmbedder />} />
        </Routes>
      </div>
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
                      <FormManagementDashboardComponent />
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
                <Route path="/forms/view/:formId" element={<FormPreview readOnly={true} />} />
                <Route path="/forms/embed/:formId" element={<FormPreview embedded={true} />} />

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
