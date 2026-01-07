import React from 'react';
import ImageFrame from './ImageFrame';

const FrameLayout = ({
  layoutType = 1,
  images = {},
  onImageUpload,
  onImageRemove,
  customLayout = null
}) => {
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

  const getLayoutFrames = () => {
    if (customLayout) {
      return customLayout;
    }

    switch (layoutType) {
      case 1:
        // 1 frame uses full content area
        return [
          {
            id: 1,
            style: {}
          }
        ];

      case 2:
        return [
          { id: 1, style: { flex: 1 } },
          { id: 2, style: { flex: 1 } }
        ];

      case 3:
        return [
          { id: 1, style: {} },
          { id: 2, style: {} },
          { id: 3, style: {} }
        ];

      case 4:
        return [
          { id: 1, style: {} },
          { id: 2, style: {} },
          { id: 3, style: {} },
          { id: 4, style: {} }
        ];

      case 6:
        return [
          { id: 1, style: {} },
          { id: 2, style: {} },
          { id: 3, style: {} },
          { id: 4, style: {} },
          { id: 5, style: {} },
          { id: 6, style: {} }
        ];

      default:
        return [];
    }
  };

  const frames = getLayoutFrames();

  const getContainerStyle = () => {
    // Custom layout (e.g., Crime Rate slide)
    if (customLayout) {
      return {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '0'
      };
    }

    if (layoutType === 3) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'auto auto',
        gap: `${gap}px`,
        width: '100%',
        height: '100%',
        padding: '0'
      };
    }

    if (layoutType === 4) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: `${gap}px`,
        width: '100%',
        height: '100%',
        padding: '0'
      };
    }

    if (layoutType === 6) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: `${gap}px`,
        width: '100%',
        height: '100%',
        padding: '0'
      };
    }

    // Default: layout type 1 or 2 (no grid)
    if (layoutType === 1) {
      return {
        width: '100%',
        height: '100%',
        padding: '0',
        position: 'relative'
      };
    }

    return {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '0',
      gap: `${gap}px`
    };
  };

  const getFrameStyle = (frame) => {
    if (layoutType === 3 && frame.id === 3) {
      return {
        ...frame.style,
        gridColumn: '1 / -1'
      };
    }

    return frame.style;
  };

  // Custom rendering for custom layouts (e.g., Crime Rate)
  if (customLayout) {
    return (
      <div style={getContainerStyle()}>
        {/* Top frame */}
        <ImageFrame
          key={frames[0].id}
          id={frames[0].id}
          image={images[frames[0].id]}
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
          style={frames[0].style}
        />
        {/* Bottom row with 2 frames */}
        <div style={{ display: 'flex', gap: `${gap}px` }}>
          {frames.slice(1).map((frame) => (
            <ImageFrame
              key={frame.id}
              id={frame.id}
              image={images[frame.id]}
              onImageUpload={onImageUpload}
              onImageRemove={onImageRemove}
              style={{ ...frame.style, marginRight: 0 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={getContainerStyle()}>
      {frames.map((frame) => (
        <ImageFrame
          key={frame.id}
          id={frame.id}
          image={images[frame.id]}
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
          style={getFrameStyle(frame)}
        />
      ))}
    </div>
  );
};

export default FrameLayout;
