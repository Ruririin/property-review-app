/**
 * Header Toolbar Hook
 * Manages header toolbar state and actions
 */

import { useState, useCallback } from 'react';
import lroDataService from '../services/lroDataService';
import { exportToPDF } from '../utils/pdfExport';
import cleanProjectService from '../services/cleanProjectService';
import apiService from '../services/apiService';

export const useHeaderToolbar = (sessionUser, currentProjectId) => {
  const [lroForms, setLroForms] = useState([]);
  const [isLoadingLroForms, setIsLoadingLroForms] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load LRO forms
  const loadLroForms = useCallback(async () => {
    try {
      setIsLoadingLroForms(true);
      const forms = await lroDataService.getAllForms();
      setLroForms(forms);
    } catch (error) {
      console.error('Error loading LRO forms:', error);
    } finally {
      setIsLoadingLroForms(false);
    }
  }, []);

  // Handle LRO form selection
  const handleLroFormSelect = useCallback(async (formId, callbacks = {}) => {
    const {
      setCurrentFormId = () => {},
      updateSlideFormData = () => {},
      setGlobalLocationData = () => {},
      getSlideData = () => ({}),
      findIsoCodeByNumber = () => null,
      multipleLocationsMode = false,
      selectedLocationIndex = 0,
      locationDataService = null
    } = callbacks;

    try {
      const apiResponse = await lroDataService.getFormDataForPropertyReview(formId);
      
      setCurrentFormId(formId);
      
      // Store the original LRO form ID
      const currentData = getSlideData(1)?.formData || {};
      if (!currentData.originalLroFormId) {
        updateSlideFormData(1, { originalLroFormId: formId });
      }
      
      // Search for full ISO description if available
      let fullIsoDescription = apiResponse.description || '';
      if (apiResponse.isoClass && apiResponse.isoClass.trim()) {
        try {
          const match = await findIsoCodeByNumber(apiResponse.isoClass.trim());
          if (match && match.full_text) {
            fullIsoDescription = match.full_text;
          } else {
            fullIsoDescription = apiResponse.isoClass || '';
          }
        } catch (error) {
          console.error('Error searching CSV ISO codes:', error);
          fullIsoDescription = apiResponse.isoClass || '';
        }
      }
      
      const lroFormData = {
        insuredName: apiResponse.insuredName || '',
        premiseLocation: apiResponse.premiseLocation || '',
        description: fullIsoDescription,
        website: apiResponse.website || '',
        isoClass: apiResponse.isoClass || '',
      };

      // Update location service and slide data
      if (multipleLocationsMode && selectedLocationIndex !== undefined && locationDataService) {
        Object.entries(lroFormData).forEach(([field, value]) => {
          locationDataService.updateLocationData(selectedLocationIndex, field, value);
        });
      }

      updateSlideFormData(1, lroFormData);
      
      setGlobalLocationData(prev => ({
        ...prev,
        ...lroFormData
      }));
      

      
    } catch (error) {
      console.error('Error selecting LRO form:', error);
    }
  }, []);

  // Handle PDF export - using the main branch approach with slide switching
  const handleExportPdf = useCallback(async (slides, slideData, globalLocationData, callbacks = {}) => {
    const { syncPositionsToDom = () => {}, sessionUser = null, currentSlide = null, setCurrentSlide = null } = callbacks;
    
    try {
      setIsExporting(true);
      
      // Sync all positions before export
      syncPositionsToDom();
      
      // Small delay to ensure DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!setCurrentSlide || !currentSlide) {
        throw new Error('setCurrentSlide function is required for multi-slide export');
      }
      
      // Import the main branch style export function
      const { exportAllSlidesMainBranchStyle } = await import('../utils/mainBranchPdfExport');
      
      // Use the main branch export logic
      await exportAllSlidesMainBranchStyle(
        slides, 
        slideData, 
        globalLocationData, 
        sessionUser, 
        currentSlide, 
        setCurrentSlide
      );
      
      // Export recorded automatically by the new clean service
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [currentProjectId]);

  // Handle project save with professional feedback
  const handleSaveProject = useCallback(async (saveFunction) => {
    try {
      setIsSaving(true);
      const result = await saveFunction(false); // Manual save
      
      if (result && !result.success) {
        console.error('Save failed:', result.message || result.error);
        // Error message is already shown by the saveFunction
      }
      
      return result;
    } catch (error) {
      console.error('Error during save operation:', error);
      // Show generic error if no specific error was shown
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('An unexpected error occurred while saving', 'error');
      }
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle update project status with three options
  const handleUpdateProjectStatus = useCallback(async (newStatus) => {
    if (currentProjectId && sessionUser) {
      try {
        // Get current project data first
        const project = await apiService.getProject(currentProjectId);
        if (project) {
          // Update project status
          await apiService.updateProject(currentProjectId, {
            ...project,
            status: newStatus
          });
          
          const statusMessages = {
            'draft': 'Project marked as draft!',
            'approved': 'Project marked as approved!',
            'denied': 'Project marked as denied!',
            'conditional': 'Project marked as conditional!'
          };
          

          alert(statusMessages[newStatus] || 'Project status updated!');
          // Navigate back to home page
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Failed to update project status:', error);
        alert('Failed to update project status. Please try again.');
      }
    }
  }, [currentProjectId, sessionUser]);

  return {
    // State
    lroForms,
    isLoadingLroForms,
    isExporting,
    isSaving,
    
    // Actions
    loadLroForms,
    handleLroFormSelect,
    handleExportPdf,
    handleSaveProject,
    handleUpdateProjectStatus
  };
};