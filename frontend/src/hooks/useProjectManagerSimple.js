import { useState, useCallback } from 'react';
import apiService from '../services/apiService';
import cleanProjectService from '../services/cleanProjectService';

export const useProjectManagerSimple = (
  sessionUser, 
  currentProjectId, 
  slides, 
  slideData, 
  globalLocationData, 
  fieldPositions, 
  multipleLocationsMode,
  setIsProjectModified,
  setLastSaveTime
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  const saveProject = useCallback(async (autoSave = false) => {
    console.log('💾 SAVE PROJECT CALLED:', {
      autoSave,
      currentProjectId,
      slides: slides?.length,
      slideData: Object.keys(slideData || {}).length,
      globalLocationData: globalLocationData?.insuredName || 'No name'
    });
    
    let projectId = currentProjectId;
    
    // If no project ID exists, check URL first before creating a new project
    if (!projectId) {
      // Check if we're in an editor URL with a project ID
      const urlMatch = window.location.pathname.match(/\/editor\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        projectId = urlMatch[1];
      }
    }
    
    // If still no project ID exists, create a new project first
    if (!projectId) {
      try {
        const defaultTitle = globalLocationData.insuredName ? 
          `Property Review - ${globalLocationData.insuredName}` : 
          `Property Review ${new Date().toLocaleDateString()}`;
        
        const newProject = await cleanProjectService.createProject(defaultTitle, '');
        projectId = newProject.id;
        
        // Update URL to reflect the new project ID
        if (window.location.pathname === '/editor') {
          const newUrl = `/editor/${projectId}`;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (error) {
        console.error('Failed to create new project for save:', error);
        return { success: false, error: 'Failed to create project' };
      }
    }

    try {
      setIsLoading(true);
      console.log('💾 Saving project:', projectId);

      // Prepare project data for saving
      const projectData = {
        title: globalLocationData?.insuredName ? 
          `Property Review - ${globalLocationData.insuredName}` : 
          `Property Review ${new Date().toLocaleDateString()}`,
        description: globalLocationData?.premiseLocation || '',
        status: currentProject?.status || 'draft',
        formData: globalLocationData || {},
        slideData: slideData || {},
        slides: slides || [],
        fieldPositions: fieldPositions || {},
        multipleLocationsMode: multipleLocationsMode || false,
        showWebsite: true,
        sessionUser: sessionUser
      };
      
      console.log('💾 Project data being saved:', {
        projectId,
        title: projectData.title,
        status: projectData.status,
        slideCount: projectData.slides.length,
        slideDataKeys: Object.keys(projectData.slideData),
        hasFormData: !!projectData.formData,
        formDataKeys: Object.keys(projectData.formData || {})
      });

      // Save using the clean project service
      console.log('💾 About to call cleanProjectService.saveProject...');
      const result = await cleanProjectService.saveProject(projectId, projectData);
      console.log('💾 cleanProjectService.saveProject result:', result);
      
      if (!result.success) {
        console.error('💾 Save failed with result:', result);
        throw new Error(result.error || 'Save failed');
      }

      // Update UI state - clear modified flag and update save time
      if (setIsProjectModified) setIsProjectModified(false);
      if (setLastSaveTime) setLastSaveTime(new Date());
      
      // Show success message briefly
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Project saved successfully', 'success');
      }
      
      console.log('✅ Project saved successfully');
      
      return {
        success: true,
        projectId: projectId,
        savedAt: new Date().toISOString(),
        message: 'Project saved successfully'
      };

    } catch (error) {
      console.error('❌ Failed to save project:', error);
      
      // Show error message to user
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to save project. Please try again.', 'error');
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        projectId: projectId,
        message: 'Save failed - please try again'
      };
    } finally {
      setIsLoading(false);
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

  const loadProject = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      console.log('📂 Loading project:', projectId);

      // Use cleanProjectService instead of apiService for proper data transformation
      const project = await cleanProjectService.loadProject(projectId, true);
      console.log('✅ Project loaded successfully:', project);

      // Store the loaded project in state
      setCurrentProject(project);

      return project;
    } catch (error) {
      console.error('❌ Failed to load project:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    saveProject,
    loadProject,
    isLoading,
    currentProject,
    setCurrentProject
  };
};