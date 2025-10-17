import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'https://pr-neitclem.gratusinc.org/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to handle auth tokens
apiClient.interceptors.request.use(
  (config) => {
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
      const response = await apiClient.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default apiClient;
