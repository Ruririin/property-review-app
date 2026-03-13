import { useState, useEffect } from 'react';
import fieldActivityService from '../services/fieldActivityService';

/**
 * Component that displays a small tag showing who is currently editing a field
 */
export default function FieldEditorTag({ fieldId, fieldName }) {
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const currentEditor = fieldActivityService.getFieldEditor(fieldId);
    setEditor(currentEditor);
    
    const unsubscribe = fieldActivityService.addListener((event, data) => {
      if (data.fieldId === fieldId) {
        const updatedEditor = fieldActivityService.getFieldEditor(fieldId);
        setEditor(updatedEditor);
      }
    });

    return unsubscribe;
  }, [fieldId]);

  if (!editor) {
    return null;
  }

  return (
    <span 
      className="field-editor-tag"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '8px',
        padding: '2px 6px',
        backgroundColor: '#ff6b6b !important',
        color: 'white !important',
        fontSize: '10px',
        fontWeight: '500',
        borderRadius: '10px',
        animation: 'pulse 2s infinite',
        position: 'relative',
        zIndex: 1000,
        border: '1px solid #ff4757',
        textShadow: '0 0 2px rgba(0,0,0,0.5)',
        opacity: 1,
        isolation: 'isolate'
      }}
    >
      <span 
        style={{ 
          width: '6px', 
          height: '6px', 
          backgroundColor: 'white', 
          borderRadius: '50%', 
          marginRight: '4px',
          animation: 'blink 1s infinite'
        }}
      />
{editor.user} is editing this
    </span>
  );
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  .field-editor-tag {
    box-shadow: 0 2px 6px rgba(255, 107, 107, 0.4) !important;
    background-color: #ff6b6b !important;
    color: white !important;
    z-index: 1001 !important;
    position: relative !important;
  }
  
  .field-editor-tag * {
    color: white !important;
  }
  
  /* Ensure visibility in dropdown contexts */
  .position-absolute .field-editor-tag {
    background-color: #ff6b6b !important;
    color: white !important;
    border: 1px solid #ff4757 !important;
    z-index: 1002 !important;
  }
  
  /* Prevent Bootstrap or other CSS from overriding */
  .bg-white .field-editor-tag,
  .dropdown-menu .field-editor-tag,
  .list-group-item .field-editor-tag {
    background-color: #ff6b6b !important;
    color: white !important;
    opacity: 1 !important;
  }
`;

if (!document.head.querySelector('[data-field-editor-styles]')) {
  styleSheet.setAttribute('data-field-editor-styles', 'true');
  document.head.appendChild(styleSheet);
}