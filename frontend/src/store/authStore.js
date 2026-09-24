import { create } from 'zustand';
import axios from 'axios';
import BACKEND_URL from '../config';

// Configure axios defaults (uses vite proxy locally, or cloud backend URL if deployed)
axios.defaults.baseURL = BACKEND_URL;

// Create auth store
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,

  // Initialize - check if token exists and validate
  initialize: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const response = await axios.get('/api/auth/profile');
        set({ 
          user: response.data.data.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        // Prevent back navigation on protected pages
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.history.pushState(null, '', window.location.href);
        }
      } catch (error) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        
        // Clear history when session expires
        window.history.pushState(null, '', '/login');
      }
    } else {
      set({ isLoading: false });
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isAuthenticated: true });
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isAuthenticated: true });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
    
    // Replace history to prevent back navigation after logout
    window.history.replaceState(null, '', '/login');
  },

  // Update profile
  updateProfile: async (data) => {
    try {
      const response = await axios.put('/api/auth/profile', data);
      set({ user: response.data.data.user });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  }
}));

// Initialize on app start
useAuthStore.getState().initialize();