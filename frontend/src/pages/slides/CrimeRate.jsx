import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import MultiImageComponent from "../../components/MultiImageComponent";

const CrimeRate = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  fieldPositions,
  setFieldPositions,
  zoomLevel,
  slideData,
  updateSlideData,
  isActiveSlide,
  slideId = 'crimeRate',
}, ref) => {
  
  const containerRef = useRef(null);

  // Expose method to sync current state positions to DOM for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));


  return (
    <div
      ref={containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        background: "url('/Template/Template-10.png') center/100% 100% no-repeat",
        margin: "0 auto",
        border: "none",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        fontFamily: "'Montserrat', sans-serif",
        userSelect: "none",
      }}
      onClick={(e) => {
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {/* Image Component for paste functionality */}
      <MultiImageComponent
        images={slideData?.images || []}
        onUpdateImages={async (updatedImages) => {
          if (updateSlideData) {
            await updateSlideData({ images: updatedImages });
          }
        }}
        zoomLevel={zoomLevel}
      />
    </div>
  );
});

CrimeRate.displayName = 'CrimeRate';
export default CrimeRate;