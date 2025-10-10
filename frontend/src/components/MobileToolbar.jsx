import React, { useState } from 'react';

const MobileToolbar = ({ 
  currentSlide, 
  totalSlides, 
  onSlideChange, 
  onSave, 
  onExport, 
  onBack,
  onUpdateProjectStatus,
  currentProjectStatus = 'draft',
  getStatusDisplay,
  onToggleSidebar,
  isSaving = false,
  hasUnsavedChanges = false 
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleStatusSelect = (status) => {
    if (onUpdateProjectStatus) {
      onUpdateProjectStatus(status);
    }
    setShowStatusModal(false);
  };

  return (
    <>
      {/* Canvas-style Top Mobile Header */}
      <div className="mobile-header d-block d-xl-none" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 20px',
        zIndex: 1050,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Left - Back button */}
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            color: '#374151',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={onBack}
          onMouseDown={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          onMouseUp={(e) => e.target.style.backgroundColor = 'transparent'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        
        {/* Center - Slide counter */}
        <div style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#111827',
          background: '#f9fafb',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb'
        }}>
          {currentSlide} / {totalSlides}
        </div>
        
        {/* Right - Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          alignItems: 'center',
          flexWrap: 'nowrap',
          overflow: 'hidden'
        }}>
          <button 
            style={{
              background: hasUnsavedChanges ? '#3b82f6' : '#f3f4f6',
              color: hasUnsavedChanges ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid currentColor',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
            )}
            Save
          </button>
          
          <button 
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={onExport}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            PDF
          </button>
          
          {onUpdateProjectStatus && (
            <button 
              style={{
                background: getStatusDisplay ? getStatusDisplay(currentProjectStatus).color : '#198754',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => setShowStatusModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              {getStatusDisplay ? getStatusDisplay(currentProjectStatus).text : 'Status'}
            </button>
          )}
          
          {onToggleSidebar && (
            <button 
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={onToggleSidebar}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18"/>
              </svg>
              Tools
            </button>
          )}
        </div>
      </div>

      {/* Canvas-style Bottom Mobile Navigation */}
      <div className="mobile-navigation d-block d-xl-none" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 20px 20px 20px', // Extra bottom padding for safe area
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '80px',
        boxShadow: '0 -1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Left - Previous button */}
        <button 
          style={{
            background: currentSlide <= 1 ? '#f3f4f6' : '#ffffff',
            color: currentSlide <= 1 ? '#9ca3af' : '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentSlide <= 1 ? 'default' : 'pointer',
            boxShadow: currentSlide <= 1 ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'
          }}
          onClick={() => onSlideChange(Math.max(1, currentSlide - 1))}
          disabled={currentSlide <= 1}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        
        {/* Center - Canvas-style slide dots */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          alignItems: 'center',
          background: '#f9fafb',
          padding: '8px 16px',
          borderRadius: '24px',
          border: '1px solid #e5e7eb'
        }}>
          {Array.from({ length: Math.min(totalSlides, 7) }, (_, i) => {
            let slideIndex;
            if (totalSlides <= 7) {
              slideIndex = i + 1;
            } else {
              // Smart pagination - show current slide in center when possible
              const start = Math.max(1, Math.min(currentSlide - 3, totalSlides - 6));
              slideIndex = start + i;
            }
            
            const isActive = slideIndex === currentSlide;
            return (
              <button
                key={slideIndex}
                onClick={() => onSlideChange(slideIndex)}
                style={{
                  width: isActive ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: isActive ? '#3b82f6' : '#d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  outline: 'none'
                }}
              />
            );
          })}
          {totalSlides > 7 && (
            <span style={{ 
              color: '#6b7280', 
              fontSize: '12px', 
              fontWeight: '500',
              marginLeft: '4px'
            }}>
              +{totalSlides - 7}
            </span>
          )}
        </div>
        
        {/* Right - Next button */}
        <button 
          style={{
            background: currentSlide >= totalSlides ? '#f3f4f6' : '#ffffff',
            color: currentSlide >= totalSlides ? '#9ca3af' : '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentSlide >= totalSlides ? 'default' : 'pointer',
            boxShadow: currentSlide >= totalSlides ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'
          }}
          onClick={() => onSlideChange(Math.min(totalSlides, currentSlide + 1))}
          disabled={currentSlide >= totalSlides}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>

      {/* Canvas-style animations and mobile spacing */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 1199px) {
          .editor-content {
            margin-top: 70px !important;
            margin-bottom: 80px !important;
            padding: 0 10px;
          }
        }
        
        /* Canvas-style button hover effects */
        .mobile-header button:hover:not(:disabled) {
          background-color: #f3f4f6 !important;
          transform: translateY(-1px);
        }
        
        .mobile-navigation button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        /* Responsive button sizing for small screens */
        @media (max-width: 375px) {
          .mobile-header button {
            padding: 4px 6px !important;
            font-size: 11px !important;
          }
          
          .mobile-header button svg {
            width: 12px !important;
            height: 12px !important;
          }
        }
      `}</style>

      {/* Mobile Status Selection Modal */}
      {showStatusModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              textAlign: 'center',
              color: '#111827'
            }}>
              Mark Project Status
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleStatusSelect('approved')}
                style={{
                  padding: '16px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'flex-start'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
                Mark Approved
              </button>
              
              <button
                onClick={() => handleStatusSelect('denied')}
                style={{
                  padding: '16px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'flex-start'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
                Mark Denied
              </button>
              
              <button
                onClick={() => handleStatusSelect('conditional')}
                style={{
                  padding: '16px 20px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'flex-start'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4"/>
                  <path d="M12 16h.01"/>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
                Mark Conditional
              </button>
            </div>
            
            <button
              onClick={() => setShowStatusModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileToolbar;