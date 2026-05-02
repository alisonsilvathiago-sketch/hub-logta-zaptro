import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  onlyIcon?: boolean;
  size?: number | string;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ style, className, onlyIcon = false, size = 48, color }) => {
  const width = typeof size === 'number' ? size : parseInt(size as string);
  // Mantendo a proporção original do ícone (1004x510)
  const iconWidth = width;
  const iconHeight = iconWidth * (510 / 1004);

  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', gap: onlyIcon ? '0' : '12px' }} className={className}>
      <svg 
        width={iconWidth} 
        height={iconHeight} 
        viewBox="0 0 1004 510" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E6BFF" />
            <stop offset="100%" stopColor="#0B4DBF" />
          </linearGradient>
        </defs>
        <g fill={color || "url(#logoGradient)"} stroke="none" transform="translate(0,510) scale(0.1,-0.1)">
          <path d="M990 3824 c-119 -31 -234 -149 -259 -264 -8 -35 -11 -359 -11 -1031
          0 -955 0 -981 20 -1037 26 -73 65 -128 126 -174 101 -78 28 -73 1159 -73
          l1010 0 58 27 c78 37 129 78 165 136 65 102 63 56 60 1153 l-3 995 -38 76
          c-43 88 -85 128 -177 172 l-65 31 -995 2 c-847 2 -1003 0 -1050 -13z m740
          -554 c24 -6 63 -38 120 -95 l85 -86 316 2 c335 1 348 -1 391 -48 22 -24 48
          -86 48 -113 0 -20 -3 -20 -615 -20 -593 0 -616 -1 -669 -20 -58 -22 -128 -87
          -147 -138 -6 -15 -31 -117 -55 -227 -42 -186 -50 -215 -56 -204 -2 2 -1 195 2
          429 5 385 7 429 23 453 23 35 60 59 105 68 56 10 412 10 452 -1z m1090 -499
          c41 -21 80 -83 80 -126 0 -16 -18 -113 -41 -215 -22 -102 -55 -256 -74 -342
          -39 -183 -55 -220 -104 -254 l-36 -24 -671 0 -671 0 -34 23 c-20 14 -41 40
          -53 69 l-19 46 78 358 c43 198 86 375 96 396 17 34 54 68 89 81 8 3 310 6 670
          6 620 1 657 0 690 -18z"/>
        </g>
      </svg>
      {!onlyIcon && (
        <span style={{ 
            fontSize: '1.2em', 
            fontWeight: '800', 
            color: '#0F172A', 
            letterSpacing: '-0.04em',
            fontFamily: "'Outfit', 'Inter', sans-serif"
        }}>
          logDock
        </span>
      )}
    </div>
  );
};

export default Logo;
