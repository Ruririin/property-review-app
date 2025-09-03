/**
 * Demo Project Save Service - Memory-only implementation
 * Prevents real data persistence and uses sanitized demo data
 */

import { DEMO_CONFIG, DEMO_DATA, demoUtils } from '../config/demoConfig.js';
import demoApiService from './demoApiService.js';

class DemoProjectSaveService {
  constructor() {
    this.projects = new Map(); // Memory-only storage
    this.currentProjectId = null;
    this.savingProjects = new Set();
    this.init();
  }

  async init() {
    console.log('🎭 Demo Project Save Service initialized (memory-only)');
    
    // Initialize with demo projects
    await this.createSampleProjects();
  }

  async createSampleProjects() {
    // Create complete demo projects with all slides
    DEMO_DATA.SAMPLE_PROPERTIES.forEach((property, index) => {
      const demoProject = demoUtils.createCompleteDemo(index);
      // Stagger creation times
      demoProject.created = Date.now() - (index * 86400000);
      demoProject.lastModified = Date.now() - (index * 86400000);
      
      this.projects.set(demoProject.id, demoProject);
    });
    
    console.log(`🎭 Created ${this.projects.size} complete demo projects with ${DEMO_DATA.SLIDE_TEMPLATES.length} slides each`);
  }

  /**
   * Save project - Memory only, with data sanitization
   */
  async saveProject(projectId, projectData) {
    if (this.savingProjects.has(projectId)) {
      console.log(`🎭 Demo: Duplicate save blocked for ${projectId}`);
      return this.projects.get(projectId);
    }
    
    console.log(`🎭 Demo: Saving project ${projectId} (memory only)`);
    this.savingProjects.add(projectId);
    
    try {
      // Sanitize the data for demo mode
      const sanitizedData = this.sanitizeProjectData(projectData);
      
      const saveData = {
        id: projectId,
        title: sanitizedData.title || sanitizedData.insuredName || 'Demo Project',
        insuredName: sanitizedData.insuredName || 'Demo Company',
        premiseLocation: sanitizedData.premiseLocation || 'Demo Location',
        description: sanitizedData.description || 'Demo property',
        website: sanitizedData.website || 'www.demo-site.example',
        sessionUser: this.ensureDemoUser(projectData.sessionUser),
        slides: sanitizedData.slides || [],
        slideData: sanitizedData.slideData || {},
        formData: sanitizedData.formData || {},
        fieldPositions: sanitizedData.fieldPositions || {},
        fontSizes: sanitizedData.fontSizes || {},
        showWebsite: sanitizedData.showWebsite || false,
        multipleLocationsMode: false, // Always false in demo
        selectedLocationIndex: 0,
        status: sanitizedData.status || 'editing',
        currentSlide: sanitizedData.currentSlide || 1,
        totalSlides: sanitizedData.totalSlides || 1,
        exportCount: sanitizedData.exportCount || 0,
        lastExportTime: sanitizedData.lastExportTime || null,
        originalLroFormId: null, // Always null in demo
        completedBy: null,
        completedAt: null,
        lastModified: Date.now(),
        created: this.projects.has(projectId) ? this.projects.get(projectId).created : Date.now()
      };

      // Save to memory
      this.projects.set(projectId, saveData);
      this.setCurrentProject(projectId);
      
      console.log(`🎭 Demo: Project saved to memory: ${saveData.title}`);
      return saveData;
      
    } finally {
      this.savingProjects.delete(projectId);
    }
  }

  sanitizeProjectData(projectData) {
    if (!DEMO_CONFIG.DATA.MASK_SENSITIVE_INFO) {
      return projectData;
    }
    
    // Get a random sample property for substitution
    const sampleProperty = demoUtils.getRandomProperty();
    
    return {
      ...projectData,
      // Replace sensitive data with demo data
      insuredName: sampleProperty.insuredName,
      premiseLocation: sampleProperty.premiseLocation,
      website: sampleProperty.website,
      // Sanitize formData
      formData: {
        ...projectData.formData,
        insuredName: sampleProperty.insuredName,
        premiseLocation: sampleProperty.premiseLocation,
        website: sampleProperty.website,
      },
      // Sanitize slideData
      slideData: this.sanitizeSlideData(projectData.slideData || {}, sampleProperty)
    };
  }

  sanitizeSlideData(slideData, sampleProperty) {
    const sanitizedSlideData = {};
    
    for (const [slideId, slideInfo] of Object.entries(slideData)) {
      sanitizedSlideData[slideId] = {
        ...slideInfo,
        formData: {
          ...slideInfo.formData,
          insuredName: sampleProperty.insuredName,
          premiseLocation: sampleProperty.premiseLocation,
          website: sampleProperty.website,
        },
        // Remove any uploaded images in demo mode
        imageData: null,
        drawings: slideInfo.drawings || []
      };
    }
    
    return sanitizedSlideData;
  }

  ensureDemoUser(userName) {
    if (!userName) return 'Demo_User';
    if (userName.startsWith(DEMO_CONFIG.UI.DEMO_USER_PREFIX)) return userName;
    return DEMO_CONFIG.UI.DEMO_USER_PREFIX + userName;
  }

  /**
   * Load project - Memory only
   */
  async loadProject(projectId) {
    console.log(`🎭 Demo: Loading project ${projectId} from memory`);
    return this.projects.get(projectId) || null;
  }

  /**
   * Delete project - Memory only
   */
  async deleteProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    this.projects.delete(projectId);
    console.log(`🎭 Demo: Project deleted from memory: ${project.title}`);
    return true;
  }

  // All the same interface methods as the real service
  getUserProjects(sessionUser, includeCompleted = true) {
    const demoUser = this.ensureDemoUser(sessionUser);
    const userProjects = [];
    
    for (const [id, project] of this.projects) {
      if (project.sessionUser === demoUser || project.sessionUser === sessionUser) {
        if (includeCompleted || project.status !== 'completed') {
          userProjects.push(project);
        }
      }
    }
    return userProjects.sort((a, b) => b.lastModified - a.lastModified);
  }

  getAllActiveProjects() {
    const allProjects = [];
    for (const [id, project] of this.projects) {
      if (project.status !== 'completed') {
        allProjects.push(project);
      }
    }
    return allProjects.sort((a, b) => b.lastModified - a.lastModified);
  }

  getAllCompletedProjects() {
    const allProjects = [];
    for (const [id, project] of this.projects) {
      if (project.status === 'completed') {
        allProjects.push(project);
      }
    }
    return allProjects.sort((a, b) => (b.completedAt || b.lastModified) - (a.completedAt || a.lastModified));
  }

  getUserActiveProjects(sessionUser) {
    return this.getUserProjects(sessionUser, false);
  }

  getUserCompletedProjects(sessionUser) {
    const demoUser = this.ensureDemoUser(sessionUser);
    const userProjects = [];
    for (const [id, project] of this.projects) {
      if ((project.sessionUser === demoUser || project.sessionUser === sessionUser) && 
          project.status === 'completed') {
        userProjects.push(project);
      }
    }
    return userProjects.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }

  getAllProjects() {
    return Array.from(this.projects.values())
      .sort((a, b) => b.lastModified - a.lastModified);
  }

  markProjectCompleted(projectId, sessionUser) {
    const project = this.projects.get(projectId);
    if (project) {
      project.status = 'completed';
      project.completedBy = this.ensureDemoUser(sessionUser);
      project.completedAt = Date.now();
      project.lastModified = Date.now();
      
      this.saveProject(projectId, project);
      console.log(`🎭 Demo: Project marked completed: ${project.title}`);
      return true;
    }
    return false;
  }

  updateProjectStatus(projectId, statusData) {
    const project = this.projects.get(projectId);
    if (project) {
      if (statusData.status) project.status = statusData.status;
      if (statusData.currentSlide) project.currentSlide = statusData.currentSlide;
      if (statusData.totalSlides) project.totalSlides = statusData.totalSlides;
      if (statusData.exportCount !== undefined) project.exportCount = statusData.exportCount;
      if (statusData.lastExportTime) project.lastExportTime = statusData.lastExportTime;
      
      project.lastModified = Date.now();
      this.saveProject(projectId, project);
      return true;
    }
    return false;
  }

  recordPdfExport(projectId) {
    const project = this.projects.get(projectId);
    if (project) {
      project.exportCount = (project.exportCount || 0) + 1;
      project.lastExportTime = Date.now();
      project.lastModified = Date.now();
      
      if (project.status === 'editing' && project.exportCount >= 1) {
        project.status = 'finalizing';
      }
      
      this.saveProject(projectId, project);
      console.log(`🎭 Demo: PDF export recorded for ${project.title}`);
      return true;
    }
    return false;
  }

  updateLastModified(projectId) {
    const project = this.projects.get(projectId);
    if (project) {
      project.lastModified = Date.now();
      this.saveProject(projectId, project);
    }
  }

  generatePreview(project) {
    return {
      id: project.id,
      title: project.title,
      insuredName: project.insuredName,
      premiseLocation: project.premiseLocation,
      lastModified: project.lastModified,
      created: project.created,
      sessionUser: project.sessionUser,
      slideData: project.slideData,
      formData: project.formData
    };
  }

  autoSave(projectId, currentData) {
    if (this.projects.has(projectId)) {
      this.updateLastModified(projectId);
      
      const project = this.projects.get(projectId);
      project.formData = { ...project.formData, ...currentData.formData };
      project.slideData = { ...project.slideData, ...currentData.slideData };
      
      this.saveProject(projectId, project);
    }
  }

  generateProjectId(formId = null, sessionUser = '') {
    return demoUtils.createDemoProjectId();
  }

  projectExists(projectId) {
    return this.projects.has(projectId);
  }

  setCurrentProject(projectId) {
    this.currentProjectId = projectId;
    console.log(`🎭 Demo: Set current project to ${projectId}`);
  }

  getCurrentProject() {
    return this.currentProjectId;
  }

  loadCurrentProject() {
    // In demo mode, don't persist current project
    console.log('🎭 Demo: Current project loading skipped (memory only)');
  }

  clearCurrentProject() {
    this.currentProjectId = null;
    console.log('🎭 Demo: Current project cleared');
  }

  getStorageAnalytics() {
    return {
      backendStatus: 'DEMO MODE',
      storageType: 'Memory Only',
      totalProjects: this.projects.size,
      cacheSize: JSON.stringify(Array.from(this.projects.entries())).length
    };
  }

  async refreshFromDatabase() {
    console.log('🎭 Demo: Refresh from database skipped (demo mode)');
    return false;
  }
}

// Create singleton instance
const demoProjectSaveService = new DemoProjectSaveService();

export default demoProjectSaveService;