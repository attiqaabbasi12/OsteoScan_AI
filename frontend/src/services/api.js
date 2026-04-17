import axios from 'axios';

// ── API Base URL ───────────────────────────────────────────────
// Local dev  : uses React proxy (set in package.json → "proxy")
// Production : uses HuggingFace Spaces URL
const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const API = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRoute = error.config.url.includes('/auth/login');
      if (!isLoginRoute) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── AUTH ──────────────────────────────────────────────────────
export const register       = (data)     => API.post('/auth/register', data);
export const login          = (data)     => API.post('/auth/login', data);
export const getProfile     = ()         => API.get('/auth/profile');
export const changePassword = (data)     => API.put('/auth/password', data);

// ── SCAN ──────────────────────────────────────────────────────
export const classifyXray  = (formData) => API.post('/scan/classify', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getQuestions  = (xrayClass) => API.get(`/scan/questions/${xrayClass}`);
export const submitSession = (data)      => API.post('/scan/submit', data);
export const getImageUrl   = (filename)  => `${BASE_URL}/scan/image/${filename}`;
export const getHeatmapUrl = (filename)  => `${BASE_URL}/scan/heatmap/${filename}`;

// ── HISTORY ───────────────────────────────────────────────────
export const getHistory     = ()    => API.get('/history/');
export const getSession     = (id)  => API.get(`/history/${id}`);
export const downloadReport = (id)  => API.get(`/history/${id}/pdf`, {
  responseType: 'blob'
});
export const deleteSession  = (id)  => API.delete(`/history/${id}`);

export default API;
