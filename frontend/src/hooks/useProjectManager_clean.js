import { useState, useCallback } from 'react';
import cleanProjectService from '../services/cleanProjectService';
import locationDataService from '../services/locationDataService';
import lroDataService from '../services/lroDataService';
import userActivityService from '../services/userActivityService';

export const useProjectManager = (
  sessionUser,
  slides,
  setSlides,
  slideData,
  setSlideData,
  globalLocationData,
  setGlobalLocationData,
  multipleLocationsMode,
  setMultipleLocationsMode,
  slideTypeCounts,
  setSlideTypeCounts,
  nextSlideId,
  setNextSlideId,
  setCurrentSlide,
  fieldPositions,
  setFieldPositions,
  setIsLoadingProject,
  setLoadingMessage,
  currentProjectId,
  setCurrentProjectId,
  setCurrentProjectStatus,
  setIsProjectModified,
  setLastSaveTime,
  setShowWebsite
) => {
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);

  // Utility function to remove duplicate slides
  const removeDuplicateSlides = useCallback((slides) => {
    const seenIds = new Set();
    return slides.filter(slide => {
      if (seenIds.has(slide.id)) {
        return false;
      }
      seenIds.add(slide.id);
      return true;
    });
  }, []);

  // Load saved project data - SIMPLIFIED with clean service
  const loadProject = useCallback(async (projectId) => {
    const startTime = performance.now();
    
    try {
      // Show loading screen with professional messaging  
      setIsLoadingProject(true);
      setLoadingMessage("Opening project...");

      // Set current project ID immediately to prevent race conditions
      setCurrentProjectId(projectId);

      // Update loading message
      setLoadingMessage("Loading project data...");

      // Load project using clean service - gets everything in correct format
      const savedProject = await cleanProjectService.loadProject(projectId, true);
      
      if (!savedProject) {
        throw new Error('Project not found or could not be loaded');
      }

      // Load project status
      if (savedProject.status) {
        setCurrentProjectStatus(savedProject.status);
      } else {
        setCurrentProjectStatus('draft');
      }

      // Restore all project data - clean service provides everything in correct format
      if (savedProject.slides && savedProject.slides.length > 0) {
        // Clean up any duplicate slides before loading
        const cleanedSlides = removeDuplicateSlides(savedProject.slides);
        setSlides(cleanedSlides);
        
        // Update slide type counts and nextSlideId based on loaded slides
        const newSlideTypeCounts = { street_view: 0 };
        let maxSlideId = 0;

        cleanedSlides.forEach(slide => {
          if (slide.type === 'street_view') {
            newSlideTypeCounts.street_view++;
          }
          if (slide.id > maxSlideId) {
            maxSlideId = slide.id;
          }
        });

        setSlideTypeCounts(newSlideTypeCounts);
        setNextSlideId(maxSlideId + 1);

        // Set current slide to the first slide
        setCurrentSlide(cleanedSlides[0].id);
      } else {
        // No slides - set defaults
        setSlides([]);
        setSlideTypeCounts({ street_view: 0 });
        setNextSlideId(1);
        setCurrentSlide(1);
      }

      // Load slide data
      if (savedProject.slideData) {
        setSlideData(savedProject.slideData);
      }

      // Load form data  
      if (savedProject.formData) {
        setGlobalLocationData(savedProject.formData);
      }

      // Load field positions
      if (savedProject.fieldPositions) {
        setFieldPositions(savedProject.fieldPositions);
      }

      // Load settings
      if (savedProject.multipleLocationsMode !== undefined) {
        setMultipleLocationsMode(savedProject.multipleLocationsMode);
      }

      // Initialize location data service with project data
      if (savedProject.formData) {
        await locationDataService.initialize(savedProject, multipleLocationsMode);
      }

      // Set loading message for final step
      setLoadingMessage("Finalizing project setup...");

      // Calculate load time for performance feedback
      const loadTime = Math.round(performance.now() - startTime);
      
      // Clear project modified flag since we just loaded fresh data
      setIsProjectModified(false);
      
      // Hide loading screen
      setIsLoadingProject(false);
      setLoadingMessage("");
      
      // Show success message if load took a while
      if (loadTime > 1000 && typeof window !== 'undefined' && window.showToast) {
        window.showToast(`Project loaded successfully (${loadTime}ms)`, 'success');
      }
      
      return {
        success: true,
        projectId,
        loadTime,
        message: 'Project loaded successfully'
      };

    } catch (error) {
      console.error('Failed to load project:', {
        projectId,
        error: error.message
      });

      // Calculate how long the failed attempt took
      const failTime = Math.round(performance.now() - startTime);

      // Hide loading screen
      setIsLoadingProject(false);
      setLoadingMessage("");
      
      // Show error message to user
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`Failed to load project: ${error.message}`, 'error');
      }
      
      // Reset project ID since load failed
      setCurrentProjectId(null);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        projectId,
        loadTime: failTime,
        message: 'Project load failed'
      };
    }
  }, [
    sessionUser,
    setIsLoadingProject,
    setLoadingMessage,
    setCurrentProjectId,
    setCurrentProjectStatus,
    setSlides,
    setSlideData,
    setGlobalLocationData,
    setFieldPositions,
    setMultipleLocationsMode,
    setSlideTypeCounts,
    setNextSlideId,
    setCurrentSlide,
    setIsProjectModified,
    multipleLocationsMode,
    removeDuplicateSlides
  ]);

  // Save project - SIMPLIFIED with clean service
  const saveProject = useCallback(async (isAutoSave = false) => {
    if (!currentProjectId) {
      console.warn('No project ID available for save');
      return { success: false, error: 'No project ID' };
    }

    try {
      // Prepare project data for saving
      const projectData = {
        title: globalLocationData.insuredName ? 
          `Property Review - ${globalLocationData.insuredName}` : 
          `Property Review ${new Date().toLocaleDateString()}`,
        description: globalLocationData.premiseLocation || '',
        formData: globalLocationData,
        slideData: slideData,
        slides: slides,
        fieldPositions: fieldPositions,
        multipleLocationsMode: multipleLocationsMode,
        sessionUser: sessionUser
      };

      // Save using the new clean project service
      const result = await cleanProjectService.saveProject(currentProjectId, projectData);
      
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }

      // Update UI state - clear modified flag and update save time
      setIsProjectModified(false);
      setLastSaveTime(new Date());
      
      // Show success message briefly
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Project saved successfully', 'success');
      }
      
      return {
        success: true,
        projectId: currentProjectId,
        savedAt: new Date().toISOString(),
        message: 'Project saved successfully'
      };

    } catch (error) {
      console.error('Save failed:', error);
      
      // Keep the modified flag true since save failed
      // Don't clear setIsProjectModified(false) on error
      
      // Show error message to user
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to save project. Please try again.', 'error');
      }
      
      // Return error information
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        projectId: currentProjectId,
        message: 'Save failed - please try again'
      };
    }
  }, [
    currentProjectId,
    globalLocationData,
    slideData,
    slides,
    fieldPositions,
    multipleLocationsMode,
    sessionUser,
    setIsProjectModified,
    setLastSaveTime
  ]);

  // Create new project - SIMPLIFIED
  const createProject = useCallback(async (title, description = '') => {
    try {
      const project = await cleanProjectService.createProject(title, description);
      setCurrentProjectId(project.id);
      setCurrentProjectStatus('draft');
      setIsProjectModified(false);
      
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [setCurrentProjectId, setCurrentProjectStatus, setIsProjectModified]);

  // Delete project
  const deleteProject = useCallback(async (projectId) => {
    try {
      await cleanProjectService.deleteProject(projectId);
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }, []);

  // Get project list
  const getProjectList = useCallback(async () => {
    try {
      return await cleanProjectService.getProjectList();
    } catch (error) {
      console.error('Failed to get project list:', error);
      return [];
    }
  }, []);

  // Auto-save functionality
  const enableAutoSave = useCallback((intervalMs = 30000) => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }

    const interval = setInterval(async () => {
      if (currentProjectId) {
        await saveProject(true); // Auto-save
      }
    }, intervalMs);

    setAutoSaveInterval(interval);
  }, [autoSaveInterval, currentProjectId, saveProject]);

  const disableAutoSave = useCallback(() => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
    }
  }, [autoSaveInterval]);

  return {
    // Core functions
    loadProject,
    saveProject,
    createProject,
    deleteProject,
    getProjectList,

    // Auto-save
    enableAutoSave,
    disableAutoSave,

    // Utility functions
    removeDuplicateSlides
  };
};
