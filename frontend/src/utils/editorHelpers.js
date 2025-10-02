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
      console.log('✅ Opened Best Places for ZIP:', zipCode);
      return true;
    } else {
      alert('⚠️ Could not find a ZIP code in the location. Please ensure the premise location includes a valid 5-digit ZIP code.');
      console.log('❌ No ZIP code found in location:', location);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in Best Places function:', error);
    alert('❌ Error opening Best Places. Please try again.');
    return false;
  }
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
