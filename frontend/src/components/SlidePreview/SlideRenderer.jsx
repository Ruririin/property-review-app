/**
 * SlideRenderer - Phase 4 of Editor Refactoring
 * 
 * This component handles the rendering of individual slides with proper
 * component selection, data passing, and form management.
 */

import React from 'react';
import { getSlideComponent, getSlideData } from './SlideTypeHandlers';

const SlideRenderer = ({
  slideId,
  slideType,
  slideData,
  globalLocationData,
  device,
  onFormDataUpdate,
  style,
  className,
  ...additionalProps
}) => {
  // Get the appropriate slide component
  const SlideComponent = getSlideComponent(slideType);
  
  // Get slide-specific data
  const currentSlideData = getSlideData(slideData, slideId);
  
  // Prepare form data with global and slide-specific data
  const formData = {
    // Slide-specific fields first
    ...(currentSlideData?.formData || {}),
    // Global fields override slide-specific ones for consistency
    insuredName: globalLocationData?.insuredName || '',
    premiseLocation: globalLocationData?.premiseLocation || '',
    website: globalLocationData?.website || '',
  };

  // Default styles for slide container
  const defaultStyle = {
    width: '8.5in',
    height: '11in',
    position: 'relative',
    marginBottom: '20px',
    background: 'white',
    fontFamily: "'Montserrat', sans-serif",
    ...style
  };

  return (
    <div 
      className={`slide-container ${className || ''}`}
      style={defaultStyle}
    >
      <SlideComponent
        key={slideId}
        slideId={slideId}
        device={device}
        formData={formData}
        globalFormData={globalLocationData || {}}
        setFormData={onFormDataUpdate}
        {...additionalProps}
      />
    </div>
  );
};

export default SlideRenderer;
