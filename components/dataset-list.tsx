'use client'

import { useState } from 'react'
import { NewDatasetDialog } from './new-dataset-dialog'

export type DatasetStatus =
  | '质控中'
  | '待复核'
  | '已完成'
  | '已归档'
  | '初始化中'
  | '创建失败'

export interface Dataset {
  id: string
  name: string
  version: string
  status: DatasetStatus
  score?: number
  updatedAt: string
}

const MOCK_DATASETS: Dataset[] = [
  {
    id: '1',
    name: '苏里格区块2024年综合数据集',
    version: 'v3.2',
    status: '待复核',
    score: 87.5,
    updatedAt: '2024-07-20',
  },
  {
    id: '2',
    name: '长北区块压裂工程数据集',
    version: 'v2.1',
    status: '已完成',
    score: 92.3,
    updatedAt: '2024-07-18',
  },
  {
    id: '3',
    name: '陇东区块地质参数数据集',
    version: 'v1.5',
    status: '质控中',
    updatedAt: '2024-07-22',
  },
  {
    id: '4',
    name: '镇原区块生产监测数据集',
    version: 'v4.0',
    status: '已完成',
    score: 95.1,
    updatedAt: '2024-07-15',
  },
  {
    id: '5',
    name: '华庆区块岩心分析数据集',
    version: 'v1.0',
    status: '初始化中',
    updatedAt: '2024-07-22',
  },
]

const STATUS_CONFIG: Record<DatasetStatus, { color: string; bg: string; label: string }> = {
  质控中: { color: '#1565c0', bg: '#e3f2fd', label: '质控中' },
  待复核: { color: '#e65100', bg: '#fff3e0', label: '待复核' },
  已完成: { color: '#2e7d32', bg: '#e8f5e9', label: '已完成' },
  已归档: { color: '#546e7a', bg: '#eceff1', label: '已归档' },
  初始化中: { color: '#6a1b9a', bg: '#f3e5f5', label: '初始化中' },
  创建失败: { color: '#c62828', bg: '#ffebee', label: '创建失败' },
}

interface DatasetListProps {
  selectedId?: string
  onSelect: (id: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  onViewReport?: (datasetId: string) => void
}

export function DatasetList({ selectedId, onSelect, collapsed, onToggleCollapse, onViewReport }: DatasetListProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<DatasetStatus | '全部'>('全部')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS)

  const filtered = datasets.filter((d) => {
    const matchSearch = d.name.includes(search)
    const matchStatus = filterStatus === '全部' || d.status === filterStatus
    return matchSearch && matchStatus
  })

  if (collapsed) {
    return (
      <aside
        className="panel-section panel-section--collapsed"
        aria-label="数据集列表（已折叠）"
      >
        <div className="panel-collapsed-rail">
          <md-icon-button
            aria-label="展开数据集列表"
            title="展开数据集列表"
            onClick={onToggleCollapse}
          >
            <md-icon>chevron_right</md-icon>
          </md-icon-button>
          <div className="panel-collapsed-label" aria-hidden="true">
            <md-icon>dataset</md-icon>
            <span className="panel-collapsed-text">数据集</span>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="panel-section dataset-list-panel" aria-label="数据集列表">
      {/* 面板标题行 */}
      <div className="panel-header">
        <span className="md-typescale-label-large panel-title">数据集列表</span>
        <div className="panel-header-actions">
          <md-icon-button
            aria-label="收起数据集列表"
            title="收起数据集列表"
            onClick={onToggleCollapse}
          >
            <md-icon>chevron_left</md-icon>
          </md-icon-button>
        </div>
      </div>

      {/* 新建按钮 */}
      <div className="dataset-list-new">
        <md-outlined-button class="dataset-new-btn" onClick={() => setDialogOpen(true)}>
          <md-icon slot="icon">add</md-icon>
          新建数据集
        </md-outlined-button>
      </div>

      {/* 新建数据集弹窗 */}
      <NewDatasetDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={(name) => {
          setDialogOpen(false)
          // 1. 列表自动新增新数据集（初始化中）
          const newId = `ds-${Date.now()}`
          const newDataset: Dataset = {
            id: newId,
            name,
            version: 'v1.0',
            status: '初始化中',
            updatedAt: new Date().toISOString().slice(0, 10),
          }
          setDatasets((prev) => [newDataset, ...prev])
          onSelect(newId)
          // 2. 新建后数据集列表自动收起
          if (!collapsed) onToggleCollapse()
        }}
      />

      {/* 搜索框 */}
      <div className="dataset-list-search">
        <div className="search-input-wrap">
          <md-icon class="search-icon">search</md-icon>
          <input
            type="search"
            className="search-input md-typescale-body-small"
            placeholder="按名称检索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="按名称检索数据集"
          />
        </div>
      </div>

      {/* 状态筛选 */}
      <div className="dataset-filter-row">
        {(['全部', '质控中', '待复核', '已完成'] as const).map((s) => (
          <button
            key={s}
            className={`filter-chip md-typescale-label-small${filterStatus === s ? ' filter-chip--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 数据集列表 */}
      <ul className="dataset-items" role="listbox" aria-label="数据集列表">
        {filtered.length === 0 && (
          <li className="dataset-empty md-typescale-body-small">暂无匹配的数据集</li>
        )}
        {filtered.map((d) => {
          const st = STATUS_CONFIG[d.status]
          const isSelected = d.id === selectedId
          return (
            <li
              key={d.id}
              role="option"
              aria-selected={isSelected}
              className={`dataset-item${isSelected ? ' dataset-item--selected' : ''}`}
              onClick={() => onSelect(d.id)}
            >
              <div className="dataset-item-main">
                <div className="dataset-item-row1">
                  <span className="dataset-item-name md-typescale-body-medium">{d.name}</span>
                  <span className="dataset-item-version md-typescale-label-small">
                    {d.version}
                  </span>
                </div>
                <div className="dataset-item-row2">
                  <span
                    className="dataset-item-status md-typescale-label-small"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.label}
                  </span>
                  {d.score !== undefined ? (
                    <span
                      className="dataset-item-score md-typescale-label-small"
                      style={{
                        color:
                          d.score >= 90
                            ? 'var(--app-color-success)'
                            : d.score >= 75
                            ? 'var(--app-color-warning)'
                            : 'var(--md-sys-color-error)',
                      }}
                    >
                      {d.score}分
                    </span>
                  ) : (
                    <span className="dataset-item-score-empty md-typescale-label-small">
                      暂无评分
                    </span>
                  )}
                  <span className="dataset-item-date md-typescale-label-small">{d.updatedAt}</span>
                </div>
              </div>

              {/* 行操作 */}
              <div
                className="dataset-item-actions"
                style={{ position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                <md-icon-button
                  aria-label={`数据集 ${d.name} 更多操作`}
                  id={`ds-more-${d.id}`}
                  onClick={() => setMenuOpenId(menuOpenId === d.id ? null : d.id)}
                >
                  <md-icon>more_vert</md-icon>
                </md-icon-button>
                <md-menu
                  anchor={`ds-more-${d.id}`}
                  open={menuOpenId === d.id || undefined}
                  onclosed={() => setMenuOpenId(null)}
                >
                  <md-menu-item onClick={() => { setMenuOpenId(null); onViewReport?.(d.id) }}>
                    <md-icon slot="start">description</md-icon>
                    <div slot="headline">查看报告</div>
                  </md-menu-item>
                  <md-divider />
                  <md-menu-item>
                    <md-icon slot="start">download</md-icon>
                    <div slot="headline">导出</div>
                  </md-menu-item>
                  <md-menu-item>
                    <md-icon slot="start">edit</md-icon>
                    <div slot="headline">编辑</div>
                  </md-menu-item>
                  <md-menu-item>
                    <md-icon slot="start">archive</md-icon>
                    <div slot="headline">归档</div>
                  </md-menu-item>
                  <md-divider />
                  <md-menu-item>
                    <md-icon slot="start" style={{ color: 'var(--md-sys-color-error)' }}>
                      delete
                    </md-icon>
                    <div slot="headline" style={{ color: 'var(--md-sys-color-error)' }}>
                      删除
                    </div>
                  </md-menu-item>
                </md-menu>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
