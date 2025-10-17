/**
 * API Service - Handles all backend communication
 * Replaces localStorage with proper database storage
 */

class ApiService {
  constructor() {
    // DEPLOYMENT: Use production URL
    this.baseURL = 'https://pr-neitclem.gratusinc.org/api';
    
    // LOCAL DEVELOPMENT: Use local server
    // this.baseURL = 'http://localhost:8000/api';
    
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
      // Only log API requests in development mode
      if (process.env.NODE_ENV === 'development' && window.location.search.includes('debug=api')) {
        console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
        if (config.body && (config.method === 'POST' || config.method === 'PATCH')) {
          try {
            const bodyData = JSON.parse(config.body);
            console.log(`📤 Request body preview:`, bodyData);
          } catch (e) {
            console.log(`📤 Request body (raw):`, config.body);
          }
        }
      }
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle 404 errors gracefully for disabled endpoints
        if (response.status === 404) {
          console.warn(`⚠️ Endpoint not found: ${config.method || 'GET'} ${endpoint} (404)`);
          return null;
        }
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      // Handle empty responses (like DELETE 204 No Content)
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType?.includes('application/json')) {
        if (process.env.NODE_ENV === 'development' && window.location.search.includes('debug=api')) {
          console.log(`✅ API Success: ${config.method || 'GET'} ${endpoint} (No content)`);
        }
        return null;
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development' && window.location.search.includes('debug=api')) {
        console.log(`✅ API Success: ${config.method || 'GET'} ${endpoint}`, data);
      }
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${config.method || 'GET'} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Multiple Locations API methods
   */
  async toggleMultipleLocations(projectId) {
    return this.request(`/projects/${projectId}/toggle_multiple_locations/`, {
      method: 'POST'
    });
  }

  /**
   * Update app state settings (website visibility, font sizes, etc.)
   */
  async updateAppState(projectId, appStateUpdates) {
    try {
      // Get current project
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Update the app state within slideData
      const updatedSlideData = {
        ...project.slideData,
        _appState: {
          ...project.slideData._appState,
          ...appStateUpdates
        }
      };

      // Save the updated project
      return this.updateProject(projectId, {
        slideData: updatedSlideData
      });
    } catch (error) {
      console.error('Error updating app state:', error);
      throw error;
    }
  }

  async setSelectedLocation(projectId, selectedLocationIndex) {
    return this.request(`/projects/${projectId}/set_selected_location/`, {
      method: 'POST',
      body: JSON.stringify({ selectedLocationIndex })
    });
  }

  async getProjectLocations(projectId) {
    return this.request(`/locations/?project=${projectId}`);
  }

  async createLocation(projectId, locationData) {
    return this.request('/locations/', {
      method: 'POST',
      body: JSON.stringify({
        project: projectId,
        ...locationData
      })
    });
  }

  async updateLocation(locationId, locationData) {
    return this.request(`/locations/${locationId}/`, {
      method: 'PUT',
      body: JSON.stringify(locationData)
    });
  }

  async deleteLocation(locationId) {
    return this.request(`/locations/${locationId}/`, {
      method: 'DELETE'
    });
  }

  /**
   * Project Management APIs
   */
  async createProject(projectData) {
    // Extract multipleLocationsMode from slideData._appState if available
    const multipleLocationsMode = projectData.slideData?._appState?.multipleLocationsMode ?? 
                                 projectData.multipleLocationsMode ?? 
                                 false;

    return this.request('/projects/', {
      method: 'POST',
      body: JSON.stringify({
        title: projectData.title || projectData.name || projectData.insuredName || 'Untitled Project',
        name: projectData.name || projectData.title || projectData.insuredName || 'Untitled Project',
        description: projectData.description || `Property review for ${projectData.insuredName || 'Unknown'}`,
        status: projectData.status || 'editing',
        formData: projectData.formData || {},
        slideData: projectData.slideData || {},
        multipleLocationsMode: multipleLocationsMode,
        selectedLocationIndex: projectData.selectedLocationIndex || 0
      }),
    });
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}/`);
  }

  async updateProject(projectId, projectData) {
    // Extract multipleLocationsMode from slideData._appState if available
    const multipleLocationsMode = projectData.slideData?._appState?.multipleLocationsMode ?? 
                                 projectData.multipleLocationsMode ?? 
                                 false;

    return this.request(`/projects/${projectId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: projectData.title || projectData.name || projectData.insuredName || 'Untitled Project',
        name: projectData.name || projectData.title || projectData.insuredName || 'Untitled Project',
        description: projectData.description || `Property review for ${projectData.insuredName || 'Unknown'}`,
        status: projectData.status || 'editing',
        formData: projectData.formData || {},
        slideData: projectData.slideData || {},
        multipleLocationsMode: multipleLocationsMode
      }),
    });
  }

  async deleteProject(projectId) {
    return this.request(`/projects/${projectId}/`, {
      method: 'DELETE',
    });
  }

  async listProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/projects/${queryString ? '?' + queryString : ''}`);
  }

  /**
   * Slide Management APIs
   */
  async createSlide(projectId, slideData) {
    return this.request('/slides/', {
      method: 'POST',
      body: JSON.stringify({
        project: projectId,
        slide_number: slideData.slideNumber,
        title: slideData.title || '',
        content: slideData.content || {},
        template_type: slideData.type || 'standard',
        field_dimensions: slideData.fieldPositions || {},
      }),
    });
  }

  async getSlide(slideId) {
    return this.request(`/slides/${slideId}/`);
  }

  async updateSlide(slideId, slideData) {
    return this.request(`/slides/${slideId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: slideData.title,
        content: slideData.content || {},
        field_dimensions: slideData.fieldPositions || {},
      }),
    });
  }

  async deleteSlide(slideId) {
    return this.request(`/slides/${slideId}/`, {
      method: 'DELETE',
    });
  }

  async getProjectSlides(projectId) {
    return this.request(`/slides/?project=${projectId}`);
  }

  /**
   * Image Management APIs
   */
  async uploadImage(slideId, imageFile, metadata = {}) {
    const formData = new FormData();
    formData.append('slide', slideId);
    formData.append('image', imageFile);
    formData.append('alt_text', metadata.altText || '');
    formData.append('position_x', metadata.positionX || 0);
    formData.append('position_y', metadata.positionY || 0);
    formData.append('width', metadata.width || 100);
    formData.append('height', metadata.height || 100);

    return this.request('/images/', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set multipart boundary
      body: formData,
    });
  }

  async updateImagePosition(imageId, position) {
    return this.request(`/images/${imageId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        position_x: position.x,
        position_y: position.y,
        width: position.width,
        height: position.height,
      }),
    });
  }

  async deleteImage(imageId) {
    return this.request(`/images/${imageId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Save textbox dimensions (existing API)
   */
  async saveTextboxDimensions(slideId, fieldDimensions) {
    return this.request('/textbox-dimensions/save/', {
      method: 'POST',
      body: JSON.stringify({
        slide_id: slideId,
        field_dimensions: fieldDimensions,
      }),
    });
  }

  async getTextboxDimensions(slideId) {
    try {
      return await this.request(`/textbox-dimensions/${slideId}/`);
    } catch (error) {
      console.warn('No textbox dimensions found:', error);
      return { field_dimensions: {} };
    }
  }

  /**
   * Utility Methods
   */
  
  // Convert base64 image to File object for upload
  base64ToFile(base64String, filename = 'image.png') {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }

  // Convert project data from localStorage format to API format
  convertProjectData(localStorageProject) {
    return {
      title: localStorageProject.title || localStorageProject.insuredName || 'Untitled Project',
      insuredName: localStorageProject.insuredName || '',
      premiseLocation: localStorageProject.premiseLocation || '',
      description: localStorageProject.description || '',
      website: localStorageProject.website || '',
      sessionUser: localStorageProject.sessionUser,
      slides: localStorageProject.slides || [],
      slideData: localStorageProject.slideData || {},
      formData: localStorageProject.formData || {},
      fieldPositions: localStorageProject.fieldPositions || {},
      fontSizes: localStorageProject.fontSizes || {},
      showWebsite: localStorageProject.showWebsite || false,
      multipleLocationsMode: localStorageProject.multipleLocationsMode || false,
      selectedLocationIndex: localStorageProject.selectedLocationIndex || 0,
      status: localStorageProject.status || 'editing',
      currentSlide: localStorageProject.currentSlide || 1,
      totalSlides: localStorageProject.totalSlides || 1,
    };
  }

  /**
   * Get service URL for external services (fire station, crime rate, etc.)
   */
  async getServiceUrl(projectId, serviceType) {
    return this.request('/location-url/', {
      method: 'POST',
      body: JSON.stringify({ 
        project_id: projectId,
        service_type: serviceType 
      })
    });
  }

  /**
   * Exported Items Management APIs
   */
  async saveExportedItem(exportData) {
    return this.request('/exported-items/', {
      method: 'POST',
      body: JSON.stringify({
        filename: exportData.filename,
        project_id: exportData.projectId,
        project_name: exportData.projectName,
        file_size: exportData.fileSize,
        file_path: exportData.filePath,
        exported_by: exportData.exportedBy,
        export_date: new Date().toISOString()
      })
    });
  }

  async getExportedItems(userId) {
    return this.request(`/exported-items/?exported_by=${userId}`);
  }

  async deleteExportedItem(itemId) {
    return this.request(`/exported-items/${itemId}/`, {
      method: 'DELETE'
    });
  }

  async getExportedItemFile(itemId) {
    return this.request(`/exported-items/${itemId}/download/`);
  }

  /**
   * Health check - test if backend is accessible
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/projects/?limit=1`);
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;