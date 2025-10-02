/**
 * Location Data Service - Manages location-specific form data
 * Handles isolation of data between different locations
 */

class LocationDataService {
  constructor() {
    this.locationData = new Map(); // Map<locationIndex, formData>
  }

  /**
   * Initialize location data from project data
   */
  initializeFromProject(projectData, multipleLocationsMode) {
    this.locationData.clear();
    
    console.log('🏗️ Initializing location data service...', { 
      multipleLocationsMode, 
      premiseLocation: projectData.formData?.premiseLocation 
    });
    
    if (multipleLocationsMode) {
      // Parse multiple locations from premise location text
      const premiseLocation = projectData.formData?.premiseLocation || '';
      const locations = this.parseLocationsFromText(premiseLocation);
      
      console.log('📍 Parsed locations:', locations);
      
      // Initialize each location with separate data
      locations.forEach((location, index) => {
        const locationData = {
          ...projectData.formData,
          premiseLocation: location.trim(),
          // Initialize location-specific fields
          insuredName: projectData.formData?.insuredName || '',
          website: projectData.formData?.website || '',
          description: projectData.formData?.description || '',
          lineBusiness: projectData.formData?.lineBusiness || '',
          websiteInfo: projectData.formData?.websiteInfo || '',
        };
        
        this.locationData.set(index, locationData);
        console.log(`📍 Set location ${index + 1}:`, locationData);
      });
      
      // Ensure at least one location exists
      if (this.locationData.size === 0) {
        console.log('⚠️ No locations found, creating default location');
        this.locationData.set(0, { 
          ...projectData.formData,
          premiseLocation: projectData.formData?.premiseLocation || ''
        });
      }
    } else {
      // Single location mode - use location 0
      console.log('🏠 Single location mode');
      this.locationData.set(0, { ...projectData.formData });
    }
    
    console.log('✅ Location data service initialized with', this.locationData.size, 'locations');
  }

  /**
   * Parse multiple locations from premise location text
   */
  parseLocationsFromText(premiseLocationText) {
    if (!premiseLocationText) return [''];
    
    const lines = premiseLocationText.split('\n').filter(line => line.trim());
    return lines.length > 1 ? lines : [premiseLocationText];
  }

  /**
   * Get form data for a specific location
   */
  getLocationData(locationIndex) {
    return this.locationData.get(locationIndex) || {};
  }

  /**
   * Update form data for a specific location
   */
  updateLocationData(locationIndex, field, value) {
    const currentData = this.getLocationData(locationIndex);
    const updatedData = { ...currentData, [field]: value };
    this.locationData.set(locationIndex, updatedData);
    
    console.log(`📍 Updated Location ${locationIndex + 1} - ${field}:`, value);
    return updatedData;
  }

  /**
   * Get all location data as an object for saving
   */
  getAllLocationData() {
    const result = {};
    this.locationData.forEach((data, index) => {
      result[`location_${index}`] = data;
    });
    return result;
  }

  /**
   * Get the number of locations
   */
  getLocationCount() {
    return this.locationData.size;
  }

  /**
   * Get all locations as an array with metadata
   */
  getLocationsArray() {
    const locations = [];
    this.locationData.forEach((data, index) => {
      locations.push({
        index,
        name: `Location ${index + 1}`,
        address: data.premiseLocation || 'No address',
        data
      });
    });
    return locations;
  }

  /**
   * Clear all location data
   */
  clearLocationData() {
    console.log('🧹 Clearing location data service...', this.locationData.size, 'locations');
    this.locationData.clear();
    console.log('✅ Location data service cleared');
  }

  /**
   * Add a new location
   */
  addLocation(baseData = {}) {
    const newIndex = this.locationData.size;
    this.locationData.set(newIndex, { ...baseData });
    return newIndex;
  }

  /**
   * Remove a location
   */
  removeLocation(locationIndex) {
    if (this.locationData.size <= 1) {
      console.warn('Cannot remove the last location');
      return false;
    }
    
    this.locationData.delete(locationIndex);
    
    // Re-index remaining locations
    const remaining = Array.from(this.locationData.entries());
    this.locationData.clear();
    
    remaining.forEach(([oldIndex, data], newIndex) => {
      this.locationData.set(newIndex, data);
    });
    
    return true;
  }

  /**
   * Export data for saving to backend
   */
  exportForSave() {
    return {
      locationData: this.getAllLocationData(),
      locationCount: this.getLocationCount(),
      locations: this.getLocationsArray()
    };
  }
}

// Create singleton instance
const locationDataService = new LocationDataService();

// Ensure methods are properly bound
locationDataService.clearLocationData = locationDataService.clearLocationData.bind(locationDataService);

export default locationDataService;