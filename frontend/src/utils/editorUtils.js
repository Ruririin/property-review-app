// Pure utility functions for the Editor component

// Layout constants
export const NAVBAR_HEIGHT = 72;
export const SIDEBAR_WIDTH = 350; // Increased to accommodate wider comment options
export const SLIDES_BAR_HEIGHT = 160; // Increased height to show scroll bar properly
export const ZOOM_MIN = 50;
export const ZOOM_MAX = 200;
export const ZOOM_STEP = 10;

// Get bounding box of a set of points
export const getPointsBounds = (points) => {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
};

// Check if a point is inside a rectangle
export const isPointInRectangle = (x, y, rect) => {
  const minX = Math.min(rect.startX, rect.endX);
  const maxX = Math.max(rect.startX, rect.endX);
  const minY = Math.min(rect.startY, rect.endY);
  const maxY = Math.max(rect.startY, rect.endY);

  const isInside = x >= minX && x <= maxX && y >= minY && y <= maxY;
  return isInside;
};

// Get status display text
export const getStatusDisplay = (status) => {
  switch (status) {
    case 'approved': return 'Mark Approved';
    case 'denied': return 'Mark Denied';
    case 'conditional': return 'Mark Conditional';
    default: return 'Mark Status';
  }
};

// Handle Best Places navigation
export const handleBestPlacesClickSept4_2025_FINAL = (globalLocationData, multipleLocationsMode, parseMultipleLocations, slides, currentSlide, selectedLocationIndex) => {
  alert('✅ SUCCESS! New function is working!');

  let location = '';
  if (multipleLocationsMode && globalLocationData.premiseLocation) {
    const locations = parseMultipleLocations(globalLocationData.premiseLocation);
    const currentSlideInfo = slides.find(s => s.id === currentSlide);

    if (locations.length > 1) {
      if (currentSlideInfo && typeof currentSlideInfo.locationIndex === 'number') {
        location = locations[currentSlideInfo.locationIndex] || locations[0];
      } else {
        location = locations[selectedLocationIndex] || locations[0];
      }
    } else {
      location = locations[0] || globalLocationData.premiseLocation;
    }
  } else {
    location = globalLocationData.premiseLocation;
  }

  if (location) {
    const zipMatch = location.match(/\b(\d{5})/);

    if (zipMatch) {
      const zipCode = zipMatch[1];
      const bestPlacesUrl = `https://www.bestplaces.net/search/?q=${zipCode}`;
      window.open(bestPlacesUrl, '_blank');
    } else {
      alert('Could not extract zip code from the location.');
    }
  } else {
    alert('Please enter a location first');
  }
};

// Button styles constants
export const BUTTON_STYLES = {
  toggleArrow: {
    position: "absolute",
    width: "20px",
    height: "60px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderRadius: "0 6px 6px 0",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  zoomButton: {
    width: "28px",
    height: "28px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold"
  }
};