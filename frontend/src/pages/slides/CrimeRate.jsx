import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import FrameLayout from "../../components/FrameLayout";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";

const CrimeRate = forwardRef(({
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
  slideId = 'crimeRate',
  projectId,
  currentProjectId,
}, ref) => {

  const containerRef = useRef(null);

  const activeProjectId = projectId || currentProjectId;
  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(activeProjectId, slideId);

  // Frame images for custom layout (1 rectangle top, 2 squares bottom)
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

  // Custom layout configuration for Crime Rate slide
  const BORDER_INCHES = 1.5;
  const SLIDE_WIDTH = 10;
  const SLIDE_HEIGHT = 7.5;
  const PIXELS_PER_INCH = 96;

  const borderPx = BORDER_INCHES * PIXELS_PER_INCH;
  const slideWidthPx = SLIDE_WIDTH * PIXELS_PER_INCH;
  const slideHeightPx = SLIDE_HEIGHT * PIXELS_PER_INCH;

  const contentWidth = slideWidthPx - (borderPx * 2);
  const contentHeight = slideHeightPx - (borderPx * 2);
  const gap = 16;

  // Custom layout: 1 wide rectangle on top, 2 squares on bottom
  const topHeight = (contentHeight - gap) * 0.5;
  const bottomHeight = (contentHeight - gap) * 0.5;
  const bottomWidth = (contentWidth - gap) / 2;

  const customLayout = [
    {
      id: 1,
      style: {
        width: `${contentWidth}px`,
        height: `${topHeight}px`,
        marginBottom: `${gap}px`
      }
    },
    {
      id: 2,
      style: {
        width: `${bottomWidth}px`,
        height: `${bottomHeight}px`,
        marginRight: `${gap}px`
      }
    },
    {
      id: 3,
      style: {
        width: `${bottomWidth}px`,
        height: `${bottomHeight}px`,
      }
    }
  ];

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
        background: "url('/Template/Template-10.png') center/100% 100% no-repeat",
        margin: "0 auto",
        border: "none",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        fontFamily: "'Montserrat', sans-serif",
        userSelect: "none",
      }}
      onClick={(e) => {
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {/* Image frames - Custom layout: 1 rectangle top, 2 squares bottom */}
      <div
        style={{
          position: "absolute",
          top: "108px",
          left: "108px",
          width: "1064px",
          height: "504px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FrameLayout
          customLayout={customLayout}
          images={frameImages}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
        />
      </div>
    </div>
  );
});

CrimeRate.displayName = 'CrimeRate';
export default CrimeRate;