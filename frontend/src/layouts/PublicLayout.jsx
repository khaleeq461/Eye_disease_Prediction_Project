import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Eye, Home, Info, Briefcase, Phone, Menu, X, ChevronRight,
  Sparkles, ShieldCheck, Activity, ArrowRight, User
} from 'lucide-react';

const PublicLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About Project', icon: Info },
    { path: '/services', label: 'Clinical Services', icon: Briefcase },
    { path: '/contact', label: 'Contact', icon: Phone },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'doctor') return '/doctor/dashboard';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Clinical Floating Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 group-hover:scale-105 transition-all duration-300">
                <Eye className="h-6 w-6 stroke-[2.5]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  Retina<span className="text-cyan-400">XAI</span>
                </span>
                <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  Explainable Ophthalmic AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map(({ path, label }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}

              {/* Dynamic Authentication / Dashboard Quick Launcher */}
              <div className="ml-6 pl-6 border-l border-slate-800 flex items-center space-x-3">
                {user ? (
                  <Link
                    to={getDashboardPath()}
                    className="btn-gradient-cyan"
                  >
                    <User className="w-4 h-4" />
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="btn-gradient-cyan"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Start Diagnosis</span>
                    </Link>
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Menu Toggle Button */}
            <button
              className="md:hidden p-2.5 text-slate-300 hover:text-white bg-slate-900 rounded-xl border border-slate-800 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Drawer */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-800/80 space-y-2 animate-fade-in">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                    location.pathname === path
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-cyan-400" />
                    <span>{label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Link>
              ))}

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                {user ? (
                  <Link
                    to={getDashboardPath()}
                    className="btn-gradient-cyan text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Go to Portal ({user.role})
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full py-3 text-center text-sm font-semibold text-slate-300 bg-slate-900 rounded-xl border border-slate-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="btn-gradient-cyan text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Create Free Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Modern Medical Footer */}
      <footer className="relative bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 overflow-hidden text-slate-400 text-sm">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
            {/* Column 1: Brand & Mission */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-md">
                  <Eye className="h-5 w-5 stroke-[2.5]" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Retina<span className="text-cyan-400">XAI</span> Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explainable Dual-Stage Deep Learning for clinical ophthalmic triage, automated retinal lesion localization, and patient-doctor collaboration.
              </p>
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>EFFICIENTNET-B3 + GRAD-CAM++</span>
              </div>
            </div>

            {/* Column 2: Disease Specializations */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Pathology Coverage</h4>
              <ul className="space-y-2 text-xs">
                <li className="hover:text-cyan-300 transition-colors">Diabetic Retinopathy (DR)</li>
                <li className="hover:text-cyan-300 transition-colors">Glaucoma (Optic Cup Cupping)</li>
                <li className="hover:text-cyan-300 transition-colors">Cataract (Media Opacity)</li>
                <li className="hover:text-cyan-300 transition-colors">Pathological High Myopia</li>
                <li className="hover:text-cyan-300 transition-colors">Normal / Healthy Retinal Biomarkers</li>
              </ul>
            </div>

            {/* Column 3: Platform Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Clinical Features</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/diagnose" className="hover:text-cyan-300 transition-colors">Interactive XAI Visualizer Studio</Link></li>
                <li><Link to="/reports" className="hover:text-cyan-300 transition-colors">Hospital-Grade PDF Reports</Link></li>
                <li><Link to="/appointments" className="hover:text-cyan-300 transition-colors">Ophthalmologist Consultations</Link></li>
                <li><Link to="/about" className="hover:text-cyan-300 transition-colors">Neural Architecture Benchmark</Link></li>
              </ul>
            </div>

            {/* Column 4: Medical Advisory Disclaimer */}
            <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Activity className="w-4 h-4" />
                <span>Clinical Decision Support</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                This system provides AI-assisted decision support for ophthalmic triage. Final clinical diagnoses and prescriptions must be confirmed by a licensed ophthalmologist.
              </p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 RetinaXAI Healthcare Intelligence. Final Year Project.</p>
            <div className="flex space-x-6">
              <Link to="/about" className="hover:text-slate-300 transition-colors">System Architecture</Link>
              <Link to="/services" className="hover:text-slate-300 transition-colors">Clinical Workflow</Link>
              <Link to="/contact" className="hover:text-slate-300 transition-colors">Support & Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
