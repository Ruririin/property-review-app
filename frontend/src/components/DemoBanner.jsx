/**
 * Demo Mode Banner Component
 * Shows warning when application is running in demo mode
 */

import { useState } from 'react';
import { DEMO_CONFIG } from '../config/demoConfig.js';

const DemoBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!DEMO_CONFIG.DEMO_MODE || !DEMO_CONFIG.UI.SHOW_DEMO_BANNER || !isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ff6b35',
        color: 'white',
        padding: '8px 16px',
        zIndex: 10000,
        fontSize: '14px',
        fontWeight: '600',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div style={{ flex: 1, textAlign: 'center' }}>
        🎭 DEMO MODE - This is a demonstration version with sample data only. No real data is stored or transmitted.
      </div>
      <button
        onClick={() => setIsVisible(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        title="Hide demo banner"
      >
        ×
      </button>
    </div>
  );
};

export default DemoBanner;