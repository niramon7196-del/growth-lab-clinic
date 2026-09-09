import React from 'react';
import { glIcon } from '../assets/logo';

interface GLIconProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const GLIcon: React.FC<GLIconProps> = ({ 
  className = '', 
  size = 36,
  alt = 'Growth Lab' 
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 36;

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
      title={alt}
    >
      <img 
        src={glIcon} 
        alt={alt} 
        className="max-w-full max-h-full w-auto h-auto block object-contain select-none pointer-events-none"
      />
    </div>
  );
};

export default GLIcon;



