import { useState, useEffect } from 'react';

/**
 * Device detection hook for showing the right install buttons.
 * 
 * Returns:
 *  - isAndroid: Android phone/tablet
 *  - isIOS: iPhone / iPad / iPod
 *  - isDesktop: non-mobile browser
 *  - isMobile: any mobile device
 *  - isStandalone: already running as installed PWA
 */
const useDeviceDetect = () => {
  const [device, setDevice] = useState(() => {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isMobile = isAndroid || isIOS || /webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua);
    const isDesktop = !isMobile;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    return { isAndroid, isIOS, isMobile, isDesktop, isStandalone };
  });

  useEffect(() => {
    // Listen for display-mode changes (e.g. user installs the PWA mid-session)
    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = (e) => {
      setDevice((prev) => ({ ...prev, isStandalone: e.matches }));
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return device;
};

export default useDeviceDetect;
