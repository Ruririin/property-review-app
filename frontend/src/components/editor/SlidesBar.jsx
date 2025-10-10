/**
 * Slides Bar Component
 * Bottom panel showing slide thumbnails and navigation
 */

import { useRef, useEffect } from 'react';

const SlidePreview = ({ 
  slide, 
  index, 
  isActive, 
  onClick, 
  onDelete, 
  canDelete 
}) => (
  <div
    className={`position-relative cursor-pointer border ${isActive ? "border-primary border-2" : "border-light"}`}
    onClick={() => onClick(slide.id)}
    style={{
      width: "130px",
      height: "80px",
      cursor: "pointer",
      borderRadius: "8px",
      background: isActive ? "#f8f9ff" : "#f8f9fa",
      margin: "10px 8px 10px 8px",
      flexShrink: 0,
      boxShadow: isActive ? "0 2px 8px rgba(0,123,255,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease"
    }}
  >
    <div className="h-100 d-flex align-items-center justify-content-center p-2">
      <small 
        className="text-center" 
        style={{ 
          fontSize: "10px", 
          lineHeight: "1.2",
          fontWeight: isActive ? "600" : "normal",
          color: isActive ? "#0d6efd" : "#6c757d"
        }}
      >
        {slide.title}
      </small>
    </div>
    
    {canDelete && (
      <button
        className="btn btn-sm position-absolute"
        style={{
          top: "2px",
          right: "2px",
          width: "20px",
          height: "20px",
          padding: "0",
          fontSize: "10px",
          backgroundColor: "#dc3545",
          border: "none",
          borderRadius: "50%",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: "0.8"
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(slide.id);
        }}
        onMouseEnter={(e) => e.target.style.opacity = "1"}
        onMouseLeave={(e) => e.target.style.opacity = "0.8"}
      >
        ×
      </button>
    )}
  </div>
);

const SlidesBar = ({
  slides = [],
  currentSlide = 1,
  onSlideSelect = () => {},
  onSlideDelete = () => {},
  onAddSlide = () => {},
  isVisible = true,
  onToggleVisibility = () => {},
  availableSlideTypes = [],
  // Main branch dropdown props
  showPopupDropdown = false,
  setShowPopupDropdown = () => {},
  popupPosition = { top: 0, left: 0 },
  slideOptions = [],
  addSlide = () => {},
  addButtonRef = null,
  showWebsite = false,
  showRatings = false,
  getSlideData = () => ({}),
  // Zoom controls
  zoomLevel = 100,
  onZoomIn = () => {},
  onZoomOut = () => {},
  onZoomReset = () => {}
}) => {
  const slidesContainerRef = useRef(null);
  const SLIDES_BAR_HEIGHT = 160;

  const buttonStyles = {
    slideToggle: {
      position: "absolute",
      top: "-20px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "60px",
      height: "20px",
      backgroundColor: "#f8f9fa",
      border: "1px solid #ddd",
      borderBottom: "none",
      borderRadius: "6px 6px 0 0",
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  };

  // Set up mouse wheel event listener for horizontal scrolling
  useEffect(() => {
    const slidesContainer = slidesContainerRef.current;
    if (!slidesContainer) return;

    const handleWheel = (e) => {
      // Check if we're over a dropdown
      const isOverDropdown = e.target.closest('.dropdown-item') ||
                            e.target.closest('[role="menu"]') ||
                            (e.target.closest('[style*="position: fixed"]') && 
                             e.target.closest('[style*="zIndex: 5000"]'));

      // Only convert vertical mouse wheel to horizontal scroll if not over dropdown
      if (!isOverDropdown) {
        e.preventDefault();
        e.stopPropagation();
        
        const scrollAmount = e.deltaY * 2;
        slidesContainer.scrollLeft += scrollAmount;
      }
    };

    slidesContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      slidesContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div
      className="slides-bar bg-light border-top p-2 position-fixed shadow"
      style={{
        bottom: isVisible ? 0 : -SLIDES_BAR_HEIGHT,
        left: 0,
        right: 0,
        height: SLIDES_BAR_HEIGHT,
        zIndex: 1002,
        transition: "bottom 0.3s ease",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Toggle Arrow Button */}
      <button
        onClick={onToggleVisibility}
        style={buttonStyles.slideToggle}
      >
        <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
          {isVisible ? "↓" : "↑"}
        </span>
      </button>

      {/* Top Info Bar */}
      <div className="d-flex align-items-center justify-content-between" style={{ height: "20px", marginBottom: "8px" }}>
        <small className="fw-bold text-muted" style={{ fontSize: "11px" }}>SLIDES</small>
        <span className="badge bg-secondary" style={{ fontSize: "9px", padding: "2px 6px" }}>
          {slides.length} slide{slides.length !== 1 ? "s" : ""}
        </span>
      </div>

        {/* Slides Container with horizontal scroll */}
        <div 
          ref={slidesContainerRef}
          className="d-flex flex-nowrap align-items-center"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            flex: 1,
            height: "100px",
            scrollbarWidth: "thin",
            scrollbarColor: "#c1c1c1 #f1f1f1",
            paddingBottom: "10px"
          }}
        >
          {slides.map((slide, index) => (
            <SlidePreview
              key={slide.id}
              slide={slide}
              index={index}
              isActive={slide.id === currentSlide}
              onClick={onSlideSelect}
              onDelete={onSlideDelete}
              canDelete={slides.length > 1}
            />
          ))}

          {/* Add Slide Button */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowPopupDropdown(!showPopupDropdown)}
              ref={addButtonRef}
              style={{ whiteSpace: "nowrap", height: "80px", minWidth: "100px" }}
            >
              ＋ Add
            </button>
          </div>
        </div>

        {/* Floating Zoom Controls */}
        <div style={{
          position: "absolute",
          top: "8px",
          right: "100px",
          display: "flex",
          gap: "4px",
          alignItems: "center",
          zIndex: 1004
        }}>
          <button 
            className="btn btn-sm btn-light border"
            onClick={onZoomOut}
            disabled={zoomLevel <= 50}
            style={{
              width: "28px",
              height: "28px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold"
            }}
            title="Zoom Out"
          >
            −
          </button>
          <span 
            className="small fw-bold px-2 py-1 bg-white border rounded" 
            style={{ 
              minWidth: "45px", 
              textAlign: "center",
              fontSize: "11px"
            }}
          >
            {zoomLevel}%
          </span>
          <button 
            className="btn btn-sm btn-light border"
            onClick={onZoomIn}
            disabled={zoomLevel >= 200}
            style={{
              width: "28px",
              height: "28px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold"
            }}
            title="Zoom In"
          >
            +
          </button>
          <button 
            className="btn btn-sm btn-outline-primary ms-1"
            onClick={onZoomReset}
            style={{ fontSize: "10px", padding: "2px 6px" }}
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

      {/* Dropdown positioned outside of scroll container */}
      {showPopupDropdown && (
        <div
          className="position-fixed bg-white border rounded shadow"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            width: "180px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 5000,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          {slideOptions.filter(option => {
            // Show Website option if showWebsite is true and there's website data in slide 1
            if (option === 'Website') {
              const slide1FormData = getSlideData(1)?.formData || {};
              const websiteValue = slide1FormData.website || '';
              const hasWebsiteData = showWebsite && websiteValue && websiteValue.trim() !== '';
              return hasWebsiteData;
            }
            // Show Ratings option only if showRatings is true
            if (option === 'Ratings') {
              return showRatings;
            }
            return true;
          }).map(option => (
            <div
              key={option}
              className="dropdown-item text-dark"
              style={{ cursor: "pointer", padding: "8px 12px" }}
              onClick={() => addSlide(option)}
              onMouseEnter={(e) => e.target.style.background = "#f0f0f0"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlidesBar;