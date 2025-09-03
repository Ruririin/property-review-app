import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useImageHandler } from "../../hooks/useImageHandler";
import ImageComponent from "../../components/ImageComponent";

const Comments = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
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
  const [resizeField, setResizeField] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef(null);
  const { handleImageChange, getImageSrc } = useImageHandler();

  // Expose method to sync positions for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  // Auto-resize function for textareas
  const autoResize = (textarea) => {
    const hasUserDimensions = textarea.getAttribute('data-current-width') || 
                             textarea.getAttribute('data-current-height');
    if (!hasUserDimensions) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  // Handle field changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle field mouse down for dragging
  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDraggingField(field);
    
    const fieldElement = e.currentTarget;
    const fieldRect = fieldElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const zoomFactor = (zoomLevel || 100) / 100;
    
    setDragOffset({
      x: ((e.clientX - fieldRect.left) / zoomFactor),
      y: ((e.clientY - fieldRect.top) / zoomFactor)
    });

    onSelect(field);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && draggingField && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const zoomFactor = (zoomLevel || 100) / 100;
        
        const newLeft = (e.clientX - containerRect.left) / zoomFactor - dragOffset.x;
        const newTop = (e.clientY - containerRect.top) / zoomFactor - dragOffset.y;
        
        // Convert to right positioning for consistency with SlideOne
        const containerWidth = 1280;
        const fieldWidth = 400; // Default width for comment fields
        const newRight = containerWidth - newLeft - fieldWidth;
        
        if (setFieldPositions) {
          setFieldPositions(prev => ({
            ...prev,
            [draggingField]: {
              top: Math.max(0, newTop),
              right: Math.max(0, newRight),
              width: prev?.[draggingField]?.width || 400,
              height: prev?.[draggingField]?.height || 100
            }
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggingField(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingField, dragOffset, zoomLevel, setFieldPositions]);

  // Render comment field with SlideOne-style implementation
  const renderCommentField = (field, placeholder, defaultPosition) => {
    const position = fieldPositions?.[field] || defaultPosition;
    const isActive = selectedField === field;
    
    return (
      <div
        key={field}
        style={{
          position: "absolute",
          top: position.top,
          right: position.right,
          width: position.width || 400,
          height: position.height || 100,
        }}
      >
        <textarea
          value={formData?.[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          onInput={(e) => autoResize(e.target)}
          placeholder={placeholder}
          onFocus={() => onSelect(field)}
          onMouseMove={(e) => {
            if (isActive) {
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
            if (isActive) {
              const rect = e.target.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const borderThickness = 8;
              
              const isOnLeftEdge = clickX <= borderThickness;
              const isOnRightEdge = clickX >= rect.width - borderThickness;
              const isOnTopEdge = clickY <= borderThickness;
              const isOnBottomEdge = clickY >= rect.height - borderThickness;
              
              if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
                handleFieldMouseDown(e, field);
              }
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            border: isActive ? "2px dashed rgba(0, 123, 255, 0.6)" : "1px solid rgba(255,255,255,0.3)",
            borderRadius: "4px",
            color: "#fff",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: fontSizes?.description || "16px",
            padding: "12px",
            resize: "both",
            overflow: "auto",
            backgroundColor: isActive ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.3)",
            boxShadow: isActive ? "0 0 0 1px rgba(0, 123, 255, 0.2)" : "none",
          }}
        />
        
        {/* Resize handle */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              bottom: -5,
              right: -5,
              width: 10,
              height: 10,
              background: "#007bff",
              borderRadius: "50%",
              cursor: "nw-resize",
              zIndex: 10
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              setResizeField(field);
              setInitialSize({
                width: position.width || 400,
                height: position.height || 100
              });
            }}
          />
        )}
      </div>
    );
  };

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing && resizeField && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const zoomFactor = (zoomLevel || 100) / 100;
        
        const position = fieldPositions?.[resizeField];
        if (position) {
          const fieldLeft = containerRect.width - position.right - position.width;
          const newWidth = Math.max(100, (e.clientX - containerRect.left) / zoomFactor - fieldLeft);
          const newHeight = Math.max(50, (e.clientY - containerRect.top) / zoomFactor - position.top);
          
          if (setFieldPositions) {
            setFieldPositions(prev => ({
              ...prev,
              [resizeField]: {
                ...position,
                width: newWidth,
                height: newHeight
              }
            }));
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeField(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeField, fieldPositions, zoomLevel, setFieldPositions]);

  // Add new textbox
  const addTextbox = (text = "", position = { top: 200, right: 200, width: 400, height: 100 }) => {
    const newFieldId = `comment_${Date.now()}`;
    
    // Add to formData
    setFormData(prev => ({
      ...prev,
      [newFieldId]: text
    }));
    
    // Add position
    if (setFieldPositions) {
      setFieldPositions(prev => ({
        ...prev,
        [newFieldId]: position
      }));
    }
    
    // Select the new field
    onSelect(newFieldId);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '1280px', height: '720px' }}>
      {/* Background Image */}
      <ImageComponent
        src={getImageSrc('Template-06.png')}
        alt="Comments slide template"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1
        }}
      />

      {/* Fixed Fields */}
      {renderCommentField('websiteInfo', 'Website Information...', { top: 150, right: 50, width: 500, height: 80 })}
      {renderCommentField('premiseLocation', 'Premise Location...', { top: 250, right: 50, width: 500, height: 80 })}

      {/* Dynamic Comment Fields */}
      {Object.keys(formData || {}).filter(key => key.startsWith('comment_')).map(fieldId =>
        renderCommentField(fieldId, 'Add your comment...', { top: 350, right: 50, width: 400, height: 100 })
      )}

      {/* Add New Comment Button */}
      <button
        onClick={() => addTextbox()}
        style={{
          position: "absolute",
          bottom: 50,
          right: 50,
          padding: "12px 24px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(40, 167, 69, 0.3)"
        }}
      >
        + Add Comment
      </button>
    </div>
  );
});

export default Comments;