'use client'

import { useState } from 'react'
import type { QCWorkspaceType } from './consistency-workspace'

interface CorrelationWorkspaceProps {
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

type Source = '自动质检' | '人工框选' | '模型诊断'
type Reason = '高残差' | '方向相反' | '逻辑冲突' | '时序错位'
type Risk = '提示' | '一般' | '严重'
type CorrStatus = '待处理' | '保留' | '已修正' | '待复核'

interface CorrRecord {
  id: string
  source: Source
  well: string
  location: string
  fieldGroup: string
  actual: string
  expected: string
  metric: string
  reason: Reason
  risk: Risk
  status: CorrStatus
}

const MOCK: CorrRecord[] = [
  { id: 'c1', source: '自动质检', well: '苏36-11井', location: '第 3 段', fieldGroup: '加砂量 / 携砂液量', actual: '82m³ / 210m³', expected: '回归预测 118m³', metric: '残差 -36 (标准化 3.2)', reason: '高残差', risk: '严重', status: '待处理' },
  { id: 'c2', source: '人工框选', well: '苏36-12井', location: '第 5 段', fieldGroup: '砂比 / 加砂量', actual: '8% / 145m³', expected: '砂比↑应加砂量↑', metric: 'r=-0.42', reason: '方向相反', risk: '一般', status: '待处理' },
  { id: 'c3', source: '自动质检', well: '苏36-13井', location: '2026-04-02', fieldGroup: '油压 / 排量', actual: '32MPa / 0.5m³/min', expected: '逻辑区间 [排量>2]', metric: '逻辑失败', reason: '逻辑冲突', risk: '严重', status: '待复核' },
  { id: 'c4', source: '模型诊断', well: '苏36-14井', location: '记录 55', fieldGroup: '孔隙度 / 渗透率', actual: '16% / 0.02mD', expected: '孔渗正相关', metric: '残差 2.6σ', reason: '高残差', risk: '一般', status: '保留' },
  { id: 'c5', source: '人工框选', well: '苏37-01井', location: '2026-04-05', fieldGroup: '日产气 / 井口压力', actual: '5×10⁴ / 12MPa', expected: '滞后 2 天对齐', metric: '时移 +2d', reason: '时序错位', risk: '提示', status: '已修正' },
]

// 相关系数矩阵（5 字段）
const CORR_FIELDS = ['加砂量', '砂比', '携砂液量', '油压', '排量']
const CORR_MATRIX = [
  [1.00, 0.82, 0.76, 0.21, 0.45],
  [0.82, 1.00, 0.68, 0.15, 0.38],
  [0.76, 0.68, 1.00, 0.24, 0.52],
  [0.21, 0.15, 0.24, 1.00, 0.71],
  [0.45, 0.38, 0.52, 0.71, 1.00],
]

// 散点数据（X=加砂量, Y=携砂液量）含异常点
const SCATTER = [
  { x: 60, y: 150 }, { x: 75, y: 190 }, { x: 90, y: 230 }, { x: 105, y: 268 },
  { x: 118, y: 300 }, { x: 130, y: 330 }, { x: 145, y: 368 }, { x: 82, y: 210, anomaly: true },
  { x: 95, y: 120, anomaly: true }, { x: 110, y: 280 }, { x: 125, y: 315 }, { x: 70, y: 178 },
]

const SOURCES: Source[] = ['自动质检', '人工框选', '模型诊断']
const STATUS_LIST: CorrStatus[] = ['待处理', '保留', '已修正', '待复核']

const FIELD_GROUPS = ['加砂量—砂比—携砂液量', '油压—套压—排量', '孔隙度—渗透率—含气饱和度', '日产气—井口压力—气油比']

export function CorrelationWorkspace({ datasetName = '苏里格区块2024年综合数据集', onBack, onSwitchTab }: CorrelationWorkspaceProps) {
  const [records, setRecords] = useState<CorrRecord[]>(MOCK)
  const [filterSource, setFilterSource] = useState<Source | '全部'>('全部')
  const [filterStatus, setFilterStatus] = useState<CorrStatus | '全部'>('全部')
  const [diagView, setDiagView] = useState<'scatter' | 'residual' | 'matrix' | 'logic'>('scatter')
  const [activeGroup, setActiveGroup] = useState(FIELD_GROUPS[0])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [algoOpen, setAlgoOpen] = useState(false)

  // ── 相关性算法配置 ──
  const [algoMethod, setAlgoMethod] = useState<'Pearson' | 'Spearman' | '时间滞后'>('Pearson')
  const [regMethod, setRegMethod] = useState<'线性回归' | '多元回归'>('线性回归')
  const [groupField, setGroupField] = useState('井型')
  const [minSample, setMinSample] = useState('30')
  const [residualSigma, setResidualSigma] = useState('2.5')
  const [maxLag, setMaxLag] = useState('5')
  const [lagStep, setLagStep] = useState('1 天')
  const [regFeatures, setRegFeatures] = useState<string[]>(['砂比', '携砂液量'])
  const [alignMethod, setAlignMethod] = useState('最近点')
  const [normMethod, setNormMethod] = useState('Z-score')
  const [analysisScope, setAnalysisScope] = useState('当前井')
  const [processTarget, setProcessTarget] = useState('主字段')
  const [previewResult, setPreviewResult] = useState<null | { sample: number; coef: string; p: string; note: string }>(null)

  const REG_FEATURE_OPTIONS = ['砂比', '携砂液量', '油压', '排量', '施工时长']
  const toggleRegFeature = (f: string) =>
    setRegFeatures(prev => (prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]))

  // 依据当前配置生成一份示意预览结果
  const runPreview = () => {
    const base = algoMethod === 'Spearman' ? 0.74 : algoMethod === '时间滞后' ? 0.81 : 0.86
    const coef = algoMethod === 'Spearman' ? `ρ = ${base.toFixed(2)}` : algoMethod === '时间滞后' ? `r = ${base.toFixed(2)} (滞后 ${maxLag})` : `r = ${base.toFixed(2)}`
    const sample = Math.max(0, Number(minSample) || 0) + 148
    setPreviewResult({
      sample,
      coef,
      p: base > 0.8 ? 'p < 0.001' : 'p = 0.004',
      note: `${algoMethod} · ${regMethod} · 按「${groupField}」分组 · ${normMethod} 归一化`,
    })
  }

  const filtered = records.filter(r =>
    (filterSource === '全部' || r.source === filterSource) &&
    (filterStatus === '全部' || r.status === filterStatus))

  const fieldCount = 3
  const strongPairs = 2
  const anomalyPairs = records.filter(r => r.reason === '方向相反' || r.reason === '逻辑冲突').length
  const highResidual = records.filter(r => r.reason === '高残差').length
  const logicConflict = records.filter(r => r.reason === '逻辑冲突').length
  const pendingReview = records.filter(r => r.status === '待复核').length

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))

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
            <button key={t.key} className={`cs-tab-btn${t.key === 'correlation' ? ' cs-tab-btn--active' : ''}`}
              onClick={() => onSwitchTab(t.key)} aria-current={t.key === 'correlation' ? 'page' : undefined}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div className="cs-toolbar">
        <div className="cs-toolbar-left">
          <span className="cs-toolbar-hint">常用字段组：</span>
          <select className="cs-filter-select" value={activeGroup} onChange={e => setActiveGroup(e.target.value)}>
            {FIELD_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="cs-toolbar-right">
          <button className="cs-btn cs-btn--sm cs-btn--ghost" onClick={() => { setPreviewResult(null); setAlgoOpen(true) }}><md-icon style={{ fontSize: 14 }}>tune</md-icon>算法配置</button>
          <select className="cs-filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value as typeof filterSource)}>
            <option value="全部">全部来源</option>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
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
            <span className="cs-metric-score">{fieldCount}</span>
            <span className="cs-metric-label">当前字段数</span>
          </div>
          <div className="cs-metric-divider" />
          <div className="cs-metric-item"><span className="cs-metric-value" style={{ color: 'var(--app-color-success)' }}>{strongPairs}</span><span className="cs-metric-label">强相关字段对</span></div>
          <div className="cs-metric-item cs-metric-item--warn"><span className="cs-metric-value">{anomalyPairs}</span><span className="cs-metric-label">异常字段对</span></div>
          <div className="cs-metric-item cs-metric-item--warn"><span className="cs-metric-value">{highResidual}</span><span className="cs-metric-label">高残差点</span></div>
          <div className="cs-metric-item"><span className="cs-metric-value">{logicConflict}</span><span className="cs-metric-label">逻辑冲突</span></div>
          <div className="cs-metric-item cs-metric-item--review"><span className="cs-metric-value">{pendingReview}</span><span className="cs-metric-label">待复核</span></div>
        </div>

        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title"><md-icon style={{ fontSize: 16 }}>scatter_plot</md-icon>相关性诊断<span className="cs-chart-field-name" style={{ marginLeft: 8 }}>{activeGroup}</span></div>
            <div className="cs-diag-switch">
              <button className={`cs-diag-tab${diagView === 'scatter' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('scatter')}>散点与回归</button>
              <button className={`cs-diag-tab${diagView === 'residual' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('residual')}>残差分析</button>
              <button className={`cs-diag-tab${diagView === 'matrix' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('matrix')}>相关矩阵</button>
              <button className={`cs-diag-tab${diagView === 'logic' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('logic')}>逻辑关系</button>
            </div>
          </div>
          <div className="cs-chart-wrap">
            {diagView === 'scatter' && <ScatterChart />}
            {diagView === 'residual' && <ResidualChart />}
            {diagView === 'matrix' && <CorrMatrix />}
            {diagView === 'logic' && <LogicView />}
          </div>
          <div className="cs-chart-note">
            <md-icon style={{ fontSize: 13 }}>info</md-icon>
            相关不代表因果；未通过一致性校验的数据默认不参与模型计算，样本不足时显示“结果不可靠”。
          </div>
        </section>

        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title"><md-icon style={{ fontSize: 16 }}>table_rows</md-icon>相关异常明细<span className="cs-count-chip">{filtered.length}</span></div>
            {selected.size > 0 && (
              <div className="cs-batch-bar">
                <span className="cs-batch-selected md-typescale-label-small">已选 {selected.size} 条</span>
                <button className="cs-btn cs-btn--sm cs-btn--ghost"><md-icon style={{ fontSize: 14 }}>edit_note</md-icon>批量处理</button>
                <button className="cs-btn cs-btn--sm cs-btn--ghost"><md-icon style={{ fontSize: 14 }}>rate_review</md-icon>提交复核</button>
                <button className="cs-icon-btn" onClick={() => setSelected(new Set())} title="取消选择"><md-icon>close</md-icon></button>
              </div>
            )}
          </div>
          <div className="cs-table-wrap">
            <table className="cs-table" aria-label="相关异常明细表">
              <thead>
                <tr>
                  <th className="cs-th cs-th--check"><input type="checkbox" aria-label="全选" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th className="cs-th">来源</th>
                  <th className="cs-th">井名</th>
                  <th className="cs-th">位置</th>
                  <th className="cs-th">字段组</th>
                  <th className="cs-th">实际组合</th>
                  <th className="cs-th">预期关系</th>
                  <th className="cs-th">相关指标</th>
                  <th className="cs-th">异常原因</th>
                  <th className="cs-th">风险</th>
                  <th className="cs-th">状态</th>
                  <th className="cs-th cs-th--action">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={`cs-tr${selected.has(r.id) ? ' cs-tr--selected' : ''}`} onClick={() => toggle(r.id)}>
                    <td className="cs-td cs-td--check" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`选择 ${r.well}`} /></td>
                    <td className="cs-td"><SourceBadge source={r.source} /></td>
                    <td className="cs-td"><span className="cs-well-name">{r.well}</span></td>
                    <td className="cs-td cs-td--mono">{r.location}</td>
                    <td className="cs-td cs-td--field">{r.fieldGroup}</td>
                    <td className="cs-td cs-td--mono">{r.actual}</td>
                    <td className="cs-td">{r.expected}</td>
                    <td className="cs-td cs-td--mono">{r.metric}</td>
                    <td className="cs-td"><span className="cs-badge cs-badge--reason">{r.reason}</span></td>
                    <td className="cs-td"><RiskBadge risk={r.risk} /></td>
                    <td className="cs-td"><CorrStatusBadge status={r.status} /></td>
                    <td className="cs-td cs-td--action" onClick={e => e.stopPropagation()}>
                      <div className="cs-row-actions">
                        <button className="cs-row-btn" title="定位图件"><md-icon>my_location</md-icon></button>
                        <button className="cs-row-btn" title="保留" onClick={() => setRecords(p => p.map(x => x.id === r.id ? { ...x, status: '保留' } : x))}><md-icon>bookmark</md-icon></button>
                        <button className="cs-row-btn cs-row-btn--review" title="提交复核" onClick={() => setRecords(p => p.map(x => x.id === r.id ? { ...x, status: '待复核' } : x))}><md-icon>rate_review</md-icon></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={12} className="cs-td-empty"><md-icon>check_circle</md-icon>当前筛选条件下无相关异常</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 算法配置弹窗 */}
      {algoOpen && (
        <div className="cs-overlay" onClick={e => { if (e.target === e.currentTarget) setAlgoOpen(false) }}>
          <div className="cs-dialog cs-dialog--lg">
            <div className="cs-dialog-header">
              <span className="md-typescale-title-medium">相关性算法配置</span>
              <button className="cs-icon-btn" onClick={() => setAlgoOpen(false)} aria-label="关闭"><md-icon>close</md-icon></button>
            </div>
            <div className="cs-dialog-body cs-dialog-body--grid">
              <div className="cs-comp-left">
                <div className="cs-form-section-title">相关性算法</div>
                <div className="cs-chip-group">
                  {(['Pearson', 'Spearman', '时间滞后'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`cs-tool-chip${algoMethod === m ? ' cs-tool-chip--active' : ''}`}
                      onClick={() => { setAlgoMethod(m); setPreviewResult(null) }}
                    >{m}</button>
                  ))}
                </div>
                {/* 时间滞后专属参数 */}
                {algoMethod === '时间滞后' && (
                  <>
                    <div className="cs-form-row" style={{ marginTop: 12 }}><label className="cs-form-label">最大滞后</label><select className="cs-select" value={maxLag} onChange={e => setMaxLag(e.target.value)}><option>3</option><option>5</option><option>10</option></select></div>
                    <div className="cs-form-row"><label className="cs-form-label">滞后步长</label><select className="cs-select" value={lagStep} onChange={e => setLagStep(e.target.value)}><option>1 天</option><option>1 小时</option><option>1 米</option></select></div>
                  </>
                )}
                <div className="cs-form-row" style={{ marginTop: 12 }}><label className="cs-form-label">分组字段</label><select className="cs-select" value={groupField} onChange={e => setGroupField(e.target.value)}><option>井型</option><option>区块</option><option>层位</option><option>不分组</option></select></div>
                <div className="cs-form-row"><label className="cs-form-label">最小样本数</label><input className="cs-input" value={minSample} onChange={e => setMinSample(e.target.value)} type="number" min="1" /></div>
                <div className="cs-form-section-title" style={{ marginTop: 12 }}>回归算法</div>
                <div className="cs-chip-group">
                  {(['线性回归', '多元回归'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`cs-tool-chip${regMethod === m ? ' cs-tool-chip--active' : ''}`}
                      onClick={() => { setRegMethod(m); setPreviewResult(null) }}
                    >{m}</button>
                  ))}
                </div>
                {/* 多元回归专属：特征字段选择 */}
                {regMethod === '多元回归' && (
                  <div className="cs-form-row cs-form-row--col" style={{ marginTop: 10 }}>
                    <label className="cs-form-label">特征字段（自变量）</label>
                    <div className="cs-chip-group cs-chip-group--wrap">
                      {REG_FEATURE_OPTIONS.map(f => (
                        <button
                          key={f}
                          type="button"
                          className={`cs-tool-chip cs-tool-chip--sm${regFeatures.includes(f) ? ' cs-tool-chip--active' : ''}`}
                          onClick={() => toggleRegFeature(f)}
                        >{f}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="cs-form-row" style={{ marginTop: 12 }}><label className="cs-form-label">残差阈值(σ)</label><input className="cs-input" value={residualSigma} onChange={e => setResidualSigma(e.target.value)} type="number" step="0.1" min="0" /></div>
              </div>
              <div className="cs-comp-right">
                <div className="cs-form-section-title">对齐与处理</div>
                <div className="cs-form-row"><label className="cs-form-label">时间/深度对齐</label><select className="cs-select" value={alignMethod} onChange={e => setAlignMethod(e.target.value)}><option>最近点</option><option>线性插值</option><option>窗口聚合</option><option>严格一致</option></select></div>
                <div className="cs-form-row"><label className="cs-form-label">归一化方式</label><select className="cs-select" value={normMethod} onChange={e => setNormMethod(e.target.value)}><option>Z-score</option><option>Min-Max</option><option>按井归一化</option><option>不处理</option></select></div>
                <div className="cs-form-row"><label className="cs-form-label">分析范围</label><select className="cs-select" value={analysisScope} onChange={e => setAnalysisScope(e.target.value)}><option>当前井</option><option>已选井</option><option>区块同类井</option></select></div>
                <div className="cs-form-row"><label className="cs-form-label">处理对象</label><select className="cs-select" value={processTarget} onChange={e => setProcessTarget(e.target.value)}><option>主字段</option><option>辅助字段</option><option>整条记录</option></select></div>
                <div className="cs-converter-hint" style={{ marginTop: 8 }}>
                  <md-icon style={{ fontSize: 14 }}>info</md-icon>
                  Pearson 适用线性关系，Spearman 适用单调关系；分组结果将展示分组条件与样本量。
                </div>
                {/* 预览计算结果 */}
                {previewResult && (
                  <div className="cs-preview-result">
                    <div className="cs-preview-result-title"><md-icon style={{ fontSize: 15 }}>insights</md-icon>预览结果</div>
                    <div className="cs-preview-result-grid">
                      <div><span>有效样本</span><b>{previewResult.sample}</b></div>
                      <div><span>相关系数</span><b className="cs-val">{previewResult.coef}</b></div>
                      <div><span>显著性</span><b>{previewResult.p}</b></div>
                    </div>
                    <div className="cs-preview-result-note">{previewResult.note}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="cs-dialog-footer">
              <button className="cs-btn cs-btn--ghost" onClick={() => setAlgoOpen(false)}>取消</button>
              <button className="cs-btn cs-btn--ghost" onClick={runPreview}>预览计算</button>
              <button className="cs-btn cs-btn--primary" onClick={() => setAlgoOpen(false)}>应用配置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SourceBadge({ source }: { source: Source }) {
  const map: Record<Source, string> = { '自动质检': 'cs-src--auto', '人工框选': 'cs-src--manual', '模型诊断': 'cs-src--model' }
  return <span className={`cs-src ${map[source]}`}>{source}</span>
}

function RiskBadge({ risk }: { risk: Risk }) {
  const map: Record<Risk, string> = { '提示': 'cs-risk--info', '一般': 'cs-risk--warn', '严重': 'cs-risk--severe' }
  const icon: Record<Risk, string> = { '提示': 'info', '一般': 'warning', '严重': 'error' }
  return <span className={`cs-risk ${map[risk]}`}><md-icon style={{ fontSize: 12 }}>{icon[risk]}</md-icon>{risk}</span>
}

function CorrStatusBadge({ status }: { status: CorrStatus }) {
  const map: Record<CorrStatus, string> = { '待处理': 'cs-status--pending', '保留': 'cs-status--reviewed', '已修正': 'cs-status--done', '待复核': 'cs-status--review' }
  return <span className={`cs-status ${map[status]}`}>{status}</span>
}

// 散点+回归线，含置信区间与异常点
function ScatterChart() {
  const W = 640, H = 220, padL = 44, padR = 20, padT = 16, padB = 32
  const plotW = W - padL - padR, plotH = H - padT - padB
  const xMin = 50, xMax = 155, yMin = 100, yMax = 380
  const toX = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW
  const toY = (y: number) => padT + (1 - (y - yMin) / (yMax - yMin)) * plotH
  // 回归线 y = 2.6x - 10
  const rl = (x: number) => 2.6 * x - 10
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="加砂量-携砂液量散点回归" style={{ display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(r => (
        <line key={r} x1={padL} y1={padT + r * plotH} x2={W - padR} y2={padT + r * plotH} stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      {/* 置信区间带 */}
      <polygon points={`${toX(xMin)},${toY(rl(xMin) + 30)} ${toX(xMax)},${toY(rl(xMax) + 30)} ${toX(xMax)},${toY(rl(xMax) - 30)} ${toX(xMin)},${toY(rl(xMin) - 30)}`} fill="#1565c0" opacity={0.08} />
      {/* 回归线 */}
      <line x1={toX(xMin)} y1={toY(rl(xMin))} x2={toX(xMax)} y2={toY(rl(xMax))} stroke="#1565c0" strokeWidth="1.5" strokeDasharray="5,3" />
      {/* 散点 */}
      {SCATTER.map((p, i) => p.anomaly
        ? <circle key={i} cx={toX(p.x)} cy={toY(p.y)} r={5} fill="#c62828" stroke="#fff" strokeWidth="1"><title>{`异常: 加砂量${p.x} / 携砂液量${p.y}`}</title></circle>
        : <circle key={i} cx={toX(p.x)} cy={toY(p.y)} r={3.5} fill="#1565c0" opacity={0.7} />)}
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <text x={padL} y={H - 8} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">加砂量 (m³)</text>
      <text x={padL - 8} y={padT + 4} textAnchor="end" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">携砂液量</text>
    </svg>
  )
}

function ResidualChart() {
  const W = 640, H = 220, padL = 44, padR = 20, padT = 16, padB = 32
  const plotW = W - padL - padR, plotH = H - padT - padB
  const residuals = [0.4, -0.6, 0.8, -0.3, 3.2, 0.5, -0.7, 0.2, -2.8, 0.6, 0.9, -0.4]
  const yMax = 4, yMin = -4
  const stepX = plotW / (residuals.length - 1)
  const toX = (i: number) => padL + i * stepX
  const toY = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="残差分布" style={{ display: 'block' }}>
      {/* 零线 */}
      <line x1={padL} y1={toY(0)} x2={W - padR} y2={toY(0)} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      {/* ±2.5σ 阈值 */}
      <line x1={padL} y1={toY(2.5)} x2={W - padR} y2={toY(2.5)} stroke="#e65100" strokeWidth="1" strokeDasharray="5,3" />
      <line x1={padL} y1={toY(-2.5)} x2={W - padR} y2={toY(-2.5)} stroke="#e65100" strokeWidth="1" strokeDasharray="5,3" />
      {residuals.map((v, i) => {
        const outlier = Math.abs(v) > 2.5
        return <g key={i}>
          <line x1={toX(i)} y1={toY(0)} x2={toX(i)} y2={toY(v)} stroke={outlier ? '#c62828' : '#90a4ae'} strokeWidth="1" />
          <circle cx={toX(i)} cy={toY(v)} r={outlier ? 5 : 3} fill={outlier ? '#c62828' : '#607d8b'} stroke="#fff" strokeWidth={outlier ? 1 : 0}><title>{`残差: ${v}σ`}</title></circle>
        </g>
      })}
      <text x={padL - 8} y={toY(2.5) + 3} textAnchor="end" fontSize="9" fill="#e65100">+2.5σ</text>
      <text x={padL - 8} y={toY(-2.5) + 3} textAnchor="end" fontSize="9" fill="#e65100">-2.5σ</text>
    </svg>
  )
}

function CorrMatrix() {
  const cell = 74
  const colorFor = (v: number) => {
    if (v >= 0.7) return '#1565c0'
    if (v >= 0.4) return '#64b5f6'
    if (v >= 0.2) return '#bbdefb'
    return '#eceff1'
  }
  return (
    <div className="cs-corr-matrix-wrap">
      <table className="cs-corr-matrix">
        <thead>
          <tr>
            <th className="cs-corr-corner" />
            {CORR_FIELDS.map(f => <th key={f} className="cs-corr-fh">{f}</th>)}
          </tr>
        </thead>
        <tbody>
          {CORR_FIELDS.map((f, ri) => (
            <tr key={f}>
              <td className="cs-corr-rh">{f}</td>
              {CORR_MATRIX[ri].map((v, ci) => (
                <td key={ci} className="cs-corr-cell" style={{ background: ri === ci ? '#e0e0e0' : colorFor(v), color: v >= 0.4 && ri !== ci ? '#fff' : 'var(--md-sys-color-on-surface)' }}
                  title={`${CORR_FIELDS[ri]} × ${CORR_FIELDS[ci]}: r=${v.toFixed(2)}`}>
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LogicView() {
  const rules = [
    { expr: '排量 > 2 m³/min 时 油压 应 < 45 MPa', result: '通过', ok: true, hits: '128 / 130' },
    { expr: '砂比 ↑ ⇒ 加砂量 ↑（同向）', result: '2 处冲突', ok: false, hits: '2 条方向相反' },
    { expr: '携砂液量 ≥ 加砂量 × 1.5', result: '通过', ok: true, hits: '130 / 130' },
    { expr: '瞬时加砂量 ≤ 累计加砂量', result: '1 处冲突', ok: false, hits: '1 条逻辑失败' },
  ]
  return (
    <div className="cs-logic-list">
      {rules.map((r, i) => (
        <div key={i} className={`cs-logic-item${r.ok ? '' : ' cs-logic-item--fail'}`}>
          <md-icon style={{ fontSize: 18, color: r.ok ? '#2e7d32' : '#c62828' }}>{r.ok ? 'check_circle' : 'error'}</md-icon>
          <div className="cs-logic-expr">{r.expr}</div>
          <span className={`cs-logic-result${r.ok ? ' cs-logic-result--ok' : ' cs-logic-result--fail'}`}>{r.result}</span>
          <span className="cs-logic-hits">{r.hits}</span>
        </div>
      ))}
    </div>
  )
}
