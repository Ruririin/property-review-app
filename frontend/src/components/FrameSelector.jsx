import React from 'react';
import { Grid2X2, Grid3X3, Maximize, LayoutGrid } from 'lucide-react';

const FrameSelector = ({ currentLayout, onLayoutChange }) => {
  const layouts = [
    { value: 1, icon: Maximize, label: '1' },
    { value: 2, icon: LayoutGrid, label: '2' },
    { value: 3, icon: Grid2X2, label: '3' },
    { value: 4, icon: Grid2X2, label: '4' },
    { value: 6, icon: Grid3X3, label: '6' },
  ];

  return (
    <div
      className="no-export"
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        display: "flex",
        gap: "8px",
        zIndex: 1002,
        background: "rgba(255, 255, 255, 0.95)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {layouts.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onLayoutChange(value)}
          style={{
            padding: "8px 12px",
            border: currentLayout === value ? "2px solid #8B9A5B" : "2px solid #ccc",
            borderRadius: "4px",
            background: currentLayout === value ? "#8B9A5B" : "white",
            color: currentLayout === value ? "white" : "#666",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontFamily: "'Montserrat', sans-serif",
            transition: "all 0.2s ease",
          }}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
};

export default FrameSelector;
