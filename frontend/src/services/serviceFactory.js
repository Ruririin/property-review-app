/**
 * Service Factory - Switches between real and demo services
 * Controls which implementation to use based on demo mode
 */

import { DEMO_CONFIG } from '../config/demoConfig.js';

// Real services
import realApiService from './apiService.js';
import realProjectSaveService from './projectSaveService.js';
import * as realIsoCodeService from './isoCodeService.js';

// Demo services
import demoApiService from './demoApiService.js';
import demoProjectSaveService from './demoProjectSaveService.js';
import * as demoIsoCodeService from './demoIsoCodeService.js';

// Hooks
import { useImageHandler } from '../hooks/useImageHandler.js';
import { useDemoImageHandler } from '../hooks/useDemoImageHandler.js';

class ServiceFactory {
  constructor() {
    this.isDemoMode = DEMO_CONFIG.DEMO_MODE;
    console.log(`🏭 Service Factory initialized - Mode: ${this.isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
  }

  // API Service
  getApiService() {
    return this.isDemoMode ? demoApiService : realApiService;
  }

  // Project Save Service
  getProjectSaveService() {
    return this.isDemoMode ? demoProjectSaveService : realProjectSaveService;
  }

  // ISO Code Service
  getIsoCodeService() {
    return this.isDemoMode ? demoIsoCodeService : realIsoCodeService;
  }

  // Image Handler Hook
  getImageHandlerHook() {
    return this.isDemoMode ? useDemoImageHandler : useImageHandler;
  }

  // Check if demo mode is active
  isDemoModeActive() {
    return this.isDemoMode;
  }

  // Force switch to demo mode (for testing)
  switchToDemoMode() {
    this.isDemoMode = true;
    console.log('🎭 Switched to DEMO mode');
  }

  // Force switch to production mode (for testing)
  switchToProductionMode() {
    this.isDemoMode = false;
    console.log('🏭 Switched to PRODUCTION mode');
  }

  // Get service status
  getServiceStatus() {
    return {
      mode: this.isDemoMode ? 'DEMO' : 'PRODUCTION',
      apiService: this.isDemoMode ? 'Demo Mock API' : 'Real API',
      projectService: this.isDemoMode ? 'Memory Storage' : 'Database/localStorage',
      isoCodeService: this.isDemoMode ? 'Mock ISO Codes' : 'Real ISO Service',
      dataSafety: this.isDemoMode ? 'Safe - No real data' : 'Real data - Use with caution'
    };
  }
}

// Create singleton instance
const serviceFactory = new ServiceFactory();

// Export the factory and convenience methods
export default serviceFactory;

// Convenience exports for direct service access
export const apiService = serviceFactory.getApiService();
export const projectSaveService = serviceFactory.getProjectSaveService();
export const isoCodeService = serviceFactory.getIsoCodeService();
export const useImageHandlerHook = serviceFactory.getImageHandlerHook();

// Re-export ISO service functions for backward compatibility
export const { loadIsoCodes, findBestMatch, findSimilarMatches } = serviceFactory.getIsoCodeService();