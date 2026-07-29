'use client'

import { useState } from 'react'

const WELL_LIST = [
  { id: 'w1', name: '苏36-11井' },
  { id: 'w2', name: '苏36-12井' },
  { id: 'w3', name: '苏36-13井' },
  { id: 'w4', name: '苏36-14井' },
  { id: 'w5', name: '苏37-01井' },
  { id: 'w6', name: '苏37-02井' },
  { id: 'w7', name: '苏14-25井' },
]

interface Field {
  id: string
  name: string
  unit?: string
  isKey?: boolean
}

interface FieldCategory {
  id: string
  name: string
  icon: string
  fields: Field[]
}

const FIELD_CATEGORIES: FieldCategory[] = [
  {
    id: 'basic',
    name: '基本信息',
    icon: 'info',
    fields: [
      { id: 'well_no', name: '井号', isKey: true },
      { id: 'well_type', name: '井型' },
      { id: 'block', name: '区块' },
      { id: 'completion_date', name: '完钻日期' },
    ],
  },
  {
    id: 'geology',
    name: '地质参数',
    icon: 'terrain',
    fields: [
      { id: 'porosity', name: '孔隙度', unit: '%', isKey: true },
      { id: 'permeability', name: '渗透率', unit: 'mD', isKey: true },
      { id: 'reservoir_thick', name: '油层厚度', unit: 'm', isKey: true },
      { id: 'gas_oil_ratio', name: '气油比', unit: 'm³/t', isKey: true },
      { id: 'sweet_spot', name: 'I类甜点段长', unit: 'm' },
      { id: 'saturation', name: '含气饱和度', unit: '%' },
    ],
  },
  {
    id: 'engineering',
    name: '工程参数',
    icon: 'construction',
    fields: [
      { id: 'sand_volume', name: '加砂量', unit: 'm³', isKey: true },
      { id: 'fluid_volume', name: '单井入地液量', unit: 'm³', isKey: true },
      { id: 'frac_stages', name: '压裂段数', unit: '段' },
      { id: 'cluster_spacing', name: '簇间距', unit: 'm' },
      { id: 'sand_ratio', name: '砂比', unit: '%' },
    ],
  },
  {
    id: 'production',
    name: '生产参数',
    icon: 'oil_barrel',
    fields: [
      { id: 'daily_gas', name: '日产气量', unit: '万m³', isKey: true },
      { id: 'annual_prod', name: '达产年产量', unit: '万m³', isKey: true },
      { id: 'cum_gas', name: '累计产气量', unit: '万m³' },
      { id: 'wellhead_pressure', name: '井口压力', unit: 'MPa' },
      { id: 'water_cut', name: '含水率', unit: '%' },
    ],
  },
]

const KEY_FIELD_IDS = FIELD_CATEGORIES.flatMap((cat) =>
  cat.fields.filter((f) => f.isKey).map((f) => f.id),
)

interface FieldTreeProps {
  onFocusField?: (fieldId: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function FieldTree({ onFocusField, collapsed, onToggleCollapse }: FieldTreeProps) {
  const allFieldIds = FIELD_CATEGORIES.flatMap((c) => c.fields.map((f) => f.id))
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(KEY_FIELD_IDS))
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(FIELD_CATEGORIES.map((c) => c.id)),
  )
  const [search, setSearch] = useState('')
  const [focusedId, setFocusedId] = useState<string>('gas_oil_ratio')

  // 井列表
  const [wellCollapsed, setWellCollapsed] = useState(false)
  const [selectedWells, setSelectedWells] = useState<Set<string>>(
    new Set(WELL_LIST.map((w) => w.id)),
  )

  const toggleWell = (id: string) => {
    setSelectedWells((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAllWells = () => setSelectedWells(new Set(WELL_LIST.map((w) => w.id)))
  const clearAllWells = () => setSelectedWells(new Set())

  const totalFields = allFieldIds.length
  const selectedCount = checkedIds.size

  const toggleCat = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  const toggleField = (fieldId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      next.has(fieldId) ? next.delete(fieldId) : next.add(fieldId)
      return next
    })
  }

  const toggleCatAll = (cat: FieldCategory) => {
    const catIds = cat.fields.map((f) => f.id)
    const allChecked = catIds.every((id) => checkedIds.has(id))
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        catIds.forEach((id) => next.delete(id))
      } else {
        catIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const selectAll = () => setCheckedIds(new Set(allFieldIds))
  const clearAll = () => setCheckedIds(new Set())

  const handleFocus = (fieldId: string) => {
    setFocusedId(fieldId)
    onFocusField?.(fieldId)
  }

  const filteredCategories = FIELD_CATEGORIES.map((cat) => ({
    ...cat,
    fields: cat.fields.filter(
      (f) => !search || f.name.includes(search) || f.id.includes(search),
    ),
  })).filter((cat) => !search || cat.fields.length > 0)

  if (collapsed) {
    return (
      <aside
        className="panel-section panel-section--collapsed"
        aria-label="字段范围（已折叠）"
      >
        <div className="panel-collapsed-rail">
          <md-icon-button
            aria-label="展开字段范围"
            title="展开字段范围"
            onClick={onToggleCollapse}
          >
            <md-icon>chevron_right</md-icon>
          </md-icon-button>
          <div className="panel-collapsed-label" aria-hidden="true">
            <md-icon>list_alt</md-icon>
            <span className="panel-collapsed-text">字段范围</span>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="panel-section field-tree-panel" aria-label="数据集字段树">
      <div className="panel-header">
        <span className="md-typescale-label-large panel-title">字段范围</span>
        <div className="panel-header-actions">
          <md-icon-button
            aria-label="收起字段范围"
            title="收起字段范围"
            onClick={onToggleCollapse}
          >
            <md-icon>chevron_left</md-icon>
          </md-icon-button>
        </div>
      </div>

      {/* 井列表 */}
      <div className="ft-well-section">
        <div
          className="ft-well-header"
          role="button"
          aria-expanded={!wellCollapsed}
          onClick={() => setWellCollapsed(v => !v)}
        >
          <md-icon class="ft-well-header-icon">
            {wellCollapsed ? 'chevron_right' : 'expand_more'}
          </md-icon>
          <md-icon class="ft-well-section-icon">water_drop</md-icon>
          <span className="ft-well-header-title">井列表</span>
          <span className="ft-well-count">{selectedWells.size}/{WELL_LIST.length}</span>
        </div>
        {!wellCollapsed && (
          <div className="ft-well-body">
            <div className="ft-well-actions">
              <button className="field-tree-action-btn" onClick={selectAllWells}>全选</button>
              <button className="field-tree-action-btn" onClick={clearAllWells}>清空</button>
            </div>
            <ul className="ft-well-list">
              {WELL_LIST.map((w) => {
                const checked = selectedWells.has(w.id)
                return (
                  <li key={w.id} className={`ft-well-item${checked ? ' ft-well-item--checked' : ''}`}>
                    <label className="ft-well-item-label">
                      <input
                        type="checkbox"
                        className="field-tree-checkbox"
                        checked={checked}
                        onChange={() => toggleWell(w.id)}
                        aria-label={`选择 ${w.name}`}
                      />
                      <md-icon class="ft-well-icon">oil_barrel</md-icon>
                      <span className="ft-well-name">{w.name}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="ft-divider" />

      {/* 选中计数 */}
      <div className="field-tree-stat">
        <span className="md-typescale-label-small field-tree-stat-text">
          已选 <strong>{selectedCount}</strong> / {totalFields} 个字段
        </span>
        <div className="field-tree-stat-actions">
          <button className="field-tree-action-btn md-typescale-label-small" onClick={selectAll}>
            全选
          </button>
          <button className="field-tree-action-btn md-typescale-label-small" onClick={clearAll}>
            清空
          </button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="dataset-list-search">
        <div className="search-input-wrap">
          <md-icon class="search-icon">search</md-icon>
          <input
            type="search"
            className="search-input md-typescale-body-small"
            placeholder="搜索字段..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="搜索字段"
          />
        </div>
      </div>

      {/* 字段树 */}
      <div className="field-tree-body" role="tree">
        {filteredCategories.map((cat) => {
          const catIds = cat.fields.map((f) => f.id)
          const checkedCount = catIds.filter((id) => checkedIds.has(id)).length
          const allChecked = checkedCount === catIds.length && catIds.length > 0
          const someChecked = checkedCount > 0 && !allChecked
          const isExpanded = expandedCats.has(cat.id)

          return (
            <div
              key={cat.id}
              className="field-tree-category"
              role="treeitem"
              aria-expanded={isExpanded}
            >
              <div className="field-tree-cat-row">
                <button
                  className="field-tree-expand-btn"
                  aria-label={isExpanded ? `收起 ${cat.name}` : `展开 ${cat.name}`}
                  onClick={() => toggleCat(cat.id)}
                >
                  <md-icon class="field-tree-expand-icon">
                    {isExpanded ? 'expand_more' : 'chevron_right'}
                  </md-icon>
                </button>
                <label className="field-tree-cat-label">
                  <input
                    type="checkbox"
                    className="field-tree-checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked
                    }}
                    onChange={() => toggleCatAll(cat)}
                    aria-label={`选择 ${cat.name} 下所有字段`}
                  />
                  <md-icon class="field-cat-icon">{cat.icon}</md-icon>
                  <span className="md-typescale-label-medium field-cat-name">{cat.name}</span>
                  <span className="md-typescale-label-small field-cat-count">
                    {checkedCount}/{cat.fields.length}
                  </span>
                </label>
              </div>

              {isExpanded && (
                <ul className="field-tree-fields" role="group">
                  {cat.fields.map((field) => {
                    const isChecked = checkedIds.has(field.id)
                    const isFocused = focusedId === field.id
                    return (
                      <li
                        key={field.id}
                        className={`field-tree-field-row${isFocused ? ' field-tree-field-row--focused' : ''}`}
                        role="treeitem"
                      >
                        <label className="field-tree-field-label">
                          <input
                            type="checkbox"
                            className="field-tree-checkbox"
                            checked={isChecked}
                            onChange={() => toggleField(field.id)}
                            aria-label={`选择字段 ${field.name}`}
                          />
                          <span
                            className="md-typescale-body-small field-name"
                            onClick={() => handleFocus(field.id)}
                          >
                            {field.name}
                            {field.isKey && (
                              <span className="field-key-badge" aria-label="重点字段">
                                重点
                              </span>
                            )}
                          </span>
                          {field.unit && (
                            <span className="md-typescale-label-small field-unit">
                              {field.unit}
                            </span>
                          )}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
