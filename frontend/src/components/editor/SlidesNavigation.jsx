import React from 'react';

const SlidePreview = ({ slide, index, isActive, onClick, onDelete, canDelete, multipleLocationsMode, slideLocationIndex }) => (
  <div
    key={slide.id}
    className={`slide-preview ${isActive ? 'active' : ''}`}
    style={{
      width: '120px',
      height: '68px',
      backgroundColor: isActive ? '#007bff' : '#f8f9fa',
      border: isActive ? '2px solid #007bff' : '1px solid #dee2e6',
      borderRadius: '4px',
      margin: '5px',
      cursor: 'pointer',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}
    onClick={() => onClick(slide.id)}
    title={slide.title}
  >
    <div style={{
      fontSize: '10px',
      color: isActive ? 'white' : '#666',
      textAlign: 'center',
      padding: '2px',
      wordBreak: 'break-word',
      lineHeight: '1.2'
    }}>
      {slide.title}
    </div>
    
    {multipleLocationsMode && slideLocationIndex !== undefined && (
      <div style={{
        position: 'absolute',
        top: '2px',
        right: '2px',
        backgroundColor: '#28a745',
        color: 'white',
        borderRadius: '50%',
        width: '16px',
        height: '16px',
        fontSize: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {slideLocationIndex + 1}
      </div>
    )}
    
    {canDelete && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(slide.id);
        }}
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        title="Delete slide"
      >
        ×
      </button>
    )}
  </div>
);

const SlidesNavigation = ({
  slides,
  currentSlide,
  setCurrentSlide,
  deleteSlide,
  showSlidesBar,
  setShowSlidesBar,
  slidesContainerRef,
  multipleLocationsMode,
  SLIDES_BAR_HEIGHT,
  BUTTON_STYLES
}) => {
  if (!showSlidesBar) {
    return (
      <button
        onClick={() => setShowSlidesBar(true)}
        style={{
          ...BUTTON_STYLES.slideToggle,
          bottom: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '6px 6px 0 0',
          borderBottom: 'none',
          borderTop: '1px solid #ddd'
        }}
        title="Show slides"
      >
        ▲
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: SLIDES_BAR_HEIGHT,
        backgroundColor: "#f8f9fa",
        borderTop: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        overflowX: "auto",
        overflowY: "hidden",
        zIndex: 1000,
        padding: "10px"
      }}
    >
      {/* Hide Slides Button */}
      <button
        onClick={() => setShowSlidesBar(false)}
        style={{
          ...BUTTON_STYLES.slideToggle,
          top: '-20px'
        }}
        title="Hide slides"
      >
        ▼
      </button>

      {/* Slides Container */}
      <div
        ref={slidesContainerRef}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "10px",
          paddingLeft: "10px",
          paddingRight: "10px",
          overflowX: "auto",
          overflowY: "hidden",
          height: "100%",
          width: "100%"
        }}
      >
        {slides.map((slide, index) => (
          <SlidePreview
            key={slide.id}
            slide={slide}
            index={index}
            isActive={currentSlide === slide.id}
            onClick={setCurrentSlide}
            onDelete={deleteSlide}
            canDelete={slides.length > 1 && slide.id !== 1}
            multipleLocationsMode={multipleLocationsMode}
            slideLocationIndex={slide.locationIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default SlidesNavigation;
