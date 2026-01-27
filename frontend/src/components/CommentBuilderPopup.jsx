import { useState, useEffect } from 'react';

const CommentBuilderPopup = ({
  isOpen,
  onClose,
  initialText = '',
  onSave,
  title = "Edit Comment"
}) => {
  const [editedText, setEditedText] = useState(initialText);

  useEffect(() => {
    setEditedText(initialText);
  }, [initialText, isOpen]);

  const handleSave = () => {
    if (editedText.trim()) {
      onSave(editedText);
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedText(initialText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={handleCancel}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e0e0e0'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              color: '#333',
              fontWeight: '600'
            }}>
              {title}
            </h3>
          </div>

          {/* Text Editor */}
          <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px' }}>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Enter your comment text here..."
              autoFocus
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                fontSize: '14px',
                fontFamily: "'Montserrat', sans-serif",
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.5',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#007bff';
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ccc';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '12px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#666',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f5f5f5';
                e.target.style.borderColor = '#999';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#ccc';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editedText.trim()}
              style={{
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: editedText.trim() ? '#007bff' : '#ccc',
                color: 'white',
                cursor: editedText.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (editedText.trim()) {
                  e.target.style.backgroundColor = '#0056b3';
                }
              }}
              onMouseLeave={(e) => {
                if (editedText.trim()) {
                  e.target.style.backgroundColor = '#007bff';
                }
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentBuilderPopup;
