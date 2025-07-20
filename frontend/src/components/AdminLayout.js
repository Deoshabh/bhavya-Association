import {
  Briefcase,
  ChevronLeft,
  DollarSign,
  FileText,
  FormInput,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminLayout = ({ children, title, currentPage }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navigation items
  const navItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/admin/dashboard",
    },
    {
      id: "users",
      name: "User Management",
      icon: <Users size={20} />,
      path: "/admin/users",
    },
    {
      id: "referrals",
      name: "Referral System",
      icon: <UserPlus size={20} />,
      path: "/admin/referrals",
    },
    {
      id: "listings",
      name: "Listings",
      icon: <Briefcase size={20} />,
      path: "/admin/listings",
    },
    {
      id: "news",
      name: "News & Events",
      icon: <FileText size={20} />,
      path: "/admin/news",
    },
    {
      id: "qa",
      name: "Q&A Management",
      icon: <MessageCircle size={20} />,
      path: "/admin/qa",
    },
    {
      id: "forms",
      name: "Form Builder",
      icon: <FormInput size={20} />,
      path: "/admin/forms",
    },
    {
      id: "payments",
      name: "Payments",
      icon: <DollarSign size={20} />,
      path: "/admin/payments",
    },
    {
      id: "settings",
      name: "Settings",
      icon: <Settings size={20} />,
      path: "/admin/settings",
    },
  ];

  // Only allow access if user is admin
  if (!user || user.planType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin area.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm hidden md:block">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600">Admin Panel</h2>
          <div className="mt-2">
            <span className="text-sm font-medium text-gray-700 block">
              {user.name}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Administrator
            </span>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200">
          <button
            onClick={() => navigate("/")}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full mb-2"
          >
            <ChevronLeft size={18} className="mr-2" />
            Back to Site
          </button>
          <Link
            to="/logout"
            className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md w-full"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 ${
                currentPage === item.id ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1">
        <header className="bg-white shadow-sm px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
