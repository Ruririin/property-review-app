/**
 * Sidebar Toolbar Hook
 * Manages sidebar toolbar state and actions
 */

import { useState, useCallback } from 'react';
import { parseMultipleLocations } from '../utils/locationUtils';
import editorApiService from '../services/editorApiService';

export const useSidebarToolbar = () => {
  const [showToolbar, setShowToolbar] = useState(true);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Font size change handler with backend sync
  const handleFontSizeChange = useCallback(async (value, selectedField, setFontSizes, projectId, apiService) => {
    if (selectedField && value) {
      const newFontSize = parseInt(value);
      
      setFontSizes(prev => {
        const newFontSizes = {
          ...prev,
          [selectedField]: newFontSize
        };
        
        // Save to backend if we have project and API service
        if (projectId && apiService) {
          apiService.updateAppState(projectId, { fontSizes: newFontSizes })
            .catch(error => console.error('Failed to save font size:', error));
        }
        
        return newFontSizes;
      });
    }
  }, []);

  // Visit website handler
  const handleVisitWebsite = useCallback((websiteUrl) => {
    let url = websiteUrl;
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  }, []);

  // Open Google Maps (simplified with backend API)
  const handleOpenGoogleMaps = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Google Maps');
      return;
    }
    await editorApiService.openGoogleMaps(currentProjectId);
  }, []);

  // Open Bing Maps (simplified with backend API)
  const handleOpenBingMaps = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Bing Maps');
      return;
    }
    await editorApiService.openBingMaps(currentProjectId);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback((zoomLevel, setZoomLevel) => {
    if (zoomLevel < 200) {
      setZoomLevel(prev => Math.min(prev + 10, 200));
    }
  }, []);

  const handleZoomOut = useCallback((zoomLevel, setZoomLevel) => {
    if (zoomLevel > 50) {
      setZoomLevel(prev => Math.max(prev - 10, 50));
    }
  }, []);

  const handleResetZoom = useCallback((setZoomLevel) => {
    setZoomLevel(100);
  }, []);

  // Drawing mode
  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode(prev => !prev);
  }, []);

  // Clear drawings
  const handleClearDrawings = useCallback((currentSlide, setSlideData) => {
    setSlideData(prev => ({
      ...prev,
      [currentSlide]: {
        ...prev[currentSlide],
        drawings: []
      }
    }));
  }, []);

  // Toggle website field with backend sync
  const handleToggleWebsite = useCallback(async (showWebsite, setShowWebsite, projectId, apiService) => {
    try {
      const newShowWebsite = !showWebsite;
      setShowWebsite(newShowWebsite);
      
      // Save to backend if we have project and API service
      if (projectId && apiService) {
        await apiService.updateAppState(projectId, { showWebsite: newShowWebsite });
        console.log('🔄 Website visibility toggled:', newShowWebsite);
      }
    } catch (error) {
      console.error('Error toggling website:', error);
      // Revert on error
      setShowWebsite(showWebsite);
    }
  }, []);

  // Toggle multiple locations mode
  const handleToggleMultipleLocations = useCallback(async (currentProjectId, multipleLocationsMode, setMultipleLocationsMode, apiService) => {
    try {
      setMultipleLocationsMode(prev => !prev);
      
      // If we have a current project, sync with backend
      if (currentProjectId && apiService) {
        await apiService.toggleMultipleLocations(currentProjectId);
        console.log('🔄 Multiple locations mode toggled:', !multipleLocationsMode);
      }
    } catch (error) {
      console.error('Error toggling multiple locations:', error);
      // Revert on error
      setMultipleLocationsMode(multipleLocationsMode);
    }
  }, []);

  return {
    // State
    showToolbar,
    setShowToolbar,
    isDrawingMode,
    setIsDrawingMode,
    
    // Actions
    handleFontSizeChange,
    handleVisitWebsite,
    handleToggleWebsite,
    handleOpenGoogleMaps,
    handleOpenBingMaps,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    toggleDrawingMode,
    handleClearDrawings,
    handleToggleMultipleLocations
  };
};