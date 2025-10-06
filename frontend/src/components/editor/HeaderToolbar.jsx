/**
 * Header Toolbar Component
 * Main navigation bar with actions like export, save, complete, and database loading
 */

import { useState } from 'react';
import LroDbDropdown from './LroDbDropdown';
import FieldEditorTag from '../FieldEditorTag';

const HeaderToolbar = ({
  // LRO Database
  lroForms = [],
  isLoadingLroForms = false,
  onLroFormSelect = () => {},
  onLoadLroForms = () => {},

  // Actions
  onExportPdf = () => {},
  onPreviewPdf = () => {},
  onSaveProject = () => {},
  onUpdateProjectStatus = () => {},

  // Current project info
  projectTitle = "Property Review Maker",

  // State
  isExporting = false,
  isPreviewing = false,
  isSaving = false
}) => {
  return (
    <nav 
      className="navbar navbar-expand-lg border-bottom bg-white shadow-sm fixed-top" 
      style={{ height: "72px", zIndex: 1030 }}
    >
      {/* Left - Logo/Title */}
      <div className="d-flex align-items-center ms-3">
        <img 
          src="/NeitClemLogo.png" 
          alt="Neit Clem Logo" 
          style={{ width: "32px", height: "32px", marginRight: "8px" }} 
        />
        <span className="fw-semibold text-dark" style={{ fontSize: "16px" }}>
          {projectTitle}
        </span>
      </div>
      
      {/* Right - Actions Toolbar */}
      <div className="d-flex align-items-center me-3" style={{ gap: "8px" }}>
        {/* LRO Database Dropdown */}
        <LroDbDropdown
          lroForms={lroForms}
          isLoading={isLoadingLroForms}
          onFormSelect={onLroFormSelect}
          onLoadForms={onLoadLroForms}
        />
        
        {/* Divider */}
        <div className="vr" style={{ height: "28px", opacity: "0.3" }}></div>
        
        {/* Preview Button */}
        <button
          className="btn btn-sm d-flex align-items-center preview-pdf-btn"
          onClick={onPreviewPdf}
          disabled={isPreviewing || isExporting}
          style={{
            backgroundColor: '#6c757d',
            borderColor: '#6c757d',
            color: 'white',
            height: "36px",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "6px",
            padding: "0 12px"
          }}
        >
          <i className={`bi ${isPreviewing ? 'bi-hourglass-split' : 'bi-eye'} me-1`}
             style={{ fontSize: "12px", color: "white" }}></i>
          {isPreviewing ? 'Previewing...' : 'Preview PDF'}
        </button>

        {/* Export Button */}
        <button
          className="btn btn-sm d-flex align-items-center export-pdf-btn"
          onClick={onExportPdf}
          disabled={isExporting || isPreviewing}
          style={{
            backgroundColor: '#2d5016',
            borderColor: '#2d5016',
            color: 'white',
            height: "36px",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "6px",
            padding: "0 12px"
          }}
        >
          <i className={`bi ${isExporting ? 'bi-hourglass-split' : 'bi-file-earmark-pdf'} me-1`}
             style={{ fontSize: "12px", color: "white" }}></i>
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
        
        {/* Status Dropdown */}
        <div className="dropdown">
          <button 
            className="btn btn-outline-success btn-sm d-flex align-items-center dropdown-toggle" 
            type="button"
            id="statusDropdownHeader"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            title="Mark project status"
            style={{ 
              height: "36px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              padding: "0 12px",
              borderColor: "#198754",
              color: "#198754"
            }}
          >
            <i className="bi bi-flag me-1" style={{ fontSize: "12px" }}></i>
            Mark Status
          </button>
          <ul className="dropdown-menu" aria-labelledby="statusDropdownHeader">
            <li>
              <button 
                className="dropdown-item d-flex align-items-center" 
                onClick={() => onUpdateProjectStatus('approved')}
              >
                <i className="bi bi-check-circle me-2 text-success"></i>
                Mark Approved
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item d-flex align-items-center" 
                onClick={() => onUpdateProjectStatus('denied')}
              >
                <i className="bi bi-x-circle me-2 text-danger"></i>
                Mark Denied
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item d-flex align-items-center" 
                onClick={() => onUpdateProjectStatus('conditional')}
              >
                <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
                Mark Conditional
              </button>
            </li>
          </ul>
        </div>
        
        {/* Save Button */}
        <button 
          className="btn btn-outline-secondary btn-sm d-flex align-items-center" 
          onClick={onSaveProject}
          disabled={isSaving}
          title="Save project manually"
          style={{ 
            height: "36px",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "6px",
            padding: "0 12px",
            borderColor: "#6c757d",
            color: "#6c757d"
          }}
        >
          <i className={`bi ${isSaving ? 'bi-hourglass-split' : 'bi-save'} me-1`} 
             style={{ fontSize: "12px", color: "#6c757d" }}></i>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </nav>
  );
};

export default HeaderToolbar;