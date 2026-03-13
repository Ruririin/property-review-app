import axios from 'axios';

// This ensures cookies work properly since everything appears to come from the same origin
const apiClient = axios.create({
  baseURL: '/api',
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
    // Suppress console errors for 403/401 (expected when logged out)
    if (error.response?.status === 403 || error.response?.status === 401) {
      const silentError = new Error(error.message);
      silentError.response = error.response;
      silentError.config = error.config;
      return Promise.reject(silentError);
    }
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

  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error.response?.data);
      throw error;
    }
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile/', profileData);
    return response.data;
  },

  checkAuth: async () => {
    try {
      // NOTE: We cannot check for sessionid cookie in document.cookie because it's HttpOnly
      // HttpOnly cookies are not accessible to JavaScript (security feature)
      // Instead, we just make the API request - the browser will send the cookie automatically
      console.log('🔐 Checking authentication with backend...');

      // SECURITY FIX: Use secure check-auth endpoint instead of removed session/status
      const response = await apiClient.get('/auth/check-auth/');
      if (response.data.authenticated) {
        console.log('✅ User is authenticated:', response.data.user.username);
        return response.data.user;
      }
      throw new Error('Not authenticated');
    } catch (error) {
      // Silently handle 403/401 errors (user not logged in)
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.log('❌ Not authenticated (401/403)');
        throw new Error('Not authenticated');
      }
      console.error('❌ Auth check error:', error);
      throw error;
    }
  }
};

export default apiClient;
