import { useEffect } from 'react';

/**
 * Universal Scroll Lock Hook for all devices (iPad, iPhone, Mobile, Desktop).
 * Prevents background scroll when modals / popups are open.
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // Track original styles to restore accurately
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;
    
    const mainElem = document.querySelector('main');
    const originalMainOverflow = mainElem ? mainElem.style.overflow : '';

    // Lock background scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    if (mainElem) {
      mainElem.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
      if (mainElem) {
        mainElem.style.overflow = originalMainOverflow;
      }
    };
  }, [isLocked]);
}

