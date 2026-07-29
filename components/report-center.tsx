'use client'

import { useState, useMemo } from 'react'

// ─── 类型 ───────────────────────────────────────────────
export type ReportStatus = '草稿' | '生成中' | '待审阅' | '已发布' | '已归档' | '生成失败'
export type ReportType = '综合质控报告' | '一致性专项' | '完整性专项' | '分布范围专项' | '相关性专项'

export interface ReportItem {
  id: string
  name: string
  reportNo: string
  type: ReportType
  dataset: string
  datasetVersion: string
  score: number
  scoreDim: string
  generatedAt: string
  version: string
  status: ReportStatus
  author: string
  template: string
}

// ─── 模拟数据 ───────────────────────────────────────────
const MOCK_REPORTS: ReportItem[] = [
  {
    id: '1',
    name: '苏里格区块2024年综合数据集_综合质控报告',
    reportNo: 'QCR-2024-001',
    type: '综合质控报告',
    dataset: '苏里格区块2024年综合数据集',
    datasetVersion: 'v3.2',
    score: 85,
    scoreDim: '综合',
    generatedAt: '2024-07-20 14:32',
    version: 'v1.2',
    status: '待审阅',
    author: '张工',
    template: '数据集综合质控标准模板 v2.1',
  },
  {
    id: '2',
    name: '苏里格区块2024年综合数据集_一致性专项',
    reportNo: 'QCR-2024-002',
    type: '一致性专项',
    dataset: '苏里格区块2024年综合数据集',
    datasetVersion: 'v3.1',
    score: 88,
    scoreDim: '一致性',
    generatedAt: '2024-07-18 09:15',
    version: 'v1.0',
    status: '已发布',
    author: '李工',
    template: '一致性专项模板 v1.0',
  },
  {
    id: '3',
    name: '靖边区块2024Q2完整性检查',
    reportNo: 'QCR-2024-003',
    type: '完整性专项',
    dataset: '靖边区块2024Q2数据集',
    datasetVersion: 'v2.0',
    score: 91,
    scoreDim: '完整性',
    generatedAt: '2024-07-15 16:48',
    version: 'v2.1',
    status: '已发布',
    author: '王工',
    template: '完整性专项模板 v1.0',
  },
  {
    id: '4',
    name: '榆林区块综合数据集_分布范围专项',
    reportNo: 'QCR-2024-004',
    type: '分布范围专项',
    dataset: '榆林区块综合数据集',
    datasetVersion: 'v1.5',
    score: 76,
    scoreDim: '分布范围',
    generatedAt: '2024-07-12 11:20',
    version: 'v1.0',
    status: '草稿',
    author: '赵工',
    template: '分布范围专项模板 v1.0',
  },
  {
    id: '5',
    name: '苏里格区块2024年综合数据集_相关性分析',
    reportNo: 'QCR-2024-005',
    type: '相关性专项',
    dataset: '苏里格区块2024年综合数据集',
    datasetVersion: 'v3.0',
    score: 79,
    scoreDim: '相关性',
    generatedAt: '2024-07-10 08:55',
    version: 'v1.1',
    status: '已归档',
    author: '张工',
    template: '相关性专项模板 v1.0',
  },
  {
    id: '6',
    name: '乌审旗区块质控综合报告',
    reportNo: 'QCR-2024-006',
    type: '综合质控报告',
    dataset: '乌审旗区块2024数据集',
    datasetVersion: 'v1.0',
    score: 0,
    scoreDim: '综合',
    generatedAt: '—',
    version: 'v0.1',
    status: '生成失败',
    author: '刘工',
    template: '数据集综合质控标准模板 v2.1',
  },
]

const STATUS_COLOR: Record<ReportStatus, string> = {
  '草稿':    'status-draft',
  '生成中':  'status-generating',
  '待审阅':  'status-review',
  '已发布':  'status-published',
  '已归档':  'status-archived',
  '生成失败':'status-failed',
}

const TYPE_COLOR: Record<ReportType, string> = {
  '综合质控报告': 'rtype-comprehensive',
  '一致性专项':   'rtype-consistency',
  '完整性专项':   'rtype-completeness',
  '分布范围专项': 'rtype-distribution',
  '相关性专项':   'rtype-correlation',
}

// ─── 创建报告弹窗 ────────────────────────────────────────
interface CreateReportDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (report: Partial<ReportItem>) => void
  initialDataset?: string
}

export function CreateReportDialog({ open, onClose, onConfirm, initialDataset }: CreateReportDialogProps) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const [type, setType] = useState<ReportType>('综合质控报告')
  const [dataset, setDataset] = useState(initialDataset ?? '苏里格区块2024年综合数据集')
  const [datasetVersion, setDatasetVersion] = useState('v3.2')
  const [name, setName] = useState(`${initialDataset ?? '苏里格区块2024年综合数据集'}_${type}_${today}`)
  const [autoSync, setAutoSync] = useState(true)
  const [scope, setScope] = useState('全部井及字段')
  const [nameError, setNameError] = useState('')

  const handleTypeChange = (t: ReportType) => {
    setType(t)
    setName(`${dataset}_${t}_${today}`)
  }

  const handleConfirm = () => {
    if (!name.trim()) { setNameError('报告名称不能为空'); return }
    setNameError('')
    onConfirm({ name, type, dataset, datasetVersion, status: '草稿', author: '张工', score: 0, version: 'v0.1', scoreDim: type === '综合质控报告' ? '综合' : type.replace('专项', '') })
  }

  if (!open) return null

  return (
    <div className="rc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rc-dialog" role="dialog" aria-modal="true" aria-label="创建新报告">
        <div className="rc-dialog-header">
          <span className="md-typescale-title-medium rc-dialog-title">创建新报告</span>
          <button className="rc-icon-btn" onClick={onClose} aria-label="关闭">
            <md-icon>close</md-icon>
          </button>
        </div>

        <div className="rc-dialog-body">
          <div className="rc-form-row">
            <label className="rc-form-label">报告名称<span className="rc-required">*</span></label>
            <div className="rc-form-field">
              <input
                className={`rc-input${nameError ? ' rc-input--error' : ''}`}
                value={name}
                onChange={e => { setName(e.target.value); setNameError('') }}
                placeholder="请输入报告名称"
              />
              {nameError && <span className="rc-error-msg md-typescale-label-small">{nameError}</span>}
            </div>
          </div>

          <div className="rc-form-row">
            <label className="rc-form-label">报告类型<span className="rc-required">*</span></label>
            <div className="rc-form-field">
              <select className="rc-select" value={type} onChange={e => handleTypeChange(e.target.value as ReportType)}>
                <option>综合质控报告</option>
                <option>一致性专项</option>
                <option>完整性专项</option>
                <option>分布范围专项</option>
                <option>相关性专项</option>
              </select>
            </div>
          </div>

          <div className="rc-form-row">
            <label className="rc-form-label">报告模板<span className="rc-required">*</span></label>
            <div className="rc-form-field">
              <select className="rc-select">
                <option>数据集综合质控标准模板 v2.1（生效）</option>
                <option>一致性专项模板 v1.0（生效）</option>
              </select>
            </div>
          </div>

          <div className="rc-form-row">
            <label className="rc-form-label">关联数据集<span className="rc-required">*</span></label>
            <div className="rc-form-field">
              <select className="rc-select" value={dataset} onChange={e => setDataset(e.target.value)}>
                <option>苏里格区块2024年综合数据集</option>
                <option>靖边区块2024Q2数据集</option>
                <option>榆林区块综合数据集</option>
                <option>乌审旗区块2024数据集</option>
              </select>
            </div>
          </div>

          <div className="rc-form-row">
            <label className="rc-form-label">数据集版本<span className="rc-required">*</span></label>
            <div className="rc-form-field">
              <select className="rc-select" value={datasetVersion} onChange={e => setDatasetVersion(e.target.value)}>
                <option>v3.2（当前在用）</option>
                <option>v3.1</option>
                <option>v3.0</option>
              </select>
            </div>
          </div>

          <div className="rc-form-row">
            <label className="rc-form-label">报告范围</label>
            <div className="rc-form-field">
              <select className="rc-select" value={scope} onChange={e => setScope(e.target.value)}>
                <option>全部井及字段</option>
                <option>当前选定井与字段</option>
              </select>
            </div>
          </div>

          <div className="rc-form-row rc-form-row--switch">
            <label className="rc-form-label">自动同步最新质控数据</label>
            <div className="rc-form-field rc-form-field--switch">
              <button
                className={`rc-toggle${autoSync ? ' rc-toggle--on' : ''}`}
                role="switch"
                aria-checked={autoSync}
                onClick={() => setAutoSync(!autoSync)}
              >
                <span className="rc-toggle-thumb" />
              </button>
              <span className="md-typescale-label-small rc-toggle-hint">
                {autoSync ? '开启（仅更新草稿版本）' : '关闭'}
              </span>
            </div>
          </div>
        </div>

        <div className="rc-dialog-footer">
          <button className="rc-btn rc-btn--ghost" onClick={onClose}>取消</button>
          <button className="rc-btn rc-btn--primary" onClick={handleConfirm}>
            <md-icon>add_circle</md-icon>
            创建并预览
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 报告卡片 ────────────────────────────────────────────
interface ReportCardProps {
  report: ReportItem
  onPreview: (id: string) => void
}

function ReportCard({ report, onPreview }: ReportCardProps) {
  const scoreColor = report.score >= 90 ? 'var(--app-color-success)' : report.score >= 75 ? 'var(--app-color-warning)' : report.score > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)'

  return (
    <article
      className="rc-card"
      onClick={() => onPreview(report.id)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPreview(report.id)}
      aria-label={`报告：${report.name}`}
    >
      <div className="rc-card-top">
        <span className={`rc-type-badge ${TYPE_COLOR[report.type]}`}>{report.type}</span>
        <span className={`rc-status-badge ${STATUS_COLOR[report.status]}`}>{report.status}</span>
      </div>

      <h3 className="md-typescale-title-small rc-card-name" title={report.name}>{report.name}</h3>

      <div className="rc-card-meta">
        <span className="rc-meta-item"><md-icon>storage</md-icon>{report.dataset}</span>
        <span className="rc-meta-item"><md-icon>tag</md-icon>{report.datasetVersion}</span>
      </div>

      {report.score > 0 ? (
        <div className="rc-card-score">
          <span className="rc-score-value" style={{ color: scoreColor }}>{report.score}</span>
          <span className="rc-score-label">{report.scoreDim}评分</span>
        </div>
      ) : (
        <div className="rc-card-score rc-card-score--empty">
          <span className="rc-score-empty">暂无评分</span>
        </div>
      )}

      <div className="rc-card-info">
        <span className="md-typescale-label-small rc-info-item">
          <md-icon>schedule</md-icon>{report.generatedAt !== '—' ? report.generatedAt : '未生成'}
        </span>
        <span className="md-typescale-label-small rc-info-item">
          <md-icon>history</md-icon>{report.version}
        </span>
        <span className="md-typescale-label-small rc-info-item">
          <md-icon>person</md-icon>{report.author}
        </span>
      </div>

      <div className="rc-card-actions" onClick={e => e.stopPropagation()}>
        <button className="rc-action-btn" onClick={() => onPreview(report.id)} title="预览">
          <md-icon>visibility</md-icon>预览
        </button>
        <button
          className={`rc-action-btn${report.status !== '已发布' ? ' rc-action-btn--secondary' : ''}`}
          title={report.status !== '已发布' ? '非正式版，草稿下载' : '下载'}
        >
          <md-icon>download</md-icon>
          {report.status !== '已发布' ? '下载(草稿)' : '下载'}
        </button>
        <button className="rc-action-btn rc-action-btn--icon" title="更多操作" aria-label="更多操作">
          <md-icon>more_horiz</md-icon>
        </button>
      </div>
    </article>
  )
}

// ─── 报告列表行 ──────────────────────────────────────────
interface ReportRowProps {
  report: ReportItem
  checked: boolean
  onCheck: () => void
  onPreview: (id: string) => void
  batchMode: boolean
}

function ReportRow({ report, checked, onCheck, onPreview, batchMode }: ReportRowProps) {
  const scoreColor = report.score >= 90 ? 'var(--app-color-success)' : report.score >= 75 ? 'var(--app-color-warning)' : report.score > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)'

  return (
    <tr className={`rc-list-row${checked ? ' rc-list-row--checked' : ''}`}>
      {batchMode && (
        <td className="rc-list-cell rc-list-cell--check">
          <input type="checkbox" checked={checked} onChange={onCheck} aria-label={`选择${report.name}`} />
        </td>
      )}
      <td className="rc-list-cell rc-list-cell--name">
        <button className="rc-list-name-btn" onClick={() => onPreview(report.id)}>
          <span className="rc-list-name">{report.name}</span>
          <span className="md-typescale-label-small rc-list-no">{report.reportNo}</span>
        </button>
      </td>
      <td className="rc-list-cell">
        <span className="md-typescale-label-small">{report.dataset}</span>
      </td>
      <td className="rc-list-cell">
        <span className="md-typescale-label-small rc-version-chip">{report.datasetVersion}</span>
      </td>
      <td className="rc-list-cell">
        <span className={`rc-type-badge rc-type-badge--sm ${TYPE_COLOR[report.type]}`}>{report.type}</span>
      </td>
      <td className="rc-list-cell rc-list-cell--score">
        {report.score > 0
          ? <strong style={{ color: scoreColor }}>{report.score}</strong>
          : <span className="rc-score-dash">—</span>
        }
      </td>
      <td className="rc-list-cell rc-list-cell--mono">{report.generatedAt}</td>
      <td className="rc-list-cell">
        <span className="md-typescale-label-small rc-version-chip">{report.version}</span>
      </td>
      <td className="rc-list-cell">
        <span className={`rc-status-badge ${STATUS_COLOR[report.status]}`}>{report.status}</span>
      </td>
      <td className="rc-list-cell">{report.author}</td>
      <td className="rc-list-cell rc-list-cell--actions">
        <button className="rc-row-action-btn" onClick={() => onPreview(report.id)} title="预览">
          <md-icon>visibility</md-icon>
        </button>
        <button className="rc-row-action-btn" title="下载">
          <md-icon>download</md-icon>
        </button>
        <button className="rc-row-action-btn" title="更多">
          <md-icon>more_horiz</md-icon>
        </button>
      </td>
    </tr>
  )
}

// ─── 主组件：报告中心 ────────────────────────────────────
interface ReportCenterProps {
  onPreview: (id: string) => void
}

export function ReportCenter({ onPreview }: ReportCenterProps) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<ReportType | '全部类型'>('全部类型')
  const [filterStatus, setFilterStatus] = useState<ReportStatus | '全部状态'>('全部状态')
  const [view, setView] = useState<'card' | 'list'>('card')
  const [createOpen, setCreateOpen] = useState(false)
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS)
  const [batchMode, setBatchMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.dataset.includes(search) || r.datasetVersion.includes(search)
      const matchType = filterType === '全部类型' || r.type === filterType
      const matchStatus = filterStatus === '全部状态' || r.status === filterStatus
      return matchSearch && matchType && matchStatus
    })
  }, [reports, search, filterType, filterStatus])

  const handleReset = () => {
    setSearch('')
    setFilterType('全部类型')
    setFilterStatus('全部状态')
  }

  const handleCreate = (partial: Partial<ReportItem>) => {
    const newReport: ReportItem = {
      id: String(Date.now()),
      reportNo: `QCR-2024-00${reports.length + 1}`,
      generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
      template: '数据集综合质控标准模板 v2.1',
      ...partial,
    } as ReportItem
    setReports(prev => [newReport, ...prev])
    setCreateOpen(false)
    onPreview(newReport.id)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const activeFilters = (search ? 1 : 0) + (filterType !== '全部类型' ? 1 : 0) + (filterStatus !== '全部状态' ? 1 : 0)

  return (
    <div className="rc-center">
      {/* 页面头部 */}
      <div className="rc-page-header">
        <div className="rc-page-header-text">
          <h1 className="md-typescale-headline-small rc-page-title">质控报告中心</h1>
          <p className="md-typescale-body-medium rc-page-subtitle">管理、生成和交付数据集质控报告</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="rc-filter-bar">
        <div className="rc-filter-left">
          <div className="rc-search-wrap">
            <md-icon>search</md-icon>
            <input
              className="rc-search-input"
              placeholder="搜索报告名称、数据集..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setSearch('') }}
              aria-label="搜索报告"
            />
            {search && (
              <button className="rc-search-clear" onClick={() => setSearch('')} aria-label="清空搜索">
                <md-icon>close</md-icon>
              </button>
            )}
          </div>

          <select className="rc-filter-select" value={filterType} onChange={e => setFilterType(e.target.value as ReportType | '全部类型')} aria-label="报告类型筛选">
            <option value="全部类型">全部类型</option>
            <option>综合质控报告</option>
            <option>一致性专项</option>
            <option>完整性专项</option>
            <option>分布范围专项</option>
            <option>相关性专项</option>
          </select>

          <select className="rc-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as ReportStatus | '全部状态')} aria-label="状态筛选">
            <option value="全部状态">全部状态</option>
            <option>草稿</option>
            <option>生成中</option>
            <option>待审阅</option>
            <option>已发布</option>
            <option>已归档</option>
            <option>生成失败</option>
          </select>

          {activeFilters > 0 && (
            <button className="rc-reset-btn" onClick={handleReset}>
              <md-icon>filter_alt_off</md-icon>
              重置
            </button>
          )}
        </div>

        <div className="rc-filter-right">
          {batchMode && selected.size > 0 && (
            <div className="rc-batch-actions">
              <span className="md-typescale-label-small rc-batch-count">已选 {selected.size} 条</span>
              <button className="rc-btn rc-btn--ghost rc-btn--sm">批量归档</button>
              <button className="rc-btn rc-btn--ghost rc-btn--sm">批量导出</button>
            </div>
          )}
          <button
            className={`rc-view-toggle-btn${batchMode ? ' rc-view-toggle-btn--active' : ''}`}
            onClick={() => { setBatchMode(!batchMode); setSelected(new Set()) }}
            title="批量操作"
          >
            <md-icon>checklist</md-icon>
          </button>
          <div className="rc-view-switch" role="group" aria-label="视图切换">
            <button
              className={`rc-view-btn${view === 'card' ? ' rc-view-btn--active' : ''}`}
              onClick={() => setView('card')}
              aria-pressed={view === 'card'}
              title="卡片视图"
            >
              <md-icon>grid_view</md-icon>
            </button>
            <button
              className={`rc-view-btn${view === 'list' ? ' rc-view-btn--active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              title="列表视图"
            >
              <md-icon>view_list</md-icon>
            </button>
          </div>
        </div>
      </div>

      {/* 结果数量 */}
      <div className="rc-result-info">
        <span className="md-typescale-label-medium rc-result-count">
          共 <strong>{filtered.length}</strong> 条报告
          {activeFilters > 0 && <span className="rc-filter-hint">（已筛选，共 {reports.length} 条）</span>}
        </span>
      </div>

      {/* 内容区 */}
      {filtered.length === 0 ? (
        <div className="rc-empty">
          <md-icon>description</md-icon>
          <p className="md-typescale-body-large">未找到匹配的报告</p>
          {activeFilters > 0 && (
            <button className="rc-btn rc-btn--ghost" onClick={handleReset}>清空筛选</button>
          )}
        </div>
      ) : view === 'card' ? (
        <div className="rc-card-grid">
          {filtered.map(r => (
            <ReportCard key={r.id} report={r} onPreview={onPreview} />
          ))}
        </div>
      ) : (
        <div className="rc-list-wrap">
          <table className="rc-list-table" aria-label="报告列表">
            <thead>
              <tr>
                {batchMode && <th className="rc-list-th rc-list-th--check"><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())} /></th>}
                <th className="rc-list-th">报告名称</th>
                <th className="rc-list-th">关联数据集</th>
                <th className="rc-list-th">数据集版本</th>
                <th className="rc-list-th">报告类型</th>
                <th className="rc-list-th rc-list-th--sort">综合评分 <md-icon>unfold_more</md-icon></th>
                <th className="rc-list-th rc-list-th--sort">生成时间 <md-icon>unfold_more</md-icon></th>
                <th className="rc-list-th">报告版本</th>
                <th className="rc-list-th">状态</th>
                <th className="rc-list-th">生成人</th>
                <th className="rc-list-th">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <ReportRow
                  key={r.id}
                  report={r}
                  checked={selected.has(r.id)}
                  onCheck={() => toggleSelect(r.id)}
                  onPreview={onPreview}
                  batchMode={batchMode}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 底部分页 */}
      <div className="rc-pagination">
        <span className="md-typescale-label-small rc-page-info">第 1 页，共 1 页</span>
        <div className="rc-page-btns">
          <button className="rc-page-btn" disabled><md-icon>chevron_left</md-icon></button>
          <button className="rc-page-btn rc-page-btn--active">1</button>
          <button className="rc-page-btn" disabled><md-icon>chevron_right</md-icon></button>
        </div>
        <select className="rc-per-page-select" aria-label="每页显示数量">
          <option>每页 10 条</option>
          <option>每页 20 条</option>
          <option>每页 50 条</option>
        </select>
      </div>

      <CreateReportDialog open={createOpen} onClose={() => setCreateOpen(false)} onConfirm={handleCreate} />
    </div>
  )
}
