/**
 * Enhanced Project Save Service - Database + localStorage hybrid
 * Prioritizes database storage with localStorage fallback
 */

import apiService from './apiService.js';

class ProjectSaveService {
  constructor() {
    this.projects = new Map(); // In-memory cache
    this.currentProjectId = null;
    this.useDatabase = true; // Try database first
    this.isOnline = true;
    this.savingProjects = new Set(); // Track projects currently being saved to prevent race conditions
    this.initialized = false; // Track if service has been initialized

    // Don't auto-init - wait for explicit initialization after auth check
  }

  async init() {
    if (this.initialized) return; // Prevent double initialization

    this.initialized = true;

    // Check if backend is available
    this.isOnline = await apiService.healthCheck();
    console.log(`🌐 Backend status: ${this.isOnline ? 'ONLINE (Database)' : 'OFFLINE (localStorage fallback)'}`);

    // Load projects from appropriate source
    if (this.isOnline) {
      await this.loadProjectsFromDatabase();
    } else {
      this.loadProjectsFromLocalStorage();
    }

    this.loadCurrentProject();
  }

  /**
   * Save project - Database first, localStorage fallback
   */
  async saveProject(projectId, projectData) {
    // Prevent multiple saves of the same project running simultaneously
    if (this.savingProjects.has(projectId)) {
      console.log(`⏳ DUPLICATE SAVE BLOCKED for project ${projectId} (race condition prevented)`);
      return this.projects.get(projectId);
    }
    
    console.log(`🚀 SAVE PROJECT CALLED with projectId: ${projectId}`);

    // CRITICAL: If this project has a different databaseId in cache, use that instead
    const cachedProject = this.projects.get(projectId);
    if (cachedProject?.databaseId && cachedProject.databaseId !== projectId) {
      console.log(`🔄 Redirecting save to database ID: ${projectId} → ${cachedProject.databaseId}`);
      return this.saveProject(cachedProject.databaseId, projectData);
    }

    console.log(`🎯 STARTING SAVE for project ${projectId} (${this.savingProjects.size} saves already in progress)`);
    this.savingProjects.add(projectId);
    // CRITICAL: Get existing project to preserve database flags
    const existingProject = this.projects.get(projectId);

    const saveData = {
      id: projectId,
      title: projectData.title || projectData.insuredName || 'Untitled Project',
      insuredName: projectData.insuredName || '',
      premiseLocation: projectData.premiseLocation || '',
      description: projectData.description || '',
      website: projectData.website || '',
      sessionUser: projectData.sessionUser,
      slides: projectData.slides || [],
      slideData: projectData.slideData || {},
      formData: projectData.formData || {},
      fieldPositions: projectData.fieldPositions || {},
      fontSizes: projectData.fontSizes || {},
      showWebsite: projectData.showWebsite || false,
      multipleLocationsMode: projectData.multipleLocationsMode || false,
      selectedLocationIndex: projectData.selectedLocationIndex || 0,
      status: projectData.status || existingProject?.status || 'personal_draft',
      currentSlide: projectData.currentSlide || 1,
      totalSlides: projectData.totalSlides || (projectData.slides?.length || 1),
      exportCount: projectData.exportCount || existingProject?.exportCount || 0,
      lastExportTime: projectData.lastExportTime || existingProject?.lastExportTime || null,
      originalLroFormId: projectData.originalLroFormId || existingProject?.originalLroFormId || null,
      completedBy: projectData.completedBy || null,
      completedAt: projectData.completedAt || null,
      lastModified: Date.now(),
      created: this.projects.has(projectId) ? existingProject.created : Date.now(),
      // CRITICAL: Preserve database flags to prevent duplicate creation
      _savedToDatabase: projectData._savedToDatabase || existingProject?._savedToDatabase || false,
      databaseId: projectData.databaseId || existingProject?.databaseId || projectId
    };

    // Debug logging for slideData
    console.log('📊 SAVE DEBUG - slideData keys:', Object.keys(saveData.slideData));
    console.log('📊 SAVE DEBUG - formData:', saveData.formData);
    if (Object.keys(saveData.slideData).length > 0) {
      console.log('📊 SAVE DEBUG - first slide data:', saveData.slideData[Object.keys(saveData.slideData)[0]]);
    }

    // Save to memory cache
    this.projects.set(projectId, saveData);
    this.setCurrentProject(projectId);

    let dbProject = null;
    try {
      if (this.isOnline && this.useDatabase) {
        dbProject = await this.saveProjectToDatabase(projectId, saveData);
        console.log(`💾 Project saved to DATABASE: ${saveData.title} (${projectId})`);
      } else {
        this.saveProjectToLocalStorage(projectId, saveData);
        console.log(`💾 Project saved to localStorage: ${saveData.title} (${projectId})`);
      }
    } catch (error) {
      console.error('Database save failed, using localStorage fallback:', error);
      this.saveProjectToLocalStorage(projectId, saveData);
    } finally {
      // Always remove the lock when save completes
      console.log(`SAVE COMPLETED for project ${projectId} (removing lock)`);
      this.savingProjects.delete(projectId);
    }

    // Return database project if available (has the correct database ID), otherwise saveData
    return dbProject || saveData;
  }

  /**
   * Save project to database
   */
  async saveProjectToDatabase(projectId, saveData) {
    try {
      // Prepare the data for API
      const apiData = {
        title: saveData.title || saveData.insuredName || 'Untitled Project',
        name: saveData.title || saveData.insuredName || 'Untitled Project',
        description: saveData.description || `Property review for ${saveData.insuredName || 'Unknown'}`,
        formData: saveData.formData || {},
        slideData: saveData.slideData || {},
        status: saveData.status || 'personal_draft'
      };

      let dbProject;
      const existingProject = this.projects.get(projectId);

      try {
        // Check if this project has been saved to database before
        // CRITICAL: Check both the existingProject AND saveData for the flag
        const hasBeenSavedToDb = existingProject?._savedToDatabase === true || saveData._savedToDatabase === true;
        console.log(`💾 Save decision for ${projectId}:`, {
          existingProject: !!existingProject,
          existingProject_savedToDatabase: existingProject?._savedToDatabase,
          saveData_savedToDatabase: saveData._savedToDatabase,
          hasBeenSavedToDb,
          action: hasBeenSavedToDb ? 'UPDATE' : 'CREATE'
        });

        if (hasBeenSavedToDb) {
          // Project exists in database - UPDATE it
          try {
            dbProject = await apiService.updateProject(projectId, apiData);
            console.log('✅ Updated existing database project:', projectId);
          } catch (updateError) {
            // If update fails (project was deleted), create new
            if (updateError.message.includes('404') || updateError.message.includes('DoesNotExist')) {
              dbProject = await apiService.createProject(apiData);
              console.log('🆕 Created new project after 404:', dbProject.id);
            } else {
              throw updateError;
            }
          }
        } else {
          // New project that hasn't been saved to database yet - CREATE it
          dbProject = await apiService.createProject(apiData);
          console.log('🆕 Created NEW project:', dbProject.id);
        }

        // Update memory cache with database info
        // CRITICAL: Preserve _savedToDatabase flag from either existingProject or saveData
        const updatedProject = {
          ...saveData,
          id: dbProject.id,
          databaseId: dbProject.id,
          _savedToDatabase: true,  // Always mark as saved after successful DB operation
          title: dbProject.title,
          description: dbProject.description,
          lastModified: Date.now()
        };

        // Use the database ID as the primary ID and update the URL
        // This ensures consistency between frontend and database
        updatedProject.id = dbProject.id;
        updatedProject.databaseId = dbProject.id;
        
        // If the projectId changed, keep the old entry with databaseId pointer for redirects
        if (projectId !== dbProject.id) {
          // Keep old cache entry with databaseId for redirect (don't delete!)
          const redirectPointer = {
            ...updatedProject,
            databaseId: dbProject.id,
            _isRedirectPointer: true
          };
          this.projects.set(projectId, redirectPointer);

          // Update URL to reflect the correct database ID
          if (window.location.pathname === '/editor' || window.location.pathname.startsWith('/editor')) {
            const newUrl = `/editor/${dbProject.id}`;
            window.history.replaceState({}, '', newUrl);
            console.log(`🔄 URL updated: /editor/${projectId} → /editor/${dbProject.id}`);
          }
        }

        this.projects.set(dbProject.id, updatedProject);
        this.setCurrentProject(dbProject.id);

        // Save slides and images to database
        await this.saveProjectSlidesToDatabase(dbProject.id, saveData);

        return dbProject;
      } catch (error) {
        console.error('Primary save strategy failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  }

  /**
   * Save slides and images to database
   */
  async saveProjectSlidesToDatabase(projectId, saveData) {
    if (!saveData.slides || !saveData.slideData) return;

    for (const slide of saveData.slides) {
      const slideNumber = slide.id || slide.slideNumber;
      const slideContent = saveData.slideData[slideNumber] || {};

      // Extract fieldPositions - it's stored as a separate field in the backend model
      const fieldPositions = slideContent.fieldPositions || {};

      // Build content object WITHOUT fieldPositions and frameImages
      // frameImages contain base64 data which is too large for database
      // Images are uploaded separately via the image upload endpoint
      // frameMeta is kept - it's small metadata (file paths, URLs, dimensions)
      const {
        fieldPositions: _,
        frameImages,
        ...contentWithoutExcludedFields
      } = slideContent;

      const slideData = {
        slideNumber: slideNumber,
        title: slide.title || '',
        content: {
          formData: slideContent.formData || {},
          drawings: slideContent.drawings || [],
          frameLayout: slideContent.frameLayout, // Keep frame layout setting
          ...contentWithoutExcludedFields
        },
        fieldPositions: fieldPositions,  // Pass as separate top-level field
        type: slide.type || 'standard',
      };

      try {
        // Try to update existing slide, create if doesn't exist
        let dbSlide;
        const slidesResponse = await apiService.getProjectSlides(projectId);

        // Handle both array and paginated response formats
        const existingSlides = Array.isArray(slidesResponse)
          ? slidesResponse
          : (slidesResponse?.results || []);

        dbSlide = existingSlides.find(s => s.slide_number === slideNumber);

        if (dbSlide) {
          // Slide exists - UPDATE it
          await apiService.updateSlide(dbSlide.id, slideData);
        } else {
          // Slide doesn't exist - CREATE it
          dbSlide = await apiService.createSlide(projectId, slideData);
        }

        // Handle image uploads for MultiImageComponent format (Comments, Inspection slides)
        // Note: Most slides now use frame-based images which are handled separately below
        if (slideContent.images && Array.isArray(slideContent.images) && slideContent.images.length > 0 && dbSlide) {
          for (const image of slideContent.images) {
            if (image.src && image.src.startsWith('data:image/')) {
              // Skip upload - legacy endpoint no longer exists
              // These images are stored in slideData.images for Comments/Inspection slides
              console.log(`Skipping legacy image upload for slide ${dbSlide.id} - stored in slideData instead`);
            }
          }
        }

        // Legacy support for single imageData (no longer used by any slides)
        if (slideContent.imageData && dbSlide) {
          console.log(`Skipping legacy single image upload for slide ${dbSlide.id} - stored in slideData instead`);
        }

        // Upload any frame images that haven't been uploaded yet
        // (e.g., images added before first save when no databaseId existed)
        if (frameImages && Object.keys(frameImages).length > 0) {
          const existingMeta = slideContent.frameMeta || {};
          const updatedMeta = { ...existingMeta };
          let metaChanged = false;

          for (const [frameId, imageData] of Object.entries(frameImages)) {
            // Only upload if it's base64 data and not yet in frameMeta
            if (imageData && imageData.startsWith('data:image/') && !existingMeta[frameId]) {
              try {
                const result = await apiService.post('/slides/upload-image/', {
                  project_id: projectId,
                  slide_id: String(slideNumber),
                  frame_id: frameId,
                  image_data: imageData
                });

                if (result.success || result.file_path) {
                  updatedMeta[frameId] = {
                    filePath: result.file_path,
                    url: result.image_data?.src || `/media/${result.file_path}`,
                    width: result.image_data?.width,
                    height: result.image_data?.height,
                    aspectRatio: result.image_data?.aspectRatio
                  };
                  metaChanged = true;
                  console.log(`Uploaded frame ${frameId} for slide ${slideNumber}`);
                }
              } catch (uploadError) {
                console.warn(`Failed to upload frame ${frameId} for slide ${slideNumber}:`, uploadError);
              }
            }
          }

          // If we uploaded new frames, update the slide content with frameMeta
          if (metaChanged) {
            try {
              const updatedContent = { ...slideData.content, frameMeta: updatedMeta };
              if (dbSlide) {
                await apiService.updateSlide(dbSlide.id, { ...slideData, content: updatedContent });
              }
            } catch (metaError) {
              console.warn(`Failed to update frameMeta for slide ${slideNumber}:`, metaError);
            }
          }
        }

      } catch (error) {
        console.warn(`Failed to save slide ${slideNumber}:`, error);
      }
    }
  }

  /**
   * Handle image upload to database
   */
  async handleImageUpload(slideId, imageData, imagePosition = {}) {
    // DEPRECATED: This method is no longer used
    // Images are now stored directly in slideData instead of being uploaded separately
    // - MultiImageComponent images: stored in slideData.images
    // - Frame-based images: uploaded via /slides/upload-image/ endpoint
    console.log('handleImageUpload called but deprecated - images stored in slideData');
    return null;
  }

  /**
   * Save to localStorage (fallback method)
   */
  saveProjectToLocalStorage(projectId, saveData) {
    try {
      const stored = localStorage.getItem('savedProjects');
      const projects = stored ? JSON.parse(stored) : {};

      // Keep images but compress them for localStorage
      const lightweightData = { ...saveData };

      // CRITICAL: Preserve database flags to prevent duplicate creation
      if (saveData._savedToDatabase !== undefined) {
        lightweightData._savedToDatabase = saveData._savedToDatabase;
      }
      if (saveData.databaseId) {
        lightweightData.databaseId = saveData.databaseId;
      }

      if (lightweightData.slideData) {
        for (const [slideId, slideInfo] of Object.entries(lightweightData.slideData)) {
          if (slideInfo.images && Array.isArray(slideInfo.images)) {
            // Keep images but potentially compress them later if quota issues arise
            lightweightData.slideData[slideId] = {
              ...slideInfo,
              images: slideInfo.images, // Keep pasted images
              drawings: slideInfo.drawings || []
            };
          }
        }
      }

      projects[projectId] = lightweightData;
      localStorage.setItem('savedProjects', JSON.stringify(projects));
    } catch (error) {
      console.error('localStorage save failed:', error);
    }
  }

  /**
   * Load project - Database first, localStorage fallback
   */
  async loadProject(projectId) {
    try {
      if (this.isOnline && this.useDatabase) {
        // Always use loadProjectFromDatabase when online - it handles cache and slide loading
        return await this.loadProjectFromDatabase(projectId);
      } else {
        // Offline mode: try memory cache first, then localStorage
        if (this.projects.has(projectId)) {
          return this.projects.get(projectId);
        }
        return this.loadProjectFromLocalStorage(projectId);
      }
    } catch (error) {
      console.error('Failed to load project, trying localStorage:', error);
      return this.loadProjectFromLocalStorage(projectId);
    }
  }

  /**
   * Load project from database (with lazy slide loading)
   */
  async loadProjectFromDatabase(projectId) {
    try {
      // Check if project is already in memory cache
      if (this.projects.has(projectId)) {
        const cachedProject = this.projects.get(projectId);
        // If slides not loaded yet, load them now
        if (!cachedProject.slidesLoaded) {
          await this.ensureProjectSlidesLoaded(projectId);
        }
        return cachedProject;
      }

      console.log(`🔄 Loading project ${projectId} from database...`);
      const dbProject = await apiService.getProject(projectId);
      
      // Create project data with basic info only (no slides yet)
      const projectData = {
        id: dbProject.id,
        databaseId: dbProject.id,
        _savedToDatabase: true, // CRITICAL: Mark as saved to prevent duplicate creation
        title: dbProject.title || dbProject.name || 'Untitled Project',
        insuredName: dbProject.title || dbProject.name || 'Untitled Project',
        description: dbProject.description || '',
        sessionUser: 'database-user',
        slides: [],
        slideData: {},
        formData: dbProject.formData || {},
        fieldPositions: {},
        fontSizes: {},
        showWebsite: false,
        multipleLocationsMode: false,
        selectedLocationIndex: 0,
        status: dbProject.status || 'personal_draft',
        currentSlide: 1,
        totalSlides: 0,
        lastModified: dbProject.updated_at ? new Date(dbProject.updated_at).getTime() : Date.now(),
        created: dbProject.created_at ? new Date(dbProject.created_at).getTime() : Date.now(),
        slidesLoaded: false
      };

      // Cache the project
      this.projects.set(projectId, projectData);
      
      // Now load slides asynchronously
      await this.ensureProjectSlidesLoaded(projectId);
      
      console.log(`Project ${projectId} loaded from database`);
      return this.projects.get(projectId);
      
    } catch (error) {
      console.error(`Database load failed for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Load projects from database (optimized with caching)
   */
  async loadProjectsFromDatabase() {
    try {
      // Check cache timestamp
      const cacheKey = 'projectsCache';
      const cacheTimeKey = 'projectsCacheTime';
      const cacheExpiry = 2 * 60 * 1000; // 2 minutes cache
      
      const cachedTime = localStorage.getItem(cacheTimeKey);
      const cachedData = localStorage.getItem(cacheKey);
      
      // Use cache if it's fresh and we have data in memory
      if (cachedTime && cachedData && this.projects.size > 0) {
        const age = Date.now() - parseInt(cachedTime);
        if (age < cacheExpiry) {
          console.log(`📂 Using cached projects (${Math.round(age/1000)}s old)`);
          return;
        }
      }

      console.log('📂 Fetching fresh projects from database...');
      const startTime = performance.now();
      
      const dbProjects = await apiService.listProjects({
        page_size: 100,  // Limit to 100 projects per request
        ordering: '-updated_at'  // Most recently updated first
      });
      
      this.projects.clear(); // Clear existing cache
      
      // Load projects without slides first (much faster)
      const projectPromises = (dbProjects.results || dbProjects).map(async (dbProject) => {
        const projectData = {
          id: dbProject.id,
          databaseId: dbProject.id,
          _savedToDatabase: true, // CRITICAL: Mark as saved to prevent duplicate creation on next save
          title: dbProject.title || dbProject.name || 'Untitled Project',
          insuredName: dbProject.title || dbProject.name || 'Untitled Project',
          description: dbProject.description || '',
          sessionUser: 'database-user',
          lastModified: dbProject.updated_at ? new Date(dbProject.updated_at).getTime() :
                       dbProject.created_at ? new Date(dbProject.created_at).getTime() : Date.now(),
          created: dbProject.created_at ? new Date(dbProject.created_at).getTime() : Date.now(),
          status: dbProject.status || 'personal_draft',
          formData: dbProject.formData || {},
          slideData: {},
          slides: [],
          fieldPositions: {},
          fontSizes: {},
          slidesLoaded: false // Flag to track if slides are loaded
        };
        
        this.projects.set(dbProject.id, projectData);
        return projectData;
      });

      await Promise.all(projectPromises);
      
      // Cache the project list
      const projectsForCache = Array.from(this.projects.entries());
      localStorage.setItem(cacheKey, JSON.stringify(projectsForCache));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
      
      const loadTime = Math.round(performance.now() - startTime);
      console.log(`Loaded ${this.projects.size} projects from database in ${loadTime}ms (slides will load on demand)`);
    } catch (error) {
      console.error('Failed to load projects from database:', error);
      // Try to use cached data even if expired
      this.loadProjectsFromCache();
    }
  }

  /**
   * Load projects from cache (fallback)
   */
  loadProjectsFromCache() {
    try {
      const cachedData = localStorage.getItem('projectsCache');
      if (cachedData) {
        const projectsArray = JSON.parse(cachedData);
        this.projects = new Map(projectsArray);
        console.log(`📂 Loaded ${this.projects.size} projects from cache (fallback)`);
        return;
      }
    } catch (error) {
      console.error('Cache load failed:', error);
    }
    this.loadProjectsFromLocalStorage();
  }

  /**
   * Load slides for a specific project when needed (lazy loading)
   */
  async ensureProjectSlidesLoaded(projectId) {
    const project = this.projects.get(projectId);
    if (!project || project.slidesLoaded) {
      console.log(`⏭️ Skipping slide load for ${projectId}: ${!project ? 'no project' : 'already loaded'}`);
      return project;
    }

    try {
      console.log(`📋 Loading slides for project ${projectId}...`);
      const slidesResponse = await apiService.getProjectSlides(projectId);
      console.log(`📋 Slides API response:`, slidesResponse);

      // Handle both array and paginated response formats
      const slides = Array.isArray(slidesResponse)
        ? slidesResponse
        : (slidesResponse?.results || []);

      console.log(`📋 Parsed slides array:`, slides);

      // Log first slide to debug field names
      if (slides && slides.length > 0) {
        console.log(`📋 First slide fields:`, Object.keys(slides[0]));
        console.log(`📋 First slide data:`, slides[0]);
      }

      if (slides && slides.length > 0) {
        project.slides = slides.map(slide => ({
          id: slide.slide_number,
          title: slide.title,
          type: slide.slide_type  // FIXED: Use slide_type from database, not template_type
        }));

        project.slideData = slides.reduce((acc, slide) => {
          const slideData = {
            type: slide.slide_type,  // FIXED: Use slide_type from database
            title: slide.title,
            formData: slide.content?.formData || {},
            fieldPositions: slide.field_positions || {},  // FIXED: Use field_positions from database
            drawings: slide.content?.drawings || [],
            ...slide.content
          };

          // Reconstruct frameImages from frameMeta URLs so images display on load
          if (slideData.frameMeta && Object.keys(slideData.frameMeta).length > 0) {
            const frameImages = {};
            for (const [frameId, meta] of Object.entries(slideData.frameMeta)) {
              if (meta.url) {
                frameImages[frameId] = meta.url;
              } else if (meta.filePath) {
                // Construct URL from file path (media storage)
                frameImages[frameId] = `/media/${meta.filePath}`;
              }
            }
            if (Object.keys(frameImages).length > 0) {
              slideData.frameImages = frameImages;
            }
          }

          acc[slide.slide_number] = slideData;
          return acc;
        }, {});

        project.slidesLoaded = true;
        console.log(`✅ Loaded ${slides.length} slides for project ${projectId}`);
      } else {
        console.warn(`⚠️ No slides found for project ${projectId}`);
        project.slideData = {};
        project.slides = [];
        project.slidesLoaded = true;
      }
    } catch (error) {
      console.error(`❌ Could not load slides for project ${projectId}:`, error);
      project.slideData = {};
      project.slides = [];
      project.slidesLoaded = true; // Mark as loaded even if failed to prevent retry loops
    }

    return project;
  }

  /**
   * Load from localStorage (fallback method)
   */
  loadProjectFromLocalStorage(projectId) {
    try {
      const stored = localStorage.getItem('savedProjects');
      if (stored) {
        const projects = JSON.parse(stored);
        return projects[projectId] || null;
      }
    } catch (error) {
      console.error('localStorage load failed:', error);
    }
    return null;
  }

  /**
   * Load all projects from localStorage (fallback method)
   */
  loadProjectsFromLocalStorage() {
    try {
      const stored = localStorage.getItem('savedProjects');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.projects = new Map(Object.entries(parsed));
        console.log(`📂 Loaded ${this.projects.size} projects from localStorage`);
      }
    } catch (error) {
      console.error('localStorage load failed:', error);
      this.projects = new Map();
    }
  }

  /**
   * Delete project - from both database and localStorage
   */
  async deleteProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      if (this.isOnline && this.useDatabase) {
        await apiService.deleteProject(projectId);
      }
    } catch (error) {
      console.warn('Database delete failed:', error);
    }

    // Always remove from cache and localStorage
    this.projects.delete(projectId);
    
    try {
      const stored = localStorage.getItem('savedProjects');
      if (stored) {
        const projects = JSON.parse(stored);
        delete projects[projectId];
        localStorage.setItem('savedProjects', JSON.stringify(projects));
      }
    } catch (error) {
      console.warn('localStorage delete failed:', error);
    }

    console.log(`🗑️ Project deleted: ${project.title} (${projectId})`);
    return true;
  }

  // Keep existing methods for compatibility
  getUserProjects(sessionUser, includeCompleted = true) {
    const userProjects = [];
    for (const [id, project] of this.projects) {
      // Check both sessionUser (localStorage) and owner (database)
      const projectUser = project.sessionUser || project.owner;
      if (projectUser === sessionUser) {
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

  getUserProjects(sessionUser, includeCompleted = true) {
    const userProjects = [];
    for (const [id, project] of this.projects) {
      // Check both sessionUser (localStorage) and owner (database)
      const projectUser = project.sessionUser || project.owner;
      if (projectUser === sessionUser) {
        if (includeCompleted || project.status !== 'completed') {
          userProjects.push(project);
        }
      }
    }
    return userProjects.sort((a, b) => b.lastModified - a.lastModified);
  }

  getUserActiveProjects(sessionUser) {
    return this.getUserProjects(sessionUser, false);
  }

  getUserCompletedProjects(sessionUser) {
    const userProjects = [];
    for (const [id, project] of this.projects) {
      if (project.sessionUser === sessionUser && project.status === 'completed') {
        userProjects.push(project);
      }
    }
    return userProjects.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }

  getAllProjects() {
    return Array.from(this.projects.values())
      .filter(project => !project._isRedirectPointer)  // Exclude redirect pointers
      .sort((a, b) => b.lastModified - a.lastModified);
  }

  markProjectCompleted(projectId, sessionUser) {
    const project = this.projects.get(projectId);
    if (project) {
      project.status = 'completed';
      project.completedBy = sessionUser;
      project.completedAt = Date.now();
      project.lastModified = Date.now();
      
      // Try to save to database
      this.saveProject(projectId, project);
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
      
      // Auto-update status based on export activity
      if (project.status === 'editing' && project.exportCount >= 1) {
        project.status = 'finalizing';
      }
      
      this.saveProject(projectId, project);
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
      
      // Update key fields that might have changed
      const project = this.projects.get(projectId);
      project.formData = { ...project.formData, ...currentData.formData };
      project.slideData = { ...project.slideData, ...currentData.slideData };
      
      this.saveProject(projectId, project);
    }
  }

  generateProjectId(formId = null, sessionUser = '') {
    // Generate a proper UUID v4
    return crypto.randomUUID();
  }

  projectExists(projectId) {
    return this.projects.has(projectId);
  }

  setCurrentProject(projectId) {
    this.currentProjectId = projectId;
    try {
      localStorage.setItem('currentProjectId', projectId);
    } catch (error) {
      console.warn('Failed to save current project ID:', error);
    }
  }

  getCurrentProject() {
    return this.currentProjectId;
  }

  loadCurrentProject() {
    try {
      const currentId = localStorage.getItem('currentProjectId');
      if (currentId && this.projectExists(currentId)) {
        this.currentProjectId = currentId;
      }
    } catch (error) {
      console.warn('Failed to load current project ID:', error);
    }
  }

  clearCurrentProject() {
    this.currentProjectId = null;
    try {
      localStorage.removeItem('currentProjectId');
    } catch (error) {
      console.warn('Failed to clear current project ID:', error);
    }
  }

  // Storage analytics
  getStorageAnalytics() {
    return {
      backendStatus: this.isOnline ? 'ONLINE' : 'OFFLINE',
      storageType: this.isOnline && this.useDatabase ? 'Database' : 'localStorage',
      totalProjects: this.projects.size,
      cacheSize: JSON.stringify(Array.from(this.projects.entries())).length
    };
  }

  /**
   * Force refresh projects from database - useful after operations that might be out of sync
   */
  async refreshFromDatabase() {
    if (this.isOnline && this.useDatabase) {
      try {
        console.log('🔄 Refreshing projects from database...');
        this.projects.clear(); // Clear cache
        await this.loadProjectsFromDatabase();
        console.log(`Refreshed: ${this.projects.size} projects loaded from database`);
        return true;
      } catch (error) {
        console.error('Failed to refresh from database:', error);
        return false;
      }
    }
    return false;
  }
}

// Create singleton instance
const projectSaveService = new ProjectSaveService();

export default projectSaveService;