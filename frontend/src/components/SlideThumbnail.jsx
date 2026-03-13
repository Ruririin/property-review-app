import React from 'react';

/**
 * Renders a small thumbnail preview that looks like the actual exported slide
 * Mimics the PDF export appearance in miniature - shows ACTUAL slide data
 */
export default function SlideThumbnail({ slideType, slideData, width = 120, height = 80, projectData }) {
  // Cover slide thumbnail - shows actual template background with ACTUAL slide form data
  if (slideType === 'cover') {
    const formData = slideData?.formData || {};

    // Scale factor for positioning (thumbnail is scaled down from 1280x720)
    const scale = width / 1280;

    return (
      <div style={{
        width,
        height,
        overflow: 'hidden',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        background: '#fff',
        position: 'relative',
        backgroundImage: 'url("/Template/Template-01.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        {/* Render actual form fields from the slide data */}

        {/* Insured Name - positioned at top: 180, right: 124 (scaled) */}
        {formData.insuredName && (
          <div style={{
            position: 'absolute',
            top: `${(180 - 20) * scale}px`,
            right: `${124 * scale}px`,
            width: `${960 * scale}px`,
            color: '#fff',
            fontSize: `${Math.max(4, 30 * scale)}px`,
            fontFamily: "'Montserrat', sans-serif",
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            {formData.insuredName}
          </div>
        )}

        {/* Premise Location - positioned at top: 310, right: 124 (scaled) */}
        {formData.premiseLocation && (
          <div style={{
            position: 'absolute',
            top: `${(310 - 20) * scale}px`,
            right: `${124 * scale}px`,
            width: `${960 * scale}px`,
            color: '#fff',
            fontSize: `${Math.max(3, 20 * scale)}px`,
            fontFamily: "'Montserrat', sans-serif",
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            {formData.premiseLocation}
          </div>
        )}

        {/* Description/Type of Operation - positioned at top: 430, right: 124 (scaled) */}
        {formData.description && (
          <div style={{
            position: 'absolute',
            top: `${(430 - 20) * scale}px`,
            right: `${124 * scale}px`,
            width: `${860 * scale}px`,
            color: '#fff',
            fontSize: `${Math.max(3, 18 * scale)}px`,
            fontFamily: "'Montserrat', sans-serif",
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxHeight: `${60 * scale}px`,
            lineHeight: '1.2',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            {formData.description}
          </div>
        )}

        {/* Line of Business - positioned at top: 546, right: varies (scaled) */}
        {formData.lineBusiness && (
          <div style={{
            position: 'absolute',
            top: `${(546 - 20) * scale}px`,
            right: `${440 * scale}px`,
            maxWidth: `${400 * scale}px`,
            color: '#fff',
            fontSize: `${Math.max(3, 16 * scale)}px`,
            fontFamily: "'Montserrat', sans-serif",
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            {formData.lineBusiness}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      width,
      height,
      overflow: 'hidden',
      borderRadius: 4,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      background: '#fff',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title area */}
      <div style={{
        padding: 3,
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        <div style={{ fontSize: 5, fontWeight: 700, color: '#2a7a2a' }}>
          {slideData?.title || 'Slide'}
        </div>
      </div>

      {/* Content area - show placeholder for images/content */}
      <div style={{ flex: 1, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {slideData?.hasImages ? (
          <div style={{ background: '#f7fafc', width: '100%', height: '100%', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-image" style={{ fontSize: 12, color: '#cbd5e0' }}></i>
          </div>
        ) : (
          <div style={{ background: '#f7fafc', width: '100%', height: '80%', borderRadius: 2 }}></div>
        )}
      </div>
    </div>
  );
}