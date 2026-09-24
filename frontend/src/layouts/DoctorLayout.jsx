import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Eye, LayoutDashboard, ClipboardList, Calendar, Users, 
  LogOut, Menu, X, ChevronDown, UserCheck, Stethoscope, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';

const DoctorLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/doctor', label: 'Doctor Overview', icon: LayoutDashboard, exact: true },
    { path: '/doctor/reviews', label: 'Pending AI Reviews', icon: ClipboardList },
    { path: '/doctor/appointments', label: 'Consultations', icon: Calendar },
    { path: '/doctor/patients', label: 'Patient Directory', icon: Users },
    { path: '/doctor/profile', label: 'Doctor Credentials', icon: UserCheck },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Doctor Console Sidebar */}
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
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
                <Eye className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Retina<span className="text-emerald-400">XAI</span>
                </span>
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                  Doctor Workstation
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

          {/* Verification Badge */}
          <div className="px-6 py-3 border-b border-slate-800/80 bg-emerald-950/20 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              OPHTHALMOLOGIST
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              VERIFIED
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto">
            {navItems.map(({ path, label, icon: Icon, exact }) => {
              const active = isActive(path, exact);
              return (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200',
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  <span className="flex items-center space-x-3">
                    <Icon className={clsx('h-4 w-4', active ? 'text-emerald-400' : 'text-slate-400')} />
                    <span>{label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Doctor Info & Logout Block */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/40">
          <div
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-xs truncate">Dr. {user?.name}</p>
              <p className="text-[11px] text-emerald-400 truncate">{user?.specialization || 'Ophthalmologist'}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {isProfileOpen && (
            <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 animate-fade-in">
              <Link
                to="/doctor/profile"
                className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
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
            <span>Clinical Workstation: </span>
            <strong className="text-emerald-300 font-semibold">Triage & Validation Ready</strong>
          </div>

          <Link
            to="/doctor/reviews"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Review Queue</span>
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

export default DoctorLayout;