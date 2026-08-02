'use client'

import { useState, useRef, useEffect } from 'react'

export type QCWorkspaceType = 'consistency' | 'completeness' | 'distribution' | 'correlation'

interface ConsistencyWorkspaceProps {
  datasetName?: string
  onBack: () => void
  onSwitchTab: (tab: QCWorkspaceType) => void
}

// ─── Mock data ────────────────────────────────────────────
const WELLS = ['苏36-11井', '苏36-12井', '苏36-13井', '苏36-14井', '苏37-01井', '苏37-02井']

type AnomalyType = '单位异常' | '量纲异常' | '量级异常' | '口径异常'
type RecordStatus = '待处理' | '已转换' | '已忽略' | '待复核' | '已复核'

interface AnomalyRecord {
  id: string
  well: string
  field: string
  sampleValue: string
  originalUnit: string
  standardUnit: string
  dimension: string
  dimensionResult: '正常' | '异常'
  magnitudeResult: '正常' | '异常'
  anomalyType: AnomalyType
  status: RecordStatus
  reviewRequired: boolean
}

const MOCK_RECORDS: AnomalyRecord[] = [
  { id: 'r1', well: '苏36-11井', field: '孔隙度', sampleValue: '0.156', originalUnit: '%', standardUnit: '%', dimension: '无量纲', dimensionResult: '正常', magnitudeResult: '正常', anomalyType: '单位异常', status: '已转换', reviewRequired: false },
  { id: 'r2', well: '苏36-12井', field: '渗透率', sampleValue: '0.0023', originalUnit: 'μm²', standardUnit: 'mD', dimension: '面积', dimensionResult: '正常', magnitudeResult: '异常', anomalyType: '量级异常', status: '待复核', reviewRequired: true },
  { id: 'r3', well: '苏36-13井', field: '日产气量', sampleValue: '12500', originalUnit: 'm³/d', standardUnit: '10⁴m³/d', dimension: '体积/时间', dimensionResult: '正常', magnitudeResult: '异常', anomalyType: '量级异常', status: '待处理', reviewRequired: false },
  { id: 'r4', well: '苏36-14井', field: '加砂量', sampleValue: '85.2', originalUnit: 'kg', standardUnit: 'm³', dimension: '质量', dimensionResult: '异常', magnitudeResult: '正常', anomalyType: '量纲异常', status: '待处理', reviewRequired: true },
  { id: 'r5', well: '苏37-01井', field: '气油比', sampleValue: '3400', originalUnit: 'm³/m³', standardUnit: 'm³/m³', dimension: '无量纲', dimensionResult: '正常', magnitudeResult: '异常', anomalyType: '量级异常', status: '已忽略', reviewRequired: false },
  { id: 'r6', well: '苏37-02井', field: '油层厚度', sampleValue: '0.012', originalUnit: 'km', standardUnit: 'm', dimension: '长度', dimensionResult: '正常', magnitudeResult: '异常', anomalyType: '量级异常', status: '待处理', reviewRequired: false },
  { id: 'r7', well: '苏36-11井', field: '渗透率', sampleValue: '23.5', originalUnit: 'mD', standardUnit: 'mD', dimension: '面积', dimensionResult: '正常', magnitudeResult: '正常', anomalyType: '口径异常', status: '已复核', reviewRequired: false },
  { id: 'r8', well: '苏36-12井', field: '加砂量', sampleValue: '1200', originalUnit: 'm³', standardUnit: 'm³', dimension: '体积', dimensionResult: '正常', magnitudeResult: '正常', anomalyType: '口径异常', status: '待复核', reviewRequired: true },
]

// 每个字段的多井时序对比数据
const SERIES_DATA: Record<string, { well: string; values: number[]; unit: string; color: string }[]> = {
  孔隙度: [
    { well: '苏36-11井', values: [15.2, 15.6, 15.8, 16.1, 15.9, 16.3, 16.0, 15.7], unit: '%', color: '#1565c0' },
    { well: '苏36-12井', values: [14.8, 15.0, 0.148, 0.151, 14.7, 15.2, 0.153, 15.1], unit: '%', color: '#d32f2f' }, // 量级异常
    { well: '苏36-13井', values: [16.5, 16.8, 17.0, 16.7, 16.9, 17.2, 17.1, 16.8], unit: '%', color: '#2e7d32' },
  ],
  渗透率: [
    { well: '苏36-11井', values: [0.23, 0.25, 0.21, 0.28, 0.24, 0.26, 0.22, 0.27], unit: 'mD', color: '#1565c0' },
    { well: '苏36-12井', values: [0.0023, 0.0025, 0.24, 0.0022, 0.0028, 0.0021, 0.25, 0.0024], unit: 'mD', color: '#d32f2f' },
    { well: '苏36-13井', values: [0.31, 0.33, 0.29, 0.35, 0.32, 0.34, 0.30, 0.33], unit: 'mD', color: '#2e7d32' },
  ],
}

const FIELDS = ['孔隙度', '渗透率', '加砂量', '日产气量', '气油比', '油层厚度']

const ANOMALY_TYPES: AnomalyType[] = ['单位异常', '量纲异常', '量级异常', '口径异常']
const STATUS_LIST: RecordStatus[] = ['待处理', '已转换', '已忽略', '待复核', '已复核']

const TAB_LABELS: { key: QCWorkspaceType; label: string }[] = [
  { key: 'consistency', label: '一致性校验' },
  { key: 'completeness', label: '完整性校验' },
  { key: 'distribution', label: '分布范围校验' },
  { key: 'correlation', label: '相关性校验' },
]

// ─── 多井时序对比 SVG 迷你图 ─────────────────────────────
function MultiWellChart({ field }: { field: string }) {
  const series = SERIES_DATA[field] ?? SERIES_DATA['孔隙度']
  const allVals = series.flatMap(s => s.values)
  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const range = maxV - minV || 1
  const W = 560
  const H = 120
  const padL = 8
  const padR = 8
  const padT = 10
  const padB = 8
  const n = series[0].values.length
  const stepX = (W - padL - padR) / (n - 1)

  const toX = (i: number) => padL + i * stepX
  const toY = (v: number) => padT + (1 - (v - minV) / range) * (H - padT - padB)

  const isAnomalous = (s: typeof series[0]) =>
    s.values.some((v, i) => i > 0 && Math.abs(v / s.values[i - 1] - 1) > 5)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label={`${field} 多井时序对比图`} style={{ display: 'block' }}>
      {/* 网格横线 */}
      {[0.25, 0.5, 0.75].map(r => (
        <line key={r} x1={padL} y1={padT + r * (H - padT - padB)} x2={W - padR} y2={padT + r * (H - padT - padB)}
          stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.6" strokeDasharray="3,2" />
      ))}
      {series.map(s => {
        const pts = s.values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
        const anomalous = isAnomalous(s)
        return (
          <g key={s.well}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={anomalous ? 1.5 : 1.5}
              strokeDasharray={anomalous ? '4,3' : undefined} opacity={0.85} />
            {s.values.map((v, i) => {
              const isOutlier = i > 0 && Math.abs(v / s.values[i - 1] - 1) > 5
              return isOutlier ? (
                <circle key={i} cx={toX(i)} cy={toY(v)} r={4} fill="#d32f2f" stroke="#fff" strokeWidth="1">
                  <title>{`${s.well} 第${i + 1}点: ${v}${s.unit} (量级异常)`}</title>
                </circle>
              ) : (
                <circle key={i} cx={toX(i)} cy={toY(v)} r={2} fill={s.color} opacity={0.6}>
                  <title>{`${s.well}: ${v}${s.unit}`}</title>
                </circle>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

// ─── 单位转换计算器弹窗 ──────────────────────────────────
function ConverterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fromUnit, setFromUnit] = useState('km')
  const [toUnit, setToUnit] = useState('m')
  const [sampleVal, setSampleVal] = useState('0.012')

  const calcResult = () => {
    const conversions: Record<string, Record<string, number>> = {
      km: { m: 1000, cm: 100000 },
      m: { km: 0.001, cm: 100 },
      '%': { '小数': 0.01 },
      '小数': { '%': 100 },
      'μm²': { mD: 1013.25 },
      mD: { 'μm²': 0.000986923 },
    }
    const factor = conversions[fromUnit]?.[toUnit]
    if (!factor) return '—'
    return (parseFloat(sampleVal) * factor).toFixed(4)
  }

  if (!open) return null
  return (
    <div className="cs-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cs-dialog cs-dialog--sm">
        <div className="cs-dialog-header">
          <span className="md-typescale-title-medium">单位与量级转换计算器</span>
          <button className="cs-icon-btn" onClick={onClose} aria-label="关闭"><md-icon>close</md-icon></button>
        </div>
        <div className="cs-dialog-body" style={{ gap: 14 }}>
          <div className="cs-form-row">
            <label className="cs-form-label">原始单位</label>
            <select className="cs-select" value={fromUnit} onChange={e => setFromUnit(e.target.value)}>
              {['km', 'm', 'cm', '%', '小数', 'μm²', 'mD', 'kg', 'm³', 'm³/d', '10⁴m³/d'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="cs-form-row">
            <label className="cs-form-label">目标单位</label>
            <select className="cs-select" value={toUnit} onChange={e => setToUnit(e.target.value)}>
              {['m', 'km', 'cm', '%', '小数', 'μm²', 'mD', 'kg', 'm³', 'm³/d', '10⁴m³/d'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="cs-form-row">
            <label className="cs-form-label">样本值</label>
            <input className="cs-input" value={sampleVal} onChange={e => setSampleVal(e.target.value)} type="number" step="any" />
          </div>
          <div className="cs-converter-result">
            <span className="cs-converter-label">转换结果</span>
            <span className="cs-converter-value">{calcResult()} <span className="cs-converter-unit">{toUnit}</span></span>
          </div>
          <div className="cs-converter-hint">
            <md-icon style={{ fontSize: 14 }}>info</md-icon>
            换算关系仅供参考，批量处理前请确认字段标准。
          </div>
        </div>
        <div className="cs-dialog-footer">
          <button className="cs-btn cs-btn--ghost" onClick={onClose}>关闭</button>
          <button className="cs-btn cs-btn--primary">应用到当前字段</button>
        </div>
      </div>
    </div>
  )
}

// ─── 批量处理弹窗 ────────────────────────────────────────
function BatchProcessDialog({ open, onClose, records, onConfirm }: {
  open: boolean
  onClose: () => void
  records: AnomalyRecord[]
  onConfirm: (action: string) => void
}) {
  const [action, setAction] = useState<'convert' | 'ignore' | 'review'>('convert')
  if (!open) return null
  return (
    <div className="cs-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cs-dialog">
        <div className="cs-dialog-header">
          <span className="md-typescale-title-medium">批量处理 ({records.length} 条)</span>
          <button className="cs-icon-btn" onClick={onClose} aria-label="关闭"><md-icon>close</md-icon></button>
        </div>
        <div className="cs-dialog-body">
          <div className="cs-batch-records-preview">
            {records.slice(0, 4).map(r => (
              <div key={r.id} className="cs-batch-record-row">
                <span className="cs-badge cs-badge--well">{r.well.slice(0, 5)}</span>
                <span>{r.field}</span>
                <span className="cs-val">{r.sampleValue} {r.originalUnit}</span>
                <span className="cs-arrow">→</span>
                <span className="cs-unit">{r.standardUnit}</span>
              </div>
            ))}
            {records.length > 4 && (
              <div className="cs-batch-more">... 还有 {records.length - 4} 条</div>
            )}
          </div>
          <div className="cs-form-section-title">处理方式</div>
          <div className="cs-action-radios">
            {[
              { val: 'convert', label: '单位转换', icon: 'swap_horiz', desc: '按标准换算关系批量转换至目标单位' },
              { val: 'ignore', label: '标记忽略', icon: 'visibility_off', desc: '保留原值，不影响评分，记录操作日志' },
              { val: 'review', label: '提交复核', icon: 'rate_review', desc: '移入专家复核队列，等待人工确认' },
            ].map(opt => (
              <label key={opt.val} className={`cs-action-radio${action === opt.val ? ' cs-action-radio--active' : ''}`}>
                <input type="radio" name="batch-action" value={opt.val} checked={action === opt.val}
                  onChange={() => setAction(opt.val as typeof action)} style={{ display: 'none' }} />
                <md-icon style={{ fontSize: 18 }}>{opt.icon}</md-icon>
                <div>
                  <div className="cs-action-radio-label">{opt.label}</div>
                  <div className="cs-action-radio-desc">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="cs-dialog-footer">
          <button className="cs-btn cs-btn--ghost" onClick={onClose}>取消</button>
          <button className="cs-btn cs-btn--primary" onClick={() => { onConfirm(action); onClose() }}>确认执行</button>
        </div>
      </div>
    </div>
  )
}

// ─── 主组件 ──────────────────────────────────────────────
export function ConsistencyWorkspace({ datasetName = '苏里格区块2024年综合数据集', onBack, onSwitchTab }: ConsistencyWorkspaceProps) {
  const [selectedWells, setSelectedWells] = useState<string[]>(['苏36-11井', '苏36-12井', '苏36-13井'])
  const [wellPickerOpen, setWellPickerOpen] = useState(false)
  const [activeField, setActiveField] = useState('孔隙度')
  const [filterAnomalyType, setFilterAnomalyType] = useState<AnomalyType | '全部'>('全部')
  const [filterStatus, setFilterStatus] = useState<RecordStatus | '全部'>('全部')
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set())
  const [records, setRecords] = useState<AnomalyRecord[]>(MOCK_RECORDS)
  const [converterOpen, setConverterOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [saveDone, setSaveDone] = useState(false)
  const wellPickerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭井选择下拉
  useEffect(() => {
    if (!wellPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (wellPickerRef.current && !wellPickerRef.current.contains(e.target as Node)) {
        setWellPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [wellPickerOpen])

  // 汇总指标
  const unitAnomaly = records.filter(r => r.anomalyType === '单位异常').length
  const dimAnomaly = records.filter(r => r.anomalyType === '量纲异常').length
  const magAnomaly = records.filter(r => r.anomalyType === '量级异常').length
  const pendingReview = records.filter(r => r.status === '待复核').length
  const pending = records.filter(r => r.status === '待处理').length

  // 筛选后明细
  const filteredRecords = records.filter(r => {
    const aMatch = filterAnomalyType === '全部' || r.anomalyType === filterAnomalyType
    const sMatch = filterStatus === '全部' || r.status === filterStatus
    return aMatch && sMatch
  })

  const toggleSelect = (id: string) => {
    setSelectedRecordIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selectedRecordIds.size === filteredRecords.length) {
      setSelectedRecordIds(new Set())
    } else {
      setSelectedRecordIds(new Set(filteredRecords.map(r => r.id)))
    }
  }

  const handleBatchConfirm = (action: string) => {
    const map: Record<string, RecordStatus> = { convert: '已转换', ignore: '已忽略', review: '待复核' }
    setRecords(prev => prev.map(r =>
      selectedRecordIds.has(r.id) ? { ...r, status: map[action] as RecordStatus } : r
    ))
    setSelectedRecordIds(new Set())
  }

  const selectedCount = selectedRecordIds.size
  const selectedRecords = filteredRecords.filter(r => selectedRecordIds.has(r.id))

  return (
    <div className="cs-workspace">
      {/* ── 顶部上下文栏 ── */}
      <div className="cs-topbar">
        <div className="cs-topbar-left">
          <button className="cs-back-btn" onClick={onBack} aria-label="返回数据质检总览">
            <md-icon>arrow_back</md-icon>
            数据质检总览
          </button>
          <span className="cs-topbar-sep">/</span>
          <div className="cs-topbar-dataset">
            <md-icon style={{ fontSize: 14 }}>dataset</md-icon>
            <span className="cs-topbar-dataset-name">{datasetName}</span>
            <span className="cs-topbar-version">v3.2</span>
          </div>
        </div>
        {/* 四类质检快速切换 */}
        <nav className="cs-tab-switch" aria-label="质检类型切换">
          {TAB_LABELS.map(t => (
            <button
              key={t.key}
              className={`cs-tab-btn${t.key === 'consistency' ? ' cs-tab-btn--active' : ''}`}
              onClick={() => onSwitchTab(t.key)}
              aria-current={t.key === 'consistency' ? 'page' : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── 范围与筛选工具栏 ── */}
      <div className="cs-toolbar">
        <div className="cs-toolbar-left">
        </div>

        <div className="cs-toolbar-right">
          {/* 异常类型筛选 */}
          <select className="cs-filter-select" value={filterAnomalyType}
            onChange={e => setFilterAnomalyType(e.target.value as typeof filterAnomalyType)}>
            <option value="全部">全部异常</option>
            {ANOMALY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          {/* 状态筛选 */}
          <select className="cs-filter-select" value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}>
            <option value="全部">全部状态</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>

        </div>
      </div>

      {/* ── 主体滚动区 ── */}
      <div className="cs-body">

        {/* ── 概览指标带 ── */}
        <div className="cs-metrics-band">
          <div className="cs-metric-item cs-metric-item--score">
            <span className="cs-metric-score">88</span>
            <span className="cs-metric-label">一致性得分</span>
          </div>
          <div className="cs-metric-divider" />
          <div className="cs-metric-item">
            <span className="cs-metric-value">{unitAnomaly}</span>
            <span className="cs-metric-label">单位异常</span>
          </div>
          <div className="cs-metric-item cs-metric-item--warn">
            <span className="cs-metric-value">{dimAnomaly}</span>
            <span className="cs-metric-label">量纲异常</span>
          </div>
          <div className="cs-metric-item cs-metric-item--warn">
            <span className="cs-metric-value">{magAnomaly}</span>
            <span className="cs-metric-label">量级异常</span>
          </div>
          <div className="cs-metric-item cs-metric-item--review">
            <span className="cs-metric-value">{pendingReview}</span>
            <span className="cs-metric-label">待复核</span>
          </div>
          <div className="cs-metric-item">
            <span className="cs-metric-value">{pending}</span>
            <span className="cs-metric-label">待处理</span>
          </div>

        </div>

        {/* ── 图件分析区 ── */}
        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title">
              <md-icon style={{ fontSize: 16 }}>show_chart</md-icon>
              多井字段时序对比
            </div>
            <div className="cs-section-header-right">
              <span className="cs-chart-field-label">当前字段：</span>
              <span className="cs-chart-field-name">{activeField}</span>
              <div className="cs-chart-legend">
                {(SERIES_DATA[activeField] ?? SERIES_DATA['孔隙度']).map(s => (
                  <span key={s.well} className="cs-legend-item">
                    <span className="cs-legend-dot" style={{ background: s.color }} />
                    {s.well.slice(0, 5)}
                  </span>
                ))}
                <span className="cs-legend-item cs-legend-item--anomaly">
                  <span className="cs-legend-dot cs-legend-dot--anomaly" />
                  量级异常点
                </span>
              </div>
            </div>
          </div>
          <div className="cs-chart-wrap">
            <MultiWellChart field={activeField} />
          </div>
          <div className="cs-chart-note">
            <md-icon style={{ fontSize: 13 }}>info</md-icon>
            虚线表示数据存在量级跳变；红色圆点为自动识别异常位置，可在下方明细中处理。
          </div>
        </section>

        {/* ─��� 结果明细区 ── */}
        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title">
              <md-icon style={{ fontSize: 16 }}>table_rows</md-icon>
              异常明细
              <span className="cs-count-chip">{filteredRecords.length}</span>
            </div>
            {selectedCount > 0 && (
              <div className="cs-batch-bar">
                <span className="cs-batch-selected md-typescale-label-small">已选 {selectedCount} 条</span>
                <button className="cs-btn cs-btn--sm cs-btn--ghost" onClick={() => setBatchOpen(true)}>
                  <md-icon style={{ fontSize: 14 }}>edit_note</md-icon>
                  批量处理
                </button>
                <button className="cs-btn cs-btn--sm cs-btn--ghost" onClick={() => setReviewPanelOpen(true)}>
                  <md-icon style={{ fontSize: 14 }}>rate_review</md-icon>
                  提交复核
                </button>
                <button className="cs-icon-btn" onClick={() => setSelectedRecordIds(new Set())} title="取消选择">
                  <md-icon>close</md-icon>
                </button>
              </div>
            )}
          </div>

          <div className="cs-table-wrap">
            <table className="cs-table" aria-label="一致性异常明细表">
              <thead>
                <tr>
                  <th className="cs-th cs-th--check">
                    <input type="checkbox" aria-label="全选"
                      checked={selectedCount === filteredRecords.length && filteredRecords.length > 0}
                      onChange={toggleSelectAll} />
                  </th>
                  <th className="cs-th">井名</th>
                  <th className="cs-th">字段</th>
                  <th className="cs-th">样本值</th>
                  <th className="cs-th">原始单位</th>
                  <th className="cs-th">标准单位</th>
                  <th className="cs-th">量纲结果</th>
                  <th className="cs-th">量级结果</th>
                  <th className="cs-th">异常类型</th>
                  <th className="cs-th">处理状态</th>
                  <th className="cs-th cs-th--action">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.id} className={`cs-tr${selectedRecordIds.has(r.id) ? ' cs-tr--selected' : ''}`}
                    onClick={() => toggleSelect(r.id)}>
                    <td className="cs-td cs-td--check" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRecordIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)} aria-label={`选择 ${r.well} ${r.field}`} />
                    </td>
                    <td className="cs-td">
                      <span className="cs-well-name">{r.well}</span>
                    </td>
                    <td className="cs-td cs-td--field">{r.field}</td>
                    <td className="cs-td cs-td--mono">{r.sampleValue}</td>
                    <td className="cs-td">
                      <span className={`cs-unit-chip${r.originalUnit !== r.standardUnit ? ' cs-unit-chip--diff' : ''}`}>
                        {r.originalUnit}
                      </span>
                    </td>
                    <td className="cs-td">
                      <span className="cs-unit-chip cs-unit-chip--std">{r.standardUnit}</span>
                    </td>
                    <td className="cs-td">
                      <ResultPill value={r.dimensionResult} />
                    </td>
                    <td className="cs-td">
                      <ResultPill value={r.magnitudeResult} />
                    </td>
                    <td className="cs-td">
                      <AnomalyBadge type={r.anomalyType} />
                    </td>
                    <td className="cs-td">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="cs-td cs-td--action" onClick={e => e.stopPropagation()}>
                      <div className="cs-row-actions">
                        <button className="cs-row-btn" title="单位转换" onClick={() => setConverterOpen(true)}>
                          <md-icon>swap_horiz</md-icon>
                        </button>
                        <button className="cs-row-btn" title="标记忽略"
                          onClick={() => setRecords(prev => prev.map(x => x.id === r.id ? { ...x, status: '已忽略' } : x))}>
                          <md-icon>visibility_off</md-icon>
                        </button>
                        {r.reviewRequired && (
                          <button className="cs-row-btn cs-row-btn--review" title="提交复核">
                            <md-icon>rate_review</md-icon>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={11} className="cs-td-empty">
                      <md-icon>check_circle</md-icon>
                      当前筛选条件下无异常记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>


      </div>

      {/* 工具弹窗 */}
      <ConverterDialog open={converterOpen} onClose={() => setConverterOpen(false)} />
      <BatchProcessDialog open={batchOpen} onClose={() => setBatchOpen(false)}
        records={selectedRecords} onConfirm={handleBatchConfirm} />

      {/* 专家复核侧边抽屉 */}
      <div className={`cs-review-drawer${reviewPanelOpen ? ' cs-review-drawer--open' : ''}`} role="dialog" aria-label="专家复核">
        <div className="cs-drawer-header">
          <span className="md-typescale-title-small">专家复核</span>
          <button className="cs-icon-btn" onClick={() => setReviewPanelOpen(false)} aria-label="关闭复核面板"><md-icon>close</md-icon></button>
        </div>
        <div className="cs-drawer-body">
          <div className="cs-drawer-hint md-typescale-body-small">
            以下记录需要专家确认。处理结论将写入质检结果并记录操作人与时间。
          </div>
          {records.filter(r => r.status === '待复核' || r.reviewRequired).map(r => (
            <div key={r.id} className="cs-review-item">
              <div className="cs-review-item-header">
                <span className="cs-well-name">{r.well}</span>
                <span className="cs-review-field">{r.field}</span>
                <AnomalyBadge type={r.anomalyType} />
              </div>
              <div className="cs-review-item-detail">
                {r.sampleValue} {r.originalUnit} → 标准单位 {r.standardUnit}
              </div>
              <div className="cs-review-actions">
                {['确认处理', '驳回处理', '保留原值'].map(label => (
                  <button key={label} className="cs-review-btn"
                    onClick={() => setRecords(prev => prev.map(x => x.id === r.id ? { ...x, status: '已复核', reviewRequired: false } : x))}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {records.filter(r => r.status === '待复核' || r.reviewRequired).length === 0 && (
            <div className="cs-drawer-empty">
              <md-icon style={{ fontSize: 36, opacity: 0.3 }}>check_circle</md-icon>
              <span>暂无待复核记录</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 小型展示组件 ���────────────────────────────────────────
function ResultPill({ value }: { value: '正常' | '异常' }) {
  return (
    <span className={`cs-result-pill cs-result-pill--${value === '正常' ? 'ok' : 'err'}`}>
      <md-icon style={{ fontSize: 11 }}>{value === '正常' ? 'check' : 'warning'}</md-icon>
      {value}
    </span>
  )
}

function AnomalyBadge({ type }: { type: AnomalyType }) {
  const map: Record<AnomalyType, string> = {
    '单位异常': 'cs-badge--unit',
    '量纲异常': 'cs-badge--dim',
    '量级异常': 'cs-badge--mag',
    '口径异常': 'cs-badge--cal',
  }
  return <span className={`cs-badge ${map[type]}`}>{type}</span>
}

function StatusBadge({ status }: { status: RecordStatus }) {
  const map: Record<RecordStatus, string> = {
    '待处理': 'cs-status--pending',
    '已转换': 'cs-status--done',
    '已忽略': 'cs-status--ignored',
    '待复核': 'cs-status--review',
    '已复核': 'cs-status--reviewed',
  }
  return <span className={`cs-status ${map[status]}`}>{status}</span>
}
