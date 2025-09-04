/**
 * Editor Actions Hook
 * Provides backend-powered actions for Editor.jsx sidebar buttons
 * Reduces complexity by moving location-based logic to backend services
 */

import { useCallback } from 'react';
import editorApiService from '../services/editorApiService';

export const useEditorActions = () => {

  // Google Maps action
  const handleOpenGoogleMaps = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Google Maps');
      return;
    }
    await editorApiService.openGoogleMaps(currentProjectId);
  }, []);

  // Bing Maps action
  const handleOpenBingMaps = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Bing Maps');
      return;
    }
    await editorApiService.openBingMaps(currentProjectId);
  }, []);

  // Fire Hazard search action
  const handleFireHazard = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Fire Hazard search');
      return;
    }
    await editorApiService.openFireHazard(currentProjectId);
  }, []);

  // Fire Station search action
  const handleFireStation = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Fire Station search');
      return;
    }
    await editorApiService.openFireStation(currentProjectId);
  }, []);

  // Best Places search action
  const handleBestPlaces = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Best Places search');
      return;
    }
    await editorApiService.openBestPlaces(currentProjectId);
  }, []);

  // Business search action
  const handleFindBusiness = useCallback(async (currentProjectId) => {
    if (!currentProjectId) {
      console.warn('No project ID available for Business search');
      return;
    }
    await editorApiService.openBusinessSearch(currentProjectId);
  }, []);

  return {
    handleOpenGoogleMaps,
    handleOpenBingMaps,
    handleFireHazard,
    handleFireStation,
    handleBestPlaces,
    handleFindBusiness
  };
};