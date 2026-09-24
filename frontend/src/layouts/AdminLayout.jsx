import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Eye, LayoutDashboard, Shield, Users, FileText, 
  LogOut, Menu, X, ChevronDown, CheckCircle, ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { path: '/admin/reviews', label: 'All Reviews', icon: CheckCircle },
    { path: '/admin/users', label: 'Doctor & User Management', icon: Users },
    { path: '/reports', label: 'Platform Reports', icon: FileText },
    { path: '/profile', label: 'Admin Profile', icon: Shield },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Admin Console Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static'
        )}
        style={{ width: '280px' }}
      >
        <div>
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-slate-950 shadow-md shadow-rose-500/20">
                <Eye className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Retina<span className="text-rose-400">XAI</span>
                </span>
                <p className="text-[10px] font-mono text-rose-400 uppercase tracking-widest">
                  System Admin
                </p>
              </div>
            </Link>
            <button
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role Status Tag */}
          <div className="px-6 py-3 border-b border-slate-800/80 bg-rose-950/20 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ADMIN PRIVILEGES
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              ACTIVE
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200',
                    active
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  <span className="flex items-center space-x-3">
                    <Icon className={clsx('h-4 w-4', active ? 'text-rose-400' : 'text-slate-400')} />
                    <span>{label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Block */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/40">
          <div
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-xs truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-rose-400 truncate">{user?.email}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {isProfileOpen && (
            <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 animate-fade-in">
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-rose-400" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-slate-900/60 backdrop-blur-lg border-b border-slate-800/80 flex items-center justify-between px-6 sticky top-0 z-40">
          <button
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="text-xs text-slate-400">
            <span>System Telemetry: </span>
            <strong className="text-emerald-400 font-semibold font-mono">ALL ENGINES ONLINE</strong>
          </div>

          <Link
            to="/admin/users"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-rose-400" />
            <span>Manage Users</span>
          </Link>
        </header>

        <main className="flex-1 p-6 lg:p-8 bg-slate-950 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;