import React from 'react';

interface AchievementBadgeProps {
  type: 'level' | 'milestone' | 'streak' | 'personal_best';
  variant: 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'black' | 'volt' | 'bronze' | 'silver' | 'gold' | 'locked' | 'unlocked';
  label: string;
  sublabel?: string;
  count?: number | string;
  locked?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  type, 
  variant, 
  label, 
  sublabel, 
  count,
  locked = false 
}) => {
  const getBadgeColor = () => {
    if (locked) return 'rgba(255, 255, 255, 0.1)';
    switch (variant) {
      case 'yellow': return '#E2E600';
      case 'orange': return '#FF8A00';
      case 'green': return '#00D1FF'; // Nike Green is actually more like a cyan/volt
      case 'blue': return '#0075FF';
      case 'purple': return '#A020F0';
      case 'black': return '#111111';
      case 'volt': return '#CCFF00';
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'unlocked': return 'var(--primary)';
      default: return 'var(--primary)';
    }
  };

  const badgeColor = getBadgeColor();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      width: '100px',
      opacity: locked ? 0.4 : 1,
      filter: locked ? 'grayscale(1)' : 'none',
    }}>
      {/* Shield SVG */}
      <div style={{ position: 'relative', width: '60px', height: '70px', marginBottom: '8px' }}>
        <svg viewBox="0 0 100 120" style={{ width: '100%', height: '100%', dropShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
          <path 
            d="M50 0 L100 20 L100 80 L50 120 L0 80 L0 20 Z" 
            fill={badgeColor}
            stroke={locked ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="2"
          />
          {/* Inner Text or Icon */}
          <text 
            x="50" 
            y="65" 
            textAnchor="middle" 
            fill={variant === 'yellow' || variant === 'volt' || variant === 'silver' ? '#000' : '#fff'}
            style={{ 
              fontSize: '24px', 
              fontWeight: 900, 
              fontStyle: 'italic',
              fontFamily: 'Impact, sans-serif'
            }}
          >
            {count || (type === 'level' ? 'RUN' : '🏆')}
          </text>
        </svg>
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--foreground)' }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: '9px', color: 'var(--foreground-muted)', marginTop: '2px' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
