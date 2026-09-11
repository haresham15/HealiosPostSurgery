'use client';

interface BiometricSparklineProps {
  data: number[];
  color?: string;
  min?: number;
  max?: number;
  height?: number;
}

export const BiometricSparkline = ({
  data,
  color = '#10b981',
  min,
  max,
  height = 36,
}: BiometricSparklineProps) => {
  if (!data || data.length < 2) return null;

  const dataMin = min !== undefined ? min : Math.min(...data);
  const dataMax = max !== undefined ? max : Math.max(...data);
  const range = dataMax - dataMin || 1;

  const width = 120;
  const padding = 4;
  const usableHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const normalized = (val - dataMin) / range;
    const y = height - padding - normalized * usableHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;
  const lastPoint = points[points.length - 1].split(',');

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Background Gradient Area */}
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Fill Area */}
      <path
        d={`${pathData} L ${width - padding},${height} L ${padding},${height} Z`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />

      {/* Sparkline Path */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current point beacon */}
      <circle
        cx={parseFloat(lastPoint[0])}
        cy={parseFloat(lastPoint[1])}
        r="2.5"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
};
