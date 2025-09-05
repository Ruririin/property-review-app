/**
 * Editor API Service - Handles backend communication for sidebar button functionality
 * Reduces complexity in Editor.jsx by moving location-based logic to backend
 */

class EditorApiService {
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
      console.error(`L Editor API Error: ${config.method || 'GET'} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get location-based service URL
   * @param {string} projectId - Project ID
   * @param {string} serviceType - 'google_maps', 'bing_maps', 'fire_hazard'
   * @returns {Promise<{success: boolean, service_type: string, location: string, url: string}>}
   */
  async getLocationUrl(projectId, serviceType) {
    console.log(`🔗 Calling getLocationUrl with projectId: ${projectId}, serviceType: ${serviceType}`);
    const result = await this.request('/location-url/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        service_type: serviceType
      })
    });
    console.log(`📡 getLocationUrl response:`, result);
    return result;
  }

  /**
   * Get business search URL for selected location
   * @param {string} projectId - Project ID
   * @returns {Promise<{success: boolean, location: string, url: string}>}
   */
  async getBusinessSearchUrl(projectId) {
    return this.request('/search-business/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId
      })
    });
  }

  /**
   * Open Google Maps for the current location
   * @param {string} projectId - Project ID
   */
  async openGoogleMaps(projectId) {
    try {
      const result = await this.getLocationUrl(projectId, 'google_maps');
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        console.log('=� Opened Google Maps for:', result.location);
      }
    } catch (error) {
      console.error('Error opening Google Maps:', error);
    }
  }

  /**
   * Open Bing Maps for the current location
   * @param {string} projectId - Project ID
   */
  async openBingMaps(projectId) {
    try {
      const result = await this.getLocationUrl(projectId, 'bing_maps');
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        console.log('=� Opened Bing Maps for:', result.location);
      }
    } catch (error) {
      console.error('Error opening Bing Maps:', error);
    }
  }

  /**
   * Open Fire Hazard search for the current location
   * @param {string} projectId - Project ID
   */
  async openFireHazard(projectId) {
    try {
      const result = await this.getLocationUrl(projectId, 'fire_hazard');
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        console.log('Fire hazard opened for:', result.location);
      }
    } catch (error) {
      console.error('Error opening Fire Hazard search:', error);
    }
  }

  /**
   * Open Fire Station search for the current location
   * @param {string} projectId - Project ID
   */
  async openFireStation(projectId) {
    try {
      const result = await this.getLocationUrl(projectId, 'fire_station');
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        console.log('Fire station opened for:', result.location);
      }
    } catch (error) {
      console.error('Error opening Fire Station search:', error);
    }
  }

  /**
   * Open business search for the current location
   * @param {string} projectId - Project ID
   */
  async openBusinessSearch(projectId) {
    try {
      const result = await this.getBusinessSearchUrl(projectId);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        console.log('✅ Opened Business search for:', result.location);
      }
    } catch (error) {
      console.error('Error opening Business search:', error);
    }
  }
}

// Create singleton instance
const editorApiService = new EditorApiService();

export default editorApiService;