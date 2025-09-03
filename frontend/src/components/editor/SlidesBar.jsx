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
  availableSlideTypes = []
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
      className="slides-bar bg-light border-top p-2 d-flex align-items-center position-fixed shadow"
      style={{
        bottom: isVisible ? 0 : -SLIDES_BAR_HEIGHT,
        left: 0,
        right: 0,
        height: SLIDES_BAR_HEIGHT,
        zIndex: 999,
        transition: "bottom 0.3s ease",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"
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

      {/* Add Slide Button */}
      <div className="position-relative me-3">
        <button
          className="btn btn-primary btn-sm d-flex flex-column align-items-center justify-content-center"
          onClick={onAddSlide}
          style={{
            width: "50px",
            height: "80px",
            fontSize: "10px",
            fontWeight: "600",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
            border: "none",
            boxShadow: "0 2px 4px rgba(0,123,255,0.2)"
          }}
        >
          <i className="bi bi-plus-lg mb-1" style={{ fontSize: "16px" }}></i>
          Add
        </button>
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
      </div>
    </div>
  );
};

export default SlidesBar;