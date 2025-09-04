/**
 * Authentication Service
 * Handles session-based authentication with Django backend
 */

const API_BASE_URL = 'http://localhost:8000/api/auth';

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }


  /**
   * Generic API request with session cookies
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config = {
      credentials: 'include', // Include cookies for session management
      headers,
      ...options,
    };

    // Log the request for debugging
    console.log('Auth service request:', { endpoint, method: config.method || 'GET' });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Auth API Error: ${config.method || 'GET'} ${endpoint}`, error);
      throw error;
    }
  }


  /**
   * Start a session with a display name
   */
  async startSession(displayName) {
    try {
      const result = await this.request('/session/login/', {
        method: 'POST',
        body: JSON.stringify({ name: displayName })
      });

      if (result.success) {
        // Store user data locally for quick access
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        return result;
      } else {
        throw new Error(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Check current session status
   */
  async getSessionStatus() {
    try {
      const result = await this.request('/session/status/', {
        method: 'GET'
      });

      if (result.authenticated) {
        // Update local storage with current user data
        localStorage.setItem('currentUser', JSON.stringify(result.user));
      } else {
        // Clear local storage if not authenticated
        localStorage.removeItem('currentUser');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to check session status:', error);
      // Clear local data on error
      localStorage.removeItem('currentUser');
      return { authenticated: false, recent_users: [] };
    }
  }

  /**
   * End current session
   */
  async endSession() {
    try {
      const result = await this.request('/session/logout/', {
        method: 'POST'
      });

      // Clear local storage
      localStorage.removeItem('currentUser');
      
      return result;
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      // Clear local storage even on error
      localStorage.removeItem('currentUser');
      throw error;
    }
  }

  /**
   * Get current user from local storage (synchronous)
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error parsing current user data:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  }

  /**
   * Check if user is currently authenticated (synchronous)
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Get user display name (for backward compatibility)
   */
  getUserDisplayName() {
    const user = this.getCurrentUser();
    return user ? (user.display_name || user.username) : null;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;