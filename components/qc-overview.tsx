'use client'

import { RadarChart } from './radar-chart'

export type QCCardType = 'consistency' | 'completeness' | 'distribution' | 'correlation'

interface QCOverviewProps {
  onCardClick: (type: QCCardType) => void
  hoveredCard?: QCCardType | null
}

const RADAR_DATA = [
  { label: '一致性', score: 88, anomalyCount: 12, reviewedCount: 8 },
  { label: '相关性', score: 79, anomalyCount: 23, reviewedCount: 15 },
  { label: '完整性', score: 91, anomalyCount: 7, reviewedCount: 7 },
  { label: '分布范围', score: 83, anomalyCount: 18, reviewedCount: 10 },
]

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

// 相关矩阵缩略图 — CSS Grid，充满容器，无拉伸
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
    <div className="corr-matrix" role="img" aria-label="关键字段相关矩阵"
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

const CARDS = [
  {
    type: 'consistency' as QCCardType,
    title: '一致性校验',
    icon: 'rule',
    score: 88,
    metrics: [
      { label: '单位异常', value: 5, color: 'error' },
      { label: '量纲异常', value: 3, color: 'error' },
      { label: '量级异常', value: 4, color: 'warning' },
      { label: '待复核', value: 8, color: 'warning' },
    ],
    chart: <ConsistencyBarChart />,
  },
  {
    type: 'completeness' as QCCardType,
    title: '完整性校验',
    icon: 'checklist',
    score: 91,
    metrics: [
      { label: '整体完整率', value: '91%', color: 'success' },
      { label: '必填缺失', value: 12, color: 'error' },
      { label: '连续缺失', value: 7, color: 'warning' },
      { label: '可补全', value: 18, color: 'primary' },
    ],
    chart: <CompletenessBarChart />,
  },
  {
    type: 'distribution' as QCCardType,
    title: '分布范围校验',
    icon: 'bar_chart',
    score: 83,
    metrics: [
      { label: '统计异常', value: 11, color: 'warning' },
      { label: '物理越界', value: 3, color: 'error' },
      { label: '公式异常', value: 4, color: 'warning' },
      { label: '待复核极值', value: 9, color: 'warning' },
    ],
    chart: <BoxPlotChart />,
  },
  {
    type: 'correlation' as QCCardType,
    title: '相关性校验',
    icon: 'scatter_plot',
    score: 79,
    metrics: [
      { label: '字段组合数', value: 12, color: 'primary' },
      { label: '低相关组合', value: 4, color: 'warning' },
      { label: '高残差数', value: 6, color: 'error' },
      { label: '异常井数', value: 8, color: 'warning' },
    ],
    chart: <CorrelationMatrix />,
  },
]

const METRIC_COLORS: Record<string, string> = {
  error: 'var(--md-sys-color-error)',
  warning: 'var(--app-color-warning)',
  success: 'var(--app-color-success)',
  primary: 'var(--md-sys-color-primary)',
}

export function QCOverview({ onCardClick, hoveredCard }: QCOverviewProps) {
  const overallScore = Math.round(
    RADAR_DATA.reduce((sum, d) => sum + d.score, 0) / RADAR_DATA.length,
  )

  const getScoreLevel = (s: number) => (s >= 90 ? '优' : s >= 80 ? '良' : s >= 70 ? '中' : '差')
  const getScoreColor = (s: number) => (s >= 90 ? 'var(--app-color-success)' : s >= 75 ? 'var(--app-color-warning)' : 'var(--md-sys-color-error)')

  return (
    <div className="qc-overview">
      {/* 数据集概览头部 */}
      <section className="overview-header" aria-label="数据集概览">
        <div className="overview-meta">
          <div className="overview-meta-left">
            <h2 className="md-typescale-title-medium overview-dataset-name">
              苏里格区块2024年综合数据集
            </h2>
            <div className="overview-tags">
              <span className="overview-tag overview-tag--version">v3.2</span>
              <span className="overview-tag overview-tag--status">待复核</span>
              <span className="overview-tag overview-tag--date">更新: 2024-07-20</span>
            </div>
          </div>
          <div className="overview-score-block">
            <div
              className="overview-score-ring"
              style={{ borderColor: getScoreColor(overallScore) }}
              aria-label={`综合评分 ${overallScore} 分`}
            >
              <span className="md-typescale-headline-medium overview-score-num" style={{ color: getScoreColor(overallScore) }}>
                {overallScore}
              </span>
              <span className="md-typescale-label-small overview-score-label">综合评分</span>
            </div>
            <div className="overview-score-level md-typescale-label-large" style={{ color: getScoreColor(overallScore) }}>
              质量{getScoreLevel(overallScore)}
            </div>
          </div>
        </div>

        {/* 统计指标行 */}
        <div className="overview-stats-row" role="list">
          {[
            { icon: 'oil_barrel', label: '覆盖井数', value: '156口' },
            { icon: 'view_column', label: '已选字段', value: '23个' },
            { icon: 'warning', label: '待复核异常', value: '47条', highlight: true },
            { icon: 'check_circle', label: '已处理异常', value: '92条' },
            { icon: 'percent', label: '修复完成率', value: '66.2%' },
          ].map((stat) => (
            <div key={stat.label} className="overview-stat-item" role="listitem">
              <md-icon class={`overview-stat-icon${stat.highlight ? ' overview-stat-icon--warn' : ''}`}>
                {stat.icon}
              </md-icon>
              <div>
                <div className="md-typescale-label-small overview-stat-label">{stat.label}</div>
                <div
                  className="md-typescale-title-small overview-stat-value"
                  style={stat.highlight ? { color: 'var(--app-color-warning)' } : undefined}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 四维质量雷达：左侧维度卡片 + 右侧雷达图 */}
        <div className="overview-radar-section">
          {/* 左侧：维度列表 */}
          <div className="overview-radar-dims">
            <div className="md-typescale-label-medium overview-section-label">四维质量雷达</div>
            <div className="overview-dim-list">
              {RADAR_DATA.map((d) => {
                const color = d.score >= 90
                  ? 'var(--app-color-success)'
                  : d.score >= 75
                  ? 'var(--app-color-warning)'
                  : 'var(--md-sys-color-error)'
                return (
                  <div key={d.label} className="overview-dim-item">
                    <div className="overview-dim-score-bar">
                      <div
                        className="overview-dim-score-fill"
                        style={{ width: `${d.score}%`, background: color }}
                      />
                    </div>
                    <div className="overview-dim-info">
                      <span className="md-typescale-label-medium overview-dim-label">{d.label}</span>
                      <div className="overview-dim-numbers">
                        <span className="md-typescale-title-small overview-dim-score" style={{ color }}>
                          {d.score}分
                        </span>
                        {d.anomalyCount > 0 && (
                          <span className="md-typescale-label-small overview-dim-anomaly" style={{ color }}>
                            异常{d.anomalyCount}条
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* 右侧：纯净雷达图 */}
          <div className="overview-radar-chart">
            <RadarChart dimensions={RADAR_DATA} size={220} />
          </div>
        </div>
      </section>

      {/* 四类质检卡片 */}
      <section className="qc-cards-section" aria-label="四类质检结果">
        <div className="qc-cards-title md-typescale-label-large">四类质检概览</div>
        <div className="qc-cards-grid" role="list">
          {CARDS.map((card) => {
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
