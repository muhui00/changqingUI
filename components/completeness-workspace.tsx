'use client'

import { useState } from 'react'
import type { QCWorkspaceType } from './consistency-workspace'

interface CompletenessWorkspaceProps {
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

type MissingType = '必填缺失' | '空值' | '哨兵值' | '连续缺失' | '整段缺失'
type CompStatus = '待处理' | '候选已生成' | '已应用' | '待复核' | '无法补全'
type ConfLevel = '高' | '中' | '低'
type Tool = '样条插值' | '线性插值' | 'KNN相似井' | 'MICE' | '随机森林' | '物理公式' | '报告抽取'

interface MissRecord {
  id: string
  well: string
  field: string
  required: '必填' | '条件必填' | '可选'
  missType: MissingType
  location: string
  count: string
  origRate: number
  tool: Tool
  candidate: string
  confidence: number
  confLevel: ConfLevel
  evidence: string
  status: CompStatus
}

const MOCK: MissRecord[] = [
  { id: 'm1', well: '苏36-11井', field: '孔隙度', required: '必填', missType: '连续缺失', location: '2450–2478m', count: '28点 / 3.1%', origRate: 91.2, tool: '样条插值', candidate: '14.2~15.8% 序列', confidence: 88, confLevel: '高', evidence: '相邻深度段 + 邻井T1h', status: '候选已生成' },
  { id: 'm2', well: '苏36-12井', field: '渗透率', required: '必填', missType: '必填缺失', location: '全井段', count: '整段', origRate: 0, tool: 'KNN相似井', candidate: '待生成', confidence: 0, confLevel: '低', evidence: '—', status: '待处理' },
  { id: 'm3', well: '苏36-13井', field: '含气饱和度', required: '条件必填', missType: '空值', location: '记录 122–140', count: '19点 / 2.4%', origRate: 94.6, tool: 'MICE', candidate: '58.4% 均值', confidence: 72, confLevel: '中', evidence: '孔渗联合回归', status: '候选已生成' },
  { id: 'm4', well: '苏36-14井', field: '日产气量', required: '必填', missType: '连续缺失', location: '2026-03-04~03-12', count: '9天', origRate: 87.5, tool: '线性插值', candidate: '3.2~3.6×10⁴m³', confidence: 65, confLevel: '中', evidence: '停井前后趋势', status: '待复核' },
  { id: 'm5', well: '苏37-01井', field: '加砂量', required: '必填', missType: '哨兵值', location: '第 3 段', count: '1点', origRate: 96.0, tool: '物理公式', candidate: '82.5 m³', confidence: 91, confLevel: '高', evidence: '砂比×携砂液量', status: '已应用' },
  { id: 'm6', well: '苏37-02井', field: '声波时差', required: '可选', missType: '整段缺失', location: '1980–2100m', count: '整段', origRate: 0, tool: '报告抽取', candidate: '待生成', confidence: 0, confLevel: '低', evidence: '录井报告 P.12', status: '无法补全' },
]

// 井 × 字段 缺失矩阵数据（0=完整,1=零散,2=连续,3=整段缺失）
const MATRIX_WELLS = ['苏36-11井', '苏36-12井', '苏36-13井', '苏36-14井', '苏37-01井', '苏37-02井']
const MATRIX_FIELDS = ['孔隙度', '渗透率', '含气饱和度', '日产气量', '加砂量', '声波时差']
const MATRIX: number[][] = [
  [0, 2, 0, 1, 0, 3],
  [2, 3, 1, 0, 0, 2],
  [0, 1, 2, 0, 1, 0],
  [1, 0, 0, 2, 0, 1],
  [0, 0, 1, 0, 1, 3],
  [3, 2, 0, 1, 0, 3],
]
const MATRIX_COLORS = ['#e8f5e9', '#fff3e0', '#ffe0b2', '#ffcdd2']
const MATRIX_LABELS = ['完整', '零散缺失', '连续缺失', '整段缺失']

// 字段完整率条形图数据（补全前 / 候选补全后 / 目标）
const RATE_BARS = [
  { field: '孔隙度', before: 91.2, after: 98.6, target: 95 },
  { field: '渗透率', before: 42.5, after: 88.0, target: 95 },
  { field: '含气饱和度', before: 94.6, after: 99.1, target: 95 },
  { field: '日产气量', before: 87.5, after: 96.4, target: 90 },
  { field: '加砂量', before: 96.0, after: 99.5, target: 95 },
]

const MISS_TYPES: MissingType[] = ['必填缺失', '空值', '哨兵值', '连续缺失', '整段缺失']
const STATUS_LIST: CompStatus[] = ['待处理', '候选已生成', '已应用', '待复核', '无法补全']

const TOOLS: { name: Tool; desc: string; config: string }[] = [
  { name: '样条插值', desc: '连续测井/时间序列', config: '最大缺口 · 边界策略 · 平滑度' },
  { name: '线性插值', desc: '连续时间序列', config: '最大缺口 · 边界策略' },
  { name: 'KNN相似井', desc: '地质/工程/生产参数', config: '相似范围 · 特征字段 · K 值' },
  { name: 'MICE', desc: '多字段联合缺失', config: '参与字段 · 迭代次数 · 随机种子' },
  { name: '随机森林', desc: '非线性多特征', config: '训练范围 · 特征 · 模型版本' },
  { name: '物理公式', desc: '明确工程关系', config: '公式 · 依赖字段 · 单位' },
  { name: '报告抽取', desc: '文档中存在原始值', config: '报告 · 检索词 · 页码证据' },
]

export function CompletenessWorkspace({ datasetName = '苏里格区块2024年综合数据集', onBack, onSwitchTab }: CompletenessWorkspaceProps) {
  const [records, setRecords] = useState<MissRecord[]>(MOCK)
  const [filterType, setFilterType] = useState<MissingType | '全部'>('全部')
  const [filterStatus, setFilterStatus] = useState<CompStatus | '全部'>('全部')
  const [diagView, setDiagView] = useState<'rate' | 'matrix'>('rate')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toolOpen, setToolOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<MissRecord | null>(null)

  const filtered = records.filter(r =>
    (filterType === '全部' || r.missType === filterType) &&
    (filterStatus === '全部' || r.status === filterStatus))

  const beforeRate = 78.4
  const afterRate = 94.1
  const requiredMissing = records.filter(r => r.required === '必填' && (r.status === '待处理' || r.status === '无法补全')).length
  const missRecords = records.length
  const contInterval = records.filter(r => r.missType === '连续缺失' || r.missType === '整段缺失').length
  const lowConf = records.filter(r => r.confLevel === '低').length

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))

  const openTool = (r: MissRecord) => { setActiveRecord(r); setToolOpen(true) }

  return (
    <div className="cs-workspace">
      {/* 顶部上下文栏 */}
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
        <nav className="cs-tab-switch" aria-label="质检类型切换">
          {TAB_LABELS.map(t => (
            <button key={t.key}
              className={`cs-tab-btn${t.key === 'completeness' ? ' cs-tab-btn--active' : ''}`}
              onClick={() => onSwitchTab(t.key)}
              aria-current={t.key === 'completeness' ? 'page' : undefined}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 筛选工具栏 */}
      <div className="cs-toolbar">
        <div className="cs-toolbar-left" />
        <div className="cs-toolbar-right">
          <select className="cs-filter-select" value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)}>
            <option value="全部">全部缺失类型</option>
            {MISS_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="cs-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}>
            <option value="全部">全部状态</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* 主体 */}
      <div className="cs-body">
        {/* 指标带 */}
        <div className="cs-metrics-band">
          <div className="cs-metric-item cs-metric-item--score">
            <span className="cs-metric-score">{beforeRate}%</span>
            <span className="cs-metric-label">补全前完整率</span>
          </div>
          <div className="cs-metric-divider" />
          <div className="cs-metric-item">
            <span className="cs-metric-value" style={{ color: 'var(--app-color-success)' }}>{afterRate}%</span>
            <span className="cs-metric-label">预计补全后</span>
          </div>
          <div className="cs-metric-item cs-metric-item--warn">
            <span className="cs-metric-value">{requiredMissing}</span>
            <span className="cs-metric-label">必填缺失字段</span>
          </div>
          <div className="cs-metric-item">
            <span className="cs-metric-value">{missRecords}</span>
            <span className="cs-metric-label">缺失记录数</span>
          </div>
          <div className="cs-metric-item cs-metric-item--warn">
            <span className="cs-metric-value">{contInterval}</span>
            <span className="cs-metric-label">连续缺失区间</span>
          </div>
          <div className="cs-metric-item cs-metric-item--review">
            <span className="cs-metric-value">{lowConf}</span>
            <span className="cs-metric-label">低置信度候选</span>
          </div>
        </div>

        {/* 缺失诊断 */}
        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title">
              <md-icon style={{ fontSize: 16 }}>analytics</md-icon>
              缺失诊断
            </div>
            <div className="cs-diag-switch">
              <button className={`cs-diag-tab${diagView === 'rate' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('rate')}>字段完整率</button>
              <button className={`cs-diag-tab${diagView === 'matrix' ? ' cs-diag-tab--active' : ''}`} onClick={() => setDiagView('matrix')}>井×字段缺失矩阵</button>
            </div>
          </div>

          {diagView === 'rate' ? (
            <div className="cs-rate-chart">
              {RATE_BARS.map(b => (
                <div key={b.field} className="cs-rate-row">
                  <span className="cs-rate-field">{b.field}</span>
                  <div className="cs-rate-track">
                    <div className="cs-rate-fill cs-rate-fill--before" style={{ width: `${b.before}%` }} />
                    <div className="cs-rate-fill cs-rate-fill--after" style={{ width: `${b.after}%` }} />
                    <div className="cs-rate-target" style={{ left: `${b.target}%` }} title={`目标 ${b.target}%`} />
                  </div>
                  <span className="cs-rate-nums">
                    <span className="cs-rate-before-num">{b.before}%</span>
                    <md-icon style={{ fontSize: 12 }}>arrow_forward</md-icon>
                    <span className="cs-rate-after-num">{b.after}%</span>
                  </span>
                </div>
              ))}
              <div className="cs-rate-legend">
                <span className="cs-legend-item"><span className="cs-legend-dot" style={{ background: '#b0bec5' }} />补全前</span>
                <span className="cs-legend-item"><span className="cs-legend-dot" style={{ background: '#1565c0' }} />候选补全后</span>
                <span className="cs-legend-item"><span className="cs-rate-target-legend" />目标阈值</span>
              </div>
            </div>
          ) : (
            <div className="cs-matrix-wrap">
              <table className="cs-matrix">
                <thead>
                  <tr>
                    <th className="cs-matrix-corner">井 \ 字段</th>
                    {MATRIX_FIELDS.map(f => <th key={f} className="cs-matrix-fh">{f}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_WELLS.map((w, ri) => (
                    <tr key={w}>
                      <td className="cs-matrix-wh">{w}</td>
                      {MATRIX[ri].map((v, ci) => (
                        <td key={ci} className="cs-matrix-cell" style={{ background: MATRIX_COLORS[v] }}
                          title={`${w} · ${MATRIX_FIELDS[ci]}：${MATRIX_LABELS[v]}`}>
                          {v > 0 && <span className="cs-matrix-dot" style={{ background: v === 1 ? '#e65100' : v === 2 ? '#c62828' : '#7b1fa2' }} />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cs-rate-legend">
                {MATRIX_LABELS.map((l, i) => (
                  <span key={l} className="cs-legend-item"><span className="cs-legend-dot" style={{ background: MATRIX_COLORS[i], border: '1px solid var(--md-sys-color-outline-variant)' }} />{l}</span>
                ))}
              </div>
            </div>
          )}
          <div className="cs-chart-note">
            <md-icon style={{ fontSize: 13 }}>info</md-icon>
            缺失区间不以 0 值连线，连续缺失优先于零散缺失；点击明细可查看候选证据。
          </div>
        </section>

        {/* 明细表 */}
        <section className="cs-section">
          <div className="cs-section-header">
            <div className="cs-section-title">
              <md-icon style={{ fontSize: 16 }}>table_rows</md-icon>
              完整性明细
              <span className="cs-count-chip">{filtered.length}</span>
            </div>
            {selected.size > 0 && (
              <div className="cs-batch-bar">
                <span className="cs-batch-selected md-typescale-label-small">已选 {selected.size} 条</span>
                <button className="cs-btn cs-btn--sm cs-btn--ghost"><md-icon style={{ fontSize: 14 }}>auto_fix_high</md-icon>批量生成候选</button>
                <button className="cs-btn cs-btn--sm cs-btn--ghost"><md-icon style={{ fontSize: 14 }}>rate_review</md-icon>提交复核</button>
                <button className="cs-icon-btn" onClick={() => setSelected(new Set())} title="取消选择"><md-icon>close</md-icon></button>
              </div>
            )}
          </div>
          <div className="cs-table-wrap">
            <table className="cs-table" aria-label="完整性明细表">
              <thead>
                <tr>
                  <th className="cs-th cs-th--check"><input type="checkbox" aria-label="全选" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th className="cs-th">井名</th>
                  <th className="cs-th">字段</th>
                  <th className="cs-th">必填要求</th>
                  <th className="cs-th">缺失类型</th>
                  <th className="cs-th">缺失位置</th>
                  <th className="cs-th">缺失数量</th>
                  <th className="cs-th">原完整率</th>
                  <th className="cs-th">推荐工具</th>
                  <th className="cs-th">候选值</th>
                  <th className="cs-th">置信度</th>
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
                    <td className="cs-td"><span className={`cs-req-chip cs-req-chip--${r.required === '必填' ? 'must' : r.required === '条件必填' ? 'cond' : 'opt'}`}>{r.required}</span></td>
                    <td className="cs-td"><span className="cs-badge cs-badge--miss">{r.missType}</span></td>
                    <td className="cs-td cs-td--mono">{r.location}</td>
                    <td className="cs-td cs-td--mono">{r.count}</td>
                    <td className="cs-td cs-td--mono">{r.origRate}%</td>
                    <td className="cs-td"><span className="cs-tool-tag">{r.tool}</span></td>
                    <td className="cs-td cs-td--mono">{r.candidate}</td>
                    <td className="cs-td">{r.confidence > 0 ? <ConfPill level={r.confLevel} value={r.confidence} /> : <span className="cs-muted">—</span>}</td>
                    <td className="cs-td"><CompStatusBadge status={r.status} /></td>
                    <td className="cs-td cs-td--action" onClick={e => e.stopPropagation()}>
                      <div className="cs-row-actions">
                        <button className="cs-row-btn" title="生成候选/查看证据" onClick={() => openTool(r)}><md-icon>auto_fix_high</md-icon></button>
                        <button className="cs-row-btn" title="标记无法补全" onClick={() => setRecords(p => p.map(x => x.id === r.id ? { ...x, status: '无法补全' } : x))}><md-icon>block</md-icon></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={13} className="cs-td-empty"><md-icon>check_circle</md-icon>当前筛选条件下无缺失记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 智能补全弹窗 */}
      {toolOpen && activeRecord && (
        <div className="cs-overlay" onClick={e => { if (e.target === e.currentTarget) setToolOpen(false) }}>
          <div className="cs-dialog cs-dialog--lg">
            <div className="cs-dialog-header">
              <span className="md-typescale-title-medium">智能补全 · {activeRecord.well} / {activeRecord.field}</span>
              <button className="cs-icon-btn" onClick={() => setToolOpen(false)} aria-label="关闭"><md-icon>close</md-icon></button>
            </div>
            <div className="cs-dialog-body cs-dialog-body--grid">
              <div className="cs-comp-left">
                <div className="cs-form-section-title">选择补全工具</div>
                <div className="cs-tool-list">
                  {TOOLS.map(t => (
                    <label key={t.name} className={`cs-tool-opt${t.name === activeRecord.tool ? ' cs-tool-opt--active' : ''}`}>
                      <input type="radio" name="tool" defaultChecked={t.name === activeRecord.tool} style={{ display: 'none' }} />
                      <div className="cs-tool-opt-name">{t.name}</div>
                      <div className="cs-tool-opt-desc">{t.desc}</div>
                      <div className="cs-tool-opt-config">{t.config}</div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="cs-comp-right">
                <div className="cs-form-section-title">候选预览与证据</div>
                <div className="cs-comp-preview">
                  <div className="cs-comp-preview-row"><span>缺失位置</span><b>{activeRecord.location}</b></div>
                  <div className="cs-comp-preview-row"><span>候选值</span><b className="cs-val">{activeRecord.candidate}</b></div>
                  <div className="cs-comp-preview-row"><span>置信度</span>{activeRecord.confidence > 0 ? <ConfPill level={activeRecord.confLevel} value={activeRecord.confidence} /> : <b>待生成</b>}</div>
                  <div className="cs-comp-preview-row"><span>证据来源</span><b>{activeRecord.evidence}</b></div>
                </div>
                <div className="cs-comp-chart">
                  <MiniFillChart />
                </div>
                <div className="cs-converter-hint">
                  <md-icon style={{ fontSize: 14 }}>info</md-icon>
                  补全值仅写入质检工作副本，原始空值状态保留可追溯。
                </div>
              </div>
            </div>
            <div className="cs-dialog-footer">
              <button className="cs-btn cs-btn--ghost" onClick={() => setToolOpen(false)}>取消</button>
              <button className="cs-btn cs-btn--ghost">生成候选</button>
              <button className="cs-btn cs-btn--primary" onClick={() => { setRecords(p => p.map(x => x.id === activeRecord.id ? { ...x, status: '已应用' } : x)); setToolOpen(false) }}>应用到工作副本</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfPill({ level, value }: { level: ConfLevel; value: number }) {
  const cls = level === '高' ? 'ok' : level === '中' ? 'mid' : 'low'
  return <span className={`cs-conf-pill cs-conf-pill--${cls}`}>{value}% · {level}</span>
}

function CompStatusBadge({ status }: { status: CompStatus }) {
  const map: Record<CompStatus, string> = {
    '待处理': 'cs-status--pending', '候选已生成': 'cs-status--reviewed', '已应用': 'cs-status--done', '待复核': 'cs-status--review', '无法补全': 'cs-status--ignored',
  }
  return <span className={`cs-status ${map[status]}`}>{status}</span>
}

// 补全前后迷你曲线：灰虚线=补全前，蓝实线=候选补全后
function MiniFillChart() {
  const W = 320, H = 110, padL = 8, padR = 8, padT = 10, padB = 8
  const orig = [15.2, 15.4, NaN, NaN, NaN, 15.9, 16.1, 16.0]
  const fill = [15.2, 15.4, 15.5, 15.6, 15.8, 15.9, 16.1, 16.0]
  const all = fill
  const minV = Math.min(...all) - 0.3, maxV = Math.max(...all) + 0.3
  const range = maxV - minV || 1
  const n = fill.length
  const stepX = (W - padL - padR) / (n - 1)
  const toX = (i: number) => padL + i * stepX
  const toY = (v: number) => padT + (1 - (v - minV) / range) * (H - padT - padB)
  const fillPts = fill.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="补全前后对比" style={{ display: 'block' }}>
      {/* 缺失段灰色背景 */}
      <rect x={toX(2)} y={padT} width={toX(4) - toX(2)} height={H - padT - padB} fill="#eceff1" opacity={0.7} />
      {/* 候选补全后 实线 */}
      <polyline points={fillPts} fill="none" stroke="#1565c0" strokeWidth={1.6} />
      {/* 原始有效点 */}
      {orig.map((v, i) => !isNaN(v) ? <circle key={i} cx={toX(i)} cy={toY(v)} r={2.5} fill="#37474f" /> : null)}
      {/* 补全候选点 */}
      {orig.map((v, i) => isNaN(v) ? <circle key={`f${i}`} cx={toX(i)} cy={toY(fill[i])} r={3} fill="#1565c0" stroke="#fff" strokeWidth={1} /> : null)}
    </svg>
  )
}
