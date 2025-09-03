/**
 * Location-Aware Data Hook
 * Provides components with location-specific form data automatically
 */

import { useState, useEffect, useCallback } from 'react';
import locationDataService from '../services/locationDataService';

export function useLocationAwareData(
  globalFormData, 
  setGlobalFormData, 
  multipleLocationsMode, 
  selectedLocationIndex
) {
  const [locationFormData, setLocationFormData] = useState({});

  // Initialize location data when component mounts or location changes
  useEffect(() => {
    if (multipleLocationsMode) {
      const data = locationDataService.getLocationData(selectedLocationIndex);
      console.log(`🏢 Loading location data for index ${selectedLocationIndex}:`, data);
      setLocationFormData(data);
    } else {
      setLocationFormData(globalFormData || {});
    }
  }, [globalFormData, multipleLocationsMode, selectedLocationIndex]);

  // Location-aware form data getter
  const getFormValue = useCallback((field) => {
    const value = multipleLocationsMode 
      ? locationFormData[field] || ''
      : globalFormData?.[field] || '';
    
    return value;
  }, [globalFormData, locationFormData, multipleLocationsMode]);

  // Location-aware form data setter
  const setFormValue = useCallback((field, value) => {
    if (multipleLocationsMode) {
      // Update location-specific data
      const updatedData = locationDataService.updateLocationData(selectedLocationIndex, field, value);
      setLocationFormData(updatedData);
      
      // Also update global form data with all locations for saving
      const allLocationData = locationDataService.getAllLocationData();
      setGlobalFormData({
        ...globalFormData,
        ...allLocationData
      });
    } else {
      // Single location mode - update global data directly
      setGlobalFormData({
        ...globalFormData,
        [field]: value
      });
    }
  }, [globalFormData, setGlobalFormData, multipleLocationsMode, selectedLocationIndex]);

  // Batch update multiple fields
  const setFormValues = useCallback((updates) => {
    if (multipleLocationsMode) {
      let updatedData = locationDataService.getLocationData(selectedLocationIndex);
      
      Object.entries(updates).forEach(([field, value]) => {
        updatedData = locationDataService.updateLocationData(selectedLocationIndex, field, value);
      });
      
      setLocationFormData(updatedData);
      
      // Update global form data
      const allLocationData = locationDataService.getAllLocationData();
      setGlobalFormData({
        ...globalFormData,
        ...allLocationData
      });
    } else {
      setGlobalFormData({
        ...globalFormData,
        ...updates
      });
    }
  }, [globalFormData, setGlobalFormData, multipleLocationsMode, selectedLocationIndex]);

  // Get current location info
  const getCurrentLocation = useCallback(() => {
    if (!multipleLocationsMode) {
      return { index: 0, name: 'Single Location', isMultiple: false };
    }
    
    const locations = locationDataService.getLocationsArray();
    const currentLocation = locations[selectedLocationIndex] || locations[0];
    
    return {
      ...currentLocation,
      isMultiple: true,
      totalLocations: locations.length
    };
  }, [multipleLocationsMode, selectedLocationIndex]);

  return {
    // Form data methods
    getFormValue,
    setFormValue,
    setFormValues,
    
    // Current effective form data
    formData: multipleLocationsMode ? locationFormData : globalFormData,
    
    // Location info
    currentLocation: getCurrentLocation(),
    
    // Utility methods
    isMultipleLocations: multipleLocationsMode,
    currentLocationIndex: selectedLocationIndex
  };
}