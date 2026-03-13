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
        isTablet: width >= 768 && width < 1200, // Expand tablet range for better support
        isDesktop: width >= 1200,
        isMobileOrTablet: width < 1200, // Combined check for mobile-like experience
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        touchDevice: isTouchDevice
      };
      
      setDevice(newDevice);
      
      document.body.classList.remove('mobile', 'tablet', 'desktop', 'mobile-or-tablet', 'touch-device', 'landscape', 'portrait');
      
      if (newDevice.isMobile) document.body.classList.add('mobile');
      if (newDevice.isTablet) document.body.classList.add('tablet');
      if (newDevice.isDesktop) document.body.classList.add('desktop');
      if (newDevice.isMobileOrTablet) document.body.classList.add('mobile-or-tablet');
      if (newDevice.touchDevice) document.body.classList.add('touch-device');
      document.body.classList.add(newDevice.orientation);
      
      // console.log('📱 Device detected:', newDevice);
    };

    checkDevice();

    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return device;
};