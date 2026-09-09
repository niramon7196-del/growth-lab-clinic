import React, { useState, useEffect } from 'react';
import { growthLabLogo, glIcon } from '../assets/logo';

interface LogoProps {
  className?: string;
  alt?: string;
  variant?: 'full' | 'symbol';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  alt = 'Growth Lab Official Logo',
  variant = 'full'
}) => {
  const primarySrc = variant === 'symbol' ? glIcon : (growthLabLogo || '/growth_lab_logo.png');
  const [currentSrc, setCurrentSrc] = useState<string>(primarySrc);

  useEffect(() => {
    const nextSrc = variant === 'symbol' ? glIcon : (growthLabLogo || '/growth_lab_logo.png');
    setCurrentSrc(nextSrc);
  }, [variant]);

  const handleError = () => {
    // If the hashed asset path fails, gracefully fallback to public root asset
    if (currentSrc !== '/growth_lab_logo.png') {
      setCurrentSrc('/growth_lab_logo.png');
    }
  };

  return (
    <div className={`flex items-center justify-center shrink-0 ${className}`}>
      <img 
        src={currentSrc || growthLabLogo || '/growth_lab_logo.png'} 
        alt={alt} 
        onError={handleError}
        loading="eager"
        decoding="sync"
        referrerPolicy="no-referrer"
        className="w-full h-auto max-w-full max-h-full block object-contain select-none pointer-events-none"
        style={{ minWidth: '24px', display: 'block' }}
      />
    </div>
  );
};

export default Logo;


