import React, { useEffect, useRef } from 'react';

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DOTS = 48; // Number of dots around the circle
const DOT_GAP = 2; // Gap between dots

function getDashArray() {
  const dotLength = (CIRCUMFERENCE - DOTS * DOT_GAP) / DOTS;
  return `${dotLength} ${DOT_GAP}`;
}

const gradientIds = {
  days: 'gradient-days',
  hours: 'gradient-hours',
  minutes: 'gradient-minutes',
  seconds: 'gradient-seconds',
};

const gradients = {
  days: [
    { offset: '0%', color: '#f43f5e' },
    { offset: '100%', color: '#fbbf24' },
  ],
  hours: [
    { offset: '0%', color: '#2563eb' },
    { offset: '100%', color: '#38bdf8' },
  ],
  minutes: [
    { offset: '0%', color: '#10b981' },
    { offset: '100%', color: '#22d3ee' },
  ],
  seconds: [
    { offset: '0%', color: '#a21caf' },
    { offset: '100%', color: '#f472b6' },
  ],
};

const CountdownCircle = ({ value, max, label }) => {
  const percent = Math.max(0, Math.min(1, value / max));
  const progressLength = percent * CIRCUMFERENCE;
  const circleRef = useRef(null);
  const gradKey = label.toLowerCase();
  const gradId = gradientIds[gradKey] || 'gradient-default';

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = CIRCUMFERENCE - progressLength;
    }
  }, [progressLength]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80,
      backdropFilter: 'blur(4px)',
      background: 'rgba(30,41,59,0.13)',
      borderRadius: 14,
      boxShadow: '0 2px 8px rgba(59,130,246,0.10)',
      padding: 4,
    }}>
      <svg width={80} height={80} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="gradient-days" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradients.days.map(g => <stop key={g.offset} offset={g.offset} stopColor={g.color} />)}
          </linearGradient>
          <linearGradient id="gradient-hours" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradients.hours.map(g => <stop key={g.offset} offset={g.offset} stopColor={g.color} />)}
          </linearGradient>
          <linearGradient id="gradient-minutes" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradients.minutes.map(g => <stop key={g.offset} offset={g.offset} stopColor={g.color} />)}
          </linearGradient>
          <linearGradient id="gradient-seconds" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradients.seconds.map(g => <stop key={g.offset} offset={g.offset} stopColor={g.color} />)}
          </linearGradient>
        </defs>
        <circle
          cx={40}
          cy={40}
          r={RADIUS}
          fill="none"
          stroke="#2e3a4d"
          strokeWidth={5}
          opacity={0.18}
        />
        <circle
          ref={circleRef}
          cx={40}
          cy={40}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={5}
          strokeDasharray={getDashArray()}
          strokeDashoffset={CIRCUMFERENCE}
          style={{
            transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,2,.6,1)',
            filter: 'drop-shadow(0 2px 8px rgba(59,130,246,0.13))',
          }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="1.25rem"
          fontWeight="700"
          fill="#fff"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {String(value).padStart(2, '0')}
        </text>
      </svg>
      <span style={{ color: '#fff', fontSize: '0.85rem', marginTop: 6, letterSpacing: 0.5, fontWeight: 500, opacity: 0.85 }}>{label}</span>
    </div>
  );
};

export default CountdownCircle; 