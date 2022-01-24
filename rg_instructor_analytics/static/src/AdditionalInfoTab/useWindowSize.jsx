import { useState, useEffect } from 'react';
export const TABLET_VIEW = 959;
export const MOBILE_VIEW = 549;

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    useWidth: undefined,
    useHeight: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        useWidth: global.innerWidth,
        useHeight: global.innerHeight,
      });
    }

    global.addEventListener('resize', handleResize);

    handleResize();

    return () => global.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export default useWindowSize;
