import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import MultiImageComponent from "../../components/MultiImageComponent";
import slideApiService from "../../services/slideApiService";

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
  slideId = 'fire_hazard_slide',
  currentProjectId,
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingField, setDraggingField] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingField, setResizingField] = useState(null);
  const [resizeMode, setResizeMode] = useState('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const stablePositionsRef = useRef({});
  const containerRef = useRef(null); // For container reference instead of imageHandler

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

  // Update stable positions when fieldPositions prop changes
  useEffect(() => {
    if (fieldPositions) {
      stablePositionsRef.current = { 
        ...stablePositionsRef.current,
        ...fieldPositions 
      };
    }
  }, [fieldPositions]);

  // Auto-resize all textareas when formData changes
  useEffect(() => {
    const textareas = containerRef.current?.querySelectorAll('textarea');
    if (textareas) {
      textareas.forEach(textarea => {
        autoResize(textarea);
      });
    }
  }, [formData, containerRef]);

  // Load slide content and field positions from backend
  useEffect(() => {
    const loadSlideData = async () => {
      if (!slideId || !currentProjectId) {
        // Only warn if currentProjectId is explicitly null after initial load
        // This prevents warnings during normal project loading
        return;
      }

      try {
        const result = await slideApiService.getSlideContent(currentProjectId, slideId);
        
        // Load field positions if they exist
        if (result.field_positions && Object.keys(result.field_positions).length > 0) {
          if (setFieldPositions) {
            setFieldPositions(prev => ({
              ...prev,
              ...result.field_positions
            }));
          }
        }

        // Load fire hazard content if it exists
        if (result.content && setFormData) {
          // Try both nested and direct content structures
          const fireHazardData = result.content.fireHazardData || result.content;
          
          // Only load if we have actual form data (not just structural data)
          const hasFormData = Object.keys(fireHazardData).some(key => 
            !['slide_id', 'slide_type', 'field_positions'].includes(key) && 
            fireHazardData[key] && 
            fireHazardData[key].toString().trim() !== ''
          );
          
          if (hasFormData) {
            console.log('🔄 Loading fire hazard data:', fireHazardData);
            setFormData(prev => ({
              ...prev,
              ...fireHazardData
            }));
          } else {
            console.log('⚠️ No fire hazard form data found in result:', result);
          }
        } else {
          console.log('⚠️ No content found in result:', result);
        }

        console.log('Loaded fire hazard slide data from backend for slide:', slideId);
      } catch (error) {
        console.warn('Failed to load fire hazard slide data from backend:', error);
      }
    };

    loadSlideData();
  }, [slideId, currentProjectId, setFieldPositions, setFormData]);

  // Save field positions to backend when they change
  useEffect(() => {
    const saveDimensions = async () => {
      if (!fieldPositions || Object.keys(fieldPositions).length === 0 || !currentProjectId) {
        return;
      }

      const dimensionsToSave = {};
      Object.entries(fieldPositions).forEach(([field, data]) => {
        // Save if there's any positioning data (not just width/height)
        if (data && (data.top !== undefined || data.left !== undefined || data.width || data.height)) {
          dimensionsToSave[field] = {
            ...(data.width !== undefined && { width: data.width }),
            ...(data.height !== undefined && { height: data.height }),
            ...(data.x !== undefined && { x: data.x }),
            ...(data.y !== undefined && { y: data.y }),
            ...(data.top !== undefined && { top: data.top }),
            ...(data.left !== undefined && { left: data.left })
          };
        }
      });

      if (Object.keys(dimensionsToSave).length > 0) {
        try {
          await slideApiService.updateFieldPositions(currentProjectId, slideId, 'fire_hazard', dimensionsToSave);
          console.log('Saved fire hazard field positions to backend for slide:', slideId);
        } catch (error) {
          console.warn('Failed to save fire hazard field positions to backend:', error);
        }
      }
    };

    const timeoutId = setTimeout(saveDimensions, 5000);
    return () => clearTimeout(timeoutId);
  }, [fieldPositions, slideId, currentProjectId]);

  // Save fire hazard content to backend when formData changes
  useEffect(() => {
    const saveFireHazardContent = async () => {
      if (!formData || !currentProjectId) {
        return;
      }

      try {
        console.log('💾 Saving fire hazard data:', formData);
        await slideApiService.updateFireHazard(currentProjectId, slideId, formData);
        console.log('✅ Saved fire hazard content to backend for slide:', slideId);
      } catch (error) {
        console.error('❌ Failed to save fire hazard content to backend:', error);
      }
    };

    const timeoutId = setTimeout(saveFireHazardContent, 5000); // Longer delay for content to prevent ERR_INSUFFICIENT_RESOURCES
    return () => clearTimeout(timeoutId);
  }, [formData, slideId, currentProjectId]);

  const handleChange = (field, value) => {
    if (setFormData) {
      const stringValue = String(value || "");
      console.log(`🔄 FireHazard updating field ${field} with value:`, stringValue);
      setFormData(prev => ({ ...prev, [field]: stringValue }));
    }
  };

  const autoResize = (el) => {
    el.style.height = "auto"; 
    el.style.height = el.scrollHeight + "px"; 
  };

  // Drag functionality - same as Comments
  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDraggingField(field);
    
    const fieldContainer = e.currentTarget.tagName === 'TEXTAREA' 
      ? e.currentTarget.parentElement 
      : e.currentTarget;
    const fieldRect = fieldContainer.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const zoomFactor = (zoomLevel || 100) / 100;
    
    const coords = getEventCoordinates(e);
    setDragOffset({
      x: (coords.clientX - fieldRect.left) / zoomFactor,
      y: (coords.clientY - fieldRect.top) / zoomFactor,
    });
  };

  // Resize functionality - same as Comments
  const handleResizeMouseDown = (e, field, mode) => {
    e.stopPropagation();
    e.preventDefault();
    
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

  const handleMouseMove = (e) => {
    if (isDragging && draggingField && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const zoomFactor = (zoomLevel || 100) / 100;
      
      const coords = getEventCoordinates(e);
      const newLeft = (coords.clientX - containerRect.left) / zoomFactor - dragOffset.x;
      const newTop = (coords.clientY - containerRect.top) / zoomFactor - dragOffset.y;
      
      if (setFieldPositions) {
        const existingField = fieldPositions?.[draggingField] || {};
        const stableField = stablePositionsRef.current[draggingField] || {};
        const newPosition = {
          ...existingField,
          ...stableField,
          top: Math.max(0, newTop),
          left: Math.max(0, Math.min(newLeft, 1000)),
          // Ensure width and height are preserved for saving
          width: existingField.width || stableField.width || 400,
          height: existingField.height || stableField.height || 80,
        };
        
        stablePositionsRef.current[draggingField] = newPosition;
        
        setFieldPositions({
          ...(fieldPositions || {}),
          [draggingField]: newPosition
        });
      }
    } else if (isResizing && resizingField && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const zoomFactor = (zoomLevel || 100) / 100;
      
      const coords = getEventCoordinates(e);
      const currentX = (coords.clientX - containerRect.left) / zoomFactor;
      const currentY = (coords.clientY - containerRect.top) / zoomFactor;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      
      if (resizeMode.includes('right')) {
        newWidth = Math.max(200, resizeStart.width + (currentX - resizeStart.x));
      }
      if (resizeMode.includes('left')) {
        newWidth = Math.max(200, resizeStart.width - (currentX - resizeStart.x));
      }
      if (resizeMode.includes('bottom')) {
        newHeight = Math.max(60, resizeStart.height + (currentY - resizeStart.y));
      }
      if (resizeMode.includes('top')) {
        newHeight = Math.max(60, resizeStart.height - (currentY - resizeStart.y));
      }
      
      if (setFieldPositions) {
        const existingField = fieldPositions?.[resizingField] || {};
        const updatedField = {
          ...existingField,
          width: newWidth,
          height: newHeight
        };
        
        stablePositionsRef.current[resizingField] = updatedField;
        
        setFieldPositions({
          ...(fieldPositions || {}),
          [resizingField]: updatedField
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggingField && fieldPositions?.[draggingField]) {
      stablePositionsRef.current[draggingField] = fieldPositions[draggingField];
    }
    
    setIsDragging(false);
    setDraggingField(null);
    setIsResizing(false);
    setResizingField(null);
    setResizeMode('');
  };

  // Document event listeners for dragging and resizing - same as Comments
  useEffect(() => {
    const handleDocumentMouseMove = (e) => {
      if ((isDragging || isResizing) && containerRef.current) {
        handleMouseMove(e);
        e.preventDefault();
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDragging || isResizing) {
        handleMouseUp();
      }
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
      };
    }
  }, [isDragging, isResizing, draggingField, resizingField, dragOffset, resizeStart, zoomLevel, fieldPositions, setFieldPositions]);

  // Render bullet text field with Comments-style drag and resize
  const renderBulletTextbox = (field, content, defaultTop = 200) => {
    const isActive = selectedField === field;
    
    const propsField = fieldPositions?.[field] || {};
    const stableField = stablePositionsRef.current[field] || {};
    const mergedField = { ...propsField, ...stableField };
    
    const position = {
      top: mergedField.top ?? defaultTop,
      left: mergedField.left ?? 150,
      width: mergedField.width ?? 400,
      height: mergedField.height ?? 80,
      ...mergedField
    };
    
    return (
      <div
        key={field}
        style={{
          position: "absolute",
          top: position.top,
          left: position.left,
          width: position.width + 30, // Add space for bullet
          height: position.height,
          zIndex: 1000, // Ensure text fields are above images
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (bullet point) - positioned absolutely, hidden in print/export */}
        <span 
          onMouseDown={(e) => handleFieldMouseDown(e, field)}
          onTouchStart={(e) => handleFieldMouseDown(e, field)}
          className="no-print-bullet"
          style={{
            position: "absolute",
            left: "-20px",
            top: "12px",
            color: "#8B9A5B",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: fontSizes[field] || 35,
            fontWeight: "bold",
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
              if (setFormData) {
                setFormData({ ...formData, [field]: "" });
              }
              if (setFieldPositions) {
                const updatedPositions = { ...(fieldPositions || {}) };
                delete updatedPositions[field];
                setFieldPositions(updatedPositions);
              }
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
        
        {/* Text field container with resize handles */}
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <textarea
            className="resizable-textarea"
            data-field={field}
            value={formData?.[field] || ""}
            onChange={(e) => handleChange(field, e.target.value)}
            onInput={(e) => autoResize(e.target)}
            placeholder={content}
            onFocus={() => {
              if (selectedField !== field) {
                onSelect(field);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseMove={(e) => {
              if (selectedField === field) {
                const rect = e.target.getBoundingClientRect();
                const coords = getEventCoordinates(e);
                const clickX = coords.clientX - rect.left;
                const clickY = coords.clientY - rect.top;
                const borderThickness = 8;
                
                const isOnLeftEdge = clickX <= borderThickness;
                const isOnRightEdge = clickX >= rect.width - borderThickness;
                const isOnTopEdge = clickY <= borderThickness;
                const isOnBottomEdge = clickY >= rect.height - borderThickness;
                
                if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
                  e.target.style.cursor = "move";
                } else {
                  e.target.style.cursor = "text";
                }
              }
            }}
            onMouseDown={(e) => {
              if (selectedField === field) {
                const rect = e.target.getBoundingClientRect();
                const coords = getEventCoordinates(e);
                const clickX = coords.clientX - rect.left;
                const clickY = coords.clientY - rect.top;
                const borderThickness = 8;
                
                const isOnLeftEdge = clickX <= borderThickness;
                const isOnRightEdge = clickX >= rect.width - borderThickness;
                const isOnTopEdge = clickY <= borderThickness;
                const isOnBottomEdge = clickY >= rect.height - borderThickness;
                
                if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
                  e.preventDefault();
                  handleFieldMouseDown(e, field);
                }
              }
            }}
            onTouchStart={(e) => {
              if (selectedField === field) {
                const rect = e.target.getBoundingClientRect();
                const coords = getEventCoordinates(e);
                const clickX = coords.clientX - rect.left;
                const clickY = coords.clientY - rect.top;
                const borderThickness = 8;
                
                const isOnLeftEdge = clickX <= borderThickness;
                const isOnRightEdge = clickX >= rect.width - borderThickness;
                const isOnTopEdge = clickY <= borderThickness;
                const isOnBottomEdge = clickY >= rect.height - borderThickness;
                
                if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
                  e.preventDefault();
                  handleFieldMouseDown(e, field);
                }
              }
            }}
            style={{
              width: `${position.width}px`,
              height: `${position.height}px`,
              minWidth: "200px",
              minHeight: "60px",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: fontSizes[field] || 35,
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
              resize: "none", // Disable default resize, use custom handles
              cursor: "text",
            }}
          />
          
          {/* Resize handles - only show when active */}
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


  return (
    <div
      ref={containerRef}
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
        // Handle text field dragging/resizing
        handleMouseMove(e);
      }}
      onMouseUp={(e) => {
        // Handle text field dragging/resizing
        handleMouseUp(e);
      }}
      onTouchMove={(e) => {
        // Handle text field dragging/resizing
        handleMouseMove(e);
      }}
      onTouchEnd={(e) => {
        // Handle text field dragging/resizing
        handleMouseUp(e);
      }}
      onClick={(e) => {
        
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {/* CSS for hiding bullets during print/export */}
      <style>
        {`
          @media print, screen and (min-resolution: 300dpi) {
            .no-print-bullet {
              display: none !important;
            }
          }
          
          /* Hide bullets when parent has export class */
          .export-mode .no-print-bullet {
            display: none !important;
          }
        `}
      </style>

      {/* Fire Hazard Bullets - only show if they have content */}
      {formData && formData.notWithinFireZone && renderBulletTextbox('notWithinFireZone', 'The property is not within the fire severity zone.', 300)}
      {formData && formData.veryHighFireZone && renderBulletTextbox('veryHighFireZone', 'The property is within the Very High fire severity zone.', 350)}
      {formData && formData.highFireZone && renderBulletTextbox('highFireZone', 'The property is within the high fire severity zone.', 400)}
      {formData && formData.moderateFireZone && renderBulletTextbox('moderateFireZone', 'The property is within the moderate fire severity zone.', 450)}
      
      {/* Dynamic Custom Fire Hazard textboxes */}
      {formData && Object.keys(formData).filter(key => key.startsWith('customFire_')).map((key) => (
        renderBulletTextbox(key, formData[key], 500)
      ))}

      {/* Image Component for paste functionality */}
      <MultiImageComponent
        images={slideData?.images || []}
        onUpdateImages={async (updatedImages) => {
          if (updateSlideData) {
            await updateSlideData({ images: updatedImages });
          }
        }}
        zoomLevel={zoomLevel}
        isActiveSlide={isActiveSlide}
      />
    </div>
  );
});

FireHazard.displayName = 'FireHazard';
export default FireHazard;
