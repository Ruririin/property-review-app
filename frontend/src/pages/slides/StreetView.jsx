import { forwardRef, useImperativeHandle } from "react";
import { useImageHandler } from "../../hooks/useImageHandler";
import ImageComponent from "../../components/ImageComponent";

const StreetView = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  slideId,
  slideData,
  updateSlideData,
  zoomLevel,
  isActiveSlide,
  fieldPositions,
  setFieldPositions,
}, ref) => {
  const imageHandler = useImageHandler(slideData, updateSlideData, zoomLevel, isActiveSlide, 'street');

  // Expose method for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  const renderField = (field, placeholder) => {
    const isActive = selectedField === field;
    const defaultPosition = {
      websiteInfo: { bottom: 31.8, right: 0.5 }, // Moved up by 6% for PDF compatibility
      premiseLocation: { top: 670, right: 1.2 }, // Same positioning as Aerial view
    };

    // Use fieldPositions if available, otherwise fall back to defaultPosition
    const position = (fieldPositions && fieldPositions[field]) || defaultPosition[field];

    // Calculate dynamic width based on text content
    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120));

    // For websiteInfo, use a div-based approach for better PDF rendering
    if (field === 'websiteInfo') {
      return (
        <div
          key={field}
          onClick={() => onSelect(field)}
          style={{
            position: "absolute",
            width: `${estimatedWidth}px`,
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
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            ...(position.bottom !== undefined 
              ? { bottom: `${position.bottom}px` }
              : { top: `${position.top}px` }),
            right: `${position.right}%`,
          }}
        >
          <input
            value={formData[field] || ""}
            onChange={(e) => setFormData({ [field]: e.target.value })}
            onFocus={() => onSelect(field)}
            placeholder={placeholder}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "28px",
              fontFamily: "'Montserrat', sans-serif",
              textAlign: "right",
              color: "#8B9A5B",
              outline: "none",
              width: "100%",
              padding: "0",
            }}
          />
        </div>
      );
    }

    // For other fields, use regular textarea
    return (
      <textarea
        key={field}
        value={formData[field] || ""}
        onChange={(e) =>
          setFormData({ [field]: e.target.value })
        }
        onFocus={() => onSelect(field)}
        placeholder={placeholder}
        style={{
          position: "absolute",
          width: `${estimatedWidth}px`,
          background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
          border: isActive
            ? "2px solid rgba(0,0,0,0.3)"
            : "2px solid transparent",
          borderRadius: "4px",
          fontSize: "28px",
          fontFamily: "'Montserrat', sans-serif",
          textAlign: "right",
          resize: "none",
          color: "#8B9A5B",
          padding: "4px 0px 4px 8px",
          outline: "none",
          whiteSpace: "nowrap",
          ...(position.bottom !== undefined 
            ? { bottom: `${position.bottom}px` }
            : { top: `${position.top}px` }),
          right: `${position.right}%`,
        }}
      />
    );
  };

  return (
    <div
      ref={imageHandler.containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        backgroundImage: "url('/Template/Template-04.png')",
        backgroundSize: "100% 100%",
        margin: "0 auto",
        overflow: "hidden",
        userSelect: "none",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      }}
      onMouseMove={imageHandler.handleMouseMove}
      onMouseUp={imageHandler.handleMouseUp}
      onClick={(e) => imageHandler.handleContainerClick(e, onSelect)}
    >
      {renderField("websiteInfo", "www.(source).com/(source) – (mm/yyyy)")}
      {renderField("premiseLocation", "www.(source).com/maps(mm/yyyy)")}
      
      {/* Screenshot area - users can paste street view images here */}
      {!imageHandler.imageData && (
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
            <div style={{ marginBottom: '10px', fontSize: '20px' }}>🗺️</div>
            <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Street View Screenshot</div>
            <div style={{ fontSize: '13px', opacity: '0.9', textAlign: 'center', lineHeight: '1.5', maxWidth: '500px' }}>
              Paste screenshot of Google Street View here
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontStyle: 'italic', opacity: '0.7' }}>
              Paste here (Ctrl+V)
            </div>
          </div>
        </div>
      )}

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

StreetView.displayName = 'StreetView';
export default StreetView;