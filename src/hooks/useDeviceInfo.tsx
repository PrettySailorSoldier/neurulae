import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    orientation: 'portrait',
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detect safe area (for notched devices)
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaTop = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0');
      const safeAreaBottom = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0');
      const safeAreaLeft = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0');
      const safeAreaRight = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0');

      setDeviceInfo({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        orientation: width > height ? 'landscape' : 'portrait',
        safeArea: {
          top: safeAreaTop,
          bottom: safeAreaBottom,
          left: safeAreaLeft,
          right: safeAreaRight,
        },
      });
    };

    updateDeviceInfo();
    
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}
