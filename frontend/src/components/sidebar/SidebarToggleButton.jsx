import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const SidebarToggleButton = () => {
  const { 
    showToolbar,
    setShowToolbar
  } = useEditor();

  return (
    <button
      onClick={() => setShowToolbar(!showToolbar)}
      style={{
        position: "absolute",
        width: "20px",
        height: "60px",
        backgroundColor: "#f8f9fa",
        border: "1px solid #ddd",
        borderRadius: "0 6px 6px 0",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        right: "-20px",
        top: "50%",
        transform: "translateY(-50%)",
        borderLeft: "none",
        zIndex: 1001,
      }}
    >
      <span style={{ fontSize: "1rem" }}>{showToolbar ? "←" : "→"}</span>
    </button>
  );
};

export default SidebarToggleButton;
