import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="2"
          opacity="0.1"
        />
        
        {/* Animated segments */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const x1 = 50 + Math.cos(angle) * 25;
          const y1 = 50 + Math.sin(angle) * 25;
          const x2 = 50 + Math.cos(angle) * 40;
          const y2 = 50 + Math.sin(angle) * 40;
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              opacity={0.2 + (i * 0.06)}
              className="animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '2s'
              }}
            />
          );
        })}
        
        {/* Center circle */}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill="white"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Inner icon (note/document) */}
        <g transform="translate(50, 50)">
          <rect
            x="-5"
            y="-6"
            width="10"
            height="12"
            rx="1"
            fill="#3b82f6"
          />
          <line
            x1="-3"
            y1="-3"
            x2="3"
            y2="-3"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <line
            x1="-3"
            y1="0"
            x2="3"
            y2="0"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <line
            x1="-3"
            y1="3"
            x2="1"
            y2="3"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
