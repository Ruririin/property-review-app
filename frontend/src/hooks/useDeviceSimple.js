import { useState, useEffect } from 'react';

export const useDeviceSimple = () => {
  const [device, setDevice] = useState({
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1200,
    isDesktop: window.innerWidth >= 1200,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    touchDevice: 'ontouchstart' in window
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1200,
        isDesktop: width >= 1200,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        touchDevice: 'ontouchstart' in window
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return device;
};