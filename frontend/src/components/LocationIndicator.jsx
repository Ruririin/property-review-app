/**
 * Location Indicator Component
 * Shows which location is currently being edited
 */

import React from 'react';

// Pulsing dot component with CSS-in-JS animation
const PulsingDot = () => {
  const [opacity, setOpacity] = React.useState(1);
  
  React.useEffect(() => {
    const animate = () => {
      setOpacity(prev => prev === 1 ? 0.5 : 1);
    };
    
    const interval = setInterval(animate, 1000); // 1 second intervals for 2s total cycle
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      style={{
        width: "8px",
        height: "8px",
        backgroundColor: "#fff",
        borderRadius: "50%",
        opacity: opacity,
        transition: "opacity 1s ease-in-out"
      }}
    />
  );
};

const LocationIndicator = ({ 
  multipleLocationsMode, 
  selectedLocationIndex, 
  totalLocations,
  currentLocationName,
  onLocationChange
}) => {
  if (!multipleLocationsMode) return null;

  return (
    <div 
      style={{
        position: "absolute",
        top: "15px",
        right: "15px",
        backgroundColor: "rgba(139, 154, 91, 0.95)",
        color: "white",
        padding: "8px 16px",
        borderRadius: "20px",
        fontSize: "14px",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "200px",
        backdropFilter: "blur(10px)"
      }}
    >
      <PulsingDot />
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", opacity: 0.9 }}>
          Editing Location
        </div>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>
          {selectedLocationIndex + 1} of {totalLocations}
        </div>
      </div>
      
      {onLocationChange && (
        <select
          value={selectedLocationIndex}
          onChange={(e) => onLocationChange(parseInt(e.target.value))}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            fontFamily: "'Montserrat', sans-serif",
            cursor: "pointer"
          }}
        >
          {Array.from({ length: totalLocations }, (_, i) => (
            <option 
              key={i} 
              value={i}
              style={{ color: '#333', backgroundColor: 'white' }}
            >
              Location {i + 1}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default LocationIndicator;