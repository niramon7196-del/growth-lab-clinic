import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-30">
      {/* 1. Large Fluid Luminous Glows */}
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-purple-400/25 via-violet-300/20 to-transparent blur-3xl" />
      <div className="absolute -top-20 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-pink-300/30 via-rose-200/20 to-transparent blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-sky-200/25 via-indigo-100/20 to-purple-200/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-sky-300/30 via-cyan-200/25 to-transparent blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-300/25 via-purple-200/20 to-transparent blur-3xl" />

      {/* 2. Flowing Translucent Wave Curves (SVG) */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-65" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1440 900" 
        preserveAspectRatio="none"
      >
        <defs>
          {/* Wave Gradients */}
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#F472B6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.30" />
          </linearGradient>

          <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBCFE8" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#DDD6FE" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.35" />
          </linearGradient>

          <linearGradient id="waveStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="35%" stopColor="#DDD6FE" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#FBCFE8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="waveStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Soft flowing wave paths */}
        <path
          d="M-50,220 C320,120 540,420 920,260 C1200,140 1340,300 1520,240 L1520,-50 L-50,-50 Z"
          fill="url(#waveGrad1)"
        />
        <path
          d="M-50,220 C320,120 540,420 920,260 C1200,140 1340,300 1520,240"
          fill="none"
          stroke="url(#waveStroke1)"
          strokeWidth="2.5"
          filter="url(#softGlow)"
        />

        <path
          d="M-50,480 C260,340 680,680 1080,440 C1280,320 1400,460 1520,400 L1520,950 L-50,950 Z"
          fill="url(#waveGrad2)"
        />
        <path
          d="M-50,480 C260,340 680,680 1080,440 C1280,320 1400,460 1520,400"
          fill="none"
          stroke="url(#waveStroke2)"
          strokeWidth="2"
          filter="url(#softGlow)"
        />

        {/* Secondary gentle wave */}
        <path
          d="M-30,620 C420,540 820,720 1220,560 C1360,510 1460,540 1520,520"
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.5"
        />
      </svg>

      {/* 3. Subtle Ambient Light Sparkles */}
      <div className="absolute top-[18%] left-[28%] w-2 h-2 rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.85)] animate-pulse" />
      <div className="absolute top-[28%] right-[32%] w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_16px_4px_rgba(251,207,232,0.9)] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[68%] left-[45%] w-2 h-2 rounded-full bg-white shadow-[0_0_14px_3px_rgba(186,230,253,0.85)] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[48%] right-[16%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
      <div className="absolute top-[78%] left-[12%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(199,210,254,0.8)]" />

      {/* 4. Translucent Floating Spheres / Orbs */}
      <div 
        className="absolute top-[60%] right-[8%] w-44 h-44 rounded-full border border-white/30 bg-gradient-to-br from-white/20 to-sky-300/10 backdrop-blur-xs shadow-inner"
        style={{
          boxShadow: 'inset 0 0 25px rgba(255, 255, 255, 0.4), 0 8px 32px rgba(56, 189, 248, 0.08)'
        }}
      />
      <div 
        className="absolute top-[75%] right-[22%] w-24 h-24 rounded-full border border-white/25 bg-gradient-to-tr from-white/25 to-pink-200/15 backdrop-blur-xs"
        style={{
          boxShadow: 'inset 0 0 16px rgba(255, 255, 255, 0.35)'
        }}
      />
      <div 
        className="absolute top-[12%] left-[6%] w-36 h-36 rounded-full border border-white/20 bg-gradient-to-br from-white/20 to-purple-200/10 backdrop-blur-xs"
        style={{
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.3)'
        }}
      />
    </div>
  );
}
