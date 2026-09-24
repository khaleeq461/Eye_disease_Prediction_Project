import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, MapPin, Calendar, Lock, Save,
  ShieldCheck, Stethoscope, Eye, EyeOff, RefreshCw, KeyRound,
  UserCheck, CheckCircle2, Edit3, X, Building, Globe
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    address: {
      city: '',
      state: '',
      country: 'Pakistan',
      street: ''
    }
  });

  // Sync state whenever user object is loaded or changed in auth store
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        specialization: user.specialization || '',
        address: {
          city: user.address?.city || '',
          state: user.address?.state || '',
          country: user.address?.country || 'Pakistan',
          street: user.address?.street || ''
        }
      });
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        specialization: user.specialization || '',
        address: {
          city: user.address?.city || '',
          state: user.address?.state || '',
          country: user.address?.country || 'Pakistan',
          street: user.address?.street || ''
        }
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile details updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch {
      toast.error('An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsChangingPassword(true);
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        toast.success('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch {
      toast.error('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-100">
      {/* Top Banner & Profile Overview Card */}
      <div className="bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          {/* Avatar Icon */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold shadow-lg ${
            isDoctor
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30'
              : isAdmin
              ? 'bg-gradient-to-tr from-rose-500 to-amber-400 text-slate-950 shadow-rose-500/30'
              : 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 shadow-cyan-500/30'
          }`}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {isDoctor ? `Dr. ${user?.name || 'Doctor'}` : user?.name || 'User Profile'}
              </h1>
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase font-mono tracking-wider border shadow-sm ${
                isDoctor
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : isAdmin
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              }`}>
                {user?.role || 'Patient'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Verified Active
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                {user?.email || 'Loading email...'}
              </span>
              {formData.phone && (
                <span className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  {formData.phone}
                </span>
              )}
            </div>

            {isDoctor && (
              <div className="text-xs text-emerald-300 font-semibold flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                <span>Specialization: {user?.specialization || 'General Ophthalmology'}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            if (isEditing) {
              handleCancelEdit();
            } else {
              setIsEditing(true);
            }
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            isEditing
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600'
              : 'btn-gradient-cyan'
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4 text-rose-400" />
              <span>Cancel Editing</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Profile Form Card */}
      <div className="bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Account & Personal Information
            </h2>
          </div>
          {isEditing && (
            <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold animate-pulse">
              Editing Mode Active
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter full name"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-white font-medium text-sm transition-all outline-none ${
                    isEditing
                      ? 'bg-slate-950 border-2 border-cyan-500/70 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-100 cursor-default'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Email Address (Account Identifier) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Account Email
                </label>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Primary ID
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  readOnly
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 font-semibold outline-none text-sm cursor-not-allowed select-text"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="+92 300 1234567"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-white font-medium text-sm transition-all outline-none ${
                    isEditing
                      ? 'bg-slate-950 border-2 border-cyan-500/70 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-100 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Role Display */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                System Access Role
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 pointer-events-none" />
                <input
                  type="text"
                  value={user?.role ? user.role.toUpperCase() : 'PATIENT'}
                  disabled
                  readOnly
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-cyan-300 font-bold font-mono outline-none text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Doctor Specialization */}
            {isDoctor && (
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Ophthalmology Clinical Specialization
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 pointer-events-none" />
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Vitreoretinal Specialist, Retinal Surgeon, Cataract Expert"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-white font-medium text-sm transition-all outline-none ${
                      isEditing
                        ? 'bg-slate-950 border-2 border-emerald-500/70 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-950/70 border border-slate-800 text-slate-100 cursor-default'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Address / Location Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                City / Region
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 pointer-events-none" />
                <input
                  type="text"
                  name="address.city"
                  value={formData.address?.city || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-white font-medium text-sm transition-all outline-none ${
                    isEditing
                      ? 'bg-slate-950 border-2 border-cyan-500/70 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-100 cursor-default'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Country
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 pointer-events-none" />
                <input
                  type="text"
                  name="address.country"
                  value={formData.address?.country || 'Pakistan'}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Pakistan"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-white font-medium text-sm transition-all outline-none ${
                    isEditing
                      ? 'bg-slate-950 border-2 border-cyan-500/70 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-100 cursor-default'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Action Save Bar */}
          {isEditing && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto btn-gradient-cyan px-7 py-3 font-bold text-sm shadow-lg shadow-cyan-500/20"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Password Security Card */}
      <div className="bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-800">
          <KeyRound className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            Security & Password Update
          </h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2 max-w-md">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Current Password <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none text-sm transition-all"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                New Password (Min. 6 chars) <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none text-sm transition-all"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Confirm New Password <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none text-sm transition-all"
                  placeholder="Repeat new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn-gradient-cyan px-7 py-3 font-bold text-sm shadow-lg shadow-cyan-500/20"
            >
              {isChangingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;