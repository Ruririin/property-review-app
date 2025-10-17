import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import MultiImageComponent from "../../components/MultiImageComponent";

const SlideTwo = forwardRef(({
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
  allSlideData, // Need this to check other slides
  slides, // Need this to check slide types
}, ref) => {
  const containerRef = useRef(null);

  // Image handling using MultiImageComponent (replaces broken useImageHandler)
  const images = slideData?.images || [];
  const handleUpdateImages = (newImages) => {
    updateSlideData({ images: newImages });
  };
  const currentViewType = formData.websiteInfo || "Satellite View";
  
  // Force re-render when any slide data changes (for cross-slide logic)
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [allSlideData]);
  
  // Check if this is the first or second aerial slide with an image
  // Find other aerial slides that have images
  const otherAerialSlidesWithImages = slides.filter(slide => {
    // Skip current slide
    if (slide.id === slideId) return false;
    // Check if it's an aerial slide type and has image data
    const isAerialSlide = slide.type === 'aerial_view_-_google' || slide.type === 'aerial_view_-_bing';
    const hasImage = allSlideData[slide.id]?.imageData;
    return isAerialSlide && hasImage;
  });
  
  const isSecondAerialSlide = otherAerialSlidesWithImages.length > 0;
  
  // Check if this is the second aerial slide (no debug logging)

  // Expose method for PDF export (aerial slides don't have draggable positioning)
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      // No positioning sync needed (fixed positions)
    }
  }));

  const renderField = (field, placeholder) => {
    const isActive = selectedField === field;
    const defaultPosition = {
      websiteInfo: { bottom: -11.4, right: 0.5 }, // Moved up by 0.5% and left by 1.5%
      premiseLocation: { top: 670, right: 1.2 }, // Fixed: positioned from top instead of bottom
    };

    // Calculate dynamic width based on text content
    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120)); // Increased calculation and max width

    return (
      <textarea
        key={field}
        value={formData[field] || ""}
        onChange={(e) =>
          setFormData({ ...formData, [field]: e.target.value })
        }
        onFocus={() => onSelect(field)}
        placeholder={placeholder}
        style={{
          position: "absolute",
          width: `${estimatedWidth}px`, // Dynamic width based on content
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
          ...(defaultPosition[field].bottom !== undefined 
            ? { bottom: `${defaultPosition[field].bottom}px` }
            : { top: `${defaultPosition[field].top}px` }),
          right: `${defaultPosition[field].right}%`,
        }}
      />
    );
  };

  const renderGoogleMapsField = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isActive = selectedField === "websiteInfo";
    const defaultPosition = {
      websiteInfo: { bottom: 40, right: 1.2 }, // Positioned properly above location
    };

    const options = [
      { value: "Bird's Eye View", label: "www.google.com - Bird's Eye View" },
      { value: "Satellite View", label: "www.google.com - Satellite View" }
    ];

    const handleOptionClick = (value) => {
      setFormData({ websiteInfo: value });
      setIsDropdownOpen(false);
    };
    
    return (
      <div style={{ 
        position: "absolute",
        bottom: `${defaultPosition.websiteInfo.bottom}px`,
        right: `${defaultPosition.websiteInfo.right}%`,
      }}>
        {/* Main display field */}
        <div
          onClick={(e) => {
            e.stopPropagation(); // Prevent container click handler
            setIsDropdownOpen(!isDropdownOpen);
            onSelect("websiteInfo");
          }}
          style={{
            position: "relative",
            width: "600px",
            height: "44px",
            background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
            border: isActive ? "2px solid rgba(0,0,0,0.3)" : "2px solid transparent",
            borderRadius: "4px",
            fontSize: "28px",
            fontFamily: "'Montserrat', sans-serif",
            textAlign: "right",
            color: "#8B9A5B",
            padding: "4px 0px 4px 40px",
            outline: "none",
            boxSizing: "border-box",
            lineHeight: "44px",
            cursor: "pointer",
            backgroundImage: "none",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "8px center",
            backgroundSize: "20px",
          }}
        >
          {options.find(opt => opt.value === currentViewType)?.label || "www.(source).com/(source) – (mm/yyyy)"}
        </div>

        {/* Custom dropdown */}
        {isDropdownOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "44px",
              left: "0",
              width: "600px",
              background: "#fff",
              border: "2px solid rgba(0,0,0,0.3)",
              borderRadius: "4px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              zIndex: 9999,
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent container click handler
                  handleOptionClick(option.value);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: "16px",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#8B9A5B",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid #eee",
                }}
                onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
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
        backgroundImage: "url('/Template/Template-02.png')",
        backgroundSize: "100% 100%",
        margin: "0 auto",
        overflow: "hidden",
        userSelect: "none",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onSelect(null);
        }
      }}
    >
      {renderGoogleMapsField()}
      {renderField("premiseLocation", "www.(source).com/maps(mm/yyyy)")}

      {/* Map area with image handling - using MultiImageComponent */}
      <div
        style={{
          position: "absolute",
          top: "108px",
          left: "108px",
          width: "1064px",
          height: "504px",
        }}
      >
        <MultiImageComponent
          images={images}
          onUpdateImages={handleUpdateImages}
          zoomLevel={zoomLevel}
          isActiveSlide={isActiveSlide}
        />

        {/* Show placeholder when no images */}
        {images.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
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
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: '10px', fontSize: '20px' }}>📍</div>
              <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Screenshot Instructions</div>
              <div style={{ fontSize: '13px', opacity: '0.9', textAlign: 'left', lineHeight: '1.5', maxWidth: '500px' }}>
                {isSecondAerialSlide ? (
                  // Second aerial slide instructions - roof focus
                  <>
                    • Zoom in to show condition of the roof<br/>
                    • Check for the possible more updated view<br/>
                  </>
                ) : (
                  // First aerial slide instructions - property overview
                  <>
                    • Include street<br/>
                    • Zoom out to show neighboring properties<br/>
                    • Show premise border by adding red lines or a red box<br/>
                    • Bing.com is preferable (address caption) but google.com is acceptable<br/>
                    • Make sure bing and google show the same premise for the address; otherwise, google search the address or check google street view<br/>
                  </>
                )}
                <div style={{ textAlign: 'center', marginTop: '10px', fontStyle: 'italic', opacity: '0.7' }}>
                  Paste here (Ctrl+V)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
});

SlideTwo.displayName = 'SlideTwo';
export default SlideTwo;
