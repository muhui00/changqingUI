'use client'

import { useState } from 'react'

// ─── 类型 ──────────────────────────────────────────────────────────────────────

type SampleStatus = '创建中' | '已完成' | '已归档' | '创建失败'

interface SampleItem {
  id: string
  name: string
  datasetId: string
  datasetName: string
  status: SampleStatus
  score: number | null
  createdAt: string
  wells: number
  fields: number
  records: number
  creator: string
}

// ─── 模拟数据 ──────────────────────────────────────────────────────────────────

const MOCK_DATASETS = [
  { id: '1', name: '苏里格区块2024年综合数据集' },
  { id: '2', name: '靖边区块2024Q2数据集' },
  { id: '3', name: '陇东区块压裂数据2024' },
  { id: '4', name: '苏里格区块2023年综合数据集' },
]

const MOCK_SAMPLES: SampleItem[] = [
  { id: '1', name: '苏里格2024-完整样本A', datasetId: '1', datasetName: '苏里格区块2024年综合数据集', status: '已完成', score: 92, createdAt: '2024-07-20 14:32', wells: 12, fields: 48, records: 8640, creator: '张工' },
  { id: '2', name: '苏里格2024-水平井样本', datasetId: '1', datasetName: '苏里格区块2024年综合数据集', status: '已完成', score: 88, createdAt: '2024-07-18 09:10', wells: 8, fields: 44, records: 5760, creator: '张工' },
  { id: '3', name: '靖边2024Q2-生产样本', datasetId: '2', datasetName: '靖边区块2024Q2数据集', status: '已完成', score: 91, createdAt: '2024-07-18 11:05', wells: 8, fields: 36, records: 5760, creator: '李工' },
  { id: '4', name: '陇东压裂-初始样本', datasetId: '3', datasetName: '陇东区块压裂数据2024', status: '创建中', score: null, createdAt: '2024-07-22 10:20', wells: 5, fields: 28, records: 3600, creator: '王工' },
  { id: '5', name: '苏里格2023-归档样本', datasetId: '4', datasetName: '苏里格区块2023年综合数据集', status: '已归档', score: 87, createdAt: '2024-01-15 16:45', wells: 10, fields: 44, records: 7200, creator: '张工' },
  { id: '6', name: '靖边2024Q2-地质样本', datasetId: '2', datasetName: '靖边区块2024Q2数据集', status: '创建失败', score: null, createdAt: '2024-07-16 08:30', wells: 0, fields: 0, records: 0, creator: '李工' },
]

// 样本宽表列定义
const WIDE_TABLE_COLS = [
  { group: '基础参数', cols: [
    { key: 'wellName',   label: '井名' },
    { key: 'compDate',   label: '完井日期' },
    { key: 'prodDate',   label: '投产日期' },
    { key: 'wellClass',  label: '井别' },
    { key: 'wellType',   label: '井型' },
  ]},
  { group: '地质分层', cols: [
    { key: 'geoLayer',   label: '地质分层\n字符串\nMost of' },
  ]},
  { group: '测井解释结论', cols: [
    { key: 'logInterp',  label: '测井解释结论\n字符串\nMost of' },
    { key: 'engPoint',   label: '工程甜点\n字符串\nMost of' },
    { key: 'geoPoint',   label: '地质甜点\n字符串\nMost of' },
    { key: 'dualPoint',  label: '双甜点\n字符串\nMost of' },
  ]},
  { group: '成像测井', cols: [
    { key: 'imgLog',     label: '成像测井\n字符串\nMost of' },
    { key: 'brit',       label: 'BRIT\n数值小数\nAverage' },
    { key: 'cal',        label: 'CAL\n数值小数\nAverage' },
    { key: 'cmpr',       label: 'CMPR\n数值小数\nAverage' },
    { key: 'cnl',        label: 'CNL\n数值小数\nAverage' },
  ]},
]

const MOCK_WIDE_ROWS = [
  { wellName: 'LGPC1-1...', compDate: '', prodDate: '2025-01-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: 'Y', geoPoint: 'Y', dualPoint: 'Y', imgLog: 'Y', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'LGPC1-1...', compDate: '', prodDate: '2025-01-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: 'Y', geoPoint: 'Y', dualPoint: 'Y', imgLog: '', brit: 'Y', cal: 'Y', cmpr: '', cnl: 'Y' },
  { wellName: 'LGPC1-14', compDate: '', prodDate: '', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: '', geoPoint: '', dualPoint: '', imgLog: 'Y', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'LGPC1-1...', compDate: '', prodDate: '2024-04-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: 'Y', geoPoint: 'Y', dualPoint: 'Y', imgLog: '', brit: 'Y', cal: 'Y', cmpr: '', cnl: 'Y' },
  { wellName: 'LGPC4-1...', compDate: '', prodDate: '2024-05-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: 'Y', cal: 'Y', cmpr: '', cnl: '' },
  { wellName: 'LGPC4-1...', compDate: '', prodDate: '2024-07-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: 'Y', cal: 'Y', cmpr: '', cnl: '' },
  { wellName: 'LGPC4-1...', compDate: '', prodDate: '2024-05-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: '', geoPoint: '', dualPoint: '', imgLog: 'Y', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'SM-08-C...', compDate: '', prodDate: '2024-01-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: '', geoPoint: '', dualPoint: 'Y', imgLog: '', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'SM2-12-...', compDate: '', prodDate: '2023-11-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: 'Y', geoPoint: 'Y', dualPoint: 'Y', imgLog: 'Y', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'SM2-23-...', compDate: '', prodDate: '2023-05-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: 'Y', cal: 'Y', cmpr: '', cnl: '' },
  { wellName: 'SMC2-49...', compDate: '', prodDate: '2024-03-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: 'Y', geoPoint: 'Y', dualPoint: 'Y', imgLog: 'Y', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'LGPC1-1...', compDate: '', prodDate: '2024-05-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: '', cal: '', cmpr: '', cnl: '' },
  { wellName: 'LGPC1-1...', compDate: '2023-08-...', prodDate: '2024-05-...', wellClass: '', wellType: '水平井', geoLayer: 'Y', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: 'Y', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'LGPC4-1...', compDate: '', prodDate: '2024-05-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: '', cal: '', cmpr: '', cnl: '' },
  { wellName: 'SM-T02-...', compDate: '', prodDate: '2023-07-...', wellClass: '', wellType: '', geoLayer: '', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: '', cal: '', cmpr: '', cnl: '' },
  { wellName: 'SM2-23-...', compDate: '', prodDate: '2023-04-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: '', cal: '', cmpr: '', cnl: '' },
  { wellName: 'SMC-31-...', compDate: '', prodDate: '2024-03-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: '', cal: '', cmpr: '', cnl: '' },
  { wellName: 'SMC2-49...', compDate: '', prodDate: '2024-02-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: 'Y', engPoint: '', geoPoint: '', dualPoint: '', imgLog: 'Y', brit: 'Y', cal: 'Y', cmpr: 'Y', cnl: 'Y' },
  { wellName: 'LGPC1-1...', compDate: '', prodDate: '2025-07-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: '', cal: '', cmpr: '', cnl: '' },
  { wellName: 'LGPC4-1...', compDate: '', prodDate: '2024-12-...', wellClass: '', wellType: '', geoLayer: 'Y', logInterp: '', engPoint: '', geoPoint: '', dualPoint: '', imgLog: '', brit: '', cal: '', cmpr: '', cnl: '' },
]

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function statusClass(s: SampleStatus) {
  if (s === '已完成') return 'sm-status sm-status--done'
  if (s === '创建中') return 'sm-status sm-status--running'
  if (s === '已归档') return 'sm-status sm-status--archived'
  if (s === '创建失败') return 'sm-status sm-status--failed'
  return 'sm-status'
}

// ─── 新建样本弹窗（步骤1&2）──────────────────────────────────────────────────

interface NewSampleDialogProps {
  onClose: () => void
  onNext: (name: string, datasetId: string) => void
}

function NewSampleDialog({ onClose, onNext }: NewSampleDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [datasetId, setDatasetId] = useState('')

  const handleStep1Next = () => {
    if (name.trim()) setStep(2)
  }

  const handleConfirm = () => {
    if (datasetId) onNext(name.trim(), datasetId)
  }

  return (
    <div className="sm-drawer-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sm-new-dialog">
        <div className="sm-new-dialog-header">
          <div className="sm-new-dialog-title-group">
            <md-icon>science</md-icon>
            <div>
              <div className="sm-drawer-title">新建样本</div>
              <div className="sm-drawer-subtitle">
                步骤 {step} / 2 — {step === 1 ? '填写样本名称' : '选择数据集'}
              </div>
            </div>
          </div>
          <button className="sm-icon-btn" onClick={onClose} aria-label="关闭">
            <md-icon>close</md-icon>
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="sm-steps">
          {(['填写名称', '选择数据集', '样本抽取'] as const).map((label, i) => (
            <div key={label} className={`sm-step${step === i + 1 ? ' sm-step--active' : step > i + 1 ? ' sm-step--done' : ''}`}>
              <div className="sm-step-dot">{step > i + 1 ? <md-icon>check</md-icon> : i + 1}</div>
              <span className="sm-step-label">{label}</span>
              {i < 2 && <div className="sm-step-line" />}
            </div>
          ))}
        </div>

        <div className="sm-new-dialog-body">
          {step === 1 && (
            <div className="sm-new-dialog-field">
              <label className="sm-new-dialog-label" htmlFor="sampleName">样本名称</label>
              <input
                id="sampleName"
                className="sm-new-dialog-input"
                placeholder="请输入样本名称"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleStep1Next() }}
                autoFocus
              />
            </div>
          )}
          {step === 2 && (
            <div className="sm-new-dialog-ds-list">
              {MOCK_DATASETS.map(ds => (
                <label key={ds.id} className={`sm-ds-option${datasetId === ds.id ? ' sm-ds-option--selected' : ''}`}>
                  <input
                    type="radio"
                    name="dataset"
                    value={ds.id}
                    checked={datasetId === ds.id}
                    onChange={() => setDatasetId(ds.id)}
                  />
                  <md-icon>dataset</md-icon>
                  <span>{ds.name}</span>
                  {datasetId === ds.id && <md-icon class="sm-ds-check">check_circle</md-icon>}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="sm-new-dialog-footer">
          {step === 2 && (
            <button className="sm-btn sm-btn--ghost" onClick={() => setStep(1)}>
              <md-icon>arrow_back</md-icon>上一步
            </button>
          )}
          {step === 1 ? (
            <button className="sm-btn sm-btn--primary" onClick={handleStep1Next} disabled={!name.trim()}>
              下一步<md-icon>arrow_forward</md-icon>
            </button>
          ) : (
            <button className="sm-btn sm-btn--primary" onClick={handleConfirm} disabled={!datasetId}>
              开始样本抽取<md-icon>arrow_forward</md-icon>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 样本抽取全屏页面 ─────────────────────────────────────────────────────────

interface SampleExtractionPageProps {
  sampleName: string
  datasetId: string
  mode: 'extract' | 'preview'
  onClose: () => void
  onSave: () => void
}

function SampleExtractionPage({ sampleName, datasetId, mode, onClose, onSave }: SampleExtractionPageProps) {
  const isPreview = mode === 'preview'
  const dataset = MOCK_DATASETS.find(d => d.id === datasetId)

  // 样本定义筛选
  const [wellStatusComplete, setWellStatusComplete] = useState(false)
  const [wellStatusFrac,     setWellStatusFrac]     = useState(false)
  const [wellStatusProd,     setWellStatusProd]     = useState(false)
  const [wellTypeStraight,   setWellTypeStraight]   = useState(false)
  const [wellTypeDirected,   setWellTypeDirected]   = useState(false)
  const [wellTypeHoriz,      setWellTypeHoriz]      = useState(false)
  const [intervalMode,       setIntervalMode]       = useState<'射孔段' | '压裂段'>('射孔段')
  const [threshold,          setThreshold]          = useState('1')

  // 计算参数
  const [timePeriod1M,  setTimePeriod1M]  = useState(false)
  const [timePeriod3M,  setTimePeriod3M]  = useState(false)
  const [timePeriod6M,  setTimePeriod6M]  = useState(false)
  const [timePeriod12M, setTimePeriod12M] = useState(false)
  const [timePeriodAll, setTimePeriodAll] = useState(false)
  const [statsTimePoint, setStatsTimePoint] = useState('')
  const [yieldSplit, setYieldSplit] = useState(false)
  const [geoCoeffMin, setGeoCoeffMin] = useState('')
  const [geoCoeffMax, setGeoCoeffMax] = useState('')
  const [calcMode, setCalcMode]     = useState<'井段' | '井'>('井')

  // 查询/计算状态（预览模式默认已查询）
  const [queried,    setQueried]    = useState(isPreview ? true : true)
  const [calculated, setCalculated] = useState(false)
  const [calcRunning, setCalcRunning] = useState(false)

  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const totalRows = MOCK_WIDE_ROWS.length + 8  // 共28条
  const pagedRows = MOCK_WIDE_ROWS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(totalRows / PAGE_SIZE)

  const handleCalc = () => {
    setCalcRunning(true)
    setTimeout(() => { setCalcRunning(false); setCalculated(true) }, 1200)
  }

  return (
    <div className="sm-extraction-page">
      {/* 顶部标题栏 */}
      <div className="sm-extraction-header">
        <div className="sm-extraction-header-left">
          <button className="sm-back-btn" onClick={onClose}>
            <md-icon>arrow_back</md-icon>返回
          </button>
          <div className="sm-page-header-sep" />
          <md-icon class="sm-page-icon">{isPreview ? 'visibility' : 'science'}</md-icon>
          <div>
            <div className="sm-page-title">{sampleName}</div>
            <div className="sm-page-subtitle">{isPreview ? '样本预览' : '样本抽取'} · {dataset?.name}</div>
          </div>
        </div>
        <div className="sm-extraction-header-right">
          {isPreview ? (
            <button className="sm-btn sm-btn--primary" onClick={onClose}>
              <md-icon>close</md-icon>关闭预览
            </button>
          ) : (
            <>
              <button className="sm-btn sm-btn--ghost" onClick={onClose}>取消</button>
              <button className="sm-btn sm-btn--primary" onClick={onSave} disabled={!calculated}>
                <md-icon>save</md-icon>保存样本
              </button>
            </>
          )}
        </div>
      </div>

      {/* 主体：左侧筛选 + 右侧表格 */}
      <div className="sm-extraction-body">
        {/* 左侧面板（预览模式隐藏）*/}
        {!isPreview && <aside className="sm-extraction-sidebar">
          <div className="sm-extraction-sidebar-inner">

            {/* 样本定义 */}
            <div className="sm-ext-section-title">样本定义</div>

            {/* 井状态 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">井状态</div>
              <div className="sm-ext-checkgroup">
                <label className="sm-ext-check">
                  <input type="checkbox" checked={wellStatusComplete} onChange={e => setWellStatusComplete(e.target.checked)} />完钻
                </label>
                <label className="sm-ext-check">
                  <input type="checkbox" checked={wellStatusFrac} onChange={e => setWellStatusFrac(e.target.checked)} />压裂
                </label>
                <label className="sm-ext-check">
                  <input type="checkbox" checked={wellStatusProd} onChange={e => setWellStatusProd(e.target.checked)} />投产
                </label>
              </div>
            </div>

            {/* 井型 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">井型</div>
              <div className="sm-ext-checkgroup">
                <label className="sm-ext-check">
                  <input type="checkbox" checked={wellTypeStraight} onChange={e => setWellTypeStraight(e.target.checked)} />直井
                </label>
                <label className="sm-ext-check">
                  <input type="checkbox" checked={wellTypeDirected} onChange={e => setWellTypeDirected(e.target.checked)} />定向井
                </label>
                <label className="sm-ext-check">
                  <input type="checkbox" checked={wellTypeHoriz} onChange={e => setWellTypeHoriz(e.target.checked)} />水平井
                </label>
              </div>
            </div>

            {/* 采样间隔 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">采样间隔</div>
              <div className="sm-ext-radiogroup">
                <label className="sm-ext-radio">
                  <input type="radio" name="interval" value="射孔段" checked={intervalMode === '射孔段'} onChange={() => setIntervalMode('射孔段')} />射孔段
                </label>
                <label className="sm-ext-radio">
                  <input type="radio" name="interval" value="压裂段" checked={intervalMode === '压裂段'} onChange={() => setIntervalMode('压裂段')} />压裂段
                </label>
              </div>
            </div>

            {/* 完整性阈值 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">完整性阈值</div>
              <div className="sm-ext-threshold">
                <input
                  className="sm-ext-threshold-input"
                  type="number" min={0} max={100}
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                />
                <span className="sm-unit">%</span>
              </div>
            </div>

            {/* 查询按钮（预览模式隐藏）*/}
            {!isPreview && (
              <button className="sm-btn sm-btn--primary sm-ext-query-btn" onClick={() => setQueried(true)}>
                查询
              </button>
            )}

            {/* 分隔线 */}
            <div className="sm-ext-divider" />

            {/* 计算参数 */}
            <div className="sm-ext-section-title">计算参数</div>

            {/* 时间周期 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">时间周期</div>
              <div className="sm-ext-checkgroup sm-ext-checkgroup--wrap">
                <label className="sm-ext-check"><input type="checkbox" checked={timePeriod1M}  onChange={e => setTimePeriod1M(e.target.checked)} />1个月</label>
                <label className="sm-ext-check"><input type="checkbox" checked={timePeriod3M}  onChange={e => setTimePeriod3M(e.target.checked)} />3个月</label>
                <label className="sm-ext-check"><input type="checkbox" checked={timePeriod6M}  onChange={e => setTimePeriod6M(e.target.checked)} />6个月</label>
                <label className="sm-ext-check"><input type="checkbox" checked={timePeriod12M} onChange={e => setTimePeriod12M(e.target.checked)} />12个月</label>
                <label className="sm-ext-check"><input type="checkbox" checked={timePeriodAll} onChange={e => setTimePeriodAll(e.target.checked)} />全部</label>
              </div>
            </div>

            {/* 统计时间点 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">统计时间点</div>
              <select className="sm-ext-select" value={statsTimePoint} onChange={e => setStatsTimePoint(e.target.value)}>
                <option value="">请选择</option>
                <option value="month-end">月末</option>
                <option value="month-start">月初</option>
                <option value="month-mid">月中</option>
              </select>
            </div>

            {/* 产量赋分 */}
            <div className="sm-ext-field">
              <label className="sm-ext-check sm-ext-check--block">
                <input type="checkbox" checked={yieldSplit} onChange={e => setYieldSplit(e.target.checked)} />产量赋分
              </label>
            </div>

            {/* 地层系数 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">地层系数</div>
              <div className="sm-ext-range">
                <select className="sm-ext-select sm-ext-select--mini" value={geoCoeffMin} onChange={e => setGeoCoeffMin(e.target.value)}>
                  <option value="">请...</option>
                  <option value="0">0</option>
                  <option value="0.1">0.1</option>
                </select>
                <span className="sm-ext-range-sep">-</span>
                <select className="sm-ext-select sm-ext-select--mini" value={geoCoeffMax} onChange={e => setGeoCoeffMax(e.target.value)}>
                  <option value="">请...</option>
                  <option value="1">1</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>

            {/* 计算方式 */}
            <div className="sm-ext-field">
              <div className="sm-ext-label">计算方式</div>
              <div className="sm-ext-radiogroup">
                <label className="sm-ext-radio">
                  <input type="radio" name="calcMode" value="井段" checked={calcMode === '井段'} onChange={() => setCalcMode('井段')} />井段
                </label>
                <label className="sm-ext-radio">
                  <input type="radio" name="calcMode" value="井" checked={calcMode === '井'} onChange={() => setCalcMode('井')} />井
                </label>
              </div>
            </div>

            {/* 计算按钮（预览模式隐藏）*/}
            {!isPreview && (
              <button
                className={`sm-btn sm-btn--primary sm-ext-query-btn${calcRunning ? ' sm-btn--loading' : ''}`}
                onClick={handleCalc}
                disabled={calcRunning}
              >
                {calcRunning ? <><md-icon>hourglass_top</md-icon>计算中…</> : '计算'}
              </button>
            )}
          </div>
        </aside>}

        {/* 右侧宽表区 */}
        <div className="sm-extraction-content">
          {queried ? (
            <>
              <div className="sm-ext-table-meta">{totalRows}</div>
              <div className="sm-ext-table-wrap">
                <table className="sm-ext-table">
                  <thead>
                    {/* 第一行：分组 */}
                    <tr>
                      <th className="sm-ext-th sm-ext-th--idx" rowSpan={3}>#</th>
                      {WIDE_TABLE_COLS.map(group => (
                        <th
                          key={group.group}
                          className="sm-ext-th sm-ext-th--group"
                          colSpan={group.cols.length}
                        >
                          {group.group}
                        </th>
                      ))}
                    </tr>
                    {/* 第二行：子分组（仅测井解释结论下面有子组） */}
                    <tr>
                      {WIDE_TABLE_COLS.map(group => {
                        if (group.group === '地质分层') {
                          return <th key="geo-sub" className="sm-ext-th sm-ext-th--subgroup" />
                        }
                        if (group.group === '测井解释结论') {
                          return (
                            <>
                              <th key="log-sub1" className="sm-ext-th sm-ext-th--subgroup" />
                              <th key="log-sub2" className="sm-ext-th sm-ext-th--subgroup" colSpan={2}>测井解释结论</th>
                              <th key="log-sub3" className="sm-ext-th sm-ext-th--subgroup" />
                            </>
                          )
                        }
                        if (group.group === '成像测井') {
                          return <th key="img-sub" className="sm-ext-th sm-ext-th--subgroup" colSpan={group.cols.length} />
                        }
                        // 基础参数
                        return group.cols.map(c => (
                          <th key={c.key} className="sm-ext-th sm-ext-th--subgroup" />
                        ))
                      })}
                    </tr>
                    {/* 第三行：列名 */}
                    <tr>
                      {WIDE_TABLE_COLS.flatMap(group =>
                        group.cols.map(col => (
                          <th key={col.key} className="sm-ext-th sm-ext-th--col">
                            {col.label.split('\n').map((line, i) => (
                              <div key={i} className={i === 0 ? 'sm-ext-col-name' : i === 1 ? 'sm-ext-col-type' : 'sm-ext-col-agg'}>{line}</div>
                            ))}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row, idx) => (
                      <tr key={idx} className="sm-ext-tr">
                        <td className="sm-ext-td sm-ext-td--idx">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        {WIDE_TABLE_COLS.flatMap(group =>
                          group.cols.map(col => (
                            <td key={col.key} className={`sm-ext-td${(row as Record<string, string>)[col.key] === 'Y' ? ' sm-ext-td--y' : ''}`}>
                              {(row as Record<string, string>)[col.key] || ''}
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="sm-ext-pagination">
                <span className="sm-ext-page-total">共 {totalRows} 条</span>
                <div className="sm-ext-page-btns">
                  <button className="sm-ext-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <md-icon>chevron_left</md-icon>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`sm-ext-page-btn${p === page ? ' sm-ext-page-btn--active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button className="sm-ext-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <md-icon>chevron_right</md-icon>
                  </button>
                </div>
                <select className="sm-ext-page-size">
                  <option>20条/页</option>
                  <option>50条/页</option>
                </select>
                <span className="sm-ext-page-goto">前往</span>
                <input className="sm-ext-page-goto-input" type="number" min={1} max={totalPages} defaultValue={page} />
                <span className="sm-ext-page-goto">页</span>
              </div>
            </>
          ) : (
            <div className="sm-empty">
              <md-icon>filter_list</md-icon>
              <div>请在左侧设置筛选条件后点击"查询"</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

interface SampleManagementProps {
  onBack: () => void
}

export function SampleManagement({ onBack }: SampleManagementProps) {
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('全部')
  const [datasetFilter, setDatasetFilter] = useState('全部')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [extraction, setExtraction]       = useState<{ name: string; datasetId: string; mode: 'extract' | 'preview' } | null>(null)
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set())

  const STATUS_OPTIONS = ['全部', '创建中', '已完成', '已归档', '创建失败']

  const filtered = MOCK_SAMPLES.filter(s => {
    if (search && !s.name.includes(search)) return false
    if (statusFilter !== '全部' && s.status !== statusFilter) return false
    if (datasetFilter !== '全部' && s.datasetId !== datasetFilter) return false
    return true
  })

  const allSelected   = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id))
  const someSelected  = filtered.some(s => selectedIds.has(s.id))
  const selectedCount = filtered.filter(s => selectedIds.has(s.id)).length

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(s => n.delete(s.id)); return n })
    } else {
      setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(s => n.add(s.id)); return n })
    }
  }
  const toggleOne = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // 进入样本抽取页
  if (extraction) {
    return (
      <SampleExtractionPage
        sampleName={extraction.name}
        datasetId={extraction.datasetId}
        mode={extraction.mode}
        onClose={() => setExtraction(null)}
        onSave={() => setExtraction(null)}
      />
    )
  }

  return (
    <div className="sm-page">
      {/* ── 页头 ── */}
      <div className="sm-page-header">
        <div className="sm-page-header-left">
          <button className="sm-back-btn" onClick={onBack}>
            <md-icon>arrow_back</md-icon>返回总览
          </button>
          <div className="sm-page-header-sep" />
          <md-icon class="sm-page-icon">biotech</md-icon>
          <div>
            <div className="sm-page-title">样本管理</div>
            <div className="sm-page-subtitle">管理样本抽取与版本记录</div>
          </div>
        </div>
        <button className="sm-btn sm-btn--primary" onClick={() => setShowNewDialog(true)}>
          <md-icon>add</md-icon>新建样本
        </button>
      </div>

      {/* ── 筛选工具栏 ── */}
      <div className="sm-toolbar">
        <div className="sm-toolbar-left">
          <div className="sm-search-wrap">
            <md-icon class="sm-search-icon">search</md-icon>
            <input
              className="sm-search-input"
              placeholder="搜索样本名称…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="sm-search-clear" onClick={() => setSearch('')} aria-label="清空">
                <md-icon>close</md-icon>
              </button>
            )}
          </div>

          {/* 数据集筛选下拉 */}
          <div className="sm-dataset-filter-wrap">
            <md-icon class="sm-dataset-filter-icon">dataset</md-icon>
            <select
              className="sm-dataset-filter-select"
              value={datasetFilter}
              onChange={e => setDatasetFilter(e.target.value)}
            >
              <option value="全部">全部数据集</option>
              {MOCK_DATASETS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="sm-status-filter">
            {STATUS_OPTIONS.map(s => (
              <button key={s}
                className={`sm-filter-chip${statusFilter === s ? ' sm-filter-chip--active' : ''}`}
                onClick={() => setStatusFilter(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="sm-toolbar-right">
          <span className="sm-result-count">共 {filtered.length} 个样本</span>
          {selectedCount > 0 ? (
            <div className="sm-batch-bar">
              <span className="sm-batch-count">已选 {selectedCount} 项</span>
              <button className="sm-btn sm-btn--ghost sm-btn--sm" onClick={() => alert('批量下载')} aria-label="批量下载">
                <md-icon>download</md-icon>下载
              </button>
              <button className="sm-btn sm-btn--ghost sm-btn--sm" onClick={() => alert('批量归档')} aria-label="批量归档">
                <md-icon>archive</md-icon>归档
              </button>
              <button className="sm-btn sm-btn--danger sm-btn--sm" onClick={() => alert('批量删除')} aria-label="批量删除">
                <md-icon>delete</md-icon>删除
              </button>
              <button className="sm-icon-btn" onClick={clearSelection} aria-label="取消选择" title="取消选择">
                <md-icon>close</md-icon>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── 列表主体 ── */}
      <div className="sm-list-body">
        {filtered.length === 0 ? (
          <div className="sm-empty">
            <md-icon>inbox</md-icon>
            <div>未找到匹配的样本</div>
            <button className="sm-btn sm-btn--ghost sm-btn--sm"
              onClick={() => { setSearch(''); setStatusFilter('全部'); setDatasetFilter('全部') }}>
              清空筛选
            </button>
          </div>
        ) : (
          <table className="sm-table">
            <thead>
              <tr>
                <th className="sm-th sm-th--check">
                  <input
                    type="checkbox"
                    className="sm-checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={toggleAll}
                    aria-label="全选"
                  />
                </th>
                <th className="sm-th">样本名称</th>
                <th className="sm-th">所属数据集</th>
                <th className="sm-th">状态</th>
                <th className="sm-th">井数</th>
                <th className="sm-th">字段数</th>
                <th className="sm-th">记录数</th>
                <th className="sm-th">创建时间</th>
                <th className="sm-th">创建人</th>
                <th className="sm-th sm-th--action">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sample => (
                <tr key={sample.id} className={`sm-tr${selectedIds.has(sample.id) ? ' sm-tr--selected' : ''}`}>
                  <td className="sm-td sm-td--check" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="sm-checkbox"
                      checked={selectedIds.has(sample.id)}
                      onChange={() => toggleOne(sample.id)}
                      aria-label={`选择 ${sample.name}`}
                    />
                  </td>
                  <td className="sm-td sm-td--name">
                    <md-icon class="sm-dataset-icon">science</md-icon>
                    <span>{sample.name}</span>
                  </td>
                  <td className="sm-td sm-td--dataset">
                    <span className="sm-dataset-tag">{sample.datasetName}</span>
                  </td>
                  <td className="sm-td">
                    <span className={statusClass(sample.status)}>{sample.status}</span>
                  </td>
                  <td className="sm-td sm-td--num">{sample.wells || '—'}</td>
                  <td className="sm-td sm-td--num">{sample.fields || '—'}</td>
                  <td className="sm-td sm-td--num">{sample.records ? sample.records.toLocaleString() : '—'}</td>
                  <td className="sm-td sm-td--time">{sample.createdAt}</td>
                  <td className="sm-td">{sample.creator}</td>
                  <td className="sm-td sm-td--action" onClick={e => e.stopPropagation()}>
                    <div className="sm-row-actions">
                      <button
                        className="sm-action-btn sm-action-btn--primary"
                        title="预览"
                        onClick={() => setExtraction({ name: sample.name, datasetId: sample.datasetId, mode: 'preview' })}
                      >
                        <md-icon>visibility</md-icon>
                      </button>
                      <button className="sm-action-btn" title="导出"><md-icon>download</md-icon></button>
                      <button className="sm-action-btn" title="编辑"><md-icon>edit</md-icon></button>
                      <button className="sm-action-btn sm-action-btn--danger" title="删除"><md-icon>delete</md-icon></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 新建样本弹窗 */}
      {showNewDialog && (
        <NewSampleDialog
          onClose={() => setShowNewDialog(false)}
          onNext={(name, datasetId) => {
            setShowNewDialog(false)
            setExtraction({ name, datasetId, mode: 'extract' })
          }}
        />
      )}
    </div>
  )
}
