import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import MultiImageComponent from "../../components/MultiImageComponent";
import slideApiService from "../../services/slideApiService";
import CommentBuilderPopup from "../../components/CommentBuilderPopup";

const Comments = forwardRef(({
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
  slideId = 'comments_slide',
  currentProjectId,
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingField, setDraggingField] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingField, setResizingField] = useState(null);
  const [resizeMode, setResizeMode] = useState('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingText, setEditingText] = useState('');

  const stablePositionsRef = useRef({});
  const containerRef = useRef(null); // For container reference instead of imageHandler

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

  // Load slide data from backend when component mounts or projectId changes
  useEffect(() => {
    const loadSlideData = async () => {
      if (!currentProjectId) {
        // Only warn if currentProjectId is explicitly null after initial load
        // This prevents warnings during normal project loading
        return;
      }

      try {
        const result = await slideApiService.getSlideContent(currentProjectId, 'comments_slide');
        
        // Load field positions if they exist
        if (result.field_positions && Object.keys(result.field_positions).length > 0) {
          console.log('🔄 Comments: Loading positions from backend:', Object.keys(result.field_positions), result.field_positions);
          // Update both the state and the stable ref with defensive checks
          stablePositionsRef.current = {
            ...stablePositionsRef.current,
            ...result.field_positions
          };
          
          // Only update field positions if the function exists and component is still mounted
          if (setFieldPositions && typeof setFieldPositions === 'function') {
            try {
              // Use a timeout to avoid React error #185 with rapid state updates
              setTimeout(() => {
                setFieldPositions(prev => {
                  // Defensive check to ensure prev is an object
                  const safePrev = prev && typeof prev === 'object' ? prev : {};
                  const newPositions = {
                    ...safePrev,
                    ...result.field_positions
                  };
                  console.log('🔄 Comments: Updated field positions state:', Object.keys(newPositions));
                  return newPositions;
                });
              }, 50);
            } catch (error) {
              console.warn('Failed to update field positions:', error);
            }
          }
        } else {
          console.log('📋 Comments: No field positions found in backend response');
        }

        // Load comments content if it exists
        if (result.content && result.content.comments && setFormData && typeof setFormData === 'function') {
          try {
            // Use a timeout to avoid React error #185 with rapid state updates
            setTimeout(() => {
              setFormData(prev => {
                // Defensive check to ensure prev is an object
                const safePrev = prev && typeof prev === 'object' ? prev : {};
                return {
                  ...safePrev,
                  ...result.content.comments
                };
              });
            }, 100);
          } catch (error) {
            console.warn('Failed to update form data:', error);
          }
        }

      } catch (error) {
        console.warn('Failed to load slide data from backend:', error);
      }
    };

    loadSlideData();
  }, [currentProjectId]); // Add dependency array

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
          console.log(`📐 Comments: Preparing to save field "${field}":`, dimensionsToSave[field]);
        }
      });

      console.log('📐 Comments: Total fields to save:', Object.keys(dimensionsToSave).length, Object.keys(dimensionsToSave));

      if (Object.keys(dimensionsToSave).length > 0) {
        try {
          console.log('💾 Comments: Saving field positions to backend:', dimensionsToSave);
          await slideApiService.updateFieldPositions(currentProjectId, 'comments_slide', 'comments', dimensionsToSave);
        } catch (error) {
          console.warn('Comments: Failed to save field positions to backend:', error);
        }
      } else {
        console.log('Comments: No field positions to save - fieldPositions:', fieldPositions);
      }
    };

    const timeoutId = setTimeout(saveDimensions, 2000);
    return () => clearTimeout(timeoutId);
  }, [fieldPositions, slideId, currentProjectId]);

  // Save comments content to backend when formData changes
  useEffect(() => {
    const saveComments = async () => {
      if (!formData || !currentProjectId) {
        return;
      }

      try {
        await slideApiService.updateComments(currentProjectId, 'comments_slide', formData);
      } catch (error) {
        console.warn('Failed to save comments content to backend:', error);
      }
    };

    const timeoutId = setTimeout(saveComments, 5000); // Longer delay for content to prevent ERR_INSUFFICIENT_RESOURCES
    return () => clearTimeout(timeoutId);
  }, [formData, slideId, currentProjectId]);

  const handleChange = (field, value) => {
    if (setFormData) {
      const stringValue = String(value || "");
      setFormData({ ...formData, [field]: stringValue });
      
      // Sync premise location with SlideOne (like the original implementation)
      if (field === 'premiseLocation') {
        // This will sync with SlideOne's premise location
        setFormData(prev => ({ ...prev, premiseLocation: stringValue }));
      }
    }
  };

  const autoResize = (el) => {
    el.style.height = "auto"; 
    el.style.height = el.scrollHeight + "px"; 
  };

  // Get touch or mouse coordinates
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Drag functionality - supports both mouse and touch
  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!containerRef.current) {
      return;
    }
    
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

  // Resize functionality - similar to image resize handles
  const handleResizeMouseDown = (e, field, mode) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!containerRef.current) {
      return;
    }
    
    setIsResizing(true);
    setResizingField(field);
    setResizeMode(mode);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const zoomFactor = (zoomLevel || 100) / 100;
    const coords = getEventCoordinates(e);
    
    // Store the current field dimensions from our position state
    const currentField = fieldPositions?.[field] || stablePositionsRef.current[field] || {};
    
    setResizeStart({
      x: (coords.clientX - containerRect.left) / zoomFactor,
      y: (coords.clientY - containerRect.top) / zoomFactor,
      width: currentField.width || 400,
      height: currentField.height || 80,
      originalTop: currentField.top || 200,
      originalLeft: currentField.left || 150
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
      let newTop = resizeStart.originalTop;
      let newLeft = resizeStart.originalLeft;
      
      if (resizeMode.includes('right')) {
        newWidth = Math.max(200, resizeStart.width + (currentX - resizeStart.x));
      }
      if (resizeMode.includes('left')) {
        const widthDelta = resizeStart.x - currentX;
        newWidth = Math.max(200, resizeStart.width + widthDelta);
        newLeft = Math.max(0, resizeStart.originalLeft - widthDelta);
      }
      if (resizeMode.includes('bottom')) {
        newHeight = Math.max(60, resizeStart.height + (currentY - resizeStart.y));
      }
      if (resizeMode.includes('top')) {
        const heightDelta = resizeStart.y - currentY;
        newHeight = Math.max(60, resizeStart.height + heightDelta);
        newTop = Math.max(0, resizeStart.originalTop - heightDelta);
      }
      
      if (setFieldPositions) {
        const existingField = fieldPositions?.[resizingField] || stablePositionsRef.current[resizingField] || {};
        const updatedField = {
          ...existingField,
          width: newWidth,
          height: newHeight,
          top: newTop,
          left: newLeft
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
    if (isResizing && resizingField && fieldPositions?.[resizingField]) {
      stablePositionsRef.current[resizingField] = fieldPositions[resizingField];
    }
    
    setIsDragging(false);
    setDraggingField(null);
    setIsResizing(false);
    setResizingField(null);
    setResizeMode('');
  };

  // Handle right-click to edit compiled comments
  const handleContextMenu = (e, field) => {
    // Only allow right-click editing for compiled, custom, and interior comments
    if (field.startsWith('compiled_') || field.startsWith('custom_') || field.startsWith('interiorView_')) {
      e.preventDefault();
      e.stopPropagation();
      setEditingField(field);
      setEditingText(formData?.[field] || '');
      setIsEditPopupOpen(true);
    }
  };

  // Save edited text from popup
  const handleSaveEdit = (editedText) => {
    if (editingField && setFormData) {
      setFormData({
        ...formData,
        [editingField]: editedText
      });
    }
    setEditingField(null);
    setEditingText('');
  };

  // Document event listeners for dragging and resizing (mouse and touch)
  useEffect(() => {
    const handleDocumentMouseMove = (e) => {
      if ((isDragging || isResizing) && containerRef.current) {
        handleMouseMove(e);
        e.preventDefault();
      }
    };

    const handleDocumentTouchMove = (e) => {
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

    const handleDocumentTouchEnd = () => {
      if (isDragging || isResizing) {
        handleMouseUp();
      }
    };
    
    if (isDragging || isResizing) {
      // Mouse events
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      
      // Touch events - fix passive listener issue
      document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
      document.addEventListener('touchend', handleDocumentTouchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('touchmove', handleDocumentTouchMove);
        document.removeEventListener('touchend', handleDocumentTouchEnd);
      };
    }
  }, [isDragging, isResizing, draggingField, resizingField, dragOffset, resizeStart, zoomLevel, fieldPositions, setFieldPositions]);

  // Render bullet text field with SlideOne-style drag and resize
  const renderBulletTextField = (field, placeholder, defaultTop = 200) => {
    const isActive = selectedField === field;
    
    // Use stablePositionsRef as the primary source of truth, fallback to fieldPositions
    const stableField = stablePositionsRef.current[field] || {};
    const propsField = fieldPositions?.[field] || {};
    const mergedField = { ...propsField, ...stableField };
    
    // Use one-line height (50px) for new fields, fallback to 80px for existing fields
    const defaultHeight = (mergedField.height === undefined && formData?.[field] && formData[field].length < 50) ? 50 : 80;
    
    
    const position = {
      top: mergedField.top ?? defaultTop,
      left: mergedField.left ?? 150,
      width: mergedField.width ?? 400,
      height: mergedField.height ?? defaultHeight,
    };
    
    
    return (
      <div
        key={field}
        style={{
          position: "absolute",
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          zIndex: 1000, // Ensure text fields are above images
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

            {/* Duplicate Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (setFormData && fieldPositions) {
                  // Create new key with timestamp
                  const prefix = field.startsWith('compiled_') ? 'compiled_' :
                                 field.startsWith('custom_') ? 'custom_' :
                                 field.startsWith('interiorView_') ? 'interiorView_' : '';

                  if (prefix) {
                    const newKey = `${prefix}${Date.now()}`;
                    const currentPosition = fieldPositions[field] || position;

                    // Copy content
                    setFormData({
                      ...formData,
                      [newKey]: formData[field]
                    });

                    // Copy position with slight offset
                    if (setFieldPositions) {
                      setFieldPositions({
                        ...fieldPositions,
                        [newKey]: {
                          top: currentPosition.top + 20,
                          left: currentPosition.left + 20,
                          width: currentPosition.width,
                          height: currentPosition.height
                        }
                      });
                    }

                    // Select the new field
                    setTimeout(() => onSelect(newKey), 50);
                  }
                }
              }}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#007bff",
                color: "white",
                border: "none",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              title="Duplicate"
            >
              ⎘
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (setFormData) {
                  // For dynamic fields (compiled, custom, interiorView), remove the key entirely
                  if (field.startsWith('compiled_') || field.startsWith('custom_') || field.startsWith('interiorView_')) {
                    const updatedFormData = { ...formData };
                    delete updatedFormData[field];
                    setFormData(updatedFormData);
                  } else {
                    // For standard fields, just empty the value
                    setFormData({ ...formData, [field]: "" });
                  }
                }

                // Remove from fieldPositions
                if (setFieldPositions) {
                  const updatedPositions = { ...(fieldPositions || {}) };
                  delete updatedPositions[field];
                  setFieldPositions(updatedPositions);
                }

                // Also remove from stablePositionsRef
                if (stablePositionsRef.current[field]) {
                  delete stablePositionsRef.current[field];
                }

                onSelect(null);
              }}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#dc3545",
                color: "white",
                border: "none",
                fontSize: "16px",
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

        {/* Text field container with resize handles */}
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <textarea
            className="resizable-textarea"
            data-field={field}
            value={formData?.[field] || ""}
            onChange={(e) => handleChange(field, e.target.value)}
            onInput={(e) => autoResize(e.target)}
            placeholder={placeholder}
            onFocus={() => {
              console.log('Textarea focused, selecting field:', field);
              if (selectedField !== field) {
                onSelect(field);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => handleContextMenu(e, field)}
            onMouseMove={(e) => {
              if (selectedField === field) {
                const rect = e.target.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
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
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
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

  // Render standard field (like premiseLocation, websiteInfo) with SlideOne style
  const renderField = (field, placeholder, additionalStyles = {}) => {
    const defaultFieldPositions = {
      websiteInfo: { top: 630, right: 1.2 }, // 5% higher than premise location
      premiseLocation: { top: 670, right: 1.2 },
    };

    const position = fieldPositions?.[field] || defaultFieldPositions[field];
    const isActive = selectedField === field;

    const textContent = (formData && formData[field]) || placeholder;
    const calculatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120));
    const finalWidth = position?.width || calculatedWidth;
    const finalHeight = position?.height;

    return (
      <div
        key={field}
        style={{
          position: "absolute",
          ...(position?.bottom !== undefined 
            ? { bottom: `${position.bottom}px` }
            : { top: `${position?.top || defaultFieldPositions[field]?.top}px` }),
          ...(position?.right !== undefined 
            ? { right: `${position.right}px` }
            : position?.left !== undefined
            ? { left: `${position.left}px` }
            : { right: `${defaultFieldPositions[field]?.right}%` }),
          zIndex: isActive ? 1001 : 1000, // Ensure div wrapper is above images
        }}
      >
        <textarea
          value={formData?.[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          onInput={(e) => autoResize(e.target)}
          placeholder={placeholder}
          onFocus={() => {
            if (selectedField !== field) {
              onSelect(field);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseMove={(e) => {
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
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
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
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
            width: `${finalWidth}px`,
            ...(finalHeight && { height: `${finalHeight}px` }),
            background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
            border: isActive
              ? "2px solid rgba(0,0,0,0.3)"
              : "2px solid transparent",
            borderRadius: "4px",
            fontSize: "28px",
            fontFamily: "'Montserrat', sans-serif",
            textAlign: "right",
            color: "#8B9A5B",
            padding: "4px 0px 4px 8px",
            outline: "none",
            whiteSpace: "nowrap",
            cursor: "text",
            resize: "none",
            zIndex: isActive ? 1001 : 1000, // Ensure text fields are above images
            ...additionalStyles,
          }}
        />
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
        background: "url('/Template/Template-06.png') center/100% 100% no-repeat",
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
      onClick={(e) => {
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
      {/* Comment Bullets - only show if they have content */}
      {formData && formData.fireHydrantWithin && renderBulletTextField('fireHydrantWithin', 'The nearest fire hydrant is within the premise.', 300)}
      {formData && formData.fireHydrantAway && renderBulletTextField('fireHydrantAway', 'The nearest fire hydrant is (distance) away from the premise.', 350)}
      {formData && formData.matureTree && renderBulletTextField('matureTree', 'There is a mature tree beside the premise.', 400)}
      {formData && formData.handrailsStairs && renderBulletTextField('handrailsStairs', 'The premise has handrails for stairs.', 450)}
      {formData && formData.guardRailsBalcony && renderBulletTextField('guardRailsBalcony', 'The premise has guard rails for the balcony.', 500)}
      {formData && formData.handrailsGuardRails && renderBulletTextField('handrailsGuardRails', 'The premise has handrails for stairs and guard rails for the balcony.', 550)}
      {formData && formData.pwdProvisions && renderBulletTextField('pwdProvisions', 'The premise has PWD provisions (parking, ramp, etc.).', 600)}
      {formData && formData.cctvCameras && renderBulletTextField('cctvCameras', 'There are CCTV cameras present on the property.', 300)}
      {formData && formData.poolGateFence && renderBulletTextField('poolGateFence', 'There is a gate and fence around the pool.', 350)}
      {formData && formData.vandalism && renderBulletTextField('vandalism', 'There are no visible vandalism on the premise and its surroundings.', 400)}
      
      {/* Dynamic Interior View textboxes */}
      {formData && Object.keys(formData).filter(key => key.startsWith('interiorView_')).map((key) => (
        renderBulletTextField(key, formData[key], 300)
      ))}
      
      {/* Dynamic Custom Comment textboxes */}
      {formData && Object.keys(formData).filter(key => key.startsWith('custom_')).map((key) => (
        renderBulletTextField(key, formData[key], 300)
      ))}

      {/* Dynamic Compiled Comment textboxes */}
      {formData && Object.keys(formData).filter(key => key.startsWith('compiled_')).map((key) => (
        renderBulletTextField(key, formData[key], 300)
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
      
      {/* Location and Website at bottom right */}
      {renderField('premiseLocation', 'Premise Location')}
      {renderField('websiteInfo', 'www.(source).com/(source) — (mm/yyyy)')}

      {/* Edit Comment Popup */}
      <CommentBuilderPopup
        isOpen={isEditPopupOpen}
        onClose={() => {
          setIsEditPopupOpen(false);
          setEditingField(null);
          setEditingText('');
        }}
        initialText={editingText}
        onSave={handleSaveEdit}
        title="Edit Comment"
      />
    </div>
  );
});

Comments.displayName = 'Comments';
export default Comments;