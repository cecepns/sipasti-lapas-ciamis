import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.sipastilapasciamis.my.id/api';
export const ASSET_BASE_URL = import.meta.env.VITE_ASSET_URL || 'https://api.sipastilapasciamis.my.id';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sipasti_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isPublicPage = ['/', '/login', '/absensi-kiosk', '/registrasi-mitra'].includes(currentPath);
      if (!isPublicPage) {
        localStorage.removeItem('sipasti_token');
        localStorage.removeItem('sipasti_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getAssetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `${ASSET_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
