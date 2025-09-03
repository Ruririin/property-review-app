/**
 * Slides Bar Hook
 * Manages slides bar state and slide operations
 */

import { useState, useCallback } from 'react';

export const useSlidesBar = () => {
  const [showSlidesBar, setShowSlidesBar] = useState(true);

  // Handle slide selection
  const handleSlideSelect = useCallback((slideId, setCurrentSlide) => {
    setCurrentSlide(slideId);
    console.log('📍 Switched to slide:', slideId);
  }, []);

  // Handle slide deletion
  const handleSlideDelete = useCallback((slideId, slides, setSlides, currentSlide, setCurrentSlide, setSlideData) => {
    if (slides.length <= 1) {
      console.warn('Cannot delete the last slide');
      return;
    }

    // Remove from slides array
    const updatedSlides = slides.filter(slide => slide.id !== slideId);
    setSlides(updatedSlides);
    
    // Remove slide data
    setSlideData(prev => {
      const newSlideData = { ...prev };
      delete newSlideData[slideId];
      return newSlideData;
    });
    
    // If we deleted the current slide, switch to the first available slide
    if (currentSlide === slideId) {
      const newCurrentSlide = updatedSlides[0]?.id || 1;
      setCurrentSlide(newCurrentSlide);
    }
    
    console.log('🗑️ Deleted slide:', slideId);
  }, []);

  // Handle add slide
  const handleAddSlide = useCallback((slides, setSlides, slideTypes = []) => {
    // Define available slide types
    const defaultSlideTypes = [
      { id: 'aerial_view_-_google', title: 'Aerial View - Google', type: 'aerial_view_-_google' },
      { id: 'aerial_view_-_bing', title: 'Aerial View - Bing', type: 'aerial_view_-_bing' },
      { id: 'street_view', title: 'Street View', type: 'street_view' },
      { id: 'interior', title: 'Interior', type: 'interior' },
      { id: 'website', title: 'Website', type: 'website' },
      { id: 'online_presence', title: 'Online Presence', type: 'online_presence' },
      { id: 'ratings', title: 'Ratings', type: 'ratings' },
      { id: 'crime_rate', title: 'Crime Rate', type: 'crime_rate' },
      { id: 'fire_hazard', title: 'Fire Hazard', type: 'fire_hazard' },
      { id: 'nearest_fire_station', title: 'Nearest Fire Station', type: 'nearest_fire_station' },
      { id: 'comments', title: 'Comments', type: 'comments' }
    ];

    const availableTypes = slideTypes.length > 0 ? slideTypes : defaultSlideTypes;
    
    // Find the first available slide type that hasn't been used
    const usedTypes = slides.map(slide => slide.type);
    const availableType = availableTypes.find(type => !usedTypes.includes(type.type));
    
    if (!availableType) {
      // If all types are used, create a generic slide
      const newSlideId = Math.max(...slides.map(s => s.id)) + 1;
      const newSlide = {
        id: newSlideId,
        title: `Slide ${newSlideId}`,
        type: 'generic'
      };
      
      setSlides(prev => [...prev, newSlide]);
      console.log('➕ Added generic slide:', newSlide);
      return newSlide;
    }
    
    // Create new slide with the available type
    const newSlideId = Math.max(...slides.map(s => s.id)) + 1;
    const newSlide = {
      id: newSlideId,
      title: availableType.title,
      type: availableType.type
    };
    
    setSlides(prev => [...prev, newSlide]);
    console.log('➕ Added slide:', newSlide);
    return newSlide;
  }, []);

  // Get slide type display name
  const getSlideTypeDisplayName = useCallback((type) => {
    const typeMap = {
      'aerial_view_-_google': 'Aerial - Google',
      'aerial_view_-_bing': 'Aerial - Bing',
      'street_view': 'Street View',
      'interior': 'Interior',
      'website': 'Website',
      'online_presence': 'Online Presence',
      'ratings': 'Ratings',
      'crime_rate': 'Crime Rate',
      'fire_hazard': 'Fire Hazard',
      'nearest_fire_station': 'Fire Station',
      'comments': 'Comments',
      'property_info': 'Property Info',
      'generic': 'Generic'
    };
    
    return typeMap[type] || type;
  }, []);

  return {
    // State
    showSlidesBar,
    setShowSlidesBar,
    
    // Actions
    handleSlideSelect,
    handleSlideDelete,
    handleAddSlide,
    getSlideTypeDisplayName
  };
};