/**
 * Sidebar Toolbar Hook
 * Manages sidebar toolbar state and actions
 */

import { useState, useCallback } from 'react';
import { parseMultipleLocations } from '../utils/locationUtils';

export const useSidebarToolbar = () => {
  const [showToolbar, setShowToolbar] = useState(true);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Font size change handler
  const handleFontSizeChange = useCallback((value, selectedField, setFontSizes) => {
    if (selectedField && value) {
      setFontSizes(prev => ({
        ...prev,
        [selectedField]: parseInt(value)
      }));
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

  // Open Google Maps
  const handleOpenGoogleMaps = useCallback((globalLocationData, multipleLocationsMode, selectedLocationIndex, slides, currentSlide) => {
    let location = '';
    
    if (multipleLocationsMode && globalLocationData.premiseLocation) {
      const locations = parseMultipleLocations(globalLocationData.premiseLocation);
      const currentSlideInfo = slides.find(s => s.id === currentSlide);
      
      if (locations.length > 1) {
        if (currentSlideInfo && typeof currentSlideInfo.locationIndex === 'number') {
          location = locations[currentSlideInfo.locationIndex] || locations[0];
        } else {
          location = locations[selectedLocationIndex] || locations[0];
        }
      } else {
        location = locations[0] || globalLocationData.premiseLocation;
      }
    } else {
      location = globalLocationData.premiseLocation || '';
    }
    
    if (location.trim()) {
      const encodedLocation = encodeURIComponent(location.trim());
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    } else {
      console.warn('No location available for Google Maps');
    }
  }, []);

  // Open Bing Maps
  const handleOpenBingMaps = useCallback((globalLocationData, multipleLocationsMode, selectedLocationIndex, slides, currentSlide) => {
    let location = '';
    
    if (multipleLocationsMode && globalLocationData.premiseLocation) {
      const locations = parseMultipleLocations(globalLocationData.premiseLocation);
      const currentSlideInfo = slides.find(s => s.id === currentSlide);
      
      if (locations.length > 1) {
        if (currentSlideInfo && typeof currentSlideInfo.locationIndex === 'number') {
          location = locations[currentSlideInfo.locationIndex] || locations[0];
        } else {
          location = locations[selectedLocationIndex] || locations[0];
        }
      } else {
        location = locations[0] || globalLocationData.premiseLocation;
      }
    } else {
      location = globalLocationData.premiseLocation || '';
    }
    
    if (location.trim()) {
      const encodedLocation = encodeURIComponent(location.trim());
      window.open(`https://www.bing.com/maps?q=${encodedLocation}`, '_blank');
    } else {
      console.warn('No location available for Bing Maps');
    }
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