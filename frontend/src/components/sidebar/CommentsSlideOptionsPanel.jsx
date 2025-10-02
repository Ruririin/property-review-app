import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const CommentsSlideOptionsPanel = () => {
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

  // Only show for comments slide type
  const currentSlideData = slides.find(s => s.id === currentSlide);
  if (!currentSlideData || currentSlideData.type !== 'comments') {
    return null;
  }

  const commentOptions = [
    { key: 'fireHydrantWithin', label: 'Hydrant Within', text: 'The nearest fire hydrant is within the premise.' },
    { key: 'fireHydrantAway', label: 'Hydrant Away', text: 'The nearest fire hydrant is (distance) away from the premise.' },
    { key: 'matureTree', label: 'Mature Tree', text: 'There is a mature tree beside the premise.' },
    { key: 'handrailsStairs', label: 'Handrails Stairs', text: 'The premise has handrails for stairs.' },
    { key: 'guardRailsBalcony', label: 'Guard Rails Balcony', text: 'The premise has guard rails for the balcony.' },
    { key: 'handrailsGuardRails', label: 'Handrails & Guard Rails', text: 'The premise has handrails for stairs and guard rails for the balcony.' },
    { key: 'pwdProvisions', label: 'PWD Provisions', text: 'The premise has PWD provisions' },
    { key: 'cctvCameras', label: 'CCTV Cameras', text: 'There are CCTV cameras present on the property.' },
    { key: 'poolGateFence', label: 'Pool Gate & Fence', text: 'There is a gate and fence around the pool.' },
    { key: 'vandalism', label: 'Vandalism', text: 'Vandalism is present on the premise.' }
  ];

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold mb-0">Comments Options</label>
        <button
          onClick={() => setShowCustomCommentInput(!showCustomCommentInput)}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#198754",
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
            e.target.style.background = "#157347";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.background = "#198754";
          }}
          title="Add custom comment"
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
          {commentOptions.map((option) => (
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
                background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                border: "1px solid #e9ecef",
                borderRadius: "20px",
                padding: "6px 10px",
                fontSize: "10px",
                fontWeight: "500",
                color: "#495057",
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
                e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                e.target.style.background = "linear-gradient(145deg, #e3f2fd, #bbdefb)";
                e.target.style.borderColor = "#2196f3";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                e.target.style.background = "linear-gradient(145deg, #ffffff, #f8f9fa)";
                e.target.style.borderColor = "#e9ecef";
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom Comment Input */}
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
            Add Custom Comment
          </div>
          
          <textarea
            value={customCommentText}
            onChange={(e) => setCustomCommentText(e.target.value)}
            placeholder="Enter your custom comment here..."
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
                  const newKey = `custom_${Date.now()}`;
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
                backgroundColor: customCommentText.trim() ? "#198754" : "#6c757d",
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
              Add Comment
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

export default CommentsSlideOptionsPanel;
