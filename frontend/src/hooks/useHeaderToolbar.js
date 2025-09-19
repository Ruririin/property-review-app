/**
 * Header Toolbar Hook
 * Manages header toolbar state and actions
 */

import { useState, useCallback } from 'react';
import lroDataService from '../services/lroDataService';
import { exportToPDF } from '../utils/pdfExport';
import { projectSaveService } from '../services/serviceFactory';
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
      
      console.log('✅ LRO form loading completed');
      
    } catch (error) {
      console.error('Error selecting LRO form:', error);
    }
  }, []);

  // Handle PDF export
  const handleExportPdf = useCallback(async (slides, slideData, globalLocationData, callbacks = {}) => {
    const { syncPositionsToDom = () => {} } = callbacks;
    
    try {
      setIsExporting(true);
      
      // Sync all positions before export
      syncPositionsToDom();
      
      // Small delay to ensure DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await exportToPDF(slides, slideData, globalLocationData);
      
      // Record export in project service
      if (currentProjectId) {
        projectSaveService.recordPdfExport(currentProjectId);
      }
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, [currentProjectId]);

  // Handle project save
  const handleSaveProject = useCallback(async (saveFunction) => {
    try {
      setIsSaving(true);
      await saveFunction(false); // Manual save
    } catch (error) {
      console.error('Error saving project:', error);
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
            'approved': 'Project marked as approved!',
            'denied': 'Project marked as denied!',
            'conditional': 'Project marked as conditional!'
          };
          
          console.log(`✅ Project marked as ${newStatus}`);
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