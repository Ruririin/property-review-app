/**
 * Slide Type Handlers - Phase 4 of Editor Refactoring
 * 
 * This module contains slide type handling logic extracted from Editor.jsx
 * including slide component mapping, type normalization, and slide creation utilities.
 */

// Import all slide components
import SlideOne from "../../pages/slides/SlideOne";
import SlideTwo from "../../pages/slides/SlideTwo";
import SlideThree from "../../pages/slides/SlideThree";
import StreetView from "../../pages/slides/StreetView";
import Interior from "../../pages/slides/Interior";
import OnlinePresence from "../../pages/slides/OnlinePresence";
import Inspection from "../../pages/slides/Inspection";
import Comments from "../../pages/slides/Comments";
import FireHazard from "../../pages/slides/FireHazard";
import CrimeRate from "../../pages/slides/CrimeRate";
import NearestFireStation from "../../pages/slides/NearestFireStation";
import Website from "../../pages/slides/Website";
import Ratings from "../../pages/slides/Ratings";

// Slide component mapping
export const slideComponents = {
  cover: SlideOne,
  'slide-2': SlideTwo,
  'slide-3': SlideThree,
  street_view: StreetView,
  interior: Interior,
  online_presence: OnlinePresence,
  inspection: Inspection,
  comments: Comments,
  fire_hazard: FireHazard,
  crime_rate: CrimeRate,
  nearest_fire_station: NearestFireStation,
  website: Website,
  ratings: Ratings
};

// Normalize slide type for dynamic types (e.g., street_view_1, street_view_2 -> street_view)
export const normalizeSlideType = (slideType) => {
  if (!slideType) return null;
  
  if (slideType.startsWith('street_view_')) {
    return 'street_view';
  }
  
  return slideType;
};

export const getSlideComponent = (slideType, fallbackComponent = SlideOne) => {
  const normalizedType = normalizeSlideType(slideType);
  return slideComponents[normalizedType] || fallbackComponent;
};

// Slide type transformation utilities
export const transformSlideType = (slideType, slideTypeCounts) => {
  const slideTypeKey = slideType.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  
  let actualSlideType = slideTypeKey;
  let slideTitle = slideType;
  let updatedCounts = { ...slideTypeCounts };
  
  if (slideTypeKey === 'street_view') {
    const newCount = slideTypeCounts.street_view + 1;
    slideTitle = `Street View ${newCount}`;
    actualSlideType = `street_view_${newCount}`;
    
    updatedCounts = {
      ...slideTypeCounts,
      street_view: newCount
    };
  } else if (slideType === 'Aerial View - Google') {
    actualSlideType = 'slide-2';
    slideTitle = 'Google Aerial View';
  } else if (slideType === 'Aerial View - Bing') {
    actualSlideType = 'slide-3';
    slideTitle = 'Bing Aerial View';
  }
  
  return {
    actualSlideType,
    slideTitle,
    updatedCounts
  };
};

export const createSlideObject = (slideId, slideType, slideTitle, locationIndex = 0) => {
  return {
    id: slideId,
    type: slideType,
    title: slideTitle,
    locationIndex: locationIndex
  };
};

// Slide deletion utilities
export const handleSlideTypeDeletion = (slideToDelete, slideTypeCounts) => {
  let updatedCounts = { ...slideTypeCounts };
  
  if (slideToDelete && slideToDelete.type.startsWith('street_view')) {
    updatedCounts = {
      ...slideTypeCounts,
      street_view: Math.max(0, slideTypeCounts.street_view - 1)
    };
  }
  
  return updatedCounts;
};

export const getSlideData = (slideData, slideId) => {
  return slideData[slideId] || { type: '', title: '', formData: {}, drawings: [] };
};

export const isValidSlideType = (slideType) => {
  const normalizedType = normalizeSlideType(slideType);
  return normalizedType && slideComponents.hasOwnProperty(normalizedType);
};

export const getAvailableSlideTypes = () => {
  return Object.keys(slideComponents);
};

// Slide type display names mapping
export const slideTypeDisplayNames = {
  cover: 'Cover Slide',
  'slide-2': 'Google Aerial View',
  'slide-3': 'Bing Aerial View',
  street_view: 'Street View',
  interior: 'Interior',
  online_presence: 'Online Presence',
  inspection: 'Inspection',
  comments: 'Comments',
  fire_hazard: 'Fire Hazard',
  crime_rate: 'Crime Rate',
  nearest_fire_station: 'Nearest Fire Station',
  website: 'Website',
  ratings: 'Ratings'
};

export const getSlideTypeDisplayName = (slideType) => {
  const normalizedType = normalizeSlideType(slideType);
  return slideTypeDisplayNames[normalizedType] || slideType;
};
