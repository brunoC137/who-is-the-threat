import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
console.log('API_BASE_URL:', API_BASE_URL);

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
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data: any) => api.put('/auth/updatedetails', data),
  updatePassword: (data: any) => api.put('/auth/updatepassword', data),
};

export const playersAPI = {
  getAll: (params?: any) => api.get('/players', { params }),
  getById: (id: string) => api.get(`/players/${id}`),
  update: (id: string, data: any) => api.put(`/players/${id}`, data),
  delete: (id: string) => api.delete(`/players/${id}`),
};

export const decksAPI = {
  getAll: (params?: any) => api.get('/decks', { params }),
  getById: (id: string) => api.get(`/decks/${id}`),
  create: (data: any) => api.post('/decks', data),
  update: (id: string, data: any) => api.put(`/decks/${id}`, data),
  delete: (id: string) => api.delete(`/decks/${id}`),
};

export const gamesAPI = {
  getAll: (params?: any) => api.get('/games', { params }),
  getById: (id: string) => api.get(`/games/${id}`),
  create: (data: any) => api.post('/games', data),
  update: (id: string, data: any) => api.put(`/games/${id}`, data),
  delete: (id: string) => api.delete(`/games/${id}`),
};

export const statsAPI = {
  getPlayerStats: (id: string) => api.get(`/stats/player/${id}`),
  getDeckStats: (id: string) => api.get(`/stats/deck/${id}`),
  getGlobalStats: () => api.get('/stats/global'),
};