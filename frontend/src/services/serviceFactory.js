/**
 * Service Factory - Production services only
 */

// Services
import apiService from './apiService.js';
import projectSaveService from './projectSaveService.js';
import * as isoCodeService from './isoCodeService.js';

// Hooks
import { useImageHandler } from '../hooks/useImageHandler.js';

// Direct exports for services
export { apiService, projectSaveService, isoCodeService };
export const useImageHandlerHook = useImageHandler;

// Re-export ISO service functions for backward compatibility
export const { loadIsoCodes, findBestMatch, findSimilarMatches } = isoCodeService;

// Default export for compatibility
export default {
  getApiService: () => apiService,
  getProjectSaveService: () => projectSaveService,
  getIsoCodeService: () => isoCodeService,
  getImageHandlerHook: () => useImageHandler,
  isDemoModeActive: () => false,
  getServiceStatus: () => ({
    mode: 'PRODUCTION',
    apiService: 'Real API',
    projectService: 'Database/localStorage',
    isoCodeService: 'Real ISO Service',
    dataSafety: 'Real data - Use with caution'
  })
};