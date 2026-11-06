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

// 数据集所选字段（不含“基本信息”）：创建数据集时选定，系统默认全部参与质检
const FIELD_CATEGORIES: FieldCategory[] = [
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

const TOTAL_FIELDS = FIELD_CATEGORIES.reduce((n, c) => n + c.fields.length, 0)

interface FieldTreeProps {
  onFocusField?: (fieldId: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function FieldTree({ onFocusField, collapsed, onToggleCollapse }: FieldTreeProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(FIELD_CATEGORIES.map((c) => c.id)),
  )
  const [search, setSearch] = useState('')
  const [focusedId, setFocusedId] = useState<string>('gas_oil_ratio')
  const [wellCollapsed, setWellCollapsed] = useState(false)

  const toggleCat = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

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
        aria-label="数据范围（已折叠）"
      >
        <div className="panel-collapsed-rail">
          <md-icon-button
            aria-label="展开数据范围"
            title="展开数据范围"
            onClick={onToggleCollapse}
          >
            <md-icon>chevron_right</md-icon>
          </md-icon-button>
          <div className="panel-collapsed-label" aria-hidden="true">
            <md-icon>list_alt</md-icon>
            <span className="panel-collapsed-text">数据范围</span>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="panel-section field-tree-panel" aria-label="数据集数据范围">
      <div className="panel-header">
        <span className="md-typescale-label-large panel-title">数据范围</span>
        <div className="panel-header-actions">
          <md-icon-button
            aria-label="收起数据范围"
            title="收起数据范围"
            onClick={onToggleCollapse}
          >
            <md-icon>chevron_left</md-icon>
          </md-icon-button>
        </div>
      </div>

      {/* 井列表（只读） */}
      <div className="ft-well-section">
        <div
          className="ft-well-header"
          role="button"
          tabIndex={0}
          aria-expanded={!wellCollapsed}
          onClick={() => setWellCollapsed((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setWellCollapsed((v) => !v)
            }
          }}
        >
          <md-icon class="ft-well-header-icon">
            {wellCollapsed ? 'chevron_right' : 'expand_more'}
          </md-icon>
          <md-icon class="ft-well-section-icon">water_drop</md-icon>
          <span className="ft-well-header-title">井列表</span>
          <span className="ft-well-count">{WELL_LIST.length} 口</span>
        </div>
        {!wellCollapsed && (
          <div className="ft-well-body">
            <ul className="ft-well-list">
              {WELL_LIST.map((w) => (
                <li key={w.id} className="ft-well-item ft-well-item--readonly">
                  <div className="ft-well-item-label">
                    <md-icon class="ft-well-icon">oil_barrel</md-icon>
                    <span className="ft-well-name">{w.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="ft-divider" />

      {/* 字段计数 */}
      <div className="field-tree-stat">
        <span className="md-typescale-label-small field-tree-stat-text">
          质检字段 <strong>{TOTAL_FIELDS}</strong> 个
        </span>
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

      {/* 字段树（只读，点击字段可定位） */}
      <div className="field-tree-body" role="tree">
        {filteredCategories.map((cat) => {
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
                  className="field-tree-cat-toggle"
                  aria-label={isExpanded ? `收起 ${cat.name}` : `展开 ${cat.name}`}
                  onClick={() => toggleCat(cat.id)}
                >
                  <md-icon class="field-tree-expand-icon">
                    {isExpanded ? 'expand_more' : 'chevron_right'}
                  </md-icon>
                  <md-icon class="field-cat-icon">{cat.icon}</md-icon>
                  <span className="md-typescale-label-medium field-cat-name">{cat.name}</span>
                  <span className="md-typescale-label-small field-cat-count">
                    {cat.fields.length}
                  </span>
                </button>
              </div>

              {isExpanded && (
                <ul className="field-tree-fields" role="group">
                  {cat.fields.map((field) => {
                    const isFocused = focusedId === field.id
                    return (
                      <li
                        key={field.id}
                        className={`field-tree-field-row${isFocused ? ' field-tree-field-row--focused' : ''}`}
                        role="treeitem"
                        aria-selected={isFocused}
                      >
                        <button
                          className="field-tree-field-btn"
                          onClick={() => handleFocus(field.id)}
                        >
                          <span className="md-typescale-body-small field-name">
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
                        </button>
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
