import { useCallback } from 'react';
import slideApiService from '../services/slideApiService';
import locationDataService from '../services/locationDataService';

export const useSlideManager = (
  slides,
  setSlides,
  slideData,
  setSlideData,
  globalLocationData,
  setGlobalLocationData,
  multipleLocationsMode,
  selectedLocationIndex,
  slideTypeCounts,
  setSlideTypeCounts,
  nextSlideId,
  setNextSlideId,
  currentSlide,
  setCurrentSlide,
  fieldPositions,
  setFieldPositions,
  sessionUser,
  currentProjectId,
  setIsProjectModified
) => {

  // Get slide data with location-specific handling
  const getSlideData = useCallback((slideId) => {
    const defaultFormData = {
      insuredName: "",
      website: "",
      description: "",
      lineBusiness: "",
      websiteInfo: "",
      premiseLocation: "",
      lroFormId: "",
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessWebsite: "",
      businessHours: "",
      businessRating: "",
      businessReviews: "",
      businessCategory: "",
      businessDescription: "",
      businessPhotos: []
    };

    const slide = slideData[slideId];

    if (!slide) {
      return {
        formData: { ...defaultFormData, ...globalLocationData },
        imageData: null,
        imagePosition: { top: 300, left: 400 },
        drawings: [],
        fieldPositions: {}
      };
    }

    // Handle multiple locations mode
    if (multipleLocationsMode) {
      let slideLocationIndex;

      if (slide.locationIndex !== undefined) {
        slideLocationIndex = slide.locationIndex;
      } else {
        // Calculate based on slide order for backward compatibility
        const slideIndex = slides.findIndex(s => s.id === slideId);
        slideLocationIndex = Math.max(0, slideIndex - 1); // Subtract 1 because cover slide doesn't have location
      }

      const locationData = locationDataService.getLocationByIndex(slideLocationIndex);
      if (locationData) {
        return {
          ...slide,
          formData: {
            ...defaultFormData,
            ...globalLocationData, // Global data first
            ...locationData, // Location-specific data overrides
            ...slide.formData // Slide-specific overrides
          }
        };
      } else {
        // Use global data as fallback
        return {
          ...slide,
          formData: {
            ...defaultFormData,
            ...globalLocationData,
            ...slide.formData
          }
        };
      }
    }

    // Single location mode - use global location data
    return {
      ...slide,
      formData: {
        ...defaultFormData,
        ...globalLocationData,
        ...slide.formData
      }
    };
  }, [slideData, globalLocationData, multipleLocationsMode, slides]);

  // Update slide data
  const updateSlideData = useCallback((slideId, newData) => {
    setSlideData(prevSlideData => ({
      ...prevSlideData,
      [slideId]: {
        ...prevSlideData[slideId],
        ...newData
      }
    }));
    setIsProjectModified(true);
  }, [setSlideData, setIsProjectModified]);

  // Update field positions
  const updateFieldPositions = useCallback((slideId, newPositions) => {
    setFieldPositions(prevPositions => ({
      ...prevPositions,
      [slideId]: {
        ...prevPositions[slideId],
        ...newPositions
      }
    }));
    setIsProjectModified(true);
  }, [setFieldPositions, setIsProjectModified]);

  // Update slide form data
  const updateSlideFormData = useCallback((slideId, formUpdates) => {
    setSlideData(prevSlideData => ({
      ...prevSlideData,
      [slideId]: {
        ...prevSlideData[slideId],
        formData: {
          ...prevSlideData[slideId]?.formData,
          ...formUpdates
        }
      }
    }));

    // Also update globalLocationData if this affects global fields
    const globalFields = ['insuredName', 'website', 'description', 'lineBusiness', 'premiseLocation'];
    const globalUpdates = {};
    let hasGlobalUpdates = false;

    Object.keys(formUpdates).forEach(key => {
      if (globalFields.includes(key)) {
        globalUpdates[key] = formUpdates[key];
        hasGlobalUpdates = true;
      }
    });

    if (hasGlobalUpdates) {
      setGlobalLocationData(prev => ({
        ...prev,
        ...globalUpdates
      }));
    }

    setIsProjectModified(true);
  }, [setSlideData, setGlobalLocationData, setIsProjectModified]);

  // Add new slide
  const addSlide = useCallback((slideTypeOrFormData = {}) => {
    const newSlideId = nextSlideId;

    // Determine location index for multiple locations mode
    let locationIndex = 0;
    if (multipleLocationsMode) {
      locationIndex = selectedLocationIndex;
    }

    // Handle slide type determination
    let slideType = 'aerial_view_-_google'; // default
    let initialFormData = {};
    
    if (typeof slideTypeOrFormData === 'string') {
      // Map dropdown option to slide type
      const slideTypeMap = {
        'Aerial View - Google': 'aerial_view_-_google',
        'Aerial View - Bing': 'aerial_view_-_bing', 
        'Street View': 'street_view_1',
        'Interior': 'interior',
        'Online Presence': 'online_presence',
        'License': 'license',
        'Comments': 'comments',
        'Fire Hazard': 'fire_hazard',
        'Crime Rate': 'crime_rate',
        'Nearest Fire Station': 'nearest_fire_station',
        'Website': 'website',
        'Ratings': 'ratings'
      };
      slideType = slideTypeMap[slideTypeOrFormData] || slideTypeOrFormData.toLowerCase().replace(/\s+/g, '_');
    } else if (typeof slideTypeOrFormData === 'object') {
      initialFormData = slideTypeOrFormData;
    }

    const newSlide = {
      id: newSlideId,
      type: slideType,
      title: typeof slideTypeOrFormData === 'string' ? slideTypeOrFormData : `Slide ${newSlideId}`,
      locationIndex: multipleLocationsMode ? locationIndex : undefined
    };

    const newSlideData = {
      formData: {
        insuredName: globalLocationData.insuredName || "",
        website: globalLocationData.website || "",
        description: globalLocationData.description || "",
        lineBusiness: globalLocationData.lineBusiness || "",
        websiteInfo: globalLocationData.websiteInfo || "",
        premiseLocation: globalLocationData.premiseLocation || "",
        ...initialFormData
      },
      imageData: null,
      imagePosition: { top: 300, left: 400 },
      drawings: [],
      fieldPositions: {}
    };

    // Add slide to slides array
    setSlides(prevSlides => [...prevSlides, newSlide]);

    // Add slide data
    setSlideData(prevSlideData => ({
      ...prevSlideData,
      [newSlideId]: newSlideData
    }));

    // Update next slide ID
    setNextSlideId(newSlideId + 1);

    // Navigate to new slide
    setCurrentSlide(newSlideId);

    setIsProjectModified(true);
    return newSlideId;
  }, [
    nextSlideId,
    multipleLocationsMode,
    selectedLocationIndex,
    globalLocationData,
    setSlides,
    setSlideData,
    setNextSlideId,
    setCurrentSlide,
    setIsProjectModified
  ]);

  // Delete slide
  const deleteSlide = useCallback((slideIdToDelete) => {
    if (slides.length <= 1) {
      return; // Don't delete if it's the last slide
    }

    // Remove from slides array
    setSlides(prevSlides => prevSlides.filter(slide => slide.id !== slideIdToDelete));

    // Remove from slide data
    setSlideData(prevSlideData => {
      const newSlideData = { ...prevSlideData };
      delete newSlideData[slideIdToDelete];
      return newSlideData;
    });

    // Remove from field positions
    setFieldPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      delete newPositions[slideIdToDelete];
      return newPositions;
    });

    // If we're deleting the current slide, navigate to the first slide
    if (currentSlide === slideIdToDelete) {
      setCurrentSlide(slides[0]?.id || 1);
    }

    setIsProjectModified(true);
  }, [slides, setSlides, setSlideData, setFieldPositions, currentSlide, setCurrentSlide, setIsProjectModified]);

  // Navigate to slide
  const navigateToSlide = useCallback((slideId) => {
    setCurrentSlide(slideId);
  }, [setCurrentSlide]);

  // Get next slide ID
  const getNextSlideId = useCallback(() => {
    return nextSlideId;
  }, [nextSlideId]);

  // Get slide by ID
  const getSlideById = useCallback((slideId) => {
    return slides.find(slide => slide.id === slideId);
  }, [slides]);

  // Update slide type and handle type-specific counting
  const updateSlideType = useCallback((slideId, newType) => {
    // Update the slide type in the slides array
    setSlides(prevSlides => prevSlides.map(slide =>
      slide.id === slideId ? { ...slide, type: newType } : slide
    ));

    // Update type counts
    if (newType === 'street_view') {
      setSlideTypeCounts(prev => ({
        ...prev,
        street_view: prev.street_view + 1
      }));
    }

    setIsProjectModified(true);
  }, [setSlides, setSlideTypeCounts, setIsProjectModified]);

  // Get slides of specific type
  const getSlidesByType = useCallback((type) => {
    return slides.filter(slide => slide.type === type);
  }, [slides]);

  // Duplicate slide
  const duplicateSlide = useCallback((slideId) => {
    const slideToClone = getSlideById(slideId);
    const slideDataToClone = getSlideData(slideId);

    if (!slideToClone || !slideDataToClone) return null;

    const newSlideId = addSlide(slideDataToClone.formData);

    // Copy additional properties
    updateSlideData(newSlideId, {
      imageData: slideDataToClone.imageData,
      imagePosition: slideDataToClone.imagePosition,
      drawings: [...(slideDataToClone.drawings || [])]
    });

    // Copy field positions
    if (fieldPositions[slideId]) {
      updateFieldPositions(newSlideId, fieldPositions[slideId]);
    }

    return newSlideId;
  }, [getSlideById, getSlideData, addSlide, updateSlideData, updateFieldPositions, fieldPositions]);

  return {
    // Core slide data functions
    getSlideData,
    updateSlideData,
    updateFieldPositions,
    updateSlideFormData,

    // Slide management functions
    addSlide,
    deleteSlide,
    duplicateSlide,
    navigateToSlide,
    updateSlideType,

    // Utility functions
    getNextSlideId,
    getSlideById,
    getSlidesByType
  };
};