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
  }

  /**
   * Generic API request handler
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.headers,
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
      console.error(`❌ Slide API Error: ${config.method || 'GET'} ${endpoint}`, error);
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
    return this.request('/slides/update-content/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        slide_id: slideId,
        slide_type: slideType,
        content: content,
        field_positions: fieldPositions
      })
    });
  }

  /**
   * Get slide content and field positions
   * @param {string} projectId - Project ID
   * @param {string} slideId - Slide ID
   * @returns {Promise<Object>}
   */
  async getSlideContent(projectId, slideId) {
    return this.request(`/slides/${projectId}/${slideId}/content/`);
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
   * Update only slide content (for form field changes)
   * @param {string} projectId - Project ID
   * @param {string} slideId - Slide ID
   * @param {string} slideType - Type of slide
   * @param {Object} content - Content updates
   * @returns {Promise<Object>}
   */
  async updateContent(projectId, slideId, slideType, content) {
    return this.updateSlideContent(projectId, slideId, slideType, content, {});
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