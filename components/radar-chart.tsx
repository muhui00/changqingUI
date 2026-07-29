'use client'

interface RadarDimension {
  label: string
  score: number // 0-100
  anomalyCount: number
  reviewedCount: number
}

interface RadarChartProps {
  dimensions: RadarDimension[]
  size?: number
}

export function RadarChart({ dimensions, size = 240 }: RadarChartProps) {
  const n = dimensions.length
  const cx = size / 2
  const cy = size / 2
  // No label padding needed — labels are rendered outside
  const r = size / 2 - 18

  const getPoint = (index: number, radius: number): [number, number] => {
    const angle = (index / n) * 2 * Math.PI - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  const rings = [0.25, 0.5, 0.75, 1.0]

  const dataPoints = dimensions.map((d, i) => getPoint(i, (d.score / 100) * r))
  const polygonPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="四维质量雷达图"
    >
      {/* Grid rings */}
      {rings.map((ratio, ri) => {
        const ringPoints = Array.from({ length: n }, (_, i) => getPoint(i, ratio * r))
        const ringPath =
          ringPoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
            .join(' ') + ' Z'
        return (
          <path
            key={ri}
            d={ringPath}
            fill={ri === rings.length - 1 ? 'none' : 'var(--md-sys-color-surface-container-low)'}
            stroke="var(--md-sys-color-outline-variant)"
            strokeWidth="0.8"
            strokeDasharray={ri === rings.length - 1 ? 'none' : '3,2'}
          />
        )
      })}

      {/* Ring score labels at 0° axis */}
      {rings.map((ratio, ri) => {
        const py = cy - ratio * r
        return (
          <text
            key={`rl-${ri}`}
            x={cx + 3}
            y={py - 2}
            fontSize="8"
            fill="var(--md-sys-color-on-surface-variant)"
            fontFamily="var(--md-ref-typeface-plain)"
          >
            {Math.round(ratio * 100)}
          </text>
        )
      })}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const [x, y] = getPoint(i, r)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--md-sys-color-outline-variant)"
            strokeWidth="0.8"
          />
        )
      })}

      {/* Data fill */}
      <path
        d={polygonPath}
        fill="var(--md-sys-color-primary)"
        fillOpacity="0.18"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r="4.5"
          fill="var(--md-sys-color-primary)"
          stroke="var(--md-sys-color-surface)"
          strokeWidth="1.5"
        >
          <title>{`${dimensions[i].label}: ${dimensions[i].score}分 / 异常${dimensions[i].anomalyCount}条`}</title>
        </circle>
      ))}
    </svg>
  )
}
