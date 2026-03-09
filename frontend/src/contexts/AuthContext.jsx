import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking auth status...');
      const userData = await authApi.checkAuth();
      console.log('✅ Auth check successful:', userData);
      setUser(userData);
    } catch (error) {
      console.log('❌ Auth check failed:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authApi.login(credentials);
      // Extract user data from the response
      const userData = response.user || response;
      setUser(userData);
      return userData;
    } catch (error) {
      let errorMessage = 'Login failed';

      // Handle Django error formats
      if (error.response?.data?.non_field_errors) {
        errorMessage = Array.isArray(error.response.data.non_field_errors)
          ? error.response.data.non_field_errors.join(' ')
          : error.response.data.non_field_errors;
      } else if (error.response?.data?.error?.non_field_errors) {
        // Handle nested non_field_errors inside error object
        errorMessage = Array.isArray(error.response.data.error.non_field_errors)
          ? error.response.data.error.non_field_errors.join(' ')
          : error.response.data.error.non_field_errors;
      } else if (error.response?.data?.error && typeof error.response.data.error === 'object') {
        // Handle object errors from Django
        const errorObj = error.response.data.error;
        const errorMessages = [];
        for (const [field, messages] of Object.entries(errorObj)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(' ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        errorMessage = errorMessages.join(', ');
      } else {
        errorMessage = error.response?.data?.error ||
                      error.response?.data?.detail ||
                      error.response?.data?.message ||
                      'Login failed';
      }

      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authApi.register(userData);
      // Don't set user - they need to log in separately
      return response;
    } catch (error) {
      let errorMessage = 'Registration failed';

      // Handle password validation errors
      if (error.response?.data?.password) {
        errorMessage = error.response.data.password.join(' ');
      } else if (error.response?.data?.username) {
        errorMessage = `Username: ${error.response.data.username.join(' ')}`;
      } else if (error.response?.data?.email) {
        errorMessage = `Email: ${error.response.data.email.join(' ')}`;
      } else if (error.response?.data?.error && typeof error.response.data.error === 'object') {
        // Handle object errors from Django
        const errorObj = error.response.data.error;
        const errorMessages = [];
        for (const [field, messages] of Object.entries(errorObj)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(' ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        errorMessage = errorMessages.join(', ');
      } else {
        errorMessage = error.response?.data?.detail ||
                      error.response?.data?.message ||
                      error.response?.data?.error ||
                      'Registration failed';
      }

      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    login,
    logout,
    register,
    checkAuthStatus,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
