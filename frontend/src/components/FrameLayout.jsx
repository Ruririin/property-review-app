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
        // 1 frame uses full content area (1064x504) without additional border
        return [
          {
            id: 1,
            style: {
              width: '1064px',
              height: '504px',
            }
          }
        ];

      case 2:
        const height2 = (contentHeight - gap) / 2;
        return [
          {
            id: 1,
            style: {
              width: `${contentWidth}px`,
              height: `${height2}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 2,
            style: {
              width: `${contentWidth}px`,
              height: `${height2}px`,
            }
          }
        ];

      case 3:
        const topHeight3 = (contentHeight - gap) * 0.5;
        const bottomHeight3 = (contentHeight - gap) * 0.5;
        const topWidth3 = (contentWidth - gap) / 2;
        return [
          {
            id: 1,
            style: {
              width: `${topWidth3}px`,
              height: `${topHeight3}px`,
              marginRight: `${gap}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 2,
            style: {
              width: `${topWidth3}px`,
              height: `${topHeight3}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 3,
            style: {
              width: `${contentWidth}px`,
              height: `${bottomHeight3}px`,
            }
          }
        ];

      case 4:
        const width4 = (contentWidth - gap) / 2;
        const height4 = (contentHeight - gap) / 2;
        return [
          {
            id: 1,
            style: {
              width: `${width4}px`,
              height: `${height4}px`,
              marginRight: `${gap}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 2,
            style: {
              width: `${width4}px`,
              height: `${height4}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 3,
            style: {
              width: `${width4}px`,
              height: `${height4}px`,
              marginRight: `${gap}px`
            }
          },
          {
            id: 4,
            style: {
              width: `${width4}px`,
              height: `${height4}px`,
            }
          }
        ];

      case 6:
        const width6 = (contentWidth - gap * 2) / 3;
        const height6 = (contentHeight - gap) / 2;
        return [
          {
            id: 1,
            style: {
              width: `${width6}px`,
              height: `${height6}px`,
              marginRight: `${gap}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 2,
            style: {
              width: `${width6}px`,
              height: `${height6}px`,
              marginRight: `${gap}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 3,
            style: {
              width: `${width6}px`,
              height: `${height6}px`,
              marginBottom: `${gap}px`
            }
          },
          {
            id: 4,
            style: {
              width: `${width6}px`,
              height: `${height6}px`,
              marginRight: `${gap}px`
            }
          },
          {
            id: 5,
            style: {
              width: `${width6}px`,
              height: `${height6}px`,
              marginRight: `${gap}px`
            }
          },
          {
            id: 6,
            style: {
              width: `${width6}px`,
              height: `${height6}px`,
            }
          }
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
        width: `${contentWidth}px`,
        height: `${contentHeight}px`,
        padding: `${borderPx}px`
      };
    }

    if (layoutType === 3) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'auto auto',
        gap: `${gap}px`,
        width: `${contentWidth}px`,
        height: `${contentHeight}px`,
        padding: `${borderPx}px`
      };
    }

    if (layoutType === 4) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: `${gap}px`,
        width: `${contentWidth}px`,
        height: `${contentHeight}px`,
        padding: `${borderPx}px`
      };
    }

    if (layoutType === 6) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: `${gap}px`,
        width: `${contentWidth}px`,
        height: `${contentHeight}px`,
        padding: `${borderPx}px`
      };
    }

    // Default: layout type 1 or 2 (no grid)
    if (layoutType === 1) {
      return {
        width: '1064px',
        height: '504px',
        padding: '0',
        position: 'relative'
      };
    }

    return {
      display: 'flex',
      flexDirection: 'column',
      width: `${contentWidth}px`,
      height: `${contentHeight}px`,
      padding: `${borderPx}px`
    };
  };

  const getFrameStyle = (frame) => {
    if (layoutType === 3 && frame.id === 3) {
      return {
        ...frame.style,
        gridColumn: '1 / -1',
        margin: 0
      };
    }

    if ([3, 4, 6].includes(layoutType)) {
      return {
        ...frame.style,
        margin: 0
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
