import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useImageHandler } from "../../hooks/useImageHandler";
import ImageComponent from "../../components/ImageComponent";

// Backend API functions for textbox dimensions
const saveTextboxDimensions = async (slideId, fieldDimensions) => {
  try {
    const response = await fetch('http://localhost:8000/api/textbox-dimensions/save/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slide_id: slideId,
        field_dimensions: fieldDimensions
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to save textbox dimensions:', error);
    throw error;
  }
};

const getTextboxDimensions = async (slideId) => {
  try {
    console.log('Fetching dimensions for slide:', slideId);
    
    if (!slideId) {
      console.warn('No slideId provided to getTextboxDimensions');
      return { field_dimensions: {} };
    }

    // Use the Django backend URL
    const url = `http://localhost:8000/api/textbox-dimensions/${slideId}/`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Received dimensions:', result);
    return result;
  } catch (error) {
    console.error('Failed to get textbox dimensions:', error);
    // Return empty dimensions but don't fail completely
    return { field_dimensions: {} };
  }
};

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
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingField, setDraggingField] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingField, setResizingField] = useState(null);
  const [resizeMode, setResizeMode] = useState('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const stablePositionsRef = useRef({});
  const imageHandler = useImageHandler(slideData, updateSlideData, zoomLevel, isActiveSlide, 'aerial');

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

  // Load textbox dimensions from backend on component mount
  useEffect(() => {
    const loadDimensions = async () => {
      if (!slideId) {
        console.log('No slideId provided, skipping dimension load');
        return;
      }

      // Add a small delay to prevent rapid repeated calls
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const result = await getTextboxDimensions(slideId);
        if (result.field_dimensions && Object.keys(result.field_dimensions).length > 0) {
          if (setFieldPositions) {
            setFieldPositions(prev => ({
              ...prev,
              ...result.field_dimensions
            }));
          }
        } else {
          console.log('No dimensions found for slide:', slideId);
        }
      } catch (error) {
        console.warn('Failed to load textbox dimensions:', error);
      }
    };

    loadDimensions();
  }, [slideId, setFieldPositions]);

  // Save dimensions to backend when fieldPositions change
  useEffect(() => {
    const saveDimensions = async () => {
      if (!fieldPositions || Object.keys(fieldPositions).length === 0) {
        return;
      }

      const dimensionsToSave = {};
      Object.entries(fieldPositions).forEach(([field, data]) => {
        if (data.width && data.height) {
          dimensionsToSave[field] = {
            width: data.width,
            height: data.height,
            ...(data.x !== undefined && { x: data.x }),
            ...(data.y !== undefined && { y: data.y }),
            ...(data.top !== undefined && { top: data.top }),
            ...(data.left !== undefined && { left: data.left })
          };
        }
      });

      if (Object.keys(dimensionsToSave).length > 0) {
        try {
          await saveTextboxDimensions(slideId, dimensionsToSave);
        } catch (error) {
          console.warn('Failed to save textbox dimensions:', error);
        }
      }
    };

    const timeoutId = setTimeout(saveDimensions, 1000);
    return () => clearTimeout(timeoutId);
  }, [fieldPositions, slideId]);

  const handleChange = (field, value) => {
    if (setFormData) {
      const stringValue = String(value || "");
      setFormData({ [field]: stringValue });
      
      // Sync premise location with SlideOne (like the original implementation)
      if (field === 'premiseLocation') {
        // This will sync with SlideOne's premise location
        setFormData({ premiseLocation: stringValue });
      }
    }
  };

  const autoResize = (el) => {
    el.style.height = "auto"; 
    el.style.height = el.scrollHeight + "px"; 
  };

  // Drag functionality - similar to SlideOne
  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDraggingField(field);
    
    const fieldContainer = e.currentTarget.tagName === 'TEXTAREA' 
      ? e.currentTarget.parentElement 
      : e.currentTarget;
    const fieldRect = fieldContainer.getBoundingClientRect();
    const containerRect = imageHandler.containerRef.current.getBoundingClientRect();
    
    const zoomFactor = (zoomLevel || 100) / 100;
    
    setDragOffset({
      x: (e.clientX - fieldRect.left) / zoomFactor,
      y: (e.clientY - fieldRect.top) / zoomFactor,
    });
  };

  // Resize functionality - similar to image resize handles
  const handleResizeMouseDown = (e, field, mode) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizingField(field);
    setResizeMode(mode);
    
    const fieldElement = e.currentTarget.parentElement.querySelector('textarea');
    const rect = fieldElement.getBoundingClientRect();
    const containerRect = imageHandler.containerRef.current.getBoundingClientRect();
    
    const zoomFactor = (zoomLevel || 100) / 100;
    
    setResizeStart({
      x: (e.clientX - containerRect.left) / zoomFactor,
      y: (e.clientY - containerRect.top) / zoomFactor,
      width: rect.width / zoomFactor,
      height: rect.height / zoomFactor,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && draggingField && imageHandler.containerRef.current) {
      const containerRect = imageHandler.containerRef.current.getBoundingClientRect();
      const zoomFactor = (zoomLevel || 100) / 100;
      
      const newLeft = (e.clientX - containerRect.left) / zoomFactor - dragOffset.x;
      const newTop = (e.clientY - containerRect.top) / zoomFactor - dragOffset.y;
      
      if (setFieldPositions) {
        const existingField = fieldPositions?.[draggingField] || {};
        const stableField = stablePositionsRef.current[draggingField] || {};
        const newPosition = {
          ...existingField,
          ...stableField,
          top: Math.max(0, newTop),
          left: Math.max(0, Math.min(newLeft, 1000)),
        };
        
        stablePositionsRef.current[draggingField] = newPosition;
        
        setFieldPositions({
          ...(fieldPositions || {}),
          [draggingField]: newPosition
        });
      }
    } else if (isResizing && resizingField && imageHandler.containerRef.current) {
      const containerRect = imageHandler.containerRef.current.getBoundingClientRect();
      const zoomFactor = (zoomLevel || 100) / 100;
      
      const currentX = (e.clientX - containerRect.left) / zoomFactor;
      const currentY = (e.clientY - containerRect.top) / zoomFactor;
      
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

  // Document event listeners for dragging and resizing
  useEffect(() => {
    const handleDocumentMouseMove = (e) => {
      if ((isDragging || isResizing) && imageHandler.containerRef.current) {
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

  // Render bullet text field with SlideOne-style drag and resize
  const renderBulletTextField = (field, placeholder, defaultTop = 200) => {
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (bullet point) - positioned absolutely, hidden in print/export */}
        <span 
          onMouseDown={(e) => handleFieldMouseDown(e, field)}
          className="no-print-bullet"
          style={{
            position: "absolute",
            left: "-20px",
            top: "12px",
            color: "#8B9A5B",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: fontSizes[field] || 32,
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
                setFormData({ [field]: "" });
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
            ...additionalStyles,
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
        imageHandler.handleContainerClick(e, onSelect);
        
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
      {formData && formData.pwdProvisions && renderBulletTextField('pwdProvisions', 'The premise has PWD provisions.', 600)}
      {formData && formData.cctvCameras && renderBulletTextField('cctvCameras', 'There are CCTV cameras present on the property.', 300)}
      {formData && formData.poolGateFence && renderBulletTextField('poolGateFence', 'There is a gate and fence around the pool.', 350)}
      {formData && formData.vandalism && renderBulletTextField('vandalism', 'Vandalism is present on the premise.', 400)}
      
      {/* Dynamic Interior View textboxes */}
      {formData && Object.keys(formData).filter(key => key.startsWith('interiorView_')).map((key) => (
        renderBulletTextField(key, formData[key], 300)
      ))}
      
      {/* Dynamic Custom Comment textboxes */}
      {formData && Object.keys(formData).filter(key => key.startsWith('custom_')).map((key) => (
        renderBulletTextField(key, formData[key], 300)
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
      
      {/* Location and Website at bottom right */}
      {renderField('premiseLocation', 'Premise Location')}
      {renderField('websiteInfo', 'www.(source).com/(source) — (mm/yyyy)')}
    </div>
  );
});

Comments.displayName = 'Comments';
export default Comments;