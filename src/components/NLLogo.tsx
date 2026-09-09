import React from 'react';

interface NLLogoProps {
  className?: string;
  size?: number | string;
}

export const NLLogo: React.FC<NLLogoProps> = ({ 
  className = '', 
  size = 18
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 18;

  return (
    <span 
      className={`inline-flex items-center justify-center align-middle select-none shrink-0 ${className}`}
      aria-label="Developer Signature"
    >
      {/* Approved Single Nira.L Monogram Vector Symbol */}
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
        className="shrink-0 drop-shadow-2xs"
      >
        <defs>
          {/* Main Vibrant Violet to Rose Pink Gradient */}
          <linearGradient id="nlGradMain" x1="20" y1="20" x2="145" y2="145" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="35%" stopColor="#9333EA" />
            <stop offset="70%" stopColor="#C026D3" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>

          {/* Stroke Arc Gradient */}
          <linearGradient id="nlArcGrad" x1="15" y1="15" x2="155" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="45%" stopColor="#C084FC" />
            <stop offset="80%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>

          {/* Sparkle Glow */}
          <linearGradient id="nlSparkle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>

        {/* Circular Orbiting Swirl Arc */}
        <path
          d="M 82 18 C 44 18, 16 48, 16 88 C 16 126, 46 150, 88 148 C 112 147, 138 132, 146 112"
          stroke="url(#nlArcGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* 4-Point Sparkle Star on Right Edge */}
        <path
          d="M 138 74 Q 138 82 146 82 Q 138 82 138 90 Q 138 82 130 82 Q 138 82 138 74 Z"
          fill="url(#nlSparkle)"
        />

        {/* Letter N (Serif Flourish) */}
        <path
          d="M 36 44 C 40 44 43 45 46 50 L 46 106 C 43 111 39 112 34 112 H 31 V 116 H 54 V 112 H 51 C 46 112 45 108 45 104 L 45 60 L 86 116 C 89 119 92 120 96 119 C 100 118 102 114 102 109 L 102 54 C 105 50 109 48 113 48 H 116 V 44 H 93 V 48 H 96 C 100 48 101 52 101 56 L 101 98 L 60 45 C 57 41 52 39 47 40 C 43 40 39 42 36 44 Z"
          fill="url(#nlGradMain)"
        />

        {/* Letter L (Serif Stem with Curved Extended Flourish Tail) */}
        <path
          d="M 76 44 H 98 V 48 H 94 C 89 48 88 52 88 56 L 88 104 C 88 114 96 122 108 122 C 122 122 136 112 144 96 L 148 98 C 140 118 122 134 98 134 C 78 134 70 121 70 104 L 70 56 C 70 52 69 48 64 48 H 60 V 44 H 76 Z"
          fill="url(#nlGradMain)"
        />

        {/* Delicate Center Star Accent */}
        <polygon points="76,80 78.5,84 76,88 73.5,84" fill="#FFFFFF" opacity="0.8" />
      </svg>
    </span>
  );
};

export default NLLogo;


