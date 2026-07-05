import React from 'react';

interface AppLogoIconProps {
  className?: string;
  size?: number;
}

export function AppLogoIcon({ className = 'w-10 h-10', size }: AppLogoIconProps) {
  const finalSize = size || undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      width={finalSize}
      height={finalSize}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="applo-logo-icon-svg"
    >
      <defs>
        {/* Soft yellow-orange to cyan-blue gradient matching the image precisely */}
        <linearGradient id="applo-bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FCD116" />
          <stop offset="25%" stopColor="#F5B921" />
          <stop offset="50%" stopColor="#EE7C1E" />
          <stop offset="78%" stopColor="#9CE7FA" />
          <stop offset="100%" stopColor="#B3C6FA" />
        </linearGradient>
        {/* Shadow for depth */}
        <filter id="logo-drop-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Main Gradient Rounded Icon Frame */}
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="26"
        fill="url(#applo-bg-grad)"
        filter="url(#logo-drop-shadow)"
      />

      {/* Circular outer rim outline, slightly open or full */}
      <circle
        cx="50"
        cy="42"
        r="32"
        stroke="#EE6F1D"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="180 30"
        strokeDashoffset="140"
      />

      {/* Gear Outline in center-top */}
      <g stroke="#EE6F1D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Central gear body circle */}
        <circle cx="50" cy="42" r="10" />
        
        {/* Gear Teeth (Square/Trapezoidal contours around the central circle) */}
        <path d="M 46.5 28.5 L 53.5 28.5 L 55 31.5 L 58 30 L 60.5 32.5 L 59 35.5 L 62 37 L 62 44 L 59 45.5 L 60.5 48.5 L 58 51 L 55 49.5 L 53.5 52.5 L 46.5 52.5 L 45 49.5 L 42 51 L 39.5 48.5 L 41 45.5 L 38 44 L 38 37 L 41 35.5 L 39.5 32.5 L 42 30 L 45 31.5 Z" />
      </g>

      {/* Hand pointing to the gear */}
      <g stroke="#EE6F1D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Back of hand / wrist outline */}
        <path d="M 36.5 78 C 36.5 73 37.5 70 38.5 68" />
        
        {/* Thumb */}
        <path d="M 38.5 68 C 40 64.5 42 63.5 43.5 64.5 C 45 65.5 43.5 69.5 41.5 73" />
        
        {/* Index Finger (Pointing directly inside the gear core, ending at around 48, 38) */}
        <path d="M 38.5 68 C 41 60.5 44 51.5 46.5 44.5 C 47.5 41.5 51 43 49.5 47 C 47 54.5 44.5 61.5 41.5 70" />
        
        {/* Middle Finger (Folded) */}
        <path d="M 44.5 53 C 46.5 49.5 49.5 50.5 48.5 54 C 46.5 60.5 44.5 65.5 43.5 68.5" />
        
        {/* Ring Finger (Folded) */}
        <path d="M 47.5 56.5 C 49.5 53.5 52 54.5 51 57.5 C 49 63.5 47.5 67.5 46.5 70" />
        
        {/* Pinky Finger (Folded) */}
        <path d="M 50.5 60.5 C 52 58 54.5 59 53.5 62 C 51.5 67 50 71 49 73.5" />

        {/* Bottom palm / wrist line connecting right side */}
        <path d="M 49 73.5 L 57.5 73.5" />
      </g>
    </svg>
  );
}

interface AppLogoBrandProps {
  className?: string;
  showSlogan?: boolean;
}

export function AppLogoBrand({ className = '', showSlogan = true }: AppLogoBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} id="applo-brand-container">
      <AppLogoIcon className="w-11 h-11 shrink-0" />
      <div className="text-left">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
          APPLO
        </h1>
        {showSlogan && (
          <span className="text-[9px] font-black tracking-widest text-[#EE6F1D] dark:text-amber-500 uppercase block mt-1">
            PANTAU PROGRESS TANPA JEDA
          </span>
        )}
      </div>
    </div>
  );
}
