import { useState, useCallback } from 'react';
import apiService from '../services/apiService';

export const useHeaderToolbarSimple = (sessionUser, currentProjectId) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lroForms, setLroForms] = useState([]);
  const [isLoadingLroForms, setIsLoadingLroForms] = useState(false);
  const [lroSearchTerm, setLroSearchTerm] = useState('');

  const loadLroForms = useCallback(async () => {
    try {
      setIsLoadingLroForms(true);
      console.log('📋 Loading LRO forms...');

      // Load actual LRO forms from the forms database
      const lroDataService = (await import('../services/lroDataService')).default;
      const forms = await lroDataService.getAllForms();
      console.log('✅ Loaded LRO forms:', forms);
      setLroForms(forms || []);
    } catch (error) {
      console.error('❌ Failed to load LRO forms:', error);
      setLroForms([]);
    } finally {
      setIsLoadingLroForms(false);
    }
  }, []);

  const handleSaveProject = useCallback(async (saveFunction) => {
    console.log('🚀 HEADER TOOLBAR SAVE CALLED:', { saveFunction: !!saveFunction });
    
    if (!saveFunction) {
      console.error('❌ No save function provided to handleSaveProject');
      return;
    }

    try {
      setIsSaving(true);
      console.log('💾 Calling saveFunction...');
      const result = await saveFunction();
      console.log('✅ Project saved via header toolbar, result:', result);
    } catch (error) {
      console.error('❌ Failed to save project:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleExportPdf = useCallback(async (slides, slideData, globalLocationData, options = {}) => {
    try {
      setIsExporting(true);
      console.log('📄 Exporting PDF...');

      // Import the PDF export utility and exported items service
      const { exportAllSlidesToPDF } = await import('../utils/newPdfExport');
      const exportedItemsService = (await import('../services/exportedItemsService')).default;

      // Call the actual PDF export function
      const result = await exportAllSlidesToPDF(slides, slideData, globalLocationData, sessionUser);

      // Add the exported item to the tracking system
      if (result && result.success) {
        const projectTitle = globalLocationData?.insuredName ? 
          `Property Review - ${globalLocationData.insuredName}` : 
          `Property Review ${new Date().toLocaleDateString()}`;
          
        exportedItemsService.addExportedItem({
          projectId: currentProjectId,
          projectTitle: projectTitle,
          slideCount: slides?.length || 0,
          exportedBy: sessionUser?.username || sessionUser?.email || 'Unknown User',
          filename: result.filename || `${projectTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`
        });
        
        console.log('📋 Added exported item to tracking system');
      }

      console.log('✅ PDF export completed');
    } catch (error) {
      console.error('❌ Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [sessionUser, currentProjectId]);

  const handleUpdateProjectStatus = useCallback(async (status) => {
    try {
      console.log('📊 Updating project status to:', status);

      if (currentProjectId) {
        // Update project status via API
        await apiService.updateProject(currentProjectId, { status });
        console.log('✅ Project status updated to:', status);
      }
    } catch (error) {
      console.error('❌ Failed to update project status:', error);
      alert('Failed to update project status. Please try again.');
    }
  }, [currentProjectId]);

  const handleLroFormSelect = useCallback(async (formId, context) => {
    console.log('📋 LRO form selected:', formId);
    console.log('📋 Context received:', context);
    
    try {
      // Load the actual LRO form data
      const lroDataService = (await import('../services/lroDataService')).default;
      const formData = await lroDataService.getFormDataForPropertyReview(formId);
      console.log('📋 LRO form data loaded:', formData);
      
      // Prepare the form data
      const lroFormData = {
        insuredName: formData.insuredName || '',
        premiseLocation: formData.premiseLocation || '',
        website: formData.website || '',
        description: formData.description || '',
        isoClass: formData.isoClass || '',
        lineBusiness: formData.lineBusiness || '',
        originalLroFormId: formId
      };
      
      // Update the slide data with the LRO form data
      if (context && context.updateSlideFormData) {
        console.log('📋 Calling updateSlideFormData for slide 1');
        context.updateSlideFormData(1, lroFormData);
        console.log('📋 Form data updated successfully');
      } else {
        console.warn('📋 No updateSlideFormData function in context');
      }
      
      // Also update global location data directly
      if (context && context.setGlobalLocationData) {
        console.log('📋 Updating global location data directly');
        context.setGlobalLocationData(lroFormData);
      }
      
      if (context && context.setCurrentFormId) {
        context.setCurrentFormId(formId);
      }
    } catch (error) {
      console.error('❌ Failed to load LRO form data:', error);
    }
  }, []);

  return {
    loadLroForms,
    handleSaveProject,
    handleExportPdf,
    handleUpdateProjectStatus,
    handleLroFormSelect,
    isSaving,
    isExporting,
    lroForms,
    isLoadingLroForms,
    lroSearchTerm,
    setLroSearchTerm
  };
};