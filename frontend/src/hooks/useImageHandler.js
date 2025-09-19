import { useState, useEffect, useRef } from 'react';

export const useImageHandler = (slideData, updateSlideData, zoomLevel, isActiveSlide, slideType = 'default') => {
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState(null);
  const [isImageSelected, setIsImageSelected] = useState(false);
  
  const containerRef = useRef(null);
  const imageData = slideData?.imageData || null;
  const imagePosition = slideData?.imagePosition || { top: 300, left: 400 };

  // Helper function to handle both mouse and touch events
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Handle paste events for adding images - only for the active slide
  useEffect(() => {
    const handlePaste = (e) => {
      // Only handle paste if this is the active slide
      if (!isActiveSlide) return;
      
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              
              // Adaptive sizing based on slide type and available area
              let maxWidth, maxHeight, positionX, positionY, newWidth, newHeight;
              
              // Define sizing and positioning based on slide type
              if (slideType === 'aerial' || slideType === 'street') {
                // For aerial/street views - use the dedicated map area (1064x504)
                maxWidth = 1064;
                maxHeight = 504;
                const mapAreaAspectRatio = maxWidth / maxHeight;
                
                if (aspectRatio > mapAreaAspectRatio) {
                  newWidth = maxWidth;
                  newHeight = maxWidth / aspectRatio;
                } else {
                  newHeight = maxHeight;
                  newWidth = maxHeight * aspectRatio;
                }
                
                // Position in the center of the map area (108px from edges)
                positionX = 108 + (maxWidth - newWidth) / 2;
                positionY = 108 + (maxHeight - newHeight) / 2;
                
              } else {
                // For other slides - use more conservative sizing
                maxWidth = 600;  // Smaller max width
                maxHeight = 400; // Smaller max height
                
                // Scale down large images while maintaining aspect ratio
                if (img.width > maxWidth || img.height > maxHeight) {
                  const scaleX = maxWidth / img.width;
                  const scaleY = maxHeight / img.height;
                  const scale = Math.min(scaleX, scaleY);
                  
                  newWidth = img.width * scale;
                  newHeight = img.height * scale;
                } else {
                  // Keep original size if it's already reasonable, with minimums
                  newWidth = Math.max(150, Math.min(img.width, maxWidth));
                  newHeight = Math.max(100, Math.min(img.height, maxHeight));
                }
                
                // Center in the slide, but leave room for content above/below
                positionX = (1280 - newWidth) / 2;
                positionY = Math.max(150, (720 - newHeight) / 2); // At least 150px from top
              }
              
              const newImageData = {
                src: event.target.result,
                width: newWidth,
                height: newHeight,
                aspectRatio,
              };
              
              updateSlideData({
                imageData: newImageData,
                imagePosition: { top: positionY, left: positionX }
              });
              setIsImageSelected(true);
              
              // Image pasted successfully
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [updateSlideData, isActiveSlide]);

  // Mouse down on image - start dragging (only if not already resizing)
  const handleMouseDownImage = (e) => {
    e.stopPropagation();
    
    // Don't start dragging if we're already in resize mode
    if (isResizingImage) return;
    
    setIsDraggingImage(true);
    setIsImageSelected(true);
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Account for zoom level when calculating offset
    const zoomFactor = (zoomLevel || 100) / 100;
    
    const coords = getEventCoordinates(e);
    setDragOffset({
      x: (coords.clientX - rect.left) / zoomFactor,
      y: (coords.clientY - rect.top) / zoomFactor,
    });
  };

  // Mouse move - handle dragging and resizing
  const handleMouseMove = (e) => {
    if (isDraggingImage && imageData && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Account for zoom level when calculating new position
      const zoomFactor = (zoomLevel || 100) / 100;
      
      const coords = getEventCoordinates(e);
      const newLeft = (coords.clientX - containerRect.left) / zoomFactor - dragOffset.x;
      const newTop = (coords.clientY - containerRect.top) / zoomFactor - dragOffset.y;
      
      updateSlideData({
        imagePosition: {
          left: Math.max(0, newLeft),
          top: Math.max(0, newTop),
        }
      });
    }

    if (isResizingImage && resizeStart && imageData && containerRef.current) {
      // Simple resize based on mouse movement from start position
      const coords = getEventCoordinates(e);
      const deltaX = coords.clientX - resizeStart.x;
      const deltaY = coords.clientY - resizeStart.y;
      
      // Use the larger delta for resizing (horizontal or vertical movement)
      const delta = Math.max(deltaX, deltaY);
      
      // Calculate new width and height maintaining aspect ratio
      const newWidth = Math.max(50, resizeStart.startWidth + delta);
      const newHeight = newWidth / imageData.aspectRatio;
      
      updateSlideData({
        imageData: {
          ...imageData,
          width: newWidth,
          height: newHeight,
        }
      });
    }
  };

  // Mouse up - stop dragging/resizing
  const handleMouseUp = () => {
    setIsDraggingImage(false);
    setIsResizingImage(false);
    setResizeStart(null);
  };

  // Start resizing
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Make sure we're not in drag mode
    setIsDraggingImage(false);
    setIsResizingImage(true);
    setIsImageSelected(true);
    
    const coords = getEventCoordinates(e);
    setResizeStart({
      x: coords.clientX,
      y: coords.clientY,
      startWidth: imageData.width,
      startHeight: imageData.height,
    });
  };

  // Delete image
  const handleDeleteImage = (e) => {
    e.stopPropagation();
    updateSlideData({
      imageData: null,
      imagePosition: { top: 300, left: 400 }
    });
    setIsImageSelected(false);
  };

  // Handle container clicks to deselect image
  const handleContainerClick = (e, onSelect) => {
    if (e.target === containerRef.current) {
      onSelect(null);
      setIsImageSelected(false);
    }
  };

  return {
    containerRef,
    imageData,
    imagePosition,
    isDraggingImage,
    isImageSelected,
    setIsImageSelected,
    handleMouseDownImage,
    handleMouseMove,
    handleMouseUp,
    handleResizeMouseDown,
    handleDeleteImage,
    handleContainerClick,
  };
};