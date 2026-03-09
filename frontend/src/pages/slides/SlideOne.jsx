import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { loadIsoCodes, findBestMatch, findSimilarMatches } from "../../services/serviceFactory";
import { useFieldActivity } from "../../hooks/useFieldActivity";
import fieldActivityService from "../../services/fieldActivityService";
import slideApiService from "../../services/slideApiService";

const SlideOne = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  setShowWebsite,
  multipleLocationsMode,
  setMultipleLocationsMode,
  selectedLocationIndex,
  fieldPositions,
  setFieldPositions,
  zoomLevel,
  sessionUser,
  currentFormId,
  slideId = '1',
  currentProjectId,
}, ref) => {
  // For SlideOne, use formData directly since Editor now passes globalLocationData correctly
  // This avoids conflicts with useLocationAwareData hook that can cause infinite loops
  const getFormValue = (field) => {
    const value = formData?.[field] || '';
    return value;
  };
  
  const setFormValue = (field, value) => {
    console.log(`🔄 SlideOne setFormValue: ${field} = ${value}`);
    setFormData({ [field]: value });
  };
  
  const setFormValues = (updates) => {
    console.log('🔄 SlideOne setFormValues:', updates);
    setFormData(updates);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingField, setDraggingField] = useState(null);
  const [isLineBusinessDropdownOpen, setIsLineBusinessDropdownOpen] = useState(false);
  const [isDescriptionDropdownOpen, setIsDescriptionDropdownOpen] = useState(false);
  const [descriptionMatches, setDescriptionMatches] = useState([]);
  const [isUserEditingDescription, setIsUserEditingDescription] = useState(false);
  const [othersCleared, setOthersCleared] = useState(false); // Track if "Others" mode was just cleared
  const hasTypedInOthersMode = useRef(false); // Track if user has typed anything in Others mode

  const containerRef = useRef(null);

  // Helper function to handle both mouse and touch events
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Expose method to sync current state positions to DOM for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      // Force a re-render to ensure DOM reflects current fieldPositions state
      // This is called before PDF export to ensure positions are current
      // Syncing field positions to DOM for PDF export
      
      // Force React to re-render by updating a dummy state
      // This ensures the DOM reflects the current fieldPositions
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  // Load ISO codes on component mount
  useEffect(() => {
    loadIsoCodes();
  }, []);

  // Auto-resize all textareas when formData changes
  useEffect(() => {
    const textareas = containerRef.current?.querySelectorAll('textarea');
    if (textareas) {
      textareas.forEach(textarea => {
        autoResize(textarea);
      });
    }
  }, [formData]);

  // Initialize fixed positions to ensure perfect consistency between editor and PDF
  useEffect(() => {
    if (setFieldPositions && fieldPositions) {
      const hasCustomPositions = fieldPositions.lineBusiness?.right !== 124 || fieldPositions.isoClass?.right !== 124;
      
      // Only update if positions haven't been customized by user dragging
      if (!hasCustomPositions) {
        // Use fixed positions that are guaranteed to be identical in editor and PDF
        // Setting fixed positions for perfect alignment
        setFieldPositions({
          ...fieldPositions,
          lineBusiness: { ...fieldPositions.lineBusiness, right: 124 }, // Aligned with ISO
          isoClass: { ...fieldPositions.isoClass, right: 124 }  // Fixed position
        });
      }
    }
  }, []); // Only run once on mount

  // Load slide data from backend when component mounts
  useEffect(() => {
    const loadSlideData = async () => {
      if (!currentProjectId || !slideId) {
        return;
      }

      try {
        const result = await slideApiService.getSlideContent(currentProjectId, slideId);

        // Load field positions if they exist
        if (result.field_positions && Object.keys(result.field_positions).length > 0 && setFieldPositions) {
          setFieldPositions(prev => ({
            ...prev,
            ...result.field_positions
          }));
        }

        // Load slide content if it exists
        if (result.content && result.content.slideOneData && setFormData) {
          const slideOneData = result.content.slideOneData;

          // Only load if we have actual form data
          const hasFormData = Object.keys(slideOneData).some(key =>
            slideOneData[key] && slideOneData[key].toString().trim() !== ''
          );

          if (hasFormData) {
            setFormData(prev => ({
              ...prev,
              ...slideOneData
            }));
          }
        }
      } catch (error) {
        // Silently handle errors for draft projects
      }
    };

    loadSlideData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideId, currentProjectId]);

  // Note: Auto-save removed - Editor.jsx handles centralized saving via projectSaveService
  // This eliminates redundant API calls and prevents rate limiting issues

  // Auto-update ISO functionality when description changes
  useEffect(() => {
    const currentDescription = getFormValue('description');
    const currentIsoClass = getFormValue('isoClass');

    // Check if user is in "Others" mode - if so, skip all ISO matching
    const isOthersMode = currentIsoClass === 'Others';

    if (!currentDescription) {
      setDescriptionMatches([]);
      setIsDescriptionDropdownOpen(false);
      setIsLineBusinessDropdownOpen(false);

      // Handle clearing: only reset "Others" mode on second clear (after typing)
      if (currentIsoClass === 'Others' && !othersCleared) {
        // First clear after clicking "Others" - stay in Others mode
        setOthersCleared(true);
        hasTypedInOthersMode.current = false;
      } else if (currentIsoClass === 'Others' && othersCleared && hasTypedInOthersMode.current) {
        // Second clear AFTER typing - reset everything including the flag
        setFormValue('isoClass', '');
        setOthersCleared(false);
        hasTypedInOthersMode.current = false;
      } else if (currentIsoClass && currentIsoClass !== 'Others') {
        // Normal clear (not from Others mode)
        setFormValue('isoClass', '');
      }
      // If currentIsoClass === 'Others' but hasn't typed yet, do nothing (stay in Others mode)
      return;
    }

    // Track that user has typed in Others mode
    if (isOthersMode && currentDescription) {
      hasTypedInOthersMode.current = true;
    }

    // Skip auto-matching if the description already contains an ISO code (format: "#### - description")
    const isAlreadyFormatted = /^\d{4}\s*-\s*.+/.test(currentDescription);

    if (currentDescription && !isAlreadyFormatted && !isOthersMode) {
      const similarMatches = findSimilarMatches(currentDescription);

      if (similarMatches.length > 1) {
        // Multiple matches found - only show dropdown if user is actively editing
        setDescriptionMatches(similarMatches);
        if (isUserEditingDescription) {
          setIsDescriptionDropdownOpen(true);
        }
      } else if (similarMatches.length === 1) {
        // Single match - auto-populate with full format from database
        const bestMatch = similarMatches[0];
        const fullDescription = bestMatch.full_text || bestMatch.description || '';
        setFormValues({
          description: fullDescription,
          isoClass: fullDescription // Keep both in sync for backwards compatibility
        });
        setDescriptionMatches([]);
        setIsDescriptionDropdownOpen(false);
      } else {
        // No matches - clear matches but keep description
        setDescriptionMatches([]);
        setIsDescriptionDropdownOpen(false);
        // Update isoClass to match description for consistency (unless in Others mode)
        if (currentIsoClass !== currentDescription && !isOthersMode) {
          setFormValue('isoClass', currentDescription);
        }
      }
    } else if (!isOthersMode) {
      // Only sync isoClass with description if NOT in Others mode
      setDescriptionMatches([]);
      setIsDescriptionDropdownOpen(false);
      // Keep isoClass in sync with description
      if (currentIsoClass !== currentDescription) {
        setFormValue('isoClass', currentDescription);
      }
    } else {
      // In Others mode - clear dropdown and don't sync isoClass
      setDescriptionMatches([]);
      setIsDescriptionDropdownOpen(false);
    }
  }, [formData?.description, isUserEditingDescription]);

  const handleChange = (field, value) => {
    // Use location-aware data setter
    setFormValue(field, value);
    
    // Track field editing activity
    if (sessionUser && currentFormId) {
      const fieldName = field === 'insuredName' ? 'Insured Name' : 
                       field === 'premiseLocation' ? 'Premise Location' :
                       field === 'description' ? 'Description' :
                       field === 'website' ? 'Website' :
                       field === 'lineBusiness' ? 'Line of Business' :
                       field === 'isoClass' ? 'ISO Class' : field;
        
      // Create form-specific field ID to match dropdown
      const specificFieldId = `${field}-${currentFormId}`;
      
      fieldActivityService.startEditingField(sessionUser, specificFieldId, fieldName);
    }
  };

  const autoResize = (el) => {
    el.style.height = "auto"; 
    el.style.height = el.scrollHeight + "px"; 
  };

  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDraggingField(field);
    
    // For textarea fields, use the parent div wrapper; for other fields use the currentTarget
    const fieldContainer = e.currentTarget.tagName === 'TEXTAREA' 
      ? e.currentTarget.parentElement 
      : e.currentTarget;
    const fieldRect = fieldContainer.getBoundingClientRect();
    
    // Account for zoom level when calculating offset
    const zoomFactor = (zoomLevel || 100) / 100;
    
    // Calculate offset from cursor to field container's position, accounting for zoom
    const coords = getEventCoordinates(e);
    setDragOffset({
      x: (coords.clientX - fieldRect.left) / zoomFactor,
      y: (coords.clientY - fieldRect.top) / zoomFactor,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && draggingField) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Account for zoom level when calculating new position
      const zoomFactor = (zoomLevel || 100) / 100;
      
      // Calculate new field position maintaining the original offset, accounting for zoom
      const coords = getEventCoordinates(e);
      const newLeft = (coords.clientX - containerRect.left) / zoomFactor - dragOffset.x;
      const newTop = (coords.clientY - containerRect.top) / zoomFactor - dragOffset.y;
      
      // Get field width for right positioning calculation
      let fieldWidth;
      if (draggingField === 'lineBusiness' || draggingField === 'isoClass') {
        const layout = calculateDynamicLayout();
        fieldWidth = draggingField === 'lineBusiness' ? layout.lineBusinessWidth : layout.isoClassWidth;
      } else {
        fieldWidth = 960; // Match the width used in renderField function
      }
      
      // Convert to right positioning (container is 1280px wide)
      const containerWidth = 1280;
      const newRight = containerWidth - newLeft - fieldWidth;
      
      if (setFieldPositions) {
        setFieldPositions({
          ...(fieldPositions || {}),
          [draggingField]: {
            top: Math.max(0, newTop),
            right: Math.max(0, newRight),
          }
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingField(null);
  };

  // Add document event listeners for dragging (like editor.jsx)
  useEffect(() => {
    const handleDocumentMouseMove = (e) => {
      if (isDragging && draggingField) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Account for zoom level when calculating new position
        const zoomFactor = (zoomLevel || 100) / 100;
        
        // Calculate new field position maintaining the original offset, accounting for zoom
        const coords = getEventCoordinates(e);
        const newLeft = (coords.clientX - containerRect.left) / zoomFactor - dragOffset.x;
        const newTop = (coords.clientY - containerRect.top) / zoomFactor - dragOffset.y;
        
        // Get field width for right positioning calculation
        let fieldWidth;
        if (draggingField === 'lineBusiness' || draggingField === 'isoClass') {
          const layout = calculateDynamicLayout();
          fieldWidth = draggingField === 'lineBusiness' ? layout.lineBusinessWidth : layout.isoClassWidth;
        } else {
          fieldWidth = 960; // Match the width used in renderField function
        }
        
        // Convert to right positioning (container is 1280px wide)
        const containerWidth = 1280;
        const newRight = containerWidth - newLeft - fieldWidth;
        
        if (setFieldPositions) {
          setFieldPositions({
            ...(fieldPositions || {}),
            [draggingField]: {
              top: Math.max(0, newTop),
              right: Math.max(0, newRight),
            }
          });
        }
        e.preventDefault();
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggingField(null);
      }
    };

    const handleDocumentTouchMove = (e) => {
      if (isDragging && draggingField) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Account for zoom level when calculating new position
        const zoomFactor = (zoomLevel || 100) / 100;
        
        // Calculate new field position maintaining the original offset, accounting for zoom
        const coords = getEventCoordinates(e);
        const newLeft = (coords.clientX - containerRect.left) / zoomFactor - dragOffset.x;
        const newTop = (coords.clientY - containerRect.top) / zoomFactor - dragOffset.y;
        
        // Get field width for right positioning calculation
        let fieldWidth;
        if (draggingField === 'lineBusiness' || draggingField === 'isoClass') {
          const layout = calculateDynamicLayout();
          fieldWidth = draggingField === 'lineBusiness' ? layout.lineBusinessWidth : layout.isoClassWidth;
        } else {
          fieldWidth = 960; // Match the width used in renderField function
        }
        
        // Convert to right positioning (container is 1280px wide)
        const containerWidth = 1280;
        const newRight = containerWidth - newLeft - fieldWidth;
        
        if (setFieldPositions) {
          setFieldPositions({
            ...(fieldPositions || {}),
            [draggingField]: {
              top: Math.max(0, newTop),
              right: Math.max(0, newRight),
            }
          });
        }
        e.preventDefault();
      }
    };

    const handleDocumentTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggingField(null);
      }
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
      document.addEventListener('touchend', handleDocumentTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('touchmove', handleDocumentTouchMove);
        document.removeEventListener('touchend', handleDocumentTouchEnd);
      };
    }
  }, [isDragging, draggingField, dragOffset]);

  const commonStyle = {
    position: "absolute",
    width: "960px", // Reduced by another 2% to avoid overlapping the green square
    backgroundColor: "transparent", // Changed from background to backgroundColor
    border: "none",
    color: "#fff",
    fontFamily: "'Montserrat', sans-serif",
    outline: "none",
    textAlign: "right",
    transform: "translateY(-50%)",
    resize: "none",
    lineHeight: "1.2",
    height: "auto",
    minHeight: "30px",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    cursor: "text",
  };

  const wrapperStyle = {
    position: "absolute",
    padding: "5px",
    border: "2px dashed transparent",
    borderRadius: "4px",
    cursor: "move",
  };

  const activeWrapperStyle = {
    ...wrapperStyle,
    border: "2px dashed rgba(255, 255, 255, 0.5)",
    background: "rgba(255, 255, 255, 0.1)",
  };

  // Calculate dynamic layout for Line of Business and ISO Class
  const calculateDynamicLayout = () => {
    const totalAvailableWidth = 860; // Same as insured name
    const minFontSize = 18;
    const maxFontSize = 30;
    const baseFontSize = fontSizes.lineBusiness || 30;
    const gap = 2; // Minimal gap between fields
    
    const lineBusinessText = getFormValue('lineBusiness') || "Line of Business";
    const isoClassText = getFormValue('isoClass') || "ISO Class Code";
    
    
    // More accurate text width estimation based on actual character widths
    const estimateTextWidth = (text, fontSize) => {
      // Average character width in Montserrat font is approximately 0.6 * fontSize
      // But adjust for common characters in business/ISO text
      const avgCharWidth = fontSize * 0.5; // More conservative estimate
      return text.length * avgCharWidth;
    };
    
    let currentFontSize = baseFontSize;
    let lineBusinessWidth, isoClassWidth;
    
    // Adjust font size until both texts fit within available width
    do {
      const lineBusinessTextWidth = estimateTextWidth(lineBusinessText, currentFontSize);
      const isoClassTextWidth = estimateTextWidth(isoClassText, currentFontSize);
      
      // Calculate required widths with padding - let fields adjust to content
      lineBusinessWidth = lineBusinessTextWidth + 40;
      isoClassWidth = (isoClassTextWidth + 40) * 1.05; // Increased padding and width
      
      const totalUsedWidth = lineBusinessWidth + isoClassWidth + gap;
      
      // Only reduce font size if total width exceeds available space
      if (totalUsedWidth > totalAvailableWidth && currentFontSize > minFontSize) {
        currentFontSize -= 1;
      } else {
        break;
      }
    } while (currentFontSize > minFontSize);
    
    // Calculate positions - ISO stays at original position, Line Business immediately to its left
    const isoClassRight = 124; // Keep ISO at original position  
    const lineBusinessRight = isoClassRight + isoClassWidth + gap; // Line Business positioned to the left of ISO
    
    const result = {
      fontSize: Math.min(currentFontSize, maxFontSize),
      lineBusinessWidth,
      isoClassWidth,
      lineBusinessRight,
      isoClassRight,
    };
    
    // Dynamic layout calculated
    
    return result;
  };

  // Function to truncate long ISO descriptions intelligently
  const truncateIsoDescription = (description, maxWords = 2) => {
    if (!description) return description;
    
    // Split by spaces and symbols to treat words after symbols as separate words
    const words = description.split(/[\s\-_.,;:()]+/).filter(word => word.length > 0);
    
    if (words.length <= maxWords) return words.join(' ');
    
    // Just take the first two words
    return words.slice(0, maxWords).join(' ');
  };

  const renderLineBusinessDropdown = () => {
    const defaultFieldPositions = {
      lineBusiness: { top: 546, right: 124 }, // Aligned with ISO
    };
    const position = (fieldPositions && fieldPositions.lineBusiness) || defaultFieldPositions.lineBusiness;
    const isActive = selectedField === 'lineBusiness';
    const layout = calculateDynamicLayout();
    
    // Use fixed positioning to ensure editor and PDF match exactly
    
    const lineBusinessOptions = [
      "Commercial Property - Special Multi Peril",
      "Commercial Property - All risk", 
      "Garage Liability",
      "General Liability"
    ];

    const handleLineBusinessOptionClick = (value) => {
      setFormData({ lineBusiness: value });
      setIsLineBusinessDropdownOpen(false);
    };

    return (
      <div
        key="lineBusiness"
        style={{
          position: "absolute",
          top: position.top,
          right: position.right,
          width: layout.lineBusinessWidth,
          transform: "translateY(-50%)",
        }}
      >

        {/* Main dropdown field */}
        <div
          onClick={() => {
            setIsLineBusinessDropdownOpen(!isLineBusinessDropdownOpen);
            onSelect('lineBusiness');
          }}
          onMouseDown={(e) => {
            // Only start dragging if not clicking on dropdown arrow area
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (clickX > 30) { // Only drag if clicking outside dropdown arrow area
              handleFieldMouseDown(e, 'lineBusiness');
            }
          }}
          style={{
            position: "relative",
            width: layout.lineBusinessWidth,
            height: "40px",
            minHeight: "40px",
            background: "transparent",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: layout.fontSize,
            textAlign: "right",
            padding: "8px 30px 8px 8px",
            cursor: "move",
            lineHeight: "1.3",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            whiteSpace: "nowrap",
            overflow: "visible",
            backgroundImage: "none",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "8px center",
            backgroundSize: "16px",
          }}
        >
          {getFormValue('lineBusiness') || "Line of Business"}
        </div>

        {/* Custom dropdown */}
        {isLineBusinessDropdownOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "0",
              width: layout.lineBusinessWidth,
              background: "#fff",
              border: "none",
              borderRadius: "4px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              zIndex: 9999,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {lineBusinessOptions.map((option) => (
              <div
                key={option}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLineBusinessOptionClick(option);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#333",
                  cursor: "pointer",
                  textAlign: "right",
                  borderBottom: "none",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render single Type of Operation field that combines description and ISO functionality
  const renderTypeOfOperationField = () => {
    const defaultFieldPositions = {
      description: { top: 430, right: 124 },
    };
    const position = (fieldPositions && fieldPositions.description) || defaultFieldPositions.description;
    const isActive = selectedField === 'description';
    
    const handleDescriptionOptionClick = (isoCode) => {
      // When user selects an ISO code, replace the description with the full ISO text from database
      const fullDescription = isoCode.full_text || isoCode.description || '';
      setFormData({ 
        description: fullDescription,
        isoClass: fullDescription // Keep both in sync for backwards compatibility
      });
      setIsDescriptionDropdownOpen(false);
      setDescriptionMatches([]);
    };

    // Display value - show ISO code if available, otherwise show description
    const displayValue = getFormValue('description') || "";

    return (
      <div
        key="typeOfOperation"
        style={{
          position: "absolute",
          top: position.top - 20,
          right: position.right,
          width: "860px",
        }}
      >
        <textarea
          value={displayValue}
          onChange={(e) => handleChange('description', e.target.value)}
          onInput={(e) => autoResize(e.target)}
          placeholder="Type of Operation"
          onFocus={() => {
            onSelect('description');
            setIsUserEditingDescription(true);
          }}
          onBlur={() => {
            setIsUserEditingDescription(false);
          }}
          onClick={() => {
            if (descriptionMatches.length > 1) {
              setIsDescriptionDropdownOpen(!isDescriptionDropdownOpen);
            }
            onSelect('description');
            setIsUserEditingDescription(true);
          }}
          onMouseDown={(e) => {
            if (selectedField === 'description') {
              handleFieldMouseDown(e, 'description');
            }
          }}
          onTouchStart={(e) => {
            if (selectedField === 'description') {
              handleFieldMouseDown(e, 'description');
            }
          }}
          style={{
            position: "relative",
            top: "0",
            right: "0",
            transform: "none",
            width: "860px",
            fontSize: fontSizes.description,
            border: "none",
            backgroundColor: isActive ? "rgba(255, 255, 255, 0.05)" : "transparent",
            borderRadius: "4px",
            textOverflow: "ellipsis",
            cursor: isActive ? "move" : (descriptionMatches.length > 1 ? "pointer" : "text"),
            color: "#fff",
            fontFamily: "'Montserrat', sans-serif",
            outline: "none",
            textAlign: "right",
            resize: "none",
            lineHeight: "1.2",
            minHeight: "60px",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundImage: "none",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "8px center",
            backgroundSize: "16px",
          }}
        />

        {/* Custom dropdown for multiple ISO matches */}
        {isDescriptionDropdownOpen && descriptionMatches.length > 1 && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            onWheel={(e) => e.stopPropagation()}
            className="description-dropdown"
            style={{
              position: "absolute",
              bottom: "100%",
              left: "0",
              width: "860px",
              background: "#fff",
              border: "none",
              borderRadius: "4px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              zIndex: 9999,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {/* Close/Exit button */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "4px 8px",
                borderBottom: "1px solid #eee",
                background: "#f8f9fa",
              }}
            >
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDescriptionDropdownOpen(false);
                  setDescriptionMatches([]);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#666",
                  cursor: "pointer",
                  padding: "0 4px",
                  borderRadius: "2px",
                  lineHeight: "1",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e9ecef";
                  e.currentTarget.style.color = "#333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#666";
                }}
                title="Close dropdown"
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: "8px", fontSize: "12px", color: "#666", borderBottom: "1px solid #eee" }}>
              Multiple ISO codes match your operation type. Select one:
            </div>

            {/* Others option - shown at top if user types "others" */}
            {displayValue.toLowerCase().includes('other') && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setFormData({
                    description: '',  // Clear description so user can type freely
                    isoClass: 'Others'  // Mark as Others mode
                  });
                  setOthersCleared(true); // Mark as cleared since clicking Others clears the field
                  setIsDescriptionDropdownOpen(false);
                  setDescriptionMatches([]);
                }}
                style={{
                  padding: "12px 15px",
                  fontSize: "13px",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#333",
                  cursor: "pointer",
                  textAlign: "right",
                  borderBottom: "1px solid #eee",
                  border: "none",
                  background: "#fffacd",  // Light yellow highlight
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#ffeb3b"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fffacd"}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px", fontStyle: "italic" }}>
                  Others
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  Free-form text entry (no ISO code)
                </div>
              </button>
            )}

            {descriptionMatches.map((isoCode, index) => (
              <button
                key={`${isoCode.code}-${index}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDescriptionOptionClick(isoCode);
                }}
                style={{
                  padding: "12px 15px",
                  fontSize: "13px",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#333",
                  cursor: "pointer",
                  textAlign: "right",
                  borderBottom: "1px solid #eee",
                  border: "none",
                  background: "transparent",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {isoCode.code || 'No Code'}
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {isoCode.full_text || isoCode.description || 'No description'}
                </div>
              </button>
            ))}

            {/* Others option at bottom if not typing "others" */}
            {!displayValue.toLowerCase().includes('other') && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setFormData({
                    description: '',  // Clear description so user can type freely
                    isoClass: 'Others'  // Mark as Others mode
                  });
                  setOthersCleared(true); // Mark as cleared since clicking Others clears the field
                  setIsDescriptionDropdownOpen(false);
                  setDescriptionMatches([]);
                }}
                style={{
                  padding: "12px 15px",
                  fontSize: "13px",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#333",
                  cursor: "pointer",
                  textAlign: "right",
                  border: "none",
                  background: "transparent",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px", fontStyle: "italic" }}>
                  Others
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  Free-form text entry (no ISO code)
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };


  const renderField = (field, placeholder, additionalStyles = {}) => {
    // Provide default fieldPositions if not passed or field doesn't exist
    const defaultFieldPositions = {
      insuredName: { top: 180, right: 124 }, // Adjusted for removed transform
      premiseLocation: { top: 310, right: 124 }, // Adjusted for removed transform
      website: { top: 370, right: 124 }, // Adjusted for removed transform
      description: { top: 430, right: 124 }, // Adjusted for removed transform
      lineBusiness: { top: 526, right: 440 }, // Adjusted for removed transform
      isoClass: { top: 490, right: 124 }, // Adjusted for removed transform
    };
    
    const position = (fieldPositions && fieldPositions[field]) || defaultFieldPositions[field];
    const isActive = selectedField === field;
    
    // Calculate dynamic layout for ISO Class field
    let fieldWidth, fieldRight, fieldFontSize;
    if (field === 'isoClass') {
      const layout = calculateDynamicLayout();
      fieldWidth = layout.isoClassWidth;
      fieldRight = layout.isoClassRight;
      fieldFontSize = layout.fontSize;
    } else {
      fieldWidth = "960px"; // Reduced by another 2% to avoid overlapping the green square
      fieldRight = position.right;
      fieldFontSize = fontSizes[field];
    }
    
    return (
      <div
        key={field}
        style={{
          position: "absolute",
          top: position.top - 20, // Adjust top position to account for removed transform
          right: fieldRight,
          width: fieldWidth,
          // Removed transform: "translateY(-50%)" for better PDF export consistency
        }}
      >

        <textarea
          value={getFormValue(field) || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          onInput={(e) => autoResize(e.target)}
          placeholder={placeholder}
          onFocus={() => onSelect(field)}
          onMouseMove={(e) => {
            // Change cursor based on position when field is selected
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
              const borderThickness = 8; // Reduced from 20 to 8 pixels
              
              const isOnLeftEdge = clickX <= borderThickness;
              const isOnRightEdge = clickX >= rect.width - borderThickness;
              const isOnTopEdge = clickY <= borderThickness;
              const isOnBottomEdge = clickY >= rect.height - borderThickness;
              
              if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
                e.target.style.cursor = "move";
              } else {
                e.target.style.cursor = "text";
              }
            }
          }}
          onMouseDown={(e) => {
            // Only start dragging if clicking on the border/edge area, not in the text content
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
              const borderThickness = 8; // Reduced from 20 to 8 pixels for better text selection
              
              // Check if click is near the edges (drag zones)
              const isOnLeftEdge = clickX <= borderThickness;
              const isOnRightEdge = clickX >= rect.width - borderThickness;
              const isOnTopEdge = clickY <= borderThickness;
              const isOnBottomEdge = clickY >= rect.height - borderThickness;
              
              if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
                e.preventDefault(); // Prevent text selection only in drag zones
                handleFieldMouseDown(e, field);
              }
              // Otherwise, allow normal text selection behavior
            }
          }}
          onTouchStart={(e) => {
            // Only start dragging if touching on the border/edge area, not in the text content
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
              const borderThickness = 8; // Reduced from 20 to 8 pixels for better text selection
              
              // Check if touch is near the edges (drag zones)
              const isOnLeftEdge = clickX <= borderThickness;
              const isOnRightEdge = clickX >= rect.width - borderThickness;
              const isOnTopEdge = clickY <= borderThickness;
              const isOnBottomEdge = clickY >= rect.height - borderThickness;
              
              if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
                e.preventDefault(); // Prevent text selection only in drag zones
                handleFieldMouseDown(e, field);
              }
              // Otherwise, allow normal text selection behavior
            }
          }}
          style={{
            ...commonStyle,
            position: "relative",
            top: "0",
            right: "0",
            transform: "none",
            width: fieldWidth,
            fontSize: fieldFontSize,
            border: isActive ? "2px dashed rgba(0, 123, 255, 0.6)" : "none",
            backgroundColor: isActive ? "rgba(255, 255, 255, 0.05)" : "transparent",
            boxShadow: isActive ? "0 0 0 1px rgba(0, 123, 255, 0.2)" : "none",
            borderRadius: "4px",
            textOverflow: "ellipsis",
            cursor: "text",
            ...additionalStyles,
          }}
        />
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
        backgroundImage: "url('/Template/Template-01.png')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        margin: "0 auto",
        border: "none",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        fontFamily: "'Montserrat', sans-serif",
        userSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onClick={(e) => {
        // If clicking on the container background (not on a field), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
          setIsLineBusinessDropdownOpen(false);
          setIsDescriptionDropdownOpen(false);
        }
      }}
    >

      {renderField("insuredName", "Insured's Name", { fontWeight: "normal" })}
      {renderField("premiseLocation", "123 Main St, City, State 12345")}
      {showWebsite && renderField("website", "www.example.com")}
      {renderTypeOfOperationField()}
      {renderLineBusinessDropdown()}
    </div>
  );
});

SlideOne.displayName = 'SlideOne';
export default SlideOne;