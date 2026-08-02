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

type VizChartType = 'production' | 'welllog' | 'fractable'

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
      {/* ── 数据集列表面板（与数据质检总览完全一致）── */}
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
              {activeChart === 'welllog' || activeChart === 'fractable' ? (
                <span className="ft-well-count">单选</span>
              ) : (
                <span className="ft-well-count">{selectedWells.size}/{WELL_LIST.length}</span>
              )}
            </div>
            {!wellCollapsed && (
              <div className="ft-well-body">
                {activeChart === 'production' && (
                  <div className="ft-well-actions">
                    <button className="field-tree-action-btn" onClick={() => setSelectedWells(new Set(WELL_LIST.map(w => w.id)))}>全选</button>
                    <button className="field-tree-action-btn" onClick={() => setSelectedWells(new Set())}>清空</button>
                  </div>
                )}
                <ul className="ft-well-list">
                  {WELL_LIST.map(w => {
                    if (activeChart === 'welllog' || activeChart === 'fractable') {
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
            <button
              className={`viz-tab${activeChart === 'fractable' ? ' viz-tab--active' : ''}`}
              onClick={() => setActiveChart('fractable')}
            >
              <md-icon>table_chart</md-icon>
              数据表格
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
          {activeChart === 'fractable' && (
            <DataTable well={selectedWell} onWellChange={setSelectedWell} />
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

// 确定性随机，保证每次渲染数据一致
function makeRng(seed: number) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 1000) / 1000 }
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
      { key: 'stage', label: '施工阶段', type: 'tag' },
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

function DataTable({ well, onWellChange }: { well: string; onWellChange: (w: string) => void }) {
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
