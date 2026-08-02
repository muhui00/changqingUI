'use client'

interface RadarDimension {
  label: string
  score: number // 0-100（复核后得分）
  beforeScore?: number // 0-100（复核前得分，可选）
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
  // 轴标签在外部渲染，无需额外内边距
  const r = size / 2 - 24

  const getPoint = (index: number, radius: number): [number, number] => {
    const angle = (index / n) * 2 * Math.PI - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  const rings = [0.25, 0.5, 0.75, 1.0]

  const hasBefore = dimensions.some((d) => typeof d.beforeScore === 'number')

  const toPath = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'

  // 复核后
  const dataPoints = dimensions.map((d, i) => getPoint(i, (d.score / 100) * r))
  const polygonPath = toPath(dataPoints)

  // 复核前
  const beforePoints = dimensions.map((d, i) =>
    getPoint(i, ((d.beforeScore ?? d.score) / 100) * r),
  )
  const beforePath = toPath(beforePoints)

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

      {/* 轴标签（维度名称） */}
      {dimensions.map((d, i) => {
        const [lx, ly] = getPoint(i, r + 12)
        const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
        return (
          <text
            key={`ax-${i}`}
            x={lx}
            y={ly}
            fontSize="9.5"
            fontWeight="600"
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="var(--md-sys-color-on-surface-variant)"
            fontFamily="var(--md-ref-typeface-plain)"
          >
            {d.label}
          </text>
        )
      })}

      {/* 复核前（灰色虚线） */}
      {hasBefore && (
        <path
          d={beforePath}
          fill="var(--md-sys-color-on-surface-variant)"
          fillOpacity="0.06"
          stroke="var(--md-sys-color-on-surface-variant)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
          strokeLinejoin="round"
        />
      )}

      {/* 复核后（主色实线） */}
      <path
        d={polygonPath}
        fill="var(--md-sys-color-primary)"
        fillOpacity="0.18"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 复核前数据点 */}
      {hasBefore &&
        beforePoints.map((p, i) => (
          <circle
            key={`b-${i}`}
            cx={p[0]}
            cy={p[1]}
            r="3"
            fill="var(--md-sys-color-surface)"
            stroke="var(--md-sys-color-on-surface-variant)"
            strokeWidth="1.5"
          >
            <title>{`${dimensions[i].label} 复核前: ${dimensions[i].beforeScore}分`}</title>
          </circle>
        ))}

      {/* 复核后数据点 */}
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
          <title>{`${dimensions[i].label} 复核后: ${dimensions[i].score}分 / 异常${dimensions[i].anomalyCount}条`}</title>
        </circle>
      ))}
    </svg>
  )
}
