import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import FrameLayout from "../../components/FrameLayout";
import FrameSelector from "../../components/FrameSelector";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";
import slideApiService from "../../services/slideApiService";

const Interior = forwardRef(({
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
  const slideDataRef = useRef(slideData);

  const activeProjectId = projectId || currentProjectId;

  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(
    activeProjectId,
    slideId
  );

  const [frameLayout, setFrameLayout] = useState(slideData?.frameLayout || 1);
  const frameImages = slideData?.frameImages || {};
  const imageTransforms = slideData?.imageTransforms || {};
  const frameMeta = slideData?.frameMeta || {};

  useEffect(() => {
    slideDataRef.current = slideData;
  }, [slideData]);

  useEffect(() => {
    if (slideData?.frameLayout !== undefined && slideData.frameLayout !== frameLayout) {
      setFrameLayout(slideData.frameLayout);
    }
  }, [slideData?.frameLayout]);

  const handleImageUpload = async (frameId, imageData, file) => {
    console.log('🔵 [Interior] handleImageUpload called for frameId:', frameId);
    console.log('🔵 [Interior] Current slideData.frameImages:', slideData?.frameImages);
    console.log('🔵 [Interior] Ref slideData.frameImages:', slideDataRef.current?.frameImages);

    // IMPORTANT: Use ref to get the LATEST slideData (not stale closure)
    const currentFrameImages = slideDataRef.current?.frameImages || {};
    const currentFrameMeta = slideDataRef.current?.frameMeta || {};

    console.log('🔵 [Interior] currentFrameImages:', currentFrameImages);
    console.log('🔵 [Interior] Keys in currentFrameImages:', Object.keys(currentFrameImages));

    const updatedFrameImages = { ...currentFrameImages, [frameId]: imageData };

    console.log('🔵 [Interior] updatedFrameImages:', Object.keys(updatedFrameImages));

    updateSlideData({
      frameImages: updatedFrameImages
    });

    console.log('🔵 [Interior] Called updateSlideData with updatedFrameImages');

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
              aspectRatio: result.aspectRatio
            }
          }
        });
      } else if (result && !result.success) {
        console.error('Failed to upload frame', frameId, 'to backend:', result.error);
      }
    } else {
      console.warn('No database ID yet - image saved locally only');
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

    updateSlideData({
      frameImages: newFrameImages,
      frameMeta: newFrameMeta
    });
  };

  const handleFrameLayoutChange = (layout) => {
    setFrameLayout(layout);
    updateSlideData({ frameLayout: layout });
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

        if (result.content && result.content.interiorData && setFormData) {
          const interiorData = result.content.interiorData;

          const hasFormData = Object.keys(interiorData).some(key =>
            interiorData[key] && interiorData[key].toString().trim() !== ''
          );

          if (hasFormData) {
            setFormData(prev => ({
              ...prev,
              ...interiorData
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

  const renderField = (field, placeholder) => {
    const isActive = selectedField === field;
    const defaultPosition = {
      websiteInfo: { bottom: 31.8, right: 0.5 }, // Moved up by 6% for PDF compatibility
      premiseLocation: { top: 670, right: 1.2 }, // Same positioning as Aerial view
    };

    const position = (fieldPositions && fieldPositions[field]) || defaultPosition[field];

    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120));

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
        background: "url('/Template/interior.png') center/100% 100% no-repeat",
        margin: "0 auto",
        overflow: "hidden",
        userSelect: "none",
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
          display: "flex",
          justifyContent: "center",
        }}
      >
        <FrameLayout
          layoutType={frameLayout}
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

Interior.displayName = 'Interior';
export default Interior;