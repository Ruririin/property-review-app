import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import FrameLayout from "../../components/FrameLayout";
import FrameSelector from "../../components/FrameSelector";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";

const OnlinePresence = forwardRef(({
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
  projectId,
  currentProjectId,
}, ref) => {

  const containerRef = useRef(null);

  const activeProjectId = projectId || currentProjectId;
  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(activeProjectId, slideId);

  // Frame layout state (default to 1 frame)
  const [frameLayout, setFrameLayout] = useState(slideData?.frameLayout || 1);
  const frameImages = slideData?.frameImages || {};
  const frameMeta = slideData?.frameMeta || {};

  const handleImageUpload = async (frameId, imageData, file) => {
    updateSlideData({ frameImages: { ...frameImages, [frameId]: imageData } });
    if (activeProjectId) {
      const result = await uploadFrameImage(frameId, imageData);
      if (result?.success) {
        updateSlideData({
          frameMeta: { ...frameMeta, [frameId]: { filePath: result.filePath, url: result.url, width: result.width, height: result.height, aspectRatio: result.aspectRatio } }
        });
      }
    }
  };

  const handleImageRemove = async (frameId) => {
    const filePath = frameMeta[frameId]?.filePath;
    if (filePath && activeProjectId) await deleteFrameImage(frameId, filePath);
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
    const coords = getEventCoordinates(e);
    const initialMouseX = coords.clientX;
    const initialMouseY = coords.clientY;
    
    const fieldElement = e.target.parentElement;
    const position = (fieldPositions && fieldPositions[field]) || defaultFieldPositions[field];
    const initialBottom = position.bottom !== undefined ? position.bottom : null;
    const initialTop = position.top !== undefined ? position.top : null;
    const initialRight = position.right || 0.5;
    
    const handleMouseMove = (moveEvent) => {
      const coords = getEventCoordinates(moveEvent);
      const deltaX = coords.clientX - initialMouseX;
      const deltaY = coords.clientY - initialMouseY;
      
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
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
  };

  const autoResize = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(60, textarea.scrollHeight) + 'px';
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
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
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
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
          onTouchStart={(e) => {
            // Only start dragging if touching on the border/edge area, not in the text content
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
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
        background: "url('/Template/Template-05.png') center/100% 100% no-repeat",
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
      {renderField("websiteInfo", "www.(source).com/")}

      {/* Frame layout selector */}
      <FrameSelector
        currentLayout={frameLayout}
        onLayoutChange={handleFrameLayoutChange}
      />

      {/* Image frames */}
      <div
        style={{
          position: "absolute",
          top: "108px",
          left: "108px",
          width: "1064px",
          height: "504px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <FrameLayout
          layoutType={frameLayout}
          images={frameImages}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
        />
      </div>
    </div>
  );
});

OnlinePresence.displayName = 'OnlinePresence';
export default OnlinePresence;