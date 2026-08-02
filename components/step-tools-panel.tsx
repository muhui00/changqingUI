'use client'

import { useState, useEffect, useRef } from 'react'
import type { QCCardType } from './qc-overview'

type StepStatus = '未执行' | '执行中' | '已完成' | '存在异常' | '待复核' | '执行失败'
type ToolStatus = '可用' | '运行中' | '已完成' | '需配置' | '执行失败'

interface Tool {
  name: string
  status: ToolStatus
}

interface Step {
  type: QCCardType
  label: string
  icon: string
  status: StepStatus
  progress: number
  score?: number
  anomalyCount: number
  reviewCount: number
  lastRun: string
  tools: Tool[]
}

const STEPS: Step[] = [
  {
    type: 'consistency',
    label: '一致性校验',
    icon: 'rule',
    status: '存在异常',
    progress: 100,
    score: 88,
    anomalyCount: 12,
    reviewCount: 8,
    lastRun: '07-20 14:23',
    tools: [
      { name: '量纲与单位识别', status: '已完成' },
      { name: '量级异常识别', status: '已完成' },
      { name: '字段口径对比', status: '需配置' },
      { name: '单位与量级转换计算器', status: '可用' },
    ],
  },
  {
    type: 'completeness',
    label: '完整性校验',
    icon: 'checklist',
    status: '待复核',
    progress: 100,
    score: 91,
    anomalyCount: 7,
    reviewCount: 5,
    lastRun: '07-20 14:35',
    tools: [
      { name: '缺失扫描', status: '已完成' },
      { name: 'KNN', status: '已完成' },
      { name: '样条插值', status: '已完成' },
      { name: 'MICE 链式方程', status: '可用' },
      { name: 'Random Forest', status: '可用' },
      { name: 'OCR/NLP', status: '需配置' },
      { name: '大模型抽取', status: '需配置' },
    ],
  },
  {
    type: 'distribution',
    label: '分布范围校验',
    icon: 'bar_chart',
    status: '执行中',
    progress: 72,
    anomalyCount: 18,
    reviewCount: 0,
    lastRun: '07-22 09:11',
    tools: [
      { name: '3σ 准则', status: '已完成' },
      { name: 'IQR', status: '已完成' },
      { name: '箱线图', status: '已完成' },
      { name: '孤立森林', status: '运行中' },
      { name: '单类支持向量机', status: '可用' },
      { name: '物理上下限', status: '需配置' },
      { name: '公式计算', status: '可用' },
    ],
  },
  {
    type: 'correlation',
    label: '相关性校验',
    icon: 'scatter_plot',
    status: '未执行',
    progress: 0,
    anomalyCount: 0,
    reviewCount: 0,
    lastRun: '—',
    tools: [
      { name: 'Pearson', status: '可用' },
      { name: 'Spearman', status: '可用' },
      { name: '线性回归', status: '可用' },
      { name: '残差分析', status: '可用' },
      { name: '相关矩阵', status: '可用' },
    ],
  },
]

// 未执行初始态：全部步骤待执行
const INITIAL_STEPS: Step[] = STEPS.map((s) => ({
  ...s,
  status: '未执行',
  progress: 0,
  score: undefined,
  anomalyCount: 0,
  reviewCount: 0,
  lastRun: '—',
}))

// 质检完成后的最终结果（四步全部执行完毕）
function buildCompletedSteps(runTime: string): Step[] {
  return STEPS.map((s) => {
    if (s.type === 'distribution') {
      return { ...s, status: '存在异常', progress: 100, score: 83, anomalyCount: 18, reviewCount: 9, lastRun: runTime }
    }
    if (s.type === 'correlation') {
      return { ...s, status: '已完成', progress: 100, score: 79, anomalyCount: 6, reviewCount: 4, lastRun: runTime }
    }
    return { ...s, progress: 100, lastRun: runTime }
  })
}

const STATUS_STYLE: Record<StepStatus, { color: string; bg: string; icon: string }> = {
  未执行: { color: '#546e7a', bg: '#eceff1', icon: 'radio_button_unchecked' },
  执行中: { color: '#1565c0', bg: '#e3f2fd', icon: 'sync' },
  已完成: { color: '#2e7d32', bg: '#e8f5e9', icon: 'check_circle' },
  存在异常: { color: '#c62828', bg: '#ffebee', icon: 'error' },
  待复核: { color: '#e65100', bg: '#fff3e0', icon: 'pending' },
  执行失败: { color: '#b71c1c', bg: '#ffcdd2', icon: 'cancel' },
}

const TOOL_STATUS_STYLE: Record<ToolStatus, { color: string; dot: string }> = {
  可用: { color: 'var(--md-sys-color-on-surface-variant)', dot: '#9e9e9e' },
  运行中: { color: '#1565c0', dot: '#1565c0' },
  已完成: { color: 'var(--app-color-success)', dot: '#2e7d32' },
  需配置: { color: '#e65100', dot: '#e65100' },
  执行失败: { color: 'var(--md-sys-color-error)', dot: '#c62828' },
}

interface StepToolsPanelProps {
  datasetId?: string
  qced?: boolean
  onQCComplete?: () => void
  activeStep?: QCCardType | null
  onStepClick?: (type: QCCardType) => void
  onCreateReport?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function StepToolsPanel({ datasetId, qced = false, onQCComplete, activeStep, onStepClick, onCreateReport, collapsed, onToggleCollapse }: StepToolsPanelProps) {
  const [expandedStep, setExpandedStep] = useState<QCCardType | null>('consistency')
  const [steps, setSteps] = useState<Step[]>(qced ? buildCompletedSteps('—') : INITIAL_STEPS)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningRef = useRef(false)

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    runningRef.current = false
  }

  // 卸载时清理定时器
  useEffect(() => () => stopTimer(), [])

  // 切换数据集：停止进行中的质检，按该数据集是否已质检重置步骤
  useEffect(() => {
    stopTimer()
    setRunning(false)
    setSteps(qced ? buildCompletedSteps('—') : INITIAL_STEPS)
    // 仅在数据集变化时重置（qced 变为 true 由本组件质检完成触发，不应回滚 lastRun）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId])

  const handleStepClick = (type: QCCardType) => {
    setExpandedStep(expandedStep === type ? null : type)
    onStepClick?.(type)
  }

  // 开始 / 重新质检流程 —— 一致性→完整性→分布范围→相关性 依次顺序执行
  const handleStartQC = () => {
    if (runningRef.current) return
    runningRef.current = true
    stopTimer()
    runningRef.current = true // stopTimer 会置 false，此处恢复
    setRunning(true)

    const now = new Date()
    const runTime = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const finals = buildCompletedSteps(runTime)
    const total = STEPS.length

    // 本地工作副本作为唯一数据源，避免函数式更新器竞态
    const working: Step[] = INITIAL_STEPS.map((s) => ({ ...s }))
    working[0] = { ...working[0], status: '执行中', progress: 0, lastRun: '执行中' }
    setSteps(working.map((s) => ({ ...s })))
    setExpandedStep(STEPS[0].type)

    let idx = 0
    let pct = 0

    timerRef.current = setInterval(() => {
      pct += 10
      if (pct < 100) {
        // 当前步骤进度推进
        working[idx] = { ...working[idx], progress: pct }
        setSteps(working.map((s) => ({ ...s })))
        return
      }

      // 当前步骤完成 → 落定最终结果
      working[idx] = { ...finals[idx] }
      idx += 1
      pct = 0

      if (idx >= total) {
        // 四步全部完成
        setSteps(working.map((s) => ({ ...s })))
        stopTimer()
        setRunning(false)
        onQCComplete?.()
        return
      }

      // 进入下一步骤
      working[idx] = { ...working[idx], status: '执行中', progress: 0, lastRun: '执行中' }
      setSteps(working.map((s) => ({ ...s })))
      setExpandedStep(STEPS[idx].type)
    }, 120)
  }

  const hasRunning = running
  const allDone = !running && steps.every((s) => s.status === '已完成' || s.status === '存在异常' || s.status === '待复核')

  if (collapsed) {
    return (
      <aside className="panel-section step-tools-panel panel-section--collapsed" aria-label="质检步骤与工具（已收起）">
        <div className="panel-collapsed-rail">
          <md-icon-button aria-label="展开质检步骤" onClick={onToggleCollapse}>
            <md-icon>chevron_left</md-icon>
          </md-icon-button>
          <div className="panel-collapsed-label">
            <md-icon>rule</md-icon>
            <span className="panel-collapsed-text">质检步骤</span>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="panel-section step-tools-panel" aria-label="质检步骤与工具">
      <div className="panel-header">
        <span className="md-typescale-label-large panel-title">质检步骤</span>
        <md-icon-button aria-label="收起质检步骤" onClick={onToggleCollapse}>
          <md-icon>chevron_right</md-icon>
        </md-icon-button>
      </div>

      {/* 开始质检按钮区 */}
      <div className="step-panel-action">
        {hasRunning ? (
          <md-filled-button class="step-start-btn" disabled aria-label="质检执行中">
            <md-icon slot="icon">sync</md-icon>
            质检执行中...
          </md-filled-button>
        ) : allDone ? (
          <>
            <md-outlined-button class="step-start-btn" aria-label="重新执行质检" onClick={handleStartQC}>
              <md-icon slot="icon">replay</md-icon>
              重新质检
            </md-outlined-button>
            <md-filled-button class="step-start-btn step-report-btn" aria-label="创建质控报告" onClick={() => onCreateReport?.()}>
              <md-icon slot="icon">description</md-icon>
              创建报告
            </md-filled-button>
          </>
        ) : (
          <md-filled-button class="step-start-btn" aria-label="开始质检" onClick={handleStartQC}>
            <md-icon slot="icon">play_arrow</md-icon>
            开始质检
          </md-filled-button>
        )}
      </div>

      <div className="step-tools-body">
        {steps.map((step) => {
          const ss = STATUS_STYLE[step.status]
          const isActive = activeStep === step.type
          const isExpanded = expandedStep === step.type

          return (
            <div
              key={step.type}
              className={`step-card${isActive ? ' step-card--active' : ''}`}
            >
              {/* 步骤头部 */}
              <button
                className="step-card-header"
                aria-expanded={isExpanded}
                aria-label={`${step.label}，${step.status}，点击${isExpanded ? '收起' : '展开'}工具`}
                onClick={() => handleStepClick(step.type)}
              >
                <md-icon class="step-type-icon">{step.icon}</md-icon>
                <div className="step-card-info">
                  {/* 第一行：标题 + 分数 + 展开箭头 */}
                  <div className="step-title-row">
                    <span className="md-typescale-label-medium step-name">{step.label}</span>
                    <div className="step-title-right">
                      {step.score !== undefined ? (
                        <span
                          className="md-typescale-title-small step-score"
                          style={{
                            color:
                              step.score >= 90
                                ? 'var(--app-color-success)'
                                : step.score >= 75
                                ? 'var(--app-color-warning)'
                                : 'var(--md-sys-color-error)',
                          }}
                        >
                          {step.score}
                        </span>
                      ) : (
                        <span className="md-typescale-label-small step-no-score">—</span>
                      )}
                      <md-icon class="step-expand-icon">{isExpanded ? 'expand_less' : 'expand_more'}</md-icon>
                    </div>
                  </div>
                  {/* 第二行（左下）：状态 */}
                  <div className="step-meta-row">
                    <span
                      className="step-status-chip md-typescale-label-small"
                      style={{ color: ss.color, background: ss.bg }}
                    >
                      <md-icon class="step-status-icon">{ss.icon}</md-icon>
                      {step.status}
                    </span>
                  </div>
                </div>
              </button>

              {/* 进度条 */}
              {step.progress > 0 && step.progress < 100 && (
                <div className="step-progress-wrap" aria-label={`执行进度 ${step.progress}%`}>
                  <div className="step-progress-bar">
                    <div
                      className="step-progress-fill"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                  <span className="md-typescale-label-small step-progress-pct">{step.progress}%</span>
                </div>
              )}

              {/* 步骤详情 */}
              {isExpanded && (
                <div className="step-detail">
                  <div className="step-detail-row">
                    <span className="md-typescale-label-small step-detail-label">异常记录</span>
                    <span className="md-typescale-label-small step-detail-value" style={{ color: step.anomalyCount > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)' }}>
                      {step.anomalyCount} 条
                    </span>
                  </div>
                  <div className="step-detail-row">
                    <span className="md-typescale-label-small step-detail-label">待复核</span>
                    <span className="md-typescale-label-small step-detail-value" style={{ color: step.reviewCount > 0 ? 'var(--app-color-warning)' : 'var(--md-sys-color-on-surface-variant)' }}>
                      {step.reviewCount} 条
                    </span>
                  </div>
                  <div className="step-detail-row">
                    <span className="md-typescale-label-small step-detail-label">最近执行</span>
                    <span className="md-typescale-label-small step-detail-value">{step.lastRun}</span>
                  </div>

                  {/* 工具清单 */}
                  <div className="step-tools-list" aria-label={`${step.label}工具清单`}>
                    <div className="md-typescale-label-small step-tools-title">可用工具</div>
                    {step.tools.map((tool) => {
                      const ts = TOOL_STATUS_STYLE[tool.status]
                      return (
                        <button
                          key={tool.name}
                          className="tool-item"
                          aria-label={`${tool.name}，状态：${tool.status}`}
                        >
                          <span
                            className="tool-dot"
                            style={{ background: ts.dot }}
                            aria-hidden="true"
                          />
                          <span
                            className="md-typescale-label-small tool-name"
                            style={{ color: ts.color }}
                          >
                            {tool.name}
                          </span>
                          <span className="md-typescale-label-small tool-status">
                            {tool.status}
                          </span>
                        </button>
                      )
                    })}
                  </div>


                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
