import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import ImageFrame from "../../components/ImageFrame";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";
import slideApiService from "../../services/slideApiService";

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
  currentProjectId,
  slideId = 'nearestFireStation',
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingField, setDraggingField] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 });
  const [resizingField, setResizingField] = useState(null);
  const [resizeMode, setResizeMode] = useState("");
  
  const containerRef = useRef(null);
  const slideDataRef = useRef(slideData);

  // Frame image handler for backend upload/delete
  const activeProjectId = currentProjectId;
  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(
    activeProjectId,
    slideId
  );

  // Frame layout state: 1 = single full frame, 2 = portrait left frame
  const [frameLayout, setFrameLayout] = useState(slideData?.frameLayout || 1);
  const frameImages = slideData?.frameImages || {};
  const frameMeta = slideData?.frameMeta || {};

  // Keep ref updated with latest slideData
  useEffect(() => {
    slideDataRef.current = slideData;
  }, [slideData]);

  const handleImageUpload = async (frameId, imageData) => {
    const currentFrameImages = slideDataRef.current?.frameImages || {};
    const currentFrameMeta = slideDataRef.current?.frameMeta || {};
    const updatedFrameImages = { ...currentFrameImages, [frameId]: imageData };

    updateSlideData({ frameImages: updatedFrameImages });

    const hasDatabaseId = slideData?._appState?.databaseId || false;
    if (activeProjectId && hasDatabaseId) {
      const result = await uploadFrameImage(frameId, imageData);
      if (result && result.success) {
        updateSlideData({
          frameImages: updatedFrameImages,
          frameMeta: {
            ...currentFrameMeta,
            [frameId]: {
              filePath: result.filePath,
              url: result.url,
              width: result.width,
              height: result.height,
              aspectRatio: result.aspectRatio
            }
          }
        });
      }
    }
  };

  const handleImageRemove = async (frameId) => {
    const filePath = frameMeta[frameId]?.filePath;
    if (filePath && activeProjectId) {
      await deleteFrameImage(frameId, filePath);
    }
    const newFrameImages = { ...frameImages };
    const newFrameMeta = { ...frameMeta };
    delete newFrameImages[frameId];
    delete newFrameMeta[frameId];
    updateSlideData({ frameImages: newFrameImages, frameMeta: newFrameMeta });
  };

  const handleFrameLayoutChange = (layout) => {
    setFrameLayout(layout);
    updateSlideData({ frameLayout: layout });
  };

  // Helper function to handle both mouse and touch events
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Expose method to sync current state positions to DOM for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  // Load slide data from backend when component mounts
  useEffect(() => {
    const loadSlideData = async () => {
      if (!currentProjectId || !slideId) {
        return;
      }

      try {
        const result = await slideApiService.getSlideContent(currentProjectId, slideId);

        // Load field positions if they exist
        if (result.field_positions && Object.keys(result.field_positions).length > 0 && setFieldPositions) {
          setFieldPositions(prev => ({
            ...prev,
            ...result.field_positions
          }));
        }

        // Load nearest fire station content if it exists
        if (result.content && result.content.nearestFireStationData && setFormData) {
          const nearestFireStationData = result.content.nearestFireStationData;

          // Only load if we have actual form data
          const hasFormData = Object.keys(nearestFireStationData).some(key =>
            nearestFireStationData[key] && nearestFireStationData[key].toString().trim() !== ''
          );

          if (hasFormData) {
            setFormData(prev => ({
              ...prev,
              ...nearestFireStationData
            }));
          }
        }
      } catch (error) {
        // Silently handle errors for draft projects
      }
    };

    loadSlideData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideId, currentProjectId]);

  const handleChange = (field, value) => {
    if (setFormData) {
      const actualField = multipleLocationsMode ? `${field}_loc${selectedLocationIndex}` : field;
      setFormData({ ...formData, [actualField]: value || "" }); // Ensure value is always a string
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
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const zoomFactor = (zoomLevel || 100) / 100;
    
    const coords = getEventCoordinates(e);
    setResizeStart({
      x: (coords.clientX - containerRect.left) / zoomFactor,
      y: (coords.clientY - containerRect.top) / zoomFactor,
      width: rect.width / zoomFactor,
      height: rect.height / zoomFactor,
    });
  };

  const handleResizeMouseMove = (e) => {
    if (!isResizing || !resizingField || !containerRef.current) return;

    e.preventDefault();
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const zoomFactor = (zoomLevel || 100) / 100;
    
    const coords = getEventCoordinates(e);
    const currentX = (coords.clientX - containerRect.left) / zoomFactor;
    const currentY = (e.clientY - containerRect.top) / zoomFactor;
    
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    
    // Update dimensions based on resize mode
    if (resizeMode.includes('right')) {
      newWidth = Math.max(300, resizeStart.width + (currentX - resizeStart.x));
    }
    if (resizeMode.includes('left')) {
      newWidth = Math.max(300, resizeStart.width - (currentX - resizeStart.x));
    }
    if (resizeMode.includes('bottom')) {
      newHeight = Math.max(60, resizeStart.height + (currentY - resizeStart.y));
    }
    if (resizeMode.includes('top')) {
      newHeight = Math.max(60, resizeStart.height - (currentY - resizeStart.y));
    }
    
    // Update field positions with new dimensions
    if (setFieldPositions && fieldPositions) {
      const actualField = multipleLocationsMode ? `${resizingField}_loc${selectedLocationIndex}` : resizingField;
      const existingField = fieldPositions[actualField] || {};
      const updatedPositions = {
        ...fieldPositions,
        [actualField]: {
          ...existingField,
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

  // Note: Auto-save removed - Editor.jsx handles centralized saving via projectSaveService
  // This eliminates redundant API calls and prevents rate limiting issues

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
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Account for zoom level when calculating offset
    const zoomFactor = (zoomLevel || 100) / 100;
    
    // Calculate offset from cursor to field container's position relative to main container
    const coords = getEventCoordinates(e);
    setDragOffset({
      x: (coords.clientX - fieldRect.left) / zoomFactor,
      y: (coords.clientY - fieldRect.top) / zoomFactor,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && draggingField && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Account for zoom level when calculating new position
      const zoomFactor = (zoomLevel || 100) / 100;
      
      // Calculate new field position maintaining the original offset
      const coords = getEventCoordinates(e);
      const newLeft = (coords.clientX - containerRect.left) / zoomFactor - dragOffset.x;
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
      if (isDragging && draggingField && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Account for zoom level when calculating new position
        const zoomFactor = (zoomLevel || 100) / 100;
        
        // Calculate new field position maintaining the original offset
        const coords = getEventCoordinates(e);
      const newLeft = (coords.clientX - containerRect.left) / zoomFactor - dragOffset.x;
        const newTop = (e.clientY - containerRect.top) / zoomFactor - dragOffset.y;
        
        if (setFieldPositions) {
          // Use location-aware field key for positioning
          const actualFieldKey = multipleLocationsMode ? `${draggingField}_loc${selectedLocationIndex}` : draggingField;
          const existingField = fieldPositions?.[actualFieldKey] || {};
          setFieldPositions({
            ...(fieldPositions || {}),
            [actualFieldKey]: {
              ...existingField,
              top: Math.max(0, newTop),
              left: Math.max(0, Math.min(newLeft, 1000)), // Keep within reasonable bounds
              // Ensure width and height are preserved for saving
              width: existingField.width || 500,
              height: existingField.height || 80,
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
  }, [isDragging, draggingField, dragOffset, zoomLevel, fieldPositions, setFieldPositions, containerRef]);

  // Render simple text field for premise location (bottom right, like other slides)
  const renderSimpleField = (field, placeholder) => {
    const isActive = selectedField === field;
    const defaultPosition = { top: 670, right: 1.2 };
    const position = (fieldPositions && fieldPositions[field]) || defaultPosition;

    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120));

    return (
      <textarea
        key={field}
        value={formData[field] || ""}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        onFocus={() => onSelect(field)}
        placeholder={placeholder}
        style={{
          position: "absolute",
          width: `${estimatedWidth}px`,
          background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
          border: isActive ? "2px solid rgba(0,0,0,0.3)" : "2px solid transparent",
          borderRadius: "4px",
          fontSize: "28px",
          fontFamily: "'Montserrat', sans-serif",
          textAlign: "right",
          resize: "none",
          color: "#8B9A5B",
          padding: "4px 0px 4px 8px",
          outline: "none",
          whiteSpace: "nowrap",
          top: `${position.top}px`,
          right: `${position.right}%`,
        }}
      />
    );
  };

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
          zIndex: 1000, // Ensure text fields are above images
        }}
      >
        {/* Drag handle (bullet point) */}
        <span 
          onMouseDown={(e) => handleFieldMouseDown(e, field)}
          onTouchStart={(e) => handleFieldMouseDown(e, field)}
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
        
        {/* Toolbar - only show when active */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              top: "-36px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "4px",
              padding: "4px 8px",
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #ccc",
              borderRadius: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1001,
            }}
          >
            {/* Drag Handle Button */}
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                handleFieldMouseDown(e, field);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                handleFieldMouseDown(e, field);
              }}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#6c757d",
                color: "white",
                border: "none",
                fontSize: "14px",
                cursor: "move",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              title="Drag to move"
            >
              ⋮⋮
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Remove the field data and position using location-aware keys
                const actualFieldKey = multipleLocationsMode ? `${field}_loc${selectedLocationIndex}` : field;
                if (setFormData) {
                  setFormData({ ...formData, [actualFieldKey]: "" });
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
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#dc3545",
                color: "white",
                border: "none",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              title="Delete"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Free-form textbox for fire station info */}
        <div style={{ position: "relative", width: "fit-content", height: "fit-content" }}>
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
                  setFormData({ ...formData, [fieldKey]: "" });
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
              resize: "none", // Disable default resize, use custom handles
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
          
          {/* Blue resize handles - only show when active */}
          {isActive && (
            <>
              {/* Corner resize handles */}
              <div
                onMouseDown={(e) => handleResizeMouseDown(e, field, 'bottom-right')}
                onTouchStart={(e) => handleResizeMouseDown(e, field, 'bottom-right')}
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  right: "-4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#007bff",
                  cursor: "nw-resize",
                  borderRadius: "2px",
                  zIndex: 1001,
                }}
                title="Resize"
              />
              <div
                onMouseDown={(e) => handleResizeMouseDown(e, field, 'bottom-left')}
                onTouchStart={(e) => handleResizeMouseDown(e, field, 'bottom-left')}
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: "-4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#007bff",
                  cursor: "ne-resize",
                  borderRadius: "2px",
                  zIndex: 1001,
                }}
                title="Resize"
              />
              <div
                onMouseDown={(e) => handleResizeMouseDown(e, field, 'top-right')}
                onTouchStart={(e) => handleResizeMouseDown(e, field, 'top-right')}
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#007bff",
                  cursor: "ne-resize",
                  borderRadius: "2px",
                  zIndex: 1001,
                }}
                title="Resize"
              />
              <div
                onMouseDown={(e) => handleResizeMouseDown(e, field, 'top-left')}
                onTouchStart={(e) => handleResizeMouseDown(e, field, 'top-left')}
                style={{
                  position: "absolute",
                  top: "-4px",
                  left: "-4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#007bff",
                  cursor: "nw-resize",
                  borderRadius: "2px",
                  zIndex: 1001,
                }}
                title="Resize"
              />
            </>
          )}
        </div>
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
      setFormData({ ...formData, [`${field}_loc${selectedLocationIndex}`]: value });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  return (
    <div
      ref={containerRef}
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
        // Handle text field dragging
        if (isDragging && draggingField) {
          handleMouseMove(e);
        }
      }}
      onMouseUp={(e) => {
        // Handle text field dragging/resizing
        if (isDragging) {
          handleMouseUp(e);
        }
      }}
      onTouchMove={(e) => {
        // Handle text field dragging
        if (isDragging && draggingField) {
          handleMouseMove(e);
        }
      }}
      onTouchEnd={(e) => {
        // Handle text field dragging/resizing
        if (isDragging) {
          handleMouseUp(e);
        }
      }}
      onClick={(e) => {
        // Deselect unless clicking on an interactive element (textarea, input, button)
        const tag = e.target.tagName?.toLowerCase();
        if (tag !== 'textarea' && tag !== 'input' && tag !== 'button' && !e.target.closest('.no-deselect')) {
          onSelect(null);
        }
      }}
    >
      {/* First Bullet - Fire Station Name and Address */}
      {renderBulletTextbox('fireStationName', 'Fire station name and full address', 280)}

      {/* Second Bullet - Time and Distance */}
      {renderBulletTextbox('fireStationDistance', 'Travel time and distance (e.g., 5 min / 1.2 miles away)', 380)}

      {/* Premise Location - bottom right */}
      {renderSimpleField("premiseLocation", "www.(source).com/maps(mm/yyyy)")}

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

      {/* Frame layout selector - 2 options */}
      <div
        className="no-export"
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          display: "flex",
          gap: "8px",
          zIndex: 1002,
          background: "rgba(255, 255, 255, 0.95)",
          padding: "8px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {/* Option 1: Single full frame */}
        <button
          onClick={() => handleFrameLayoutChange(1)}
          style={{
            padding: "8px 12px",
            border: frameLayout === 1 ? "2px solid #8B9A5B" : "2px solid #ccc",
            borderRadius: "4px",
            background: frameLayout === 1 ? "#8B9A5B" : "white",
            color: frameLayout === 1 ? "white" : "#666",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontFamily: "'Montserrat', sans-serif",
            transition: "all 0.2s ease",
          }}
          title="Single frame"
        >
          {/* Single frame icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          1
        </button>
        {/* Option 2: Portrait frame on the left */}
        <button
          onClick={() => handleFrameLayoutChange(2)}
          style={{
            padding: "8px 12px",
            border: frameLayout === 2 ? "2px solid #8B9A5B" : "2px solid #ccc",
            borderRadius: "4px",
            background: frameLayout === 2 ? "#8B9A5B" : "white",
            color: frameLayout === 2 ? "white" : "#666",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontFamily: "'Montserrat', sans-serif",
            transition: "all 0.2s ease",
          }}
          title="Portrait frame (left)"
        >
          {/* Portrait left icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1" />
          </svg>
          P
        </button>
      </div>

      {/* Image frames */}
      {frameLayout === 1 ? (
        /* Option 1: Single full frame - same size as other slides */
        <div
          style={{
            position: "absolute",
            top: "108px",
            left: "108px",
            width: "1064px",
            height: "504px",
          }}
        >
          <ImageFrame
            id={1}
            image={frameImages[1]}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            style={{ width: "1064px", height: "504px" }}
          />
        </div>
      ) : (
        /* Option 2: Portrait frame on the left */
        <div
          style={{
            position: "absolute",
            top: "108px",
            left: "108px",
            width: "420px",
            height: "504px",
          }}
        >
          <ImageFrame
            id={1}
            image={frameImages[1]}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            style={{ width: "420px", height: "504px" }}
          />
        </div>
      )}
    </div>
  );
});

NearestFireStation.displayName = 'NearestFireStation';
export default NearestFireStation;
