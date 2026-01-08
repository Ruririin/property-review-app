import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import FrameLayout from "../../components/FrameLayout";
import FrameSelector from "../../components/FrameSelector";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";

const StreetView = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  slideId,
  slideData,
  updateSlideData,
  zoomLevel,
  isActiveSlide,
  fieldPositions,
  setFieldPositions,
  projectId,
  currentProjectId,
}, ref) => {
  const containerRef = useRef(null);

  // Use projectId or currentProjectId (whichever is available)
  const activeProjectId = projectId || currentProjectId;

  // Frame image handler for backend upload/delete
  const { uploadFrameImage, deleteFrameImage, uploadingFrames } = useFrameImageHandler(
    activeProjectId,
    slideId
  );

  // Frame layout state (default to 1 frame)
  const [frameLayout, setFrameLayout] = useState(slideData?.frameLayout || 1);
  const frameImages = slideData?.frameImages || {};
  const frameMeta = slideData?.frameMeta || {}; // Store backend file paths

  const handleImageUpload = async (frameId, imageData, file) => {
    // Store the base64 data immediately for display
    updateSlideData({
      frameImages: { ...frameImages, [frameId]: imageData }
    });

    // Upload to backend if project ID is available
    if (activeProjectId) {
      const result = await uploadFrameImage(frameId, imageData);

      if (result && result.success) {
        // Store backend metadata
        updateSlideData({
          frameMeta: {
            ...frameMeta,
            [frameId]: {
              filePath: result.filePath,
              url: result.url,
              width: result.width,
              height: result.height,
              aspectRatio: result.aspectRatio
            }
          }
        });
        console.log(`Frame ${frameId} uploaded to backend successfully`);
      } else {
        console.error(`Failed to upload frame ${frameId} to backend`);
      }
    }
  };

  const handleImageRemove = async (frameId) => {
    // Get file path from metadata
    const filePath = frameMeta[frameId]?.filePath;

    // Delete from backend if file path exists
    if (filePath && activeProjectId) {
      await deleteFrameImage(frameId, filePath);
    }

    // Remove from frontend
    const newFrameImages = { ...frameImages };
    const newFrameMeta = { ...frameMeta };
    delete newFrameImages[frameId];
    delete newFrameMeta[frameId];

    updateSlideData({
      frameImages: newFrameImages,
      frameMeta: newFrameMeta
    });
  };

  const handleFrameLayoutChange = (layout) => {
    setFrameLayout(layout);
    updateSlideData({ frameLayout: layout });
  };

  // Expose method for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  const renderField = (field, placeholder) => {
    const isActive = selectedField === field;
    const defaultPosition = {
      websiteInfo: { bottom: 31.8, right: 0.5 }, // Moved up by 6% for PDF compatibility
      premiseLocation: { top: 670, right: 1.2 }, // Same positioning as Aerial view
    };

    // Use fieldPositions if available, otherwise fall back to defaultPosition
    const position = (fieldPositions && fieldPositions[field]) || defaultPosition[field];

    // Calculate dynamic width based on text content
    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120));

    // For websiteInfo, use a div-based approach for better PDF rendering
    if (field === 'websiteInfo') {
      return (
        <div
          key={field}
          style={{
            position: "absolute",
            width: `${estimatedWidth}px`,
            background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
            border: isActive
              ? "2px solid rgba(0,0,0,0.3)"
              : "2px solid transparent",
            borderRadius: "4px",
            fontSize: "28px",
            fontFamily: "'Montserrat', sans-serif",
            textAlign: "right",
            color: "#8B9A5B",
            padding: "4px 0px 4px 8px",
            outline: "none",
            whiteSpace: "nowrap",
            cursor: "text",
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            ...(position.bottom !== undefined 
              ? { bottom: `${position.bottom}px` }
              : { top: `${position.top}px` }),
            right: `${position.right}%`,
            zIndex: isActive ? 1001 : 1000, // Ensure text fields are above images
          }}
        >
          <input
            value={formData[field] || ""}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            onFocus={() => onSelect(field)}
            placeholder={placeholder}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "28px",
              fontFamily: "'Montserrat', sans-serif",
              textAlign: "right",
              color: "#8B9A5B",
              outline: "none",
              width: "100%",
              padding: "0",
            }}
          />
        </div>
      );
    }

    // For other fields, use regular textarea
    return (
      <textarea
        key={field}
        value={formData[field] || ""}
        onChange={(e) =>
          setFormData({ ...formData, [field]: e.target.value })
        }
        onFocus={() => onSelect(field)}
        placeholder={placeholder}
        style={{
          position: "absolute",
          width: `${estimatedWidth}px`,
          background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
          border: isActive
            ? "2px solid rgba(0,0,0,0.3)"
            : "2px solid transparent",
          borderRadius: "4px",
          fontSize: "28px",
          fontFamily: "'Montserrat', sans-serif",
          textAlign: "right",
          resize: "none",
          color: "#8B9A5B",
          padding: "4px 0px 4px 8px",
          outline: "none",
          whiteSpace: "nowrap",
          ...(position.bottom !== undefined 
            ? { bottom: `${position.bottom}px` }
            : { top: `${position.top}px` }),
          right: `${position.right}%`,
          zIndex: isActive ? 1001 : 1000, // Ensure text fields are above images
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        backgroundImage: "url('/Template/Template-04.png')",
        backgroundSize: "100% 100%",
        margin: "0 auto",
        overflow: "hidden",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {renderField("websiteInfo", "www.(source).com/(source) – (mm/yyyy)")}
      {renderField("premiseLocation", "www.(source).com/maps(mm/yyyy)")}

      {/* Frame layout selector */}
      <FrameSelector
        currentLayout={frameLayout}
        onLayoutChange={handleFrameLayoutChange}
      />

      {/* Image frames */}
      <div
        style={{
          position: "absolute",
          top: "108px",
          left: "108px",
          width: "1064px",
          height: "504px",
        }}
      >
        <FrameLayout
          layoutType={frameLayout}
          images={frameImages}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
        />
      </div>
    </div>
  );
});

StreetView.displayName = 'StreetView';
export default StreetView;