// Utility functions for generating map embed URLs

/**
 * Generate Google Maps embed URL for satellite view
 * @param {string} location - The address or location to display
 * @returns {string} - Google Maps embed URL
 */
export const generateGoogleMapsEmbedUrl = (location) => {
  if (!location || location.trim() === '') {
    return null;
  }
  
  const encodedLocation = encodeURIComponent(location.trim());
  // Using Google Maps Embed API with satellite view
  return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedLocation}&maptype=satellite&zoom=18`;
};

/**
 * Generate Bing Maps embed URL for aerial view
 * @param {string} location - The address or location to display
 * @returns {string} - Bing Maps embed URL
 */
export const generateBingMapsEmbedUrl = (location) => {
  if (!location || location.trim() === '') {
    return null;
  }
  
  const encodedLocation = encodeURIComponent(location.trim());
  // Simplified Bing Maps URL - remove problematic aerial view parameters
  return `https://www.bing.com/maps?where1=${encodedLocation}&FORM=LMLTCC`;
};

/**
 * Generate fallback Google Maps URL (no API key required)
 * @param {string} location - The address or location to display
 * @param {string} mapType - The map type ('satellite', 'hybrid', 'terrain', 'roadmap')
 * @returns {string} - Google Maps URL
 */
export const generateGoogleMapsFallbackUrl = (location, mapType = 'satellite') => {
  if (!location || location.trim() === '') {
    return null;
  }
  
  const encodedLocation = encodeURIComponent(location.trim());
  
  // Map type conversion for Google Maps URL parameter
  const typeMap = {
    'satellite': 'k',    // Satellite view
    'hybrid': 'h',       // Hybrid (satellite + labels)
    'terrain': 'p',      // Terrain view
    'roadmap': 'm'       // Standard roadmap
  };
  
  const typeParam = typeMap[mapType] || 'k';
  
  // Standard Google Maps URL with specified view type
  return `https://maps.google.com/maps?q=${encodedLocation}&t=${typeParam}&z=18&output=embed`;
};

/**
 * Clean and validate location string
 * @param {string} location - The raw location input
 * @returns {string} - Cleaned location string
 */
export const cleanLocation = (location) => {
  if (!location) return '';
  
  // Remove extra whitespace and common prefixes
  return location
    .trim()
    .replace(/^(address|location|premise):?\s*/i, '')
    .trim();
};