import axios from 'axios';

export const API = import.meta.env.VITE_API || 'http://localhost:5000';
export const media = (p) => (p ? API + p : '');

const api = axios.create({ baseURL: API + '/api' });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = 'Bearer ' + t;
  return cfg;
});
export const errText = (e) => e.response?.data?.message || 'Something went wrong. Try again.';
export default api;
