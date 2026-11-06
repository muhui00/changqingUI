'use client'

import { useMemo, useState } from 'react'
import {
  CATEGORIES, FIELDS, FIELD_MAP, KIND_LABEL, METHODS_BY_KIND, TEMPLATES, TEMPLATE_MAP, WELLS,
  basicValue, coverageOf, isBusiness, type NdConfig,
} from './nd-model'

interface Props {
  config: NdConfig
  update: (patch: Partial<NdConfig>) => void
  nameError: string
  onTemplateChange: (id: string) => void
}

export function NdStepSelect({ config, update, nameError, onTemplateChange }: Props) {
  const [tab, setTab] = useState<'wells' | 'fields'>('wells')
  const [wellSearch, setWellSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState('全部')

  const template = TEMPLATE_MAP[config.templateId] ?? null
  const templateChosen = !!template
  const allowed = new Set(template?.fields ?? [])
  const selectedWells = WELLS.filter((w) => config.wellIds.includes(w.id))
  const businessCount = config.fieldIds.filter(isBusiness).length

  const visibleWells = useMemo(
    () => WELLS.filter((w) =>
      (!wellSearch || w.name.includes(wellSearch.trim())) &&
      (typeFilter === '全部' || w.type === typeFilter) &&
      (statusFilter === '全部' || w.status === statusFilter)),
    [wellSearch, typeFilter, statusFilter],
  )
  const blocks = [...new Set(WELLS.map((w) => w.block))]

  const toggleWell = (id: string) =>
    update({ wellIds: config.wellIds.includes(id) ? config.wellIds.filter((x) => x !== id) : [...config.wellIds, id] })
  // 检索结果内全选；不静默取消检索外已选井
  const selectVisible = () => update({ wellIds: [...new Set([...config.wellIds, ...visibleWells.map((w) => w.id)])] })
  const clearWells = () => update({ wellIds: [] })

  const toggleField = (id: string) => {
    const f = FIELD_MAP[id]
    if (f.locked || (isBusiness(id) && !allowed.has(id))) return
    update({ fieldIds: config.fieldIds.includes(id) ? config.fieldIds.filter((x) => x !== id) : [...config.fieldIds, id] })
  }

  const setMethod = (id: string, m: string) => update({ methods: { ...config.methods, [id]: m } })

  const matrixFields = FIELDS.filter((f) => config.fieldIds.includes(f.id) && f.id !== 'well_no')

  return (
    <div className="ndw-step1">
      {/* 名称与质检模板 */}
      <section className="ndw-card ndw-basic" aria-label="基本信息">
        <div className="ndw-basic-field">
          <label htmlFor="ndw-name" className="ndw-label">数据集名称<span className="ndw-req">*</span></label>
          <input
            id="ndw-name"
            className={`ndw-input${nameError ? ' ndw-input--error' : ''}`}
            value={config.name}
            maxLength={100}
            placeholder="请输入数据集名称（1—100 字）"
            onChange={(e) => update({ name: e.target.value })}
            aria-invalid={!!nameError}
            aria-describedby="ndw-name-msg"
          />
          <span id="ndw-name-msg" className={nameError ? 'ndw-msg ndw-msg--error' : 'ndw-msg'}>
            {nameError || `${config.name.trim().length}/100，提交时服务端将再次校验同名`}
          </span>
        </div>
        <div className="ndw-basic-field">
          <label htmlFor="ndw-template" className="ndw-label">质检模板<span className="ndw-req">*</span></label>
          <select
            id="ndw-template"
            className="ndw-input ndw-select"
            value={config.templateId}
            onChange={(e) => onTemplateChange(e.target.value)}
          >
            <option value="">请先选择质检模板…</option>
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}（{t.code}）</option>)}
          </select>
          <span className="ndw-msg">
            {templateChosen
              ? `模板提供 ${template!.fields.length} 个业务字段及默认计算方法，仅可配置模板内业务字段`
              : '选择模板后系统默认勾选模板字段，并加载默认计算方法'}
          </span>
        </div>
      </section>

      <div className="ndw-select-grid">
        {/* 井与字段选择 */}
        <aside className="ndw-card ndw-picker" aria-label="井与字段选择">
          <div className="ndw-seg" role="tablist" aria-label="选择对象">
            <button role="tab" aria-selected={tab === 'wells'} className={`ndw-seg-btn${tab === 'wells' ? ' ndw-seg-btn--on' : ''}`} onClick={() => setTab('wells')}>
              井 <span className="ndw-seg-count">{config.wellIds.length}/{WELLS.length}</span>
            </button>
            <button role="tab" aria-selected={tab === 'fields'} className={`ndw-seg-btn${tab === 'fields' ? ' ndw-seg-btn--on' : ''}`} onClick={() => setTab('fields')}>
              字段 <span className="ndw-seg-count">业务 {businessCount}</span>
            </button>
          </div>

          <div className={`ndw-picker-body${templateChosen ? '' : ' ndw-locked'}`}>
            {!templateChosen && (
              <div className="ndw-gate" role="status">
                <md-icon class="ndw-gate-icon">rule_folder</md-icon>
                <span className="ndw-gate-title">请先选择质检模板</span>
                <span className="ndw-gate-desc">模板决定可选业务字段与默认计算方法</span>
              </div>
            )}

            {tab === 'wells' ? (
              <>
                <div className="ndw-search">
                  <md-icon>search</md-icon>
                  <input value={wellSearch} onChange={(e) => setWellSearch(e.target.value)} placeholder="搜索井名…" aria-label="搜索井名" />
                </div>
                <div className="ndw-filter-row">
                  <select className="ndw-mini-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="井型筛选">
                    <option>全部</option><option>水平井</option><option>直井</option>
                  </select>
                  <select className="ndw-mini-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="井状态筛选">
                    <option>全部</option><option>生产</option><option>关井</option><option>未投产</option>
                  </select>
                  <button className="ndw-link-btn" onClick={selectVisible}>全选</button>
                  <button className="ndw-link-btn" onClick={clearWells}>清空</button>
                </div>
                <div className="ndw-list">
                  {blocks.map((b) => {
                    const list = visibleWells.filter((w) => w.block === b)
                    if (!list.length) return null
                    return (
                      <div key={b} className="ndw-group">
                        <div className="ndw-group-title"><md-icon>location_on</md-icon>{b}</div>
                        {list.map((w) => (
                          <label key={w.id} className={`ndw-row${config.wellIds.includes(w.id) ? ' ndw-row--on' : ''}`}>
                            <input type="checkbox" checked={config.wellIds.includes(w.id)} onChange={() => toggleWell(w.id)} />
                            <span className="ndw-row-name">{w.name}</span>
                            <span className="ndw-tag">{w.type}</span>
                            <span className={`ndw-tag ndw-tag--${w.status === '生产' ? 'ok' : w.status === '关井' ? 'warn' : 'muted'}`}>{w.status}</span>
                          </label>
                        ))}
                      </div>
                    )
                  })}
                  {!visibleWells.length && <div className="ndw-empty-small">没有符合条件的井</div>}
                </div>
              </>
            ) : (
              <div className="ndw-list">
                {CATEGORIES.map((cat) => {
                  const list = FIELDS.filter((f) => f.cat === cat.id)
                  const chosen = list.filter((f) => config.fieldIds.includes(f.id)).length
                  return (
                    <div key={cat.id} className="ndw-group">
                      <div className="ndw-group-title">
                        <md-icon>{cat.icon}</md-icon>{cat.name}
                        <span className="ndw-group-count">{chosen}/{list.length}</span>
                      </div>
                      {cat.id === 'basic' && <div className="ndw-group-hint">用于展示、定位和关联，不参与四维质检</div>}
                      {list.map((f) => {
                        const locked = !!f.locked
                        const outOfTpl = isBusiness(f.id) && !allowed.has(f.id)
                        const checked = config.fieldIds.includes(f.id)
                        return (
                          <label
                            key={f.id}
                            className={`ndw-row${checked ? ' ndw-row--on' : ''}${outOfTpl ? ' ndw-row--disabled' : ''}`}
                            title={locked ? '必要关联标识，由系统保留' : outOfTpl ? '不在所选质检模板内，不可配置' : undefined}
                          >
                            <input type="checkbox" checked={checked} disabled={locked || outOfTpl} onChange={() => toggleField(f.id)} />
                            <span className="ndw-row-name">{f.name}</span>
                            {f.unit && <span className="ndw-unit">{f.unit}</span>}
                            {(locked || outOfTpl) && <md-icon class="ndw-lock">lock</md-icon>}
                          </label>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* 来源覆盖矩阵 */}
        <section className="ndw-card ndw-matrix" aria-label="来源覆盖矩阵">
          <div className="ndw-card-head">
            <span className="ndw-card-title">来源覆盖矩阵</span>
            <span className="ndw-card-sub">按所选井展示来源覆盖，表头可调整计算方法；样本粒度在下一步定义</span>
            <div className="ndw-legend">
              <span><b className="ndw-cov ndw-cov--y">Y</b>有来源数据</span>
              <span><b className="ndw-cov ndw-cov--n">—</b>缺少来源</span>
              <span><b className="ndw-cov ndw-cov--s">未投产</b>业务条件不具备</span>
            </div>
          </div>
          {selectedWells.length === 0 ? (
            <div className="ndw-empty">
              <md-icon>table_view</md-icon>
              <span>从左侧选择井后显示来源覆盖</span>
            </div>
          ) : (
            <div className="ndw-table-wrap">
              <table className="ndw-table">
                <thead>
                  <tr>
                    <th rowSpan={2} className="ndw-sticky ndw-sticky-0">序号</th>
                    <th rowSpan={2} className="ndw-sticky ndw-sticky-1">井号</th>
                    {CATEGORIES.map((cat) => {
                      const n = matrixFields.filter((f) => f.cat === cat.id).length
                      return n ? <th key={cat.id} colSpan={n} className={`ndw-cat-th ndw-cat-th--${cat.id}`}>{cat.name}</th> : null
                    })}
                  </tr>
                  <tr>
                    {matrixFields.map((f) => {
                      const methods = METHODS_BY_KIND[f.kind]
                      const method = config.methods[f.id] ?? methods[0]
                      return (
                        <th key={f.id} className="ndw-field-th">
                          <div className="ndw-th-name">{f.name}{f.unit && <span className="ndw-th-unit">（{f.unit}）</span>}</div>
                          <div className="ndw-th-meta">
                            <span className="ndw-th-kind">{KIND_LABEL[f.kind]}</span>
                            {methods.length > 1 ? (
                              <select className="ndw-th-method" value={method} onChange={(e) => setMethod(f.id, e.target.value)} aria-label={`${f.name}计算方法`}>
                                {methods.map((m) => <option key={m}>{m}</option>)}
                              </select>
                            ) : (
                              <span className="ndw-th-method ndw-th-method--ro">{method}</span>
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {selectedWells.map((w, i) => (
                    <tr key={w.id}>
                      <td className="ndw-sticky ndw-sticky-0 ndw-num">{i + 1}</td>
                      <td className="ndw-sticky ndw-sticky-1 ndw-strong">{w.name}</td>
                      {matrixFields.map((f) => {
                        if (f.cat === 'basic') return <td key={f.id}>{basicValue(w, f.id)}</td>
                        const cov = coverageOf(w.id, f.id)
                        return (
                          <td key={f.id} className="ndw-center">
                            <span className={`ndw-cov ${cov === 'Y' ? 'ndw-cov--y' : cov === '—' ? 'ndw-cov--n' : 'ndw-cov--s'}`}>{cov}</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
