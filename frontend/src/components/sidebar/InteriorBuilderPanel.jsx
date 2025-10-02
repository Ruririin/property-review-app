import React, { useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';

const InteriorBuilderPanel = () => {
  const { 
    currentSlide,
    getSlideData,
    updateSlideFormData,
    slides
  } = useEditor();

  const [isVisible, setIsVisible] = useState(false);
  const [interiorFeatures, setInteriorFeatures] = useState({
    emergencyExits: false,
    windowGuards: false,
    smokeDetectors: false,
    fireExtinguishers: false,
    waterStains: null // null = not selected, true = has water stains, false = no water stains
  });

  // Only show for comments slide type
  const currentSlideData = slides.find(s => s.id === currentSlide);
  if (!currentSlideData || currentSlideData.type !== 'comments') {
    return null;
  }

  const generateInteriorText = (features) => {
    const items = [];
    if (features.emergencyExits) items.push('emergency exits');
    if (features.windowGuards) items.push('window guards');
    if (features.smokeDetectors) items.push('smoke detectors');
    if (features.fireExtinguishers) items.push('fire extinguishers');
    
    if (items.length === 0) return '';
    
    let baseText = 'Interior view shows ';
    if (items.length === 1) {
      baseText += items[0];
    } else if (items.length === 2) {
      baseText += items.join(' and ');
    } else {
      baseText += items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
    }
    
    // Add water stains condition
    if (features.waterStains === true) {
      baseText += ' with water stains on the roof';
    } else if (features.waterStains === false) {
      baseText += ' without water stains on the roof';
    }
    
    return baseText;
  };

  const handleAddInteriorView = () => {
    const items = [];
    if (interiorFeatures.emergencyExits) items.push('emergency exits');
    if (interiorFeatures.windowGuards) items.push('window guards');
    if (interiorFeatures.smokeDetectors) items.push('smoke detectors');
    if (interiorFeatures.fireExtinguishers) items.push('fire extinguishers');
    
    if (items.length > 0) {
      let baseText = 'Interior view shows ';
      if (items.length === 1) {
        baseText += items[0];
      } else if (items.length === 2) {
        baseText += items.join(' and ');
      } else {
        baseText += items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
      }
      
      if (interiorFeatures.waterStains === true) {
        baseText += ' with water stains on the roof';
      } else if (interiorFeatures.waterStains === false) {
        baseText += ' without water stains on the roof';
      }
      
      const currentFormData = getSlideData(currentSlide).formData;
      const newKey = `interiorView_${Date.now()}`;
      updateSlideFormData(currentSlide, {
        ...currentFormData,
        [newKey]: baseText
      });
      
      setIsVisible(false);
      console.log('Added interior view:', baseText);
    } else {
      alert('Please select at least one interior feature.');
    }
  };

  const previewText = generateInteriorText(interiorFeatures);

  return (
    <>
      {/* Interior Builder Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: "linear-gradient(145deg, #fff3e0, #ffcc02)",
          border: "1px solid #ff9800",
          borderRadius: "20px",
          padding: "6px 10px",
          fontSize: "10px",
          fontWeight: "600",
          color: "#e65100",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          whiteSpace: "nowrap",
          minHeight: "28px",
          maxWidth: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 1 auto",
          marginBottom: "6px"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 2px 6px rgba(255,152,0,0.25)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        }}
      >
        Interior Builder
      </button>

      {/* Interior View Builder Options */}
      {isVisible && (
        <div 
          style={{ 
            marginTop: "10px", 
            padding: "12px", 
            backgroundColor: "#fff3e0", 
            borderRadius: "8px", 
            border: "1px solid #ff9800" 
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px", color: "#e65100" }}>
            Interior View Builder
          </div>
          
          <div 
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              padding: "8px",
              background: "rgba(255,255,255,0.5)",
              borderRadius: "6px",
              border: "1px solid rgba(255,152,0,0.2)"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Feature Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", color: "#e65100", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={interiorFeatures.emergencyExits}
                    onChange={(e) => setInteriorFeatures(prev => ({ ...prev, emergencyExits: e.target.checked }))}
                    style={{ width: "14px", height: "14px" }}
                  />
                  Emergency Exits
                </label>
                
                <label style={{ fontSize: "10px", color: "#e65100", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={interiorFeatures.windowGuards}
                    onChange={(e) => setInteriorFeatures(prev => ({ ...prev, windowGuards: e.target.checked }))}
                    style={{ width: "14px", height: "14px" }}
                  />
                  Window Guards
                </label>
                
                <label style={{ fontSize: "10px", color: "#e65100", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={interiorFeatures.smokeDetectors}
                    onChange={(e) => setInteriorFeatures(prev => ({ ...prev, smokeDetectors: e.target.checked }))}
                    style={{ width: "14px", height: "14px" }}
                  />
                  Smoke Detectors
                </label>
                
                <label style={{ fontSize: "10px", color: "#e65100", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={interiorFeatures.fireExtinguishers}
                    onChange={(e) => setInteriorFeatures(prev => ({ ...prev, fireExtinguishers: e.target.checked }))}
                    style={{ width: "14px", height: "14px" }}
                  />
                  Fire Extinguishers
                </label>
              </div>
              
              {/* Water Stains Radio Buttons */}
              <div style={{ borderTop: "1px solid rgba(255,152,0,0.3)", paddingTop: "8px", marginTop: "4px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#e65100", marginBottom: "4px" }}>
                  Water Stains on Roof:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <label style={{ fontSize: "9px", color: "#e65100", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="waterStains"
                      checked={interiorFeatures.waterStains === true}
                      onChange={() => setInteriorFeatures(prev => ({ ...prev, waterStains: true }))}
                      style={{ width: "12px", height: "12px" }}
                    />
                    Has Water Stains
                  </label>
                  
                  <label style={{ fontSize: "9px", color: "#e65100", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="waterStains"
                      checked={interiorFeatures.waterStains === false}
                      onChange={() => setInteriorFeatures(prev => ({ ...prev, waterStains: false }))}
                      style={{ width: "12px", height: "12px" }}
                    />
                    No Water Stains
                  </label>
                  
                  <label style={{ fontSize: "9px", color: "#e65100", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="waterStains"
                      checked={interiorFeatures.waterStains === null}
                      onChange={() => setInteriorFeatures(prev => ({ ...prev, waterStains: null }))}
                      style={{ width: "12px", height: "12px" }}
                    />
                    Not Applicable
                  </label>
                </div>
              </div>
              
              {/* Preview Text */}
              {previewText && (
                <div style={{ 
                  marginTop: "8px", 
                  padding: "6px", 
                  backgroundColor: "rgba(255,152,0,0.1)", 
                  borderRadius: "4px",
                  fontSize: "9px",
                  color: "#e65100",
                  fontStyle: "italic",
                  border: "1px dashed rgba(255,152,0,0.3)"
                }}>
                  Preview: "{previewText}"
                </div>
              )}
              
              {/* Add Interior View Button */}
              <button
                onClick={handleAddInteriorView}
                style={{
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "10px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginTop: "8px"
                }}
              >
                Add Interior View
              </button>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flex: 1
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InteriorBuilderPanel;
