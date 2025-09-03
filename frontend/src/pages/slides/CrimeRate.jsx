import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useImageHandler } from "../../hooks/useImageHandler";
import ImageComponent from "../../components/ImageComponent";

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
}, ref) => {
  
  const imageHandler = useImageHandler(slideData, updateSlideData, zoomLevel, isActiveSlide, 'aerial');

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
      ref={imageHandler.containerRef}
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
      onMouseMove={(e) => {
        imageHandler.handleMouseMove(e);
      }}
      onMouseUp={(e) => {
        imageHandler.handleMouseUp(e);
      }}
      onClick={(e) => {
        // Handle image click first
        imageHandler.handleContainerClick(e, onSelect);
        
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {/* Image Component for paste functionality */}
      <ImageComponent
        imageData={imageHandler.imageData}
        imagePosition={imageHandler.imagePosition}
        isImageSelected={imageHandler.isImageSelected}
        isDraggingImage={imageHandler.isDraggingImage}
        onMouseDownImage={imageHandler.handleMouseDownImage}
        onResizeMouseDown={imageHandler.handleResizeMouseDown}
        onDeleteImage={imageHandler.handleDeleteImage}
      />
    </div>
  );
});

CrimeRate.displayName = 'CrimeRate';
export default CrimeRate;