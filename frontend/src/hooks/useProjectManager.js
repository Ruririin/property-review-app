import { useState, useCallback } from 'react';
import apiService from '../services/apiService';
import locationDataService from '../services/locationDataService';
import projectSaveService from '../services/projectSaveService';
import slideApiService from '../services/slideApiService';
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

  // Load saved project data
  const loadProject = useCallback(async (projectId) => {
    try {
      // Show loading screen
      setIsLoadingProject(true);
      setLoadingMessage("Loading project data...");

      // Set current project ID immediately to prevent race conditions
      setCurrentProjectId(projectId);

      // Update loading message
      setLoadingMessage("Fetching project details...");

      console.log('🔍 Attempting to fetch project from API:', projectId);
      const savedProject = await apiService.getProject(projectId);
      console.log('📦 API Response:', savedProject ? 'Project found' : 'No project returned');
      console.log('📦 Full savedProject object:', savedProject);
      console.log('📦 savedProject keys:', savedProject ? Object.keys(savedProject) : 'null');

      if (savedProject) {
        // Fetch slides separately since they're on a different endpoint
        console.log('🔍 Fetching slides for project:', projectId);
        const projectSlides = await apiService.getProjectSlides(projectId);
        console.log('📦 Slides API Response:', projectSlides);

        // Add slides to the project object
        if (projectSlides && Array.isArray(projectSlides)) {
          savedProject.slides = projectSlides.map(slide => ({
            id: slide.slide_number || slide.id,
            title: slide.title || `Slide ${slide.slide_number || slide.id}`,
            type: slide.template_type || slide.type || 'cover'
          }));
          console.log('📦 Processed slides:', savedProject.slides);
        } else {
          console.log('⚠️ No slides found or invalid slides data');
          savedProject.slides = [];
        }

        // Load project status
        if (savedProject.status) {
          setCurrentProjectStatus(savedProject.status);
        } else {
          setCurrentProjectStatus('draft'); // Default status
        }

      // Restore all project data
      console.log('🔍 loadProject: savedProject.slides =', savedProject.slides);
      console.log('🔍 loadProject: savedProject.slides type =', typeof savedProject.slides);
      console.log('🔍 loadProject: savedProject.slides length =', savedProject.slides?.length);

      if (savedProject.slides && savedProject.slides.length > 0) {
        // Clean up any duplicate slides before loading
        const cleanedSlides = removeDuplicateSlides(savedProject.slides);
        
        console.log('🔍 loadProject: Original slides:', savedProject.slides.length);
        console.log('🔍 loadProject: Cleaned slides:', cleanedSlides.length);
        console.log('🔍 loadProject: Setting slides to:', cleanedSlides);
        
        setSlides(cleanedSlides);

        // Update slide type counts and nextSlideId based on loaded slides
        const newSlideTypeCounts = { street_view: 0 };
        let maxSlideId = 0;

        cleanedSlides.forEach(slide => {
          if (slide.type === 'street_view') {
            newSlideTypeCounts.street_view++;
          }

          // Track the highest slide ID to set nextSlideId
          if (slide.id > maxSlideId) {
            maxSlideId = slide.id;
          }
        });

        setSlideTypeCounts(newSlideTypeCounts);
        setNextSlideId(maxSlideId + 1);

        // Set current slide to the first slide, or slide 1 if no slides
        if (savedProject.slides.length > 0) {
          setCurrentSlide(savedProject.slides[0].id);
        } else {
          setCurrentSlide(1);
        }
      } else {
        // No slides array, but check if slideData exists to rebuild slides
        if (savedProject.slideData && Object.keys(savedProject.slideData).length > 0) {
          console.log('🔧 Rebuilding slides from slideData:', Object.keys(savedProject.slideData));

          // Rebuild slides array from slideData
          const rebuiltSlides = [];
          Object.keys(savedProject.slideData).forEach(slideKey => {
            const slideId = parseInt(slideKey);

            // Skip any non-numeric keys that would result in NaN
            if (isNaN(slideId)) {
              console.warn(`⚠️ Skipping invalid slide key: ${slideKey}`);
              return;
            }

            const slideData = savedProject.slideData[slideKey];

            // Determine slide type from slideData
            let slideType = 'cover'; // default
            if (slideData.formData?.slideType) {
              slideType = slideData.formData.slideType;
            } else if (slideId === 1) {
              slideType = 'cover';
            } else if (slideId === 2) {
              slideType = 'crime_rate';
            }

            rebuiltSlides.push({
              id: slideId,
              type: slideType,
              title: slideData.formData?.slideTitle || (slideId === 1 ? 'Cover Page' : `Slide ${slideId}`)
            });
          });

          // Sort by slide ID
          rebuiltSlides.sort((a, b) => a.id - b.id);

          console.log('🔧 Rebuilt slides:', rebuiltSlides);
          setSlides(rebuiltSlides);

          // Update slide type counts
          const newSlideTypeCounts = { street_view: 0 };
          let maxSlideId = 0;
          rebuiltSlides.forEach(slide => {
            if (newSlideTypeCounts[slide.type] !== undefined) {
              newSlideTypeCounts[slide.type]++;
            }
            maxSlideId = Math.max(maxSlideId, slide.id);
          });

          setSlideTypeCounts(newSlideTypeCounts);
          setNextSlideId(maxSlideId + 1);
          setCurrentSlide(rebuiltSlides[0]?.id || 1);
        } else {
          // Truly no slides, reset to defaults
          setSlides([]);
          setSlideTypeCounts({ street_view: 0 });
          setNextSlideId(2);
          setCurrentSlide(1);
        }
      }

      // Restore slideData
      if (savedProject.slideData) {
        // Get existing slide data to preserve structure
        let restoredSlideData = { ...slideData };

        // Handle any _appState migration first (highest priority)
        if (savedProject._appState?.globalLocationData) {
          setGlobalLocationData(savedProject._appState.globalLocationData);
        }

        // Legacy field position restoration
        if (savedProject.fieldPositions) {
          Object.entries(savedProject.fieldPositions).forEach(([slideKey, positions]) => {
            // Check if slideKey is a number (actual slide ID)
            const slideId = parseInt(slideKey);
            if (!isNaN(slideId) && positions) {
              if (restoredSlideData[slideId]) {
                restoredSlideData[slideId].fieldPositions = positions;
              } else {
                restoredSlideData[slideId] = {
                  ...slideData[slideId] || {},
                  fieldPositions: positions
                };
              }
            } else if (positions) {
              // Legacy field names - add them to slide 2 (first content slide)
              if (!restoredSlideData[2]) {
                restoredSlideData[2] = { ...slideData[2] };
              }
              if (!restoredSlideData[2].fieldPositions) {
                restoredSlideData[2].fieldPositions = {};
              }
              restoredSlideData[2].fieldPositions[slideKey] = positions;
            }
          });
        }

        console.log('🔍 loadProject: Setting slideData to:', restoredSlideData);
        setSlideData(restoredSlideData);

        // Only set globalLocationData from saved project if not already set by _appState
        if (!savedProject._appState?.globalLocationData && savedProject.formData) {
          const completeFormData = {
            ...savedProject.formData,
            premiseLocation: savedProject.formData.premiseLocation || "",
            website: savedProject.formData.website || "",
            insuredName: savedProject.formData.insuredName || "",
            description: savedProject.formData.description || "",
            lineBusiness: savedProject.formData.lineBusiness || ""
          };

          setGlobalLocationData(completeFormData);

          // Initialize location data service with this data
          if (locationDataService && locationDataService.locationData) {
            locationDataService.locationData.clear();
            if (typeof locationDataService.addLocation === 'function') {
              locationDataService.addLocation(completeFormData);
            } else {
              locationDataService.locationData.set(0, completeFormData);
            }
            console.log('✅ Initialized location data service');
          }
        }

        // Restore _appState if present
        if (savedProject._appState) {
          if (savedProject._appState.multipleLocationsMode !== undefined) {
            setMultipleLocationsMode(savedProject._appState.multipleLocationsMode);
          }
        }

        setSlideData(restoredSlideData);
      }

      // Track the project load activity
      const originalLroFormId = savedProject.formData?.lroFormId || savedProject._appState?.lroFormId;
      if (sessionUser && originalLroFormId) {
      }

      // Set loading message for final step
      setLoadingMessage("Finalizing project setup...");

      // Hide loading screen
      setIsLoadingProject(false);
      setLoadingMessage("");

      } else {
        throw new Error(`No project found for ID: ${projectId}`);
      }
    } catch (error) {
      console.error('❌ Error in loadProject:', {
        projectId,
        error: error.message,
        stack: error.stack
      });

      // Don't create a new project if we failed to load - this causes duplicates
      setIsLoadingProject(false);
      setLoadingMessage("");
      throw error; // Re-throw to let caller handle
    }
  }, [
    sessionUser,
    slideData,
    setSlides,
    setSlideData,
    setGlobalLocationData,
    setMultipleLocationsMode,
    setSlideTypeCounts,
    setNextSlideId,
    setCurrentSlide,
    setIsLoadingProject,
    setLoadingMessage,
    setCurrentProjectId,
    setCurrentProjectStatus
  ]);

  // Update project status
  const updateProjectStatus = useCallback(async (projectId, newStatus) => {
    if (!projectId || !sessionUser) return;

    try {
      await projectSaveService.updateProjectStatus(sessionUser, projectId, newStatus);
      setCurrentProjectStatus(newStatus);
    } catch (error) {
    }
  }, [sessionUser, setCurrentProjectStatus]);

  // Save project function
  const saveProject = useCallback(async (saveType = "manual", forceProjectId = null) => {
    console.log('🔍 saveProject called with:', { saveType, forceProjectId, sessionUser });
    
    if (!sessionUser) {
      console.log('❌ No sessionUser, returning early');
      return;
    }

    try {
      let projectId = forceProjectId || currentProjectId;
      console.log('🔍 Using projectId:', { forceProjectId, currentProjectId, final: projectId });

      // Validate project ID exists in database if provided
      if (projectId) {
        try {
          const existingProject = await apiService.getProject(projectId);
          if (!existingProject) {
            console.log('⚠️ ProjectId does not exist in database');
            clearInvalidProjectState();
            
            // Don't create new project during auto-save - just return
            if (saveType === 'auto') {
              console.log('ℹ️ Skipping project creation during auto-save');
              return;
            }
            
            projectId = null; // Force creation of new project only for manual saves
          }
        } catch (error) {
          console.log('⚠️ Failed to validate projectId:', error.message);
          clearInvalidProjectState();
          
          // Don't create new project during auto-save - just return
          if (saveType === 'auto') {
            console.log('ℹ️ Skipping project creation during auto-save');
            return;
          }
          
          projectId = null; // Force creation of new project only for manual saves
        }
      }

      // Create new project if we don't have a valid ID
      if (!projectId) {
        console.log('⚠️ No valid projectId, creating new project');
        const newProjectData = {
          title: `Untitled Property Review ${new Date().toLocaleDateString()}`,
          sessionUser: sessionUser,
          formData: globalLocationData || {},
          slideData: slideData || {},
          slides: slides || []
        };
        const newProject = await apiService.createProject(newProjectData);
        if (newProject && newProject.id) {
          projectId = newProject.id;
          console.log('✅ Created new project with ID:', projectId);
          setCurrentProjectId(projectId);
        } else {
          console.log('❌ Failed to create new project');
          return;
        }
      } else {
        console.log('✅ Using existing projectId:', projectId);
      }

      // Prepare project data for saving
      const projectData = {
        title: `Property Review ${new Date().toLocaleDateString()}`,
        formData: globalLocationData,
        slideData: slideData,
        slides: slides,
        fieldPositions: fieldPositions,
        _appState: {
          globalLocationData: globalLocationData,
          multipleLocationsMode: multipleLocationsMode,
          lroFormId: globalLocationData.lroFormId,
          timestamp: new Date().toISOString()
        }
      };

      // Save to backend using the projectSaveService
      // Include sessionUser in the projectData
      const projectDataWithUser = {
        ...projectData,
        sessionUser: sessionUser
      };
      await projectSaveService.saveProject(projectId, projectDataWithUser);

      // Update UI state
      setIsProjectModified(false);
      setLastSaveTime(new Date());
      
      // Save to session storage as backup
      try {
        sessionStorage.setItem('lastSavedProject', JSON.stringify({
          projectId,
          timestamp: new Date().toISOString(),
          formData: globalLocationData
        }));
      } catch (error) {
        console.warn('⚠️ Failed to save to session storage:', error);
      }
      
      console.log('✅ Save completed successfully:', {
        projectId,
        saveType,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Save failed:', error);
      
      // Don't update UI state on error to keep modified flag
      // setIsProjectModified(false); // Keep this commented - only set false on success
      
      // Optionally show user feedback
      if (saveType === "manual") {
        console.error('Manual save failed - user should be notified');
        // You might want to show a toast notification here
      }
      
      throw error; // Re-throw to allow calling code to handle
    }
  }, [
    sessionUser,
    currentProjectId,
    globalLocationData,
    slideData,
    slides,
    multipleLocationsMode,
    setCurrentProjectId,
    setIsProjectModified,
    setLastSaveTime
  ]);

  // Create new project
  const createNewProject = useCallback(async () => {
    if (!sessionUser) return null;

    try {
      const projectTitle = `Property Review ${new Date().toLocaleDateString()}`;
      const newProject = await apiService.createProject(sessionUser, projectTitle);

      if (newProject && newProject.id) {
        setCurrentProjectId(newProject.id);

        // Initialize location data service for new project
        if (typeof locationDataService.clearLocationData === 'function') {
          locationDataService.clearLocationData();
        } else {
          console.error('⚠️ clearLocationData method not found on locationDataService', locationDataService);
          // Fallback: try to access the method directly
          if (locationDataService.locationData) {
            locationDataService.locationData.clear();
            console.log('✅ Used fallback clear method');
          }
        }
        if (globalLocationData.premiseLocation) {
          locationDataService.addLocation(globalLocationData);
        }

        return newProject.id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, [sessionUser, globalLocationData, setCurrentProjectId]);

  // Auto-save functionality
  const startAutoSave = useCallback((projectId) => {
    // Clear existing interval
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
    }

    // Don't start auto-save if no valid project ID
    if (!projectId) {
      console.log('⚠️ Cannot start auto-save: no valid project ID');
      return;
    }

    const interval = setInterval(async () => {
      try {
        // Use the projectId that was passed to startAutoSave
        await saveProject("auto", projectId);
      } catch (error) {
        console.warn('⚠️ Auto-save failed:', error);
        // If auto-save fails due to invalid project, stop the interval
        if (error.message?.includes('DoesNotExist') || error.message?.includes('404') || error.message?.includes('500')) {
          console.log('🛑 Stopping auto-save due to project validation failure');
          clearInterval(interval);
          setAutoSaveInterval(null);
        }
      }
    }, 30000); // Auto-save every 30 seconds

    setAutoSaveInterval(interval);

    console.log('🔄 Autosave started for project:', projectId);
  }, [autoSaveInterval, saveProject]);

  const stopAutoSave = useCallback(() => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
    }
  }, [autoSaveInterval]);

  // Helper method to clear all invalid project state
  const clearInvalidProjectState = useCallback(() => {
    console.log('🧹 Clearing all invalid project state');

    // Stop auto-save
    stopAutoSave();

    // Clear state
    setCurrentProjectId(null);

    // Clear session storage
    sessionStorage.removeItem('lastSavedProject');

    // Clear localStorage project ID (from projectSaveService)
    localStorage.removeItem('currentProjectId');

    // Clear URL
    window.history.replaceState({}, '', '/editor');

    console.log('✅ Cleared all invalid project state');
  }, [stopAutoSave, setCurrentProjectId]);

  // Helper method to remove duplicate slides
  const removeDuplicateSlides = useCallback((slides) => {
    const seenTypes = new Set();
    const uniqueSlides = [];
    
    slides.forEach(slide => {
      // Allow multiple slides for certain types, but only one for specific types
      const singleInstanceTypes = ['crime_rate', 'comments', 'ratings', 'website', 'fire_hazard', 'nearest_fire_station'];
      
      if (singleInstanceTypes.includes(slide.type)) {
        if (!seenTypes.has(slide.type)) {
          seenTypes.add(slide.type);
          uniqueSlides.push(slide);
        } else {
          console.log(`🗑️ Removing duplicate ${slide.type} slide (ID: ${slide.id})`);
        }
      } else {
        // Allow multiple instances for other types (street_view, interior, etc.)
        uniqueSlides.push(slide);
      }
    });
    
    return uniqueSlides;
  }, []);

  return {
    loadProject,
    saveProject,
    createNewProject,
    updateProjectStatus,
    startAutoSave,
    stopAutoSave,
    removeDuplicateSlides
  };
};