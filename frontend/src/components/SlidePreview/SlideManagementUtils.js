/**
 * Slide Management Utilities - Phase 4 of Editor Refactoring
 * 
 * This module contains slide management logic extracted from Editor.jsx
 * including slide creation, deletion, and state management utilities.
 */

import { transformSlideType, createSlideObject, handleSlideTypeDeletion } from './SlideTypeHandlers';

// Add slide function
export const createAddSlideHandler = (
  slides,
  nextSlideId,
  slideTypeCounts,
  selectedLocationIndex,
  multipleLocationsMode,
  setSlides,
  setCurrentSlide,
  setNextSlideId,
  setSlideTypeCounts,
  setShowPopupDropdown
) => {
  return (slideType) => {
    const { actualSlideType, slideTitle, updatedCounts } = transformSlideType(slideType, slideTypeCounts);
    
    // Update slide type counts
    setSlideTypeCounts(updatedCounts);
    
    // Create new slide
    const newSlide = createSlideObject(
      nextSlideId,
      actualSlideType,
      slideTitle,
      multipleLocationsMode ? selectedLocationIndex : 0
    );

    // Add slide and switch to it
    setSlides([...slides, newSlide]);
    setCurrentSlide(newSlide.id);
    setNextSlideId(nextSlideId + 1);
    setShowPopupDropdown(false);
  };
};

// Delete slide function
export const createDeleteSlideHandler = (
  slides,
  slideTypeCounts,
  setSlides,
  setCurrentSlide,
  setSlideTypeCounts,
  setSlideData = null
) => {
  return (slideId) => {
    if (slides.length <= 1) {
      console.warn('Cannot delete the last remaining slide');
      return;
    }

    const slideToDelete = slides.find(slide => slide.id === slideId);
    const updatedSlides = slides.filter(slide => slide.id !== slideId);
    
    // Update slide type counters
    const updatedCounts = handleSlideTypeDeletion(slideToDelete, slideTypeCounts);
    setSlideTypeCounts(updatedCounts);
    
    // Update slides array
    setSlides(updatedSlides);
    
    // Remove slide data if setter is provided
    if (setSlideData) {
      setSlideData(prev => {
        const newData = { ...prev };
        delete newData[slideId];
        return newData;
      });
    }
    
    // If we deleted the current slide, switch to another slide
    const currentSlideIndex = slides.findIndex(slide => slide.id === slideId);
    if (currentSlideIndex !== -1 && updatedSlides.length > 0) {
      // Switch to the first available slide
      setCurrentSlide(updatedSlides[0].id);
    }
  };
};

// Slide navigation utilities
export const createSlideNavigationUtils = (slides, currentSlide, setCurrentSlide) => {
  const getCurrentSlideIndex = () => {
    return slides.findIndex(slide => slide.id === currentSlide);
  };

  const goToNextSlide = () => {
    const currentIndex = getCurrentSlideIndex();
    if (currentIndex < slides.length - 1) {
      setCurrentSlide(slides[currentIndex + 1].id);
    }
  };

  const goToPreviousSlide = () => {
    const currentIndex = getCurrentSlideIndex();
    if (currentIndex > 0) {
      setCurrentSlide(slides[currentIndex - 1].id);
    }
  };

  const goToSlide = (slideId) => {
    const slideExists = slides.some(slide => slide.id === slideId);
    if (slideExists) {
      setCurrentSlide(slideId);
    }
  };

  const canGoNext = () => {
    const currentIndex = getCurrentSlideIndex();
    return currentIndex < slides.length - 1;
  };

  const canGoPrevious = () => {
    const currentIndex = getCurrentSlideIndex();
    return currentIndex > 0;
  };

  return {
    getCurrentSlideIndex,
    goToNextSlide,
    goToPreviousSlide,
    goToSlide,
    canGoNext,
    canGoPrevious
  };
};

// Form data management for slides
export const createSlideFormDataManager = (slideData, globalLocationData, setSlideData) => {
  const getSlideFormData = (slideId) => {
    const slideSpecificData = slideData[slideId]?.formData || {};
    
    return {
      // Global fields that should be shared across all slides
      insuredName: globalLocationData?.insuredName || '',
      premiseLocation: globalLocationData?.premiseLocation || '',
      website: globalLocationData?.website || '',
      // Slide-specific fields
      ...slideSpecificData,
      // Global fields override slide-specific ones for consistency
      insuredName: globalLocationData?.insuredName || '',
      premiseLocation: globalLocationData?.premiseLocation || '',
      website: globalLocationData?.website || '',
    };
  };

  const updateSlideFormData = (slideId, updates) => {
    console.log(`≡ƒô¥ Slide ${slideId} form update:`, updates);
    
    const currentSlideData = slideData[slideId] || {};
    const updatedSlideData = {
      ...currentSlideData,
      formData: {
        ...currentSlideData.formData,
        ...updates
      }
    };
    
    setSlideData({
      ...slideData,
      [slideId]: updatedSlideData
    });
  };

  return {
    getSlideFormData,
    updateSlideFormData
  };
};

// Slide validation utilities
export const slideValidationUtils = {
  isValidSlide: (slide) => {
    return slide && slide.id !== undefined && slide.type && slide.title;
  },

  hasRequiredData: (slideData, slideId) => {
    const data = slideData[slideId];
    return data && data.type;
  },

  validateSlideArray: (slides) => {
    return Array.isArray(slides) && slides.length > 0 && slides.every(slideValidationUtils.isValidSlide);
  }
};

// Slide ordering utilities
export const slideOrderingUtils = {
  moveSlideUp: (slides, slideId, setSlides) => {
    const currentIndex = slides.findIndex(slide => slide.id === slideId);
    if (currentIndex > 0) {
      const newSlides = [...slides];
      [newSlides[currentIndex - 1], newSlides[currentIndex]] = [newSlides[currentIndex], newSlides[currentIndex - 1]];
      setSlides(newSlides);
    }
  },

  moveSlideDown: (slides, slideId, setSlides) => {
    const currentIndex = slides.findIndex(slide => slide.id === slideId);
    if (currentIndex < slides.length - 1) {
      const newSlides = [...slides];
      [newSlides[currentIndex], newSlides[currentIndex + 1]] = [newSlides[currentIndex + 1], newSlides[currentIndex]];
      setSlides(newSlides);
    }
  },

  canMoveUp: (slides, slideId) => {
    const currentIndex = slides.findIndex(slide => slide.id === slideId);
    return currentIndex > 0;
  },

  canMoveDown: (slides, slideId) => {
    const currentIndex = slides.findIndex(slide => slide.id === slideId);
    return currentIndex < slides.length - 1;
  }
};
