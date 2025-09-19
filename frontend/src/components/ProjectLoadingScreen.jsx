import React from 'react';

const ProjectLoadingScreen = ({ projectTitle = "Project", message = "Loading..." }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'black'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px'
      }}>
        {/* Simple green loading circle */}
        <div style={{
          width: '50px',
          height: '50px',
          margin: '0 auto 30px',
          border: '4px solid #f0f0f0',
          borderTop: '4px solid #198754',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>

        {/* Loading text */}
        <p style={{
          fontSize: '16px',
          margin: '0 0 10px 0',
          color: 'black'
        }}>
          Loading
        </p>
        
        {/* Project name */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: '500',
          margin: '0',
          color: 'black'
        }}>
          {projectTitle}
        </h2>
      </div>

      {/* CSS animation */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProjectLoadingScreen;