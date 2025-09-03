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
  onSaveProject = () => {},
  onMarkComplete = () => {},
  
  // Current project info
  projectTitle = "Property Review Maker",
  
  // State
  isExporting = false,
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
        
        {/* Export Button */}
        <button 
          className="btn btn-sm d-flex align-items-center export-pdf-btn" 
          onClick={onExportPdf}
          disabled={isExporting}
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
        
        {/* Complete Button */}
        <button 
          className="btn btn-outline-success btn-sm d-flex align-items-center" 
          onClick={onMarkComplete}
          title="Mark this project as completed and remove it from active projects"
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
          <i className="bi bi-check-circle me-1" style={{ fontSize: "12px" }}></i>
          Mark Complete
        </button>
        
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