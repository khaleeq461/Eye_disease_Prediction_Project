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

export const usePredictionStore = create((set, get) => ({
  predictions: [],
  currentPrediction: null,
  isLoading: false,
  error: null,

  // Upload image and get diagnosis
  diagnose: async (imageFile) => {
    set({ isLoading: true, error: null });
    
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/prediction/diagnose', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Diagnosis result:', response.data);
      
      set({ 
        currentPrediction: response.data.data,
        isLoading: false 
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Diagnosis error:', error);
      const message = error.response?.data?.message || 'Diagnosis failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // Get prediction history (user's own predictions)
  getHistory: async (page = 1, limit = 10) => {
    set({ isLoading: true });
    
    try {
      const response = await axios.get(`/api/prediction/history?page=${page}&limit=${limit}`);
      set({ 
        predictions: response.data.data.predictions,
        isLoading: false 
      });
      return response.data.data;
    } catch (error) {
      set({ error: 'Failed to fetch history', isLoading: false });
      return null;
    }
  },

  // Get single prediction
  getPrediction: async (id) => {
    set({ isLoading: true });
    
    try {
      const response = await axios.get(`/api/prediction/${id}`);
      set({ 
        currentPrediction: response.data.data.prediction,
        isLoading: false 
      });
      return response.data.data.prediction;
    } catch (error) {
      set({ error: 'Failed to fetch prediction', isLoading: false });
      return null;
    }
  },

  // Get stats (user's own stats)
  getStats: async () => {
    try {
      const response = await axios.get('/api/prediction/stats/overview');
      return response.data.data;
    } catch (error) {
      console.error('Stats fetch error:', error);
      return null;
    }
  },

  // Delete prediction
  deletePrediction: async (id) => {
    try {
      await axios.delete(`/api/prediction/${id}`);
      set((state) => ({
        predictions: state.predictions.filter(p => p._id !== id)
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Delete failed' };
    }
  },

  // Clear current prediction
  clearPrediction: () => {
    set({ currentPrediction: null, error: null });
  }
}));