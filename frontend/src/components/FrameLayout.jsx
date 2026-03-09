import React from 'react';
import ImageFrame from './ImageFrame';

const FrameLayout = ({
  layoutType = 1,
  images = {},
  onImageUpload,
  onImageRemove,
  customLayout = null
}) => {
  // Container dimensions match the parent (1064 x 504) set by each slide component
  const containerWidth = 1064;
  const containerHeight = 504;
  const gap = 16;

  // Build explicit pixel-based layouts for reliable html2canvas PDF export
  const getLayoutFrames = () => {
    if (customLayout) {
      return { type: 'custom', frames: customLayout };
    }

    const halfW = (containerWidth - gap) / 2;
    const halfH = (containerHeight - gap) / 2;
    const thirdW = (containerWidth - gap * 2) / 3;

    switch (layoutType) {
      case 1:
        return {
          type: 'single',
          frames: [
            { id: 1, style: { width: `${containerWidth}px`, height: `${containerHeight}px` } }
          ]
        };

      case 2:
        return {
          type: 'row',
          frames: [
            { id: 1, style: { width: `${halfW}px`, height: `${containerHeight}px` } },
            { id: 2, style: { width: `${halfW}px`, height: `${containerHeight}px` } }
          ]
        };

      case 3:
        return {
          type: 'top2-bottom1',
          topFrames: [
            { id: 1, style: { width: `${halfW}px`, height: `${halfH}px` } },
            { id: 2, style: { width: `${halfW}px`, height: `${halfH}px` } }
          ],
          bottomFrames: [
            { id: 3, style: { width: `${containerWidth}px`, height: `${halfH}px` } }
          ]
        };

      case 4:
        return {
          type: 'grid2x2',
          topFrames: [
            { id: 1, style: { width: `${halfW}px`, height: `${halfH}px` } },
            { id: 2, style: { width: `${halfW}px`, height: `${halfH}px` } }
          ],
          bottomFrames: [
            { id: 3, style: { width: `${halfW}px`, height: `${halfH}px` } },
            { id: 4, style: { width: `${halfW}px`, height: `${halfH}px` } }
          ]
        };

      case 6:
        return {
          type: 'grid3x2',
          topFrames: [
            { id: 1, style: { width: `${thirdW}px`, height: `${halfH}px` } },
            { id: 2, style: { width: `${thirdW}px`, height: `${halfH}px` } },
            { id: 3, style: { width: `${thirdW}px`, height: `${halfH}px` } }
          ],
          bottomFrames: [
            { id: 4, style: { width: `${thirdW}px`, height: `${halfH}px` } },
            { id: 5, style: { width: `${thirdW}px`, height: `${halfH}px` } },
            { id: 6, style: { width: `${thirdW}px`, height: `${halfH}px` } }
          ]
        };

      default:
        return { type: 'single', frames: [] };
    }
  };

  const layout = getLayoutFrames();

  const renderFrame = (frame) => (
    <ImageFrame
      key={frame.id}
      id={frame.id}
      image={images[frame.id]}
      onImageUpload={onImageUpload}
      onImageRemove={onImageRemove}
      style={frame.style}
    />
  );

  const rowStyle = { display: 'flex', gap: `${gap}px` };

  // Custom layout (e.g., Crime Rate: 1 top rectangle, 2 bottom squares)
  if (layout.type === 'custom') {
    const frames = layout.frames;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: `${containerWidth}px`, height: `${containerHeight}px` }}>
        {renderFrame(frames[0])}
        <div style={rowStyle}>
          {frames.slice(1).map((frame) => renderFrame(frame))}
        </div>
      </div>
    );
  }

  // Single frame
  if (layout.type === 'single') {
    return (
      <div style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}>
        {layout.frames.map(renderFrame)}
      </div>
    );
  }

  // Two frames side by side
  if (layout.type === 'row') {
    return (
      <div style={{ ...rowStyle, width: `${containerWidth}px`, height: `${containerHeight}px` }}>
        {layout.frames.map(renderFrame)}
      </div>
    );
  }

  // Layouts with top row + bottom row
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, width: `${containerWidth}px`, height: `${containerHeight}px` }}>
      <div style={rowStyle}>
        {layout.topFrames.map(renderFrame)}
      </div>
      <div style={rowStyle}>
        {layout.bottomFrames.map(renderFrame)}
      </div>
    </div>
  );
};

export default FrameLayout;