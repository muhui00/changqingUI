'use client'

import { useState } from 'react'
import { QcVisualization } from './viz-charts'
import type { QCWorkspaceType } from './consistency-workspace'

interface DistributionWorkspaceProps {
  datasetName?: string
  onBack: () => void
  onSwitchTab: (tab: QCWorkspaceType) => void
}

const TAB_LABELS: { key: QCWorkspaceType; label: string }[] = [
  { key: 'consistency', label: '一致性校验' },
  { key: 'completeness', label: '完整性校验' },
  { key: 'distribution', label: '分布范围校验' },
  { key: 'correlation', label: '相关性校验' },
]

type HitMethod = 'IQR' | '3σ' | '孤立森林' | '物理边界' | '业务范围'
type DistStatus = '待处理' | '已确认极值' | '已修正' | '待复核'
type Risk = '提示' | '一般' | '严重'

interface DistRecord {
  id: string
  well: string
  field: string
  unit: string
  location: string
  value: number
  statRange: string
  bizRange: string
  physRange: string
  method: HitMethod
  score: number
  reason: string
  risk: Risk
  status: DistStatus
}

const MOCK: DistRecord[] = [
  { id: 'd1', well: '苏36-11井', field: '渗透率', unit: 'mD', location: '2456m', value: 152.3, statRange: '0.1–3.5', bizRange: '0.05–5', physRange: '0–1000', method: '3σ', score: 92, reason: '超出 3σ 上界，疑似量级异常', risk: '严重', status: '待处理' },
  { id: 'd2', well: '苏36-12井', field: '孔隙度', unit: '%', location: '2312m', value: -2.4, statRange: '8–18', bizRange: '5–25', physRange: '0–40', method: '物理边界', score: 100, reason: '低于物理下限 0，数据错误', risk: '严重', status: '待处理' },
  { id: 'd3', well: '苏36-13井', field: '日产气量', unit: '10⁴m³', location: '2026-04-02', value: 28.6, statRange: '2–8', bizRange: '1–15', physRange: '0–50', method: 'IQR', score: 78, reason: '超出 IQR 上边界，疑似真实高产', risk: '一般', status: '已确认极值' },
  { id: 'd4', well: '苏36-14井', field: '含气饱和度', unit: '%', location: '记录 88', value: 103.2, statRange: '45–75', bizRange: '30–90', physRange: '0–100', method: '物理边界', score: 100, reason: '超出物理上限 100%', risk: '严重', status: '已修正' },
  { id: 'd5', well: '苏37-01井', field: '砂比', unit: '%', location: '第 5 段', value: 42.0, statRange: '5–25', bizRange: '3–35', physRange: '0–60', method: '孤立森林', score: 85, reason: '孤立森林高异常分数', risk: '一般', status: '待复核' },
  { id: 'd6', well: '苏37-02井', field: '油压', unit: 'MPa', location: '2026-04-08', value: 18.5, statRange: '20–35', bizRange: '15–45', physRange: '0–70', method: 'IQR', score: 62, reason: '低于业务建议范围', risk: '提示', status: '待处理' },
]

// 箱线图分组数据（各井 min/q1/median/q3/max + 离群点）
const BOX_GROUPS = [
  { well: '苏36-11井', min: 0.15, q1: 0.42, med: 0.68, q3: 1.2, max: 2.8, outliers: [152.3] },
  { well: '苏36-12井', min: 0.2, q1: 0.5, med: 0.75, q3: 1.4, max: 3.1, outliers: [] },
  { well: '苏36-13井', min: 0.18, q1: 0.48, med: 0.7, q3: 1.3, max: 2.9, outliers: [8.2] },
  { well: '苏37-01井', min: 0.22, q1: 0.55, med: 0.8, q3: 1.5, max: 3.3, outliers: [] },
]

// 直方图分布数据
const HISTOGRAM = [2, 8, 22, 35, 28, 15, 6, 3, 1, 0, 0, 2]

const METHODS: HitMethod[] = ['IQR', '3σ', '孤立森林', '物理边界', '业务范围']
const STATUS_LIST: DistStatus[] = ['待处理', '已确认极值', '已修正', '待复核']

export function DistributionWorkspace({ datasetName = '苏里格区块2024年综合数据集', onBack, onSwitchTab }: DistributionWorkspaceProps) {
  const [records, setRecords] = useState<DistRecord[]>(MOCK)
  const [filterMethod, setFilterMethod] = useState<HitMethod | '全部'>('全部')
  const [filterStatus, setFilterStatus] = useState<DistStatus | '全部'>('全部')
  const [diagView, setDiagView] = useState<'box' | 'hist' | 'trend'>('box')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [procOpen, setProcOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<DistRecord | null>(null)

  const filtered = records.filter(r =>
    (filterMethod === '全部' || r.method === filterMethod) &&
    (filterStatus === '全部' || r.status === filterStatus))

  const inRange = 96.2
  const anomalyPts = records.length
  const physCross = records.filter(r => r.method === '物理边界').length
  const statOutlier = records.filter(r => r.method === 'IQR' || r.method === '3σ' || r.method === '孤立森林').length
  const severeWells = new Set(records.filter(r => r.risk === '严重').map(r => r.well)).size
  const pendingReview = records.filter(r => r.status === '待复核').length

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))
  const openProc = (r: DistRecord) => { setActiveRecord(r); setProcOpen(true) }

  return (
    <div className="cs-workspace">
      <div className="cs-topbar">
        <div className="cs-topbar-left">
          <button className="cs-back-btn" onClick={onBack} aria-label="返回数据质检总览"><md-icon>arrow_back</md-icon>数据质检总览</button>
          <span className="cs-topbar-sep">/</span>
          <div className="cs-topbar-dataset">
            <md-icon style={{ fontSize: 14 }}>dataset</md-icon>
            <span className="cs-topbar-dataset-name">{datasetName}</span>
            <span className="cs-topbar-version">v3.2</span>
          </div>
        </div>
        <nav className="cs-tab-switch" aria-label="质检类型切换">
          {TAB_LABELS.map(t => (
            <button key={t.key} className={`cs-tab-btn${t.key === 'distribution' ? ' cs-tab-btn--active' : ''}`}
              onClick={() => onSwitchTab(t.key)} aria-current={t.key === 'distribution' ? 'page' : undefined}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div className="cs-toolbar">
        <div className="cs-toolbar-left" />
        <div className="cs-toolbar-right">
          <select className="cs-filter-select" value={filterMethod} onChange={e => setFilterMethod(e.target.value as typeof filterMethod)}>
            <option value="全部">全部命中方法</option>
            {METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select className="cs-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}>
            <option value="全部">全部状态</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="cs-body">
        <div className="cs-metrics-band">
          <div className="cs-metric-item cs-metric-item--score">
            <span className="cs-metric-score">{inRange}%</span>
            <span className="cs-metric-label">范围内占比</span>
          </div>
          <div className="cs-metric-divider" />
          <div className="cs-metric-item"><span className="cs-metric-value">{anomalyPts}</span><span className="cs-metric-label">异常点数</span></div>
          <div className="cs-metric-item cs-metric-item--warn"><span className="cs-metric-value">{physCross}</span><span className="cs-metric-label">物理越界</span></div>
          <div className="cs-metric-item cs-metric-item--warn"><span className="cs-metric-value">{statOutlier}</span><span className="cs-metric-label">统计离群</span></div>
          <div className="cs-metric-item"><span className="cs-metric-value">{severeWells}</span><span className="cs-metric-label">严重异常井</span></div>
          <div className="cs-metric-item cs-metric-item--review"><span className="cs-metric-value">{pendingReview}</span><span className="cs-metric-label">待复核</span></div>
        </div>

        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title"><md-icon style={{ fontSize: 16 }}>insights</md-icon>范围诊断</div>
            <div className="cs-diag-switch">
              <button className={`cs-diag-tab${diagView === 'box' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('box')}>箱线/散点</button>
              <button className={`cs-diag-tab${diagView === 'hist' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('hist')}>直方/密度</button>
              <button className={`cs-diag-tab${diagView === 'trend' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('trend')}>时序/深度趋势</button>
            </div>
          </div>
          <div className="cs-chart-wrap">
            {diagView === 'box' && <BoxPlot />}
            {diagView === 'hist' && <Histogram />}
            {diagView === 'trend' && <TrendChart />}
          </div>
          <div className="cs-boundary-legend">
            <span className="cs-legend-item"><span className="cs-boundary-line cs-boundary-line--stat" />统计边界 (IQR/3σ)</span>
            <span className="cs-legend-item"><span className="cs-boundary-line cs-boundary-line--biz" />业务建议范围</span>
            <span className="cs-legend-item"><span className="cs-boundary-line cs-boundary-line--phys" />物理硬边界</span>
            <span className="cs-legend-item cs-legend-item--anomaly"><span className="cs-legend-dot cs-legend-dot--anomaly" style={{ borderRadius: '50%', height: 8, width: 8 }} />异常点</span>
          </div>
          <div className="cs-chart-note">
            <md-icon style={{ fontSize: 13 }}>info</md-icon>
            物理边界优先级最高；统计离群默认仅标记不自动改值，样本不足时停用依赖分布的算法。
          </div>
        </section>

        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title"><md-icon style={{ fontSize: 16 }}>table_rows</md-icon>范围异常明细<span className="cs-count-chip">{filtered.length}</span></div>
            {selected.size > 0 && (
              <div className="cs-batch-bar">
                <span className="cs-batch-selected md-typescale-label-small">已选 {selected.size} 条</span>
                <button className="cs-btn cs-btn--sm cs-btn--ghost"><md-icon style={{ fontSize: 14 }}>tune</md-icon>批量处理</button>
                <button className="cs-btn cs-btn--sm cs-btn--ghost"><md-icon style={{ fontSize: 14 }}>rate_review</md-icon>提交复核</button>
                <button className="cs-icon-btn" onClick={() => setSelected(new Set())} title="取消选择"><md-icon>close</md-icon></button>
              </div>
            )}
          </div>
          <div className="cs-table-wrap">
            <table className="cs-table" aria-label="范围异常明细表">
              <thead>
                <tr>
                  <th className="cs-th cs-th--check"><input type="checkbox" aria-label="全选" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th className="cs-th">井名</th>
                  <th className="cs-th">字段</th>
                  <th className="cs-th">位置</th>
                  <th className="cs-th">原始值</th>
                  <th className="cs-th">统计范围</th>
                  <th className="cs-th">业务范围</th>
                  <th className="cs-th">物理边界</th>
                  <th className="cs-th">命中方法</th>
                  <th className="cs-th">异常分数</th>
                  <th className="cs-th">风险</th>
                  <th className="cs-th">状态</th>
                  <th className="cs-th cs-th--action">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={`cs-tr${selected.has(r.id) ? ' cs-tr--selected' : ''}`} onClick={() => toggle(r.id)}>
                    <td className="cs-td cs-td--check" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`选择 ${r.well} ${r.field}`} /></td>
                    <td className="cs-td"><span className="cs-well-name">{r.well}</span></td>
                    <td className="cs-td cs-td--field">{r.field}</td>
                    <td className="cs-td cs-td--mono">{r.location}</td>
                    <td className="cs-td cs-td--mono"><b>{r.value}</b> {r.unit}</td>
                    <td className="cs-td cs-td--mono">{r.statRange}</td>
                    <td className="cs-td cs-td--mono">{r.bizRange}</td>
                    <td className="cs-td cs-td--mono">{r.physRange}</td>
                    <td className="cs-td"><span className="cs-method-tag">{r.method}</span></td>
                    <td className="cs-td"><ScoreBar score={r.score} /></td>
                    <td className="cs-td"><RiskBadge risk={r.risk} /></td>
                    <td className="cs-td"><DistStatusBadge status={r.status} /></td>
                    <td className="cs-td cs-td--action" onClick={e => e.stopPropagation()}>
                      <div className="cs-row-actions">
                        <button className="cs-row-btn" title="处理" onClick={() => openProc(r)}><md-icon>tune</md-icon></button>
                        <button className="cs-row-btn" title="确认真实极值" onClick={() => setRecords(p => p.map(x => x.id === r.id ? { ...x, status: '已确认极值' } : x))}><md-icon>verified</md-icon></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={13} className="cs-td-empty"><md-icon>check_circle</md-icon>当前筛选条件下无范围异常</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 数据可视化 ── */}
        <QcVisualization />
      </div>

      {/* 范围处理弹窗 */}
      {procOpen && activeRecord && (
        <div className="cs-overlay" onClick={e => { if (e.target === e.currentTarget) setProcOpen(false) }}>
          <div className="cs-dialog cs-dialog--lg">
            <div className="cs-dialog-header">
              <span className="md-typescale-title-medium">范围处理 · {activeRecord.well} / {activeRecord.field}</span>
              <button className="cs-icon-btn" onClick={() => setProcOpen(false)} aria-label="关闭"><md-icon>close</md-icon></button>
            </div>
            <div className="cs-dialog-body cs-dialog-body--grid">
              <div className="cs-comp-left">
                <div className="cs-form-section-title">边界与统计</div>
                <div className="cs-comp-preview">
                  <div className="cs-comp-preview-row"><span>命中方法</span><b>{activeRecord.method}</b></div>
                  <div className="cs-comp-preview-row"><span>统计范围</span><b>{activeRecord.statRange} {activeRecord.unit}</b></div>
                  <div className="cs-comp-preview-row"><span>业务范围</span><b>{activeRecord.bizRange} {activeRecord.unit}</b></div>
                  <div className="cs-comp-preview-row"><span>物理边界</span><b>{activeRecord.physRange} {activeRecord.unit}</b></div>
                  <div className="cs-comp-preview-row"><span>异常原因</span><b>{activeRecord.reason}</b></div>
                </div>
                <div className="cs-form-section-title" style={{ marginTop: 12 }}>统计分组 / 方法</div>
                <div className="cs-chip-group">
                  {['全任务', '区块', '井型', '层位', '施工阶段'].map((g, i) => <span key={g} className={`cs-tool-chip${i === 1 ? ' cs-tool-chip--active' : ''}`}>{g}</span>)}
                </div>
              </div>
              <div className="cs-comp-right">
                <div className="cs-form-section-title">处理方式</div>
                <div className="cs-action-radios">
                  {[
                    { label: '保留真实极值', icon: 'verified', desc: '标记为业务真实极值，需填写说明' },
                    { label: '按公式重算', icon: 'functions', desc: '依据字段标准公式重新计算' },
                    { label: '回切至边界', icon: 'compress', desc: '截断至物理/业务边界（需二次确认）' },
                    { label: '提交专家复核', icon: 'rate_review', desc: '移入复核队列人工确认' },
                  ].map((o, i) => (
                    <label key={o.label} className={`cs-action-radio${i === 0 ? ' cs-action-radio--active' : ''}`}>
                      <input type="radio" name="dist-action" defaultChecked={i === 0} style={{ display: 'none' }} />
                      <md-icon style={{ fontSize: 18 }}>{o.icon}</md-icon>
                      <div><div className="cs-action-radio-label">{o.label}</div><div className="cs-action-radio-desc">{o.desc}</div></div>
                    </label>
                  ))}
                </div>
                <div className="cs-comp-preview" style={{ marginTop: 10 }}>
                  <div className="cs-comp-preview-row"><span>原值</span><b>{activeRecord.value} {activeRecord.unit}</b></div>
                  <div className="cs-comp-preview-row"><span>建议值</span><b className="cs-val">保留</b></div>
                </div>
              </div>
            </div>
            <div className="cs-dialog-footer">
              <button className="cs-btn cs-btn--ghost" onClick={() => setProcOpen(false)}>取消</button>
              <button className="cs-btn cs-btn--ghost">预览影响</button>
              <button className="cs-btn cs-btn--primary" onClick={() => { setRecords(p => p.map(x => x.id === activeRecord.id ? { ...x, status: '已修正' } : x)); setProcOpen(false) }}>应用处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? '#c62828' : score >= 75 ? '#e65100' : '#607d8b'
  return (
    <div className="cs-score-bar">
      <div className="cs-score-bar-track"><div className="cs-score-bar-fill" style={{ width: `${score}%`, background: color }} /></div>
      <span className="cs-score-bar-num" style={{ color }}>{score}</span>
    </div>
  )
}

function RiskBadge({ risk }: { risk: Risk }) {
  const map: Record<Risk, string> = { '提示': 'cs-risk--info', '一般': 'cs-risk--warn', '严重': 'cs-risk--severe' }
  const icon: Record<Risk, string> = { '提示': 'info', '一般': 'warning', '严重': 'error' }
  return <span className={`cs-risk ${map[risk]}`}><md-icon style={{ fontSize: 12 }}>{icon[risk]}</md-icon>{risk}</span>
}

function DistStatusBadge({ status }: { status: DistStatus }) {
  const map: Record<DistStatus, string> = { '待处理': 'cs-status--pending', '已确认极值': 'cs-status--reviewed', '已修正': 'cs-status--done', '待复核': 'cs-status--review' }
  return <span className={`cs-status ${map[status]}`}>{status}</span>
}

// 箱线图：4 组，含统计/业务/物理边界线与离群点
function BoxPlot() {
  const W = 640, H = 200, padL = 60, padR = 20, padT = 16, padB = 30
  const plotH = H - padT - padB
  const maxV = 4, minV = 0
  const toY = (v: number) => padT + (1 - (Math.min(v, maxV) - minV) / (maxV - minV)) * plotH
  const groupW = (W - padL - padR) / BOX_GROUPS.length
  const statUpper = 3.5, bizUpper = 5, physUpper = 4
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="渗透率分组箱线图" style={{ display: 'block' }}>
      {/* Y 轴刻度 */}
      {[0, 1, 2, 3, 4].map(v => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={padL - 8} y={toY(v) + 3} textAnchor="end" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">{v}</text>
        </g>
      ))}
      {/* 边界线 */}
      <line x1={padL} y1={toY(statUpper)} x2={W - padR} y2={toY(statUpper)} stroke="#607d8b" strokeWidth="1.2" strokeDasharray="6,3" />
      <line x1={padL} y1={toY(physUpper)} x2={W - padR} y2={toY(physUpper)} stroke="#c62828" strokeWidth="1.4" />
      {BOX_GROUPS.map((g, i) => {
        const cx = padL + groupW * i + groupW / 2
        const bw = 26
        return (
          <g key={g.well}>
            {/* whisker */}
            <line x1={cx} y1={toY(g.max)} x2={cx} y2={toY(g.min)} stroke="#37474f" strokeWidth="1" />
            <line x1={cx - 8} y1={toY(g.max)} x2={cx + 8} y2={toY(g.max)} stroke="#37474f" strokeWidth="1" />
            <line x1={cx - 8} y1={toY(g.min)} x2={cx + 8} y2={toY(g.min)} stroke="#37474f" strokeWidth="1" />
            {/* box */}
            <rect x={cx - bw / 2} y={toY(g.q3)} width={bw} height={toY(g.q1) - toY(g.q3)} fill="#e3f2fd" stroke="#1565c0" strokeWidth="1" />
            <line x1={cx - bw / 2} y1={toY(g.med)} x2={cx + bw / 2} y2={toY(g.med)} stroke="#1565c0" strokeWidth="1.5" />
            {/* outliers (clamped to top) */}
            {g.outliers.map((o, oi) => (
              <circle key={oi} cx={cx} cy={toY(Math.min(o, maxV)) + 4} r={4} fill="#c62828" stroke="#fff" strokeWidth="1">
                <title>{`${g.well} 离群点: ${o} mD`}</title>
              </circle>
            ))}
            <text x={cx} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">{g.well.slice(0, 5)}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Histogram() {
  const W = 640, H = 200, padL = 40, padR = 20, padT = 16, padB = 30
  const plotH = H - padT - padB
  const maxC = Math.max(...HISTOGRAM)
  const barW = (W - padL - padR) / HISTOGRAM.length
  const physIdx = HISTOGRAM.length - 1.5
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="渗透率分布直方图" style={{ display: 'block' }}>
      {HISTOGRAM.map((c, i) => {
        const h = (c / maxC) * plotH
        const x = padL + barW * i + 2
        const isTail = i >= HISTOGRAM.length - 2 && c > 0
        return <rect key={i} x={x} y={padT + plotH - h} width={barW - 4} height={h} fill={isTail ? '#ffcdd2' : '#90caf9'} stroke={isTail ? '#c62828' : '#1565c0'} strokeWidth="0.6" />
      })}
      {/* 物理上限竖线 */}
      <line x1={padL + barW * physIdx} y1={padT} x2={padL + barW * physIdx} y2={padT + plotH} stroke="#c62828" strokeWidth="1.4" strokeDasharray="4,2" />
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <text x={padL} y={H - 8} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">低值</text>
      <text x={W - padR} y={H - 8} textAnchor="end" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">高值（右尾疑似异常）</text>
    </svg>
  )
}

function TrendChart() {
  const W = 640, H = 200, padL = 40, padR = 20, padT = 16, padB = 30
  const plotH = H - padT - padB
  const data = [0.6, 0.7, 0.65, 0.8, 0.72, 3.9, 0.75, 0.68, 0.7, 0.66, 0.71, 0.69]
  const anomalyIdx = 5
  const maxV = 4, minV = 0
  const stepX = (W - padL - padR) / (data.length - 1)
  const toX = (i: number) => padL + i * stepX
  const toY = (v: number) => padT + (1 - (v - minV) / (maxV - minV)) * plotH
  const statUpper = 3.5
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="渗透率深度趋势" style={{ display: 'block' }}>
      <line x1={padL} y1={toY(statUpper)} x2={W - padR} y2={toY(statUpper)} stroke="#607d8b" strokeWidth="1" strokeDasharray="6,3" />
      <polyline points={data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')} fill="none" stroke="#1565c0" strokeWidth="1.4" />
      {data.map((v, i) => i === anomalyIdx
        ? <circle key={i} cx={toX(i)} cy={toY(Math.min(v, maxV))} r={5} fill="#c62828" stroke="#fff" strokeWidth="1"><title>{`异常点: ${v} mD`}</title></circle>
        : <circle key={i} cx={toX(i)} cy={toY(v)} r={2.5} fill="#1565c0" opacity={0.6} />)}
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <text x={padL} y={H - 8} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">2400m</text>
      <text x={W - padR} y={H - 8} textAnchor="end" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">2520m</text>
    </svg>
  )
}
