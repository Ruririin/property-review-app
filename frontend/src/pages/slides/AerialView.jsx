import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import ImageFrame from "../../components/ImageFrame";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";
import slideApiService from "../../services/slideApiService";

const AerialView = forwardRef((
  {
    formData,
    setFormData,
    onSelect,
    selectedField,
    fontSizes,
    slideId,
    slideData,
    updateSlideData,
    zoomLevel,
    isActiveSlide,
    fieldPositions,
    setFieldPositions,
    currentProjectId,
  },
  ref
) => {
  const containerRef = useRef(null);
  const slideDataRef = useRef(slideData);

  const activeProjectId = currentProjectId;

  // Frame image handler for backend upload/delete
  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(
    activeProjectId,
    slideId
  );

  const frameImages = slideData?.frameImages || {};
  const frameMeta = slideData?.frameMeta || {};

  // Keep ref updated with latest slideData
  useEffect(() => {
    slideDataRef.current = slideData;
  }, [slideData]);

  const handleImageUpload = async (frameId, imageData) => {
    const currentFrameImages = slideDataRef.current?.frameImages || {};
    const currentFrameMeta = slideDataRef.current?.frameMeta || {};
    const updatedFrameImages = { ...currentFrameImages, [frameId]: imageData };

    updateSlideData({ frameImages: updatedFrameImages });

    const hasDatabaseId = slideData?._appState?.databaseId || false;
    if (activeProjectId && hasDatabaseId) {
      const result = await uploadFrameImage(frameId, imageData);
      if (result && result.success) {
        updateSlideData({
          frameImages: updatedFrameImages,
          frameMeta: {
            ...currentFrameMeta,
            [frameId]: {
              filePath: result.filePath,
              url: result.url,
              width: result.width,
              height: result.height,
              aspectRatio: result.aspectRatio,
            },
          },
        });
      }
    }
  };

  const handleImageRemove = async (frameId) => {
    const filePath = frameMeta[frameId]?.filePath;
    if (filePath && activeProjectId) {
      await deleteFrameImage(frameId, filePath);
    }
    const newFrameImages = { ...frameImages };
    const newFrameMeta = { ...frameMeta };
    delete newFrameImages[frameId];
    delete newFrameMeta[frameId];
    updateSlideData({ frameImages: newFrameImages, frameMeta: newFrameMeta });
  };

  // Helper function to handle both mouse and touch events
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Expose method for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      // Sync field positions if needed
    },
  }));

  // Load slide data from backend when component mounts
  useEffect(() => {
    const loadSlideData = async () => {
      if (!currentProjectId || !slideId) {
        return;
      }

      try {
        const result = await slideApiService.getSlideContent(
          currentProjectId,
          slideId
        );

        // Load slide content if it exists
        if (result.content && result.content.aerialViewData && setFormData) {
          const aerialViewData = result.content.aerialViewData;

          // Only load if we have actual form data
          const hasFormData = Object.keys(aerialViewData).some(
            (key) =>
              aerialViewData[key] &&
              aerialViewData[key].toString().trim() !== ""
          );

          if (hasFormData) {
            setFormData((prev) => ({
              ...prev,
              ...aerialViewData,
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

  const defaultFieldPositions = {
    aerialViewInfo: { bottom: -11.4, right: 0.5 }, // Bottom right position
    premiseLocation: { top: 670, right: 1.2 }, // Same positioning as other slides
  };

  const handleFieldMouseDown = (e, field) => {
    if (selectedField !== field) return;

    e.preventDefault();
    const coords = getEventCoordinates(e);
    const initialMouseX = coords.clientX;
    const initialMouseY = coords.clientY;

    const fieldElement = e.target.parentElement;
    const position =
      (fieldPositions && fieldPositions[field]) ||
      defaultFieldPositions[field];
    const initialBottom =
      position.bottom !== undefined ? position.bottom : null;
    const initialTop = position.top !== undefined ? position.top : null;
    const initialRight = position.right || 0.5;

    const handleMouseMove = (moveEvent) => {
      const coords = getEventCoordinates(moveEvent);
      const deltaX = coords.clientX - initialMouseX;
      const deltaY = coords.clientY - initialMouseY;

      let updatedPosition;
      if (initialBottom !== null) {
        // Using bottom positioning
        const newBottom = initialBottom - deltaY;
        const newRight = initialRight - (deltaX / window.innerWidth) * 100;
        updatedPosition = { bottom: newBottom, right: newRight };
      } else {
        // Using top positioning
        const newTop = initialTop + deltaY;
        const newRight = initialRight - (deltaX / window.innerWidth) * 100;
        updatedPosition = { top: newTop, right: newRight };
      }

      const updatedPositions = {
        ...fieldPositions,
        [field]: updatedPosition,
      };

      setFieldPositions(updatedPositions);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleMouseMove, { passive: false });
    document.addEventListener("touchend", handleMouseUp);
  };

  const autoResize = (textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = Math.max(60, textarea.scrollHeight) + "px";
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const renderField = (field, placeholder) => {
    const position =
      (fieldPositions && fieldPositions[field]) ||
      defaultFieldPositions[field];
    const isActive = selectedField === field;
    const fieldFontSize = fontSizes[field] || 28;

    // Calculate dynamic width based on text content
    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(
      300,
      Math.min(900, textContent.length * 16 + 120)
    );

    const commonStyle = {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: "400",
      color: "#8B9A5B",
      textAlign: "right",
      resize: "none",
      outline: "none",
      padding: "4px 0px 4px 8px",
      lineHeight: "1.4",
      minHeight: "60px",
      overflow: "hidden",
      whiteSpace: "nowrap",
    };

    return (
      <div
        key={field}
        style={{
          position: "absolute",
          ...(position.bottom !== undefined
            ? { bottom: `${position.bottom}px` }
            : { top: `${position.top}px` }),
          right: `${position.right}%`,
          width: `${estimatedWidth}px`,
          zIndex: selectedField === field ? 1001 : 1000,
        }}
      >
        <textarea
          value={formData[field] || ""}
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
              const borderThickness = 20;

              const isOnLeftEdge = clickX <= borderThickness;
              const isOnRightEdge = clickX >= rect.width - borderThickness;
              const isOnTopEdge = clickY <= borderThickness;
              const isOnBottomEdge = clickY >= rect.height - borderThickness;

              if (
                isOnLeftEdge ||
                isOnRightEdge ||
                isOnTopEdge ||
                isOnBottomEdge
              ) {
                e.target.style.cursor = "move";
              } else {
                e.target.style.cursor = "text";
              }
            }
          }}
          onMouseDown={(e) => {
            // Only start dragging if clicking on the border/edge area
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
              const borderThickness = 20;

              const isOnLeftEdge = clickX <= borderThickness;
              const isOnRightEdge = clickX >= rect.width - borderThickness;
              const isOnTopEdge = clickY <= borderThickness;
              const isOnBottomEdge = clickY >= rect.height - borderThickness;

              if (
                isOnLeftEdge ||
                isOnRightEdge ||
                isOnTopEdge ||
                isOnBottomEdge
              ) {
                e.preventDefault();
                handleFieldMouseDown(e, field);
              }
            }
          }}
          onTouchStart={(e) => {
            // Only start dragging if touching on the border/edge area
            if (selectedField === field) {
              const rect = e.target.getBoundingClientRect();
              const coords = getEventCoordinates(e);
              const clickX = coords.clientX - rect.left;
              const clickY = coords.clientY - rect.top;
              const borderThickness = 20;

              const isOnLeftEdge = clickX <= borderThickness;
              const isOnRightEdge = clickX >= rect.width - borderThickness;
              const isOnTopEdge = clickY <= borderThickness;
              const isOnBottomEdge = clickY >= rect.height - borderThickness;

              if (
                isOnLeftEdge ||
                isOnRightEdge ||
                isOnTopEdge ||
                isOnBottomEdge
              ) {
                e.preventDefault();
                handleFieldMouseDown(e, field);
              }
            }
          }}
          style={{
            ...commonStyle,
            position: "relative",
            top: "0",
            right: "0",
            transform: "none",
            width: `${estimatedWidth}px`,
            fontSize: fieldFontSize,
            border: isActive
              ? "2px dashed rgba(0, 123, 255, 0.3)"
              : "none",
            backgroundColor: isActive
              ? "rgba(255, 255, 255, 0.05)"
              : "transparent",
            borderRadius: "4px",
            textOverflow: "ellipsis",
            cursor: "text",
          }}
        />
      </div>
    );
  };

  const renderAppleMapsField = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isActive = selectedField === "websiteInfo";
    const defaultPosition = {
      websiteInfo: { bottom: 40, right: 1.2 },
    };

    const options = [
      { value: "Satellite View", label: "www.apple.com/maps - Satellite View" },
      { value: "Flyover View", label: "www.apple.com/maps - Flyover View" }
    ];

    const currentViewType = formData?.websiteInfo || "";

    const handleOptionClick = (value) => {
      setFormData({ ...formData, websiteInfo: value });
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
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
            onSelect("websiteInfo");
          }}
          style={{
            position: "relative",
            width: "600px",
            height: "44px",
            backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
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
            whiteSpace: "nowrap",
            overflow: "visible",
          }}
        >
          {options.find(opt => opt.value === currentViewType)?.label || "www.apple.com/maps - (source) – (mm/yyyy)"}
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
                  e.stopPropagation();
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
                  backgroundColor: currentViewType === option.value ? "#f0f0f0" : "transparent",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentViewType === option.value ? "#f0f0f0" : "transparent";
                }}
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
        background:
          "url('/Template/Template-03.png') center/100% 100% no-repeat",
        margin: "0 auto",
        overflow: "hidden",
        userSelect: "none",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      }}
      onClick={(e) => {
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {renderAppleMapsField()}
      {renderField("premiseLocation", "www.apple.com/maps(mm/yyyy)")}

      {/* Screenshot area - users can paste aerial view images here */}
      {!frameImages[1] && (
        <div
          style={{
            position: "absolute",
            top: "108px",
            left: "108px",
            width: "1064px",
            height: "504px",
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
            <div style={{ marginBottom: "10px", fontSize: "20px" }}>🗺️</div>
            <div
              style={{ fontWeight: "bold", marginBottom: "12px" }}
            >
              Apple Maps Aerial View
            </div>
            <div
              style={{
                fontSize: "13px",
                opacity: "0.9",
                textAlign: "center",
                lineHeight: "1.5",
                maxWidth: "500px",
              }}
            >
              Paste screenshot of Apple Maps aerial/satellite view here
            </div>
            <div
              style={{
                textAlign: "center",
                marginTop: "10px",
                fontStyle: "italic",
                opacity: "0.7",
              }}
            >
              Paste here (Ctrl+V)
            </div>
          </div>
        </div>
      )}

      {/* Single image frame for aerial view */}
      <div
        style={{
          position: "absolute",
          top: "108px",
          left: "108px",
          width: "1064px",
          height: "504px",
        }}
      >
        <ImageFrame
          id={1}
          image={frameImages[1]}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          style={{ width: "1064px", height: "504px" }}
        />
      </div>
    </div>
  );
});

AerialView.displayName = "AerialView";
export default AerialView;