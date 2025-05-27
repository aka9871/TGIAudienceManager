import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token and API key to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add OpenAI API key if available
  const openaiApiKey = localStorage.getItem('openai_api_key');
  if (openaiApiKey) {
    config.headers['X-OpenAI-Key'] = openaiApiKey;
  }
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => 
    api.post('/auth/logout'),
};

// Assistant API
export const assistantAPI = {
  getAssistants: () => 
    api.get('/assistants'),
  
  createAssistant: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.post('/assistants', formData, config);
  },
  
  deleteAssistant: (assistantId) => 
    api.delete(`/assistants/${assistantId}`),
  
  sendMessage: (assistantId, message) => 
    api.post(`/assistants/${assistantId}/message`, { message }),
  
  getChatHistory: (assistantId) => 
    api.get(`/assistants/${assistantId}/messages`),
  
  clearChatHistory: (assistantId) => 
    api.delete(`/assistants/${assistantId}/messages`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => 
    api.get('/dashboard/stats'),
  
  getRecentActivity: () => 
    api.get('/dashboard/activity'),
};

// Analytics API
export const analyticsAPI = {
  getData: () => 
    api.get('/analytics/data'),
};

export default api;
