import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '../../contexts/EditorContext';
import { NAVBAR_HEIGHT } from '../../utils/editorUtils';

const EditorNavbar = () => {
  const navigate = useNavigate();
  const statusDropdownRef = useRef(null);
  
  const {
    isLroDropdownOpen,
    setIsLroDropdownOpen,
    isLoadingLroForms,
    lroSearchTerm,
    setLroSearchTerm,
    lroForms,
    handleLroFormSelect,
    currentProjectStatus,
    showStatusDropdown,
    setShowStatusDropdown,
    getStatusDisplay,
    updateProjectStatus,
    handleExportToPDF,
    saveProject
  } = useEditor();

  // Handle click outside for status dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close status dropdown if clicking outside
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusDropdown, setShowStatusDropdown]);

  return (
    <nav
      className="navbar navbar-light bg-white shadow-sm px-3 py-0 d-flex justify-content-between align-items-center position-fixed w-100"
      style={{ top: 0, zIndex: 1003, height: NAVBAR_HEIGHT }}
    >
      {/* Left - Logo & Brand */}
      <div
        className="d-flex align-items-center py-2"
        style={{
          cursor: "pointer",
          transition: "opacity 0.2s ease",
          borderRadius: "6px",
          padding: "8px 12px",
          margin: "-8px -12px"
        }}
        onClick={() => navigate("/")}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <img
          src="/NeitClemLogo.png"
          alt="Logo"
          style={{ width: "32px", height: "32px", marginRight: "8px" }}
        />
        <span className="fw-semibold text-dark" style={{ fontSize: "16px" }}>
          Property Review Maker
        </span>
      </div>

      {/* Right - Actions Toolbar */}
      <div className="d-flex align-items-center" style={{ gap: "4px" }}>

        {/* LRO Database Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            onClick={() => setIsLroDropdownOpen(!isLroDropdownOpen)}
            disabled={isLoadingLroForms}
            style={{
              height: "36px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              padding: "0 12px"
            }}
          >
            <i className="bi bi-database me-1" style={{ fontSize: "12px", color: "#198754" }}></i>
            <span className="d-none d-md-inline">{isLoadingLroForms ? 'Loading...' : 'Load from Database'}</span>
            <span className="d-md-none">DB</span>
          </button>

          {isLroDropdownOpen && (
            <div
              className="position-absolute bg-white border rounded shadow-lg"
              style={{
                top: '100%',
                right: '0',
                width: '380px',
                maxHeight: '420px',
                overflowY: 'auto',
                zIndex: 5000,
                marginTop: '8px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}
            >
              <div className="p-3">
                <input
                  type="text"
                  className="form-control form-control-sm mb-3"
                  placeholder="Search forms by applicant name..."
                  style={{
                    fontSize: "13px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da"
                  }}
                  value={lroSearchTerm}
                  onChange={(e) => setLroSearchTerm(e.target.value)}
                />
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {lroForms
                    .filter(form => form.appName?.toLowerCase().includes(lroSearchTerm.toLowerCase()))
                    .map((form) => (
                      <div
                        key={form.id}
                        className="p-2 cursor-pointer rounded mb-1"
                        style={{
                          fontSize: "13px",
                          border: "1px solid #e9ecef",
                          backgroundColor: "#f8f9fa",
                          cursor: "pointer"
                        }}
                        onClick={() => handleLroFormSelect(form.id)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      >
                        <div className="fw-bold">{form.appName}</div>
                        <div className="text-muted small">
                          {form.locationA} {form.locationB} {form.locationC}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Status Dropdown */}
        <div className="position-relative" ref={statusDropdownRef}>
          <button
            className={`btn btn-sm d-flex align-items-center ${
              currentProjectStatus === 'approved' ? 'btn-success' :
              currentProjectStatus === 'denied' ? 'btn-danger' :
              currentProjectStatus === 'conditional' ? 'btn-warning' :
              'btn-outline-secondary'
            }`}
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            style={{
              height: "36px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              padding: "0 12px"
            }}
          >
            <i className="bi bi-circle-fill me-1" style={{ fontSize: "8px" }}></i>
            <span className="d-none d-md-inline">{getStatusDisplay(currentProjectStatus)}</span>
            <span className="d-md-none">Status</span>
            <i className="bi bi-chevron-down ms-1" style={{ fontSize: "10px" }}></i>
          </button>

          {showStatusDropdown && (
            <div
              className="position-absolute bg-white border rounded shadow-lg"
              style={{
                top: '100%',
                right: '0',
                width: '180px',
                zIndex: 5000,
                marginTop: '8px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}
            >
              {['draft', 'approved', 'denied', 'conditional'].map((status) => (
                <button
                  key={status}
                  className={`w-100 text-start btn btn-link p-2 ${currentProjectStatus === status ? 'bg-light' : ''}`}
                  style={{
                    fontSize: "13px",
                    borderRadius: "0",
                    border: "none",
                    textDecoration: "none",
                    color: status === 'approved' ? '#198754' :
                           status === 'denied' ? '#dc3545' :
                           status === 'conditional' ? '#fd7e14' : '#6c757d'
                  }}
                  onClick={() => updateProjectStatus(status)}
                >
                  <i className="bi bi-circle-fill me-2" style={{ fontSize: "8px" }}></i>
                  {getStatusDisplay(status)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export PDF Button */}
        <button
          className="btn btn-primary btn-sm d-flex align-items-center"
          onClick={handleExportToPDF}
          style={{
            height: "36px",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "6px",
            padding: "0 12px"
          }}
        >
          <i className="bi bi-file-earmark-pdf me-1" style={{ fontSize: "12px" }}></i>
          <span className="d-none d-md-inline">Export PDF</span>
          <span className="d-md-none">PDF</span>
        </button>

        {/* Save Project Button */}
        <button
          className="btn btn-success btn-sm d-flex align-items-center"
          onClick={() => {
            console.log('🔴 SAVE BUTTON CLICKED!');
            if (saveProject) {
              saveProject();
            } else {
              console.error('❌ saveProject function is undefined!');
            }
          }}
          style={{
            height: "36px",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "6px",
            padding: "0 12px"
          }}
        >
          <i className="bi bi-save me-1" style={{ fontSize: "12px" }}></i>
          <span className="d-none d-md-inline">Save</span>
          <span className="d-md-none">Save</span>
        </button>
      </div>
    </nav>
  );
};

export default EditorNavbar;