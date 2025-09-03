import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useImageHandler } from "../../hooks/useImageHandler";
import ImageComponent from "../../components/ImageComponent";

const NearestFireStation = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  textAlignments,
  showWebsite,
  fieldPositions,
  setFieldPositions,
  zoomLevel,
  slideData,
  updateSlideData,
  isActiveSlide,
  multipleLocationsMode,
  selectedLocationIndex,
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingField, setDraggingField] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 });
  const [resizingField, setResizingField] = useState(null);
  const [resizeMode, setResizeMode] = useState("");
  
  const imageHandler = useImageHandler(slideData, updateSlideData, zoomLevel, isActiveSlide, 'aerial');

  // Expose method to sync current state positions to DOM for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  const handleChange = (field, value) => {
    if (setFormData) {
      const actualField = multipleLocationsMode ? `${field}_loc${selectedLocationIndex}` : field;
      setFormData({ [actualField]: value || "" }); // Ensure value is always a string
    }
  };

  const handleResizeMouseDown = (e, field, mode) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizingField(field);
    setResizeMode(mode);
    
    const fieldElement = e.currentTarget.parentElement.querySelector('textarea');
    const rect = fieldElement.getBoundingClientRect();
    
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top
    });
  };

  const handleResizeMouseMove = (e) => {
    if (!isResizing || !resizingField) return;

    e.preventDefault();
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    
    // Update dimensions based on resize mode
    switch (resizeMode) {
      case 'se':
        newWidth = Math.max(200, resizeStart.width + deltaX);
        newHeight = Math.max(60, resizeStart.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(200, resizeStart.width - deltaX);
        newHeight = Math.max(60, resizeStart.height + deltaY);
        break;
      case 'ne':
        newWidth = Math.max(200, resizeStart.width + deltaX);
        newHeight = Math.max(60, resizeStart.height - deltaY);
        break;
      case 'nw':
        newWidth = Math.max(200, resizeStart.width - deltaX);
        newHeight = Math.max(60, resizeStart.height - deltaY);
        break;
    }
    
    // Update field positions
    if (setFieldPositions && fieldPositions) {
      const actualField = multipleLocationsMode ? `${resizingField}_loc${selectedLocationIndex}` : resizingField;
      const updatedPositions = {
        ...fieldPositions,
        [actualField]: {
          ...(fieldPositions[actualField] || {}),
          width: newWidth,
          height: newHeight
        }
      };
      setFieldPositions(updatedPositions);
    }
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    setResizingField(null);
    setResizeMode("");
  };

  // Add document event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [isResizing, resizingField, resizeMode, resizeStart]);

  const autoResize = (el) => {
    el.style.height = "auto"; 
    el.style.height = el.scrollHeight + "px"; 
  };

  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDraggingField(field);
    
    // Get the container element (the div that wraps bullet + textarea)
    const fieldContainer = e.currentTarget.parentElement;
    const fieldRect = fieldContainer.getBoundingClientRect();
    const containerRect = imageHandler.containerRef.current.getBoundingClientRect();
    
    // Account for zoom level when calculating offset
    const zoomFactor = (zoomLevel || 100) / 100;
    
    // Calculate offset from cursor to field container's position relative to main container
    setDragOffset({
      x: (e.clientX - fieldRect.left) / zoomFactor,
      y: (e.clientY - fieldRect.top) / zoomFactor,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && draggingField && imageHandler.containerRef.current) {
      const containerRect = imageHandler.containerRef.current.getBoundingClientRect();
      
      // Account for zoom level when calculating new position
      const zoomFactor = (zoomLevel || 100) / 100;
      
      // Calculate new field position maintaining the original offset
      const newLeft = (e.clientX - containerRect.left) / zoomFactor - dragOffset.x;
      const newTop = (e.clientY - containerRect.top) / zoomFactor - dragOffset.y;
      
      if (setFieldPositions) {
        const newPosition = {
          top: Math.max(0, newTop),
          left: Math.max(0, Math.min(newLeft, 1000)), // Keep within reasonable bounds
        };
        
        // Use location-aware field key for positioning
        const actualFieldKey = multipleLocationsMode ? `${draggingField}_loc${selectedLocationIndex}` : draggingField;
        const updatedPositions = {
          ...(fieldPositions || {}),
          [actualFieldKey]: newPosition
        };
        
        setFieldPositions(updatedPositions);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingField(null);
  };

  // Add document event listeners for dragging
  useEffect(() => {
    const handleDocumentMouseMove = (e) => {
      if (isDragging && draggingField && imageHandler.containerRef.current) {
        const containerRect = imageHandler.containerRef.current.getBoundingClientRect();
        
        // Account for zoom level when calculating new position
        const zoomFactor = (zoomLevel || 100) / 100;
        
        // Calculate new field position maintaining the original offset
        const newLeft = (e.clientX - containerRect.left) / zoomFactor - dragOffset.x;
        const newTop = (e.clientY - containerRect.top) / zoomFactor - dragOffset.y;
        
        if (setFieldPositions) {
          // Use location-aware field key for positioning
          const actualFieldKey = multipleLocationsMode ? `${draggingField}_loc${selectedLocationIndex}` : draggingField;
          setFieldPositions({
            ...(fieldPositions || {}),
            [actualFieldKey]: {
              top: Math.max(0, newTop),
              left: Math.max(0, Math.min(newLeft, 1000)), // Keep within reasonable bounds
            }
          });
        }
        e.preventDefault();
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggingField(null);
      }
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
      };
    }
  }, [isDragging, draggingField, dragOffset, zoomLevel, fieldPositions, setFieldPositions, imageHandler.containerRef]);


  const renderBulletTextbox = (field, content, defaultTop = 300) => {
    const isActive = selectedField === field;
    
    // Get position from fieldPositions or use default (centered)
    const defaultFieldPositions = {
      [field]: { top: defaultTop, left: 500 }, // Center horizontally
    };
    
    // In multiple locations mode, append location index to field key
    const actualField = multipleLocationsMode ? `${field}_loc${selectedLocationIndex}` : field;
    const position = (fieldPositions && fieldPositions[actualField]) || defaultFieldPositions[field];
    
    return (
      <div
        key={field}
        onClick={(e) => e.stopPropagation()} // Prevent deselection when clicking on text field area
        style={{
          position: "absolute",
          top: position.top,
          left: position.left,
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          background: "transparent",
          borderRadius: "6px",
          padding: "0",
        }}
      >
        {/* Drag handle (bullet point) */}
        <span 
          onMouseDown={(e) => handleFieldMouseDown(e, field)}
          style={{
            color: "#8B9A5B",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: fontSizes[field] || 16,
            fontWeight: "bold",
            marginTop: "10px", // Align with first line of text
            flexShrink: 0,
            cursor: isActive ? "move" : "default",
            padding: "2px",
            borderRadius: "3px",
            background: isActive ? "rgba(139, 154, 91, 0.15)" : "transparent",
            userSelect: "none",
          }}
          title={isActive ? "Drag to move" : ""}
        >
          •
        </span>
        
        {/* Delete button - only show when active */}
        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Remove the field data and position using location-aware keys
              const actualFieldKey = multipleLocationsMode ? `${field}_loc${selectedLocationIndex}` : field;
              if (setFormData) {
                setFormData({ [actualFieldKey]: "" });
              }
              if (setFieldPositions) {
                const updatedPositions = { ...(fieldPositions || {}) };
                delete updatedPositions[actualFieldKey];
                setFieldPositions(updatedPositions);
              }
              // Deselect the field
              onSelect(null);
            }}
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#ff4444",
              color: "white",
              border: "none",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            title="Delete text field"
          >
            ×
          </button>
        )}
        
        {/* Free-form textbox for fire station info */}
        <textarea
          value={getActualFormData(field).toString()}
          onChange={(e) => handleFormChange(field, e.target.value)}
          placeholder={multipleLocationsMode ? `${content} - Location ${selectedLocationIndex + 1}` : content}
          onFocus={() => onSelect(field)}
          onKeyDown={(e) => {
            // Allow Delete key to delete the entire field when empty
            if (e.key === 'Delete' && e.target.value === "" && e.ctrlKey) {
              e.preventDefault();
              // Remove the field data and position
              if (setFormData) {
                const fieldKey = multipleLocationsMode ? `${field}_loc${selectedLocationIndex}` : field;
                setFormData({ [fieldKey]: "" });
              }
              if (setFieldPositions) {
                const updatedPositions = { ...(fieldPositions || {}) };
                const positionKey = multipleLocationsMode ? `${field}_loc${selectedLocationIndex}` : field;
                delete updatedPositions[positionKey];
                setFieldPositions(updatedPositions);
              }
              // Deselect the field
              onSelect(null);
            }
          }}
          style={{
            width: position.width ? `${position.width}px` : '500px',
            height: position.height ? `${position.height}px` : '80px',
            minWidth: "300px",
            minHeight: "60px",
            resize: "both",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: fontSizes[field] || 32,
            color: "#8B9A5B",
            backgroundColor: isActive ? "rgba(255, 255, 255, 0.95)" : "transparent",
            border: isActive ? "2px solid rgba(0, 123, 255, 0.8)" : "1px solid transparent",
            borderRadius: "6px",
            padding: "12px",
            outline: "none",
            lineHeight: "1.4",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: isActive ? "0 0 0 2px rgba(0, 123, 255, 0.1)" : "none",
            transition: "all 0.2s ease",
            cursor: "text",
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            textAlign: textAlignments?.[field] || 'left',
            userSelect: "text"
          }}
        />
      </div>
    );
  };

  // Get actual form data based on location mode
  const getActualFormData = (field) => {
    if (multipleLocationsMode) {
      return formData?.[`${field}_loc${selectedLocationIndex}`] || "";
    }
    return formData?.[field] || "";
  };

  // Handle change with location awareness
  const handleFormChange = (field, value) => {
    if (multipleLocationsMode) {
      setFormData({ [`${field}_loc${selectedLocationIndex}`]: value });
    } else {
      setFormData({ [field]: value });
    }
  };

  return (
    <div
      ref={imageHandler.containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        background: "url('/Template/Template-07.png') center/100% 100% no-repeat", // Using Template-07 for fire station
        margin: "0 auto",
        border: "none",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        fontFamily: "'Montserrat', sans-serif",
        userSelect: "none",
      }}
      onMouseMove={(e) => {
        if (imageHandler.isDraggingImage) {
          imageHandler.handleMouseMove(e);
        } else {
          handleMouseMove(e);
        }
      }}
      onMouseUp={(e) => {
        if (imageHandler.isDraggingImage) {
          imageHandler.handleMouseUp(e);
        } else {
          handleMouseUp(e);
        }
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
      {/* First Bullet - Fire Station Name and Address */}
      {renderBulletTextbox('fireStationName', 'Fire station name and full address', 280)}
      
      {/* Second Bullet - Time and Distance */}
      {renderBulletTextbox('fireStationDistance', 'Travel time and distance (e.g., 5 min / 1.2 miles away)', 380)}
      
      {/* Location indicator when in multiple locations mode */}
      {multipleLocationsMode && (
        <div 
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "rgba(139, 154, 91, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "20px",
            fontSize: "14px",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: "bold",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
          }}
        >
          Location {selectedLocationIndex + 1} Fire Station Data
        </div>
      )}
      
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

NearestFireStation.displayName = 'NearestFireStation';
export default NearestFireStation;