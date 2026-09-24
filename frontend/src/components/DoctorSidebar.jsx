import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Eye, LayoutDashboard, FileText, Calendar, Users, 
  LogOut, Menu, X, ChevronDown, ClipboardList, UserCheck
} from 'lucide-react';
import clsx from 'clsx';

const DoctorSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/reviews', label: 'Pending Reviews', icon: ClipboardList },
    { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { path: '/doctor/patients', label: 'My Patients', icon: Users },
    { path: '/doctor/profile', label: 'Profile', icon: UserCheck },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl transform transition-transform duration-300 ease-in-out text-white',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static'
        )}
        style={{ width: '280px' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-blue-700">
          <Link to="/" className="flex items-center space-x-2">
            <Eye className="h-8 w-8 text-blue-300" />
            <span className="text-xl font-bold">AI-Powered Eye Care</span>
          </Link>
          <button
            className="lg:hidden p-2 hover:bg-blue-700 rounded"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-4 border-b border-blue-700">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
            Doctor Panel
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={clsx(
                'flex items-center space-x-3 px-6 py-3 mx-2 rounded-lg transition-colors',
                location.pathname === path
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-blue-700 p-4">
          <div
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-700 cursor-pointer"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-blue-300">Dr. {user?.specialization || 'Specialist'}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-blue-300" />
          </div>

          {isProfileOpen && (
            <div className="mt-2 space-y-1">
              <Link
                to="/doctor/profile"
                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-200 hover:bg-blue-700 hover:text-white rounded"
              >
                <UserCheck className="h-4 w-4" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white rounded"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Content will be rendered here */}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorSidebar;