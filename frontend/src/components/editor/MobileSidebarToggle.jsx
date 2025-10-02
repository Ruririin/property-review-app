import React from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { NAVBAR_HEIGHT } from '../../utils/editorUtils';

const MobileSidebarToggle = () => {
  const { device, isMobileSidebarOpen, setIsMobileSidebarOpen } = useEditor();

  if (!device.isMobile) return null;

  return (
    <button
      onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      style={{
        position: "fixed",
        top: NAVBAR_HEIGHT + 20,
        right: 20,
        width: "50px",
        height: "50px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "50%",
        fontSize: "20px",
        zIndex: 1100,
        cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isMobileSidebarOpen ? "×" : "☰"}
    </button>
  );
};

export default MobileSidebarToggle;