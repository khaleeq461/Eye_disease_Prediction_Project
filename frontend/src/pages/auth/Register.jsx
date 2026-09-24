import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw, Stethoscope, UserCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    specialization: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      if (formData.role === 'doctor' && formData.specialization) {
        registerData.specialization = formData.specialization;
      }
      
      const result = await register(registerData);
      
      if (result.success) {
        toast.success('Registration successful! Welcome to RetinaXAI!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Unable to connect to the backend server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Get started with AI-powered retinal screening and clinical history tracking.
        </p>
      </div>

      {/* Role Selection Tabs (Patient vs Doctor) */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, role: 'patient' })}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            formData.role === 'patient'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Patient Account</span>
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, role: 'doctor' })}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            formData.role === 'doctor'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Doctor / Specialist</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">Full Name</label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-dark pl-11"
              placeholder={formData.role === 'doctor' ? 'Dr. Jane Smith' : 'John Doe'}
              disabled={isLoading}
              required
            />
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Specialization (if doctor) */}
        {formData.role === 'doctor' && (
          <div className="space-y-1 animate-fade-in">
            <label className="block text-xs font-semibold text-slate-300">Specialization</label>
            <div className="relative">
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="input-dark pl-11"
                placeholder="e.g. Vitreoretinal Surgeon / Pediatric Ophthalmology"
                disabled={isLoading}
                required
              />
              <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1">
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

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-dark pl-10 pr-9 text-xs"
                placeholder="Min 6 chars"
                disabled={isLoading}
                required
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-dark pl-10 text-xs"
                placeholder="Repeat password"
                disabled={isLoading}
                required
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-gradient-cyan py-3 text-sm font-bold shadow-cyan-500/20 disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Registering Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-xs text-slate-400 pt-1">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
          Sign In here
        </Link>
      </div>
    </div>
  );
};

export default Register;