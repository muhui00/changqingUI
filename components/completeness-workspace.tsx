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

const TOOLS: { name: Tool; desc: string; config: string; icon: string }[] = [
  { name: '样条插值', desc: '连续测井/时间序列', config: '最大缺口 · 边界策略 · 平滑度', icon: 'show_chart' },
  { name: '线性插值', desc: '连续时间序列', config: '最大缺口 · 边界策略', icon: 'timeline' },
  { name: 'KNN相似井', desc: '地质/工程/生产参数', config: '相似范围 · 特征字段 · K 值', icon: 'hub' },
  { name: 'MICE', desc: '多字段联合缺失', config: '参与字段 · 迭代次数 · 随机种子', icon: 'account_tree' },
  { name: '随机森林', desc: '非线性多特征', config: '训练范围 · 特征 · 模型版本', icon: 'forest' },
  { name: '物理公式', desc: '明确工程关系', config: '公式 · 依赖字段 · 单位', icon: 'functions' },
  { name: '报告抽取', desc: '大模型阅读文档抽取原始值', config: '资料来源 · 抽取模型 · 抽取指令', icon: 'auto_awesome' },
]

type ChartKind = 'spline' | 'linear' | 'knn' | 'mice' | 'rf' | 'formula' | 'report'
interface ParamControl { key: string; label: string; type: 'select' | 'input' | 'chips' | 'textarea'; options?: string[]; value: string; hint?: string }
interface ToolDetail {
  method: string
  applicable: string
  params: ParamControl[]
  candidate: string
  confidence: number
  confLevel: ConfLevel
  evidence: string
  chart: ChartKind
}

// 每个补全工具的参数配置、候选预览与可视化类型（示意值，随工具切换）
const TOOL_DETAILS: Record<Tool, ToolDetail> = {
  '样条插值': {
    method: '三次样条平滑插值', applicable: '适用于连续测井曲线、时间序列的短-中缺口',
    params: [
      { key: 'gap', label: '最大缺口', type: 'select', options: ['≤30 点', '≤50 点', '≤100 点'], value: '≤50 点' },
      { key: 'boundary', label: '边界策略', type: 'select', options: ['自然边界', '固定端点', '周期边界'], value: '自然边界' },
      { key: 'smooth', label: '平滑度 λ', type: 'select', options: ['0.2 · 贴合', '0.5 · 均衡', '0.8 · 平滑'], value: '0.5 · 均衡' },
    ],
    candidate: '14.2~15.8% 序列', confidence: 88, confLevel: '高', evidence: '相邻深度段 + 邻井T1h', chart: 'spline',
  },
  '线性插值': {
    method: '分段线性插值', applicable: '适用于变化平缓、缺口两端有效的连续序列',
    params: [
      { key: 'gap', label: '最大缺口', type: 'select', options: ['≤10 点', '≤30 点', '≤50 点'], value: '≤30 点' },
      { key: 'boundary', label: '边界策略', type: 'select', options: ['端点延拓', '端点置空'], value: '端点延拓' },
    ],
    candidate: '14.0~15.9% 线性', confidence: 76, confLevel: '中', evidence: '缺失段前后端点趋势', chart: 'linear',
  },
  'KNN相似井': {
    method: 'K 近邻相似井加权', applicable: '适用于地质/工程/生产参数的整段或全井缺失',
    params: [
      { key: 'scope', label: '相似范围', type: 'select', options: ['同区块', '同层系', '全盆地'], value: '同区块' },
      { key: 'feat', label: '特征字段', type: 'chips', options: ['井深', '孔隙度', 'GR', '邻井距离', '砂厚'], value: '井深,孔隙度,GR' },
      { key: 'k', label: 'K 值', type: 'select', options: ['3', '5', '8'], value: '5' },
    ],
    candidate: '15.1% (K=5 加权)', confidence: 82, confLevel: '高', evidence: '5 口相似井加权', chart: 'knn',
  },
  'MICE': {
    method: '多重插补链式方程', applicable: '适用于多字段同时缺失、字段间存在相关关系',
    params: [
      { key: 'fields', label: '参与字段', type: 'chips', options: ['孔隙度', '渗透率', '含气饱和度', 'GR', '声波'], value: '孔隙度,渗透率,GR' },
      { key: 'iter', label: '迭代次数', type: 'select', options: ['5', '10', '20'], value: '10' },
      { key: 'seed', label: '随机种子', type: 'input', value: '42' },
    ],
    candidate: '15.3% ± 0.6', confidence: 74, confLevel: '中', evidence: '孔渗-GR 联合回归', chart: 'mice',
  },
  '随机森林': {
    method: '随机森林回归', applicable: '适用于非线性、多特征强相关的复杂关系',
    params: [
      { key: 'train', label: '训练范围', type: 'select', options: ['本井历史', '同区块', '全区'], value: '同区块' },
      { key: 'feat', label: '特征', type: 'chips', options: ['井深', 'GR', '密度', '中子', '电阻率'], value: '井深,GR,密度,中子' },
      { key: 'ver', label: '模型版本', type: 'select', options: ['v2.3', 'v2.4-beta'], value: 'v2.3' },
    ],
    candidate: '15.0%', confidence: 80, confLevel: '高', evidence: '12 特征回归 R²=0.86', chart: 'rf',
  },
  '物理公式': {
    method: '岩石物理经验公式', applicable: '适用于依赖字段完整、存在明确工程/物理关系',
    params: [
      { key: 'formula', label: '公式', type: 'select', options: ['密度孔隙度', '声波孔隙度', '中子-密度交会'], value: '密度孔隙度' },
      { key: 'dep', label: '依赖字段', type: 'chips', options: ['体积密度', '骨架密度', '流体密度'], value: '体积密度,骨架密度,流体密度' },
      { key: 'unit', label: '单位', type: 'select', options: ['%', 'v/v'], value: '%' },
    ],
    candidate: '15.4%', confidence: 90, confLevel: '高', evidence: 'φ=(ρma−ρb)/(ρma−ρf)', chart: 'formula',
  },
  '报告抽取': {
    method: '大模型智能抽取', applicable: '由大模型阅读录井、试井、完井等文档资料，理解上下文后抽取原始值并回溯出处',
    params: [
      { key: 'source', label: '资料来源', type: 'chips', options: ['录井报告', '试井报告', '完井报告', '地质总结', '钻井日报'], value: '录井报告,完井报告' },
      { key: 'model', label: '抽取模型', type: 'select', options: ['长庆·地质大模型 v2', '通用大模型 72B', '轻量抽取模型'], value: '长庆·地质大模型 v2' },
      { key: 'prompt', label: '抽取指令', type: 'textarea', value: '抽取 2450–2478m 井段的平均孔隙度数值与量纲，并给出所在报告名称、页码与原文出处', hint: '大模型将据此理解目标并输出结构化结果与证据' },
      { key: 'threshold', label: '证据置信阈值', type: 'select', options: ['≥ 0.80', '≥ 0.90', '≥ 0.95'], value: '≥ 0.90' },
    ],
    candidate: '15.6% (录井)', confidence: 96, confLevel: '高', evidence: '录井报告 P.12 表3 · 大模型抽取', chart: 'report',
  },
}

export function CompletenessWorkspace({ datasetName = '苏里格区块2024年综合数据集', onBack, onSwitchTab }: CompletenessWorkspaceProps) {
  const [records, setRecords] = useState<MissRecord[]>(MOCK)
  const [filterType, setFilterType] = useState<MissingType | '全部'>('全部')
  const [filterStatus, setFilterStatus] = useState<CompStatus | '全部'>('全部')
  const [diagView, setDiagView] = useState<'rate' | 'matrix'>('rate')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toolOpen, setToolOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<MissRecord | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool>('样条插值')
  const [paramValues, setParamValues] = useState<Record<string, string>>({})

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

  const initParams = (tool: Tool) => {
    const next: Record<string, string> = {}
    TOOL_DETAILS[tool].params.forEach(p => { next[p.key] = p.value })
    setParamValues(next)
  }
  const openTool = (r: MissRecord) => { setActiveRecord(r); setSelectedTool(r.tool); initParams(r.tool); setToolOpen(true) }
  const switchTool = (tool: Tool) => { setSelectedTool(tool); initParams(tool) }
  const detail = TOOL_DETAILS[selectedTool]

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
                <div className="cs-tool-list" role="tablist" aria-label="补全工具">
                  {TOOLS.map(t => (
                    <button key={t.name} type="button" role="tab"
                      aria-selected={t.name === selectedTool}
                      className={`cs-tool-opt${t.name === selectedTool ? ' cs-tool-opt--active' : ''}`}
                      onClick={() => switchTool(t.name)}>
                      <div className="cs-tool-opt-head">
                        <md-icon className="cs-tool-opt-icon">{t.icon}</md-icon>
                        <div className="cs-tool-opt-name">{t.name}</div>
                        {t.name === activeRecord.tool && <span className="cs-tool-opt-rec">推荐</span>}
                      </div>
                      <div className="cs-tool-opt-desc">{t.desc}</div>
                      <div className="cs-tool-opt-config">{t.config}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="cs-comp-right">
                {/* 工具参数配置：随所选工具切换 */}
                <div className="cs-form-section-title">参数配置 · {selectedTool}</div>
                <div className="cs-tool-method">
                  <md-icon style={{ fontSize: 14 }}>{TOOLS.find(t => t.name === selectedTool)?.icon}</md-icon>
                  <div>
                    <div className="cs-tool-method-name">{detail.method}</div>
                    <div className="cs-tool-method-desc">{detail.applicable}</div>
                  </div>
                </div>
                <div className="cs-param-grid">
                  {detail.params.map(p => (
                    <div key={p.key} className={`cs-param-field${p.type === 'chips' || p.type === 'textarea' ? ' cs-param-field--wide' : ''}`}>
                      <label className="cs-param-label">{p.label}</label>
                      {p.type === 'select' ? (
                        <select className="cs-filter-select cs-param-control" value={paramValues[p.key] ?? p.value}
                          onChange={e => setParamValues(v => ({ ...v, [p.key]: e.target.value }))}>
                          {p.options!.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : p.type === 'input' ? (
                        <input className="cs-param-input cs-param-control" value={paramValues[p.key] ?? p.value}
                          onChange={e => setParamValues(v => ({ ...v, [p.key]: e.target.value }))} />
                      ) : p.type === 'textarea' ? (
                        <textarea className="cs-param-textarea cs-param-control" rows={2} value={paramValues[p.key] ?? p.value}
                          onChange={e => setParamValues(v => ({ ...v, [p.key]: e.target.value }))} />
                      ) : (
                        <div className="cs-param-chips">
                          {p.options!.map(o => {
                            const on = (paramValues[p.key] ?? p.value).split(',').includes(o)
                            return (
                              <button key={o} type="button" className={`cs-param-chip${on ? ' cs-param-chip--on' : ''}`}
                                onClick={() => setParamValues(v => {
                                  const cur = (v[p.key] ?? p.value).split(',').filter(Boolean)
                                  const nextArr = cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o]
                                  return { ...v, [p.key]: nextArr.join(',') }
                                })}>{o}</button>
                            )
                          })}
                        </div>
                      )}
                      {p.hint && <span className="cs-param-hint">{p.hint}</span>}
                    </div>
                  ))}
                </div>

                <div className="cs-form-section-title" style={{ marginTop: 4 }}>候选预览与证据</div>
                <div className="cs-comp-preview">
                  <div className="cs-comp-preview-row"><span>缺失位置</span><b>{activeRecord.location}</b></div>
                  <div className="cs-comp-preview-row"><span>候选值</span><b className="cs-val">{detail.candidate}</b></div>
                  <div className="cs-comp-preview-row"><span>置信度</span><ConfPill level={detail.confLevel} value={detail.confidence} /></div>
                  <div className="cs-comp-preview-row"><span>证据来源</span><b>{detail.evidence}</b></div>
                </div>
                <div className="cs-comp-chart">
                  <ToolViz kind={detail.chart} />
                </div>
                <div className="cs-converter-hint">
                  <md-icon style={{ fontSize: 14 }}>info</md-icon>
                  补全值仅写入质检工作副本，原始空值状态保留可追溯。
                </div>
              </div>
            </div>
            <div className="cs-dialog-footer">
              <button className="cs-btn cs-btn--ghost" onClick={() => setToolOpen(false)}>取消</button>
              <button className="cs-btn cs-btn--ghost"
                onClick={() => setRecords(p => p.map(x => x.id === activeRecord.id ? { ...x, tool: selectedTool, candidate: detail.candidate, confidence: detail.confidence, confLevel: detail.confLevel, evidence: detail.evidence, status: '候选已生成' } : x))}>
                生成候选
              </button>
              <button className="cs-btn cs-btn--primary"
                onClick={() => { setRecords(p => p.map(x => x.id === activeRecord.id ? { ...x, tool: selectedTool, candidate: detail.candidate, confidence: detail.confidence, confLevel: detail.confLevel, evidence: detail.evidence, status: '已应用' } : x)); setToolOpen(false) }}>
                应用到工作副本
              </button>
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

// 按工具类型分发不同的候选可视化
function ToolViz({ kind }: { kind: ChartKind }) {
  if (kind === 'spline') return <MiniFillChart smooth />
  if (kind === 'linear') return <MiniFillChart smooth={false} />
  if (kind === 'knn') return <KnnViz />
  if (kind === 'mice') return <MiceViz />
  if (kind === 'rf') return <RfViz />
  if (kind === 'formula') return <FormulaViz />
  return <ReportViz />
}

// KNN：相似井相似度加权
function KnnViz() {
  const wells = [
    { name: '苏36-08井', sim: 0.94, val: '15.0%' },
    { name: '苏36-15井', sim: 0.89, val: '15.3%' },
    { name: '苏37-03井', sim: 0.85, val: '14.8%' },
    { name: '苏36-09井', sim: 0.81, val: '15.2%' },
    { name: '苏37-07井', sim: 0.77, val: '15.1%' },
  ]
  return (
    <div className="cs-viz-list">
      {wells.map(w => (
        <div key={w.name} className="cs-viz-bar-row">
          <span className="cs-viz-bar-name">{w.name}</span>
          <div className="cs-viz-bar-track"><div className="cs-viz-bar-fill" style={{ width: `${w.sim * 100}%` }} /></div>
          <span className="cs-viz-bar-val">{(w.sim * 100).toFixed(0)}% · {w.val}</span>
        </div>
      ))}
    </div>
  )
}

// MICE：多次插补迭代收敛
function MiceViz() {
  const W = 320, H = 110, padL = 24, padR = 8, padT = 10, padB = 20
  const iters = [16.2, 15.6, 15.4, 15.35, 15.32, 15.31, 15.3, 15.3, 15.3, 15.3]
  const minV = 15.2, maxV = 16.3, range = maxV - minV
  const n = iters.length
  const toX = (i: number) => padL + i * (W - padL - padR) / (n - 1)
  const toY = (v: number) => padT + (1 - (v - minV) / range) * (H - padT - padB)
  const pts = iters.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="MICE 迭代收敛" style={{ display: 'block' }}>
      <line x1={padL} y1={toY(15.3)} x2={W - padR} y2={toY(15.3)} stroke="#c8e6c9" strokeDasharray="3 3" />
      <polyline points={pts} fill="none" stroke="#6a1b9a" strokeWidth={1.6} />
      {iters.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r={2.2} fill="#6a1b9a" />)}
      <text x={padL} y={H - 6} fontSize={9} fill="#78909c">迭代 1</text>
      <text x={W - padR} y={H - 6} fontSize={9} fill="#78909c" textAnchor="end">收敛 15.3%</text>
    </svg>
  )
}

// 随机森林：特征重要度
function RfViz() {
  const feats = [
    { name: 'GR', imp: 0.34 },
    { name: '密度', imp: 0.27 },
    { name: '中子', imp: 0.19 },
    { name: '井深', imp: 0.12 },
    { name: '电阻率', imp: 0.08 },
  ]
  return (
    <div className="cs-viz-list">
      {feats.map(f => (
        <div key={f.name} className="cs-viz-bar-row">
          <span className="cs-viz-bar-name">{f.name}</span>
          <div className="cs-viz-bar-track"><div className="cs-viz-bar-fill cs-viz-bar-fill--rf" style={{ width: `${f.imp / 0.34 * 100}%` }} /></div>
          <span className="cs-viz-bar-val">{(f.imp * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}

// 物理公式：公式与依赖
function FormulaViz() {
  return (
    <div className="cs-viz-formula">
      <div className="cs-viz-formula-eq">φ = (ρ<sub>ma</sub> − ρ<sub>b</sub>) / (ρ<sub>ma</sub> − ρ<sub>f</sub>)</div>
      <div className="cs-viz-formula-sub">
        <div><span>ρ<sub>ma</sub> 骨架密度</span><b>2.65 g/cm³</b></div>
        <div><span>ρ<sub>b</sub> 体积密度</span><b>2.41 g/cm³</b></div>
        <div><span>ρ<sub>f</sub> 流体密度</span><b>1.00 g/cm³</b></div>
        <div className="cs-viz-formula-res"><span>φ 计算孔隙度</span><b>15.4%</b></div>
      </div>
    </div>
  )
}

// 报告抽取：大模型智能抽取结果 + 结构化字段 + 原文证据 + 推理说明
function ReportViz() {
  return (
    <div className="cs-viz-report">
      <div className="cs-viz-report-head">
        <md-icon style={{ fontSize: 15 }}>auto_awesome</md-icon>
        大模型抽取结果
        <span className="cs-viz-report-model">长庆·地质大模型 v2</span>
      </div>
      {/* 结构化抽取结果 */}
      <div className="cs-viz-llm-fields">
        <div><span>目标字段</span><b>平均孔隙度</b></div>
        <div><span>抽取值</span><b className="cs-val">15.6 %</b></div>
        <div><span>井段</span><b>2450–2478m</b></div>
        <div><span>证据出处</span><b>录井报告 P.12 表3</b></div>
      </div>
      {/* 原文证据片段 */}
      <div className="cs-viz-report-snippet">
        “……2450–2478m 井段 <mark>平均孔隙度 15.6%</mark>，有效厚度 21.3m，
        岩性以中砂岩为主，物性中等偏好……”
      </div>
      {/* 模型推理说明 */}
      <div className="cs-viz-llm-reason">
        <md-icon style={{ fontSize: 14 }}>psychology</md-icon>
        <span>模型判断：“平均孔隙度”与目标字段语义一致，量纲为 %，且与邻井 15.1–15.8% 区间吻合，判定为高可信原始值。</span>
      </div>
      <div className="cs-viz-report-foot">证据置信 96% · 已定位页码 · 引用 1 处原文</div>
    </div>
  )
}

// 补全前后迷你曲线：灰虚线=补全前，蓝实线=候选补全后
function MiniFillChart({ smooth = true }: { smooth?: boolean }) {
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
  const pts = fill.map((v, i) => [toX(i), toY(v)] as const)
  // smooth=true 生成三次样条平滑路径；否则分段直线
  const smoothPath = () => {
    let d = `M ${pts[0][0]},${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
      const cx = (x0 + x1) / 2
      d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`
    }
    return d
  }
  const linePath = `M ${pts.map(p => `${p[0]},${p[1]}`).join(' L ')}`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="补全前后对比" style={{ display: 'block' }}>
      {/* 缺失段灰色背景 */}
      <rect x={toX(2)} y={padT} width={toX(4) - toX(2)} height={H - padT - padB} fill="#eceff1" opacity={0.7} />
      {/* 候选补全后 曲线/直线 */}
      <path d={smooth ? smoothPath() : linePath} fill="none" stroke="#1565c0" strokeWidth={1.6} />
      {/* 原始有效点 */}
      {orig.map((v, i) => !isNaN(v) ? <circle key={i} cx={toX(i)} cy={toY(v)} r={2.5} fill="#37474f" /> : null)}
      {/* 补全候选点 */}
      {orig.map((v, i) => isNaN(v) ? <circle key={`f${i}`} cx={toX(i)} cy={toY(fill[i])} r={3} fill="#1565c0" stroke="#fff" strokeWidth={1} /> : null)}
    </svg>
  )
}
