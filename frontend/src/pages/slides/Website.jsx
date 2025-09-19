import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import MultiImageComponent from "../../components/MultiImageComponent";

const Website = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  slideId,
  slideData,
  updateSlideData,
  zoomLevel,
  isActiveSlide,
  fieldPositions,
  setFieldPositions,
  websiteUrl // Add this prop to receive website URL from slide 1
}, ref) => {
  
  const containerRef = useRef(null);

  // Pre-populate websiteInfo field with websiteUrl from slide 1 when component mounts
  useEffect(() => {
    if (websiteUrl && (!formData.websiteInfo || formData.websiteInfo.trim() === '')) {
      setFormData({ websiteInfo: websiteUrl });
    }
  }, [websiteUrl, formData.websiteInfo, setFormData]);
  
  // Expose method for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      // Sync field positions if needed
    }
  }));

  const defaultFieldPositions = {
    websiteInfo: { bottom: -11.4, right: 0.5 }, // Bottom right position like street view
  };

  const handleFieldMouseDown = (e, field) => {
    if (selectedField !== field) return;
    
    e.preventDefault();
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    
    const fieldElement = e.target.parentElement;
    const position = (fieldPositions && fieldPositions[field]) || defaultFieldPositions[field];
    const initialBottom = position.bottom !== undefined ? position.bottom : null;
    const initialTop = position.top !== undefined ? position.top : null;
    const initialRight = position.right || 0.5;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      
      let updatedPosition;
      if (initialBottom !== null) {
        // Using bottom positioning
        const newBottom = initialBottom - deltaY;
        const newRight = initialRight - (deltaX / window.innerWidth) * 100;
        updatedPosition = { bottom: newBottom, right: newRight };
      } else {
        // Using top positioning  
        const newTop = initialTop + deltaY;
        const newRight = initialRight - (deltaX / window.innerWidth) * 100;
        updatedPosition = { top: newTop, right: newRight };
      }
      
      const updatedPositions = {
        ...fieldPositions,
        [field]: updatedPosition
      };
      
      setFieldPositions(updatedPositions);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const autoResize = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(60, textarea.scrollHeight) + 'px';
  };

  const handleChange = (field, value) => {
    setFormData({ [field]: value });
  };

  const renderField = (field, placeholder) => {
    const position = (fieldPositions && fieldPositions[field]) || defaultFieldPositions[field];
    const isActive = selectedField === field;
    const fieldFontSize = fontSizes[field] || 28;
    
    // Calculate dynamic width based on text content like street view
    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120));

    const commonStyle = {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: "400",
      color: "#8B9A5B",
      textAlign: "right",
      resize: "none",
      outline: "none",
      padding: "4px 0px 4px 8px",
      lineHeight: "1.4",
      minHeight: "60px",
      overflow: "hidden",
      whiteSpace: "nowrap",
    };

    return (
      <div
        key={field}
        style={{
          position: "absolute",
          ...(position.bottom !== undefined 
            ? { bottom: `${position.bottom}px` }
            : { top: `${position.top}px` }),
          right: `${position.right}%`,
          width: `${estimatedWidth}px`,
          zIndex: selectedField === field ? 1001 : 1000, // Ensure text fields are above images
        }}
      >
        <textarea
          value={formData[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          onInput={(e) => autoResize(e.target)}
          placeholder={placeholder}
          onFocus={() => onSelect(field)}
          onMouseMove={(e) => {
            // Change cursor based on position when field is selected
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const borderThickness = 20;
              
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
            // Only start dragging if clicking on the border/edge area, not in the text content
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const borderThickness = 20;
              
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
            ...commonStyle,
            position: "relative",
            top: "0",
            right: "0",
            transform: "none",
            width: `${estimatedWidth}px`,
            fontSize: fieldFontSize,
            border: isActive ? "2px dashed rgba(0, 123, 255, 0.3)" : "none",
            backgroundColor: isActive ? "rgba(255, 255, 255, 0.05)" : "transparent",
            borderRadius: "4px",
            textOverflow: "ellipsis",
            cursor: "text",
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
        backgroundImage: "url('/Template/Template-12.png')",
        backgroundSize: "100% 100%",
        margin: "0 auto",
        overflow: "hidden",
        userSelect: "none",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      }}
      onClick={(e) => {
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {renderField("websiteInfo", websiteUrl || "www.example.com")}


      {/* Screenshot area - users can paste images here */}
      {(slideData?.images || []).length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "108px",
            left: "108px",
            width: "1064px",
            height: "504px",
            border: "2px dashed #ccc",
            borderRadius: "12px",
            backgroundColor: "rgba(240, 240, 240, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            color: "#666",
            fontFamily: "'Montserrat', sans-serif",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px', fontSize: '20px' }}>🌐</div>
            <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Website Screenshot</div>
            <div style={{ fontSize: '13px', opacity: '0.9', textAlign: 'center', lineHeight: '1.5', maxWidth: '500px' }}>
              Paste screenshot of the company's website here
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontStyle: 'italic', opacity: '0.7' }}>
              Paste here (Ctrl+V)
            </div>
          </div>
        </div>
      )}

      <MultiImageComponent
        images={slideData?.images || []}
        onUpdateImages={async (updatedImages) => {
          if (updateSlideData) {
            await updateSlideData({ images: updatedImages });
          }
        }}
        zoomLevel={zoomLevel}
      />
    </div>
  );
});

Website.displayName = 'Website';
export default Website;