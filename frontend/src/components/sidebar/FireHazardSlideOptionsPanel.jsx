import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const FireHazardSlideOptionsPanel = () => {
  const { 
    currentSlide,
    slides,
    getSlideData,
    updateSlideFormData,
    showCustomCommentInput,
    setShowCustomCommentInput,
    customCommentText,
    setCustomCommentText
  } = useEditor();

  // Only show for fire_hazard slide type
  const currentSlideData = slides.find(s => s.id === currentSlide);
  if (!currentSlideData || currentSlideData.type !== 'fire_hazard') {
    return null;
  }

  const fireHazardOptions = [
    { key: 'notWithinFireZone', label: 'Not Within Fire Zone', text: 'The property is not within the fire severity zone.' },
    { key: 'veryHighFireZone', label: 'Very High Fire Zone', text: 'The property is within the Very High fire severity zone.' },
    { key: 'highFireZone', label: 'High Fire Zone', text: 'The property is within the high fire severity zone.' },
    { key: 'moderateFireZone', label: 'Moderate Fire Zone', text: 'The property is within the moderate fire severity zone.' }
  ];

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold mb-0">Fire Hazard Options</label>
        <button
          onClick={() => setShowCustomCommentInput(!showCustomCommentInput)}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#dc3545",
            border: "none",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
            e.target.style.background = "#c82333";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.background = "#dc3545";
          }}
          title="Add custom fire hazard comment"
        >
          +
        </button>
      </div>
      
      <div 
        style={{
          height: "120px",
          width: "320px",
          overflowY: "auto",
          padding: "8px 4px",
          background: "linear-gradient(180deg, rgba(248,249,250,0) 0%, rgba(248,249,250,1) 10%, rgba(248,249,250,1) 90%, rgba(248,249,250,0) 100%)",
          borderRadius: "8px",
          border: "1px solid rgba(0,0,0,0.1)",
          position: "relative"
        }}
      >
        <div 
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignContent: "flex-start",
            width: "100%"
          }}
        >
          {fireHazardOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                const currentFormData = getSlideData(currentSlide).formData;
                updateSlideFormData(currentSlide, {
                  ...currentFormData,
                  [option.key]: currentFormData[option.key] || option.text
                });
              }}
              style={{
                background: "linear-gradient(145deg, #ffebee, #ffcdd2)",
                border: "1px solid #f44336",
                borderRadius: "20px",
                padding: "6px 10px",
                fontSize: "10px",
                fontWeight: "500",
                color: "#c62828",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                whiteSpace: "nowrap",
                minHeight: "28px",
                maxWidth: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 1 auto"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 2px 6px rgba(244,67,54,0.25)";
                e.target.style.background = "linear-gradient(145deg, #ffcdd2, #ef9a9a)";
                e.target.style.borderColor = "#e53935";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                e.target.style.background = "linear-gradient(145deg, #ffebee, #ffcdd2)";
                e.target.style.borderColor = "#f44336";
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom Comment Input for Fire Hazard */}
      {showCustomCommentInput && (
        <div 
          style={{ 
            marginTop: "10px", 
            padding: "12px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "8px", 
            border: "1px solid #e9ecef" 
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px", color: "#495057" }}>
            Add Custom Fire Hazard Comment
          </div>
          
          <textarea
            value={customCommentText}
            onChange={(e) => setCustomCommentText(e.target.value)}
            placeholder="Enter your custom fire hazard comment here..."
            style={{
              width: "100%",
              minHeight: "60px",
              border: "1px solid #ced4da",
              borderRadius: "4px",
              padding: "8px",
              fontSize: "12px",
              fontFamily: "inherit",
              resize: "vertical",
              marginBottom: "8px"
            }}
          />
          
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                if (customCommentText.trim()) {
                  const currentFormData = getSlideData(currentSlide).formData;
                  const newKey = `custom_fire_${Date.now()}`;
                  updateSlideFormData(currentSlide, {
                    ...currentFormData,
                    [newKey]: customCommentText.trim()
                  });
                  setCustomCommentText('');
                  setShowCustomCommentInput(false);
                }
              }}
              disabled={!customCommentText.trim()}
              style={{
                backgroundColor: customCommentText.trim() ? "#dc3545" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: "500",
                cursor: customCommentText.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                flex: 1
              }}
            >
              Add Fire Hazard Comment
            </button>
            
            <button
              onClick={() => {
                setCustomCommentText('');
                setShowCustomCommentInput(false);
              }}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireHazardSlideOptionsPanel;
