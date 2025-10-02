import { useState } from 'react';

/**
 * Custom hook for managing core editor state
 */
export const useEditorState = () => {
  // Core slide state
  const [slides, setSlides] = useState([{ id: 1, type: 'cover', title: 'Cover Page' }]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [nextSlideId, setNextSlideId] = useState(2);

  // Multiple locations state
  const [multipleLocationsMode, setMultipleLocationsMode] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);

  // Track counts for slide types that allow multiples
  const [slideTypeCounts, setSlideTypeCounts] = useState({
    street_view: 0
  });

  // LRO form data
  const [lroForms, setLroForms] = useState([]);
  const [businessesAtLocation, setBusinessesAtLocation] = useState([]);

  // Slide data with default structure
  const [slideData, setSlideData] = useState({
    1: {
      formData: {
        insuredName: "",
        website: "",
        description: "",
        lineBusiness: "",
        websiteInfo: "",
      },
      imageData: null,
      imagePosition: { top: 300, left: 400 },
      drawings: [],
      fieldPositions: {
        insuredName: { top: 180, right: 124 },
        premiseLocation: { top: 310, right: 124 },
        website: { top: 370, right: 124 },
        description: { top: 430, right: 124 },
        lineBusiness: { top: 526, right: 124 },
        isoClass: { top: 490, right: 124 },
      }
    }
  });

  // Global location data shared across all slides
  const [globalLocationData, setGlobalLocationData] = useState({
    premiseLocation: "",
  });

  return {
    // Core slides
    slides,
    setSlides,
    currentSlide,
    setCurrentSlide,
    nextSlideId,
    setNextSlideId,

    // Multiple locations
    multipleLocationsMode,
    setMultipleLocationsMode,
    selectedLocationIndex,
    setSelectedLocationIndex,

    // Slide type counts
    slideTypeCounts,
    setSlideTypeCounts,

    // Form data
    lroForms,
    setLroForms,
    businessesAtLocation,
    setBusinessesAtLocation,

    // Slide and location data
    slideData,
    setSlideData,
    globalLocationData,
    setGlobalLocationData,
  };
};