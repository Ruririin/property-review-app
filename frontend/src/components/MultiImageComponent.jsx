import { useState, useEffect, useRef } from 'react';

const MultiImageComponent = ({ 
  images = [], 
  onUpdateImages, 
  zoomLevel = 100,
  isActiveSlide = true  // Only handle paste when this slide is active
}) => {
  // Local images state that gets updated immediately
  const [localImages, setLocalImages] = useState(images);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Resize state management
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Sync local images with prop changes - only when significantly different
  useEffect(() => {
    // Only sync if the arrays are meaningfully different (different IDs or lengths)
    const currentIds = localImages.map(img => img.id).sort();
    const propIds = images.map(img => img.id).sort();
    
    // Check if the image IDs are different (indicates real data change from backend)
    const idsChanged = currentIds.length !== propIds.length || 
                      currentIds.some((id, index) => id !== propIds[index]);
    
    if (idsChanged) {
      console.log('📷 MultiImageComponent: Syncing with prop changes', { 
        from: currentIds, 
        to: propIds 
      });
      setLocalImages(images);
    }
  }, [images]);

  // Reference to the container div for event binding
  const containerDivRef = useRef(null);

  // Handle paste events for adding multiple images - only when slide is active
  useEffect(() => {
    const handlePaste = (e) => {
      // Only handle paste if this slide is active
      if (!isActiveSlide) {
        console.log('📷 MultiImageComponent: Ignoring paste - slide not active', { isActiveSlide });
        return;
      }
      
      // Check if the container is focused or an element within it is focused
      const container = containerDivRef.current;
      if (!container || !container.contains(document.activeElement)) {
        console.log('📷 MultiImageComponent: Ignoring paste - container not focused');
        return;
      }
      
      console.log('📷 MultiImageComponent: Handling paste event', { 
        isActiveSlide, 
        componentId: Math.random().toString(36).substr(2, 9) 
      });
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          const reader = new FileReader();
          
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              
              // Calculate size and position for new image
              const maxWidth = 400;
              const maxHeight = 300;
              
              let newWidth, newHeight;
              if (img.width > maxWidth || img.height > maxHeight) {
                const scaleX = maxWidth / img.width;
                const scaleY = maxHeight / img.height;
                const scale = Math.min(scaleX, scaleY);
                
                newWidth = img.width * scale;
                newHeight = img.height * scale;
              } else {
                newWidth = Math.max(150, Math.min(img.width, maxWidth));
                newHeight = Math.max(100, Math.min(img.height, maxHeight));
              }
              
              // Generate unique ID for new image
              const newId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              // Position new image with slight offset from existing images
              const offset = localImages.length * 20;
              const newPosition = {
                left: 300 + offset,
                top: 200 + offset
              };
              
              const newImage = {
                id: newId,
                src: event.target.result,
                width: newWidth,
                height: newHeight,
                position: newPosition,
                aspectRatio
              };
              
              // Add to existing images array instead of replacing
              const updatedImages = [...localImages, newImage];
              setLocalImages(updatedImages);
              
              if (onUpdateImages) {
                onUpdateImages(updatedImages);
              }
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
          break; // Only handle the first image found
        }
      }
    };

    // Only add listener if slide is active
    if (isActiveSlide) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [localImages, onUpdateImages, isActiveSlide]);

  // Handle mouse down for dragging
  const handleMouseDown = (e, imageId) => {
    console.log('🖱️ Mouse down on image:', imageId);
    e.preventDefault();
    e.stopPropagation();
    setSelectedImageId(imageId);
    setIsDragging(true);
    
    const image = localImages.find(img => img.id === imageId);
    if (image) {
      setDragStart({
        x: e.clientX - image.position.left,
        y: e.clientY - image.position.top
      });
    }
  };

  // Track current drag position without updating parent
  const [currentDragPosition, setCurrentDragPosition] = useState(null);

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging || !selectedImageId) return;

    const newPosition = {
      left: e.clientX - dragStart.x,
      top: e.clientY - dragStart.y
    };

    // Update local drag position for visual feedback
    setCurrentDragPosition(newPosition);
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    console.log('🖱️ Mouse up, stopping drag');
    
    // Save final position if we were dragging
    if (isDragging && selectedImageId && currentDragPosition) {
      console.log('💾 Saving final drag position:', currentDragPosition);
      const updatedImages = localImages.map(img => 
        img.id === selectedImageId 
          ? { ...img, position: currentDragPosition }
          : img
      );
      console.log('💾 Calling onUpdateImages with updated position:', updatedImages);
      
      // Update local state immediately
      setLocalImages(updatedImages);
      // Notify parent
      onUpdateImages(updatedImages);
    }
    
    setIsDragging(false);
    setCurrentDragPosition(null);
    setDragStart({ x: 0, y: 0 });
  };


  // Delete image
  const deleteImage = (imageId) => {
    console.log('🗑️ deleteImage called:', imageId);
    const updatedImages = localImages.filter(img => img.id !== imageId);
    console.log('🗑️ Calling onUpdateImages with:', updatedImages);
    
    // Update local state immediately
    setLocalImages(updatedImages);
    // Notify parent
    onUpdateImages(updatedImages);
    setSelectedImageId(null);
  };


  // Handle resize mouse down
  const handleResizeMouseDown = (e, imageId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const image = localImages.find(img => img.id === imageId);
    if (image) {
      setIsResizing(true);
      setSelectedImageId(imageId);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: parseInt(image.width) || 200,
        height: parseInt(image.height) || 150
      });
    }
  };

  // Track current resize dimensions
  const [currentResizeDimensions, setCurrentResizeDimensions] = useState(null);

  // Handle resize mouse move
  const handleResizeMouseMove = (e) => {
    if (!isResizing || !selectedImageId) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    // Use the larger delta to maintain aspect ratio (uniform resize)
    const delta = Math.max(deltaX, deltaY);
    
    // Calculate original aspect ratio
    const aspectRatio = resizeStart.width / resizeStart.height;
    
    // Calculate new dimensions maintaining aspect ratio
    const newWidth = Math.max(50, resizeStart.width + delta);
    const newHeight = Math.max(38, newWidth / aspectRatio);
    
    // Update local resize dimensions for visual feedback
    setCurrentResizeDimensions({ width: newWidth, height: newHeight });
  };

  // Handle resize mouse up
  const handleResizeMouseUp = () => {
    // Save final dimensions if we were resizing
    if (isResizing && selectedImageId && currentResizeDimensions) {
      console.log('📏 Saving final resize dimensions:', currentResizeDimensions);
      const updatedImages = localImages.map(img => 
        img.id === selectedImageId 
          ? { ...img, width: currentResizeDimensions.width, height: currentResizeDimensions.height }
          : img
      );
      console.log('📏 Calling onUpdateImages with updated dimensions:', updatedImages);
      
      // Update local state immediately
      setLocalImages(updatedImages);
      // Notify parent
      onUpdateImages(updatedImages);
    }
    
    setIsResizing(false);
    setCurrentResizeDimensions(null);
    setResizeStart({ x: 0, y: 0, width: 0, height: 0 });
  };

  // Touch event handlers for tablet compatibility
  const handleTouchStart = (e, imageId) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
        preventDefault: () => {
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => e.stopPropagation()
      };
      handleMouseDown(syntheticEvent, imageId);
    }
    // Only prevent default if the event is cancelable
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
        preventDefault: () => {
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => e.stopPropagation()
      };
      handleMouseMove(syntheticEvent);
    }
    // Only prevent default if the event is cancelable
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    handleMouseUp();
    // Only prevent default if the event is cancelable
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  // Add global event listeners for drag and resize functionality
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      } else if (isResizing) {
        handleResizeMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      } else if (isResizing) {
        handleResizeMouseUp();
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, selectedImageId, dragStart, resizeStart]);

  return (
    <div
      ref={containerDivRef}
      tabIndex={0} // Make container focusable
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        touchAction: 'none', // Prevent scrolling during drag
        pointerEvents: 'none', // Allow clicks to pass through when no images
        zIndex: 10, // Lower z-index to stay below UI elements
        outline: 'none' // Hide focus outline
      }}
    >
      {localImages.map((image) => {
        // Use current drag position if this image is being dragged
        const position = (isDragging && selectedImageId === image.id && currentDragPosition) 
          ? currentDragPosition 
          : image.position;
          
        // Use current resize dimensions if this image is being resized
        const dimensions = (isResizing && selectedImageId === image.id && currentResizeDimensions)
          ? currentResizeDimensions
          : { width: image.width, height: image.height };
          
        return (
        <div
          key={image.id}
          style={{
            position: "absolute",
            top: position.top,
            left: position.left,
            zIndex: selectedImageId === image.id ? 25 : 20, // Lower z-index to stay below UI elements
            pointerEvents: 'auto', // Ensure this div can receive mouse events
          }}
        >
          <img
            src={image.src}
            alt="Pasted"
            onMouseDown={(e) => {
              console.log('🖱️ Image clicked:', image.id);
              handleMouseDown(e, image.id);
            }}
            onTouchStart={(e) => handleTouchStart(e, image.id)}
            onClick={(e) => {
              console.log('🖱️ Image onClick:', image.id);
              e.stopPropagation();
              setSelectedImageId(image.id);
            }}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              objectFit: "cover",
              border: selectedImageId === image.id ? "3px solid #007bff" : "5px solid #000",
              borderRadius: "6px",
              boxSizing: "border-box", // Ensure border is included in width/height
              cursor: isResizing ? "nwse-resize" : (isDragging ? "grabbing" : "grab"),
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              userSelect: "none",
              touchAction: 'none',
              pointerEvents: 'auto',
              display: 'block'
            }}
          />
          
          {/* Selection and control handles */}
          {selectedImageId === image.id && (
            <>
              {/* Resize handle */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  right: "-6px",
                  width: "16px",
                  height: "16px",
                  background: "#007bff",
                  border: "2px solid #fff",
                  borderRadius: "2px",
                  cursor: "nwse-resize",
                  zIndex: 125, // Higher than image z-index
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => {
                  console.log('🔧 Resize handle clicked for image:', image.id);
                  handleResizeMouseDown(e, image.id);
                }}
                title="Resize image"
              />
              
              {/* Delete button */}
              <button
                onClick={(e) => {
                  console.log('🗑️ Delete button clicked for image:', image.id);
                  e.stopPropagation();
                  deleteImage(image.id);
                }}
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  width: "20px",
                  height: "20px",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 125, // Higher than image z-index
                  pointerEvents: 'auto',
                }}
                title="Delete image"
              >
                ×
              </button>
            </>
          )}
        </div>
        );
      })}
      
      {/* Instructions when no images */}
      {localImages.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#666",
            fontSize: "14px",
            fontStyle: "italic",
            textAlign: "center",
            pointerEvents: "none"
          }}
        >
          Press Ctrl+V to paste images here<br />
          <small>Multiple images supported</small>
        </div>
      )}
    </div>
  );
};

export default MultiImageComponent;