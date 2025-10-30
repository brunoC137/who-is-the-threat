import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authAPI = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  updateDetails: (data: any) => api.put('/api/auth/updatedetails', data),
  updatePassword: (data: any) => api.put('/api/auth/updatepassword', data),
};

export const playersAPI = {
  getAll: (params?: any) => api.get('/api/players', { params }),
  getById: (id: string) => api.get(`/api/players/${id}`),
  update: (id: string, data: any) => api.put(`/api/players/${id}`, data),
  delete: (id: string) => api.delete(`/api/players/${id}`),
};

export const decksAPI = {
  getAll: (params?: any) => api.get('/api/decks', { params }),
  getById: (id: string) => api.get(`/api/decks/${id}`),
  create: (data: any) => api.post('/api/decks', data),
  update: (id: string, data: any) => api.put(`/api/decks/${id}`, data),
  delete: (id: string) => api.delete(`/api/decks/${id}`),
};

export const gamesAPI = {
  getAll: (params?: any) => api.get('/api/games', { params }),
  getById: (id: string) => api.get(`/api/games/${id}`),
  create: (data: any) => api.post('/api/games', data),
  update: (id: string, data: any) => api.put(`/api/games/${id}`, data),
  delete: (id: string) => api.delete(`/api/games/${id}`),
};

export const statsAPI = {
  getPlayerStats: (id: string) => api.get(`/api/stats/player/${id}`),
  getDeckStats: (id: string) => api.get(`/api/stats/deck/${id}`),
  getGlobalStats: () => api.get('/api/stats/global'),
  getDashboardStats: () => api.get('/api/stats/dashboard'),
};