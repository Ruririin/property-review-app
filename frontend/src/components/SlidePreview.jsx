import React from 'react';

// Temporary placeholder for SlidePreview component
const SlidePreview = ({ slide, index, currentSlide, onClick, onRemove, ...props }) => {
  return (
    <div
      className={`slide-preview ${currentSlide === slide.id ? 'active' : ''}`}
      onClick={() => onClick && onClick(slide.id)}
      style={{
        padding: '10px',
        border: currentSlide === slide.id ? '2px solid #007bff' : '1px solid #ccc',
        margin: '5px',
        borderRadius: '4px',
        cursor: 'pointer',
        backgroundColor: currentSlide === slide.id ? '#f0f8ff' : '#fff'
      }}
      {...props}
    >
      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
        Slide {index + 1}
      </div>
      <div style={{ fontSize: '10px', color: '#666' }}>
        {slide.title || slide.type || 'Untitled'}
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(slide.id);
          }}
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SlidePreview;