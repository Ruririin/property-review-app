// Unified Best Places function - works for both Editor and Sidebar
export const openBestPlaces = (location) => {
  if (!location || !location.trim()) {
    alert('⚠️ No location data available. Please enter a premise location first.');
    return;
  }

  try {
    // Extract zipcode - handle both 5-digit and ZIP+4 formats
    const zipMatch = location.match(/(\d{5}(?:-\d{4})?)(?=\s*$)/) || location.match(/\b(\d{5})/);
    
    if (zipMatch) {
      const zipCode = zipMatch[1];
      const bestPlacesUrl = `https://www.bestplaces.net/search/?q=${zipCode}`;
      window.open(bestPlacesUrl, '_blank');

      return true;
    } else {
      alert('⚠️ Could not find a ZIP code in the location. Please ensure the premise location includes a valid 5-digit ZIP code.');

      return false;
    }
  } catch (error) {
    console.error('❌ Error in Best Places function:', error);
    alert('❌ Error opening Best Places. Please try again.');
    return false;
  }
};

// Best Places Crime-specific URL builder
export const buildBestPlacesCrimeUrl = (location) => {
  if (!location || !location.trim()) {

    return null;
  }

  try {
    // Extract ZIP code
    const zipMatch = location.match(/(\d{5}(?:-\d{4})?)(?=\s*$)/) || location.match(/\b(\d{5})/);
    
    if (!zipMatch) {

      return null;
    }

    const zipCode = zipMatch[1];
    
    // Get state and city from ZIP code (simplified mapping)
    const locationInfo = getLocationFromZip(zipCode);
    
    // Build crime-specific URL: https://www.bestplaces.net/crime/zip-code/{state}/{city}/{zipcode}
    const crimeUrl = `https://www.bestplaces.net/crime/zip-code/${locationInfo.state}/${locationInfo.city}/${zipCode}`;
    

    return crimeUrl;
    
  } catch (error) {
    console.error('❌ Error building Best Places crime URL:', error);
    return null;
  }
};

// Helper function to get location info from ZIP code
const getLocationFromZip = (zipCode) => {
  // Comprehensive ZIP code mapping for major US areas
  const zipCodeDatabase = {
    // California ZIP codes
    '90210': { state: 'california', city: 'beverly_hills' },
    '90041': { state: 'california', city: 'los_angeles' },
    '90401': { state: 'california', city: 'santa_monica' },
    '90291': { state: 'california', city: 'venice' },
    '91601': { state: 'california', city: 'north_hollywood' },
    '91801': { state: 'california', city: 'alhambra' },
    '92101': { state: 'california', city: 'san_diego' },
    '92037': { state: 'california', city: 'la_jolla' },
    '94102': { state: 'california', city: 'san_francisco' },
    '94105': { state: 'california', city: 'san_francisco' },
    '95126': { state: 'california', city: 'san_jose' },
    '95014': { state: 'california', city: 'cupertino' },
    
    // New York ZIP codes
    '10001': { state: 'new_york', city: 'new_york' },
    '10021': { state: 'new_york', city: 'new_york' },
    '10025': { state: 'new_york', city: 'new_york' },
    '10128': { state: 'new_york', city: 'new_york' },
    '11201': { state: 'new_york', city: 'brooklyn' },
    '11375': { state: 'new_york', city: 'forest_hills' },
    
    // Texas ZIP codes
    '75201': { state: 'texas', city: 'dallas' },
    '75254': { state: 'texas', city: 'dallas' },
    '77001': { state: 'texas', city: 'houston' },
    '77056': { state: 'texas', city: 'houston' },
    '78701': { state: 'texas', city: 'austin' },
    '78759': { state: 'texas', city: 'austin' },
    
    // Florida ZIP codes
    '33101': { state: 'florida', city: 'miami' },
    '33139': { state: 'florida', city: 'miami_beach' },
    '32801': { state: 'florida', city: 'orlando' },
    '33701': { state: 'florida', city: 'st_petersburg' },
    
    // Illinois ZIP codes
    '60601': { state: 'illinois', city: 'chicago' },
    '60614': { state: 'illinois', city: 'chicago' },
    
    // Washington ZIP codes
    '98101': { state: 'washington', city: 'seattle' },
    '98104': { state: 'washington', city: 'seattle' },
    
    // Oregon ZIP codes
    '97201': { state: 'oregon', city: 'portland' },
    '97239': { state: 'oregon', city: 'portland' },
    
    // Nevada ZIP codes
    '89101': { state: 'nevada', city: 'las_vegas' },
    '89109': { state: 'nevada', city: 'las_vegas' }
  };
  
  // If exact ZIP code found, return it
  if (zipCodeDatabase[zipCode]) {
    return zipCodeDatabase[zipCode];
  }
  
  // Smart fallback based on ZIP code ranges
  const zipNum = parseInt(zipCode);
  
  // California ZIP code ranges
  if (zipNum >= 90001 && zipNum <= 96162) {
    if (zipNum >= 90001 && zipNum <= 90899) {
      return { state: 'california', city: 'los_angeles' };
    } else if (zipNum >= 91000 && zipNum <= 91999) {
      return { state: 'california', city: 'pasadena' };
    } else if (zipNum >= 92000 && zipNum <= 92999) {
      return { state: 'california', city: 'san_diego' };
    } else if (zipNum >= 94000 && zipNum <= 94999) {
      return { state: 'california', city: 'san_francisco' };
    } else if (zipNum >= 95000 && zipNum <= 95999) {
      return { state: 'california', city: 'san_jose' };
    }
  }
  
  // New York ZIP code ranges
  if (zipNum >= 10001 && zipNum <= 14999) {
    if (zipNum >= 10001 && zipNum <= 10299) {
      return { state: 'new_york', city: 'new_york' };
    } else if (zipNum >= 11200 && zipNum <= 11299) {
      return { state: 'new_york', city: 'brooklyn' };
    }
    return { state: 'new_york', city: 'new_york' };
  }
  
  // Texas ZIP code ranges
  if (zipNum >= 75000 && zipNum <= 79999) {
    if (zipNum >= 75000 && zipNum <= 75399) {
      return { state: 'texas', city: 'dallas' };
    } else if (zipNum >= 77000 && zipNum <= 77999) {
      return { state: 'texas', city: 'houston' };
    } else if (zipNum >= 78700 && zipNum <= 78799) {
      return { state: 'texas', city: 'austin' };
    }
    return { state: 'texas', city: 'dallas' };
  }
  
  // Florida ZIP code ranges
  if (zipNum >= 32000 && zipNum <= 34999) {
    if (zipNum >= 33100 && zipNum <= 33199) {
      return { state: 'florida', city: 'miami' };
    } else if (zipNum >= 32800 && zipNum <= 32899) {
      return { state: 'florida', city: 'orlando' };
    }
    return { state: 'florida', city: 'miami' };
  }
  
  // Illinois ZIP code ranges  
  if (zipNum >= 60000 && zipNum <= 62999) {
    return { state: 'illinois', city: 'chicago' };
  }
  
  // Washington ZIP code ranges
  if (zipNum >= 98000 && zipNum <= 99499) {
    return { state: 'washington', city: 'seattle' };
  }
  
  // Default fallback - most common case

  return { state: 'california', city: 'los_angeles' };
};

// CACHE-BUSTER: Legacy function for backward compatibility
export const handleBestPlacesClickSept4_2025_FINAL = (globalLocationData, multipleLocationsMode, parseMultipleLocations, slides, currentSlide, selectedLocationIndex) => {
  let location = '';
  if (multipleLocationsMode && globalLocationData.premiseLocation) {
    const locations = parseMultipleLocations(globalLocationData.premiseLocation);
    const currentSlideInfo = slides.find(s => s.id === currentSlide);
    
    if (currentSlideInfo && currentSlideInfo.locationIndex !== undefined) {
      location = locations[currentSlideInfo.locationIndex] || locations[0] || '';
    } else if (selectedLocationIndex < locations.length) {
      location = locations[selectedLocationIndex] || '';
    } else {
      location = locations[0] || '';
    }
  } else {
    location = globalLocationData.premiseLocation || '';
  }

  return openBestPlaces(location);
};

// Other external service helpers
export const openActiveFires = () => {
  window.open('https://app.watchduty.org/', '_blank');
};

export const openMaps = (location) => {
  if (!location || !location.trim()) {
    alert('⚠️ No location data available.');
    return false;
  }
  
  const encodedLocation = encodeURIComponent(location);
  window.open(`https://www.google.com/maps/search/${encodedLocation}`, '_blank');
  return true;
};
