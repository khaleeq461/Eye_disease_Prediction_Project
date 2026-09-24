import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw, Shield, Stethoscope, UserCheck } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDemoFill = (email, password, roleLabel) => {
    setFormData({ email, password });
    toast.success(`Loaded ${roleLabel} demo credentials!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Authentication successful!');
        
        setTimeout(() => {
          const userToken = localStorage.getItem('token');
          if (userToken) {
            try {
              const user = JSON.parse(atob(userToken.split('.')[1]));
              if (user.role === 'admin') navigate('/admin');
              else if (user.role === 'doctor') navigate('/doctor');
              else navigate('/dashboard');
            } catch {
              navigate('/dashboard');
            }
          } else {
            navigate('/dashboard');
          }
        }, 400);
      } else {
        toast.error(result.message || 'Login failed. Check your email and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Unable to connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Sign In to Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Access diagnostic screening, doctor second opinions, and patient records.
        </p>
      </div>

      {/* 1-Click Fast Demo Login Selector (Convenient for FYP Defense) */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            1-CLICK DEMO ACCOUNTS
          </span>
          <span className="text-slate-500">EVALUATOR SHORTCUT</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoFill('doctor1@aiyecare.com', 'doctor123', 'Doctor')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
          >
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            <span>Doctor Login</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('admin@aiyecare.com', 'admin123', 'Admin')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Login</span>
          </button>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Email Address</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-dark pl-11"
              placeholder="name@example.com"
              disabled={isLoading}
              required
            />
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">Password</label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-dark pl-11 pr-11"
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-gradient-cyan py-3 text-sm font-bold shadow-cyan-500/20 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="text-center text-xs text-slate-400 pt-2">
        Don't have an account yet?{' '}
        <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
};

export default Login;