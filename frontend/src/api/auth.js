import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get CSRF token from cookies
const getCsrfToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Request interceptor to handle CSRF tokens
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token to non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't auto-redirect on 401 - let the AuthContext handle it
    return Promise.reject(error);
  }
);

export const authApi = {
  // Login user
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await apiClient.post('/auth/logout/');
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error.response?.data);
      throw error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile/', profileData);
    return response.data;
  },

  // Check authentication status
  checkAuth: async () => {
    try {
      // Use session/status endpoint which is publicly accessible and sets CSRF cookie
      const response = await apiClient.get('/auth/session/status/');
      if (response.data.authenticated) {
        return response.data.user;
      }
      throw new Error('Not authenticated');
    } catch (error) {
      throw error;
    }
  }
};

export default apiClient;
