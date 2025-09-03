/**
 * Demo API Service - Mock implementation for demo mode
 * Replaces real API calls with safe mock data
 */

import { DEMO_CONFIG, DEMO_DATA, demoUtils } from '../config/demoConfig.js';

class DemoApiService {
  constructor() {
    this.mockProjects = new Map();
    this.mockUsers = DEMO_DATA.SAMPLE_USERS;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    // Initialize with sample projects
    DEMO_DATA.SAMPLE_PROPERTIES.forEach((property, index) => {
      const projectId = demoUtils.createDemoProjectId();
      this.mockProjects.set(projectId, {
        id: projectId,
        title: property.insuredName,
        name: property.insuredName,
        description: `Demo property review for ${property.insuredName}`,
        status: 'editing',
        formData: property,
        slideData: {
          1: {
            formData: property,
            fieldPositions: {},
            drawings: []
          }
        },
        multipleLocationsMode: false,
        selectedLocationIndex: 0,
        created_at: new Date(Date.now() - (index * 86400000)).toISOString(), // Stagger creation times
        updated_at: new Date().toISOString()
      });
    });
    
    this.isInitialized = true;
    console.log('🎭 Demo API Service initialized with mock data');
  }

  async simulateNetworkDelay() {
    if (DEMO_CONFIG.API.SIMULATE_DELAYS) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));
    }
  }

  /**
   * Mock API request handler
   */
  async request(endpoint, options = {}) {
    await this.init();
    await this.simulateNetworkDelay();
    
    console.log(`🎭 DEMO API: ${options.method || 'GET'} ${endpoint}`);
    
    // Parse endpoint to determine what to mock
    if (endpoint.includes('/projects/') && options.method === 'POST') {
      return this.mockCreateProject(options.body);
    }
    
    if (endpoint.includes('/projects/') && options.method === 'PATCH') {
      const projectId = this.extractProjectIdFromEndpoint(endpoint);
      return this.mockUpdateProject(projectId, options.body);
    }
    
    if (endpoint.includes('/projects/') && options.method === 'DELETE') {
      const projectId = this.extractProjectIdFromEndpoint(endpoint);
      return this.mockDeleteProject(projectId);
    }
    
    if (endpoint.includes('/projects/') && (options.method === 'GET' || !options.method)) {
      if (endpoint.includes('?') || endpoint.endsWith('/projects/')) {
        return this.mockListProjects();
      } else {
        const projectId = this.extractProjectIdFromEndpoint(endpoint);
        return this.mockGetProject(projectId);
      }
    }
    
    // Default mock response
    return { success: true, message: 'Demo mode - operation simulated' };
  }

  extractProjectIdFromEndpoint(endpoint) {
    const match = endpoint.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  async mockCreateProject(bodyString) {
    const data = JSON.parse(bodyString);
    const projectId = demoUtils.createDemoProjectId();
    
    const newProject = {
      id: projectId,
      title: data.title || 'Demo Project',
      name: data.name || data.title || 'Demo Project',
      description: data.description || 'Demo property review',
      status: 'editing',
      formData: demoUtils.sanitizePropertyData(data.formData || {}),
      slideData: data.slideData || {},
      multipleLocationsMode: false,
      selectedLocationIndex: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.mockProjects.set(projectId, newProject);
    console.log('🎭 Created demo project:', projectId);
    return newProject;
  }

  async mockUpdateProject(projectId, bodyString) {
    const data = JSON.parse(bodyString);
    const existingProject = this.mockProjects.get(projectId);
    
    if (!existingProject) {
      throw new Error('Project not found');
    }
    
    const updatedProject = {
      ...existingProject,
      ...data,
      formData: demoUtils.sanitizePropertyData(data.formData || existingProject.formData),
      updated_at: new Date().toISOString()
    };
    
    this.mockProjects.set(projectId, updatedProject);
    console.log('🎭 Updated demo project:', projectId);
    return updatedProject;
  }

  async mockDeleteProject(projectId) {
    const deleted = this.mockProjects.delete(projectId);
    console.log('🎭 Deleted demo project:', projectId, deleted ? 'success' : 'not found');
    return { success: deleted };
  }

  async mockGetProject(projectId) {
    const project = this.mockProjects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    console.log('🎭 Retrieved demo project:', projectId);
    return project;
  }

  async mockListProjects() {
    const projects = Array.from(this.mockProjects.values())
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    console.log(`🎭 Listed ${projects.length} demo projects`);
    return { results: projects };
  }

  // Mock other API methods with safe no-ops
  async toggleMultipleLocations(projectId) {
    await this.simulateNetworkDelay();
    console.log('🎭 Mock: toggled multiple locations for', projectId);
    return { success: true };
  }

  async getProjectLocations(projectId) {
    await this.simulateNetworkDelay();
    console.log('🎭 Mock: get locations for', projectId);
    return [];
  }

  async uploadImage(slideId, imageFile, metadata = {}) {
    await this.simulateNetworkDelay();
    console.log('🎭 Mock: image upload blocked for demo mode');
    return { 
      id: 'demo-image-' + Date.now(),
      message: 'Demo mode: Image upload simulated',
      url: '/demo-placeholder-image.jpg'
    };
  }

  async healthCheck() {
    await this.simulateNetworkDelay();
    return true; // Always report as healthy in demo mode
  }

  // Utility method to convert base64 to File (same as real service)
  base64ToFile(base64String, filename = 'demo-image.png') {
    // In demo mode, just return a mock file object
    return new File(['demo content'], filename, { type: 'image/png' });
  }
}

// Create singleton instance
const demoApiService = new DemoApiService();

export default demoApiService;