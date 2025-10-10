/**
 * CLEAN Project Service - No more data sync issues!
 * Simple, efficient, and accurate database operations
 */

class CleanProjectService {
  constructor() {
    this.baseURL = 'http://127.0.0.1:8000/api';
    this.cache = new Map(); // Simple memory cache
  }

  // ================================
  // PROJECT OPERATIONS - SIMPLIFIED
  // ================================

  /**
   * Create new project - CLEAN
   */
  async createProject(title, description = '') {
    const response = await fetch(`${this.baseURL}/projects/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || `Property Review ${new Date().toLocaleDateString()}`,
        description: description,
        status: 'draft'
      })
    });
    
    if (!response.ok) throw new Error('Failed to create project');
    
    const project = await response.json();
    this.cache.set(project.id, project);
    return project;
  }

  /**
   * List all projects with pagination support
   */
  async listProjects(options = {}) {
    console.log('cleanProjectService.listProjects called with options:', options);
    
    const params = new URLSearchParams({
      page_size: options.page_size || 50,
      ordering: options.ordering || '-updated_at'
    });

    const response = await fetch(`${this.baseURL}/projects/?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to list projects: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache individual projects for faster access
    if (data.results) {
      data.results.forEach(project => {
        this.cache.set(project.id, project);
      });
    }
    
    console.log('cleanProjectService.listProjects returning:', data);
    return data;
  }

  /**
   * Load project - EFFICIENT with different detail levels
   */
  async loadProject(projectId, includeSlides = true) {
    try {
      // Check cache first
      if (this.cache.has(projectId) && !includeSlides) {
        return this.cache.get(projectId);
      }

      let url = `${this.baseURL}/projects/${projectId}/`;
      if (!includeSlides) {
        // Just get project metadata - FAST
        const response = await fetch(url);
        if (!response.ok) throw new Error('Project not found');
        
        const project = await response.json();
        this.cache.set(projectId, project);
        return project;
      } else {
        // Get project with all slides - COMPLETE
        const response = await fetch(url);
        if (!response.ok) throw new Error('Project not found');
        
        const projectData = await response.json();
        
        // Convert to frontend format
        const project = {
          id: projectData.id,
          title: projectData.title,
          description: projectData.description,
          status: projectData.status,
          created: new Date(projectData.created_at).getTime(),
          lastModified: new Date(projectData.updated_at).getTime(),
          
          // Convert slides to frontend format
          slides: projectData.slides.map(slide => ({
            id: slide.slide_number,
            backendId: slide.id, // Preserve the actual slide UUID for backend operations
            title: slide.title,
            type: slide.slide_type
          })),
          
          // Convert slide content to frontend slideData format
          slideData: projectData.slides.reduce((acc, slide) => {
            // Convert backend image format to frontend format
            const images = (slide.images || []).map(img => ({
              id: img.id,
              src: img.image_url || img.src,
              width: img.width || 200,
              height: img.height || 150,
              position: {
                left: img.position_x || 0,
                top: img.position_y || 0
              },
              aspectRatio: img.width && img.height ? img.width / img.height : 1,
              uploaded: true // Mark backend images as already uploaded
            }));
            
            console.log(`🔧 Loading slide ${slide.slide_number}:`, {
              content: slide.content,
              formData: slide.content?.formData,
              fieldPositions: slide.field_positions
            });
            
            acc[slide.slide_number] = {
              formData: slide.content?.formData || {},  // Backend stores form data inside content.formData
              drawings: slide.content?.drawings || [],
              images: images,
              fieldPositions: slide.field_positions || {}
            };
            return acc;
          }, {}),
          
          // Global settings
          multipleLocationsMode: projectData.multiple_locations_mode,
          showWebsite: projectData.show_website,
          
          // Extract global form data from Slide 1 (cover slide) for global location data
          formData: projectData.slides.length > 0 ? 
            (projectData.slides[0].content?.formData || {}) : {},
          
          // Locations if any
          locations: projectData.locations || []
        };
        
        this.cache.set(projectId, project);
        return project;
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }

  /**
   * Save project - SIMPLE and EFFICIENT
   */
  async saveProject(projectId, projectData) {
    console.log('🔧 cleanProjectService.saveProject called:', { projectId, projectData });
    
    try {
      // 1. Update project metadata
      console.log('🔧 Step 1: Updating project metadata...');
      const metadataResponse = await fetch(`${this.baseURL}/projects/${projectId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectData.title,
          description: projectData.description,
          status: projectData.status,
          multiple_locations_mode: projectData.multipleLocationsMode,
          show_website: projectData.showWebsite
        })
      });
      
      if (!metadataResponse.ok) {
        console.error('🔧 Failed to update project metadata:', metadataResponse.status, await metadataResponse.text());
        throw new Error(`Failed to update project metadata: ${metadataResponse.status}`);
      }
      console.log('🔧 Project metadata updated successfully');

      // 2. Save all slides efficiently with bulk operation
      console.log('🔧 Step 2: Preparing slides for save...');
      const slidesToSave = projectData.slides.map(slide => {
        const slideContent = projectData.slideData[slide.id] || {};
        
        return {
          slide_number: slide.id,
          slide_type: slide.type,
          title: slide.title,
          content: {
            formData: slideContent.formData || {},
            drawings: slideContent.drawings || [],
            // Don't store images in content - they're separate records
          },
          field_positions: slideContent.fieldPositions || {}
        };
      });
      
      console.log('🔧 Slides to save:', slidesToSave);

      const response = await fetch(`${this.baseURL}/projects/${projectId}/bulk_save_slides/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: slidesToSave })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 Failed to save slides:', response.status, errorText);
        throw new Error(`Failed to save slides: ${response.status} - ${errorText}`);
      }
      
      console.log('🔧 Slides saved successfully');

      // 3. Handle images separately (if any new ones)
      await this.saveSlideImages(projectId, projectData.slideData);

      // Update cache
      this.cache.set(projectId, {
        ...projectData,
        lastModified: Date.now()
      });

      return {
        success: true,
        message: 'Project saved successfully',
        savedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Save failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to save project'
      };
    }
  }

  /**
   * Save slide images separately
   */
  async saveSlideImages(projectId, slideData) {
    // First get the project to get slide ID mappings
    const project = await this.loadProject(projectId, true);
    const slideNumberToIdMap = {};
    
    // Create mapping from slide number to slide ID
    if (project.slides) {
      for (const slide of project.slides) {
        slideNumberToIdMap[slide.id] = slide.backendId || slide.id; // Use backendId if available
      }
    }
    
    console.log('📷 saveSlideImages: slideNumberToIdMap', slideNumberToIdMap);
    
    for (const [slideNumber, slideContent] of Object.entries(slideData)) {
      if (slideContent.images && Array.isArray(slideContent.images)) {
        const updatedImages = [];
        
        for (const image of slideContent.images) {
          // Only upload new base64 images (not already uploaded images with URLs)
          if (image.src && image.src.startsWith('data:image/') && !image.uploaded && !image.id) {
            console.log('📷 saveSlideImages: Uploading image for slide', slideNumber);
            try {
              const uploadedImage = await this.uploadImageToSlide(projectId, slideNumber, image, slideNumberToIdMap);
              if (uploadedImage) {
                updatedImages.push(uploadedImage);
              } else {
                updatedImages.push(image); // Keep original if upload failed
              }
            } catch (error) {
              console.error('📷 Failed to upload image, keeping original:', error);
              updatedImages.push(image); // Keep original if upload failed
            }
          } else {
            // Keep existing uploaded images or non-base64 images
            updatedImages.push(image);
          }
        }
        
        // Update the slide content with the new image URLs
        slideContent.images = updatedImages;
      }
    }
  }

  /**
   * Upload image to specific slide
   */
  async uploadImageToSlide(projectId, slideNumber, imageData, slideNumberToIdMap) {
    try {
      // Get the actual slide ID from the mapping
      const slideId = slideNumberToIdMap[slideNumber];
      if (!slideId) {
        console.error('📷 uploadImageToSlide: No slide ID found for slide number', slideNumber);
        return;
      }
      
      console.log('📷 uploadImageToSlide: Using slideId', slideId, 'for slideNumber', slideNumber);
      
      // Convert base64 to File object
      const blob = await fetch(imageData.src).then(r => r.blob());
      const file = new File([blob], `slide-${slideNumber}-image.png`, { type: blob.type });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('position_x', imageData.position?.left || 0);
      formData.append('position_y', imageData.position?.top || 0);
      formData.append('width', imageData.width || 200);
      formData.append('height', imageData.height || 150);

      const response = await fetch(
        `${this.baseURL}/project-slides/${slideId}/upload_image/`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('📷 Image uploaded successfully:', result);
        
        // Return the result in frontend format for updating local state
        return {
          id: result.id,
          src: result.image_url,
          width: result.width || imageData.width,
          height: result.height || imageData.height,
          position: {
            left: result.position_x || imageData.position?.left || 0,
            top: result.position_y || imageData.position?.top || 0
          },
          aspectRatio: result.width && result.height ? result.width / result.height : 1,
          uploaded: true // Mark as uploaded so we don't try to upload again
        };
      } else {
        const errorText = await response.text();
        console.error('📷 Image upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('📷 Image upload failed:', error);
    }
  }

  // ================================
  // PROJECT LISTING - FAST
  // ================================

  /**
   * Get project list - LIGHTWEIGHT
   */
  async getProjectList() {
    const response = await fetch(`${this.baseURL}/projects/`);
    if (!response.ok) throw new Error('Failed to load projects');
    
    const projects = await response.json();
    
    // Convert to frontend format
    return projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      slideCount: project.slide_count,
      lastModified: new Date(project.updated_at).getTime(),
      created: new Date(project.created_at).getTime()
    }));
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    const response = await fetch(`${this.baseURL}/projects/${projectId}/`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      this.cache.delete(projectId);
      return true;
    }
    throw new Error('Failed to delete project');
  }

  // ================================
  // INDIVIDUAL SLIDE OPERATIONS
  // ================================

  /**
   * Get single slide - EFFICIENT
   */
  async getSlide(projectId, slideNumber) {
    const response = await fetch(`${this.baseURL}/projects/${projectId}/slides/${slideNumber}/`);
    if (!response.ok) throw new Error('Slide not found');
    
    const slide = await response.json();
    
    // Convert to frontend format
    return {
      id: slide.slide_number,
      title: slide.title,
      type: slide.slide_type,
      formData: slide.content.formData || {},
      drawings: slide.content.drawings || [],
      images: slide.images || [],
      fieldPositions: slide.field_positions || {}
    };
  }

  /**
   * Save single slide - EFFICIENT
   */
  async saveSlide(projectId, slideNumber, slideData) {
    const response = await fetch(`${this.baseURL}/projects/${projectId}/slides/${slideNumber}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: slideData.title,
        content: {
          formData: slideData.formData || {},
          drawings: slideData.drawings || []
        },
        field_positions: slideData.fieldPositions || {}
      })
    });

    if (!response.ok) throw new Error('Failed to save slide');
    return await response.json();
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Get project statistics
   */
  async getProjectStats(projectId) {
    const response = await fetch(`${this.baseURL}/projects/${projectId}/stats/`);
    if (!response.ok) throw new Error('Failed to get stats');
    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/projects/`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const cleanProjectService = new CleanProjectService();

// Service initialized successfully

export default cleanProjectService;
