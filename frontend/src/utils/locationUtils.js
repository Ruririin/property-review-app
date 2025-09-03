/**
 * Location Utilities
 * Helper functions for parsing and handling multiple locations
 */

/**
 * Parse multiple locations from a single string
 * Handles various separators and formats
 */
export const parseMultipleLocations = (locationString) => {
  if (!locationString || typeof locationString !== 'string') {
    return [];
  }

  // Common separators for multiple locations
  const separators = ['\n', '|', ';', ' and ', ' & ', ', and ', ', & '];
  
  let locations = [locationString]; // Start with the full string
  
  // Try each separator
  for (const separator of separators) {
    if (locationString.includes(separator)) {
      locations = locationString.split(separator);
      break;
    }
  }
  
  // Clean up locations - remove empty strings and trim whitespace
  return locations
    .map(loc => loc.trim())
    .filter(loc => loc.length > 0);
};

/**
 * Format locations for display
 */
export const formatLocationsForDisplay = (locations) => {
  if (!Array.isArray(locations) || locations.length === 0) {
    return 'No locations';
  }
  
  if (locations.length === 1) {
    return locations[0];
  }
  
  return locations.map((loc, index) => `${index + 1}. ${loc}`).join('\n');
};

/**
 * Get location for current slide context
 */
export const getLocationForSlide = (
  globalLocationData, 
  multipleLocationsMode, 
  selectedLocationIndex, 
  slides, 
  currentSlide
) => {
  if (!multipleLocationsMode || !globalLocationData.premiseLocation) {
    return globalLocationData.premiseLocation || '';
  }
  
  const locations = parseMultipleLocations(globalLocationData.premiseLocation);
  const currentSlideInfo = slides.find(s => s.id === currentSlide);
  
  if (locations.length > 1) {
    if (currentSlideInfo && typeof currentSlideInfo.locationIndex === 'number') {
      return locations[currentSlideInfo.locationIndex] || locations[0];
    } else {
      return locations[selectedLocationIndex] || locations[0];
    }
  }
  
  return locations[0] || globalLocationData.premiseLocation;
};

/**
 * Validate location string
 */
export const validateLocation = (locationString) => {
  if (!locationString || typeof locationString !== 'string') {
    return { valid: false, error: 'Location must be a non-empty string' };
  }
  
  const trimmed = locationString.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Location cannot be empty' };
  }
  
  if (trimmed.length < 5) {
    return { valid: false, error: 'Location must be at least 5 characters long' };
  }
  
  return { valid: true };
};

/**
 * Encode location for URL (maps, etc.)
 */
export const encodeLocationForUrl = (location) => {
  if (!location || typeof location !== 'string') {
    return '';
  }
  
  return encodeURIComponent(location.trim());
};

/**
 * Extract city/state from full address
 */
export const extractCityState = (fullAddress) => {
  if (!fullAddress) return '';
  
  // Try to match common address patterns
  const patterns = [
    /,\s*([^,]+),\s*([A-Z]{2})\s*\d{5}/, // City, ST 12345
    /,\s*([^,]+),\s*([A-Z]{2})/, // City, ST
    /,\s*([^,]+)$/ // Just city at the end
  ];
  
  for (const pattern of patterns) {
    const match = fullAddress.match(pattern);
    if (match) {
      if (match[2]) {
        return `${match[1]}, ${match[2]}`; // City, State
      } else {
        return match[1]; // Just city
      }
    }
  }
  
  return fullAddress; // Return original if no pattern matches
};