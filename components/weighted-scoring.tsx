'use client'

import { useMemo, useState } from 'react'
import { RadarChart } from './radar-chart'

// ─── 类型 ────────────────────────────────────────────────────────────────────
type SchemeStatus = '草稿' | '试算中' | '待审核' | '启用' | '停用' | '已归档'
type DimKey = 'consistency' | 'completeness' | 'distribution' | 'correlation'
type ConfigTab = 'basic' | 'weight' | 'rules' | 'grade'

interface DimConfig {
  key: DimKey
  label: string
  weight: number        // 综合权重 %
  recommended: number   // 推荐权重 %
  trialScore: number    // 当前试算维度得分 0-100
  minScore: number | null
  ruleTotal: number     // 适用规则数
  ruleConfigured: number// 已配置规则数
  enabled: boolean
}

interface Scheme {
  id: string
  name: string
  code: string
  version: string
  status: SchemeStatus
  scene: string
  owner: string
  updatedAt: string
  templateRefs: number
  taskRefs: number
  conflict?: boolean
  dims: Record<DimKey, number> // 权重摘要
}

interface GradeThreshold {
  name: string
  color: string
  min: number
  advice: string
  allowPublish: boolean
}

interface Gate {
  id: string
  name: string
  object: string
  metric: string
  op: string
  threshold: string
  result: string
  hit: boolean
  hitDetail?: string
  affected?: string
}

interface RuleScore {
  name: string
  code: string
  type: string
  required: boolean
  weight: number
  minScore: number
  trialScore: number
  coverage: number
  status: '正常' | '无数据' | '不适用' | '执行失败' | '待复核'
}

// ─── 常量 ─────────────────────────────────────────────────────────────────────
const DIM_META: { key: DimKey; label: string; color: string }[] = [
  { key: 'consistency', label: '一致性', color: '#1565c0' },
  { key: 'completeness', label: '完整性', color: '#2e7d32' },
  { key: 'distribution', label: '分布范围', color: '#e65100' },
  { key: 'correlation', label: '相关性', color: '#6a1b9a' },
]

const STATUS_CLASS: Record<SchemeStatus, string> = {
  '草稿': 'lib-badge--draft', '试算中': 'lib-badge--running', '待审核': 'lib-badge--review',
  '启用': 'lib-badge--enabled', '停用': 'lib-badge--disabled', '已归档': 'lib-badge--archived',
}

const PRESETS: { name: string; w: [number, number, number, number]; tip: string }[] = [
  { name: '均衡型', w: [25, 25, 25, 25], tip: '通用数据集' },
  { name: '入库治理型', w: [35, 35, 20, 10], tip: '强调格式、单位和缺失' },
  { name: '分析建模型', w: [20, 25, 25, 30], tip: '强调分布与关系稳定性' },
  { name: '长庆推荐型', w: [30, 25, 25, 20], tip: '当前平台默认建议' },
]

const SCHEMES: Scheme[] = [
  { id: '1', name: '致密气综合质控评分', code: 'SCORE_TIGHT_GAS', version: 'V2.1', status: '启用', scene: '陆地 / 致密气 / 全数据类型', owner: '王玉慧', updatedAt: '2026-07-28 22:15', templateRefs: 3, taskRefs: 2, dims: { consistency: 30, completeness: 25, distribution: 25, correlation: 20 } },
  { id: '2', name: '页岩气入库治理评分', code: 'SCORE_SHALE_GAS_ETL', version: 'V1.3', status: '启用', scene: '陆地 / 页岩气 / 基础数据集', owner: '张工', updatedAt: '2026-07-20 10:32', templateRefs: 2, taskRefs: 1, dims: { consistency: 35, completeness: 35, distribution: 20, correlation: 10 } },
  { id: '3', name: '煤层气分析建模评分', code: 'SCORE_CBM_MODEL', version: 'V0.4', status: '草稿', scene: '陆地 / 煤层气 / 综合数据集', owner: '李工', updatedAt: '2026-07-30 16:08', templateRefs: 0, taskRefs: 0, dims: { consistency: 20, completeness: 25, distribution: 25, correlation: 30 } },
  { id: '4', name: '通用数据质量评分', code: 'SCORE_GENERAL_V2', version: 'V2.0', status: '待审核', scene: '全部场景 / 全数据类型', owner: '赵工', updatedAt: '2026-07-25 09:14', templateRefs: 5, taskRefs: 4, dims: { consistency: 25, completeness: 25, distribution: 25, correlation: 25 } },
  { id: '5', name: '生产动态专项评分', code: 'SCORE_PROD_DYN', version: 'V1.1', status: '停用', scene: '陆地 / 生产数据集', owner: '王工', updatedAt: '2026-06-30 14:50', templateRefs: 1, taskRefs: 0, conflict: true, dims: { consistency: 20, completeness: 30, distribution: 30, correlation: 20 } },
]

const GRADES: GradeThreshold[] = [
  { name: '优秀', color: '#2e7d32', min: 90, advice: '可进入在用数据集，保留常规抽查', allowPublish: true },
  { name: '良好', color: '#1565c0', min: 80, advice: '建议抽样复核后使用', allowPublish: true },
  { name: '合格', color: '#e65100', min: 60, advice: '处理重点异常后使用', allowPublish: true },
  { name: '待整改', color: '#c62828', min: 0, advice: '提交专家审查并整改', allowPublish: false },
]

const GATES: Gate[] = [
  { id: 'g1', name: '未处理严重异常限制', object: '异常', metric: '未处理严重异常数', op: '>', threshold: '0', result: '最终等级最高为合格', hit: true, hitDetail: '实际 3 条', affected: '影响 3 口井' },
  { id: 'g2', name: '必需维度低分', object: '质量维度', metric: '任一必需维度得分', op: '<', threshold: '60', result: '最终等级为待整改', hit: false },
  { id: 'g3', name: '规则覆盖不足', object: '覆盖率', metric: '规则覆盖率', op: '<', threshold: '90%', result: '标记为暂定并禁止发布', hit: false },
  { id: 'g4', name: '强制复核未完成', object: '复核', metric: '强制复核待办数', op: '>', threshold: '0', result: '最终等级最高为合格', hit: false },
]

const RULE_SCORES: Record<DimKey, RuleScore[]> = {
  consistency: [
    { name: '完井日期格式检查', code: 'CONSISTENCY_COMPLETION_DATE_FMT', type: '通过率', required: true, weight: 30, minScore: 60, trialScore: 98.5, coverage: 100, status: '正常' },
    { name: '入地液量单位量级检查', code: 'CONSISTENCY_INJECTED_FLUID', type: '分级扣分', required: true, weight: 40, minScore: 70, trialScore: 91.2, coverage: 98, status: '正常' },
    { name: '日产气量跨源一致检查', code: 'CONSISTENCY_DAILY_GAS_XSRC', type: '通过率', required: false, weight: 30, minScore: 60, trialScore: 90.4, coverage: 95, status: '待复核' },
  ],
  completeness: [
    { name: '油层厚度缺失值检查', code: 'COMPLETE_OIL_LAYER_THICKNESS', type: '阈值评分', required: true, weight: 50, minScore: 70, trialScore: 96.3, coverage: 100, status: '正常' },
    { name: '日产气量缺失率检查', code: 'COMPLETE_DAILY_GAS_MISSRATE', type: '阈值评分', required: true, weight: 50, minScore: 60, trialScore: 93.9, coverage: 97, status: '正常' },
  ],
  distribution: [
    { name: '加砂量合理范围检查', code: 'RANGE_PROPPANT_VOLUME', type: '分级扣分', required: true, weight: 45, minScore: 60, trialScore: 88.6, coverage: 96, status: '正常' },
    { name: '孔隙度分布边界检查', code: 'RANGE_POROSITY_BOUND', type: '阈值评分', required: true, weight: 30, minScore: 60, trialScore: 92.1, coverage: 94, status: '正常' },
    { name: '产气量离群检测', code: 'RANGE_GAS_ISOFOREST', type: '模型标准分', required: false, weight: 25, minScore: 50, trialScore: 91.5, coverage: 90, status: '正常' },
  ],
  correlation: [
    { name: '孔隙度渗透率相关性检查', code: 'CORR_PORO_PERM', type: '模型标准分', required: true, weight: 55, minScore: 60, trialScore: 90.8, coverage: 93, status: '正常' },
    { name: '产气量-压力逻辑约束', code: 'CORR_GAS_PRESSURE_LOGIC', type: '人工复核分', required: false, weight: 45, minScore: 50, trialScore: 92.8, coverage: 88, status: '待复核' },
  ],
}

const TRIAL_SCORE: Record<DimKey, number> = { consistency: 93.2, completeness: 95.1, distribution: 90.8, correlation: 91.7 }

function gradeOf(score: number): GradeThreshold {
  return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1]
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export function WeightedScoring() {
  const [selectedId, setSelectedId] = useState('1')
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState<SchemeStatus | '全部状态'>('全部状态')
  const [fScene, setFScene] = useState('全部场景')
  const [onlyMine, setOnlyMine] = useState(false)

  const [configTab, setConfigTab] = useState<ConfigTab>('weight')
  const [ruleDim, setRuleDim] = useState<DimKey>('consistency')
  const [autoTrial, setAutoTrial] = useState(true)
  const [calcVersion, setCalcVersion] = useState<'enabled' | 'draft' | 'compare'>('draft')

  const selected = SCHEMES.find(s => s.id === selectedId) ?? SCHEMES[0]

  // 可编辑草稿：四维配置
  const [dims, setDims] = useState<DimConfig[]>(() => DIM_META.map((m, i) => ({
    key: m.key, label: m.label,
    weight: [30, 25, 25, 20][i],
    recommended: [30, 25, 25, 20][i],
    trialScore: TRIAL_SCORE[m.key],
    minScore: [null, null, null, null][i],
    ruleTotal: [3, 2, 3, 2][i],
    ruleConfigured: [3, 2, 3, 2][i],
    enabled: true,
  })))
  const [lockedDims, setLockedDims] = useState<Set<DimKey>>(new Set())

  // 选择方案时载入其权重摘要
  const handleSelectScheme = (s: Scheme) => {
    setSelectedId(s.id)
    setDims(prev => prev.map(d => ({ ...d, weight: s.dims[d.key], trialScore: TRIAL_SCORE[d.key], enabled: true })))
    setLockedDims(new Set())
  }

  // ── 权重计算 ──
  const totalWeight = dims.filter(d => d.enabled).reduce((s, d) => s + d.weight, 0)
  const remaining = 100 - totalWeight
  const weightValid = totalWeight === 100

  const setWeight = (key: DimKey, val: number) => {
    const v = Math.max(0, Math.min(100, Math.round(val)))
    setDims(prev => prev.map(d => d.key === key ? { ...d, weight: v } : d))
  }
  const toggleEnabled = (key: DimKey) => {
    setDims(prev => prev.map(d => d.key === key ? { ...d, enabled: !d.enabled, weight: d.enabled ? 0 : d.weight } : d))
  }
  const toggleLock = (key: DimKey) => {
    setLockedDims(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }
  const applyPreset = (w: [number, number, number, number]) => {
    setDims(prev => prev.map((d, i) => ({ ...d, weight: w[i], enabled: true })))
    setLockedDims(new Set())
  }
  const distributeRemaining = () => {
    const unlocked = dims.filter(d => d.enabled && !lockedDims.has(d.key))
    const lockedSum = dims.filter(d => d.enabled && lockedDims.has(d.key)).reduce((s, d) => s + d.weight, 0)
    const pool = 100 - lockedSum
    if (unlocked.length === 0 || pool < 0) return
    const each = Math.floor(pool / unlocked.length)
    let rem = pool - each * unlocked.length
    setDims(prev => prev.map(d => {
      if (!d.enabled || lockedDims.has(d.key)) return d
      const extra = rem > 0 ? 1 : 0; rem -= extra
      return { ...d, weight: each + extra }
    }))
  }
  const restoreRecommended = (key: DimKey) => {
    setDims(prev => prev.map(d => d.key === key ? { ...d, weight: d.recommended } : d))
  }

  // ── 综合评分 ──
  const contributions = dims.map(d => ({ ...d, contribution: d.enabled ? (d.trialScore * d.weight) / 100 : 0 }))
  const compositeRaw = contributions.reduce((s, d) => s + d.contribution, 0)
  const composite = weightValid ? compositeRaw : compositeRaw // 显示分
  const compositeDisplay = composite.toFixed(1)

  const initialGrade = gradeOf(composite)
  const hitGates = GATES.filter(g => g.hit)
  // 门槛限制最终等级（只降不升）
  let finalGrade = initialGrade
  if (hitGates.some(g => g.result.includes('待整改'))) finalGrade = GRADES.find(g => g.name === '待整改')!
  else if (hitGates.some(g => g.result.includes('合格')) && GRADES.indexOf(initialGrade) < GRADES.indexOf(GRADES.find(g => g.name === '合格')!)) {
    finalGrade = GRADES.find(g => g.name === '合格')!
  }
  const graded = finalGrade.name !== initialGrade.name
  const ruleCoverage = 96
  const recordCoverage = 98.4
  const scoreStatus: '正式' | '暂定' | '无法评分' = !weightValid ? '无法评分' : ruleCoverage < 90 ? '暂定' : '正式'
  const enabledSchemeComposite = 90.6 // 当前启用方案对比分
  const delta = +(composite - enabledSchemeComposite).toFixed(1)

  const radarDims = dims.filter(d => d.enabled).map(d => ({
    label: d.label, score: Math.round(d.trialScore), anomalyCount: 0, reviewedCount: 0,
  }))

  const filtered = useMemo(() => SCHEMES.filter(s =>
    (search === '' || s.name.includes(search) || s.code.toLowerCase().includes(search.toLowerCase())) &&
    (fStatus === '全部状态' || s.status === fStatus) &&
    (fScene === '全部场景' || s.scene.includes(fScene.replace('全部场景', ''))) &&
    (!onlyMine || s.owner === '王玉慧'),
  ), [search, fStatus, fScene, onlyMine])

  const ruleWeightTotal = RULE_SCORES[ruleDim].reduce((s, r) => s + r.weight, 0)

  return (
    <div className="sc-workbench">
      {/* 页面头部 */}
      <div className="sc-page-header">
        <div className="lib-breadcrumb md-typescale-label-medium">
          <md-icon>tune</md-icon>质控配置<md-icon class="lib-bc-sep">chevron_right</md-icon>
          <span className="lib-bc-current">综合加权评分</span>
        </div>
        <div className="sc-header-row">
          <div>
            <h1 className="md-typescale-headline-small sc-page-title">综合加权评分</h1>
            <p className="md-typescale-body-medium sc-page-subtitle">配置四维质量权重、评分等级与业务门槛，并通过真实任务结果进行试算</p>
          </div>
          <div className="sc-header-actions">
            <button className="lib-btn lib-btn--ghost"><md-icon>add</md-icon>新建方案</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>content_copy</md-icon>复制方案</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>history</md-icon>查看版本</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>save</md-icon>保存草稿</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>calculate</md-icon>试算</button>
            <button className="lib-btn lib-btn--primary" disabled={!weightValid}><md-icon>send</md-icon>提交审核</button>
          </div>
        </div>
      </div>

      {/* 三栏工作台 */}
      <div className="sc-cols">
        {/* ── A 区：评分方案区 ── */}
        <aside className="sc-scheme-panel" aria-label="评分方案区">
          <div className="sc-panel-head">
            <span className="sc-panel-title">评分方案</span>
            <span className="sc-panel-count">{filtered.length}</span>
          </div>
          <div className="sc-scheme-filters">
            <div className="lib-search-wrap sc-search">
              <md-icon>search</md-icon>
              <input className="lib-search-input" placeholder="搜索方案名称、编码..." value={search}
                onChange={e => setSearch(e.target.value)} aria-label="搜索方案" />
            </div>
            <div className="sc-filter-row">
              <select className="lib-filter-select sc-filter-sm" value={fStatus}
                onChange={e => setFStatus(e.target.value as SchemeStatus | '全部状态')} aria-label="状态">
                <option>全部状态</option>
                <option>草稿</option><option>试算中</option><option>待审核</option>
                <option>启用</option><option>停用</option><option>已归档</option>
              </select>
              <select className="lib-filter-select sc-filter-sm" value={fScene}
                onChange={e => setFScene(e.target.value)} aria-label="适用场景">
                <option>全部场景</option><option>致密气</option><option>页岩气</option>
                <option>煤层气</option><option>生产</option>
              </select>
            </div>
            <label className="sc-mine-toggle">
              <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
              仅看我的
            </label>
          </div>

          <ul className="sc-scheme-list">
            {filtered.map(s => (
              <li key={s.id}>
                <button
                  className={`sc-scheme-item${s.id === selectedId ? ' sc-scheme-item--active' : ''}`}
                  onClick={() => handleSelectScheme(s)}
                  aria-current={s.id === selectedId}
                >
                  <div className="sc-scheme-item-head">
                    <span className="sc-scheme-name">{s.name}</span>
                    <span className={`lib-badge ${STATUS_CLASS[s.status]}`}>{s.status}</span>
                  </div>
                  <div className="sc-scheme-code">{s.code} · {s.version}</div>
                  <div className="sc-scheme-scene">{s.scene}</div>
                  <div className="sc-scheme-weights" aria-label="四维权重摘要">
                    {DIM_META.map(m => (
                      <span key={m.key} className="sc-wchip" style={{ '--wc': m.color } as React.CSSProperties}>
                        {s.dims[m.key]}
                      </span>
                    ))}
                    <span className="sc-scheme-refs">模板 {s.templateRefs} · 任务 {s.taskRefs}</span>
                  </div>
                  {s.conflict && <div className="sc-conflict-tag"><md-icon>warning</md-icon>场景冲突</div>}
                  <div className="sc-scheme-meta">{s.updatedAt} · {s.owner}</div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="sc-empty"><md-icon>search_off</md-icon>未找到符合条件的方案</li>
            )}
          </ul>
        </aside>

        {/* ── B 区：评分配置区 ── */}
        <section className="sc-config-panel" aria-label="评分配置区">
          <div className="sc-config-head">
            <div className="sc-config-title-group">
              <span className="sc-config-title">{selected.name}</span>
              <span className="sc-config-sub">{selected.code} · {selected.version} · <span className={`lib-badge ${STATUS_CLASS[selected.status]}`}>{selected.status}</span></span>
            </div>
          </div>
          <div className="sc-tabs" role="tablist">
            {([['basic', '基础与适用范围'], ['weight', '四维权重'], ['rules', '维度内评分'], ['grade', '等级与门槛']] as const).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={configTab === k}
                className={`sc-tab${configTab === k ? ' sc-tab--active' : ''}`} onClick={() => setConfigTab(k as ConfigTab)}>
                {label}
              </button>
            ))}
          </div>

          <div className="sc-config-body">
            {/* 页签一：基础与适用范围 */}
            {configTab === 'basic' && (
              <div className="sc-tab-panel">
                <div className="sc-section-title"><span className="sc-bar sc-bar--primary" />基础信息</div>
                <div className="sc-form-grid">
                  <div className="sc-field"><label className="sc-label">方案名称<span className="sc-req">*</span></label>
                    <input className="sc-input" defaultValue={selected.name} /></div>
                  <div className="sc-field"><label className="sc-label">方案编码<span className="sc-req">*</span></label>
                    <input className="sc-input sc-input--mono" defaultValue={selected.code} disabled={selected.status === '启用'} />
                    {selected.status === '启用' && <span className="sc-hint">启用后编码不可修改</span>}</div>
                  <div className="sc-field"><label className="sc-label">方案版本</label>
                    <input className="sc-input" defaultValue={selected.version} disabled /></div>
                  <div className="sc-field"><label className="sc-label">方案责任人<span className="sc-req">*</span></label>
                    <select className="sc-select" defaultValue={selected.owner}><option>王玉慧</option><option>张工</option><option>李工</option><option>赵工</option></select></div>
                  <div className="sc-field sc-field--full"><label className="sc-label">方案说明<span className="sc-req">*</span></label>
                    <textarea className="sc-textarea" rows={2} defaultValue="用于致密气综合数据集的统一质量评分口径，覆盖一致性、完整性、分布范围与相关性四个维度。" /></div>
                </div>

                <div className="sc-section-title"><span className="sc-bar sc-bar--success" />适用范围</div>
                <div className="sc-form-grid">
                  <div className="sc-field"><label className="sc-label">数据集类型</label>
                    <select className="sc-select"><option>全部</option><option>综合数据集</option><option>基础数据集</option></select></div>
                  <div className="sc-field"><label className="sc-label">储层类型</label>
                    <select className="sc-select"><option>致密气</option><option>页岩气</option><option>煤层气</option></select></div>
                  <div className="sc-field"><label className="sc-label">海/陆</label>
                    <select className="sc-select"><option>陆地</option><option>海上</option><option>全部</option></select></div>
                  <div className="sc-field"><label className="sc-label">井型</label>
                    <select className="sc-select"><option>全部井型</option><option>水平井</option><option>直井</option></select></div>
                  <div className="sc-field"><label className="sc-label">生效日期</label>
                    <input className="sc-input" defaultValue="长期" /></div>
                  <div className="sc-field"><label className="sc-label">方案优先级</label>
                    <input className="sc-input" type="number" defaultValue={100} /></div>
                </div>
                <label className="sc-switch-row">
                  <span className="sc-switch"><input type="checkbox" /><span className="sc-switch-thumb" /></span>
                  设为默认方案（未命中专用方案时使用）
                </label>
              </div>
            )}

            {/* 页签二：四维权重 */}
            {configTab === 'weight' && (
              <div className="sc-tab-panel">
                {/* 权重总览 */}
                <div className={`sc-weight-overview${weightValid ? '' : ' sc-weight-overview--invalid'}`}>
                  <div className="sc-wo-item">
                    <span className="sc-wo-label">当前总权重</span>
                    <span className={`sc-wo-value${weightValid ? '' : ' sc-wo-value--error'}`}>{totalWeight}%</span>
                  </div>
                  <div className="sc-wo-item">
                    <span className="sc-wo-label">剩余可分配</span>
                    <span className="sc-wo-value">{remaining}%</span>
                  </div>
                  <div className="sc-wo-item">
                    <span className="sc-wo-label">权重校验</span>
                    <span className={`sc-wo-flag ${weightValid ? 'sc-wo-flag--ok' : 'sc-wo-flag--err'}`}>
                      <md-icon>{weightValid ? 'check_circle' : 'error'}</md-icon>{weightValid ? '有效' : '需为100%'}
                    </span>
                  </div>
                  <div className="sc-wo-spacer" />
                  <button className="sc-mini-btn" onClick={distributeRemaining}><md-icon>balance</md-icon>平均分配剩余</button>
                </div>

                {/* 推荐预设 */}
                <div className="sc-preset-row">
                  <span className="sc-preset-label">推荐预设：</span>
                  {PRESETS.map(p => (
                    <button key={p.name} className="sc-preset-chip" title={p.tip} onClick={() => applyPreset(p.w)}>
                      {p.name}<span className="sc-preset-w">{p.w.join('/')}</span>
                    </button>
                  ))}
                </div>

                {/* 维度权重表 */}
                <div className="sc-weight-table">
                  <div className="sc-wt-head">
                    <span className="sc-wt-c-dim">质量维度</span>
                    <span className="sc-wt-c-on">参与</span>
                    <span className="sc-wt-c-slider">权重</span>
                    <span className="sc-wt-c-num">推荐</span>
                    <span className="sc-wt-c-num">规则</span>
                    <span className="sc-wt-c-num">试算分</span>
                    <span className="sc-wt-c-num">贡献分</span>
                    <span className="sc-wt-c-act">操作</span>
                  </div>
                  {contributions.map(d => (
                    <div key={d.key} className={`sc-wt-row${d.enabled ? '' : ' sc-wt-row--off'}`}>
                      <span className="sc-wt-c-dim">
                        <span className="sc-dim-dot" style={{ background: DIM_META.find(m => m.key === d.key)!.color }} />
                        {d.label}
                        {d.ruleTotal === 0 && <span className="sc-dim-warn">无适用规则</span>}
                      </span>
                      <span className="sc-wt-c-on">
                        <span className={`sc-switch${d.enabled ? ' sc-switch--on' : ''}`} role="switch" aria-checked={d.enabled}
                          onClick={() => toggleEnabled(d.key)} tabIndex={0}><span className="sc-switch-thumb" /></span>
                      </span>
                      <span className="sc-wt-c-slider">
                        <input type="range" min={0} max={100} step={1} value={d.weight} disabled={!d.enabled}
                          className="sc-slider" aria-label={`${d.label}权重`}
                          style={{ '--fill': `${d.weight}%`, '--wc': DIM_META.find(m => m.key === d.key)!.color } as React.CSSProperties}
                          onChange={e => setWeight(d.key, +e.target.value)} />
                        <input type="number" min={0} max={100} value={d.weight} disabled={!d.enabled}
                          className="sc-weight-num" aria-label={`${d.label}权重数值`}
                          onChange={e => setWeight(d.key, +e.target.value)} />
                        <span className="sc-weight-pct">%</span>
                        <button className={`sc-lock-btn${lockedDims.has(d.key) ? ' sc-lock-btn--on' : ''}`}
                          onClick={() => toggleLock(d.key)} title={lockedDims.has(d.key) ? '解锁' : '锁定'} disabled={!d.enabled}>
                          <md-icon>{lockedDims.has(d.key) ? 'lock' : 'lock_open'}</md-icon>
                        </button>
                      </span>
                      <span className="sc-wt-c-num sc-muted">{d.recommended}%</span>
                      <span className="sc-wt-c-num sc-muted">{d.ruleTotal}/{d.ruleConfigured}</span>
                      <span className="sc-wt-c-num sc-num-strong">{d.trialScore.toFixed(1)}</span>
                      <span className="sc-wt-c-num sc-num-primary">{d.contribution.toFixed(2)}</span>
                      <span className="sc-wt-c-act">
                        <button className="sc-icon-btn" title="恢复推荐值" onClick={() => restoreRecommended(d.key)}><md-icon>restart_alt</md-icon></button>
                      </span>
                    </div>
                  ))}
                  <div className="sc-wt-foot">
                    <span className="sc-wt-c-dim">合计</span>
                    <span className="sc-wt-c-on" />
                    <span className={`sc-wt-c-slider sc-wt-total${weightValid ? '' : ' sc-wt-total--err'}`}>{totalWeight}%</span>
                    <span className="sc-wt-c-num" /><span className="sc-wt-c-num" /><span className="sc-wt-c-num" />
                    <span className="sc-wt-c-num sc-num-primary">{compositeRaw.toFixed(2)}</span>
                    <span className="sc-wt-c-act" />
                  </div>
                </div>
                <p className="sc-note"><md-icon>info</md-icon>雷达图展示维度原始得分（质量表现），贡献分为「维度得分 × 权重」（对总分的贡献），二者含义不同。</p>
              </div>
            )}

            {/* 页签三：维度内评分 */}
            {configTab === 'rules' && (
              <div className="sc-tab-panel">
                <div className="sc-dim-switch" role="tablist">
                  {DIM_META.map(m => {
                    const rs = RULE_SCORES[m.key]
                    const wt = rs.reduce((s, r) => s + r.weight, 0)
                    const avg = rs.reduce((s, r) => s + r.trialScore, 0) / rs.length
                    return (
                      <button key={m.key} role="tab" aria-selected={ruleDim === m.key}
                        className={`sc-dim-tab${ruleDim === m.key ? ' sc-dim-tab--active' : ''}`}
                        onClick={() => setRuleDim(m.key)} style={{ '--wc': m.color } as React.CSSProperties}>
                        <span className="sc-dim-tab-name">{m.label}</span>
                        <span className="sc-dim-tab-meta">{rs.length}条 · 权重{wt}% · {avg.toFixed(1)}分</span>
                      </button>
                    )
                  })}
                </div>

                {ruleWeightTotal !== 100 && (
                  <div className="sc-inline-warn"><md-icon>error</md-icon>当前维度规则权重合计为 {ruleWeightTotal}%，需调整为 100%。</div>
                )}

                <div className="sc-source-mode">
                  <span className="sc-source-label">规则来源：</span>
                  <label className="sc-radio"><input type="radio" name="src" defaultChecked />跟随质控模板</label>
                  <label className="sc-radio"><input type="radio" name="src" />固定规则清单</label>
                </div>

                <table className="sc-rule-table">
                  <thead>
                    <tr>
                      <th>规则名称 / 编码</th><th>得分模型</th><th>必需</th>
                      <th className="sc-th-num">维度内权重</th><th className="sc-th-num">最低分</th>
                      <th className="sc-th-num">试算分</th><th className="sc-th-num">贡献分</th>
                      <th className="sc-th-num">覆盖率</th><th>状态</th><th className="sc-th-act">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RULE_SCORES[ruleDim].map(r => (
                      <tr key={r.code}>
                        <td>
                          <div className="sc-rule-name">{r.name}</div>
                          <div className="sc-rule-code">{r.code}</div>
                        </td>
                        <td><span className="sc-model-tag">{r.type}</span></td>
                        <td>{r.required ? <span className="sc-req-yes">必需</span> : <span className="sc-muted">可选</span>}</td>
                        <td className="sc-td-num"><span className="sc-rule-weight">{r.weight}%</span></td>
                        <td className="sc-td-num sc-muted">{r.minScore}</td>
                        <td className="sc-td-num sc-num-strong">{r.trialScore.toFixed(1)}</td>
                        <td className="sc-td-num sc-num-primary">{((r.trialScore * r.weight) / 100).toFixed(2)}</td>
                        <td className="sc-td-num">
                          <span className={`sc-cov${r.coverage < 90 ? ' sc-cov--low' : ''}`}>{r.coverage}%</span>
                        </td>
                        <td>
                          <span className={`sc-rule-status sc-rule-status--${r.status === '正常' ? 'ok' : r.status === '待复核' ? 'review' : 'err'}`}>{r.status}</span>
                        </td>
                        <td className="sc-td-act">
                          <button className="sc-icon-btn" title="查看得分明细"><md-icon>receipt_long</md-icon></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>合计</td>
                      <td className={`sc-td-num${ruleWeightTotal !== 100 ? ' sc-td-num--err' : ''}`}>{ruleWeightTotal}%</td>
                      <td colSpan={6} />
                    </tr>
                  </tfoot>
                </table>

                <div className="sc-weight-alloc">
                  <span className="sc-source-label">权重分配：</span>
                  <button className="sc-mini-btn">等权重</button>
                  <button className="sc-mini-btn">按规则重要性</button>
                  <button className="sc-mini-btn">自定义</button>
                </div>
              </div>
            )}

            {/* 页签四：等级与门槛 */}
            {configTab === 'grade' && (
              <div className="sc-tab-panel">
                <div className="sc-section-title"><span className="sc-bar sc-bar--primary" />等级阈值</div>
                <table className="sc-grade-table">
                  <thead>
                    <tr><th>等级</th><th className="sc-th-num">最低分</th><th className="sc-th-num">最高分</th><th>区间</th><th>处置建议</th><th>允许发布</th></tr>
                  </thead>
                  <tbody>
                    {GRADES.map((g, i) => {
                      const max = i === 0 ? 100 : GRADES[i - 1].min
                      return (
                        <tr key={g.name}>
                          <td><span className="sc-grade-tag" style={{ '--gc': g.color } as React.CSSProperties}>{g.name}</span></td>
                          <td className="sc-td-num"><input className="sc-mini-input" defaultValue={g.min} /></td>
                          <td className="sc-td-num sc-muted">{max}</td>
                          <td className="sc-input--mono sc-muted">{i === 0 ? `[${g.min}, ${max}]` : `[${g.min}, ${max})`}</td>
                          <td className="sc-grade-advice">{g.advice}</td>
                          <td>
                            <span className={`sc-switch${g.allowPublish ? ' sc-switch--on' : ''}`} role="switch" aria-checked={g.allowPublish}>
                              <span className="sc-switch-thumb" />
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="sc-section-title"><span className="sc-bar sc-bar--warning" />评分门槛</div>
                <table className="sc-gate-table">
                  <thead>
                    <tr><th>门槛名称</th><th>检查对象</th><th>条件</th><th>结果</th><th>状态</th></tr>
                  </thead>
                  <tbody>
                    {GATES.map(g => (
                      <tr key={g.id} className={g.hit ? 'sc-gate-row--hit' : ''}>
                        <td>{g.name}</td>
                        <td className="sc-muted">{g.object}</td>
                        <td className="sc-input--mono">{g.metric} {g.op} {g.threshold}</td>
                        <td><span className="sc-gate-result">{g.result}</span></td>
                        <td><span className="sc-switch sc-switch--on" role="switch" aria-checked="true"><span className="sc-switch-thumb" /></span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="sc-section-title"><span className="sc-bar sc-bar--error" />缺失与复核策略</div>
                <div className="sc-form-grid">
                  <div className="sc-field"><label className="sc-label">未执行维度</label>
                    <select className="sc-select"><option>阻止正式评分（严格模式）</option><option>暂定评分</option><option>计零</option></select></div>
                  <div className="sc-field"><label className="sc-label">执行失败</label>
                    <select className="sc-select"><option>阻止正式评分</option></select></div>
                  <div className="sc-field"><label className="sc-label">不适用维度</label>
                    <select className="sc-select"><option>剩余维度权重归一化</option><option>阻止评分</option></select></div>
                  <div className="sc-field"><label className="sc-label">待复核记录</label>
                    <select className="sc-select"><option>不影响分值但限制等级</option><option>按规则暂扣分</option><option>阻止发布</option></select></div>
                </div>
                <div className="sc-explain">
                  <md-icon>lightbulb</md-icon>
                  综合分按四个维度加权计算。存在未处理严重异常时，最终等级最高为「合格」；规则覆盖率低于 90% 时仅生成暂定评分。
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── C 区：试算预览区 ── */}
        <aside className="sc-preview-panel" aria-label="试算预览区">
          <div className="sc-panel-head">
            <span className="sc-panel-title">试算预览</span>
            <label className="sc-auto-toggle">
              <input type="checkbox" checked={autoTrial} onChange={e => setAutoTrial(e.target.checked)} />
              自动试算
            </label>
          </div>

          {/* 预览数据选择 */}
          <div className="sc-preview-select">
            <div className="sc-field"><label className="sc-label">预览对象</label>
              <select className="sc-select"><option>LGPC1-14-3H 综合质控任务 · 2026-07-28</option><option>苏里格2024综合数据集 v3.2</option></select></div>
            <div className="sc-preview-select-row">
              <select className="sc-select sc-select--sm"><option>数据集粒度</option><option>井组</option><option>单井</option></select>
              <select className="sc-select sc-select--sm" value={calcVersion} onChange={e => setCalcVersion(e.target.value as typeof calcVersion)}>
                <option value="enabled">当前启用</option>
                <option value="draft">当前草稿</option>
                <option value="compare">两版本对比</option>
              </select>
            </div>
            <div className="sc-preview-meta">数据集 v3.2 · 完成于 07-28 22:16 · 四维完整 · 覆盖 128 口井 / 45,320 条记录</div>
          </div>

          {/* 综合评分卡 */}
          <div className={`sc-score-card${scoreStatus === '暂定' ? ' sc-score-card--tentative' : ''}`}>
            <div className="sc-score-main">
              <div className="sc-score-num-wrap">
                <span className="sc-score-num">{compositeDisplay}</span>
                <span className="sc-score-unit">分</span>
              </div>
              <div className="sc-score-grades">
                <div className="sc-score-grade-row">
                  <span className="sc-score-grade-label">初始等级</span>
                  <span className="sc-grade-tag" style={{ '--gc': initialGrade.color } as React.CSSProperties}>{initialGrade.name}</span>
                </div>
                <div className="sc-score-grade-row">
                  <span className="sc-score-grade-label">最终等级</span>
                  <span className="sc-grade-tag" style={{ '--gc': finalGrade.color } as React.CSSProperties}>{finalGrade.name}</span>
                  {graded && <md-icon class="sc-grade-down">arrow_downward</md-icon>}
                </div>
              </div>
            </div>
            <div className="sc-score-stats">
              <div className="sc-score-stat">
                <span className="sc-score-stat-label">评分状态</span>
                <span className={`sc-score-stat-value sc-status-${scoreStatus === '正式' ? 'ok' : scoreStatus === '暂定' ? 'warn' : 'err'}`}>{scoreStatus}</span>
              </div>
              <div className="sc-score-stat">
                <span className="sc-score-stat-label">规则覆盖率</span>
                <span className="sc-score-stat-value">{ruleCoverage}%</span>
              </div>
              <div className="sc-score-stat">
                <span className="sc-score-stat-label">记录覆盖率</span>
                <span className="sc-score-stat-value">{recordCoverage}%</span>
              </div>
              <div className="sc-score-stat">
                <span className="sc-score-stat-label">较启用方案</span>
                <span className={`sc-score-stat-value ${delta >= 0 ? 'sc-delta-up' : 'sc-delta-down'}`}>{delta >= 0 ? '+' : ''}{delta}</span>
              </div>
            </div>
            {graded && (
              <div className="sc-score-limit">
                <md-icon>gpp_maybe</md-icon>
                综合分达到{initialGrade.name}，但存在 3 条未处理严重异常，最终等级限制为{finalGrade.name}。
              </div>
            )}
          </div>

          {/* 四维雷达图 */}
          <div className="sc-preview-block">
            <div className="sc-block-title">四维质量雷达图</div>
            <div className="sc-radar-wrap">
              <RadarChart dimensions={radarDims} size={200} />
            </div>
            <div className="sc-radar-legend">
              {dims.filter(d => d.enabled).map(d => (
                <span key={d.key} className="sc-radar-legend-item">
                  <span className="sc-dim-dot" style={{ background: DIM_META.find(m => m.key === d.key)!.color }} />
                  {d.label} {d.trialScore.toFixed(1)}
                </span>
              ))}
            </div>
          </div>

          {/* 分值贡献图 */}
          <div className="sc-preview-block">
            <div className="sc-block-title">分值贡献（权重后）</div>
            <div className="sc-contrib-list">
              {contributions.filter(d => d.enabled).map(d => (
                <div key={d.key} className="sc-contrib-row">
                  <span className="sc-contrib-label">{d.label}</span>
                  <div className="sc-contrib-track">
                    <div className="sc-contrib-fill" style={{ width: `${(d.contribution / 30) * 100}%`, background: DIM_META.find(m => m.key === d.key)!.color }} />
                  </div>
                  <span className="sc-contrib-val">{d.contribution.toFixed(2)}</span>
                  <span className="sc-contrib-w">{d.weight}%</span>
                </div>
              ))}
              <div className="sc-contrib-row sc-contrib-row--total">
                <span className="sc-contrib-label">综合</span>
                <div className="sc-contrib-track" />
                <span className="sc-contrib-val sc-num-primary">{compositeDisplay}</span>
                <span className="sc-contrib-w">100%</span>
              </div>
            </div>
          </div>

          {/* 门槛与解释 */}
          <div className="sc-preview-block">
            <div className="sc-block-title">命中门槛 <span className="sc-block-count">{hitGates.length}</span></div>
            {hitGates.length === 0 && <div className="sc-no-gate">未命中任何门槛，最终等级由综合分决定。</div>}
            {hitGates.map(g => (
              <div key={g.id} className="sc-gate-hit">
                <div className="sc-gate-hit-head">
                  <md-icon>gpp_maybe</md-icon>
                  <span className="sc-gate-hit-name">{g.name}</span>
                </div>
                <div className="sc-gate-hit-body">
                  <span className="sc-gate-hit-metric">{g.metric} {g.op} {g.threshold} · {g.hitDetail}</span>
                  <span className="sc-gate-hit-result">{g.result} · {g.affected}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
