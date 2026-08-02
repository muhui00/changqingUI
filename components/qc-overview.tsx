'use client'

import type { ReactNode } from 'react'
import { RadarChart } from './radar-chart'
import { MOCK_DATASETS, type Dataset } from './dataset-list'

export type QCCardType = 'consistency' | 'completeness' | 'distribution' | 'correlation'

interface QCOverviewProps {
  onCardClick: (type: QCCardType) => void
  hoveredCard?: QCCardType | null
  datasetId?: string
  datasetMeta?: Dataset
  qced?: boolean
}

type RadarDim = { label: string; score: number; anomalyCount: number; reviewedCount: number }
type StatItem = { icon: string; label: string; value: string; highlight?: boolean }
type CardData = { score: number; metrics: { label: string; value: string | number; color: string }[] }

interface DatasetContent {
  radar: RadarDim[]
  stats: StatItem[]
  cards: Record<QCCardType, CardData>
}

// 各数据集对应的质检内容（按数据集 ID 映射）
const DATASET_CONTENT: Record<string, DatasetContent> = {
  // 苏里格区块2024年综合数据集
  '1': {
    radar: [
      { label: '一致性', score: 88, anomalyCount: 12, reviewedCount: 8 },
      { label: '相关性', score: 79, anomalyCount: 23, reviewedCount: 15 },
      { label: '完整性', score: 91, anomalyCount: 7, reviewedCount: 7 },
      { label: '分布范围', score: 83, anomalyCount: 18, reviewedCount: 10 },
    ],
    stats: [
      { icon: 'oil_barrel', label: '覆盖井数', value: '156口' },
      { icon: 'view_column', label: '已选字段', value: '23个' },
      { icon: 'warning', label: '待复核异常', value: '47条', highlight: true },
      { icon: 'check_circle', label: '已处理异常', value: '92条' },
      { icon: 'percent', label: '修复完成率', value: '66.2%' },
    ],
    cards: {
      consistency: { score: 88, metrics: [
        { label: '单位异常', value: 5, color: 'error' },
        { label: '量纲异常', value: 3, color: 'error' },
        { label: '量级异常', value: 4, color: 'warning' },
      ] },
      completeness: { score: 91, metrics: [
        { label: '整体完整率', value: '91%', color: 'success' },
        { label: '必填缺失', value: 12, color: 'error' },
        { label: '连续缺失', value: 7, color: 'warning' },
      ] },
      distribution: { score: 83, metrics: [
        { label: '统计异常', value: 11, color: 'warning' },
        { label: '物理越界', value: 3, color: 'error' },
        { label: '公式异常', value: 4, color: 'warning' },
      ] },
      correlation: { score: 79, metrics: [
        { label: '字段组合数', value: 12, color: 'primary' },
        { label: '低相关组合', value: 4, color: 'warning' },
        { label: '高残差数', value: 6, color: 'error' },
      ] },
    },
  },
  // 长北区块压裂工程数据集
  '2': {
    radar: [
      { label: '一致性', score: 94, anomalyCount: 4, reviewedCount: 4 },
      { label: '相关性', score: 90, anomalyCount: 8, reviewedCount: 8 },
      { label: '完整性', score: 96, anomalyCount: 2, reviewedCount: 2 },
      { label: '分布范围', score: 89, anomalyCount: 6, reviewedCount: 6 },
    ],
    stats: [
      { icon: 'oil_barrel', label: '覆盖井数', value: '88口' },
      { icon: 'view_column', label: '已选字段', value: '31个' },
      { icon: 'warning', label: '待复核异常', value: '6条', highlight: true },
      { icon: 'check_circle', label: '已处理异常', value: '108条' },
      { icon: 'percent', label: '修复完成率', value: '94.7%' },
    ],
    cards: {
      consistency: { score: 94, metrics: [
        { label: '单位异常', value: 2, color: 'error' },
        { label: '量纲异常', value: 1, color: 'error' },
        { label: '量级异常', value: 1, color: 'warning' },
      ] },
      completeness: { score: 96, metrics: [
        { label: '整体完整率', value: '96%', color: 'success' },
        { label: '必填缺失', value: 3, color: 'error' },
        { label: '连续缺失', value: 2, color: 'warning' },
      ] },
      distribution: { score: 89, metrics: [
        { label: '统计异常', value: 5, color: 'warning' },
        { label: '物理越界', value: 1, color: 'error' },
        { label: '公式异常', value: 2, color: 'warning' },
      ] },
      correlation: { score: 90, metrics: [
        { label: '字段组合数', value: 18, color: 'primary' },
        { label: '低相关组合', value: 2, color: 'warning' },
        { label: '高残差数', value: 3, color: 'error' },
      ] },
    },
  },
  // 陇东区块地质参数数据集（质检中）
  '3': {
    radar: [
      { label: '一致性', score: 72, anomalyCount: 21, reviewedCount: 9 },
      { label: '相关性', score: 68, anomalyCount: 30, reviewedCount: 11 },
      { label: '完整性', score: 80, anomalyCount: 14, reviewedCount: 6 },
      { label: '分布范围', score: 74, anomalyCount: 25, reviewedCount: 8 },
    ],
    stats: [
      { icon: 'oil_barrel', label: '覆盖井数', value: '204口' },
      { icon: 'view_column', label: '已选字段', value: '19个' },
      { icon: 'warning', label: '待复核异常', value: '90条', highlight: true },
      { icon: 'check_circle', label: '已处理异常', value: '34条' },
      { icon: 'percent', label: '修复完成率', value: '27.4%' },
    ],
    cards: {
      consistency: { score: 72, metrics: [
        { label: '单位异常', value: 9, color: 'error' },
        { label: '量纲异常', value: 6, color: 'error' },
        { label: '量级异常', value: 6, color: 'warning' },
      ] },
      completeness: { score: 80, metrics: [
        { label: '整体完整率', value: '80%', color: 'success' },
        { label: '必填缺失', value: 21, color: 'error' },
        { label: '连续缺失', value: 13, color: 'warning' },
      ] },
      distribution: { score: 74, metrics: [
        { label: '统计异常', value: 17, color: 'warning' },
        { label: '物理越界', value: 6, color: 'error' },
        { label: '公式异常', value: 8, color: 'warning' },
      ] },
      correlation: { score: 68, metrics: [
        { label: '字段组合数', value: 9, color: 'primary' },
        { label: '低相关组合', value: 7, color: 'warning' },
        { label: '高残差数', value: 11, color: 'error' },
      ] },
    },
  },
  // 镇原区块生产监测数据集
  '4': {
    radar: [
      { label: '一致性', score: 96, anomalyCount: 3, reviewedCount: 3 },
      { label: '相关性', score: 93, anomalyCount: 5, reviewedCount: 5 },
      { label: '完整性', score: 97, anomalyCount: 1, reviewedCount: 1 },
      { label: '分布范围', score: 94, anomalyCount: 4, reviewedCount: 4 },
    ],
    stats: [
      { icon: 'oil_barrel', label: '覆盖井数', value: '132口' },
      { icon: 'view_column', label: '已选字段', value: '27个' },
      { icon: 'warning', label: '待复核异常', value: '4条', highlight: true },
      { icon: 'check_circle', label: '已处理异常', value: '141条' },
      { icon: 'percent', label: '修复完成率', value: '97.2%' },
    ],
    cards: {
      consistency: { score: 96, metrics: [
        { label: '单位异常', value: 1, color: 'error' },
        { label: '量纲异常', value: 1, color: 'error' },
        { label: '量级异常', value: 1, color: 'warning' },
      ] },
      completeness: { score: 97, metrics: [
        { label: '整体完整率', value: '97%', color: 'success' },
        { label: '必填缺失', value: 1, color: 'error' },
        { label: '连续缺失', value: 1, color: 'warning' },
      ] },
      distribution: { score: 94, metrics: [
        { label: '统计异常', value: 3, color: 'warning' },
        { label: '物理越界', value: 1, color: 'error' },
        { label: '公式异常', value: 1, color: 'warning' },
      ] },
      correlation: { score: 93, metrics: [
        { label: '字段组合数', value: 22, color: 'primary' },
        { label: '低相关组合', value: 1, color: 'warning' },
        { label: '高残差数', value: 2, color: 'error' },
      ] },
    },
  },
}

// 一致性柱图数据
function ConsistencyBarChart() {
  const data = [
    { field: '孔隙度', score: 95, anomaly: false },
    { field: '渗透率', score: 62, anomaly: true },
    { field: '加砂量', score: 88, anomaly: false },
    { field: '日产气量', score: 45, anomaly: true },
    { field: '气油比', score: 91, anomaly: false },
    { field: '油层厚度', score: 77, anomaly: false },
  ]
  const barH = 80
  const barW = 28
  const gap = 8
  const totalW = data.length * (barW + gap) - gap
  const svgH = barH + 32

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${svgH}`} aria-label="代表字段一致性得分柱图">
      {data.map((d, i) => {
        const x = i * (barW + gap)
        const h = (d.score / 100) * barH
        const y = barH - h
        const color = d.anomaly ? '#d32f2f' : '#1565c0'
        return (
          <g key={d.field}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={color} fillOpacity="0.85">
              <title>{`${d.field}: ${d.score}分${d.anomaly ? ' (异常)' : ''}`}</title>
            </rect>
            {d.anomaly && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="9" fill="#d32f2f" fontWeight="700">
                !
              </text>
            )}
            <text x={x + barW / 2} y={svgH - 2} textAnchor="middle" fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
              {d.field.length > 3 ? d.field.slice(0, 3) : d.field}
            </text>
          </g>
        )
      })}
      {/* 75分参考线 */}
      <line x1={0} y1={barH * 0.25} x2={totalW} y2={barH * 0.25} stroke="#e0e0e0" strokeDasharray="3,2" strokeWidth="0.8" />
    </svg>
  )
}

// 完整性条图
function CompletenessBarChart() {
  const data = [
    { field: '气油比', before: 68, after: 94, missing: 32 },
    { field: '油层厚度', before: 82, after: 96, missing: 18 },
    { field: '加砂量', before: 91, after: 99, missing: 9 },
    { field: '日产气量', before: 55, after: 88, missing: 45 },
    { field: '渗透率', before: 74, after: 91, missing: 26 },
  ]
  const rowH = 14
  const barMaxW = 110
  const svgH = data.length * (rowH + 5) + 10

  return (
    <svg width="100%" viewBox={`0 0 160 ${svgH}`} aria-label="重点字段完整率对比">
      {data.map((d, i) => {
        const y = i * (rowH + 5) + 4
        return (
          <g key={d.field}>
            <text x={0} y={y + 10} fontSize="8.5" fill="var(--md-sys-color-on-surface-variant)">{d.field}</text>
            {/* before bar */}
            <rect x={38} y={y + 2} width={(d.before / 100) * barMaxW} height={5} rx="2" fill="#90caf9" />
            {/* after bar */}
            <rect x={38} y={y + 8} width={(d.after / 100) * barMaxW} height={5} rx="2" fill="#1565c0" />
            <text x={38 + (d.after / 100) * barMaxW + 2} y={y + 12} fontSize="7.5" fill="#1565c0" fontWeight="600">
              {d.after}%
            </text>
          </g>
        )
      })}
      <text x={38} y={svgH - 1} fontSize="7" fill="#90caf9">■ 处理前</text>
      <text x={70} y={svgH - 1} fontSize="7" fill="#1565c0">■ 处理后</text>
    </svg>
  )
}

// 分布箱线图
function BoxPlotChart() {
  // 使用更宽的 viewBox，让三个标签有足够空间分散
  const w = 240
  const h = 105
  // 左右 padding 留足，确保 Q1/Q3 标签不溢出
  const padL = 8
  const padR = 8
  const plotW = w - padL - padR
  const chartTop = 16

  const min = 3.2, q1 = 6.8, median = 9.4, q3 = 13.1, max = 18.5
  const lowerFence = 2.0, upperFence = 17.2
  const outliers = [1.1, 20.3, 22.1]
  // 数据域：稍微扩展两端，让标签不贴边
  const domainMin = 0.0
  const domainMax = 21.5
  const domainRange = domainMax - domainMin

  const toX = (v: number) => padL + ((v - domainMin) / domainRange) * plotW
  const midY = chartTop + 28   // 箱体中线

  const labelY = h - 5   // 三个标签统一在同一行

  // 计算三个标签 x 坐标后，判断是否会重叠并做微调
  const xQ1 = toX(q1)
  const xMed = toX(median)
  const xQ3 = toX(q3)
  // 每个标签约占 28px（"Q1=6.8" 7 chars × ~4px）
  const half = 14
  // 钳制：确保 Q1 标签不被 median 压过
  const adjQ1  = Math.min(xQ1,  xMed - half * 2 - 2)
  const adjQ3  = Math.max(xQ3,  xMed + half * 2 + 2)

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} aria-label="当前字段箱线图">
      {/* 标题 */}
      <text x={w / 2} y={11} textAnchor="middle" fontSize="8" fill="var(--md-sys-color-on-surface)" fontWeight="600">孔隙度 (%)</text>

      {/* 物理边界虚线 */}
      <line x1={toX(lowerFence)} y1={midY - 20} x2={toX(lowerFence)} y2={midY + 20} stroke="#ef9a9a" strokeDasharray="3,2" strokeWidth="1" />
      <line x1={toX(upperFence)} y1={midY - 20} x2={toX(upperFence)} y2={midY + 20} stroke="#ef9a9a" strokeDasharray="3,2" strokeWidth="1" />
      <text x={toX(lowerFence)} y={midY - 22} textAnchor="middle" fontSize="6.5" fill="#c62828">下限</text>
      <text x={toX(upperFence)} y={midY - 22} textAnchor="middle" fontSize="6.5" fill="#c62828">上限</text>

      {/* Whiskers */}
      <line x1={toX(min)} y1={midY} x2={toX(q1)} y2={midY} stroke="#1565c0" strokeWidth="1.5" />
      <line x1={toX(q3)} y1={midY} x2={toX(max)} y2={midY} stroke="#1565c0" strokeWidth="1.5" />
      {/* Min / Max caps */}
      <line x1={toX(min)} y1={midY - 8} x2={toX(min)} y2={midY + 8} stroke="#1565c0" strokeWidth="1.5" />
      <line x1={toX(max)} y1={midY - 8} x2={toX(max)} y2={midY + 8} stroke="#1565c0" strokeWidth="1.5" />
      {/* IQR box */}
      <rect x={toX(q1)} y={midY - 12} width={toX(q3) - toX(q1)} height={24} rx="2" fill="#90caf9" fillOpacity="0.5" stroke="#1565c0" strokeWidth="1.5" />
      {/* Median line */}
      <line x1={xMed} y1={midY - 12} x2={xMed} y2={midY + 12} stroke="#1565c0" strokeWidth="2.5" />
      {/* Outliers */}
      {outliers.map((v, i) => (
        <circle key={i} cx={toX(v)} cy={midY} r={3} fill="none" stroke="#d32f2f" strokeWidth="1.5">
          <title>{`离群值: ${v}`}</title>
        </circle>
      ))}

      {/* X axis baseline */}
      <line x1={padL} y1={midY + 14} x2={w - padR} y2={midY + 14} stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.8" />

      {/* 刻度线 */}
      <line x1={toX(q1)}    y1={midY + 14} x2={toX(q1)}    y2={midY + 17} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
      <line x1={xMed}       y1={midY + 14} x2={xMed}       y2={midY + 17} stroke="#1565c0" strokeWidth="1" />
      <line x1={toX(q3)}    y1={midY + 14} x2={toX(q3)}    y2={midY + 17} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />

      {/* X 轴标签：同一行，通过位置微调消除重叠 */}
      <text x={adjQ1} y={labelY} textAnchor="middle" fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Q1={q1}</text>
      <text x={xMed}  y={labelY} textAnchor="middle" fontSize="7.5" fill="#1565c0" fontWeight="600">中位={median}</text>
      <text x={adjQ3} y={labelY} textAnchor="middle" fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Q3={q3}</text>
    </svg>
  )
}

// 相关矩阵缩略图 ��� CSS Grid，充满容器，无拉伸
function CorrelationMatrix() {
  const fields = ['加砂量', '砂比', '携砂液', '日产气', '气油比']
  const matrix = [
    [1.00, 0.82, 0.91, 0.67, 0.44],
    [0.82, 1.00, 0.76, 0.71, 0.39],
    [0.91, 0.76, 1.00, 0.58, 0.31],
    [0.67, 0.71, 0.58, 1.00, 0.85],
    [0.44, 0.39, 0.31, 0.85, 1.00],
  ]
  const n = fields.length

  const getColor = (v: number) => {
    if (v >= 0.8) return '#1565c0'
    if (v >= 0.6) return '#42a5f5'
    if (v >= 0.4) return '#90caf9'
    if (v >= 0.2) return '#e3f2fd'
    return '#f5f5f5'
  }
  const getTextColor = (v: number) => v >= 0.6 ? '#fff' : '#444'

  // 列数 = 1 行标签列 + n 数据列；行数 = 1 列标题行 + n 数据行
  return (
    <div className="corr-matrix" role="img" aria-label="关键字段相��矩阵"
      style={{ gridTemplateColumns: `minmax(0,1.2fr) repeat(${n}, minmax(0,1fr))` }}
    >
      {/* 左上角空格 */}
      <div className="corr-cell corr-cell--empty" />
      {/* 顶部列标签 */}
      {fields.map((f, j) => (
        <div key={`ch-${j}`} className="corr-cell corr-cell--header">{f.slice(0, 2)}</div>
      ))}
      {/* 数据行 */}
      {matrix.map((row, i) => (
        <>
          {/* 行标签 */}
          <div key={`rh-${i}`} className="corr-cell corr-cell--row-header">{fields[i].slice(0, 2)}</div>
          {/* 数据格 */}
          {row.map((v, j) => (
            <div
              key={`${i}-${j}`}
              className="corr-cell corr-cell--data"
              style={{ background: getColor(v), color: getTextColor(v) }}
              title={`${fields[i]} × ${fields[j]}: r=${v.toFixed(2)}`}
            >
              {i === j ? '' : v.toFixed(2)}
            </div>
          ))}
        </>
      ))}
    </div>
  )
}

// 卡片静态定义（图标 / 标题 / 代表图件），分数与指标由数据集内容注入
const CARD_DEFS: { type: QCCardType; title: string; icon: string; chart: ReactNode }[] = [
  { type: 'consistency',  title: '一致性校验',   icon: 'rule',         chart: <ConsistencyBarChart /> },
  { type: 'completeness', title: '完整性校验',   icon: 'checklist',    chart: <CompletenessBarChart /> },
  { type: 'distribution', title: '分布范围校验', icon: 'bar_chart',    chart: <BoxPlotChart /> },
  { type: 'correlation',  title: '相关性校验',   icon: 'scatter_plot', chart: <CorrelationMatrix /> },
]

const METRIC_COLORS: Record<string, string> = {
  error: 'var(--md-sys-color-error)',
  warning: 'var(--app-color-warning)',
  success: 'var(--app-color-success)',
  primary: 'var(--md-sys-color-primary)',
}

// 为未预置内容的数据集（如新建数据集）生成确定性的质检内容
function generateDatasetContent(datasetId: string): DatasetContent {
  // 基于 ID 的稳定伪随机种子
  let seed = 0
  for (let i = 0; i < datasetId.length; i++) seed = (seed * 31 + datasetId.charCodeAt(i)) >>> 0
  const rand = (min: number, max: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return min + (seed % (max - min + 1))
  }

  const consistency = rand(78, 95)
  const completeness = rand(80, 97)
  const distribution = rand(76, 93)
  const correlation = rand(74, 92)

  const wells = rand(60, 220)
  const fields = rand(18, 32)
  const pending = rand(5, 60)
  const handled = rand(30, 140)
  const fixRate = ((handled / (handled + pending)) * 100).toFixed(1)

  return {
    radar: [
      { label: '一致性', score: consistency, anomalyCount: rand(4, 20), reviewedCount: rand(3, 12) },
      { label: '相关性', score: correlation, anomalyCount: rand(6, 25), reviewedCount: rand(4, 15) },
      { label: '完整性', score: completeness, anomalyCount: rand(2, 14), reviewedCount: rand(2, 8) },
      { label: '分布范围', score: distribution, anomalyCount: rand(5, 22), reviewedCount: rand(4, 10) },
    ],
    stats: [
      { icon: 'oil_barrel', label: '覆盖井数', value: `${wells}口` },
      { icon: 'view_column', label: '已选字段', value: `${fields}个` },
      { icon: 'warning', label: '待复核异常', value: `${pending}条`, highlight: true },
      { icon: 'check_circle', label: '已处理异常', value: `${handled}条` },
      { icon: 'percent', label: '修复完成率', value: `${fixRate}%` },
    ],
    cards: {
      consistency: { score: consistency, metrics: [
        { label: '单位异常', value: rand(1, 9), color: 'error' },
        { label: '量纲异常', value: rand(1, 6), color: 'error' },
        { label: '量级异常', value: rand(1, 6), color: 'warning' },
      ] },
      completeness: { score: completeness, metrics: [
        { label: '整体完整率', value: `${completeness}%`, color: 'success' },
        { label: '必填缺失', value: rand(1, 20), color: 'error' },
        { label: '连续缺失', value: rand(1, 13), color: 'warning' },
      ] },
      distribution: { score: distribution, metrics: [
        { label: '统计异常', value: rand(3, 17), color: 'warning' },
        { label: '物理越界', value: rand(1, 6), color: 'error' },
        { label: '公式异常', value: rand(1, 8), color: 'warning' },
      ] },
      correlation: { score: correlation, metrics: [
        { label: '字段组合数', value: rand(9, 24), color: 'primary' },
        { label: '低相关组合', value: rand(1, 7), color: 'warning' },
        { label: '高残差数', value: rand(2, 11), color: 'error' },
      ] },
    },
  }
}

export function QCOverview({ onCardClick, hoveredCard, datasetId = '1', datasetMeta, qced = true }: QCOverviewProps) {
  const getScoreColor = (s: number) => (s >= 90 ? 'var(--app-color-success)' : s >= 75 ? 'var(--app-color-warning)' : 'var(--md-sys-color-error)')

  // 当前数据集元信息（优先使用父级传入的实时元信息，兜底静态列表）
  const meta = datasetMeta ?? MOCK_DATASETS.find((d) => d.id === datasetId)

  // 未选择任何数据集 → 空状态
  if (!meta && !DATASET_CONTENT[datasetId]) {
    return (
      <div className="qc-overview">
        <section className="overview-header" aria-label="数据集概览">
          <div className="overview-meta">
            <div className="overview-meta-left">
              <h2 className="md-typescale-title-medium overview-dataset-name">未选择数据集</h2>
            </div>
          </div>
        </section>
        <div className="qc-empty-state" role="status">
          <md-icon class="qc-empty-icon">hourglass_empty</md-icon>
          <div className="md-typescale-title-small qc-empty-title">暂无质检数据</div>
          <div className="md-typescale-body-medium qc-empty-desc">
            请从左侧选择一个数据集以查看质量分析结果。
          </div>
        </div>
      </div>
    )
  }

  // 尚未完成质检（初始化中 / 新建数据集）→ 初始化空状态，仅展示头部
  if (!qced) {
    return (
      <div className="qc-overview">
        <section className="overview-header" aria-label="数据集概览">
          <div className="overview-meta">
            <div className="overview-meta-left">
              <h2 className="md-typescale-title-medium overview-dataset-name">
                {meta?.name ?? '未命名数据集'}
              </h2>
              <div className="overview-tags">
                {meta && <span className="overview-tag overview-tag--version">{meta.version}</span>}
                {meta && <span className="overview-tag overview-tag--status">{meta.status}</span>}
                {meta && <span className="overview-tag overview-tag--date">更新: {meta.updatedAt}</span>}
              </div>
            </div>
          </div>
        </section>
        <div className="qc-empty-state" role="status">
          <md-icon class="qc-empty-icon">science</md-icon>
          <div className="md-typescale-title-small qc-empty-title">数据集初始化中，尚未质检</div>
          <div className="md-typescale-body-medium qc-empty-desc">
            该数据集暂无质检数据。请点击右侧「开始质检」，系统将按一致性、完整性、分布范围、相关性四个步骤依次执行，完成后此处将展示质量分析结果。
          </div>
        </div>
      </div>
    )
  }

  // 预置数据集使用预置内容，其余（新建数据集）生成确定性内容
  const content = DATASET_CONTENT[datasetId] ?? generateDatasetContent(datasetId)

  const RADAR_DATA = content.radar
  const overallScore = Math.round(
    RADAR_DATA.reduce((sum, d) => sum + d.score, 0) / RADAR_DATA.length,
  )

  // 复核前得分：由未处理异常比例推导（复核后总体高于复核前，体现修复带来的提升）
  const RADAR_DIMS = RADAR_DATA.map((d) => {
    const unresolved = Math.max(0, d.anomalyCount - d.reviewedCount)
    const drop = Math.min(30, Math.round(d.anomalyCount * 0.8 + unresolved * 0.6))
    return { ...d, beforeScore: Math.max(35, d.score - drop) }
  })

  // 左侧关键指标：综合评分 + 数据集统计（分两行展示）
  const METRIC_ITEMS: StatItem[] = [
    { icon: 'grade', label: '综合评分', value: `${overallScore}分` },
    ...content.stats,
  ]

  return (
    <div className="qc-overview">
      {/* 数据集概览头部 */}
      <section className="overview-header" aria-label="数据集概览">
        <div className="overview-meta">
          <div className="overview-meta-left">
            <h2 className="md-typescale-title-medium overview-dataset-name">
              {meta?.name ?? '苏里格区块2024年综合数据集'}
            </h2>
            <div className="overview-tags">
              <span className="overview-tag overview-tag--version">{meta?.version ?? 'v3.2'}</span>
              <span className="overview-tag overview-tag--status">{meta?.status ?? '待复核'}</span>
              <span className="overview-tag overview-tag--date">更新: {meta?.updatedAt ?? '2024-07-20'}</span>
            </div>
          </div>
        </div>

        {/* 四维质量雷达：左侧关键指标 + 右侧雷达图（复核前后） */}
        <div className="overview-radar-section">
          {/* 左侧：关键指标（分两行） */}
          <div className="overview-radar-metrics">
            <div className="md-typescale-label-medium overview-section-label">数据集关键指标</div>
            <div className="overview-metric-grid">
              {METRIC_ITEMS.map((m) => (
                <div key={m.label} className="overview-metric-item" role="listitem">
                  <md-icon class={`overview-metric-icon${m.highlight ? ' overview-metric-icon--warn' : ''}`}>
                    {m.icon}
                  </md-icon>
                  <div className="overview-metric-text">
                    <div className="md-typescale-label-small overview-metric-label">{m.label}</div>
                    <div
                      className="md-typescale-title-small overview-metric-value"
                      style={m.highlight ? { color: 'var(--app-color-warning)' } : undefined}
                    >
                      {m.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 右侧：雷达图（复核前 vs 复核后） */}
          <div className="overview-radar-chart">
            <RadarChart dimensions={RADAR_DIMS} size={240} />
            <div className="overview-radar-legend">
              <span className="overview-radar-legend-item">
                <span className="overview-radar-swatch overview-radar-swatch--before" />
                复核前
              </span>
              <span className="overview-radar-legend-item">
                <span className="overview-radar-swatch overview-radar-swatch--after" />
                复核后
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 四类质检卡片 */}
      <section className="qc-cards-section" aria-label="四类质检结果">
        <div className="qc-cards-title md-typescale-label-large">四类质检概览</div>
        <div className="qc-cards-grid" role="list">
          {CARD_DEFS.map((def) => {
            const cardData = content.cards[def.type]
            const card = { ...def, score: cardData.score, metrics: cardData.metrics }
            const isHovered = hoveredCard === card.type
            return (
              <article
                key={card.type}
                className={`qc-card${isHovered ? ' qc-card--hovered' : ''}`}
                role="listitem"
                tabIndex={0}
                aria-label={`${card.title}，得分 ${card.score}，点击查看详情`}
                onClick={() => onCardClick(card.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onCardClick(card.type)
                  }
                }}
              >
                {/* 卡片头部 */}
                <div className="qc-card-header">
                  <div className="qc-card-title-row">
                    <md-icon class="qc-card-icon">{card.icon}</md-icon>
                    <span className="md-typescale-title-small qc-card-title">{card.title}</span>
                  </div>
                  <div
                    className="qc-card-score"
                    style={{ color: getScoreColor(card.score) }}
                    aria-label={`得分 ${card.score}`}
                  >
                    <span className="md-typescale-headline-small">{card.score}</span>
                    <span className="md-typescale-label-small">分</span>
                  </div>
                </div>

                {/* 代表图件 — 占主导 */}
                <div className="qc-card-chart" aria-hidden="true">
                  {card.chart}
                </div>

                {/* 关键指标摘要行 */}
                <div className="qc-card-metrics-inline" role="list">
                  {card.metrics.slice(0, 3).map((m) => (
                    <div key={m.label} className="qc-card-metric-inline" role="listitem">
                      <span
                        className="md-typescale-label-large qc-metric-value"
                        style={{ color: METRIC_COLORS[m.color] }}
                      >
                        {m.value}
                      </span>
                      <span className="md-typescale-label-small qc-metric-label">{m.label}</span>
                    </div>
                  ))}
                </div>

                {/* 查看详情 */}
                <div className="qc-card-footer">
                  <span className="md-typescale-label-medium qc-card-cta">
                    查看详情
                    <md-icon class="qc-cta-icon">arrow_forward</md-icon>
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
