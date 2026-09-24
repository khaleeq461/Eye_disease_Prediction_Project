// Centralized API and backend configuration
// Using Vite proxy - all requests to /api, /uploads are proxied to backend

const RAW_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';
const BACKEND_URL = RAW_URL ? RAW_URL.replace(/\/$/, '') : '';

export const API_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
export const UPLOAD_URL = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

export default BACKEND_URL;