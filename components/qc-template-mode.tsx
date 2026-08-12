'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { RadarChart } from './radar-chart'

// ─── 类型 ────────────────────────────────────────────────────────────────────
export type TemplateStatus = '草稿' | '试算中' | '待审核' | '已启用' | '停用' | '已归档'
type TplTab = 'basic' | 'matrix' | 'calib' | 'review' | 'binding'
type PreviewTab = 'sample' | 'dist' | 'hit' | 'workload' | 'score'
type CellSource = '继承' | '区块覆盖' | '替换'

interface Template {
  id: string
  name: string
  code: string
  version: string
  status: TemplateStatus
  type: '平台基线' | '油田级' | '区块级' | '专项场景'
  field: string
  block: string
  seam: string
  wellType: string
  stage: string
  parent?: string
  ruleCoverage: string   // e.g. 58/58
  paramOverride: number
  sampleWells: number
  calibratedAt: string
  scheme: string         // 绑定评分方案
  trialScore: number
  trialGrade: string
  reviewWells: number
  priority: number
  owner: string
  updatedAt: string
  conflict?: boolean
}

interface MatrixField {
  code: string
  name: string
  version: string
  type: string
  unit: string
  category: string
  completeness: { ver: string; src: CellSource }
  consistency: { ver: string; src: CellSource }
  distribution: { ver: string; src: CellSource }
  correlation: { ver: string; src: CellSource } | null
  disposition: string
  review: '必审' | '抽样' | '留痕'
}

interface CalibParam {
  name: string
  inherited: string
  suggested: string
  adopted: string
  basis: string
  changed: boolean
}

// ─── 常量数据 ─────────────────────────────────────────────────────────────────
const TPL_STATUS_CLASS: Record<TemplateStatus, string> = {
  '草稿': 'lib-badge--draft', '试算中': 'lib-badge--running', '待审核': 'lib-badge--review',
  '已启用': 'lib-badge--enabled', '停用': 'lib-badge--disabled', '已归档': 'lib-badge--archived',
}

const TEMPLATES: Template[] = [
  {
    id: 't1', name: '区块A水平井压裂质检模板', code: 'TPL_BLOCK_A_HZ', version: 'V1.2', status: '已启用',
    type: '区块级', field: '长庆油田', block: '苏里格区块A', seam: '盒8+山1', wellType: '水平井', stage: '压前+压中',
    parent: '致密气油田级基线 V2.0', ruleCoverage: '58/58', paramOverride: 18, sampleWells: 126, calibratedAt: '2026-07-26',
    scheme: '致密气综合质检评分 V2.1', trialScore: 92.8, trialGrade: '合格', reviewWells: 34, priority: 90,
    owner: '王玉慧', updatedAt: '2026-07-28 22:15',
  },
  {
    id: 't2', name: '区块B直井压后质检模板', code: 'TPL_BLOCK_B_VT', version: 'V1.0', status: '已启用',
    type: '区块级', field: '长庆油田', block: '苏里格区块B', seam: '盒8', wellType: '直井', stage: '压后',
    parent: '致密气油田级基线 V2.0', ruleCoverage: '54/58', paramOverride: 11, sampleWells: 88, calibratedAt: '2026-07-18',
    scheme: '致密气综合质检评分 V2.1', trialScore: 88.4, trialGrade: '良好', reviewWells: 22, priority: 80,
    owner: '张工', updatedAt: '2026-07-20 10:32',
  },
  {
    id: 't3', name: '致密气油田级基线', code: 'TPL_TIGHT_GAS_BASE', version: 'V2.0', status: '已启用',
    type: '油田级', field: '长庆油田', block: '全区块', seam: '全层系', wellType: '全井型', stage: '全周期',
    ruleCoverage: '58/58', paramOverride: 0, sampleWells: 512, calibratedAt: '2026-06-30',
    scheme: '通用数据质量评分 V2.0', trialScore: 90.1, trialGrade: '优秀', reviewWells: 120, priority: 50,
    owner: '赵工', updatedAt: '2026-06-30 14:50',
  },
  {
    id: 't4', name: '页岩气水平井专项模板', code: 'TPL_SHALE_HZ_SPEC', version: 'V0.3', status: '草稿',
    type: '专项场景', field: '长庆油田', block: '页岩气示范区', seam: '长7', wellType: '水平井', stage: '压中',
    parent: '页岩气油田级基线 V1.1', ruleCoverage: '46/58', paramOverride: 9, sampleWells: 42, calibratedAt: '2026-07-30',
    scheme: '', trialScore: 0, trialGrade: '—', reviewWells: 0, priority: 100,
    owner: '李工', updatedAt: '2026-07-30 16:08',
  },
  {
    id: 't5', name: '区块C重复施工试验模板', code: 'TPL_BLOCK_C_REPEAT', version: 'V1.1', status: '停用',
    type: '专项场景', field: '长庆油田', block: '苏里格区块C', seam: '盒8', wellType: '定向井', stage: '压前',
    parent: '致密气油田级基线 V2.0', ruleCoverage: '50/58', paramOverride: 7, sampleWells: 31, calibratedAt: '2026-05-22',
    scheme: '生产动态专项评分 V1.1', trialScore: 79.6, trialGrade: '合格', reviewWells: 12, priority: 70,
    owner: '王工', updatedAt: '2026-06-11 09:14', conflict: true,
  },
]

const MATRIX_FIELDS: MatrixField[] = [
  { code: 'WELL_COMPLETION_DATE', name: '完井日期', version: 'v2.1', type: '日期', unit: '-', category: '基础',
    completeness: { ver: 'C-COMP-01 v2', src: '继承' }, consistency: { ver: 'C-FMT-03 v2', src: '继承' },
    distribution: { ver: 'C-RANGE-02 v1', src: '继承' }, correlation: null, disposition: '标记待核', review: '留痕' },
  { code: 'POROSITY', name: '孔隙度', version: 'v3.0', type: '数值', unit: '%', category: '地质',
    completeness: { ver: 'C-COMP-02 v2', src: '继承' }, consistency: { ver: 'C-UNIT-01 v2', src: '继承' },
    distribution: { ver: 'R-DYN-05 v3', src: '区块覆盖' }, correlation: { ver: 'CORR-PP v2', src: '区块覆盖' }, disposition: '转专家复核', review: '抽样' },
  { code: 'PERMEABILITY', name: '渗透率', version: 'v3.0', type: '数值', unit: 'mD', category: '地质',
    completeness: { ver: 'C-COMP-02 v2', src: '继承' }, consistency: { ver: 'C-UNIT-02 v2', src: '继承' },
    distribution: { ver: 'R-DYN-06 v3', src: '区块覆盖' }, correlation: { ver: 'CORR-PP v2', src: '区块覆盖' }, disposition: '转专家复核', review: '抽样' },
  { code: 'PROPPANT_VOLUME', name: '加砂量', version: 'v2.2', type: '数值', unit: 't', category: '工程',
    completeness: { ver: 'C-COMP-03 v1', src: '继承' }, consistency: { ver: 'C-UNIT-03 v2', src: '继承' },
    distribution: { ver: 'R-DYN-11 v2', src: '区块覆盖' }, correlation: { ver: 'CORR-PV v1', src: '替换' }, disposition: '标记待核', review: '抽样' },
  { code: 'INJECTED_FLUID', name: '入地液量', version: 'v2.2', type: '数值', unit: 'm³', category: '工程',
    completeness: { ver: 'C-COMP-03 v1', src: '继承' }, consistency: { ver: 'C-MAG-01 v2', src: '区块覆盖' },
    distribution: { ver: 'R-DYN-12 v2', src: '区块覆盖' }, correlation: { ver: 'CORR-FV v1', src: '继承' }, disposition: '标记待核', review: '抽样' },
  { code: 'DAILY_GAS', name: '日产气量', version: 'v3.1', type: '数值', unit: '10⁴m³/d', category: '生产',
    completeness: { ver: 'C-COMP-04 v2', src: '继承' }, consistency: { ver: 'C-XSRC-01 v1', src: '继承' },
    distribution: { ver: 'R-ISO-02 v3', src: '继承' }, correlation: { ver: 'CORR-GP v2', src: '继承' }, disposition: '标记待核', review: '必审' },
  { code: 'CONSTRUCTION_PRESSURE', name: '施工压力', version: 'v2.0', type: '时序', unit: 'MPa', category: '压中时序',
    completeness: { ver: 'C-TS-01 v2', src: '继承' }, consistency: { ver: 'C-TS-FMT v2', src: '继承' },
    distribution: { ver: 'TS-ENV-03 v2', src: '区块覆盖' }, correlation: { ver: 'CORR-TS v1', src: '继承' }, disposition: '转专家复核', review: '必审' },
  { code: 'OIL_LAYER_THICKNESS', name: '油层厚度', version: 'v2.4', type: '数值', unit: 'm', category: '地质',
    completeness: { ver: 'C-COMP-05 v2', src: '区块覆盖' }, consistency: { ver: 'C-UNIT-04 v2', src: '继承' },
    distribution: { ver: 'R-DYN-08 v2', src: '继承' }, correlation: null, disposition: '标记待核', review: '留痕' },
]

const CALIB_PARAMS: CalibParam[] = [
  { name: '动态下界 P10', inherited: '5.2 %', suggested: '5.8 %', adopted: '5.8 %', basis: '区块A样本 P10（126 井）', changed: true },
  { name: '动态上界 P90', inherited: '18.4 %', suggested: '17.6 %', adopted: '17.6 %', basis: '区块A样本 P90（126 井）', changed: true },
  { name: 'IQR 倍数', inherited: '1.5 / 3.0', suggested: '1.5 / 3.0', adopted: '1.5 / 3.0', basis: '沿用平台默认', changed: false },
  { name: '最小样本量', inherited: '30', suggested: '30', adopted: '40', basis: '专家提高至 40 以增强稳健性', changed: true },
  { name: '相关性容差', inherited: '±0.12', suggested: '±0.09', adopted: '±0.10', basis: 'P95 残差 0.094，取整', changed: true },
  { name: '时序包络分位', inherited: '父模板值', suggested: 'P5–P95 区块带', adopted: 'P5–P95 区块带', basis: '按压裂阶段分段生成', changed: true },
  { name: '设备设计上限', inherited: '95 MPa', suggested: '95 MPa', adopted: '95 MPa', basis: '关联压裂车组台账', changed: false },
]

const RADAR_DIMS = [
  { label: '一致性', score: 93, anomalyCount: 0, reviewedCount: 0 },
  { label: '完整性', score: 95, anomalyCount: 0, reviewedCount: 0 },
  { label: '分布范围', score: 91, anomalyCount: 0, reviewedCount: 0 },
  { label: '相关性', score: 92, anomalyCount: 0, reviewedCount: 0 },
]

const CELL_SRC_CLASS: Record<CellSource, string> = {
  '继承': 'sc-cell-tag--inherit', '区块覆盖': 'sc-cell-tag--override', '替换': 'sc-cell-tag--replace',
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────
export function QCTemplateMode({ modeSwitch }: { modeSwitch: ReactNode }) {
  const [selectedId, setSelectedId] = useState('t1')
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState<'全部状态' | TemplateStatus>('全部状态')
  const [fType, setFType] = useState('全部类型')
  const [tab, setTab] = useState<TplTab>('basic')
  const [previewTab, setPreviewTab] = useState<PreviewTab>('score')
  const [catFilter, setCatFilter] = useState('全部')

  const selected = TEMPLATES.find(t => t.id === selectedId) ?? TEMPLATES[0]

  const filtered = useMemo(() => TEMPLATES.filter(t =>
    (search === '' || t.name.includes(search) || t.code.toLowerCase().includes(search.toLowerCase())) &&
    (fStatus === '全部状态' || t.status === fStatus) &&
    (fType === '全部类型' || t.type === fType),
  ), [search, fStatus, fType])

  const categories = ['全部', ...Array.from(new Set(MATRIX_FIELDS.map(f => f.category)))]
  const matrixFields = catFilter === '全部' ? MATRIX_FIELDS : MATRIX_FIELDS.filter(f => f.category === catFilter)

  // 覆盖摘要
  const total = MATRIX_FIELDS.length
  const full44 = MATRIX_FIELDS.filter(f => f.correlation !== null).length
  const inherited = MATRIX_FIELDS.reduce((s, f) => s + [f.completeness, f.consistency, f.distribution, f.correlation].filter(c => c && c.src === '继承').length, 0)
  const overridden = MATRIX_FIELDS.reduce((s, f) => s + [f.completeness, f.consistency, f.distribution, f.correlation].filter(c => c && c.src === '区块覆盖').length, 0)
  const replaced = MATRIX_FIELDS.reduce((s, f) => s + [f.completeness, f.consistency, f.distribution, f.correlation].filter(c => c && c.src === '替换').length, 0)

  const renderCell = (c: { ver: string; src: CellSource } | null) => {
    if (!c) return <span className="sc-cell-empty">—</span>
    return (
      <span className="sc-cell">
        <span className="sc-cell-ver">{c.ver}</span>
        <span className={`sc-cell-tag ${CELL_SRC_CLASS[c.src]}`}>{c.src}</span>
      </span>
    )
  }

  return (
    <>
      {/* ── A 区：质检模板列表 ── */}
      <aside className="sc-scheme-panel" aria-label="质检模板区">
        {modeSwitch}
        <div className="sc-scheme-filters">
          <div className="lib-search-wrap sc-search">
            <md-icon>search</md-icon>
            <input className="lib-search-input" placeholder="搜索模板名称、编码..." value={search}
              onChange={e => setSearch(e.target.value)} aria-label="搜索模板" />
          </div>
          <div className="sc-filter-row">
            <select className="lib-filter-select sc-filter-sm" value={fStatus}
              onChange={e => setFStatus(e.target.value as '全部状态' | TemplateStatus)} aria-label="状态">
              <option>全部状态</option><option>草稿</option><option>试算中</option><option>待审核</option>
              <option>已启用</option><option>停用</option><option>已归档</option>
            </select>
            <select className="lib-filter-select sc-filter-sm" value={fType}
              onChange={e => setFType(e.target.value)} aria-label="模板类型">
              <option>全部类型</option><option>平台基线</option><option>油田级</option><option>区块级</option><option>专项场景</option>
            </select>
          </div>
        </div>

        <ul className="sc-scheme-list">
          {filtered.map(t => (
            <li key={t.id}>
              <button
                className={`sc-scheme-item${t.id === selectedId ? ' sc-scheme-item--active' : ''}`}
                onClick={() => setSelectedId(t.id)} aria-current={t.id === selectedId}
              >
                <div className="sc-scheme-item-head">
                  <span className="sc-scheme-name">{t.name}</span>
                  <span className={`lib-badge ${TPL_STATUS_CLASS[t.status]}`}>{t.status}</span>
                </div>
                <div className="sc-scheme-code">{t.code} · {t.version} · {t.type}</div>
                <div className="sc-scheme-scene">{t.block} / {t.wellType} / {t.stage}</div>
                <div className="sc-tpl-metrics">
                  <span className="sc-tpl-metric"><md-icon>rule</md-icon>规则 {t.ruleCoverage}</span>
                  <span className="sc-tpl-metric"><md-icon>tune</md-icon>参数 {t.paramOverride}</span>
                  <span className="sc-tpl-metric"><md-icon>water_drop</md-icon>样本井 {t.sampleWells}</span>
                </div>
                <div className="sc-tpl-scheme">
                  <md-icon>functions</md-icon>{t.scheme || '未绑定评分方案'}
                </div>
                {t.conflict && <div className="sc-conflict-tag"><md-icon>warning</md-icon>范围冲突</div>}
                <div className="sc-scheme-meta">优先级 {t.priority} · {t.updatedAt} · {t.owner}</div>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="sc-empty"><md-icon>search_off</md-icon>未找到符合条件的模板</li>
          )}
        </ul>
      </aside>

      {/* ── B 区：模板配置 ── */}
      <section className="sc-config-panel" aria-label="模板配置区">
        <div className="sc-config-head">
          <div className="sc-config-title-group">
            <span className="sc-config-title">{selected.name}</span>
            <span className="sc-config-sub">
              {selected.code} · {selected.version} · <span className={`lib-badge ${TPL_STATUS_CLASS[selected.status]}`}>{selected.status}</span>
              {selected.parent && <span className="sc-parent-ref"><md-icon>account_tree</md-icon>继承自 {selected.parent}</span>}
            </span>
          </div>
        </div>
        <div className="sc-tabs" role="tablist">
          {([['basic', '基础与适用范围'], ['matrix', '字段规则矩阵'], ['calib', '区块参数标定'], ['review', '处置与复核'], ['binding', '评分方案绑定']] as const).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k}
              className={`sc-tab${tab === k ? ' sc-tab--active' : ''}`} onClick={() => setTab(k as TplTab)}>
              {label}
            </button>
          ))}
        </div>

        <div className="sc-config-body">
          {/* 页签一：基础与适用范围 */}
          {tab === 'basic' && (
            <div className="sc-tab-panel">
              <div className="sc-section-title"><span className="sc-bar sc-bar--primary" />基础信息</div>
              <div className="sc-form-grid">
                <div className="sc-field"><label className="sc-label">模板名称<span className="sc-req">*</span></label>
                  <input className="sc-input" defaultValue={selected.name} /></div>
                <div className="sc-field"><label className="sc-label">模板编码<span className="sc-req">*</span></label>
                  <input className="sc-input sc-input--mono" defaultValue={selected.code} disabled={selected.status === '已启用'} />
                  {selected.status === '已启用' && <span className="sc-hint">启用后编码不可修改</span>}</div>
                <div className="sc-field"><label className="sc-label">模板类型<span className="sc-req">*</span></label>
                  <select className="sc-select" defaultValue={selected.type}><option>平台基线</option><option>油田级</option><option>区块级</option><option>专项场景</option></select></div>
                <div className="sc-field"><label className="sc-label">父模板</label>
                  <select className="sc-select" defaultValue={selected.parent ?? ''}><option value="">无（顶层模板）</option><option>致密气油田级基线 V2.0</option><option>页岩气油田级基线 V1.1</option></select></div>
                <div className="sc-field"><label className="sc-label">责任专家<span className="sc-req">*</span></label>
                  <select className="sc-select" defaultValue={selected.owner}><option>王玉慧</option><option>张工</option><option>李工</option><option>赵工</option></select></div>
                <div className="sc-field"><label className="sc-label">版本 / 状态</label>
                  <input className="sc-input" defaultValue={`${selected.version} · ${selected.status}`} disabled /></div>
                <div className="sc-field sc-field--full"><label className="sc-label">模板说明<span className="sc-req">*</span></label>
                  <textarea className="sc-textarea" rows={2} defaultValue="面向区块A水平井压前+压中阶段的质检口径，覆盖地质、工程与压中时序字段，区块阈值基于近三年 126 口已审核井标定。" /></div>
              </div>

              <div className="sc-section-title"><span className="sc-bar sc-bar--success" />适用范围</div>
              <div className="sc-form-grid">
                <div className="sc-field"><label className="sc-label">油田 / 单位<span className="sc-req">*</span></label>
                  <input className="sc-input" defaultValue={selected.field} /></div>
                <div className="sc-field"><label className="sc-label">区块<span className="sc-req">*</span></label>
                  <input className="sc-input" defaultValue={selected.block} /></div>
                <div className="sc-field"><label className="sc-label">层系</label>
                  <input className="sc-input" defaultValue={selected.seam} /></div>
                <div className="sc-field"><label className="sc-label">井型</label>
                  <select className="sc-select" defaultValue={selected.wellType}><option>水平井</option><option>直井</option><option>定向井</option><option>全井型</option></select></div>
                <div className="sc-field"><label className="sc-label">生命周期<span className="sc-req">*</span></label>
                  <select className="sc-select" defaultValue={selected.stage}><option>压前</option><option>压中</option><option>压后</option><option>压前+压中</option><option>全周期</option></select></div>
                <div className="sc-field"><label className="sc-label">数据类型<span className="sc-req">*</span></label>
                  <select className="sc-select"><option>综合</option><option>基础</option><option>地质</option><option>工程</option><option>生产</option><option>压中时序</option></select></div>
                <div className="sc-field"><label className="sc-label">生效时间<span className="sc-req">*</span></label>
                  <input className="sc-input" defaultValue="2026-07-01 起" /></div>
                <div className="sc-field"><label className="sc-label">标定数据时间窗<span className="sc-req">*</span></label>
                  <input className="sc-input" defaultValue="2023-07 ~ 2026-06" /></div>
                <div className="sc-field"><label className="sc-label">模板匹配优先级<span className="sc-req">*</span></label>
                  <input className="sc-input" type="number" defaultValue={selected.priority} /></div>
              </div>

              <div className="sc-match-preview">
                <md-icon>flaky</md-icon>
                <div>
                  <div className="sc-match-title">匹配预览</div>
                  <div className="sc-match-text">当任务数据满足「{selected.field} · {selected.block} · {selected.wellType} · {selected.stage}」且数据时间在生效范围内时，将自动匹配本模板（优先级 {selected.priority}）。</div>
                </div>
                <span className="sc-match-flag sc-match-flag--ok"><md-icon>check_circle</md-icon>无同范围冲突</span>
              </div>
            </div>
          )}

          {/* 页签二：字段规则矩阵 */}
          {tab === 'matrix' && (
            <div className="sc-tab-panel">
              <div className="sc-stat-chips">
                <div className="sc-stat-chip"><span className="sc-stat-num">{total}</span><span className="sc-stat-txt">参与字段</span></div>
                <div className="sc-stat-chip sc-stat-chip--ok"><span className="sc-stat-num">{full44}</span><span className="sc-stat-txt">4/4 覆盖</span></div>
                <div className="sc-stat-chip"><span className="sc-stat-num">{inherited}</span><span className="sc-stat-txt">继承规则</span></div>
                <div className="sc-stat-chip"><span className="sc-stat-num">{overridden}</span><span className="sc-stat-txt">区块覆盖</span></div>
                <div className="sc-stat-chip sc-stat-chip--warn"><span className="sc-stat-num">{replaced}</span><span className="sc-stat-txt">替换规则</span></div>
                <div className="sc-stat-chip sc-stat-chip--danger"><span className="sc-stat-num">{total - full44}</span><span className="sc-stat-txt">未达 4/4</span></div>
              </div>

              <div className="sc-cat-filter">
                <span className="sc-source-label">字段分类：</span>
                {categories.map(c => (
                  <button key={c} className={`sc-cat-chip${catFilter === c ? ' sc-cat-chip--active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
                ))}
              </div>

              <div className="sc-matrix-wrap">
                <table className="sc-rule-table sc-matrix">
                  <thead>
                    <tr>
                      <th>字段（只读引用）</th>
                      <th>完整性</th><th>一致性</th><th>分布范围</th><th>相关性</th>
                      <th>默认处置</th><th>��家复核</th><th className="sc-th-num">覆盖</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixFields.map(f => {
                      const cov = f.correlation !== null ? '4/4' : '3/4'
                      return (
                        <tr key={f.code}>
                          <td>
                            <div className="sc-rule-name">{f.name} <span className="sc-field-unit">{f.unit !== '-' ? f.unit : ''}</span></div>
                            <div className="sc-rule-code">{f.code} · {f.version} · {f.type}</div>
                          </td>
                          <td>{renderCell(f.completeness)}</td>
                          <td>{renderCell(f.consistency)}</td>
                          <td>{renderCell(f.distribution)}</td>
                          <td>{renderCell(f.correlation)}</td>
                          <td><span className="sc-disp-tag">{f.disposition}</span></td>
                          <td><span className={`sc-review-tag sc-review-tag--${f.review === '必审' ? 'must' : f.review === '抽样' ? 'sample' : 'log'}`}>{f.review}</span></td>
                          <td className="sc-td-num"><span className={`sc-cov-badge${cov === '4/4' ? ' sc-cov-badge--full' : ' sc-cov-badge--gap'}`}>{cov}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="sc-note"><md-icon>info</md-icon>矩阵仅引用字段与规则版本：「继承」沿用父模板锁定版本，「区块覆盖」保持同一规则版本仅改可覆盖参数，「替换」需说明原因并重新试运行。字段定义与规则算法请在字段标准库 / 质检规则库维护。</p>
            </div>
          )}

          {/* 页签三：区块参数标定 */}
          {tab === 'calib' && (
            <div className="sc-tab-panel">
              <div className="sc-section-title"><span className="sc-bar sc-bar--primary" />标定数据选择</div>
              <div className="sc-form-grid">
                <div className="sc-field"><label className="sc-label">数据集版本</label>
                  <select className="sc-select"><option>区块A已审核集 2023-2026</option><option>区块A质检完成集 v3.2</option></select></div>
                <div className="sc-field"><label className="sc-label">时间范围</label>
                  <input className="sc-input" defaultValue="最近 3 年" /></div>
                <div className="sc-field"><label className="sc-label">最小样本量</label>
                  <input className="sc-input" type="number" defaultValue={40} /></div>
                <div className="sc-field"><label className="sc-label">样本标签</label>
                  <select className="sc-select"><option>仅已确认正常 + 真实极值</option><option>全部已审核样本</option></select></div>
                <div className="sc-field"><label className="sc-label">对照对象</label>
                  <select className="sc-select"><option>父模板（油田级基线 V2.0）</option><option>当前启用版本 V1.1</option><option>同类区块模板</option></select></div>
                <div className="sc-field"><label className="sc-label">排除范围</label>
                  <input className="sc-input" defaultValue="试验井 / 返工段 / 设备故障期" /></div>
              </div>

              <div className="sc-section-title"><span className="sc-bar sc-bar--success" />参数建议（孔隙度 · 区块A）</div>
              <table className="sc-rule-table">
                <thead>
                  <tr><th>参数</th><th>继承值</th><th>区块建议值</th><th>专家采用值</th><th>依据</th></tr>
                </thead>
                <tbody>
                  {CALIB_PARAMS.map(p => (
                    <tr key={p.name}>
                      <td className="sc-rule-name">{p.name}</td>
                      <td className="sc-muted">{p.inherited}</td>
                      <td className="sc-num-strong">{p.suggested}</td>
                      <td>
                        <input className="sc-mini-input sc-adopt-input" defaultValue={p.adopted} style={{ width: 96 }} />
                        {p.changed && <span className="sc-changed-dot" title="专家采用值不同于建议值">●</span>}
                      </td>
                      <td className="sc-basis">{p.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sc-explain">
                <md-icon>lightbulb</md-icon>
                P10–P90 表示业务正常带，两端进入关联验证不直接判错；IQR 与 Modified Z-score 仅标记候选，不自动删除。n&lt;30 时动态规则只能继承、仅提示或转专家复核，自然物理硬边界不由样本自动修改。
              </div>
            </div>
          )}

          {/* 页签四：处置与专家复核 */}
          {tab === 'review' && (
            <div className="sc-tab-panel">
              <div className="sc-section-title"><span className="sc-bar sc-bar--warning" />复核策略</div>
              <table className="sc-gate-table">
                <thead><tr><th>配置项</th><th>规则</th><th>当前设置</th></tr></thead>
                <tbody>
                  <tr><td className="sc-rule-name">高风险复核</td><td className="sc-muted">严重 / 阻断 100%，不可降低</td><td><span className="sc-review-tag sc-review-tag--must">全审 100%</span></td></tr>
                  <tr><td className="sc-rule-name">中风险复核</td><td className="sc-muted">设置抽样比例与最低复核井数</td><td><input className="sc-mini-input" defaultValue="20%" style={{ width: 72 }} /> · 最低 8 井</td></tr>
                  <tr><td className="sc-rule-name">低风险处理</td><td className="sc-muted">可自动通过，保留命中与执行日志</td><td><span className="sc-review-tag sc-review-tag--log">留痕自动通过</span></td></tr>
                  <tr><td className="sc-rule-name">自动补全</td><td className="sc-muted">默认关闭，仅生成候选值与置信度</td><td><span className="sc-switch" role="switch" aria-checked="false"><span className="sc-switch-thumb" /></span></td></tr>
                  <tr><td className="sc-rule-name">单位标准化</td><td className="sc-muted">仅唯一、可逆、低风险换算可开启</td><td><span className="sc-switch sc-switch--on" role="switch" aria-checked="true"><span className="sc-switch-thumb" /></span></td></tr>
                  <tr><td className="sc-rule-name">复核时限</td><td className="sc-muted">到期提醒与升级路径，不自动通过</td><td>48 小时 · 升级至主审</td></tr>
                </tbody>
              </table>

              <div className="sc-section-title"><span className="sc-bar sc-bar--primary" />区块专家组</div>
              <div className="sc-form-grid">
                <div className="sc-field"><label className="sc-label">地质主审</label><select className="sc-select"><option>王玉慧</option><option>李工</option></select></div>
                <div className="sc-field"><label className="sc-label">工程主审</label><select className="sc-select"><option>张工</option><option>赵工</option></select></div>
                <div className="sc-field"><label className="sc-label">生产主审</label><select className="sc-select"><option>王工</option><option>刘工</option></select></div>
              </div>

              <div className="sc-section-title"><span className="sc-bar sc-bar--success" />历史回放工作量估算</div>
              <div className="sc-workload-grid">
                <div className="sc-wl-card"><span className="sc-wl-num">34</span><span className="sc-wl-txt">预计复核井数</span></div>
                <div className="sc-wl-card"><span className="sc-wl-num">1,280</span><span className="sc-wl-txt">复核记录数</span></div>
                <div className="sc-wl-card"><span className="sc-wl-num">6.5</span><span className="sc-wl-txt">专家工时（人日）</span></div>
                <div className="sc-wl-card"><span className="sc-wl-num">+3</span><span className="sc-wl-txt">较父模板复核井</span></div>
              </div>
            </div>
          )}

          {/* 页签五：评分方案绑定 */}
          {tab === 'binding' && (
            <div className="sc-tab-panel">
              <div className="sc-section-title"><span className="sc-bar sc-bar--primary" />评分方案绑定</div>
              <div className="sc-form-grid">
                <div className="sc-field"><label className="sc-label">评分方案<span className="sc-req">*</span></label>
                  <select className="sc-select" defaultValue={selected.scheme || ''}>
                    <option value="">请选择已启用评分方案</option>
                    <option>致密气综合质检评分</option><option>通用数据质量评分</option><option>页岩气入库治理评分</option>
                  </select></div>
                <div className="sc-field"><label className="sc-label">评分方案版本<span className="sc-req">*</span></label>
                  <select className="sc-select"><option>V2.1（当前启用）</option><option>V2.0</option></select></div>
                <div className="sc-field"><label className="sc-label">绑定方式<span className="sc-req">*</span></label>
                  <select className="sc-select"><option>固定版本（默认）</option><option>跟随确认升级</option></select></div>
              </div>

              <div className="sc-binding-summary">
                <div className="sc-bind-item"><span className="sc-bind-label">四维权重</span><span className="sc-bind-value">一致性 30 / 完整性 25 / 分布 25 / 相关性 20</span></div>
                <div className="sc-bind-item"><span className="sc-bind-label">等级阈值</span><span className="sc-bind-value">优秀≥90 · 良好≥80 · 合格≥60 · 待整改&lt;60</span></div>
                <div className="sc-bind-item"><span className="sc-bind-label">评分门槛</span><span className="sc-bind-value">严重异常限合格 · 覆盖率&lt;90% 暂定 · 必需维度&lt;60 待整改</span></div>
                <div className="sc-bind-item"><span className="sc-bind-label">联合试算</span><span className="sc-bind-value sc-bind-value--ok"><md-icon>check_circle</md-icon>通过（92.8 分 · 合格）</span></div>
              </div>

              <div className="sc-section-title"><span className="sc-bar sc-bar--success" />绑定兼容性检查</div>
              <ul className="sc-check-list">
                <li className="sc-check-ok"><md-icon>check_circle</md-icon>模板包含评分方案要求的四个维度与必需规则</li>
                <li className="sc-check-ok"><md-icon>check_circle</md-icon>评分方案维度内规则模式为「跟随质检模板」</li>
                <li className="sc-check-ok"><md-icon>check_circle</md-icon>模板规则可提供方案要求的规则得分来源</li>
                <li className="sc-check-ok"><md-icon>check_circle</md-icon>复核策略满足「严重/阻断 100% 复核」评分门槛</li>
                <li className="sc-check-warn"><md-icon>info</md-icon>模板区块范围与评分方案适用范围相容（陆地 / 致密气）</li>
              </ul>
              <p className="sc-note"><md-icon>upgrade</md-icon>评分方案发布新版本后，本模板显示「可升级」提示但不会自动替换；专家确认升级后生成模板新版本并重新联合试算。</p>
            </div>
          )}
        </div>
      </section>

      {/* ── C 区：标定与联合试算 ── */}
      <aside className="sc-preview-panel" aria-label="标定与联合试算">
        <div className="sc-panel-head">
          <span className="sc-panel-title">标定与联合试算</span>
        </div>
        <div className="sc-preview-select">
          <div className="sc-field"><label className="sc-label">预览对象</label>
            <select className="sc-select"><option>区块A已审核标定集 · 126 井</option><option>LGPC1-14-3H 综合质检任务</option></select></div>
          <div className="sc-preview-select-row">
            <select className="sc-select sc-select--sm"><option>数据集粒度</option><option>井组</option><option>单井</option></select>
            <select className="sc-select sc-select--sm"><option>当前草稿</option><option>当前启用</option><option>两版本对比</option></select>
          </div>
          <div className="sc-preview-meta">区块A · 水平井 · 压前+压中 · 模板 V1.2 · 评分方案 V2.1 · 四维完整 · 126 井 / 38,240 条</div>
        </div>

        <div className="sc-ctabs" role="tablist">
          {([['sample', '样本概况'], ['dist', '分布包络'], ['hit', '规则命中'], ['workload', '复核量'], ['score', '综合评分']] as const).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={previewTab === k}
              className={`sc-ctab${previewTab === k ? ' sc-ctab--active' : ''}`} onClick={() => setPreviewTab(k as PreviewTab)}>
              {label}
            </button>
          ))}
        </div>

        {previewTab === 'sample' && (
          <div className="sc-preview-block">
            <div className="sc-workload-grid">
              <div className="sc-wl-card"><span className="sc-wl-num">126</span><span className="sc-wl-txt">样本井数</span></div>
              <div className="sc-wl-card"><span className="sc-wl-num">38,240</span><span className="sc-wl-txt">记录数</span></div>
              <div className="sc-wl-card"><span className="sc-wl-num">2.1%</span><span className="sc-wl-txt">平均缺失率</span></div>
              <div className="sc-wl-card sc-wl-card--warn"><span className="sc-wl-num">3</span><span className="sc-wl-txt">n&lt;30 分组</span></div>
            </div>
            <div className="sc-kv-list">
              <div className="sc-kv"><span>时间范围</span><span>2023-07 ~ 2026-06</span></div>
              <div className="sc-kv"><span>排除样本</span><span>试验井 8 · 返工段 14</span></div>
              <div className="sc-kv"><span>单位分布</span><span>统一 m³ / MPa / %</span></div>
              <div className="sc-kv"><span>降级方式</span><span>n&lt;30 组转专家复核</span></div>
            </div>
          </div>
        )}

        {previewTab === 'dist' && (
          <div className="sc-preview-block">
            <div className="sc-block-title">分布与包络对比</div>
            <div className="sc-dist-list">
              <div className="sc-dist-row"><span className="sc-dist-name">孔隙度 P10/P50/P90</span><span className="sc-dist-val">5.8 / 11.2 / 17.6 %</span></div>
              <div className="sc-dist-row"><span className="sc-dist-name">渗透率 IQR</span><span className="sc-dist-val">0.08 ~ 0.42 mD</span></div>
              <div className="sc-dist-row"><span className="sc-dist-name">加砂量残差 P95</span><span className="sc-dist-val">±0.10</span></div>
              <div className="sc-dist-row"><span className="sc-dist-name">施工压力包络</span><span className="sc-dist-val">P5–P95 分段带</span></div>
            </div>
            <p className="sc-note"><md-icon>layers</md-icon>叠加对比：父模板、当前启用与当前草稿三套参数带，标注区块覆盖差异。</p>
          </div>
        )}

        {previewTab === 'hit' && (
          <div className="sc-preview-block">
            <div className="sc-block-title">规则命中</div>
            <div className="sc-kv-list">
              <div className="sc-kv"><span>字段覆盖 / 规则覆盖</span><span>58/58 · 100%</span></div>
              <div className="sc-kv"><span>总命中率</span><span>6.8%</span></div>
              <div className="sc-kv"><span>完整 / 一致 / 分布 / 相关</span><span>1.2 / 0.9 / 3.1 / 1.6%</span></div>
              <div className="sc-kv"><span>一般 / 严重 / 阻断</span><span>184 / 46 / 3</span></div>
              <div className="sc-kv"><span>较父模板新增命中</span><span className="sc-delta-up">+28（分布收紧）</span></div>
            </div>
            <p className="sc-note"><md-icon>info</md-icon>无专家标注真值，仅展示命中率与抽样复核结论，不显示伪精确准确率。</p>
          </div>
        )}

        {previewTab === 'workload' && (
          <div className="sc-preview-block">
            <div className="sc-workload-grid">
              <div className="sc-wl-card"><span className="sc-wl-num">34</span><span className="sc-wl-txt">复核井数</span></div>
              <div className="sc-wl-card"><span className="sc-wl-num">1,280</span><span className="sc-wl-txt">复核记录</span></div>
              <div className="sc-wl-card"><span className="sc-wl-num">6.5</span><span className="sc-wl-txt">专家工时(人日)</span></div>
              <div className="sc-wl-card sc-wl-card--warn"><span className="sc-wl-num">+3</span><span className="sc-wl-txt">较父模板</span></div>
            </div>
            <div className="sc-kv-list">
              <div className="sc-kv"><span>高风险全审</span><span>3 阻断 · 46 严重</span></div>
              <div className="sc-kv"><span>中风险抽样</span><span>20% · 最低 8 井</span></div>
              <div className="sc-kv"><span>低风险留痕</span><span>184 条自动通过</span></div>
            </div>
          </div>
        )}

        {previewTab === 'score' && (
          <>
            <div className="sc-score-card">
              <div className="sc-score-main">
                <div className="sc-score-num-wrap">
                  <span className="sc-score-num">92.8</span>
                  <span className="sc-score-unit">分</span>
                </div>
                <div className="sc-score-grades">
                  <div className="sc-score-grade-row">
                    <span className="sc-score-grade-label">初始等级</span>
                    <span className="sc-grade-tag" style={{ ['--gc' as string]: '#2e7d32' }}>优秀</span>
                  </div>
                  <div className="sc-score-grade-row">
                    <span className="sc-score-grade-label">最终等级</span>
                    <span className="sc-grade-tag" style={{ ['--gc' as string]: '#e65100' }}>合格</span>
                    <md-icon class="sc-grade-down">arrow_downward</md-icon>
                  </div>
                </div>
              </div>
              <div className="sc-score-stats">
                <div className="sc-score-stat"><span className="sc-score-stat-label">评分状态</span><span className="sc-score-stat-value sc-status-ok">正式</span></div>
                <div className="sc-score-stat"><span className="sc-score-stat-label">规则覆盖率</span><span className="sc-score-stat-value">100%</span></div>
                <div className="sc-score-stat"><span className="sc-score-stat-label">记录覆盖率</span><span className="sc-score-stat-value">98.4%</span></div>
                <div className="sc-score-stat"><span className="sc-score-stat-label">较父模板</span><span className="sc-score-stat-value sc-delta-up">+2.7</span></div>
              </div>
              <div className="sc-score-limit">
                <md-icon>gpp_maybe</md-icon>
                综合分达到优秀，但存在 3 条未处理严重异常，最终等级限制为合格。
              </div>
            </div>

            <div className="sc-preview-block">
              <div className="sc-block-title">四维质量雷达图（联合试算）</div>
              <div className="sc-radar-wrap">
                <RadarChart dimensions={RADAR_DIMS} size={200} />
              </div>
            </div>

            <div className="sc-preview-block">
              <div className="sc-block-title">分值贡献</div>
              <div className="sc-contrib-list">
                {[
                  { label: '一致性', score: 93.2, w: 30, c: '#1565c0' },
                  { label: '完整性', score: 95.1, w: 25, c: '#2e7d32' },
                  { label: '分布范围', score: 90.8, w: 25, c: '#e65100' },
                  { label: '相关性', score: 91.7, w: 20, c: '#6a1b9a' },
                ].map(d => {
                  const contrib = (d.score * d.w) / 100
                  return (
                    <div key={d.label} className="sc-contrib-row">
                      <span className="sc-contrib-label">{d.label}</span>
                      <div className="sc-contrib-track">
                        <div className="sc-contrib-fill" style={{ width: `${(contrib / 30) * 100}%`, background: d.c }} />
                      </div>
                      <span className="sc-contrib-val">{contrib.toFixed(2)}</span>
                      <span className="sc-contrib-w">{d.w}%</span>
                    </div>
                  )
                })}
                <div className="sc-contrib-row sc-contrib-row--total">
                  <span className="sc-contrib-label">综合</span>
                  <div className="sc-contrib-track" />
                  <span className="sc-contrib-val sc-num-primary">92.8</span>
                  <span className="sc-contrib-w">100%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
