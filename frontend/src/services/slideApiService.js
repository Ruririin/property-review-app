/**
 * Slide API Service - Handles backend communication for slide content management
 * Used by Comments, Fire Hazard, and other slide types for simplified backend integration
 */

class SlideApiService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add caching and request throttling
    this.cache = new Map();
    this.cacheTimeout = 3 * 60 * 1000; // 3 minutes cache
    this.activeRequests = new Map(); // Track active requests to prevent duplicates
  }

  /**
   * Generate cache key for slide content
   */
  getCacheKey(projectId, slideId) {
    return `${projectId}_${slideId}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp < this.cacheTimeout);
  }

  /**
   * Clear cache for performance or when data changes
   */
  clearCache(projectId = null, slideId = null) {
    if (projectId && slideId) {
      const key = this.getCacheKey(projectId, slideId);
      this.cache.delete(key);
      console.log(`🗑️ Cleared cache for slide ${slideId}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all slide cache');
    }
  }

  /**
   * Get CSRF token from cookie
   */
  getCookie(name) {
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
  }

  /**
   * Generic API request handler
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Get CSRF token and add to headers for non-GET requests
    const csrfToken = this.getCookie('csrftoken');
    const headers = {
      ...this.headers,
      ...(csrfToken && { 'X-CSRFToken': csrfToken })
    };

    const config = {
      headers: headers,
      credentials: 'include', // Include session cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Slide API Error: ${config.method || 'GET'} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Update slide content and field positions
   * @param {string} projectId - Project ID
   * @param {string} slideId - Slide ID (can be slide number or unique identifier)
   * @param {string} slideType - Type of slide ('comments', 'fire_hazard', etc.)
   * @param {Object} content - Content updates (form data, comments, etc.)
   * @param {Object} fieldPositions - Textbox positions and dimensions
   * @returns {Promise<Object>}
   */
  async updateSlideContent(projectId, slideId, slideType, content = {}, fieldPositions = {}) {
    const payload = {
      project_id: projectId,
      slide_id: slideId,
      slide_type: slideType,
      content: content,
      field_positions: fieldPositions
    };

    // Clear cache when updating to ensure fresh data on next fetch
    this.clearCache(projectId, slideId);
    
    // Also clear any active requests to prevent stale data conflicts
    const cacheKey = this.getCacheKey(projectId, slideId);
    this.activeRequests.delete(cacheKey);

    return this.request(`/slides/update-content/`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Get slide content with caching and request deduplication
   * @param {string} projectId - Project ID
   * @param {string} slideId - Slide ID
   * @returns {Promise<Object>}
   */
  async getSlideContent(projectId, slideId) {
    const cacheKey = this.getCacheKey(projectId, slideId);
    const cachedData = this.cache.get(cacheKey);
    
    // Return cached data if it's still valid
    if (this.isCacheValid(cachedData)) {
      console.log(`📋 Using cached data for slide ${slideId}`);
      // Return a deep clone to prevent mutations affecting cached data
      return JSON.parse(JSON.stringify(cachedData.data));
    }
    
    // Check if there's already an active request for this slide
    if (this.activeRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for existing request for slide ${slideId}`);
      try {
        const result = await this.activeRequests.get(cacheKey);
        // Return a deep clone to prevent mutations affecting the original
        return JSON.parse(JSON.stringify(result));
      } catch (error) {
        // If the active request failed, remove it and continue with fresh request
        this.activeRequests.delete(cacheKey);
        throw error;
      }
    }
    
    // Create new request
    console.log(`🌐 Fetching fresh data for slide ${slideId}`);
    const requestPromise = this.request(`/slides/${projectId}/${slideId}/content/`)
      .then(data => {
        // Cache the result with defensive data structure
        this.cache.set(cacheKey, {
          data: data || { content: {}, field_positions: {} },
          timestamp: Date.now()
        });
        
        // Remove from active requests
        this.activeRequests.delete(cacheKey);
        
        // Return a deep clone to prevent mutations affecting cached data
        return JSON.parse(JSON.stringify(data || { content: {}, field_positions: {} }));
      })
      .catch(error => {
        // Remove from active requests on error
        this.activeRequests.delete(cacheKey);
        throw error;
      });
    
    // Track the active request
    this.activeRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  /**
   * Update only textbox positions (for drag/resize operations)
   * @param {string} projectId - Project ID
   * @param {string} slideId - Slide ID
   * @param {string} slideType - Type of slide
   * @param {Object} fieldPositions - Textbox positions and dimensions
   * @returns {Promise<Object>}
   */
  async updateFieldPositions(projectId, slideId, slideType, fieldPositions) {
    return this.updateSlideContent(projectId, slideId, slideType, {}, fieldPositions);
  }

  /**
   * Comments slide specific methods
   */
  async updateComments(projectId, slideId, comments, fieldPositions = {}) {
    return this.updateSlideContent(projectId, slideId, 'comments', { comments }, fieldPositions);
  }

  async getComments(projectId, slideId) {
    const result = await this.getSlideContent(projectId, slideId);
    return {
      comments: result.content.comments || {},
      fieldPositions: result.field_positions || {}
    };
  }

  /**
   * Fire Hazard slide specific methods
   */
  async updateFireHazard(projectId, slideId, fireHazardData, fieldPositions = {}) {
    return this.updateSlideContent(projectId, slideId, 'fire_hazard', { fireHazardData }, fieldPositions);
  }

  async getFireHazard(projectId, slideId) {
    const result = await this.getSlideContent(projectId, slideId);
    return {
      fireHazardData: result.content.fireHazardData || {},
      fieldPositions: result.field_positions || {}
    };
  }
}

// Create singleton instance
const slideApiService = new SlideApiService();

export default slideApiService;