'use client'

import { useState, useCallback } from 'react'

// ─── 候选数据树结构 ───────────────────────────────────────────────

type FieldCategory = '基本信息' | '地质参数' | '工程参数' | '生产参数'

interface FieldDef {
  id: string
  name: string
  category: FieldCategory
}

interface WellDef {
  id: string
  name: string
  fields: FieldDef[]
}

interface BlockDef {
  id: string
  name: string
  wells: WellDef[]
}

const CANDIDATE_TREE: { id: string; name: string; blocks: BlockDef[] }[] = [
  {
    id: 'cq',
    name: '长庆油田',
    blocks: [
      {
        id: 'slg',
        name: '苏里格区块',
        wells: [
          {
            id: 'w1',
            name: '苏36-11井',
            fields: [
              { id: 'w1-f1', name: '井号', category: '基本信息' },
              { id: 'w1-f2', name: '井型', category: '基本信息' },
              { id: 'w1-f3', name: '孔隙度', category: '地质参数' },
              { id: 'w1-f4', name: '渗透率', category: '地质参数' },
              { id: 'w1-f5', name: '加砂量', category: '工程参数' },
              { id: 'w1-f6', name: '单井入地液量', category: '工程参数' },
              { id: 'w1-f7', name: '日产气量', category: '生产参数' },
              { id: 'w1-f8', name: '气油比', category: '生产参数' },
            ],
          },
          {
            id: 'w2',
            name: '苏36-12井',
            fields: [
              { id: 'w2-f1', name: '井号', category: '基本信息' },
              { id: 'w2-f2', name: '井型', category: '基本信息' },
              { id: 'w2-f3', name: '孔隙度', category: '地质参数' },
              { id: 'w2-f4', name: '渗透率', category: '地质参数' },
              { id: 'w2-f5', name: '加砂量', category: '工程参数' },
              { id: 'w2-f6', name: '油层厚度', category: '地质参数' },
              { id: 'w2-f7', name: '日产气量', category: '生产参数' },
              { id: 'w2-f8', name: '累产气量', category: '生产参数' },
            ],
          },
          {
            id: 'w3',
            name: '苏14-25井',
            fields: [
              { id: 'w3-f1', name: '井号', category: '基本信息' },
              { id: 'w3-f2', name: '孔隙度', category: '地质参数' },
              { id: 'w3-f3', name: '渗透率', category: '地质参数' },
              { id: 'w3-f4', name: '加砂量', category: '工程参数' },
              { id: 'w3-f5', name: '单井入地液量', category: '工程参数' },
              { id: 'w3-f6', name: '日产气量', category: '生产参数' },
            ],
          },
        ],
      },
      {
        id: 'ld',
        name: '陇东区块',
        wells: [
          {
            id: 'w4',
            name: '合水1-5井',
            fields: [
              { id: 'w4-f1', name: '井号', category: '基本信息' },
              { id: 'w4-f2', name: '孔隙度', category: '地质参数' },
              { id: 'w4-f3', name: '渗透率', category: '地质参数' },
              { id: 'w4-f4', name: '日产油量', category: '生产参数' },
              { id: 'w4-f5', name: '含水率', category: '生产参数' },
            ],
          },
        ],
      },
    ],
  },
]

// ─── 质检模板：决定可配置的质检字段范围 ─────────────────────────────
// 模板中配置的字段（按字段名）即“可质检字段”，选取模板后仅这些字段可勾选，
// 其余字段在候选树中禁用；选定模板时系统默认勾选这些字段。

interface QCTemplate {
  id: string
  name: string
  code: string
  fields: string[] // 模板配置的质检字段名
}

const QC_TEMPLATES: QCTemplate[] = [
  { id: 't1', name: '区块A水平井压裂质检模板', code: 'TPL_BLOCK_A_HZ', fields: ['井号', '井型', '孔隙度', '渗透率', '加砂量', '单井入地液量', '日产气量'] },
  { id: 't2', name: '区块B直井压后质检模板', code: 'TPL_BLOCK_B_VT', fields: ['井号', '孔隙度', '渗透率', '加砂量', '日产气量', '累产气量'] },
  { id: 't3', name: '通用地质参数质检模板', code: 'TPL_GEO_BASE', fields: ['井号', '孔隙度', '渗透率', '油层厚度'] },
]

// 所有叶子字段的 key = `${wellId}::${fieldId}`
type SelectedKey = string // `wellId::fieldId`

// 收集树中字段名在 allowed 集合内的全部叶子 key
function collectAllowedKeys(allowed: Set<string>): Set<SelectedKey> {
  const keys = new Set<SelectedKey>()
  for (const oilfield of CANDIDATE_TREE) {
    for (const block of oilfield.blocks) {
      for (const well of block.wells) {
        for (const field of well.fields) {
          if (allowed.has(field.name)) keys.add(`${well.id}::${field.id}`)
        }
      }
    }
  }
  return keys
}

interface SelectedItem {
  wellId: string
  wellName: string
  fieldId: string
  fieldName: string
  category: FieldCategory
}

function getAllFieldKeys(tree: typeof CANDIDATE_TREE): SelectedKey[] {
  const keys: SelectedKey[] = []
  for (const oilfield of tree) {
    for (const block of oilfield.blocks) {
      for (const well of block.wells) {
        for (const field of well.fields) {
          keys.push(`${well.id}::${field.id}`)
        }
      }
    }
  }
  return keys
}

function makeSelectedItems(keys: Set<SelectedKey>, tree: typeof CANDIDATE_TREE): SelectedItem[] {
  const items: SelectedItem[] = []
  for (const oilfield of tree) {
    for (const block of oilfield.blocks) {
      for (const well of block.wells) {
        for (const field of well.fields) {
          const key = `${well.id}::${field.id}`
          if (keys.has(key)) {
            items.push({
              wellId: well.id,
              wellName: well.name,
              fieldId: field.id,
              fieldName: field.name,
              category: field.category,
            })
          }
        }
      }
    }
  }
  return items
}

// ─── 树节点勾选状态 ──────────────────────────────────────────────

type CheckState = 'unchecked' | 'indeterminate' | 'checked'

// 仅统计模板允许的字段
function getWellCheckState(wellId: string, well: WellDef, selected: Set<SelectedKey>, allowed: Set<string>): CheckState {
  const allowedFields = well.fields.filter((f) => allowed.has(f.name))
  const total = allowedFields.length
  if (total === 0) return 'unchecked'
  const checked = allowedFields.filter((f) => selected.has(`${wellId}::${f.id}`)).length
  if (checked === 0) return 'unchecked'
  if (checked === total) return 'checked'
  return 'indeterminate'
}

function getBlockCheckState(block: BlockDef, selected: Set<SelectedKey>, allowed: Set<string>): CheckState {
  const states = block.wells.map((w) => getWellCheckState(w.id, w, selected, allowed))
  if (states.every((s) => s === 'checked')) return 'checked'
  if (states.every((s) => s === 'unchecked')) return 'unchecked'
  return 'indeterminate'
}

// ─── 组件 ────────────────────────────────────────────────────────

interface NewDatasetDialogProps {
  open: boolean
  onClose: () => void
  onConfirm?: (name: string, selected: SelectedItem[]) => void
}

const CATEGORIES: FieldCategory[] = ['基本信息', '地质参数', '工程参数', '生产参数']

export function NewDatasetDialog({ open, onClose, onConfirm }: NewDatasetDialogProps) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [candSearch, setCandSearch] = useState('')
  const [selSearch, setSelSearch] = useState('')
  const [selected, setSelected] = useState<Set<SelectedKey>>(new Set())

  // 当前所选质检模板及其允许的质检字段名集合
  const selectedTemplate = QC_TEMPLATES.find((t) => t.id === templateId) ?? null
  const templateChosen = !!selectedTemplate
  const allowedNames = new Set(selectedTemplate?.fields ?? [])

  // 候选树展开状态
  const [expandedOilfields, setExpandedOilfields] = useState<Set<string>>(new Set(['cq']))
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set(['slg']))
  const [expandedWells, setExpandedWells] = useState<Set<string>>(new Set())

  // 候选树中已勾选（待添加）的 keys
  const [candChecked, setCandChecked] = useState<Set<SelectedKey>>(new Set())
  // 已选区中已勾选（待移除）的 keys
  const [selChecked, setSelChecked] = useState<Set<SelectedKey>>(new Set())

  const selectedItems = makeSelectedItems(selected, CANDIDATE_TREE)

  // 统计
  const wellCount = new Set(selectedItems.map((i) => i.wellId)).size
  const fieldCount = new Set(selectedItems.map((i) => i.fieldName)).size
  const totalCount = selectedItems.length

  // 候选树过滤
  const filterText = candSearch.toLowerCase()

  // 添加勾选项
  const addChecked = useCallback(() => {
    if (candChecked.size === 0) return
    setSelected((prev) => {
      const next = new Set(prev)
      for (const k of candChecked) next.add(k)
      return next
    })
    setCandChecked(new Set())
  }, [candChecked])

  // 添加全部筛选可用项
  const addAll = useCallback(() => {
    const toAdd = new Set<SelectedKey>()
    for (const oilfield of CANDIDATE_TREE) {
      for (const block of oilfield.blocks) {
        for (const well of block.wells) {
          const wellMatch = !filterText || well.name.toLowerCase().includes(filterText)
          for (const field of well.fields) {
            if (!allowedNames.has(field.name)) continue // 仅模板允许字段
            const fieldMatch = !filterText || field.name.toLowerCase().includes(filterText)
            if (wellMatch || fieldMatch) {
              toAdd.add(`${well.id}::${field.id}`)
            }
          }
        }
      }
    }
    setSelected((prev) => {
      const next = new Set(prev)
      for (const k of toAdd) next.add(k)
      return next
    })
  }, [filterText, templateId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 移除勾选项
  const removeChecked = useCallback(() => {
    if (selChecked.size === 0) return
    setSelected((prev) => {
      const next = new Set(prev)
      for (const k of selChecked) next.delete(k)
      return next
    })
    setSelChecked(new Set())
  }, [selChecked])

  // 清空全部
  const clearAll = useCallback(() => {
    setSelected(new Set())
    setSelChecked(new Set())
  }, [])

  // 切换质检模板：默认勾选模板中配置的质检字段，并清理不在模板内的已选项
  const changeTemplate = (id: string) => {
    setTemplateId(id)
    const tpl = QC_TEMPLATES.find((t) => t.id === id)
    const allowed = new Set(tpl?.fields ?? [])
    const allowedKeys = collectAllowedKeys(allowed)
    // 默认勾选模板字段（待添加）
    setCandChecked(new Set(allowedKeys))
    // 已选项仅保留模板允许的字段
    setSelected((prev) => {
      const next = new Set<SelectedKey>()
      for (const k of prev) if (allowedKeys.has(k)) next.add(k)
      return next
    })
    setSelChecked(new Set())
  }

  // 候选树字段勾选（仅模板允许字段可勾选）
  const toggleCandField = (wellId: string, fieldId: string, allowed: boolean) => {
    if (!allowed) return
    const key = `${wellId}::${fieldId}`
    setCandChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // 候选树井级全选/取消（仅作用于模板允许字段）
  const toggleCandWell = (well: WellDef) => {
    const keys = well.fields.filter((f) => allowedNames.has(f.name)).map((f) => `${well.id}::${f.id}`)
    if (keys.length === 0) return
    const allChecked = keys.every((k) => candChecked.has(k))
    setCandChecked((prev) => {
      const next = new Set(prev)
      if (allChecked) keys.forEach((k) => next.delete(k))
      else keys.forEach((k) => next.add(k))
      return next
    })
  }

  const validateAndConfirm = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setNameError('数据集名称至少 2 个字符')
      return
    }
    if (trimmed.length > 50) {
      setNameError('数据集名称不超过 50 个字符')
      return
    }
    if (!templateChosen) return
    if (selected.size === 0) return
    onConfirm?.(trimmed, selectedItems)
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setNameError('')
    setTemplateId('')
    setCandSearch('')
    setSelSearch('')
    setSelected(new Set())
    setCandChecked(new Set())
    setSelChecked(new Set())
    onClose()
  }

  if (!open) return null

  // 按井分组已选
  const selectedByWell: Record<string, { wellName: string; items: SelectedItem[] }> = {}
  const selFilter = selSearch.toLowerCase()
  for (const item of selectedItems) {
    if (selFilter && !item.wellName.toLowerCase().includes(selFilter) && !item.fieldName.toLowerCase().includes(selFilter)) continue
    if (!selectedByWell[item.wellId]) {
      selectedByWell[item.wellId] = { wellName: item.wellName, items: [] }
    }
    selectedByWell[item.wellId].items.push(item)
  }

  return (
    <div className="nd-overlay" role="dialog" aria-modal="true" aria-label="新建数据集">
      <div className="nd-panel">
        {/* 标题栏 */}
        <div className="nd-header">
          <span className="md-typescale-title-large nd-title">新建数据集</span>
          <md-icon-button aria-label="关闭弹窗" onClick={handleClose}>
            <md-icon>close</md-icon>
          </md-icon-button>
        </div>

        <div className="nd-body">
          {/* 基本信息 */}
          <div className="nd-section">
            <div className="md-typescale-label-large nd-section-title">基本信息</div>
            <div className="nd-name-row">
              <label htmlFor="nd-name" className="md-typescale-label-medium nd-label">
                数据集名称<span className="nd-required">*</span>
              </label>
              <div className="nd-name-input-wrap">
                <input
                  id="nd-name"
                  type="text"
                  className={`nd-name-input md-typescale-body-medium${nameError ? ' nd-name-input--error' : ''}`}
                  placeholder="请输入数据集名称（2—50 个字符）"
                  value={name}
                  maxLength={50}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (nameError) setNameError('')
                  }}
                  aria-describedby={nameError ? 'nd-name-error' : undefined}
                />
                {nameError && (
                  <span id="nd-name-error" className="md-typescale-label-small nd-error-msg">
                    {nameError}
                  </span>
                )}
              </div>
            </div>

            {/* 质检模板：数据选取前置条件 */}
            <div className="nd-name-row">
              <label htmlFor="nd-template" className="md-typescale-label-medium nd-label">
                质检模板<span className="nd-required">*</span>
              </label>
              <div className="nd-name-input-wrap">
                <select
                  id="nd-template"
                  className="nd-tpl-select md-typescale-body-medium"
                  value={templateId}
                  onChange={(e) => changeTemplate(e.target.value)}
                  aria-describedby="nd-template-hint"
                >
                  <option value="">请先选择质检模板…</option>
                  {QC_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}（{t.code}）</option>
                  ))}
                </select>
                <span id="nd-template-hint" className="md-typescale-label-small nd-tpl-hint">
                  {templateChosen
                    ? `已加载模板质检字段 ${allowedNames.size} 项，仅可配置模板内字段`
                    : '选择模板后系统将默认勾选模板配置的质检字段，且仅可配置这些字段'}
                </span>
                {templateChosen && (
                  <div className="nd-tpl-chips">
                    {selectedTemplate!.fields.map((f) => (
                      <span key={f} className="nd-tpl-chip">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 数据选取 */}
          <div className="nd-section nd-section--shuttle">
            <div className="md-typescale-label-large nd-section-title">数据选取</div>
            <div className={`nd-shuttle${!templateChosen ? ' nd-shuttle--locked' : ''}`}>
              {!templateChosen && (
                <div className="nd-shuttle-gate" role="status">
                  <md-icon class="nd-shuttle-gate-icon">rule_folder</md-icon>
                  <span className="md-typescale-body-medium nd-shuttle-gate-title">请先选择质检模板</span>
                  <span className="md-typescale-body-small nd-shuttle-gate-desc">选定模板后将自动加载可质检字段，方可进行数据选取</span>
                </div>
              )}
              {/* 左：候选数据树 */}
              <div className="nd-shuttle-pane nd-candidate-pane">
                <div className="nd-pane-header">
                  <span className="md-typescale-label-medium nd-pane-title">候选数据</span>
                  <div className="nd-pane-search-wrap">
                    <md-icon class="nd-search-icon">search</md-icon>
                    <input
                      type="search"
                      className="nd-pane-search md-typescale-body-small"
                      placeholder="搜索油田/区块/井/字段..."
                      value={candSearch}
                      onChange={(e) => setCandSearch(e.target.value)}
                      aria-label="搜索候选数据"
                    />
                  </div>
                </div>
                <div className="nd-tree" role="tree" aria-label="候选数据树">
                  {CANDIDATE_TREE.map((oilfield) => {
                    const oilMatch = !filterText || oilfield.name.toLowerCase().includes(filterText)
                    const visibleBlocks = oilfield.blocks.filter((b) => {
                      if (oilMatch) return true
                      return b.wells.some((w) => {
                        const wm = w.name.toLowerCase().includes(filterText)
                        return wm || w.fields.some((f) => f.name.toLowerCase().includes(filterText))
                      })
                    })
                    if (!oilMatch && visibleBlocks.length === 0) return null
                    const expanded = expandedOilfields.has(oilfield.id)
                    return (
                      <div key={oilfield.id} className="nd-tree-node" role="treeitem" aria-expanded={expanded}>
                        <button
                          className="nd-tree-row nd-tree-row--oilfield"
                          onClick={() =>
                            setExpandedOilfields((prev) => {
                              const next = new Set(prev)
                              if (next.has(oilfield.id)) next.delete(oilfield.id)
                              else next.add(oilfield.id)
                              return next
                            })
                          }
                        >
                          <md-icon class="nd-tree-expand-icon">
                            {expanded ? 'expand_more' : 'chevron_right'}
                          </md-icon>
                          <md-icon class="nd-tree-icon">domain</md-icon>
                          <span className="md-typescale-label-medium">{oilfield.name}</span>
                        </button>

                        {expanded && visibleBlocks.map((block) => {
                          const blockMatch = !filterText || block.name.toLowerCase().includes(filterText)
                          const blockExpanded = expandedBlocks.has(block.id)
                          const blockState = getBlockCheckState(block, selected, allowedNames)
                          const visibleWells = block.wells.filter((w) => {
                            if (blockMatch || oilMatch) return true
                            return w.name.toLowerCase().includes(filterText) || w.fields.some((f) => f.name.toLowerCase().includes(filterText))
                          })
                          return (
                            <div key={block.id} className="nd-tree-node nd-tree-node--l2">
                              <button
                                className="nd-tree-row nd-tree-row--block"
                                onClick={() =>
                                  setExpandedBlocks((prev) => {
                                    const next = new Set(prev)
                                    if (next.has(block.id)) next.delete(block.id)
                                    else next.add(block.id)
                                    return next
                                  })
                                }
                              >
                                <md-icon class="nd-tree-expand-icon">
                                  {blockExpanded ? 'expand_more' : 'chevron_right'}
                                </md-icon>
                                <md-icon class="nd-tree-icon">location_on</md-icon>
                                <span className="md-typescale-label-medium">{block.name}</span>
                                {blockState !== 'unchecked' && (
                                  <span className="nd-tree-sel-badge">
                                    {blockState === 'checked' ? '全选' : '部分'}
                                  </span>
                                )}
                              </button>

                              {blockExpanded && visibleWells.map((well) => {
                                const wellState = getWellCheckState(well.id, well, selected, allowedNames)
                                const wellAllowedCount = well.fields.filter((f) => allowedNames.has(f.name)).length
                                const wellExpanded = expandedWells.has(well.id)
                                const wellMatch = !filterText || well.name.toLowerCase().includes(filterText)
                                const visibleFields = well.fields.filter((f) => {
                                  if (wellMatch || blockMatch || oilMatch) return true
                                  return f.name.toLowerCase().includes(filterText)
                                })
                                return (
                                  <div key={well.id} className="nd-tree-node nd-tree-node--l3">
                                    <button
                                      className="nd-tree-row nd-tree-row--well"
                                      onClick={() =>
                                        setExpandedWells((prev) => {
                                          const next = new Set(prev)
                                          if (next.has(well.id)) next.delete(well.id)
                                          else next.add(well.id)
                                          return next
                                        })
                                      }
                                    >
                                      <md-icon class="nd-tree-expand-icon">
                                        {wellExpanded ? 'expand_more' : 'chevron_right'}
                                      </md-icon>
                                      {/* 井级全选复选框（仅模板允许字段）*/}
                                      <input
                                        type="checkbox"
                                        className="nd-cbox"
                                        checked={wellState === 'checked'}
                                        disabled={wellAllowedCount === 0}
                                        ref={(el) => {
                                          if (el) el.indeterminate = wellState === 'indeterminate'
                                        }}
                                        onChange={() => toggleCandWell(well)}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`选择井 ${well.name} 模板质检字段`}
                                      />
                                      <md-icon class="nd-tree-icon">oil_barrel</md-icon>
                                      <span className="md-typescale-body-small nd-well-name">{well.name}</span>
                                      <span className="md-typescale-label-small nd-tree-count">
                                        {well.fields.filter((f) => allowedNames.has(f.name) && selected.has(`${well.id}::${f.id}`)).length}/{wellAllowedCount}
                                      </span>
                                    </button>

                                    {wellExpanded && (
                                      <div className="nd-tree-fields">
                                        {CATEGORIES.map((cat) => {
                                          const catFields = visibleFields.filter((f) => f.category === cat)
                                          if (catFields.length === 0) return null
                                          return (
                                            <div key={cat} className="nd-tree-cat-group">
                                              <div className="nd-tree-cat-label md-typescale-label-small">{cat}</div>
                                              {catFields.map((field) => {
                                                const key = `${well.id}::${field.id}`
                                                const isCandChecked = candChecked.has(key)
                                                const isAlreadySelected = selected.has(key)
                                                const isAllowed = allowedNames.has(field.name)
                                                const isLocked = !isAllowed
                                                return (
                                                  <label
                                                    key={field.id}
                                                    className={`nd-field-row${isAlreadySelected ? ' nd-field-row--done' : ''}${isLocked ? ' nd-field-row--locked' : ''}`}
                                                    title={isLocked ? '该字段不在所选质检模板内，不可配置' : undefined}
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      className="nd-cbox"
                                                      checked={isCandChecked && isAllowed}
                                                      disabled={isAlreadySelected || isLocked}
                                                      onChange={() => toggleCandField(well.id, field.id, isAllowed)}
                                                      aria-label={field.name}
                                                    />
                                                    <span className="md-typescale-body-small nd-field-name">{field.name}</span>
                                                    {isAlreadySelected && (
                                                      <md-icon class="nd-field-done-icon">check_circle</md-icon>
                                                    )}
                                                    {isLocked && (
                                                      <md-icon class="nd-field-lock-icon">lock</md-icon>
                                                    )}
                                                  </label>
                                                )
                                              })}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 中：穿梭按钮 */}
              <div className="nd-shuttle-btns" aria-label="穿梭操作">
                <button
                  className="nd-xfer-btn"
                  title="添加勾选项"
                  aria-label="添加勾选的候选项"
                  onClick={addChecked}
                  disabled={candChecked.size === 0}
                >
                  <md-icon>chevron_right</md-icon>
                </button>
                <button
                  className="nd-xfer-btn"
                  title="添加全部筛选项"
                  aria-label="添加全部候选项"
                  onClick={addAll}
                >
                  <md-icon>keyboard_double_arrow_right</md-icon>
                </button>
                <div className="nd-xfer-divider" />
                <button
                  className="nd-xfer-btn"
                  title="移除勾选项"
                  aria-label="移除已选中的项"
                  onClick={removeChecked}
                  disabled={selChecked.size === 0}
                >
                  <md-icon>chevron_left</md-icon>
                </button>
                <button
                  className="nd-xfer-btn"
                  title="清空已选"
                  aria-label="清空全部已选项"
                  onClick={clearAll}
                  disabled={selected.size === 0}
                >
                  <md-icon>keyboard_double_arrow_left</md-icon>
                </button>
              </div>

              {/* 右：已选区 */}
              <div className="nd-shuttle-pane nd-selected-pane">
                <div className="nd-pane-header">
                  <span className="md-typescale-label-medium nd-pane-title">
                    已选（{wellCount} 口井 · {totalCount} 项）
                  </span>
                  <div className="nd-pane-search-wrap">
                    <md-icon class="nd-search-icon">search</md-icon>
                    <input
                      type="search"
                      className="nd-pane-search md-typescale-body-small"
                      placeholder="搜索已选..."
                      value={selSearch}
                      onChange={(e) => setSelSearch(e.target.value)}
                      aria-label="搜索已选数据"
                    />
                  </div>
                </div>
                <div className="nd-selected-body">
                  {Object.keys(selectedByWell).length === 0 ? (
                    <div className="nd-selected-empty">
                      <md-icon class="nd-empty-icon">inbox</md-icon>
                      <span className="md-typescale-body-small">请从左侧选择井与字段</span>
                    </div>
                  ) : (
                    Object.entries(selectedByWell).map(([wellId, { wellName, items }]) => {
                      const byCategory: Partial<Record<FieldCategory, SelectedItem[]>> = {}
                      for (const item of items) {
                        if (!byCategory[item.category]) byCategory[item.category] = []
                        byCategory[item.category]!.push(item)
                      }
                      return (
                        <div key={wellId} className="nd-sel-well-group">
                          <div className="nd-sel-well-header">
                            <md-icon class="nd-sel-well-icon">oil_barrel</md-icon>
                            <span className="md-typescale-label-medium nd-sel-well-name">{wellName}</span>
                            <span className="md-typescale-label-small nd-sel-well-count">{items.length} 项</span>
                            <button
                              className="nd-sel-remove-all-btn"
                              aria-label={`移除 ${wellName} 全部字段`}
                              title="移除该井全部字段"
                              onClick={() => {
                                const keys = items.map((i) => `${i.wellId}::${i.fieldId}`)
                                setSelected((prev) => {
                                  const next = new Set(prev)
                                  keys.forEach((k) => next.delete(k))
                                  return next
                                })
                              }}
                            >
                              <md-icon>close</md-icon>
                            </button>
                          </div>
                          {CATEGORIES.map((cat) => {
                            const catItems = byCategory[cat]
                            if (!catItems || catItems.length === 0) return null
                            return (
                              <div key={cat} className="nd-sel-cat-group">
                                <div className="nd-sel-cat-label md-typescale-label-small">{cat}</div>
                                {catItems.map((item) => {
                                  const key = `${item.wellId}::${item.fieldId}`
                                  const isSelChecked = selChecked.has(key)
                                  return (
                                    <label key={key} className={`nd-sel-field-row${isSelChecked ? ' nd-sel-field-row--checked' : ''}`}>
                                      <input
                                        type="checkbox"
                                        className="nd-cbox"
                                        checked={isSelChecked}
                                        onChange={() => {
                                          setSelChecked((prev) => {
                                            const next = new Set(prev)
                                            if (next.has(key)) next.delete(key)
                                            else next.add(key)
                                            return next
                                          })
                                        }}
                                        aria-label={item.fieldName}
                                      />
                                      <span className="md-typescale-body-small nd-sel-field-name">{item.fieldName}</span>
                                      <button
                                        className="nd-sel-field-remove"
                                        aria-label={`移除 ${item.fieldName}`}
                                        title="移除"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          setSelected((prev) => {
                                            const next = new Set(prev)
                                            next.delete(key)
                                            return next
                                          })
                                        }}
                                      >
                                        <md-icon>close</md-icon>
                                      </button>
                                    </label>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="nd-footer">
          <div className="nd-footer-stats md-typescale-body-small">
            {selected.size > 0 ? (
              <>
                已选 <strong>{wellCount}</strong> 口井 ·{' '}
                <strong>{fieldCount}</strong> 个去重字段 ·{' '}
                <strong>{totalCount}</strong> 个井字段组合
              </>
            ) : (
              <span className="nd-footer-stats-empty">
                {templateChosen ? '请选择至少一口井和一个字段' : '请先选择质检模板'}
              </span>
            )}
          </div>
          <div className="nd-footer-actions">
            <md-outlined-button onClick={handleClose}>取消</md-outlined-button>
            <md-filled-button
              disabled={!name.trim() || !templateChosen || selected.size === 0 || undefined}
              onClick={validateAndConfirm}
            >
              确认创建
            </md-filled-button>
          </div>
        </div>
      </div>
    </div>
  )
}
