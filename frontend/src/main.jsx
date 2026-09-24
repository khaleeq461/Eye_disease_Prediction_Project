import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

// Prevent back button navigation on protected pages
const preventBackNavigation = () => {
  // Replace the current history entry to prevent back navigation
  window.history.replaceState(null, '', window.location.href);
  
  // Block back button
  window.addEventListener('popstate', (event) => {
    // Don't allow going back
    window.history.pushState(null, '', window.location.href);
  });
};

// Initialize back button prevention
preventBackNavigation();

// Push initial state
window.history.pushState(null, '', window.location.href);

// Also prevent on visibility change (mobile browsers)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    window.history.pushState(null, '', window.location.href);
  }
});

// Block beforeunload just in case
window.addEventListener('beforeunload', (e) => {
  // We want to prevent navigation away, but this is limited
  // e.preventDefault();
  // e.returnValue = '';
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);