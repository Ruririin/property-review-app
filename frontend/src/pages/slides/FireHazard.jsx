import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useImageHandler } from "../../hooks/useImageHandler";
import ImageComponent from "../../components/ImageComponent";

const FireHazard = forwardRef(({
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingField, setDraggingField] = useState(null);
  
  const imageHandler = useImageHandler(slideData, updateSlideData, zoomLevel, isActiveSlide, 'aerial');

  // Expose method to sync current state positions to DOM for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  // Auto-resize all textareas when formData changes
  useEffect(() => {
    const textareas = imageHandler.containerRef.current?.querySelectorAll('textarea');
    if (textareas) {
      textareas.forEach(textarea => {
        autoResize(textarea);
      });
    }
  }, [formData, imageHandler.containerRef]);

  const handleChange = (field, value) => {
    if (setFormData) {
      setFormData({ [field]: value || "" }); // Ensure value is always a string
    }
  };

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
        
        const updatedPositions = {
          ...(fieldPositions || {}),
          [draggingField]: newPosition
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
          setFieldPositions({
            ...(fieldPositions || {}),
            [draggingField]: {
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

  const renderBulletTextbox = (field, content, defaultTop = 200) => {
    const isActive = selectedField === field;
    
    // Get position from fieldPositions or use default (centered)
    const defaultFieldPositions = {
      [field]: { top: defaultTop, left: 500 }, // Center horizontally (slide width 1280px, so ~500px is roughly center)
    };
    const position = (fieldPositions && fieldPositions[field]) || defaultFieldPositions[field];
    
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
          // No background when inactive - completely invisible
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
              // Remove the field data and position
              if (setFormData) {
                setFormData({ [field]: "" });
              }
              if (setFieldPositions) {
                const updatedPositions = { ...(fieldPositions || {}) };
                delete updatedPositions[field];
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
        
        {/* Free-form textbox - no positioning constraints */}
        <textarea
          value={(formData?.[field] || "").toString()}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={content}
          onFocus={() => onSelect(field)}
          onKeyDown={(e) => {
            // Allow Delete key to delete the entire field when empty
            if (e.key === 'Delete' && e.target.value === "" && e.ctrlKey) {
              e.preventDefault();
              // Remove the field data and position
              if (setFormData) {
                setFormData({ [field]: "" });
              }
              if (setFieldPositions) {
                const updatedPositions = { ...(fieldPositions || {}) };
                delete updatedPositions[field];
                setFieldPositions(updatedPositions);
              }
              // Deselect the field
              onSelect(null);
            }
          }}
          style={{
            width: "400px", // Default width - fully resizable by user
            minWidth: "200px",
            maxWidth: "none", // Remove max width constraint
            height: "80px", // Default height - fully resizable by user  
            minHeight: "60px",
            maxHeight: "none", // Remove max height constraint
            resize: "both", // Enable full resizing
            fontFamily: "'Montserrat', sans-serif",
            fontSize: fontSizes[field] || 16,
            color: "#8B9A5B",
            backgroundColor: isActive ? "rgba(255, 255, 255, 0.95)" : "transparent",
            border: isActive ? "2px solid rgba(0, 123, 255, 0.8)" : "1px solid transparent",
            borderRadius: "6px",
            padding: "12px",
            outline: "none",
            lineHeight: "1.4",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: isActive ? "0 0 0 2px rgba(0, 123, 255, 0.1)" : "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            cursor: "text",
            // Remove all positioning constraints
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
          }}
        />
      </div>
    );
  };


  return (
    <div
      ref={imageHandler.containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        background: "url('/Template/Template-08.png') center/100% 100% no-repeat",
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
      {/* Fire Hazard Options - only show if they have content */}
      {formData && formData.notWithinFireZone && renderBulletTextbox('notWithinFireZone', 'The property is not within the fire severity zone.', 300)}
      {formData && formData.veryHighFireZone && renderBulletTextbox('veryHighFireZone', 'The property is within the Very High fire severity zone', 300)}
      {formData && formData.highFireZone && renderBulletTextbox('highFireZone', 'The property is within the high fire severity zone', 300)}
      {formData && formData.moderateFireZone && renderBulletTextbox('moderateFireZone', 'The property is within the moderate fire severity zone', 300)}
      
      {/* Dynamic Custom Fire Hazard textboxes */}
      {formData && Object.keys(formData).filter(key => key.startsWith('customFire_')).map((key) => (
        renderBulletTextbox(key, formData[key], 300)
      ))}

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

FireHazard.displayName = 'FireHazard';
export default FireHazard;