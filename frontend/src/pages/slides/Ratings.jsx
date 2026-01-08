import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import FrameLayout from "../../components/FrameLayout";
import FrameSelector from "../../components/FrameSelector";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";

const Ratings = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  fieldPositions,
  setFieldPositions,
  zoomLevel,
  slideData,
  updateSlideData,
  isActiveSlide,
  slideId = 'ratings',
  projectId,
  currentProjectId,
}, ref) => {

  const containerRef = useRef(null);

  const activeProjectId = projectId || currentProjectId;
  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(activeProjectId, slideId);

  // Frame layout state (default to 1 frame)
  const [frameLayout, setFrameLayout] = useState(slideData?.frameLayout || 1);
  const frameImages = slideData?.frameImages || {};
  const frameMeta = slideData?.frameMeta || {};

  const handleImageUpload = async (frameId, imageData, file) => {
    updateSlideData({ frameImages: { ...frameImages, [frameId]: imageData } });
    if (activeProjectId) {
      const result = await uploadFrameImage(frameId, imageData);
      if (result?.success) {
        updateSlideData({
          frameMeta: { ...frameMeta, [frameId]: { filePath: result.filePath, url: result.url, width: result.width, height: result.height, aspectRatio: result.aspectRatio } }
        });
      }
    }
  };

  const handleImageRemove = async (frameId) => {
    const filePath = frameMeta[frameId]?.filePath;
    if (filePath && activeProjectId) await deleteFrameImage(frameId, filePath);
    const newFrameImages = { ...frameImages };
    const newFrameMeta = { ...frameMeta };
    delete newFrameImages[frameId];
    delete newFrameMeta[frameId];
    updateSlideData({ frameImages: newFrameImages, frameMeta: newFrameMeta });
  };

  const handleFrameLayoutChange = (layout) => {
    setFrameLayout(layout);
    updateSlideData({ frameLayout: layout });
  };

  // Expose method to sync current state positions to DOM for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  return (
    <div
      ref={containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        background: "url('/Template/Template-11.png') center/100% 100% no-repeat",
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
      onClick={(e) => {
        // If clicking on empty area (not on image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
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

Ratings.displayName = 'Ratings';
export default Ratings;