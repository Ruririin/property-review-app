/**
 * Slide Preview Components - Phase 4 of Editor Refactoring
 * 
 * This module exports all slide preview related components and utilities
 * extracted from Editor.jsx to improve maintainability and reduce complexity.
 */

// Components
export { default as SlideRenderer } from './SlideRenderer';

// Utilities
export {
  slideComponents,
  normalizeSlideType,
  getSlideComponent,
  transformSlideType,
  createSlideObject,
  handleSlideTypeDeletion,
  getSlideData,
  isValidSlideType,
  getAvailableSlideTypes,
  slideTypeDisplayNames,
  getSlideTypeDisplayName
} from './SlideTypeHandlers';

export {
  createAddSlideHandler,
  createDeleteSlideHandler,
  createSlideNavigationUtils,
  createSlideFormDataManager,
  slideValidationUtils,
  slideOrderingUtils
} from './SlideManagementUtils';
