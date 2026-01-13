/**
 * LRO Database Dropdown Component
 * Handles loading and selecting from LRO database forms
 */

import { useState, useRef, useEffect } from 'react';
import FieldEditorTag from '../FieldEditorTag';

const LroDbDropdown = ({
  lroForms = [],
  isLoading = false,
  onFormSelect = () => {},
  onLoadForms = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Load forms when component mounts
  useEffect(() => {
    if (lroForms.length === 0 && !isLoading) {
      onLoadForms();
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleFormSelect = (form) => {
    onFormSelect(form.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredForms = lroForms
    .filter(form => 
      !searchTerm || 
      (form.appName && form.appName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .slice(0, 20);

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-outline-secondary btn-sm d-flex align-items-center"
        onClick={() => setIsOpen(!isOpen)}
        disabled={true}
        title="Database loading disabled for security"
        style={{
          height: "36px",
          fontSize: "13px",
          fontWeight: "500",
          borderRadius: "6px",
          padding: "0 12px",
          opacity: "0.6",
          cursor: "not-allowed"
        }}
      >
        <i className="bi bi-database me-1" style={{ fontSize: "12px", color: "#6c757d" }}></i>
        Load from Database (Disabled)
      </button>
      
      {isOpen && (
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
            {/* Search Input */}
            <input
              type="text"
              className="form-control form-control-sm mb-3"
              placeholder="Search forms by company name..."
              style={{ 
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid #ced4da"
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            
            {/* Forms List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredForms.length > 0 ? (
                filteredForms.map(form => (
                  <div
                    key={form.id}
                    className="p-3 border-bottom cursor-pointer"
                    style={{ 
                      cursor: 'pointer', 
                      fontSize: '13px',
                      borderBottom: '1px solid #f1f3f4',
                      transition: 'background-color 0.15s ease'
                    }}
                    onClick={() => handleFormSelect(form)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div className="fw-semibold text-dark mb-1" style={{ fontSize: "14px" }}>
                      {form.appName || 'N/A'}
                      <FieldEditorTag 
                        fieldId={`form-${form.id}`} 
                        fieldName={`Form: ${form.appName || 'N/A'}`}
                      />
                    </div>
                    <div className="text-muted" style={{ fontSize: "12px", lineHeight: "1.3" }}>
                      <i className="bi bi-geo-alt me-1" style={{ color: "#198754" }}></i>
                      {form.locationA || 'No location'} 
                      <span className="mx-2">•</span>
                      <i className="bi bi-hash" style={{ color: "#198754" }}></i>
                      {form.id}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-search mb-2 d-block" style={{ fontSize: "24px", opacity: "0.5", color: "#198754" }}></i>
                  <div style={{ fontSize: "13px" }}>
                    {searchTerm ? 'No forms found matching your search' : 'No forms available'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LroDbDropdown;