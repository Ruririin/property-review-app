/**
 * PDF Preview Modal Component
 * Similar to ExportedItemsPanel but for previewing PDFs before export
 */

import { useState, useEffect } from 'react';

const PDFPreviewModal = ({
  isOpen,
  onClose,
  pdfUrl,
  filename = 'Property Review Preview.pdf',
  onExport = null,
  isGenerating = false
}) => {
  const [modalHeight, setModalHeight] = useState('70vh');

  useEffect(() => {
    const updateModalHeight = () => {
      const isMobile = window.innerWidth <= 768;
      setModalHeight(isMobile ? '60vh' : '70vh');
    };

    updateModalHeight();
    window.addEventListener('resize', updateModalHeight);
    return () => window.removeEventListener('resize', updateModalHeight);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal fade show"
        style={{
          display: 'block',
          zIndex: 1050,
          paddingRight: '17px'
        }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-fullscreen-md-down modal-xl">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header border-bottom">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark-pdf text-danger me-2" style={{ fontSize: '1.2rem' }}></i>
                <h5 className="modal-title mb-0">PDF Preview</h5>
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Export Button */}
                {onExport && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={onExport}
                    disabled={isGenerating || !pdfUrl}
                  >
                    <i className="bi bi-download me-1"></i>
                    Export PDF
                  </button>
                )}
                {/* Close Button */}
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body p-0" style={{ height: modalHeight }}>
              {isGenerating ? (
                // Loading state
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h6 className="text-muted">Generating PDF Preview...</h6>
                  <p className="text-muted small">This may take a few moments</p>
                </div>
              ) : pdfUrl ? (
                // PDF iframe
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', minHeight: modalHeight }}
                  title={filename}
                  onError={() => {
                    console.error('Failed to load PDF preview');
                  }}
                />
              ) : (
                // Error state
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <i className="bi bi-exclamation-triangle text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                  <h6 className="text-muted">Failed to generate PDF preview</h6>
                  <p className="text-muted small">Please try again or contact support</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-top">
              <div className="d-flex justify-content-between align-items-center w-100">
                <div className="text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  Preview: {filename}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PDFPreviewModal;