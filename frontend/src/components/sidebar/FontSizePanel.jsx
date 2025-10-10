import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const FontSizePanel = () => {
  const { selectedField, fontSizes, handleFontSizeChange } = useEditor();

  return (
    <div className="mb-3">
      <label className="form-label small fw-bold">Font Size</label>
      <input
        type="number"
        className="form-control form-control-sm"
        min="10"
        max="100"
        value={selectedField ? (fontSizes[selectedField] || "") : ""}
        onChange={handleFontSizeChange}
        disabled={!selectedField}
        placeholder="Select field"
      />
    </div>
  );
};

export default FontSizePanel;
