import { useState, useEffect } from 'react';
import exportedItemsService from '../services/exportedItemsService';
import apiService from '../services/apiService';

export default function ExportedItemsPanel({ user }) {
  const [exportedItems, setExportedItems] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user) {
      loadExportedItems();
    }
  }, [user]);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadExportedItems = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load exported items from localStorage
      const items = exportedItemsService.getExportedItems();
      console.log('🔍 Exported items from localStorage:', items.length, items);

      // If no items in localStorage, show the demo/mock items from the public folder
      if (items.length === 0) {
        const mockItems = [
          {
            id: 1,
            filename: 'Property Review.pdf',
            project_name: 'Untitled Project',
            file_size: 1150000, // 1.15MB estimate
            export_date: '2025-09-18T12:00:00Z',
            file_path: 'Property Review.pdf',
            isDemoItem: true // Mark as demo item
          },
          {
            id: 2,
            filename: 'Property Review Christopher Tuppan Revocable Trust UDT 3-6-1998, Chris Tuppan Trustee.pdf',
            project_name: 'Christopher Tuppan Revocable Trust',
            file_size: 1024000, // 1MB estimate
            export_date: '2025-09-10T10:30:00Z',
            file_path: 'Property Review Christopher Tuppan Revocable Trust UDT 3-6-1998, Chris Tuppan Trustee.pdf',
            isDemoItem: true // Mark as demo item
          },
          {
            id: 3,
            filename: 'Property Review Firdosy Family Trust.pdf',
            project_name: 'Firdosy Family Trust',
            file_size: 856000, // 856KB estimate
            export_date: '2025-09-11T14:20:00Z',
            file_path: 'Property Review Firdosy Family Trust.pdf',
            isDemoItem: true
          },
          {
            id: 4,
            filename: 'Property Review NeitClem Wholesale Insurance Brokerage.pdf',
            project_name: 'NeitClem Wholesale Insurance Brokerage',
            file_size: 1200000, // 1.2MB estimate
            export_date: '2025-09-11T16:45:00Z',
            file_path: 'Property Review NeitClem Wholesale Insurance Brokerage.pdf',
            isDemoItem: true
          },
          {
            id: 5,
            filename: 'Web Review YW Builders Inc.pdf',
            project_name: 'YW Builders Inc',
            file_size: 920000, // 920KB estimate
            export_date: '2025-09-12T09:15:00Z',
            file_path: 'Web Review YW Builders Inc.pdf',
            isDemoItem: true
          },
          {
            id: 6,
            filename: 'Property Review ABC Insurance Company.pdf',
            project_name: 'ABC Insurance Company',
            file_size: 1050000, // 1.05MB estimate
            export_date: '2025-09-13T11:30:00Z',
            file_path: 'Property Review ABC Insurance Company.pdf',
            isDemoItem: true
          },
          {
            id: 7,
            filename: 'Property Review Smith Family Trust.pdf',
            project_name: 'Smith Family Trust',
            file_size: 980000, // 980KB estimate
            export_date: '2025-09-14T15:45:00Z',
            file_path: 'Property Review Smith Family Trust.pdf',
            isDemoItem: true
          },
          {
            id: 8,
            filename: 'Property Review Johnson Real Estate LLC.pdf',
            project_name: 'Johnson Real Estate LLC',
            file_size: 1300000, // 1.3MB estimate
            export_date: '2025-09-15T09:20:00Z',
            file_path: 'Property Review Johnson Real Estate LLC.pdf',
            isDemoItem: true
          },
          {
            id: 9,
            filename: 'Property Review Pacific Coast Properties.pdf',
            project_name: 'Pacific Coast Properties',
            file_size: 1180000, // 1.18MB estimate
            export_date: '2025-09-16T13:15:00Z',
            file_path: 'Property Review Pacific Coast Properties.pdf',
            isDemoItem: true
          },
          {
            id: 10,
            filename: 'Property Review Mountain View Holdings.pdf',
            project_name: 'Mountain View Holdings',
            file_size: 1420000, // 1.42MB estimate
            export_date: '2025-09-17T10:00:00Z',
            file_path: 'Property Review Mountain View Holdings.pdf',
            isDemoItem: true
          },
          {
            id: 11,
            filename: 'Property Review Downtown Commercial Group.pdf',
            project_name: 'Downtown Commercial Group',
            file_size: 1250000, // 1.25MB estimate
            export_date: '2025-09-19T14:30:00Z',
            file_path: 'Property Review Downtown Commercial Group.pdf',
            isDemoItem: true
          },
          {
            id: 12,
            filename: 'Property Review Riverside Development Corp.pdf',
            project_name: 'Riverside Development Corp',
            file_size: 1080000, // 1.08MB estimate
            export_date: '2025-09-20T16:45:00Z',
            file_path: 'Property Review Riverside Development Corp.pdf',
            isDemoItem: true
          }
        ];
        setExportedItems(mockItems);
      } else {
        setExportedItems(items);
      }
    } catch (error) {
      console.error('Error loading exported items:', error);
      setExportedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPDF = async (item) => {
    try {
      if (item.isDemoItem) {
        // Demo items - get the PDF file URL from the public/Completed PRs folder
        const fileUrl = `/Completed PRs/${item.file_path}`;

        if (isMobile) {
          // On mobile, open PDF in new tab instead of iframe preview
          window.open(fileUrl, '_blank');
        } else {
          // On desktop, use modal preview
          setSelectedPDF({
            ...item,
            dataUrl: fileUrl
          });
          setShowPreview(true);
        }
      } else {
        // Real exported items - show info that PDF was downloaded to user's device
        alert(`This PDF was exported to your Downloads folder as: ${item.filename}\n\nNote: Exported PDFs are saved to your device and cannot be previewed from this panel.`);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF preview.');
    }
  };

  const handleClosePDF = () => {
    setShowPreview(false);
    setSelectedPDF(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    if (filename.toLowerCase().endsWith('.pdf')) {
      return 'bi-file-earmark-pdf';
    }
    return 'bi-file-earmark';
  };

  // Pagination logic
  const totalPages = Math.ceil(exportedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = exportedItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h6 className="mb-0 d-flex align-items-center">
            <span className="badge bg-secondary rounded-pill me-2">...</span>
            Exported Items
          </h6>
        </div>
        <div className="card-body text-center text-muted py-4">
          <div className="spinner-border text-success mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mb-0">Loading exported items...</p>
        </div>
      </div>
    );
  }

  if (exportedItems.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h6 className="mb-0 d-flex align-items-center">
            <span className="badge bg-secondary rounded-pill me-2">0</span>
            Exported Items
          </h6>
        </div>
        <div className="card-body text-center text-muted py-4">
          <i className="bi bi-file-earmark-pdf fs-1 mb-2" style={{ color: "#198754" }}></i>
          <p className="mb-0">No exported PDFs yet</p>
          <small className="text-muted">Export a project to see it here</small>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h6 className="mb-0 d-flex align-items-center">
            <span className="badge bg-success rounded-pill me-2">{exportedItems.length}</span>
            Exported Items
            {totalPages > 1 && (
              <small className="text-muted ms-auto">
                Page {currentPage} of {totalPages}
              </small>
            )}
          </h6>
        </div>
        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            {currentItems.map((item) => (
              <div key={`${item.id}-${item.export_date}`} className="list-group-item">
                <div className="d-flex align-items-start flex-column flex-sm-row">
                  <div className="flex-grow-1 w-100 w-sm-auto">
                    <div className="d-flex justify-content-between align-items-start flex-column flex-sm-row">
                      <div className="flex-grow-1 mb-2 mb-sm-0">
                        <h6 className="mb-1 fw-semibold text-primary d-flex align-items-start"
                            style={{ cursor: 'pointer', fontSize: window.innerWidth < 768 ? '0.95rem' : '1rem' }}
                            onClick={() => handleViewPDF(item)}>
                          {item.filename}
                          {!item.isDemoItem && (
                            <span className="badge bg-success ms-2 small" style={{ fontSize: '0.65rem' }}>
                              NEW
                            </span>
                          )}
                        </h6>
                        <p className="mb-1 text-muted small">
                          Project: <strong>{item.project_name || 'Untitled Project'}</strong>
                        </p>
                        <div className="text-muted small">
                          {formatFileSize(item.file_size || 0)} • {new Date(item.export_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="align-self-end align-self-sm-start mt-2 mt-sm-0">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewPDF(item)}
                          title={item.isDemoItem ? (window.innerWidth < 768 ? "Open PDF" : "Preview PDF") : "View Details"}
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          {item.isDemoItem ? (
                            <>
                              <i className="bi bi-eye d-md-none"></i>
                              <i className="bi bi-box-arrow-up-right d-none d-md-inline"></i>
                              <span className="d-none d-sm-inline ms-1">
                                {window.innerWidth < 768 ? "Open" : "Preview"}
                              </span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-info-circle"></i>
                              <span className="d-none d-sm-inline ms-1">Info</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer bg-light">
              <nav aria-label="Exported items pagination">
                <ul className="pagination pagination-sm justify-content-center mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link px-2 py-1" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <span className="d-none d-sm-inline">Previous</span>
                      <span className="d-sm-none">‹</span>
                    </button>
                  </li>
                  
                  {/* Mobile-friendly pagination numbers */}
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = window.innerWidth < 768 ? 3 : 5; // Show fewer pages on mobile
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    // Show first page if not in range
                    if (startPage > 1) {
                      pages.push(
                        <li key={1} className="page-item">
                          <button className="page-link px-2 py-1" onClick={() => handlePageChange(1)}
                                  style={{ minWidth: '44px', minHeight: '44px' }}>
                            1
                          </button>
                        </li>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <li key="start-ellipsis" className="page-item disabled d-none d-sm-block">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }
                    }
                    
                    // Show page numbers in range
                    for (let page = startPage; page <= endPage; page++) {
                      pages.push(
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button 
                            className="page-link px-2 py-1"
                            onClick={() => handlePageChange(page)}
                            style={{ minWidth: '44px', minHeight: '44px' }}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    }
                    
                    // Show last page if not in range
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <li key="end-ellipsis" className="page-item disabled d-none d-sm-block">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }
                      pages.push(
                        <li key={totalPages} className="page-item">
                          <button className="page-link px-2 py-1" onClick={() => handlePageChange(totalPages)}
                                  style={{ minWidth: '44px', minHeight: '44px' }}>
                            {totalPages}
                          </button>
                        </li>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link px-2 py-1" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <span className="d-none d-sm-inline">Next</span>
                      <span className="d-sm-none">›</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && selectedPDF && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-pdf me-2" style={{ color: "#dc3545" }}></i>
                  {selectedPDF.filename}
                </h5>
                <button type="button" className="btn-close" onClick={handleClosePDF}></button>
              </div>
              <div className="modal-body p-0">
                <div style={{ height: '70vh', overflow: 'auto' }}>
                  {selectedPDF.dataUrl ? (
                    <>
                      {/* Desktop PDF Viewer */}
                      <div className="d-none d-md-block">
                        <iframe
                          src={selectedPDF.dataUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 'none', minHeight: '70vh' }}
                          title={selectedPDF.filename}
                        />
                      </div>
                      
                      {/* Mobile PDF Fallback */}
                      <div className="d-block d-md-none text-center p-4">
                        <i className="bi bi-file-earmark-pdf display-1 text-danger mb-3"></i>
                        <h5 className="mb-3">{selectedPDF.filename}</h5>
                        <p className="text-muted mb-4">
                          PDF preview is not available on mobile devices. 
                          <br />Please download or open in a new tab to view.
                        </p>
                        <div className="d-grid gap-2">
                          <a 
                            href={selectedPDF.dataUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            <i className="bi bi-box-arrow-up-right me-2"></i>
                            Open in New Tab
                          </a>
                          <a 
                            href={selectedPDF.dataUrl} 
                            download={selectedPDF.filename}
                            className="btn btn-outline-success"
                          >
                            <i className="bi bi-download me-2"></i>
                            Download PDF
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-5">
                      <i className="bi bi-exclamation-triangle fs-1 text-warning mb-3"></i>
                      <p>PDF preview not available</p>
                      <small className="text-muted">The PDF file may have been moved or deleted.</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <small className="text-muted me-auto">
                  Exported: {new Date(selectedPDF.export_date).toLocaleString()}
                </small>
                <button type="button" className="btn btn-secondary" onClick={handleClosePDF}>
                  Close
                </button>
                {selectedPDF.dataUrl && (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedPDF.dataUrl;
                      link.download = selectedPDF.filename;
                      link.click();
                    }}
                  >
                    <i className="bi bi-download me-1"></i>
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
