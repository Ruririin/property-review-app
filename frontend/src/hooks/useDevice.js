import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    orientation: typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    touchDevice: typeof window !== 'undefined' && 'ontouchstart' in window
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const newDevice = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        touchDevice: isTouchDevice
      };
      
      setDevice(newDevice);
      
      // Add CSS classes to body for styling
      document.body.classList.remove('mobile', 'tablet', 'desktop', 'touch-device', 'landscape', 'portrait');
      
      if (newDevice.isMobile) document.body.classList.add('mobile');
      if (newDevice.isTablet) document.body.classList.add('tablet');
      if (newDevice.isDesktop) document.body.classList.add('desktop');
      if (newDevice.touchDevice) document.body.classList.add('touch-device');
      document.body.classList.add(newDevice.orientation);
      
      // console.log('📱 Device detected:', newDevice);
    };

    // Check on mount
    checkDevice();

    // Add resize listener
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return device;
};