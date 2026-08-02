'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from 'recharts'

export const WELL_LIST = [
  { id: 'w1', name: '苏36-11井' },
  { id: 'w2', name: '苏36-12井' },
  { id: 'w3', name: '苏36-13井' },
  { id: 'w4', name: '苏36-14井' },
  { id: 'w5', name: '苏37-01井' },
  { id: 'w6', name: '苏37-02井' },
  { id: 'w7', name: '苏14-25井' },
]

export interface VizField {
  id: string
  name: string
  unit?: string
  checked: boolean
  color: string
}

export interface VizFieldCategory {
  id: string
  name: string
  icon: string
  fields: VizField[]
}

export const DEFAULT_CATEGORIES: VizFieldCategory[] = [
  {
    id: 'frac',
    name: '压裂施工',
    icon: 'timeline',
    fields: [
      { id: 'frac_rate', name: '施工排量', unit: 'm³/min', checked: true, color: '#1565c0' },
      { id: 'frac_sand_ratio', name: '砂比', unit: '%', checked: true, color: '#2e7d32' },
      { id: 'frac_tubing', name: '施工油压', unit: 'MPa', checked: true, color: '#c62828' },
      { id: 'frac_casing', name: '施工套压', unit: 'MPa', checked: true, color: '#e65100' },
    ],
  },
  {
    id: 'geology',
    name: '地质参数',
    icon: 'terrain',
    fields: [
      { id: 'porosity', name: '孔隙度', unit: '%', checked: false, color: '#1565c0' },
      { id: 'permeability', name: '渗透率', unit: 'mD', checked: false, color: '#2e7d32' },
      { id: 'reservoir_thick', name: '油层厚度', unit: 'm', checked: false, color: '#e65100' },
      { id: 'saturation', name: '含气饱和度', unit: '%', checked: false, color: '#6a1b9a' },
    ],
  },
  {
    id: 'engineering',
    name: '工程参数',
    icon: 'construction',
    fields: [
      { id: 'sand_volume', name: '加砂量', unit: 'm³', checked: false, color: '#c62828' },
      { id: 'fluid_volume', name: '单井入地液量', unit: 'm³', checked: false, color: '#00695c' },
      { id: 'frac_stages', name: '压裂段数', unit: '段', checked: false, color: '#4527a0' },
      { id: 'cluster_spacing', name: '簇间距', unit: 'm', checked: false, color: '#1565c0' },
    ],
  },
  {
    id: 'production',
    name: '生产参数',
    icon: 'oil_barrel',
    fields: [
      { id: 'daily_gas', name: '日产气量', unit: '万m³', checked: false, color: '#1565c0' },
      { id: 'daily_water', name: '日产水量', unit: 'm³', checked: false, color: '#2e7d32' },
      { id: 'oil_pressure', name: '油压', unit: 'MPa', checked: false, color: '#c62828' },
      { id: 'casing_pressure', name: '套压', unit: 'MPa', checked: false, color: '#e65100' },
      { id: 'cum_gas', name: '累计产气量', unit: '万m³', checked: false, color: '#6a1b9a' },
    ],
  },
  {
    id: 'logging',
    name: '测井参数',
    icon: 'sensors',
    fields: [
      { id: 'gr', name: '自然伽马', unit: 'API', checked: false, color: '#c62828' },
      { id: 'sp', name: '自然电位', unit: 'mV', checked: false, color: '#1565c0' },
      { id: 'rt', name: '深侧向电阻率', unit: 'Ω·m', checked: false, color: '#2e7d32' },
      { id: 'ac', name: '声波时差', unit: 'μs/ft', checked: false, color: '#e65100' },
      { id: 'den', name: '密度', unit: 'g/cm³', checked: false, color: '#6a1b9a' },
      { id: 'cn', name: '中子', unit: '%', checked: false, color: '#00695c' },
    ],
  },
]

// ── 多序列曲线数据（按字段 id 生成，覆盖地质/工程/生产/测井各类参数）──────────────
const FIELD_SERIES: Record<string, { base: number; noise: number; min?: number; cumulative?: boolean; shutInDrop?: boolean }> = {
  // 压裂施工参数
  frac_rate: { base: 6.3, noise: 0.6, min: 0 },
  frac_sand_ratio: { base: 8, noise: 3, min: 0 },
  frac_tubing: { base: 55, noise: 5 },
  frac_casing: { base: 46, noise: 4 },
  // 地质参数
  porosity: { base: 12, noise: 1.5 },
  permeability: { base: 0.6, noise: 0.15, min: 0.05 },
  reservoir_thick: { base: 26, noise: 2 },
  saturation: { base: 66, noise: 3 },
  // 工程参数
  sand_volume: { base: 1200, noise: 140 },
  fluid_volume: { base: 2400, noise: 220 },
  frac_stages: { base: 22, noise: 1.5 },
  cluster_spacing: { base: 15, noise: 1.2 },
  // 生产参数
  daily_gas: { base: 30, noise: 4, shutInDrop: true },
  daily_water: { base: 8, noise: 2, min: 0, shutInDrop: true },
  oil_pressure: { base: 42, noise: 2, shutInDrop: true },
  casing_pressure: { base: 44, noise: 2, shutInDrop: true },
  cum_gas: { base: 0, noise: 0, cumulative: true },
  // 测井参数
  gr: { base: 75, noise: 15 },
  sp: { base: -20, noise: 8 },
  rt: { base: 45, noise: 20, min: 1 },
  ac: { base: 90, noise: 12 },
  den: { base: 2.45, noise: 0.08 },
  cn: { base: 18, noise: 4 },
}

// 确定性随机，保证每次渲染数据一致
function makeRng(seed: number) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 1000) / 1000 }
}

function genSeriesData() {
  const rng = makeRng(20200401)
  const base = new Date('2020-04-01')
  const rows: Record<string, number | string>[] = []
  let cumGas = 0
  for (let i = 0; i < 120; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    const isShutIn = i % 18 === 0
    const row: Record<string, number | string> = { date: `${d.getMonth() + 1}月${d.getDate()}日` }
    const dailyGas = isShutIn ? 2 : Math.max(0, 30 + (rng() - 0.5) * 8)
    cumGas += dailyGas
    for (const [id, c] of Object.entries(FIELD_SERIES)) {
      if (id === 'daily_gas') { row[id] = +dailyGas.toFixed(1); continue }
      if (id === 'cum_gas') { row[id] = +cumGas.toFixed(0); continue }
      let v = c.base + (rng() - 0.5) * 2 * c.noise
      if (isShutIn && c.shutInDrop) v = c.base * 0.3
      if (c.min != null) v = Math.max(c.min, v)
      row[id] = +v.toFixed(Math.abs(c.base) < 5 ? 2 : 1)
    }
    rows.push(row)
  }
  return rows
}
const SERIES_DATA = genSeriesData()

// ── Well log mock data ────────────────────────────────────────────────────────
const LOG_TRACKS = [
  {
    id: 'gr',
    title: 'GR',
    subtitle: '自然伽马',
    unit: 'API',
    min: 0,
    max: 200,
    color: '#c62828',
    data: Array.from({ length: 80 }, (_, i) => ({
      depth: 2500 + i * 25,
      value: 40 + Math.sin(i * 0.3) * 30 + Math.random() * 20,
    })),
  },
  {
    id: 'rt',
    title: 'RT',
    subtitle: '深侧向电阻率',
    unit: 'Ω·m',
    min: 0.2,
    max: 2000,
    logScale: true,
    color: '#1565c0',
    data: Array.from({ length: 80 }, (_, i) => ({
      depth: 2500 + i * 25,
      value: Math.max(0.5, 10 + Math.sin(i * 0.2) * 80 + Math.random() * 40),
    })),
  },
  {
    id: 'ac',
    title: 'AC',
    subtitle: '声波时差',
    unit: 'μs/ft',
    min: 140,
    max: 40,
    color: '#2e7d32',
    data: Array.from({ length: 80 }, (_, i) => ({
      depth: 2500 + i * 25,
      value: 90 + Math.sin(i * 0.25) * 25 + Math.random() * 15,
    })),
  },
  {
    id: 'den',
    title: 'DEN',
    subtitle: '密度',
    unit: 'g/cm³',
    min: 1.8,
    max: 2.95,
    color: '#e65100',
    data: Array.from({ length: 80 }, (_, i) => ({
      depth: 2500 + i * 25,
      value: 2.3 + Math.sin(i * 0.18) * 0.25 + Math.random() * 0.15,
    })),
  },
  {
    id: 'por',
    title: 'NPHI',
    subtitle: '中子孔隙度',
    unit: '%',
    min: 0,
    max: 0.45,
    color: '#6a1b9a',
    data: Array.from({ length: 80 }, (_, i) => ({
      depth: 2500 + i * 25,
      value: 0.12 + Math.sin(i * 0.22) * 0.08 + Math.random() * 0.05,
    })),
  },
]

export type VizChartType = 'production' | 'welllog' | 'fractable'

// ── 曲线图（由勾选字段驱动，支持压裂施工/地质/工程/生产/测井多类参数叠加）──────
// 支持折线/阶梯切换、框选缩放、鼠标滚轮缩放
export function ProductionChart({ fields }: { fields: VizField[] }) {
  const total = SERIES_DATA.length
  const [stepped, setStepped] = useState(true)
  const [range, setRange] = useState<[number, number]>([0, total - 1])
  const [refLeft, setRefLeft] = useState<number | null>(null)
  const [refRight, setRefRight] = useState<number | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const zoomed = range[0] !== 0 || range[1] !== total - 1
  const data = SERIES_DATA.slice(range[0], range[1] + 1)
  const MIN_WIN = 4

  const zoomByFactor = useCallback((factor: number) => {
    setRange(([a, b]) => {
      const center = (a + b) / 2
      const half = ((b - a) / 2) * factor
      let na = Math.round(center - half)
      let nb = Math.round(center + half)
      na = Math.max(0, na)
      nb = Math.min(total - 1, nb)
      if (nb - na < MIN_WIN) return [a, b]
      return [na, nb]
    })
  }, [total])

  // 鼠标滚轮缩放（非被动监听以便阻止页面滚动）
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomByFactor(e.deltaY < 0 ? 0.82 : 1.22)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomByFactor])

  const commitZoom = () => {
    if (refLeft == null || refRight == null || refLeft === refRight) {
      setRefLeft(null); setRefRight(null); return
    }
    const a = Math.min(refLeft, refRight)
    const b = Math.max(refLeft, refRight)
    const absA = range[0] + a
    const absB = range[0] + b
    if (absB - absA >= 2) setRange([absA, absB])
    setRefLeft(null); setRefRight(null)
  }

  if (fields.length === 0) {
    return (
      <div className="prod-chart-wrap">
        <div className="prod-empty">
          <md-icon>show_chart</md-icon>
          <p className="prod-empty-title">请勾选要展示的字段</p>
          <span className="prod-empty-hint">在“压裂施工”分类勾选可查看压裂施工曲线，也支持叠加地质、工程、生产、测井等参数</span>
        </div>
      </div>
    )
  }

  // 按单位聚合生成 Y 轴，左右交替排布
  const units: string[] = []
  fields.forEach(f => { const u = f.unit || '数值'; if (!units.includes(u)) units.push(u) })
  const axisId = (u: string) => `axis-${units.indexOf(u)}`
  const unitColor = (u: string) => fields.find(f => (f.unit || '数值') === u)?.color ?? '#1565c0'
  const lineType = stepped ? 'stepAfter' : 'monotone'

  return (
    <div className="prod-chart-wrap">
      {/* 工具栏 */}
      <div className="fc-toolbar">
        <div className="fc-toolbar-left">
          <span className="viz-label">图形样式：</span>
          <div className="fc-segment" role="group" aria-label="曲线样式切换">
            <button
              className={`fc-seg-btn${!stepped ? ' fc-seg-btn--active' : ''}`}
              onClick={() => setStepped(false)}
              aria-pressed={!stepped}
            >
              <md-icon>show_chart</md-icon>折线
            </button>
            <button
              className={`fc-seg-btn${stepped ? ' fc-seg-btn--active' : ''}`}
              onClick={() => setStepped(true)}
              aria-pressed={stepped}
            >
              <md-icon>stairs</md-icon>阶梯
            </button>
          </div>
        </div>
        <div className="fc-toolbar-right">
          <span className="fc-hint">滚轮或框选可缩放</span>
          <button className="viz-tool-btn" title="放大" onClick={() => zoomByFactor(0.7)}><md-icon>zoom_in</md-icon></button>
          <button className="viz-tool-btn" title="缩小" onClick={() => zoomByFactor(1.4)}><md-icon>zoom_out</md-icon></button>
          <button className="viz-tool-btn" title="重置缩放" onClick={() => setRange([0, total - 1])} disabled={!zoomed}>
            <md-icon>restart_alt</md-icon>
          </button>
        </div>
      </div>

      {/* 图表 */}
      <div className="prod-chart-body" ref={bodyRef}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            onMouseDown={(e) => { const i = e?.activeTooltipIndex; if (i != null) setRefLeft(Number(i)) }}
            onMouseMove={(e) => { const i = e?.activeTooltipIndex; if (refLeft != null && i != null) setRefRight(Number(i)) }}
            onMouseUp={commitZoom}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface-variant)' }}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 8))}
            />
            {units.map((u, i) => {
              const isLeft = i % 2 === 0
              return (
                <YAxis
                  key={u}
                  yAxisId={axisId(u)}
                  orientation={isLeft ? 'left' : 'right'}
                  width={56}
                  tick={{ fontSize: 11, fill: unitColor(u) }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: u,
                    angle: isLeft ? -90 : 90,
                    position: isLeft ? 'insideLeft' : 'insideRight',
                    fontSize: 11,
                    fill: unitColor(u),
                  }}
                />
              )
            })}
            <Tooltip
              contentStyle={{
                fontSize: 12,
                background: 'var(--md-sys-color-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: 8,
              }}
              labelStyle={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} iconType="circle" iconSize={8} />
            {fields.map(f => (
              <Line
                key={f.id}
                yAxisId={axisId(f.unit || '数值')}
                type={lineType}
                dataKey={f.id}
                name={f.unit ? `${f.name} (${f.unit})` : f.name}
                stroke={f.color}
                dot={false}
                strokeWidth={1.5}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            {refLeft != null && refRight != null && data[refLeft] && data[refRight] && (
              <ReferenceArea
                yAxisId={axisId(fields[0].unit || '数值')}
                x1={data[refLeft].date as string}
                x2={data[refRight].date as string}
                fill="#1565c0"
                fillOpacity={0.12}
                strokeOpacity={0.3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Well Log Chart ────────────────────────────────────────────────────────────
export function WellLogChart({ well, onWellChange }: { well: string; onWellChange: (w: string) => void }) {
  const depths = LOG_TRACKS[0].data.map(d => d.depth)
  const minDepth = depths[0]
  const maxDepth = depths[depths.length - 1]
  const CHART_H = 600
  const depthToY = (depth: number) =>
    ((depth - minDepth) / (maxDepth - minDepth)) * CHART_H

  const trackPoints = (track: typeof LOG_TRACKS[0], trackW: number) =>
    track.data.map(pt => {
      const x = ((pt.value - Math.min(track.min, track.max)) / Math.abs(track.max - track.min)) * trackW
      const y = depthToY(pt.depth)
      return `${Math.max(0, Math.min(trackW, x))},${y}`
    }).join(' ')

  const TRACK_W = 90

  return (
    <div className="welllog-wrap">
      {/* 顶部控制栏 */}
      <div className="welllog-toolbar">
        <div className="welllog-toolbar-left">
          <span className="viz-label">井名：</span>
          <select className="viz-select" value={well} onChange={e => onWellChange(e.target.value)}>
            {WELL_LIST.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
          <span className="viz-label">绘图范围：</span>
          <select className="viz-select">
            <option>全井段</option>
            <option>2500-3500m</option>
            <option>3500-4500m</option>
          </select>
          <span className="viz-label">比例尺：</span>
          <select className="viz-select" defaultValue="1:2000">
            <option>1:500</option>
            <option>1:1000</option>
            <option>1:2000</option>
          </select>
        </div>
        <div className="welllog-toolbar-right">
          <span className="viz-label">模板：</span>
          <select className="viz-select">
            <option>默认模板</option>
            <option>综合解释</option>
          </select>
        </div>
      </div>

      {/* 剖面主体：深度轴 + 道 */}
      <div className="welllog-body">
        {/* 深度轴 */}
        <div className="welllog-depth-col">
          <div className="welllog-depth-header">
            <span>深度</span>
            <span className="welllog-depth-unit">(m)</span>
          </div>
          <div className="welllog-depth-scale" style={{ height: CHART_H }}>
            <svg width="100%" height={CHART_H}>
              {depths.filter((_, i) => i % 4 === 0).map(d => (
                <g key={d}>
                  <line x1="60%" y1={depthToY(d)} x2="100%" y2={depthToY(d)}
                    stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.5" />
                  <text x="55%" y={depthToY(d) + 4} textAnchor="end"
                    fontSize="10" fill="var(--md-sys-color-on-surface-variant)">{d}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* 曲线道 */}
        {LOG_TRACKS.map(track => (
          <div key={track.id} className="welllog-track">
            {/* 道头 */}
            <div className="welllog-track-header" style={{ borderTop: `3px solid ${track.color}` }}>
              <div className="welllog-track-name">{track.title}</div>
              <div className="welllog-track-subtitle">{track.subtitle}</div>
              <div className="welllog-track-scale">
                <span>{track.min}</span>
                <span className="welllog-track-unit">{track.unit}</span>
                <span>{track.max}</span>
              </div>
            </div>
            {/* 道体 */}
            <div className="welllog-track-body" style={{ height: CHART_H }}>
              <svg width="100%" height={CHART_H} viewBox={`0 0 ${TRACK_W} ${CHART_H}`}
                preserveAspectRatio="none">
                {/* 格线 */}
                {[0.25, 0.5, 0.75].map(r => (
                  <line key={r} x1={r * TRACK_W} y1={0} x2={r * TRACK_W} y2={CHART_H}
                    stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.4" />
                ))}
                {depths.filter((_, i) => i % 4 === 0).map(d => (
                  <line key={d} x1={0} y1={depthToY(d)} x2={TRACK_W} y2={depthToY(d)}
                    stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.4" />
                ))}
                {/* 曲线 */}
                <polyline points={trackPoints(track, TRACK_W)}
                  fill="none" stroke={track.color} strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 通用数据表格（支持多种字段类别）────────────────────────────────────────────
type CellType = 'text' | 'num' | 'mono' | 'tag' | 'status'

interface TableColumn {
  key: string
  label: string
  unit?: string
  type?: CellType
  decimals?: number
  sticky?: boolean
}

interface StatusCell { label: string; level: 'normal' | 'warning' | 'alarm' }

interface SummaryItem { label: string; value: string | number; unit?: string; color?: string }

interface TableDataset {
  id: string
  name: string
  icon: string
  columns: TableColumn[]
  rows: Record<string, unknown>[]
  summary: SummaryItem[]
  hasStatus?: boolean
}

// 标签配色
const TAG_PALETTE = ['#1565c0', '#e65100', '#2e7d32', '#6a1b9a', '#00695c', '#c62828', '#4527a0', '#ad1457']
const TAG_FIXED: Record<string, string> = {
  前置液: '#1565c0', 携砂液: '#e65100', 顶替液: '#2e7d32',
  正常生产: '#2e7d32', 关井: '#e65100', 措施作业: '#6a1b9a',
  煤岩: '#4527a0', 泥岩: '#00695c', 砂岩: '#e65100', 灰岩: '#1565c0', 页岩: '#6a1b9a',
  三角洲: '#1565c0', 滨浅湖: '#00695c', 河道: '#e65100', 分流河道: '#2e7d32',
}
function tagColor(v: string): string {
  if (TAG_FIXED[v]) return TAG_FIXED[v]
  let h = 0
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) & 0x7fffffff
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

// ── 各类别数据生成 ──
function genFrac(): TableDataset {
  const stages = [
    { name: '前置液', minutes: 18, rate: 6.0, sr: 0 },
    { name: '携砂液', minutes: 46, rate: 6.5, sr: 8 },
    { name: '顶替液', minutes: 10, rate: 6.2, sr: 0 },
  ]
  const rng = makeRng(20260728)
  const start = new Date('2026-07-28T09:30:00')
  const rows: Record<string, unknown>[] = []
  let elapsed = 0, cumFluid = 0, cumSand = 0
  stages.forEach(stage => {
    for (let m = 0; m < stage.minutes; m += 2) {
      const t = new Date(start.getTime() + elapsed * 60000)
      const rate = +(stage.rate + (rng() - 0.5) * 0.6).toFixed(2)
      const ramp = stage.sr > 0 ? Math.min(1, m / (stage.minutes * 0.5)) : 0
      const sandRatio = +(stage.sr * (0.5 + ramp * 0.5) + (stage.sr > 0 ? (rng() - 0.5) * 1.2 : 0)).toFixed(1)
      const tubing = +(52 + ramp * 8 + (rng() - 0.5) * 3).toFixed(1)
      const casing = +(tubing - 8 - rng() * 2).toFixed(1)
      const sandRate = +(rate * 1000 * (sandRatio / 100)).toFixed(0)
      cumFluid = +(cumFluid + rate * 2).toFixed(1)
      cumSand = +(cumSand + (sandRate * 2) / 1500).toFixed(2)
      const level: StatusCell['level'] = tubing > 58 ? 'alarm' : sandRatio > 7.5 ? 'warning' : 'normal'
      const status: StatusCell = { level, label: level === 'alarm' ? '压力超限' : level === 'warning' ? '砂比偏高' : '正常' }
      rows.push({ time: t.toTimeString().slice(0, 8), elapsed, rate, tubing, casing, sandRatio, sandRate, cumFluid, cumSand, stage: stage.name, status })
      elapsed += 2
    }
  })
  const nums = rows.map(r => r as { tubing: number; sandRatio: number; rate: number; status: StatusCell })
  return {
    id: 'frac', name: '施工曲线', icon: 'timeline', hasStatus: true,
    columns: [
      { key: 'time', label: '施工时间', type: 'mono', sticky: true },
      { key: 'elapsed', label: '时长', unit: 'min', type: 'num' },
      { key: 'rate', label: '施工排量', unit: 'm³/min', type: 'num', decimals: 2 },
      { key: 'tubing', label: '油压', unit: 'MPa', type: 'num', decimals: 1 },
      { key: 'casing', label: '套压', unit: 'MPa', type: 'num', decimals: 1 },
      { key: 'sandRatio', label: '砂比', unit: '%', type: 'num', decimals: 1 },
      { key: 'sandRate', label: '瞬时砂量', unit: 'kg/min', type: 'num' },
      { key: 'cumFluid', label: '累计液量', unit: 'm³', type: 'num', decimals: 1 },
      { key: 'cumSand', label: '累计砂量', unit: 'm³', type: 'num', decimals: 2 },
      { key: 'stage', label: '���工阶段', type: 'tag' },
      { key: 'status', label: '状态', type: 'status' },
    ],
    rows,
    summary: [
      { label: '累计液量', value: (rows[rows.length - 1] as { cumFluid: number }).cumFluid, unit: 'm³' },
      { label: '累计砂量', value: (rows[rows.length - 1] as { cumSand: number }).cumSand, unit: 'm³' },
      { label: '平均排量', value: +(nums.reduce((s, r) => s + r.rate, 0) / nums.length).toFixed(2), unit: 'm³/min' },
      { label: '最高油压', value: Math.max(...nums.map(r => r.tubing)), unit: 'MPa', color: '#c62828' },
      { label: '最高砂比', value: Math.max(...nums.map(r => r.sandRatio)), unit: '%', color: '#e65100' },
      { label: '异常点', value: nums.filter(r => r.status.level !== 'normal').length, unit: '个', color: '#c62828' },
    ],
  }
}

function genProduction(): TableDataset {
  const rng = makeRng(11002026)
  const base = new Date('2026-01-01')
  const rows: Record<string, unknown>[] = []
  let cumGas = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date(base); d.setDate(d.getDate() + i)
    const shutIn = i % 21 === 0
    const measure = i % 30 === 15
    const gas = shutIn ? +(1.5 + rng()).toFixed(2) : +(3.2 + (rng() - 0.5) * 0.8).toFixed(2)
    const water = shutIn ? +(rng() * 2).toFixed(1) : +(8 + (rng() - 0.5) * 3).toFixed(1)
    const oilP = shutIn ? +(12 + rng() * 2).toFixed(1) : +(20 + (rng() - 0.5) * 3).toFixed(1)
    const casP = +(oilP + 2 + rng() * 2).toFixed(1)
    cumGas = +(cumGas + gas).toFixed(2)
    rows.push({
      date: `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`,
      gas, water, oilP, casP, cumGas,
      state: shutIn ? '关井' : measure ? '措施作业' : '正常生产',
    })
  }
  const gasArr = rows.map(r => (r as { gas: number }).gas)
  return {
    id: 'production', name: '生产数据', icon: 'oil_barrel',
    columns: [
      { key: 'date', label: '日期', type: 'mono', sticky: true },
      { key: 'gas', label: '日产气量', unit: '万m³', type: 'num', decimals: 2 },
      { key: 'water', label: '日产水量', unit: 'm³', type: 'num', decimals: 1 },
      { key: 'oilP', label: '油压', unit: 'MPa', type: 'num', decimals: 1 },
      { key: 'casP', label: '套压', unit: 'MPa', type: 'num', decimals: 1 },
      { key: 'cumGas', label: '累计产气量', unit: '万m³', type: 'num', decimals: 2 },
      { key: 'state', label: '生产状态', type: 'tag' },
    ],
    rows,
    summary: [
      { label: '生产天数', value: rows.length, unit: '天' },
      { label: '累计产气', value: (rows[rows.length - 1] as { cumGas: number }).cumGas, unit: '万m³', color: '#1565c0' },
      { label: '平均日产气', value: +(gasArr.reduce((s, v) => s + v, 0) / gasArr.length).toFixed(2), unit: '万m³' },
      { label: '峰值日产气', value: Math.max(...gasArr), unit: '万m³', color: '#2e7d32' },
      { label: '关井天数', value: rows.filter(r => (r as { state: string }).state === '关井').length, unit: '天', color: '#e65100' },
    ],
  }
}

function genLogging(): TableDataset {
  const rng = makeRng(30302026)
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < 80; i++) {
    const depth = +(2500 + i * 2.5).toFixed(1)
    const gr = +(40 + Math.sin(i * 0.3) * 30 + rng() * 20).toFixed(1)
    const rt = +Math.max(0.5, 10 + Math.sin(i * 0.2) * 80 + rng() * 40).toFixed(1)
    const ac = +(90 + Math.sin(i * 0.25) * 25 + rng() * 15).toFixed(1)
    const den = +(2.3 + Math.sin(i * 0.18) * 0.25 + rng() * 0.1).toFixed(2)
    const nphi = +((0.12 + Math.sin(i * 0.22) * 0.08 + rng() * 0.04) * 100).toFixed(1)
    const por = +((0.18 - (den - 2.3) * 0.3 + rng() * 0.02) * 100).toFixed(1)
    rows.push({ depth, gr, rt, ac, den, nphi, por })
  }
  const porArr = rows.map(r => (r as { por: number }).por)
  return {
    id: 'logging', name: '测井数据', icon: 'sensors',
    columns: [
      { key: 'depth', label: '深度', unit: 'm', type: 'mono', sticky: true, decimals: 1 },
      { key: 'gr', label: '自然伽马', unit: 'API', type: 'num', decimals: 1 },
      { key: 'rt', label: '深侧向电阻率', unit: 'Ω·m', type: 'num', decimals: 1 },
      { key: 'ac', label: '声波时差', unit: 'μs/ft', type: 'num', decimals: 1 },
      { key: 'den', label: '密度', unit: 'g/cm³', type: 'num', decimals: 2 },
      { key: 'nphi', label: '中子孔隙度', unit: '%', type: 'num', decimals: 1 },
      { key: 'por', label: '计算孔隙度', unit: '%', type: 'num', decimals: 1 },
    ],
    rows,
    summary: [
      { label: '采样点数', value: rows.length, unit: '点' },
      { label: '深度范围', value: `${rows[0] ? (rows[0] as { depth: number }).depth : 0}~${(rows[rows.length - 1] as { depth: number }).depth}`, unit: 'm' },
      { label: '平均孔隙度', value: +(porArr.reduce((s, v) => s + v, 0) / porArr.length).toFixed(1), unit: '%', color: '#1565c0' },
      { label: '最大孔隙度', value: Math.max(...porArr), unit: '%', color: '#2e7d32' },
    ],
  }
}

function genCore(): TableDataset {
  const rng = makeRng(40402026)
  const liths = ['煤岩', '泥岩', '砂岩', '灰岩']
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < 24; i++) {
    const depth = +(2540 + i * 3.2 + rng() * 1.5).toFixed(2)
    const por = +(4 + rng() * 14).toFixed(2)
    const perm = +(0.01 + rng() * rng() * 12).toFixed(3)
    const gasContent = +(6 + rng() * 18).toFixed(2)
    const grainDen = +(2.5 + rng() * 0.35).toFixed(2)
    rows.push({ sample: `LGPC1-${String(i + 1).padStart(2, '0')}`, depth, por, perm, gasContent, grainDen, lith: liths[Math.floor(rng() * liths.length)] })
  }
  const porArr = rows.map(r => (r as { por: number }).por)
  const gasArr = rows.map(r => (r as { gasContent: number }).gasContent)
  return {
    id: 'core', name: '岩心实验', icon: 'science',
    columns: [
      { key: 'sample', label: '样品编号', type: 'mono', sticky: true },
      { key: 'depth', label: '取心深度', unit: 'm', type: 'num', decimals: 2 },
      { key: 'por', label: '孔隙度', unit: '%', type: 'num', decimals: 2 },
      { key: 'perm', label: '渗透率', unit: 'mD', type: 'num', decimals: 3 },
      { key: 'gasContent', label: '含气量', unit: 'm³/t', type: 'num', decimals: 2 },
      { key: 'grainDen', label: '颗粒密度', unit: 'g/cm³', type: 'num', decimals: 2 },
      { key: 'lith', label: '岩性', type: 'tag' },
    ],
    rows,
    summary: [
      { label: '样品数', value: rows.length, unit: '个' },
      { label: '平均孔隙度', value: +(porArr.reduce((s, v) => s + v, 0) / porArr.length).toFixed(2), unit: '%', color: '#1565c0' },
      { label: '平均含气量', value: +(gasArr.reduce((s, v) => s + v, 0) / gasArr.length).toFixed(2), unit: 'm³/t', color: '#2e7d32' },
      { label: '最大含气量', value: Math.max(...gasArr), unit: 'm³/t', color: '#e65100' },
    ],
  }
}

function genStrata(): TableDataset {
  const raw = [
    { name: 'T2z', top: 502, bottom: 690, desc: '灰色泥岩夹薄层砂岩', facies: '滨浅湖' },
    { name: 'T1h', top: 690, bottom: 925, desc: '深灰色泥岩、粉砂岩互层', facies: '三角洲' },
    { name: 'T1l', top: 925, bottom: 1200, desc: '灰黑色页岩夹煤线', facies: '分流河道' },
    { name: 'C2b', top: 1200, bottom: 1685, desc: '煤岩、碳质泥岩', facies: '河道' },
    { name: 'C1t', top: 1685, bottom: 2110, desc: '灰色砂岩夹泥岩', facies: '三角洲' },
    { name: 'O2', top: 2110, bottom: 2540, desc: '浅灰色灰岩', facies: '滨浅湖' },
  ]
  const rows = raw.map(r => ({ name: r.name, top: r.top, bottom: r.bottom, thick: +(r.bottom - r.top).toFixed(1), desc: r.desc, facies: r.facies }))
  const thickArr = rows.map(r => r.thick)
  return {
    id: 'strata', name: '地层分层', icon: 'layers',
    columns: [
      { key: 'name', label: '层位', type: 'mono', sticky: true },
      { key: 'top', label: '顶深', unit: 'm', type: 'num', decimals: 1 },
      { key: 'bottom', label: '底深', unit: 'm', type: 'num', decimals: 1 },
      { key: 'thick', label: '厚度', unit: 'm', type: 'num', decimals: 1 },
      { key: 'desc', label: '岩性简述', type: 'text' },
      { key: 'facies', label: '沉积相', type: 'tag' },
    ],
    rows,
    summary: [
      { label: '分层数', value: rows.length, unit: '层' },
      { label: '解释总厚', value: +thickArr.reduce((s, v) => s + v, 0).toFixed(1), unit: 'm', color: '#1565c0' },
      { label: '最厚层段', value: Math.max(...thickArr), unit: 'm', color: '#2e7d32' },
      { label: '顶/底深', value: `${rows[0].top}~${rows[rows.length - 1].bottom}`, unit: 'm' },
    ],
  }
}

const TABLE_DATASETS: TableDataset[] = [genFrac(), genProduction(), genLogging(), genCore(), genStrata()]

function fmtNum(v: unknown, decimals?: number): string {
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return String(v ?? '—')
  return decimals != null ? n.toFixed(decimals) : String(n)
}

export function DataTable({ well, onWellChange }: { well: string; onWellChange: (w: string) => void }) {
  const [datasetId, setDatasetId] = useState<string>('frac')
  const [onlyAbnormal, setOnlyAbnormal] = useState(false)

  const ds = TABLE_DATASETS.find(d => d.id === datasetId) ?? TABLE_DATASETS[0]
  const rows = ds.hasStatus && onlyAbnormal
    ? ds.rows.filter(r => (r.status as StatusCell)?.level !== 'normal')
    : ds.rows

  return (
    <div className="frac-table-wrap">
      {/* 工具栏 */}
      <div className="frac-toolbar">
        <div className="frac-toolbar-left">
          <span className="viz-label">数据类别：</span>
          <select className="viz-select" value={datasetId} onChange={e => { setDatasetId(e.target.value); setOnlyAbnormal(false) }}>
            {TABLE_DATASETS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <span className="viz-label">井名：</span>
          <select className="viz-select" value={well} onChange={e => onWellChange(e.target.value)}>
            {WELL_LIST.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
          {ds.hasStatus && (
            <label className="frac-check-label">
              <input type="checkbox" className="field-tree-checkbox" checked={onlyAbnormal}
                onChange={e => setOnlyAbnormal(e.target.checked)} />
              仅看异常
            </label>
          )}
        </div>
        <div className="frac-toolbar-right">
          <span className="frac-count">共 {rows.length} 条</span>
        </div>
      </div>

      {/* 汇总指标 */}
      <div className="frac-summary">
        {ds.summary.map((s, i) => (
          <div className="frac-summary-item" key={i}>
            <span className="frac-summary-label">{s.label}</span>
            <span className="frac-summary-value" style={s.color ? { color: s.color } : undefined}>
              {s.value} {s.unit && <em>{s.unit}</em>}
            </span>
          </div>
        ))}
      </div>

      {/* 表格 */}
      <div className="frac-table-scroll">
        <table className="frac-table">
          <thead>
            <tr>
              {ds.columns.map(c => (
                <th key={c.key} className={`frac-th${c.sticky ? ' frac-th--sticky' : ''}`}>
                  {c.label}{c.unit && <><br /><span className="frac-th-unit">{c.unit}</span></>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const level = (r.status as StatusCell)?.level
              return (
                <tr key={i} className={`frac-tr${level ? ` frac-tr--${level}` : ''}`}>
                  {ds.columns.map(c => {
                    const v = r[c.key]
                    if (c.type === 'tag') {
                      const val = String(v)
                      return <td key={c.key} className="frac-td"><span className="frac-stage-tag" style={{ color: tagColor(val), background: `${tagColor(val)}1a` }}>{val}</span></td>
                    }
                    if (c.type === 'status') {
                      const st = v as StatusCell
                      return <td key={c.key} className="frac-td"><span className={`frac-status frac-status--${st.level}`}>{st.label}</span></td>
                    }
                    if (c.type === 'num') {
                      const alarmCol = level === 'alarm' && c.key === 'tubing'
                      const warnCol = level === 'warning' && c.key === 'sandRatio'
                      return <td key={c.key} className="frac-td frac-td--num" style={alarmCol ? { color: '#c62828', fontWeight: 700 } : warnCol ? { color: '#e65100', fontWeight: 700 } : undefined}>{fmtNum(v, c.decimals)}</td>
                    }
                    if (c.type === 'mono') return <td key={c.key} className={`frac-td frac-td--mono${c.sticky ? ' frac-td--sticky' : ''}`}>{c.decimals != null ? fmtNum(v, c.decimals) : String(v)}</td>
                    return <td key={c.key} className={`frac-td${c.sticky ? ' frac-td--sticky' : ''}`}>{String(v)}</td>
                  })}
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={ds.columns.length} className="frac-empty">无符合条件的数据记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 可嵌入的数据可视化面板（曲线图 / 测井剖面图 / 数据表格）──────────────────────────
// 默认展示曲线图的压裂施工曲线，供四类质检工作台复用

export function QcVisualization() {
  const [activeChart, setActiveChart] = useState<VizChartType>('production')
  const [categories, setCategories] = useState<VizFieldCategory[]>(DEFAULT_CATEGORIES)
  const [selectedWell, setSelectedWell] = useState(WELL_LIST[0].name)
  const [fieldsOpen, setFieldsOpen] = useState(true)

  const toggleField = (catId: string, fieldId: string) => {
    setCategories(prev => prev.map(c =>
      c.id !== catId ? c : { ...c, fields: c.fields.map(f => f.id !== fieldId ? f : { ...f, checked: !f.checked }) }
    ))
  }
  const toggleCatAll = (catId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      const allChecked = c.fields.every(f => f.checked)
      return { ...c, fields: c.fields.map(f => ({ ...f, checked: !allChecked })) }
    }))
  }

  const checkedFields = categories.flatMap(c => c.fields.filter(f => f.checked))

  const TABS: { key: VizChartType; label: string; icon: string }[] = [
    { key: 'production', label: '曲线图', icon: 'show_chart' },
    { key: 'welllog', label: '测井剖面图', icon: 'ssid_chart' },
    { key: 'fractable', label: '数据表格', icon: 'table_chart' },
  ]

  return (
    <section className="qcv-card" aria-label="数据可视化">
      <div className="qcv-head">
        <div className="qcv-head-title">
          <md-icon>insights</md-icon>
          <span>数据可视化</span>
        </div>
        <div className="qcv-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeChart === t.key}
              className={`qcv-tab${activeChart === t.key ? ' qcv-tab--active' : ''}`}
              onClick={() => setActiveChart(t.key)}
            >
              <md-icon>{t.icon}</md-icon>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="qcv-body">
        {activeChart === 'production' ? (
          <div className="qcv-layout">
            <aside className={`qcv-fields${fieldsOpen ? '' : ' qcv-fields--collapsed'}`} aria-label="字段选择">
              <div className="qcv-fields-head">
                <button className="qcv-fields-toggle" onClick={() => setFieldsOpen(v => !v)}
                  aria-label={fieldsOpen ? '��起字段列表' : '展开字段列表'} title={fieldsOpen ? '收起' : '展开'}>
                  <md-icon>{fieldsOpen ? 'chevron_left' : 'chevron_right'}</md-icon>
                </button>
                {fieldsOpen && <span className="qcv-fields-title">字段（已选 {checkedFields.length}）</span>}
              </div>
              {fieldsOpen && (
                <div className="qcv-fields-body">
                  {categories.map(cat => {
                    const allChecked = cat.fields.every(f => f.checked)
                    const someChecked = !allChecked && cat.fields.some(f => f.checked)
                    return (
                      <div key={cat.id} className="qcv-fcat">
                        <label className="qcv-fcat-label">
                          <input type="checkbox" checked={allChecked}
                            ref={el => { if (el) el.indeterminate = someChecked }}
                            onChange={() => toggleCatAll(cat.id)}
                            aria-label={`选择 ${cat.name} 下所有字段`} />
                          <md-icon>{cat.icon}</md-icon>
                          <span className="qcv-fcat-name">{cat.name}</span>
                        </label>
                        <ul className="qcv-flist">
                          {cat.fields.map(f => (
                            <li key={f.id}>
                              <label className="qcv-fitem">
                                <input type="checkbox" checked={f.checked}
                                  onChange={() => toggleField(cat.id, f.id)}
                                  aria-label={`选择字段 ${f.name}`} />
                                <span className="qcv-fdot" style={{ background: f.color }} />
                                <span className="qcv-fname">{f.name}</span>
                                {f.unit && <span className="qcv-funit">{f.unit}</span>}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </aside>
            <div className="qcv-chart">
              <ProductionChart fields={checkedFields} />
            </div>
          </div>
        ) : activeChart === 'welllog' ? (
          <div className="qcv-chart qcv-chart--full">
            <WellLogChart well={selectedWell} onWellChange={setSelectedWell} />
          </div>
        ) : (
          <div className="qcv-chart qcv-chart--full">
            <DataTable well={selectedWell} onWellChange={setSelectedWell} />
          </div>
        )}
      </div>
    </section>
  )
}
