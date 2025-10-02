import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const TextAlignmentControlsPanel = () => {
  const { 
    currentSlide,
    slides,
    getSlideData,
    textAlignments,
    setTextAlignments
  } = useEditor();

  // Only show for nearest_fire_station slide type
  const currentSlideData = slides.find(s => s.id === currentSlide);
  if (!currentSlideData || currentSlideData.type !== 'nearest_fire_station') {
    return null;
  }

  return (
    <div className="mt-3">
      <label className="form-label small fw-bold">Text Alignment</label>
      <div className="row g-1">
        {['left', 'center', 'right'].map((alignment) => (
          <div key={alignment} className="col-4">
            <button
              className={`btn btn-sm w-100 ${
                textAlignments.fireStationName === alignment || textAlignments.fireStationDistance === alignment
                  ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              style={{
                fontSize: "10px",
                padding: "4px",
                textTransform: "capitalize"
              }}
              onClick={() => {
                // Apply alignment to both fire station fields if they exist
                const currentFormData = getSlideData(currentSlide)?.formData || {};
                
                setTextAlignments(prev => ({
                  ...prev,
                  ...(currentFormData.fireStationName && { fireStationName: alignment }),
                  ...(currentFormData.fireStationDistance && { fireStationDistance: alignment })
                }));
              }}
            >
              {alignment === 'left' ? '◀' : alignment === 'center' ? '▣' : '▶'}
              <br />
              {alignment}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextAlignmentControlsPanel;
