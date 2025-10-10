import React from 'react';

const CrimeRate = React.forwardRef(({ 
  isSelected, 
  onSelect, 
  slideData = {}, 
  updateSlideData,
  globalFormData = {},
  zoomLevel = 1 
}, ref) => {
  
  return (
    <div
      ref={ref}
      className={`slide-container ${isSelected ? 'selected' : ''}`}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        background: "url('/Template/Template-10.png') center/100% 100% no-repeat",
        margin: "0 auto",
        border: isSelected ? "3px solid #007acc" : "none",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        fontFamily: "'Montserrat', sans-serif",
        userSelect: "none",
        cursor: "pointer",
      }}
      onClick={(e) => {
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {/* Empty slide - just background template */}
    </div>
  );
});

CrimeRate.displayName = 'CrimeRate';
export default CrimeRate;
