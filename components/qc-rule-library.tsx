'use client'

import { useMemo, useState } from 'react'
import {
  FIELDS, RULES, RULE_METRICS, BUSINESS_LOGICS, LIFECYCLES, CATEGORIES, DIMS, CONFIRM_STATUSES,
  TREATMENTS,
  type QCRule, type QualityDim, type RuleStatus, type AnomalyLevel, type Lifecycle,
  type FieldCategory, type ConfirmStatus, type FieldStd,
} from './library-data'

// ─── 样式映射 ────────────────────────────────────────────────
const DIM_CLASS: Record<QualityDim, string> = {
  '完整性': 'lib-dim--completeness', '一致性': 'lib-dim--consistency',
  '分布范围': 'lib-dim--distribution', '相关性': 'lib-dim--correlation',
}
const LEVEL_CLASS: Record<AnomalyLevel, string> = {
  '一般': 'lib-level--warn', '严重': 'lib-level--error', '阻断': 'lib-level--block',
}
const RULE_STATUS_CLASS: Record<RuleStatus, string> = {
  '草案待确认': 'lib-badge--draft', '建议启用': 'lib-badge--enabled', '试运行': 'lib-badge--running',
  '已启用': 'lib-badge--enabled', '停用': 'lib-badge--disabled',
}
const CONFIRM_CLASS: Record<ConfirmStatus, string> = {
  '可试运行': 'lib-badge--enabled', '待业务确认': 'lib-badge--review', '阻断确认': 'lib-badge--blocked',
}
const RULE_STATUSES: RuleStatus[] = ['草案待确认', '建议启用', '试运行', '已启用', '停用']

// ─── 业务逻辑抽屉 ────────────────────────────────────────────
function LogicDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="lib-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="lib-drawer lib-drawer--wide" role="dialog" aria-label="业务逻辑">
        <div className="lib-drawer-head">
          <span className="md-typescale-title-medium">业务计算逻辑（{BUSINESS_LOGICS.length}）</span>
          <button className="lib-icon-btn" onClick={onClose} aria-label="关闭"><md-icon>close</md-icon></button>
        </div>
        <div className="lib-drawer-body">
          <table className="lib-inner-table">
            <thead><tr><th>逻辑编码</th><th>名称</th><th>涉及字段</th><th>公式/判定</th><th>适用条件</th><th>校验标准</th><th>例外与风险</th><th>状态</th><th>引用</th></tr></thead>
            <tbody>
              {BUSINESS_LOGICS.map((b) => (
                <tr key={b.code}>
                  <td className="lib-input--mono">{b.code}</td>
                  <td className="lib-cell-name">{b.name}</td>
                  <td>{b.fields}</td>
                  <td className="lib-input--mono">{b.formula}</td>
                  <td>{b.condition}</td>
                  <td>{b.standard}</td>
                  <td>{b.risk}</td>
                  <td><span className={`lib-badge ${b.status === '建议启用' ? 'lib-badge--enabled' : b.status === '阻断确认' ? 'lib-badge--blocked' : 'lib-badge--draft'}`}>{b.status}</span></td>
                  <td className="lib-td-num">{b.refCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  )
}

// ─── 规则编辑弹窗（5 页签）───────────────────────────────────
type DialogTab = 'define' | 'logic' | 'apply' | 'treat' | 'testrun'
const DIALOG_TABS: [DialogTab, string][] = [
  ['define', '规则定义'], ['logic', '判断逻辑'], ['apply', '适用范围与参数'], ['treat', '异常处置与复核'], ['testrun', '试运行与发布'],
]

function RuleDialog({ rule, mode, onClose, onSave }: { rule: QCRule | null; mode: 'create' | 'edit' | 'view'; onClose: () => void; onSave: (r: QCRule) => void }) {
  const [tab, setTab] = useState<DialogTab>('define')
  const [name, setName] = useState(rule?.name ?? '')
  const [code, setCode] = useState(rule?.code ?? '')
  const [dim, setDim] = useState<QualityDim>(rule?.dim ?? '分布范围')
  const [level, setLevel] = useState<AnomalyLevel>(rule?.level ?? '严重')
  const [autoFix, setAutoFix] = useState(false)
  const [testRun, setTestRun] = useState(false)
  const [nameErr, setNameErr] = useState('')

  const readOnly = mode === 'view'
  const isEnabledEdit = mode === 'edit' && rule?.status === '已启用'
  const title = mode === 'create' ? '新建规则' : mode === 'view' ? '查看规则' : '编辑规则'
  const field = FIELDS.find((f) => f.code === rule?.fieldCode)

  const preview = rule?.expr ?? `当 [目标字段] 满足所配置条件时，标记为${level}异常并按默认处置进入复核。`

  const handleSave = () => {
    if (!name.trim()) { setNameErr('规则名称不能为空'); setTab('define'); return }
    onSave({
      ...(rule ?? RULES[0]),
      code: code.trim().toUpperCase() || `QC_${Date.now()}`, name: name.trim(), dim, level,
      status: isEnabledEdit ? '草案待确认' : (rule?.status ?? '草案待确认'),
      version: isEnabledEdit ? 'V0.2' : (rule?.version ?? 'V0.1'),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16).replace(/\//g, '-'),
      updatedBy: '张工',
    })
  }

  return (
    <div className="lib-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="lib-dialog lib-dialog--wide" role="dialog" aria-modal="true" aria-label={title}>
        <div className="lib-dialog-header">
          <div className="lib-dialog-headmeta">
            <span className="md-typescale-title-medium lib-dialog-title">{title}</span>
            {rule && (
              <div className="lib-dialog-tags">
                <span className="lib-cell-code">{code || rule.code}</span>
                <span className={`lib-dim-badge ${DIM_CLASS[dim]}`}>{dim}</span>
                <span className={`lib-badge ${LEVEL_CLASS[level]}`}>{level}</span>
                <span className="lib-version-chip">{rule.version}</span>
              </div>
            )}
          </div>
          <button className="lib-icon-btn" onClick={onClose} aria-label="关闭"><md-icon>close</md-icon></button>
        </div>

        {/* 主字段口径固定条 */}
        {field && (
          <div className="lib-field-pin">
            <md-icon>anchor</md-icon>
            主字段 <strong>{field.name}</strong> <span className="lib-cell-code">{field.code}</span>
            <span className="lib-field-pin-sep" />{field.dataType}{field.unit !== '—' ? ` · ${field.unit}` : ''}
            <span className="lib-field-pin-sep" />{field.require}
            <span className="lib-field-pin-sep" />硬边界：{field.boundary}
            <span className={`lib-cov-pill${field.coverage === 4 ? ' lib-cov-pill--full' : ' lib-cov-pill--gap'}`}>覆盖 {field.coverage}/4</span>
          </div>
        )}

        {isEnabledEdit && (
          <div className="lib-dialog-notice"><md-icon>info</md-icon>保存修改将生成新版本，不覆盖当前生效版本。</div>
        )}

        <div className="lib-tabs lib-tabs--dialog" role="tablist">
          {DIALOG_TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k}
              className={`lib-tab${tab === k ? ' lib-tab--active' : ''}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        <div className="lib-dialog-body">
          {tab === 'define' && (
            <div className="lib-tab-panel">
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">规则名称<span className="lib-required">*</span></label>
                  <input className={`lib-input${nameErr ? ' lib-input--error' : ''}`} value={name} disabled={readOnly}
                    onChange={(e) => { setName(e.target.value); setNameErr('') }} placeholder="字段+维度+检查" />
                  {nameErr && <span className="lib-error-msg">{nameErr}</span>}
                </div>
                <div className="lib-field">
                  <label className="lib-label">规则编码<span className="lib-required">*</span></label>
                  <input className="lib-input lib-input--mono" value={code} disabled={readOnly || isEnabledEdit}
                    onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="QC_R_FIELD_HARD" />
                </div>
                <div className="lib-field">
                  <label className="lib-label">质量维度<span className="lib-required">*</span></label>
                  <select className="lib-select" value={dim} disabled={readOnly} onChange={(e) => setDim(e.target.value as QualityDim)}>
                    {DIMS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">规则类型<span className="lib-required">*</span></label>
                  <input className="lib-input" defaultValue={rule?.ruleType} disabled={readOnly} />
                </div>
                <div className="lib-field">
                  <label className="lib-label">异常等级<span className="lib-required">*</span></label>
                  <select className="lib-select" value={level} disabled={readOnly} onChange={(e) => setLevel(e.target.value as AnomalyLevel)}>
                    <option>一般</option><option>严重</option><option>阻断</option>
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">规则责任人<span className="lib-required">*</span></label>
                  <select className="lib-select" disabled={readOnly} defaultValue={rule?.updatedBy}><option>张工</option><option>李工</option><option>王工</option><option>赵工</option></select>
                </div>
                <div className="lib-field lib-field--full">
                  <label className="lib-label">依据/备注<span className="lib-required">*</span></label>
                  <textarea className="lib-textarea" rows={2} defaultValue={rule?.review} disabled={readOnly} placeholder="说明业务依据、例外与风险" />
                </div>
              </div>
            </div>
          )}

          {tab === 'logic' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />{dim}判断逻辑</div>
              {dim === '相关性' ? (
                <div className="lib-field lib-field--full">
                  <label className="lib-label">业务逻辑库选择 / 可视化构建器</label>
                  <select className="lib-select" disabled={readOnly}>
                    {BUSINESS_LOGICS.map((b) => <option key={b.code}>{b.code} · {b.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="lib-form-grid">
                  <div className="lib-field"><label className="lib-label">下限 / 上限</label><input className="lib-input" defaultValue={field?.boundary} disabled={readOnly} /></div>
                  <div className="lib-field"><label className="lib-label">IQR 系数</label><input className="lib-input" defaultValue="1.5 / 3.0" disabled={readOnly} /></div>
                  <div className="lib-field"><label className="lib-label">最小样本量</label><input className="lib-input" type="number" defaultValue={30} disabled={readOnly} /></div>
                </div>
              )}
              <div className="lib-preview">
                <div className="lib-preview-label"><md-icon>visibility</md-icon>人可读规则预览</div>
                <p className="lib-preview-text">{preview}</p>
              </div>
            </div>
          )}

          {tab === 'apply' && (
            <div className="lib-tab-panel">
              <table className="lib-inner-table">
                <thead><tr><th>参数</th><th>默认规则</th></tr></thead>
                <tbody>
                  <tr><td>数据来源</td><td>全部已映射来源</td></tr>
                  <tr><td>分组</td><td>{field?.category === '工程参数' ? '区块+层系+井型+压裂液体系+支撑剂类型' : field?.category === '生产动态参数' ? '区块+层系+井型+生产年份/阶段' : '区块+层系+井型'}</td></tr>
                  <tr><td>最小样本量</td><td>n≥30；n&lt;30 只提示并转复核</td></tr>
                  <tr><td>动态正常带 / IQR</td><td>P10–P90；IQR 1.5 预警 / 3.0 严重</td></tr>
                  <tr><td>任务级覆盖</td><td>默认禁止；允许时须设上下限并审核</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === 'treat' && (
            <div className="lib-tab-panel">
              <div className="lib-form-grid">
                <div className="lib-field"><label className="lib-label">处置方式</label>
                  <select className="lib-select" disabled={readOnly}>{TREATMENTS.map((t) => <option key={t.id}>{t.name}</option>)}</select></div>
                <div className="lib-field"><label className="lib-label">自动生成标准值</label><select className="lib-select" disabled={readOnly}><option>关闭（默认）</option></select></div>
                <div className="lib-field"><label className="lib-label">专家复核</label><select className="lib-select" disabled={readOnly}><option>严重/阻断默认100%</option><option>按比例抽样</option></select></div>
              </div>
              <label className="lib-checkbox lib-checkbox--danger">
                <input type="checkbox" checked={autoFix} disabled={readOnly} onChange={(e) => setAutoFix(e.target.checked)} />
                允许自动改值（默认关闭，仅唯一、可逆、低风险单位换算可开启，并须经审核；原始值永不覆盖）
              </label>
              <p className="lib-inline-note"><md-icon>merge_type</md-icon>冲突策略：保留所有命中；汇总等级取最高；处置冲突时不改值，转专家复核。</p>
            </div>
          )}

          {tab === 'testrun' && (
            <div className="lib-tab-panel">
              <div className="lib-form-grid">
                <div className="lib-field"><label className="lib-label">数据集版本</label><select className="lib-select" disabled={readOnly}><option>苏里格区块2024年综合数据集 v3.2</option></select></div>
                <div className="lib-field"><label className="lib-label">范围</label><select className="lib-select" disabled={readOnly}><option>随机抽样</option><option>全量</option></select></div>
                <div className="lib-field"><label className="lib-label">样本上限</label><input className="lib-input" type="number" defaultValue={5000} disabled={readOnly} /></div>
              </div>
              {!readOnly && <button className="lib-btn lib-btn--primary lib-btn--sm" onClick={() => setTestRun(true)}><md-icon>play_arrow</md-icon>开始试运行（模拟处置，不写回数据）</button>}
              {testRun && (
                <div className="lib-testrun-result">
                  <div className="lib-testrun-metrics">
                    <div className="lib-metric"><span className="lib-metric-value">8,640</span><span className="lib-metric-label">覆盖记录</span></div>
                    <div className="lib-metric"><span className="lib-metric-value">126</span><span className="lib-metric-label">井数</span></div>
                    <div className="lib-metric lib-metric--warn"><span className="lib-metric-value">312</span><span className="lib-metric-label">命中异常</span></div>
                    <div className="lib-metric lib-metric--error"><span className="lib-metric-value">3.6%</span><span className="lib-metric-label">命中率</span></div>
                    <div className="lib-metric"><span className="lib-metric-value">7</span><span className="lib-metric-label">n&lt;30 降级</span></div>
                  </div>
                  <table className="lib-inner-table">
                    <thead><tr><th>井号</th><th>字段</th><th>原值</th><th>标准值候选</th><th>命中条件</th><th>异常等级</th><th>建议处置</th></tr></thead>
                    <tbody>
                      <tr><td>苏36-11</td><td>{field?.name ?? '加砂量'}</td><td className="lib-input--mono">6120</td><td className="lib-input--mono">—</td><td>&gt; 上限</td><td><span className="lib-badge lib-level--error">严重</span></td><td>专家复核</td></tr>
                      <tr><td>苏36-12</td><td>{field?.name ?? '加砂量'}</td><td className="lib-input--mono">-3</td><td className="lib-input--mono">—</td><td>&lt; 下限</td><td><span className="lib-badge lib-level--error">严重</span></td><td>标记留证</td></tr>
                    </tbody>
                  </table>
                  <p className="lib-inline-note"><md-icon>history</md-icon>与上一版本对比：新增命中 +18，减少命中 -4；命中率变化需解释后方可发布。</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lib-dialog-footer">
          {readOnly ? (
            <>
              <button className="lib-btn lib-btn--ghost" onClick={onClose}>关闭</button>
              <button className="lib-btn lib-btn--primary" onClick={handleSave}><md-icon>content_copy</md-icon>复制规则</button>
            </>
          ) : (
            <>
              <button className="lib-btn lib-btn--ghost" onClick={onClose}>取消</button>
              <button className="lib-btn lib-btn--tonal" onClick={handleSave}>保存草稿</button>
              <button className="lib-btn lib-btn--primary" onClick={handleSave}><md-icon>science</md-icon>保存并试运行</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────
export function QCRuleLibrary({ initialField, initialDim }: { initialField?: string; initialDim?: string } = {}) {
  const [view, setView] = useState<'matrix' | 'atomic'>(initialField ? 'atomic' : 'matrix')
  const [rules, setRules] = useState<QCRule[]>(RULES)
  const [search, setSearch] = useState(initialField ?? '')
  const [fLife, setFLife] = useState<Lifecycle | '全部生命周期'>('全部生命周期')
  const [fDim, setFDim] = useState<QualityDim | '全部维度'>((initialDim as QualityDim) ?? '全部维度')
  const [fCat, setFCat] = useState<FieldCategory | '全部分类'>('全部分类')
  const [fStatus, setFStatus] = useState<RuleStatus | '全部状态'>('全部状态')
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit' | 'view'; rule: QCRule | null } | null>(null)
  const [logicOpen, setLogicOpen] = useState(false)

  // 原子规则筛选
  const filteredRules = useMemo(() => rules.filter((r) => {
    const s = search.trim().toLowerCase()
    const matchSearch = !s || r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s) || r.fieldCode.toLowerCase().includes(s) || r.fieldName.includes(s)
    const field = FIELDS.find((f) => f.code === r.fieldCode)
    return matchSearch && (fLife === '全部生命周期' || r.lifecycle === fLife)
      && (fDim === '全部维度' || r.dim === fDim)
      && (fCat === '全部分类' || field?.category === fCat)
      && (fStatus === '全部状态' || r.status === fStatus)
  }), [rules, search, fLife, fDim, fCat, fStatus])

  // 字段矩阵筛选
  const filteredFields = useMemo(() => FIELDS.filter((f) => {
    const s = search.trim().toLowerCase()
    const matchSearch = !s || f.name.toLowerCase().includes(s) || f.code.toLowerCase().includes(s)
    return matchSearch && (fLife === '全部生命周期' || f.lifecycle === fLife) && (fCat === '全部分类' || f.category === fCat)
  }), [search, fLife, fCat])

  const activeFilters = (search ? 1 : 0) + (fLife !== '全部生命周期' ? 1 : 0) + (fDim !== '全部维度' ? 1 : 0) + (fCat !== '全部分类' ? 1 : 0) + (fStatus !== '全部状态' ? 1 : 0)
  const handleReset = () => { setSearch(''); setFLife('全部生命周期'); setFDim('全部维度'); setFCat('全部分类'); setFStatus('全部状态') }

  const handleSave = (r: QCRule) => {
    setRules((p) => dialog?.mode === 'create' ? [r, ...p] : p.map((x) => x.code === r.code ? r : x))
    setDialog(null)
  }

  const metrics = [
    { key: 'total', label: '规则总数', value: RULE_METRICS.total, onClick: () => { setView('atomic'); setFStatus('全部状态') } },
    { key: 'suggested', label: '建议启用', value: RULE_METRICS.suggested, ok: true, onClick: () => { setView('atomic'); setFStatus('建议启用') } },
    { key: 'draft', label: '草案待确认', value: RULE_METRICS.draft, onClick: () => { setView('atomic'); setFStatus('草案待确认') } },
    { key: 'full', label: '四维完整字段', value: RULE_METRICS.fullFields, onClick: () => setView('matrix') },
    { key: 'blocked', label: '阻断字段', value: RULE_METRICS.blockedFields, danger: true, onClick: () => { setView('matrix'); setSearch('GQ') } },
  ]

  const matrixRule = (f: FieldStd, dim: QualityDim) => {
    const r = rules.find((x) => x.fieldCode === f.code && x.dim === dim)
    return r
  }

  return (
    <div className="lib-center">
      {/* 页面头部 */}
      <div className="lib-page-header">
        <div className="lib-breadcrumb md-typescale-label-medium">
          <md-icon>tune</md-icon>质控配置<md-icon class="lib-bc-sep">chevron_right</md-icon>
          <span className="lib-bc-current">质控规则库</span>
        </div>
        <div className="lib-page-header-row">
          <div>
            <h1 className="md-typescale-headline-small lib-page-title">质控规则库</h1>
            <p className="md-typescale-body-medium lib-page-subtitle">按字段和质量维度管理原子规则，统一配置判断逻辑、适用范围、异常等级、默认处置与专家复核</p>
          </div>
          <div className="lib-header-actions">
            <button className="lib-btn lib-btn--ghost"><md-icon>upload_file</md-icon>批量导入</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>download</md-icon>导出规则</button>
            <button className="lib-btn lib-btn--ghost lib-btn--badge" onClick={() => setLogicOpen(true)}>
              <md-icon>function</md-icon>业务逻辑<span className="lib-btn-count">{BUSINESS_LOGICS.length}</span>
            </button>
            <button className="lib-btn lib-btn--primary" onClick={() => setDialog({ mode: 'create', rule: null })}>
              <md-icon>add</md-icon>新建规则
            </button>
          </div>
        </div>
      </div>

      {/* 紧凑指标 */}
      <div className="lib-metrics">
        {metrics.map((m) => (
          <button key={m.key} className={`lib-metric-chip${m.danger ? ' lib-metric-chip--danger' : ''}${m.ok ? ' lib-metric-chip--ok' : ''}`} onClick={m.onClick}>
            <span className="lib-metric-num">{m.value}</span>
            <span className="lib-metric-txt">{m.label}</span>
          </button>
        ))}
      </div>

      {/* 视图切换 + 筛选 */}
      <div className="lib-filter-bar">
        <div className="lib-view-switch" role="group" aria-label="视图切换">
          <button className={`lib-view-btn${view === 'matrix' ? ' lib-view-btn--active' : ''}`} onClick={() => setView('matrix')}>
            <md-icon>grid_view</md-icon>字段矩阵
          </button>
          <button className={`lib-view-btn${view === 'atomic' ? ' lib-view-btn--active' : ''}`} onClick={() => setView('atomic')}>
            <md-icon>list</md-icon>原子规则
          </button>
        </div>
        <div className="lib-search-wrap">
          <md-icon>search</md-icon>
          <input className="lib-search-input" placeholder="搜索规则编码、名称、字段编码或名称..." value={search}
            onChange={(e) => setSearch(e.target.value)} aria-label="搜索规则" />
          {search && <button className="lib-search-clear" onClick={() => setSearch('')} aria-label="清空"><md-icon>close</md-icon></button>}
        </div>
        <select className="lib-filter-select" value={fLife} onChange={(e) => setFLife(e.target.value as Lifecycle | '全部生命周期')} aria-label="生命周期">
          <option>全部生命周期</option>{LIFECYCLES.map((l) => <option key={l}>{l}</option>)}
        </select>
        {view === 'atomic' && (
          <select className="lib-filter-select" value={fDim} onChange={(e) => setFDim(e.target.value as QualityDim | '全部维度')} aria-label="质量维度">
            <option>全部维度</option>{DIMS.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
        <select className="lib-filter-select" value={fCat} onChange={(e) => setFCat(e.target.value as FieldCategory | '全部分类')} aria-label="字段分类">
          <option>全部分类</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        {view === 'atomic' && (
          <select className="lib-filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value as RuleStatus | '全部状态')} aria-label="状态">
            <option>全部状态</option>{RULE_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
        {activeFilters > 0 && <button className="lib-reset-btn" onClick={handleReset}><md-icon>filter_alt_off</md-icon>重置</button>}
      </div>

      {/* 结果统计 */}
      <div className="lib-result-bar">
        <span className="md-typescale-label-medium lib-result-count">
          {view === 'matrix'
            ? <>字段矩阵 · 共 <strong>{filteredFields.length}</strong> 个字段</>
            : <>原子规则 · 共 <strong>{filteredRules.length}</strong> 条</>}
        </span>
      </div>

      {/* 字段矩阵视图 */}
      {view === 'matrix' && (
        <div className="lib-table-wrap">
          <table className="lib-table lib-table--matrix">
            <thead>
              <tr>
                <th className="lib-th-sticky-name">字段</th><th>生命周期</th>
                <th>完整性规则</th><th>一致性规则</th><th>硬边界/分布规则</th><th>跨字段/业务逻辑</th>
                <th>默认处置</th><th>默认复核</th><th className="lib-th-cov">覆盖</th><th>状态</th><th className="lib-th-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map((f) => (
                <tr key={f.code}>
                  <td className="lib-th-sticky-name">
                    <div className="lib-cell-name">{f.name}</div>
                    <span className="lib-cell-code">{f.code}</span>
                  </td>
                  <td><span className={`lib-lc-badge ${f.lifecycle === '压前' ? 'lib-lc--pre' : 'lib-lc--mid'}`}>{f.lifecycle}</span></td>
                  <td><button className="lib-matrix-cell" onClick={() => { setSearch(f.code); setFDim('完整性'); setView('atomic') }}><span className="lib-dim-dot" />{f.integrity} 条 · 已配</button></td>
                  <td><button className="lib-matrix-cell" onClick={() => { setSearch(f.code); setFDim('一致性'); setView('atomic') }}><span className="lib-dim-dot" />{f.consistency} 条 · 已配</button></td>
                  <td><button className="lib-matrix-cell" onClick={() => { setSearch(f.code); setFDim('分布范围'); setView('atomic') }}><span className="lib-dim-dot" />{f.distHard}硬{f.distDynamic ? ` + ${f.distDynamic}动态` : ''}</button></td>
                  <td>
                    {f.correlation
                      ? <button className="lib-matrix-cell" onClick={() => { setSearch(f.code); setFDim('相关性'); setView('atomic') }}><span className="lib-dim-dot" />{f.depFields} 依赖字段</button>
                      : <span className="lib-dim-miss"><md-icon>error</md-icon>未配置</span>}
                  </td>
                  <td><span className="lib-cell-sub">标记并留证</span></td>
                  <td><span className="lib-cell-time" title={f.review}>{f.review.length > 14 ? f.review.slice(0, 14) + '…' : f.review}</span></td>
                  <td className="lib-th-cov"><span className={`lib-cov-pill${f.coverage === 4 ? ' lib-cov-pill--full' : ' lib-cov-pill--gap'}`}>{f.coverage}/4</span></td>
                  <td><span className={`lib-badge ${CONFIRM_CLASS[f.status]}`}>{f.status}</span></td>
                  <td>
                    <div className="lib-row-actions">
                      <button className="lib-row-icon" title="配置规则" onClick={() => { setSearch(f.code); setView('atomic') }}><md-icon>tune</md-icon></button>
                      <button className="lib-row-icon" title="试运行"><md-icon>play_arrow</md-icon></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFields.length === 0 && (
                <tr><td colSpan={11}><div className="lib-empty"><md-icon>search_off</md-icon>未找到符合条件的字段
                  <button className="lib-btn lib-btn--ghost lib-btn--sm" onClick={handleReset}>清空筛选</button></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 原子规则视图 */}
      {view === 'atomic' && (
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead>
              <tr>
                <th className="lib-th-sticky-name">规则</th><th>主字段</th><th>维度/类型</th>
                <th>触发逻辑</th><th>参数</th><th>异常/处置</th><th>状态</th><th>版本/更新</th><th className="lib-th-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((r) => (
                <tr key={r.code}>
                  <td className="lib-th-sticky-name">
                    <button className="lib-name-btn" onClick={() => setDialog({ mode: 'edit', rule: r })}>
                      <span className="lib-cell-name">{r.name}</span>
                      <span className="lib-cell-code">{r.code}</span>
                    </button>
                  </td>
                  <td><span className="lib-cell-sub">{r.fieldName}</span><br /><span className="lib-cell-code">{r.fieldCode}</span></td>
                  <td>
                    <div className="lib-dim-cell">
                      <span className={`lib-dim-badge ${DIM_CLASS[r.dim]}`}>{r.dim}</span>
                      <span className="lib-cell-time">{r.ruleType}</span>
                    </div>
                  </td>
                  <td><span className="lib-cell-ellipsis" title={r.expr}>{r.expr}</span></td>
                  <td><span className="lib-cell-ellipsis" title={r.params}>{r.params}</span></td>
                  <td>
                    <div className="lib-action-cell">
                      <span className={`lib-badge ${LEVEL_CLASS[r.level]}`}>{r.level}</span>
                      <span className="lib-cell-time">{r.action.length > 12 ? r.action.slice(0, 12) + '…' : r.action}</span>
                    </div>
                  </td>
                  <td><span className={`lib-badge ${RULE_STATUS_CLASS[r.status]}`}>{r.status}</span></td>
                  <td>
                    <div className="lib-cell-version">
                      <span className="lib-version-chip">{r.version}</span>
                      <span className="lib-cell-time">{r.updatedAt}</span>
                    </div>
                  </td>
                  <td>
                    <div className="lib-row-actions">
                      <button className="lib-row-icon" title="编辑" onClick={() => setDialog({ mode: 'edit', rule: r })}><md-icon>edit</md-icon></button>
                      <button className="lib-row-icon" title="试运行" onClick={() => setDialog({ mode: 'edit', rule: r })}><md-icon>science</md-icon></button>
                      <button className="lib-row-icon" title="复制" onClick={() => setDialog({ mode: 'view', rule: r })}><md-icon>content_copy</md-icon></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRules.length === 0 && (
                <tr><td colSpan={9}><div className="lib-empty"><md-icon>search_off</md-icon>未找到符合条件的规则
                  <button className="lib-btn lib-btn--ghost lib-btn--sm" onClick={handleReset}>清空筛选</button></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {dialog && <RuleDialog rule={dialog.rule} mode={dialog.mode} onClose={() => setDialog(null)} onSave={handleSave} />}
      {logicOpen && <LogicDrawer onClose={() => setLogicOpen(false)} />}
    </div>
  )
}
