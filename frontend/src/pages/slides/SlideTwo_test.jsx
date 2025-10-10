import { useState, useImperativeHandle, useEffect } from "react";
import { useImageHandler } from "../../hooks/useImageHandler";

const SlideTwo = ({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  slideId,
  slideData,
  updateSlideData,
  zoomLevel,
  isActiveSlide,
  allSlideData, // Need this to check other slides
  slides, // Need this to check slide types
}) => {
  console.log('🎯 SlideTwo component called (NO forwardRef)');
  console.log('🎯 About to call useImageHandler...');
  
  const imageHandler = useImageHandler(slideData, updateSlideData, zoomLevel, isActiveSlide, 'aerial');
  const currentViewType = formData.websiteInfo || "Satellite View";

  // Rest of the component logic would go here...
  return (
    <div>
      <h3>SlideTwo Test Component (No forwardRef)</h3>
      <p>Image handler loaded successfully!</p>
    </div>
  );
};

export default SlideTwo;
