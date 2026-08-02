'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { DatasetList, MOCK_DATASETS, type Dataset } from './dataset-list'

const WELL_LIST = [
  { id: 'w1', name: '苏36-11井' },
  { id: 'w2', name: '苏36-12井' },
  { id: 'w3', name: '苏36-13井' },
  { id: 'w4', name: '苏36-14井' },
  { id: 'w5', name: '苏37-01井' },
  { id: 'w6', name: '苏37-02井' },
  { id: 'w7', name: '苏14-25井' },
]

interface VizField {
  id: string
  name: string
  unit?: string
  checked: boolean
  color: string
}

interface VizFieldCategory {
  id: string
  name: string
  icon: string
  fields: VizField[]
}

const DEFAULT_CATEGORIES: VizFieldCategory[] = [
  {
    id: 'geology',
    name: '地质参数',
    icon: 'terrain',
    fields: [
      { id: 'porosity', name: '孔隙度', unit: '%', checked: true, color: '#1565c0' },
      { id: 'permeability', name: '渗透率', unit: 'mD', checked: true, color: '#2e7d32' },
      { id: 'reservoir_thick', name: '油层厚度', unit: 'm', checked: false, color: '#e65100' },
      { id: 'saturation', name: '含气饱和度', unit: '%', checked: true, color: '#6a1b9a' },
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
      { id: 'daily_gas', name: '日产气量', unit: '万m³', checked: true, color: '#1565c0' },
      { id: 'daily_water', name: '日产水量', unit: 'm³', checked: true, color: '#2e7d32' },
      { id: 'oil_pressure', name: '油压', unit: 'MPa', checked: true, color: '#c62828' },
      { id: 'casing_pressure', name: '套压', unit: 'MPa', checked: true, color: '#e65100' },
      { id: 'cum_gas', name: '累计产气量', unit: '万m³', checked: false, color: '#6a1b9a' },
    ],
  },
  {
    id: 'logging',
    name: '测井参数',
    icon: 'sensors',
    fields: [
      { id: 'gr', name: '自然伽马', unit: 'API', checked: true, color: '#c62828' },
      { id: 'sp', name: '自然电位', unit: 'mV', checked: false, color: '#1565c0' },
      { id: 'rt', name: '深侧向电阻率', unit: 'Ω·m', checked: true, color: '#2e7d32' },
      { id: 'ac', name: '声波时差', unit: 'μs/ft', checked: true, color: '#e65100' },
      { id: 'den', name: '密度', unit: 'g/cm³', checked: false, color: '#6a1b9a' },
      { id: 'cn', name: '中子', unit: '%', checked: false, color: '#00695c' },
    ],
  },
]

// ── Production curve mock data ────────────────────────────────────────────────
function genProductionData() {
  const data = []
  const base = new Date('2020-04-01')
  for (let i = 0; i < 120; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    const noise = () => (Math.random() - 0.5) * 6
    const isShutIn = i % 18 === 0
    data.push({
      date: `${d.getMonth() + 1}月${d.getDate()}日`,
      日产气: isShutIn ? 2 : Math.max(0, 30 + noise() * 2),
      日产水: isShutIn ? 0 : Math.max(0, 8 + noise()),
      油压: isShutIn ? 12 : Math.max(0, 42 + noise()),
      套压: isShutIn ? 14 : Math.max(0, 44 + noise()),
    })
  }
  return data
}
const PRODUCTION_DATA = genProductionData()

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

// ── Component ─────────────────────────────────────────────────────────────────

type VizChartType = 'production' | 'welllog'

interface VisualizationPageProps {
  onBack?: () => void
}

export function VisualizationPage({ onBack }: VisualizationPageProps) {
  // Left panels
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS)
  const [datasetCollapsed, setDatasetCollapsed] = useState(false)
  const [fieldCollapsed, setFieldCollapsed] = useState(false)
  const [selectedDatasetId, setSelectedDatasetId] = useState('1')
  const [selectedWells, setSelectedWells] = useState<Set<string>>(new Set(['w1', 'w2']))
  const [wellCollapsed, setWellCollapsed] = useState(false)
  const [fieldSearch, setFieldSearch] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['production', 'logging']))
  const [categories, setCategories] = useState<VizFieldCategory[]>(DEFAULT_CATEGORIES)

  // Tabs
  const [activeChart, setActiveChart] = useState<VizChartType>('production')

  // Welllog controls
  const [selectedWell, setSelectedWell] = useState('苏36-11井')

  const toggleWell = (id: string) => {
    setSelectedWells(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleField = (catId: string, fieldId: string) => {
    setCategories(prev => prev.map(c =>
      c.id !== catId ? c : {
        ...c,
        fields: c.fields.map(f => f.id !== fieldId ? f : { ...f, checked: !f.checked })
      }
    ))
  }

  const toggleCatAll = (catId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      const allChecked = c.fields.every(f => f.checked)
      return { ...c, fields: c.fields.map(f => ({ ...f, checked: !allChecked })) }
    }))
  }

  // 测井剖面图只显示测井参数类别
  const visibleCats = activeChart === 'welllog'
    ? categories.filter(c => c.id === 'logging')
    : categories

  const filteredCats = visibleCats.map(cat => ({
    ...cat,
    fields: cat.fields.filter(f =>
      !fieldSearch || f.name.includes(fieldSearch) || (f.unit ?? '').includes(fieldSearch)
    )
  })).filter(cat => !fieldSearch || cat.fields.length > 0)

  const checkedFields = categories.flatMap(c => c.fields.filter(f => f.checked))

  return (
    <div className="viz-page">
      {/* ── 数据集列表面板（与数据质控总览完全一致）── */}
      <DatasetList
        datasets={datasets}
        onDatasetsChange={setDatasets}
        selectedId={selectedDatasetId}
        onSelect={setSelectedDatasetId}
        collapsed={datasetCollapsed}
        onToggleCollapse={() => setDatasetCollapsed(v => !v)}
      />

      {/* ── 字段列表面板（无基本信息）── */}
      {fieldCollapsed ? (
        <aside className="panel-section panel-section--collapsed" aria-label="字段列表（已折叠）">
          <div className="panel-collapsed-rail">
            <md-icon-button aria-label="展开字段列表" onClick={() => setFieldCollapsed(false)}>
              <md-icon>chevron_right</md-icon>
            </md-icon-button>
            <div className="panel-collapsed-label" aria-hidden="true">
              <md-icon>list_alt</md-icon>
              <span className="panel-collapsed-text">字段</span>
            </div>
          </div>
        </aside>
      ) : (
        <aside className="panel-section field-tree-panel" aria-label="字段列表">
          <div className="panel-header">
            <span className="md-typescale-label-large panel-title">字段列表</span>
            <div className="panel-header-actions">
              <md-icon-button aria-label="收起" onClick={() => setFieldCollapsed(true)}>
                <md-icon>chevron_left</md-icon>
              </md-icon-button>
            </div>
          </div>

          {/* 井列表 */}
          <div className="ft-well-section">
            <div
              className="ft-well-header"
              role="button"
              aria-expanded={!wellCollapsed}
              onClick={() => setWellCollapsed(v => !v)}
            >
              <md-icon class="ft-well-header-icon">
                {wellCollapsed ? 'chevron_right' : 'expand_more'}
              </md-icon>
              <md-icon class="ft-well-section-icon">water_drop</md-icon>
              <span className="ft-well-header-title">井列表</span>
              {activeChart === 'welllog' ? (
                <span className="ft-well-count">单选</span>
              ) : (
                <span className="ft-well-count">{selectedWells.size}/{WELL_LIST.length}</span>
              )}
            </div>
            {!wellCollapsed && (
              <div className="ft-well-body">
                {activeChart !== 'welllog' && (
                  <div className="ft-well-actions">
                    <button className="field-tree-action-btn" onClick={() => setSelectedWells(new Set(WELL_LIST.map(w => w.id)))}>全选</button>
                    <button className="field-tree-action-btn" onClick={() => setSelectedWells(new Set())}>清空</button>
                  </div>
                )}
                <ul className="ft-well-list">
                  {WELL_LIST.map(w => {
                    if (activeChart === 'welllog') {
                      const isSelected = selectedWell === w.name
                      return (
                        <li key={w.id} className={`ft-well-item${isSelected ? ' ft-well-item--checked' : ''}`}>
                          <label className="ft-well-item-label">
                            <input
                              type="radio"
                              name="welllog-well"
                              className="field-tree-checkbox"
                              checked={isSelected}
                              onChange={() => setSelectedWell(w.name)}
                              aria-label={`选择 ${w.name}`}
                            />
                            <md-icon class="ft-well-icon">oil_barrel</md-icon>
                            <span className="ft-well-name">{w.name}</span>
                          </label>
                        </li>
                      )
                    }
                    const checked = selectedWells.has(w.id)
                    return (
                      <li key={w.id} className={`ft-well-item${checked ? ' ft-well-item--checked' : ''}`}>
                        <label className="ft-well-item-label">
                          <input type="checkbox" className="field-tree-checkbox" checked={checked}
                            onChange={() => toggleWell(w.id)} aria-label={`选择 ${w.name}`} />
                          <md-icon class="ft-well-icon">oil_barrel</md-icon>
                          <span className="ft-well-name">{w.name}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="ft-divider" />

          {/* 字段计数 + 搜索 */}
          <div className="field-tree-stat">
            <span className="md-typescale-label-small field-tree-stat-text">
              已选 <strong>{checkedFields.length}</strong> 个字段
            </span>
          </div>
          <div className="dataset-list-search">
            <div className="search-input-wrap">
              <md-icon class="search-icon">search</md-icon>
              <input type="search" className="search-input md-typescale-body-small"
                placeholder="搜索字段..." value={fieldSearch}
                onChange={e => setFieldSearch(e.target.value)} aria-label="搜索字段" />
            </div>
          </div>

          {/* 字段树（无基本信息类别）*/}
          <div className="field-tree-body" role="tree">
            {filteredCats.map(cat => {
              const catIds = cat.fields.map(f => f.id)
              const checkedCount = catIds.filter(id => categories.find(c => c.fields.find(f => f.id === id && f.checked))).length
              const allChecked = cat.fields.every(f => f.checked) && cat.fields.length > 0
              const someChecked = !allChecked && cat.fields.some(f => f.checked)
              const isExpanded = expandedCats.has(cat.id)
              return (
                <div key={cat.id} className="field-tree-category" role="treeitem" aria-expanded={isExpanded}>
                  <div className="field-tree-cat-row">
                    <button className="field-tree-expand-btn"
                      aria-label={isExpanded ? `收起 ${cat.name}` : `展开 ${cat.name}`}
                      onClick={() => toggleCat(cat.id)}>
                      <md-icon class="field-tree-expand-icon">
                        {isExpanded ? 'expand_more' : 'chevron_right'}
                      </md-icon>
                    </button>
                    <label className="field-tree-cat-label">
                      <input type="checkbox" className="field-tree-checkbox"
                        checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked }}
                        onChange={() => toggleCatAll(cat.id)}
                        aria-label={`选择 ${cat.name} 下所有字段`} />
                      <md-icon class="field-cat-icon">{cat.icon}</md-icon>
                      <span className="md-typescale-label-medium field-cat-name">{cat.name}</span>
                      <span className="md-typescale-label-small field-cat-count">
                        {checkedCount}/{cat.fields.length}
                      </span>
                    </label>
                  </div>
                  {isExpanded && (
                    <ul className="field-tree-fields" role="group">
                      {cat.fields.map(field => (
                        <li key={field.id} className="field-tree-field-row" role="treeitem">
                          <label className="field-tree-field-label">
                            <input type="checkbox" className="field-tree-checkbox"
                              checked={field.checked}
                              onChange={() => toggleField(cat.id, field.id)}
                              aria-label={`选择字段 ${field.name}`} />
                            <span className="viz-field-dot" style={{ background: field.color }} />
                            <span className="md-typescale-body-small field-name">{field.name}</span>
                            {field.unit && (
                              <span className="md-typescale-label-small field-unit">{field.unit}</span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </aside>
      )}

      {/* ── 可视化主区域 ── */}
      <main className="viz-main" id="main-content">
        {/* 标签页 */}
        <div className="viz-tabs-bar">
          <div className="viz-tabs">
            <button
              className={`viz-tab${activeChart === 'production' ? ' viz-tab--active' : ''}`}
              onClick={() => setActiveChart('production')}
            >
              <md-icon>show_chart</md-icon>
              曲线图
            </button>
            <button
              className={`viz-tab${activeChart === 'welllog' ? ' viz-tab--active' : ''}`}
              onClick={() => setActiveChart('welllog')}
            >
              <md-icon>ssid_chart</md-icon>
              测井剖面图
            </button>
          </div>
          <div className="viz-tabs-actions">
            <button className="viz-tool-btn" title="全屏"><md-icon>fullscreen</md-icon></button>
            <button className="viz-tool-btn" title="截图"><md-icon>photo_camera</md-icon></button>
            <button className="viz-tool-btn" title="导出数据"><md-icon>download</md-icon></button>
          </div>
        </div>

        {/* 图表区 */}
        <div className="viz-chart-area">
          {activeChart === 'production' && (
            <ProductionChart fields={checkedFields} />
          )}
          {activeChart === 'welllog' && (
            <WellLogChart well={selectedWell} onWellChange={setSelectedWell} />
          )}
        </div>
      </main>
    </div>
  )
}

// ── Production Chart ──────────────────────────────────────────────────────────

const PROD_FIELD_CONFIG: Record<string, { color: string; yAxis: string; unit: string }> = {
  日产气: { color: '#1565c0', yAxis: 'left1', unit: '万m³' },
  日产水: { color: '#2e7d32', yAxis: 'left1', unit: 'm³' },
  油压:   { color: '#c62828', yAxis: 'right1', unit: 'MPa' },
  套压:   { color: '#e65100', yAxis: 'right2', unit: 'MPa' },
}

function ProductionChart({ fields }: { fields: VizField[] }) {
  const [hoveredWell] = useState('焦页10-4HF')

  const activeKeys = ['日产气', '日产水', '油压', '套压']

  return (
    <div className="prod-chart-wrap">
      {/* 工具栏 */}

      {/* Recharts */}
      <div className="prod-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={PRODUCTION_DATA} margin={{ top: 8, right: 80, left: 20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface-variant)' }}
              tickLine={false}
              interval={14}
            />
            {/* Left Y axis - 产气 */}
            <YAxis
              yAxisId="left1"
              orientation="left"
              tick={{ fontSize: 11, fill: '#1565c0' }}
              tickLine={false}
              axisLine={false}
              label={{ value: '日产气 (万m³)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#1565c0', dx: -8 }}
            />
            {/* Right Y axis 1 - 油压 */}
            <YAxis
              yAxisId="right1"
              orientation="right"
              tick={{ fontSize: 11, fill: '#c62828' }}
              tickLine={false}
              axisLine={false}
              label={{ value: '油压 (MPa)', angle: 90, position: 'insideRight', fontSize: 11, fill: '#c62828', dx: 8 }}
            />
            {/* Right Y axis 2 - 日产水 */}
            <YAxis
              yAxisId="right2"
              orientation="right"
              tick={{ fontSize: 11, fill: '#2e7d32' }}
              tickLine={false}
              axisLine={false}
              width={60}
              label={{ value: '日产水 (m³)', angle: 90, position: 'insideRight', fontSize: 11, fill: '#2e7d32', dx: 24 }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                background: 'var(--md-sys-color-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: 8,
              }}
              labelStyle={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
              iconType="circle"
              iconSize={8}
            />
            <Line yAxisId="left1" type="monotone" dataKey="日产气" stroke="#1565c0" dot={false} strokeWidth={1.5} />
            <Line yAxisId="right2" type="monotone" dataKey="日产水" stroke="#2e7d32" dot={false} strokeWidth={1.5} />
            <Line yAxisId="right1" type="monotone" dataKey="油压" stroke="#c62828" dot={false} strokeWidth={1.5} />
            <Line yAxisId="right1" type="monotone" dataKey="套压" stroke="#e65100" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Well Log Chart ────────────────────────────────────────────────────────────

function WellLogChart({ well, onWellChange }: { well: string; onWellChange: (w: string) => void }) {
  const depths = LOG_TRACKS[0].data.map(d => d.depth)
  const minDepth = depths[0]
  const maxDepth = depths[depths.length - 1]
  const CHART_H = 600 // px height of the track area
  const HEADER_H = 72 // px header per track

  const depthToY = (depth: number) =>
    ((depth - minDepth) / (maxDepth - minDepth)) * CHART_H

  // Build SVG polyline points for each track
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
          <span className="viz-label">绘图范围：</span>
          <select className="viz-select">
            <option>全井段</option>
            <option>2500-3500m</option>
            <option>3500-4500m</option>
          </select>
          <span className="viz-label">比例尺：</span>
          <select className="viz-select">
            <option>1:500</option>
            <option>1:1000</option>
            <option selected>1:2000</option>
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
