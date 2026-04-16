import React from 'react';

interface AchievementBadgeProps {
  type: 'level' | 'milestone' | 'streak' | 'personal_best';
  variant: 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'black' | 'volt' | 'bronze' | 'silver' | 'gold' | 'locked' | 'unlocked';
  label: string;
  sublabel?: string;
  count?: number | string;
  locked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  type, 
  variant, 
  label, 
  sublabel, 
  count,
  locked = false,
  size = 'md'
}) => {
  const getBadgeColor = () => {
    switch (variant) {
      case 'yellow': return '#FFE600'; // Bright Yellow
      case 'orange': return '#FF6B00'; // Energetic Orange
      case 'green': return '#00E676'; // Vibrant Spring Green
      case 'blue': return '#00B0FF';  // Vivid Blue
      case 'purple': return '#D500F9'; // Electric Purple
      case 'black': return '#212121'; // Premium Matte Black
      case 'volt': return '#C6FF00';  // High-visibility Volt
      case 'bronze': return '#A77044';
      case 'silver': return '#D7D7D7';
      case 'gold': return '#FFD700';
      case 'unlocked': return 'var(--primary)';
      case 'locked': return 'rgba(255, 255, 255, 0.2)';
      default: return 'var(--primary)';
    }
  };

  const badgeColor = getBadgeColor();

  const dimensions = {
    sm: { width: '40px', height: '48px', fontSize: '14px', textY: '68' },
    md: { width: '60px', height: '70px', fontSize: '24px', textY: '65' },
    lg: { width: '100px', height: '115px', fontSize: '36px', textY: '62' }
  }[size];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      width: size === 'sm' ? '60px' : '100px',
      opacity: locked ? 0.4 : 1,
      filter: locked ? 'grayscale(1)' : 'none',
    }}>
      {/* Shield SVG */}
      <div style={{ position: 'relative', width: dimensions.width, height: dimensions.height, marginBottom: '8px' }}>
        <svg viewBox="0 0 100 120" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}>
          <path 
            d="M50 0 L100 20 L100 80 L50 120 L0 80 L0 20 Z" 
            fill={badgeColor}
            stroke={locked ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="2"
          />
          <text 
            x="50" 
            y={dimensions.textY}
            textAnchor="middle" 
            fill={variant === 'yellow' || variant === 'volt' || variant === 'silver' ? '#000' : '#fff'}
            style={{ 
              fontSize: dimensions.fontSize, 
              fontWeight: 900, 
              fontStyle: 'italic',
              fontFamily: 'Impact, sans-serif'
            }}
          >
            {count || (type === 'level' ? 'RUN' : '🏆')}
          </text>
        </svg>
      </div>

      {label && (
        <div style={{ fontSize: size === 'sm' ? '10px' : '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--foreground)' }}>
          {label}
        </div>
      )}
      {sublabel && (
        <div style={{ fontSize: '9px', color: 'var(--foreground-muted)', marginTop: '2px' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
};


export default AchievementBadge;
