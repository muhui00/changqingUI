'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  FIELDS, FIELD_METRICS, LIFECYCLES, CATEGORIES, REQUIRE_LEVELS, CONFIRM_STATUSES,
  TREATMENTS, ISSUES, ISSUE_COUNT, BLOCKING_ISSUE_COUNT,
  type FieldStd, type FieldCategory, type Lifecycle, type RequireLevel, type ConfirmStatus,
} from './library-data'

// ─── 状态样式 ────────────────────────────────────────────────
const CONFIRM_CLASS: Record<ConfirmStatus, string> = {
  '可试运行': 'lib-badge--enabled',
  '待业务确认': 'lib-badge--review',
  '阻断确认': 'lib-badge--blocked',
}
const LIFECYCLE_CLASS: Record<Lifecycle, string> = {
  '压前': 'lib-lc--pre', '压中': 'lib-lc--mid', '压后': 'lib-lc--post',
}

const treatmentName = (id: string) => TREATMENTS.find((t) => t.id === id)?.name ?? '标记并留证'

// ─── 覆盖维度单元格 ──────────────────────────────────────────
function DimCell({ count, missing, label }: { count: number; missing?: boolean; label: string }) {
  if (missing) {
    return <span className="lib-dim-miss"><md-icon>error</md-icon>未配置</span>
  }
  return (
    <span className="lib-dim-ok" title={`${label}：已绑定 ${count} 条`}>
      <span className="lib-dim-dot" />{count} 已配
    </span>
  )
}

// ─── 行展开：字段质检绑定卡 ───────────────────────────────────
function BindingCard({ f, onViewRule }: { f: FieldStd; onViewRule: (code: string, dim: string) => void }) {
  const rows: { dim: string; summary: string }[] = [
    { dim: '完整性', summary: `${f.require}；数据集缺失率≥5% 触发告警${f.require === '必填' ? '，关键字段单条命中' : ''}` },
    { dim: '一致性', summary: `${f.dataType}${f.unit !== '—' ? `；标准单位 ${f.unit}` : ''}；来源量纲一致且可追溯` },
    { dim: '分布范围', summary: `硬边界：${f.boundary}${f.distDynamic ? `；动态：同组 P10–P90，IQR 1.5/3.0，n≥30` : '；无动态分布'}` },
    { dim: '相关性', summary: f.correlation ? `与 ${f.depFields} 个依赖字段满足业务公式/配套/时序关系` : '未配置（缺业务含义，阻断发布）' },
  ]
  return (
    <div className="lib-binding-card">
      <div className="lib-binding-head">
        <span className="lib-binding-title">字段质检绑定：{f.name} <span className="lib-cell-code">{f.code}</span></span>
        <span className={`lib-cov-pill${f.coverage === 4 ? ' lib-cov-pill--full' : ' lib-cov-pill--gap'}`}>
          覆盖 {f.coverage}/4 · {f.status}
        </span>
      </div>
      <div className="lib-binding-rows">
        {rows.map((r) => (
          <div className="lib-binding-row" key={r.dim}>
            <span className="lib-binding-dim">{r.dim}</span>
            <span className={`lib-binding-sum${r.dim === '相关性' && !f.correlation ? ' lib-binding-sum--miss' : ''}`}>{r.summary}</span>
            <button className="lib-binding-link" onClick={() => onViewRule(f.code, r.dim)}>
              查看规则<md-icon>arrow_forward</md-icon>
            </button>
          </div>
        ))}
        <div className="lib-binding-row">
          <span className="lib-binding-dim">默认处置</span>
          <span className="lib-binding-sum">{treatmentName(f.treatment)}；唯一低风险单位换算可生成标准值，原始值永不覆盖</span>
          <span />
        </div>
        <div className="lib-binding-row">
          <span className="lib-binding-dim">专家复核</span>
          <span className="lib-binding-sum">{f.review}</span>
          <span />
        </div>
      </div>
    </div>
  )
}

// ─── 新建/编辑弹窗（5 页签）───────────────────────────────────
type DialogTab = 'base' | 'binding' | 'treat' | 'mapping' | 'version'
const DIALOG_TABS: [DialogTab, string][] = [
  ['base', '基础标准'], ['binding', '质检绑定'], ['treat', '异常处置与复核'], ['mapping', '来源映射'], ['version', '版本与依据'],
]

interface FieldDialogProps {
  field: FieldStd | null
  mode: 'create' | 'edit' | 'view'
  onClose: () => void
  onSave: (f: FieldStd) => void
}

function FieldDialog({ field, mode, onClose, onSave }: FieldDialogProps) {
  const [tab, setTab] = useState<DialogTab>('base')
  const [name, setName] = useState(field?.name ?? '')
  const [code, setCode] = useState(field?.code ?? '')
  const [rawName, setRawName] = useState(field?.rawName ?? '')
  const [lifecycle, setLifecycle] = useState<Lifecycle>(field?.lifecycle ?? '压前')
  const [category, setCategory] = useState<FieldCategory>(field?.category ?? '工程参数')
  const [dataType, setDataType] = useState(field?.dataType ?? '小数')
  const [unit, setUnit] = useState(field?.unit ?? 'm³')
  const [require, setRequire] = useState<RequireLevel>(field?.require ?? '必填')
  const [definition, setDefinition] = useState(field?.definition ?? '')
  const [boundary, setBoundary] = useState(field?.boundary ?? '')
  const [status, setStatus] = useState<ConfirmStatus>(field?.status ?? '待业务确认')
  const [treatment, setTreatment] = useState(field?.treatment ?? 'TP_MARK_EVIDENCE')
  const [nameErr, setNameErr] = useState('')

  const readOnly = mode === 'view'
  const isEnabledEdit = mode === 'edit' && field?.status === '可试运行'
  const title = mode === 'create' ? '新建字段' : mode === 'view' ? '查看字段' : '编辑字段'

  const cov = field?.coverage ?? (require ? 3 : 0)

  const handleSave = () => {
    if (!name.trim()) { setNameErr('标准字段名称不能为空'); setTab('base'); return }
    const next: FieldStd = {
      ...(field ?? FIELDS[0]),
      code: code.trim().toUpperCase() || `FIELD_${Date.now()}`,
      name: name.trim(), rawName: rawName || name.trim(), lifecycle, category, dataType, unit, require,
      status, treatment, definition, boundary,
      version: isEnabledEdit ? 'V0.2' : (field?.version ?? 'V0.1'),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16).replace(/\//g, '-'),
      updatedBy: '张工',
    }
    onSave(next)
  }

  return (
    <div className="lib-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="lib-dialog lib-dialog--wide" role="dialog" aria-modal="true" aria-label={title}>
        <div className="lib-dialog-header">
          <div className="lib-dialog-headmeta">
            <span className="md-typescale-title-medium lib-dialog-title">{title}</span>
            {field && (
              <div className="lib-dialog-tags">
                <span className="lib-cell-code">{code || field.code}</span>
                <span className="lib-version-chip">{field.version}</span>
                <span className={`lib-badge ${CONFIRM_CLASS[status]}`}>{status}</span>
                <span className={`lib-cov-pill${cov === 4 ? ' lib-cov-pill--full' : ' lib-cov-pill--gap'}`}>覆盖 {cov}/4</span>
              </div>
            )}
          </div>
          <button className="lib-icon-btn" onClick={onClose} aria-label="关闭"><md-icon>close</md-icon></button>
        </div>

        {isEnabledEdit && (
          <div className="lib-dialog-notice">
            <md-icon>info</md-icon>当前为可试运行版本 {field?.version}，保存修改将生成新草稿版本，不覆盖在线版本。
          </div>
        )}

        <div className="lib-tabs lib-tabs--dialog" role="tablist">
          {DIALOG_TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k}
              className={`lib-tab${tab === k ? ' lib-tab--active' : ''}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        <div className="lib-dialog-body">
          {/* 标签一：基础标准 */}
          {tab === 'base' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />标识与归属</div>
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">原始数据项名称<span className="lib-required">*</span></label>
                  <input className="lib-input" value={rawName} disabled={readOnly} onChange={(e) => setRawName(e.target.value)} placeholder="保留来源系统原称" />
                </div>
                <div className="lib-field">
                  <label className="lib-label">标准字段名称<span className="lib-required">*</span></label>
                  <input className={`lib-input${nameErr ? ' lib-input--error' : ''}`} value={name} disabled={readOnly}
                    onChange={(e) => { setName(e.target.value); setNameErr('') }} placeholder="如：完钻井深" />
                  {nameErr && <span className="lib-error-msg">{nameErr}</span>}
                </div>
                <div className="lib-field">
                  <label className="lib-label">字段编码<span className="lib-required">*</span></label>
                  <input className="lib-input lib-input--mono" value={code} disabled={readOnly || isEnabledEdit}
                    onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="TOTAL_DEPTH" />
                  {isEnabledEdit && <span className="lib-hint">启用后编码不可修改</span>}
                </div>
                <div className="lib-field">
                  <label className="lib-label">生命周期<span className="lib-required">*</span></label>
                  <select className="lib-select" value={lifecycle} disabled={readOnly} onChange={(e) => setLifecycle(e.target.value as Lifecycle)}>
                    {LIFECYCLES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">字段分类<span className="lib-required">*</span></label>
                  <select className="lib-select" value={category} disabled={readOnly} onChange={(e) => setCategory(e.target.value as FieldCategory)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">必填级别<span className="lib-required">*</span></label>
                  <select className="lib-select" value={require} disabled={readOnly} onChange={(e) => setRequire(e.target.value as RequireLevel)}>
                    {REQUIRE_LEVELS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--success" />定义与边界</div>
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">数据类型<span className="lib-required">*</span></label>
                  <select className="lib-select" value={dataType} disabled={readOnly} onChange={(e) => setDataType(e.target.value as FieldStd['dataType'])}>
                    {['文本', '整数', '小数', '日期时间', '枚举', '对象'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">标准单位/量纲{(dataType === '小数' || dataType === '整数') && <span className="lib-required">*</span>}</label>
                  <input className="lib-input" value={unit} disabled={readOnly} onChange={(e) => setUnit(e.target.value)} placeholder="m / MPa / m³" />
                </div>
                <div className="lib-field">
                  <label className="lib-label">确认状态<span className="lib-required">*</span></label>
                  <select className="lib-select" value={status} disabled={readOnly} onChange={(e) => setStatus(e.target.value as ConfirmStatus)}>
                    {CONFIRM_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="lib-field lib-field--full">
                  <label className="lib-label">业务定义<span className="lib-required">*</span></label>
                  <textarea className="lib-textarea" rows={2} value={definition} disabled={readOnly}
                    onChange={(e) => setDefinition(e.target.value)} placeholder="明确对象、统计口径、时段与基准" />
                </div>
                <div className="lib-field lib-field--full">
                  <label className="lib-label">物理/业务硬边界<span className="lib-required">*</span></label>
                  <input className="lib-input" value={boundary} disabled={readOnly} onChange={(e) => setBoundary(e.target.value)}
                    placeholder="数值用上下界；枚举用字典；对象用 Schema" />
                </div>
              </div>
            </div>
          )}

          {/* 标签二：质检绑定 */}
          {tab === 'binding' && (
            <div className="lib-tab-panel">
              <div className="lib-cov-progress">
                <span>完整性 1/1</span><span>一致性 1/1</span>
                <span>分布 {(field?.distHard ?? 1) + (field?.distDynamic ?? 0)}/1</span>
                <span className={field?.correlation === 0 ? 'lib-cov-progress--miss' : ''}>相关性 {field?.correlation ?? 1}/1</span>
                <span className="lib-cov-progress--total">总覆盖 {cov}/4</span>
              </div>
              {(['完整性', '一致性', '分布范围', '相关性'] as const).map((dim) => {
                const miss = dim === '相关性' && field?.correlation === 0
                return (
                  <div className="lib-rule-card" key={dim}>
                    <div className="lib-rule-card-head">
                      <span className={`lib-dim-badge ${dim === '完整性' ? 'lib-dim--completeness' : dim === '一致性' ? 'lib-dim--consistency' : dim === '分布范围' ? 'lib-dim--distribution' : 'lib-dim--correlation'}`}>{dim}规则</span>
                      {miss ? <span className="lib-dim-miss"><md-icon>error</md-icon>未配置，阻断发布</span>
                        : <span className="lib-cell-code">QC_{dim === '完整性' ? 'C' : dim === '一致性' ? 'I' : dim === '分布范围' ? 'R' : 'B'}_{field?.code ?? 'FIELD'} · V0.1</span>}
                    </div>
                    <p className="lib-rule-card-sum">
                      {dim === '完整性' && `${require}；空值集合 NULL/空串/NaN/哨兵；数据集缺失率≥5% 告警`}
                      {dim === '一致性' && `${dataType}${unit !== '—' ? `；标准单位 ${unit}` : ''}；允许来源单位换算，默认不自动标准化`}
                      {dim === '分布范围' && `硬边界（必配）：${boundary || '—'}${field?.distDynamic ? '；动态分布：P10–P90 / IQR 1.5·3.0 / n≥30' : ''}`}
                      {dim === '相关性' && (miss ? '缺业务含义、单位与公式，暂缺相关性规则' : `依赖 ${field?.depFields ?? 1} 个字段；从业务逻辑库选择公式或可视化构建`)}
                    </p>
                    {!readOnly && (
                      <button className="lib-btn lib-btn--ghost lib-btn--sm">
                        <md-icon>{miss ? 'add' : 'edit'}</md-icon>{miss ? '生成规则草稿' : '编辑规则'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 标签三：异常处置与复核 */}
          {tab === 'treat' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />默认处置</div>
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">默认异常处置<span className="lib-required">*</span></label>
                  <select className="lib-select" value={treatment} disabled={readOnly} onChange={(e) => setTreatment(e.target.value)}>
                    {TREATMENTS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">允许生成标准值</label>
                  <select className="lib-select" disabled={readOnly}><option>关闭（默认）</option><option>仅唯一单位换算</option></select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">是否覆盖原始值</label>
                  <input className="lib-input" value="永不允许" disabled />
                </div>
              </div>
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--warning" />专家复核</div>
              <div className="lib-form-grid">
                <div className="lib-field lib-field--full">
                  <label className="lib-label">专家复核条件</label>
                  <input className="lib-input" defaultValue={field?.review} disabled={readOnly} />
                </div>
                <div className="lib-field">
                  <label className="lib-label">复核比例</label>
                  <select className="lib-select" disabled={readOnly}><option>一般抽样 / 严重100% / 阻断100%</option></select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">复核角色</label>
                  <select className="lib-select" disabled={readOnly}><option>{category.replace('参数', '')}专家</option><option>数据标准专家</option></select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">超时策略</label>
                  <select className="lib-select" disabled={readOnly}><option>升级责任人并提醒管理员</option></select>
                </div>
              </div>
              <p className="lib-inline-note"><md-icon>shield</md-icon>处置优先级：任务级覆盖 &gt; 字段绑定默认 &gt; 规则默认 &gt; 平台安全默认；多规则冲突时不改值，转专家复核。</p>
            </div>
          )}

          {/* 标签四：来源映射 */}
          {tab === 'mapping' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />来源字段映射</div>
              <table className="lib-inner-table">
                <thead><tr><th>来源系统</th><th>数据表/文件</th><th>来源字段</th><th>来源单位</th><th>标准化方式</th><th>状态</th></tr></thead>
                <tbody>
                  <tr><td>钻井库</td><td>WELL_BASE</td><td className="lib-input--mono">{field?.code ?? 'SRC_A'}</td><td>{unit}</td><td>{unit !== '—' ? '单位核对' : '无'}</td><td><span className="lib-badge lib-badge--enabled">启用</span></td></tr>
                  <tr><td>施工文档库</td><td>FRAC_DOC</td><td className="lib-input--mono">src_{(field?.code ?? 'x').toLowerCase()}</td><td>待确认</td><td>不自动换算</td><td><span className="lib-badge lib-badge--review">待业务确认</span></td></tr>
                </tbody>
              </table>
              <p className="lib-inline-note"><md-icon>info</md-icon>同一来源+对象+字段在同一有效期内只能映射到一个启用字段版本；来源单位不明确时禁止自动换算。</p>
            </div>
          )}

          {/* 标签五：版本与依据 */}
          {tab === 'version' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />版本历史</div>
              <table className="lib-inner-table">
                <thead><tr><th>版本</th><th>状态</th><th>创建人</th><th>生效时间</th><th>变更说明</th><th>覆盖差异</th></tr></thead>
                <tbody>
                  <tr><td>{field?.version ?? 'V0.1'}</td><td><span className={`lib-badge ${CONFIRM_CLASS[status]}`}>{status}</span></td><td>{field?.updatedBy ?? '张工'}</td><td>{field?.updatedAt ?? '—'}</td><td>建立六项绑定</td><td>{cov}/4</td></tr>
                </tbody>
              </table>
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--warning" />关联待确认口径</div>
              <table className="lib-inner-table">
                <thead><tr><th>编号</th><th>事项</th><th>本版处理</th><th>影响</th></tr></thead>
                <tbody>
                  {ISSUES.filter((it) => it.title.includes(field?.name ?? '###') || (field?.code === 'GQ' && it.code === 'I009')).map((it) => (
                    <tr key={it.code}><td>{it.code}</td><td>{it.title}</td><td>{it.handling}</td><td>{it.impact}</td></tr>
                  ))}
                  {!ISSUES.some((it) => it.title.includes(field?.name ?? '###') || (field?.code === 'GQ' && it.code === 'I009')) && (
                    <tr><td colSpan={4} className="lib-cell-time">无关联待确认口径</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lib-dialog-footer">
          {readOnly ? (
            <>
              <button className="lib-btn lib-btn--ghost" onClick={onClose}>关闭</button>
              <button className="lib-btn lib-btn--primary" onClick={handleSave}><md-icon>content_copy</md-icon>复制为新字段</button>
            </>
          ) : (
            <>
              <button className="lib-btn lib-btn--ghost" onClick={onClose}>取消</button>
              <button className="lib-btn lib-btn--tonal" onClick={handleSave}>保存草稿</button>
              <button className="lib-btn lib-btn--primary" onClick={handleSave} disabled={cov < 4}>
                <md-icon>check</md-icon>{cov < 4 ? '覆盖不足，暂不可发布' : '保存并预检'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 待确认口径抽屉 ──────────────────────────────────────────
function IssueDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="lib-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="lib-drawer" role="dialog" aria-label="口径待确认">
        <div className="lib-drawer-head">
          <span className="md-typescale-title-medium">口径待确认（{ISSUE_COUNT}）</span>
          <button className="lib-icon-btn" onClick={onClose} aria-label="关闭"><md-icon>close</md-icon></button>
        </div>
        <div className="lib-drawer-body">
          {ISSUES.map((it) => (
            <div className="lib-issue-item" key={it.code}>
              <div className="lib-issue-top">
                <span className="lib-issue-code">{it.code}</span>
                {it.blocking && <span className="lib-badge lib-badge--blocked">阻断</span>}
                <span className={`lib-badge ${it.status === '已关闭' ? 'lib-badge--enabled' : it.status === '处理中' ? 'lib-badge--running' : 'lib-badge--review'}`}>{it.status}</span>
              </div>
              <div className="lib-issue-title">{it.title}</div>
              <div className="lib-issue-meta">本版处理：{it.handling}</div>
              <div className="lib-issue-meta">影响：{it.impact} · 责任人：{it.owner}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────
export function FieldStandardLibrary({ onNavRule }: { onNavRule?: (fieldCode?: string, dim?: string) => void }) {
  const [fields, setFields] = useState<FieldStd[]>(FIELDS)
  const [search, setSearch] = useState('')
  const [fLife, setFLife] = useState<Lifecycle | '全部生命周期'>('全部生命周期')
  const [fCat, setFCat] = useState<FieldCategory | '全部分类'>('全部分类')
  const [fReq, setFReq] = useState<RequireLevel | '全部必填'>('全部必填')
  const [fCov, setFCov] = useState<'全部覆盖' | '4/4完整' | '有缺口'>('全部覆盖')
  const [fStatus, setFStatus] = useState<ConfirmStatus | '全部状态'>('全部状态')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit' | 'view'; field: FieldStd | null } | null>(null)
  const [issueOpen, setIssueOpen] = useState(false)

  const filtered = useMemo(() => fields.filter((f) => {
    const s = search.trim().toLowerCase()
    const matchSearch = !s || f.name.toLowerCase().includes(s) || f.code.toLowerCase().includes(s) || f.rawName.toLowerCase().includes(s)
    const matchCov = fCov === '全部覆盖' || (fCov === '4/4完整' ? f.coverage === 4 : f.coverage < 4)
    return matchSearch && matchCov
      && (fLife === '全部生命周期' || f.lifecycle === fLife)
      && (fCat === '全部分类' || f.category === fCat)
      && (fReq === '全部必填' || f.require === fReq)
      && (fStatus === '全部状态' || f.status === fStatus)
  }), [fields, search, fLife, fCat, fReq, fCov, fStatus])

  const activeFilters = (search ? 1 : 0) + (fLife !== '全部生命周期' ? 1 : 0) + (fCat !== '全部分类' ? 1 : 0)
    + (fReq !== '全部必填' ? 1 : 0) + (fCov !== '全部覆盖' ? 1 : 0) + (fStatus !== '全部状态' ? 1 : 0)

  const handleReset = () => { setSearch(''); setFLife('全部生命周期'); setFCat('全部分类'); setFReq('全部必填'); setFCov('全部覆盖'); setFStatus('全部状态') }
  const toggleExpand = (id: string) => setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected((p) => p.size === filtered.length ? new Set() : new Set(filtered.map((f) => f.code)))
  const handleViewRule = (code: string, dim: string) => onNavRule?.(code, dim)

  const handleSave = (f: FieldStd) => {
    setFields((p) => dialog?.mode === 'create' ? [f, ...p] : p.map((x) => x.code === f.code ? f : x))
    setDialog(null)
  }

  const metrics: { key: string; label: string; value: number; onClick: () => void; danger?: boolean; ok?: boolean }[] = [
    { key: 'total', label: '标准字段', value: FIELD_METRICS.total, onClick: () => setFStatus('全部状态') },
    { key: 'full', label: '四维覆盖完整', value: FIELD_METRICS.fullCoverage, ok: true, onClick: () => setFCov('4/4完整') },
    { key: 'gap', label: '覆盖缺口', value: FIELD_METRICS.gap, danger: true, onClick: () => setFCov('有缺口') },
    { key: 'testable', label: '可试运行', value: FIELD_METRICS.testable, onClick: () => setFStatus('可试运行') },
    { key: 'pending', label: '待业务确认', value: FIELD_METRICS.pending, onClick: () => setFStatus('待业务确认') },
    { key: 'rules', label: '规则总量', value: FIELD_METRICS.ruleTotal, onClick: () => onNavRule?.() },
  ]

  return (
    <div className="lib-center">
      {/* 页面头部 */}
      <div className="lib-page-header">
        <div className="lib-breadcrumb md-typescale-label-medium">
          <md-icon>tune</md-icon>质控配置<md-icon class="lib-bc-sep">chevron_right</md-icon>
          <span className="lib-bc-current">字段标准库</span>
        </div>
        <div className="lib-page-header-row">
          <div>
            <h1 className="md-typescale-headline-small lib-page-title">字段标准库</h1>
            <p className="md-typescale-body-medium lib-page-subtitle">统一维护字段定义，并确保每个字段完成完整性、一致性、分布范围、相关性及默认异常处置绑定</p>
          </div>
          <div className="lib-header-actions">
            <button className="lib-btn lib-btn--ghost"><md-icon>upload_file</md-icon>批量导入</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>download</md-icon>导出标准</button>
            <button className="lib-btn lib-btn--ghost lib-btn--badge" onClick={() => setIssueOpen(true)}>
              <md-icon>rule_folder</md-icon>口径待确认<span className="lib-btn-count">{ISSUE_COUNT}</span>
              {BLOCKING_ISSUE_COUNT > 0 && <span className="lib-btn-dot" title={`${BLOCKING_ISSUE_COUNT} 项阻断`} />}
            </button>
            <button className="lib-btn lib-btn--primary" onClick={() => setDialog({ mode: 'create', field: null })}>
              <md-icon>add</md-icon>新建字段
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

      {/* 筛选栏 */}
      <div className="lib-filter-bar">
        <div className="lib-search-wrap">
          <md-icon>search</md-icon>
          <input className="lib-search-input" placeholder="搜索字段名称、编码、原始名称、别名..." value={search}
            onChange={(e) => setSearch(e.target.value)} aria-label="搜索字段" />
          {search && <button className="lib-search-clear" onClick={() => setSearch('')} aria-label="清空"><md-icon>close</md-icon></button>}
        </div>
        <select className="lib-filter-select" value={fLife} onChange={(e) => setFLife(e.target.value as Lifecycle | '全部生命周期')} aria-label="生命周期">
          <option>全部生命周期</option>{LIFECYCLES.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select className="lib-filter-select" value={fCat} onChange={(e) => setFCat(e.target.value as FieldCategory | '全部分类')} aria-label="字段分类">
          <option>全部分类</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="lib-filter-select" value={fReq} onChange={(e) => setFReq(e.target.value as RequireLevel | '全部必填')} aria-label="必填级别">
          <option>全部必填</option>{REQUIRE_LEVELS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className="lib-filter-select" value={fCov} onChange={(e) => setFCov(e.target.value as typeof fCov)} aria-label="规则覆盖">
          <option>全部覆盖</option><option>4/4完整</option><option>有缺口</option>
        </select>
        <select className="lib-filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value as ConfirmStatus | '全部状态')} aria-label="确认状态">
          <option>全部状态</option>{CONFIRM_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {activeFilters > 0 && <button className="lib-reset-btn" onClick={handleReset}><md-icon>filter_alt_off</md-icon>重置</button>}
      </div>

      {/* 列表标题 */}
      <div className="lib-result-bar">
        <span className="md-typescale-label-medium lib-result-count">
          共 <strong>{filtered.length}</strong> 条 · 四维完整 <strong>{filtered.filter((f) => f.coverage === 4).length}</strong> · 缺口 <strong>{filtered.filter((f) => f.coverage < 4).length}</strong>
        </span>
        {selected.size > 0 && (
          <div className="lib-batch-actions">
            <span className="lib-batch-count">已选 {selected.size} 条</span>
            <button className="lib-btn lib-btn--ghost lib-btn--sm">批量导出</button>
            <button className="lib-btn lib-btn--ghost lib-btn--sm">批量提交预检</button>
          </div>
        )}
      </div>

      {/* 表格 */}
      <div className="lib-table-wrap">
        <table className="lib-table lib-table--fields">
          <thead>
            <tr>
              <th className="lib-th-expand" aria-label="展开" />
              <th className="lib-th-check"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} aria-label="全选" /></th>
              <th className="lib-th-sticky-name">字段名称</th>
              <th>生命周期/分类</th><th>类型/单位</th><th>必填</th>
              <th>完整性</th><th>一致性</th><th>分布范围</th><th>相关性</th>
              <th className="lib-th-cov">覆盖</th><th>默认处置</th><th>确认状态</th><th>版本/更新</th>
              <th className="lib-th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <Fragment key={f.code}>
                <tr className={selected.has(f.code) ? 'lib-row--checked' : ''}>
                  <td>
                    <button className="lib-expand-btn" onClick={() => toggleExpand(f.code)} aria-label={expanded.has(f.code) ? '收起' : '展开'} aria-expanded={expanded.has(f.code)}>
                      <md-icon>{expanded.has(f.code) ? 'expand_more' : 'chevron_right'}</md-icon>
                    </button>
                  </td>
                  <td><input type="checkbox" checked={selected.has(f.code)} onChange={() => toggleSelect(f.code)} aria-label={`选择${f.name}`} /></td>
                  <td className="lib-th-sticky-name">
                    <button className="lib-name-btn" onClick={() => setDialog({ mode: 'edit', field: f })}>
                      <span className="lib-cell-name">{f.name}</span>
                      <span className="lib-cell-code">{f.code}</span>
                    </button>
                  </td>
                  <td>
                    <div className="lib-tag-stack">
                      <span className={`lib-lc-badge ${LIFECYCLE_CLASS[f.lifecycle]}`}>{f.lifecycle}</span>
                      <span className="lib-cell-time">{f.category}</span>
                    </div>
                  </td>
                  <td><span className="lib-cell-sub">{f.dataType}{f.unit !== '—' ? ` · ${f.unit}` : ''}</span></td>
                  <td><span className="lib-cell-sub">{f.require}</span></td>
                  <td><DimCell count={f.integrity} label="完整性" /></td>
                  <td><DimCell count={f.consistency} label="一致性" /></td>
                  <td>
                    <span className="lib-dist-cell" title={`${f.distHard}硬 + ${f.distDynamic}动态`}>
                      <span className="lib-dim-dot" />{f.distHard}硬{f.distDynamic ? ` + ${f.distDynamic}动态` : ''}
                    </span>
                  </td>
                  <td><DimCell count={f.correlation} missing={f.correlation === 0} label="相关性" /></td>
                  <td className="lib-th-cov">
                    <span className={`lib-cov-pill${f.coverage === 4 ? ' lib-cov-pill--full' : ' lib-cov-pill--gap'}`}>{f.coverage}/4</span>
                  </td>
                  <td><span className="lib-cell-sub">{treatmentName(f.treatment)}</span></td>
                  <td><span className={`lib-badge ${CONFIRM_CLASS[f.status]}`}>{f.status}</span></td>
                  <td>
                    <div className="lib-cell-version">
                      <span className="lib-version-chip">{f.version}</span>
                      <span className="lib-cell-time">{f.updatedAt} · {f.updatedBy}</span>
                    </div>
                  </td>
                  <td>
                    <div className="lib-row-actions">
                      <button className="lib-row-icon" title="编辑" onClick={() => setDialog({ mode: 'edit', field: f })}><md-icon>edit</md-icon></button>
                      <button className="lib-row-icon" title="查看规则" onClick={() => onNavRule?.(f.code)}><md-icon>fact_check</md-icon></button>
                      <button className="lib-row-icon" title="复制" onClick={() => setDialog({ mode: 'view', field: f })}><md-icon>content_copy</md-icon></button>
                    </div>
                  </td>
                </tr>
                {expanded.has(f.code) && (
                  <tr className="lib-expand-row">
                    <td colSpan={15}><BindingCard f={f} onViewRule={handleViewRule} /></td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={15}><div className="lib-empty"><md-icon>search_off</md-icon>未找到符合条件的字段
                <button className="lib-btn lib-btn--ghost lib-btn--sm" onClick={handleReset}>清空筛选</button></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {dialog && <FieldDialog field={dialog.field} mode={dialog.mode} onClose={() => setDialog(null)} onSave={handleSave} />}
      {issueOpen && <IssueDrawer onClose={() => setIssueOpen(false)} />}
    </div>
  )
}
