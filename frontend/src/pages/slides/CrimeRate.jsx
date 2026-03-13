import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import FrameLayout from "../../components/FrameLayout";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";
import slideApiService from "../../services/slideApiService";

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
  const slideDataRef = useRef(slideData);

  const activeProjectId = projectId || currentProjectId;
  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(activeProjectId, slideId);

  const frameImages = slideData?.frameImages || {};
  const frameMeta = slideData?.frameMeta || {};
  const imageTransforms = slideData?.imageTransforms || {};

  useEffect(() => {
    slideDataRef.current = slideData;
  }, [slideData]);

  const handleImageUpload = async (frameId, imageData, file) => {
    // IMPORTANT: Use ref to get the LATEST slideData (not stale closure)
    const currentFrameImages = slideDataRef.current?.frameImages || {};
    const currentFrameMeta = slideDataRef.current?.frameMeta || {};

    const updatedFrameImages = { ...currentFrameImages, [frameId]: imageData };

    updateSlideData({ frameImages: updatedFrameImages });

    const hasDatabaseId = slideData?._appState?.databaseId || false;

    if (activeProjectId && hasDatabaseId) {
      const result = await uploadFrameImage(frameId, imageData);
      if (result?.success) {
        updateSlideData({
          frameImages: updatedFrameImages,
          frameMeta: { ...currentFrameMeta, [frameId]: { filePath: result.filePath, url: result.url, width: result.width, height: result.height, aspectRatio: result.aspectRatio } }
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

  const handleImageTransform = (frameId, transform) => {
    const currentTransforms = slideDataRef.current?.imageTransforms || {};
    updateSlideData({
      imageTransforms: {
        ...currentTransforms,
        [frameId]: transform
      }
    });
  };

  // Container dimensions: 1064 x 504 (total height available)
  const containerWidth = 1064;
  const gap = 16;

  const topHeight = 164; // Reduced for more space below
  const bottomHeight = 324; // Increased to use the space from top frame
  const bottomWidth = (containerWidth - gap) / 2;

  const customLayout = [
    {
      id: 1,
      style: {
        width: `${containerWidth}px`,
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

  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));

  useEffect(() => {
    const loadSlideData = async () => {
      if (!currentProjectId || !slideId) {
        return;
      }

      try {
        const result = await slideApiService.getSlideContent(currentProjectId, slideId);

        if (result.content && result.content.crimeRateData && setFormData) {
          const crimeRateData = result.content.crimeRateData;

          const hasFormData = Object.keys(crimeRateData).some(key =>
            crimeRateData[key] && crimeRateData[key].toString().trim() !== ''
          );

          if (hasFormData) {
            setFormData(prev => ({
              ...prev,
              ...crimeRateData
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

  const renderSimpleField = (field, placeholder) => {
    const isActive = selectedField === field;
    const defaultPosition = { top: 670, right: 1.2 };
    const position = (fieldPositions && fieldPositions[field]) || defaultPosition;

    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120));

    return (
      <textarea
        key={field}
        value={formData[field] || ""}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        onFocus={() => onSelect(field)}
        placeholder={placeholder}
        style={{
          position: "absolute",
          width: `${estimatedWidth}px`,
          background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
          border: isActive ? "2px solid rgba(0,0,0,0.3)" : "2px solid transparent",
          borderRadius: "4px",
          fontSize: "28px",
          fontFamily: "'Montserrat', sans-serif",
          textAlign: "right",
          resize: "none",
          color: "#8B9A5B",
          padding: "4px 0px 4px 8px",
          outline: "none",
          whiteSpace: "nowrap",
          top: `${position.top}px`,
          right: `${position.right}%`,
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
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {/* Premise Location - bottom right */}
      {renderSimpleField("premiseLocation", "www.(source).com/maps(mm/yyyy)")}

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
          imageTransforms={imageTransforms}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          onImageTransform={handleImageTransform}
        />
      </div>
    </div>
  );
});

CrimeRate.displayName = 'CrimeRate';
export default CrimeRate;