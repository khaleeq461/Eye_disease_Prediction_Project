import { create } from 'zustand';
import axios from 'axios';
import BACKEND_URL from '../config';

// Configure axios defaults (uses vite proxy locally, or cloud backend URL if deployed)
axios.defaults.baseURL = BACKEND_URL;

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const useAppointmentStore = create((set, get) => ({
  appointments: [],
  currentAppointment: null,
  isLoading: false,
  error: null,

  // Get user's appointments
  getAppointments: async (page = 1, limit = 10, status = null) => {
    set({ isLoading: true });
    
    try {
      let url = `/api/appointments?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      
      const response = await axios.get(url);
      set({ 
        appointments: response.data.data.appointments,
        isLoading: false 
      });
      return response.data.data;
    } catch (error) {
      set({ error: 'Failed to fetch appointments', isLoading: false });
      return null;
    }
  },

  // Get single appointment
  getAppointment: async (id) => {
    set({ isLoading: true });
    
    try {
      const response = await axios.get(`/api/appointments/${id}`);
      set({ 
        currentAppointment: response.data.data.appointment,
        isLoading: false 
      });
      return response.data.data.appointment;
    } catch (error) {
      set({ error: 'Failed to fetch appointment', isLoading: false });
      return null;
    }
  },

  // Book appointment
  bookAppointment: async (appointmentData) => {
    set({ isLoading: true });
    
    try {
      const response = await axios.post('/api/appointments', appointmentData);
      set({ isLoading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ error: error.response?.data?.message || 'Booking failed', isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Booking failed' };
    }
  },

  // Update appointment
  updateAppointment: async (id, data) => {
    try {
      const response = await axios.put(`/api/appointments/${id}`, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: 'Update failed' };
    }
  },

  // Cancel appointment
  cancelAppointment: async (id, reason = null) => {
    try {
      await axios.delete(`/api/appointments/${id}`, { data: { reason } });
      set((state) => ({
        appointments: state.appointments.map(a => 
          a._id === id ? { ...a, status: 'cancelled' } : a
        )
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Cancellation failed' };
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}));