'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReportItem } from './report-center'

// ─── 章节定义 ────────────────────────────────────────────
interface Chapter {
  id: string
  no: string
  title: string
  sub?: { id: string; no: string; title: string }[]
  warn?: boolean   // 存在待处理内容
  fail?: boolean   // 生成失败
}

const CHAPTERS: Chapter[] = [
  {
    id: 'ch-cover',
    no: '',
    title: '封面',
  },
  {
    id: 'ch-1',
    no: '1',
    title: '数据集与版本基本信息',
    sub: [
      { id: 'ch-1-1', no: '1.1', title: '数据集概况' },
      { id: 'ch-1-2', no: '1.2', title: '版本与范围' },
    ],
  },
  {
    id: 'ch-2',
    no: '2',
    title: '数据质量总体评价',
    sub: [
      { id: 'ch-2-1', no: '2.1', title: '综合评分与质量等级' },
      { id: 'ch-2-2', no: '2.2', title: '四维质量雷达' },
      { id: 'ch-2-3', no: '2.3', title: '异常类型分布' },
    ],
  },
  {
    id: 'ch-3',
    no: '3',
    title: '一致性校验结果',
    sub: [
      { id: 'ch-3-1', no: '3.1', title: '得分与异常统计' },
      { id: 'ch-3-2', no: '3.2', title: '代表字段图件' },
      { id: 'ch-3-3', no: '3.3', title: '处置摘要' },
    ],
    warn: true,
  },
  {
    id: 'ch-4',
    no: '4',
    title: '完整性校验结果',
    sub: [
      { id: 'ch-4-1', no: '4.1', title: '完整率与缺失分析' },
      { id: 'ch-4-2', no: '4.2', title: '补全结果与置信度' },
    ],
  },
  {
    id: 'ch-5',
    no: '5',
    title: '分布范围校验结果',
    sub: [
      { id: 'ch-5-1', no: '5.1', title: '统计异常与物理越界' },
      { id: 'ch-5-2', no: '5.2', title: '箱线图与重点极值' },
    ],
  },
  {
    id: 'ch-6',
    no: '6',
    title: '相关性校验结果',
    sub: [
      { id: 'ch-6-1', no: '6.1', title: '相关矩阵' },
      { id: 'ch-6-2', no: '6.2', title: '异常井与异常记录' },
    ],
  },
  {
    id: 'ch-7',
    no: '7',
    title: '专家复核摘要',
    warn: true,
  },
  {
    id: 'ch-8',
    no: '8',
    title: '分析结论与数据使用建议',
  },
  {
    id: 'ch-9',
    no: '9',
    title: '审计与口径说明',
  },
]

// ─── 数据来源标签 ─────────────────────────────────────────
function SourceTag({ label, type }: { label: string; type: 'dynamic-metric' | 'dynamic-chart' | 'dynamic-table' | 'fixed' | 'expert' }) {
  const cls = `rp-source-tag rp-source-tag--${type}`
  const icons: Record<string, string> = {
    'dynamic-metric': 'query_stats',
    'dynamic-chart':  'bar_chart',
    'dynamic-table':  'table_chart',
    'fixed':          'article',
    'expert':         'verified_user',
  }
  return (
    <span className={cls} title={`数据来自：${label}`}>
      <md-icon>{icons[type]}</md-icon>
      {label}
    </span>
  )
}

// ─── 指标组 ──────────────────────────────────────────────
function MetricGroup({ items }: { items: { label: string; value: string | number; unit?: string; highlight?: 'warn' | 'error' | 'success' }[] }) {
  return (
    <div className="rp-metric-group">
      {items.map((item, i) => (
        <div key={i} className={`rp-metric-item${item.highlight ? ` rp-metric-item--${item.highlight}` : ''}`}>
          <span className="md-typescale-label-small rp-metric-label">{item.label}</span>
          <span className="md-typescale-title-medium rp-metric-value">
            {item.value}
            {item.unit && <span className="rp-metric-unit">{item.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── 简单雷达图（内联 SVG）────────────────────────────────
function MiniRadar() {
  const dims = [
    { label: '一致性', score: 88 },
    { label: '完整性', score: 91 },
    { label: '相关性', score: 79 },
    { label: '分布范围', score: 83 },
  ]
  const cx = 80, cy = 80, r = 60
  const angles = dims.map((_, i) => (i * Math.PI * 2) / dims.length - Math.PI / 2)
  const toPoint = (angle: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angle),
    y: cy + r * ratio * Math.sin(angle),
  })
  const rings = [0.25, 0.5, 0.75, 1]
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" aria-label="四维质量雷达图">
      {rings.map(ring => {
        const pts = angles.map(a => toPoint(a, ring))
        return <polygon key={ring} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.8" />
      })}
      {angles.map((a, i) => {
        const end = toPoint(a, 1)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.8" />
      })}
      <polygon
        points={dims.map((d, i) => { const p = toPoint(angles[i], d.score / 100); return `${p.x},${p.y}` }).join(' ')}
        fill="var(--md-sys-color-primary)"
        fillOpacity="0.18"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="1.5"
      />
      {dims.map((d, i) => {
        const p = toPoint(angles[i], d.score / 100)
        return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--md-sys-color-primary)" />
      })}
      {dims.map((d, i) => {
        const lp = toPoint(angles[i], 1.22)
        return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--md-sys-color-on-surface)" fontWeight="600">{d.label}</text>
      })}
    </svg>
  )
}

// ─── 异常类型分布简图 ─────────────────────────────────────
function AnomalyBarMini() {
  const data = [
    { label: '单位异常', count: 12, color: '#1565c0' },
    { label: '缺失值',   count: 7,  color: '#2196f3' },
    { label: '越界值',   count: 18, color: '#ff9800' },
    { label: '相关异常', count: 23, color: '#ef5350' },
  ]
  const max = Math.max(...data.map(d => d.count))
  return (
    <div className="rp-anomaly-bars">
      {data.map(d => (
        <div key={d.label} className="rp-anomaly-bar-row">
          <span className="rp-anomaly-label md-typescale-label-small">{d.label}</span>
          <div className="rp-anomaly-track">
            <div className="rp-anomaly-fill" style={{ width: `${(d.count / max) * 100}%`, background: d.color }} />
          </div>
          <span className="rp-anomaly-count md-typescale-label-small" style={{ color: d.color }}>{d.count}</span>
        </div>
      ))}
    </div>
  )
}

// ─── 报告内容区块 ─────────────────────────────────────────
function ReportContent({ report }: { report: ReportItem }) {
  return (
    <article className="rp-doc">
      {/* 封面 */}
      <section id="ch-cover" className="rp-chapter rp-chapter--cover">
        <div className="rp-cover-inner">
          <div className="rp-cover-badge">{report.type}</div>
          <h1 className="md-typescale-display-small rp-cover-title">{report.name}</h1>
          <div className="rp-cover-meta">
            <div className="rp-cover-row"><span>编号</span><strong>{report.reportNo}</strong></div>
            <div className="rp-cover-row"><span>数据集</span><strong>{report.dataset}</strong></div>
            <div className="rp-cover-row"><span>数据集版本</span><strong>{report.datasetVersion}</strong></div>
            <div className="rp-cover-row"><span>报告版本</span><strong>{report.version}</strong></div>
            <div className="rp-cover-row"><span>编制人</span><strong>{report.author}</strong></div>
            <div className="rp-cover-row"><span>生成时间</span><strong>{report.generatedAt}</strong></div>
            <div className="rp-cover-row"><span>模板</span><strong>{report.template}</strong></div>
          </div>
          <div className="rp-cover-status-row">
            <span className={`rc-status-badge status-${report.status === '已发布' ? 'published' : report.status === '待审阅' ? 'review' : 'draft'}`}>{report.status}</span>
          </div>
        </div>
      </section>

      {/* 第1章 */}
      <section id="ch-1" className="rp-chapter">
        <h2 className="rp-chapter-heading"><span className="rp-chapter-no">1</span>数据集与版本基本信息</h2>
        <section id="ch-1-1" className="rp-section">
          <h3 className="rp-section-heading">1.1 数据集概况</h3>
          <SourceTag label="动态指标" type="dynamic-metric" />
          <MetricGroup items={[
            { label: '数据集名称', value: report.dataset },
            { label: '当前版本',  value: report.datasetVersion },
            { label: '覆盖井数',  value: 156, unit: '口' },
            { label: '字段数',    value: 23, unit: '个' },
          ]} />
        </section>
        <section id="ch-1-2" className="rp-section">
          <h3 className="rp-section-heading">1.2 版本与范围</h3>
          <SourceTag label="动态指标" type="dynamic-metric" />
          <MetricGroup items={[
            { label: '数据时间范围', value: '2018-01 ～ 2024-06' },
            { label: '创建时间', value: '2024-07-01' },
            { label: '最近更新', value: report.generatedAt },
          ]} />
          <p className="rp-body-text">本版本覆盖苏里格气田苏里格区块共 156 口生产井，包含地质、工程、生产三大类 23 个关键字段，时间跨度 2018 年 1 月至 2024 年 6 月，数据行总计约 14.7 万条。</p>
        </section>
      </section>

      {/* 第2章 */}
      <section id="ch-2" className="rp-chapter">
        <h2 className="rp-chapter-heading"><span className="rp-chapter-no">2</span>数据质量总体评价</h2>
        <section id="ch-2-1" className="rp-section">
          <h3 className="rp-section-heading">2.1 综合评分与质量等级</h3>
          <SourceTag label="动态指标" type="dynamic-metric" />
          <MetricGroup items={[
            { label: '综合评分', value: report.score || 85, unit: '分', highlight: 'success' },
            { label: '质量等级', value: '质量良' },
            { label: '待复核异常', value: 47, unit: '条', highlight: 'warn' },
            { label: '已处理异常', value: 92, unit: '条' },
            { label: '修复完成率', value: '66.2', unit: '%' },
          ]} />
        </section>
        <section id="ch-2-2" className="rp-section">
          <h3 className="rp-section-heading">2.2 四维质量雷达</h3>
          <SourceTag label="动态图表" type="dynamic-chart" />
          <div className="rp-chart-row">
            <MiniRadar />
            <div className="rp-radar-legend">
              {[{ d: '一致性', s: 88 }, { d: '完整性', s: 91 }, { d: '分布范围', s: 83 }, { d: '相关性', s: 79 }].map(item => {
                const c = item.s >= 90 ? 'var(--app-color-success)' : item.s >= 75 ? 'var(--app-color-warning)' : 'var(--md-sys-color-error)'
                return (
                  <div key={item.d} className="rp-radar-dim">
                    <span className="rp-radar-dim-name md-typescale-label-medium">{item.d}</span>
                    <span className="rp-radar-dim-score md-typescale-title-small" style={{ color: c }}>{item.s}分</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
        <section id="ch-2-3" className="rp-section">
          <h3 className="rp-section-heading">2.3 异常类型分布</h3>
          <SourceTag label="动态图表" type="dynamic-chart" />
          <AnomalyBarMini />
        </section>
      </section>

      {/* 第3章 */}
      <section id="ch-3" className="rp-chapter">
        <h2 className="rp-chapter-heading">
          <span className="rp-chapter-no">3</span>一致性校验结果
          <span className="rp-chapter-warn-dot" title="存在待复核内容" />
        </h2>
        <section id="ch-3-1" className="rp-section">
          <h3 className="rp-section-heading">3.1 得分与异常统计</h3>
          <SourceTag label="动态指标" type="dynamic-metric" />
          <MetricGroup items={[
            { label: '一致性得分', value: 88, unit: '分', highlight: 'success' },
            { label: '单位/量纲异常', value: 12, unit: '条', highlight: 'warn' },
            { label: '量级异常', value: 5, unit: '条', highlight: 'warn' },
            { label: '已处理', value: 8, unit: '条' },
          ]} />
          <p className="rp-body-text">渗透率、日产气量两个字段存在量纲不一致问题，主要集中在 2019 年前的历史数据，部分记录未执行单位转换。当前已修复 8 条，余 12 条待复核。</p>
        </section>
        <section id="ch-3-2" className="rp-section">
          <h3 className="rp-section-heading">3.2 代表字段图件</h3>
          <SourceTag label="动态图表" type="dynamic-chart" />
          <div className="rp-placeholder-chart">
            <md-icon>bar_chart</md-icon>
            <span>代表字段一致性得分柱图（动态生成）</span>
          </div>
        </section>
        <section id="ch-3-3" className="rp-section">
          <h3 className="rp-section-heading">3.3 处置摘要</h3>
          <SourceTag label="动态表格" type="dynamic-table" />
          <table className="rp-table">
            <thead><tr><th>字段</th><th>异常类型</th><th>异常数</th><th>处理方式</th><th>状态</th></tr></thead>
            <tbody>
              <tr><td>渗透率</td><td>量纲不一致</td><td>7</td><td>单位统一转换</td><td><span className="rp-cell-warn">待复核</span></td></tr>
              <tr><td>日产气量</td><td>单位错误</td><td>5</td><td>已修正为 10⁴m³</td><td><span className="rp-cell-success">已完成</span></td></tr>
              <tr><td>加砂量</td><td>量级异常</td><td>5</td><td>专家审阅</td><td><span className="rp-cell-warn">待复核</span></td></tr>
            </tbody>
          </table>
        </section>
      </section>

      {/* 第4章 */}
      <section id="ch-4" className="rp-chapter">
        <h2 className="rp-chapter-heading"><span className="rp-chapter-no">4</span>完整性校验结果</h2>
        <section id="ch-4-1" className="rp-section">
          <h3 className="rp-section-heading">4.1 完整率与缺失分析</h3>
          <SourceTag label="动态指标" type="dynamic-metric" />
          <MetricGroup items={[
            { label: '完整性得分', value: 91, unit: '分', highlight: 'success' },
            { label: '整体完整率', value: '94.7', unit: '%', highlight: 'success' },
            { label: '必填缺失', value: 7, unit: '条', highlight: 'warn' },
            { label: '连续缺失段', value: 3, unit: '段', highlight: 'warn' },
          ]} />
        </section>
        <section id="ch-4-2" className="rp-section">
          <h3 className="rp-section-heading">4.2 补全结果与置信度</h3>
          <SourceTag label="动态表格" type="dynamic-table" />
          <table className="rp-table">
            <thead><tr><th>字段</th><th>缺失数</th><th>补全方法</th><th>置信度均值</th><th>状态</th></tr></thead>
            <tbody>
              <tr><td>孔隙度</td><td>3</td><td>线性插值</td><td>92%</td><td><span className="rp-cell-success">已应用</span></td></tr>
              <tr><td>渗透率</td><td>2</td><td>随机森林</td><td>85%</td><td><span className="rp-cell-success">已应用</span></td></tr>
              <tr><td>井底温度</td><td>2</td><td>大模型抽取</td><td>71%</td><td><span className="rp-cell-warn">待专家复核</span></td></tr>
            </tbody>
          </table>
        </section>
      </section>

      {/* 第5章 */}
      <section id="ch-5" className="rp-chapter">
        <h2 className="rp-chapter-heading"><span className="rp-chapter-no">5</span>分布范围校验结果</h2>
        <section id="ch-5-1" className="rp-section">
          <h3 className="rp-section-heading">5.1 统计异常与物理越界</h3>
          <SourceTag label="动态指标" type="dynamic-metric" />
          <MetricGroup items={[
            { label: '分布范围得分', value: 83, unit: '分', highlight: 'warn' },
            { label: '3σ 异常', value: 11, unit: '条', highlight: 'warn' },
            { label: 'IQR 异常', value: 7, unit: '条', highlight: 'warn' },
            { label: '物理越界', value: 3, unit: '条', highlight: 'error' },
          ]} />
        </section>
        <section id="ch-5-2" className="rp-section">
          <h3 className="rp-section-heading">5.2 箱线图与重点极值</h3>
          <SourceTag label="动态图表" type="dynamic-chart" />
          <div className="rp-placeholder-chart">
            <md-icon>candlestick_chart</md-icon>
            <span>孔隙度字段箱线图（动态生成）</span>
          </div>
        </section>
      </section>

      {/* 第6章 */}
      <section id="ch-6" className="rp-chapter">
        <h2 className="rp-chapter-heading"><span className="rp-chapter-no">6</span>相关性校验结果</h2>
        <section id="ch-6-1" className="rp-section">
          <h3 className="rp-section-heading">6.1 相关矩阵</h3>
          <SourceTag label="动态图表" type="dynamic-chart" />
          <div className="rp-placeholder-chart">
            <md-icon>grid_on</md-icon>
            <span>字段相关矩阵热图（动态生成）</span>
          </div>
        </section>
        <section id="ch-6-2" className="rp-section">
          <h3 className="rp-section-heading">6.2 异常井与异常记录</h3>
          <SourceTag label="动态表格" type="dynamic-table" />
          <MetricGroup items={[
            { label: '相关性得分', value: 79, unit: '分', highlight: 'warn' },
            { label: '异常井数', value: 8, unit: '口', highlight: 'warn' },
            { label: '异常记录', value: 23, unit: '条', highlight: 'warn' },
          ]} />
        </section>
      </section>

      {/* 第7章 */}
      <section id="ch-7" className="rp-chapter">
        <h2 className="rp-chapter-heading">
          <span className="rp-chapter-no">7</span>专家复核摘要
          <span className="rp-chapter-warn-dot" title="存在待复核内容" />
        </h2>
        <SourceTag label="专家结论" type="expert" />
        <MetricGroup items={[
          { label: '待复核', value: 15, unit: '条', highlight: 'warn' },
          { label: '已确认', value: 28, unit: '条', highlight: 'success' },
          { label: '已驳回', value: 4, unit: '条' },
          { label: '保留原值', value: 3, unit: '条' },
        ]} />
        <p className="rp-body-text">本次质检共提交专家复核 50 条记录，完成 35 条，剩余 15 条（主要为物理边界判断和大模型抽取补全结果）待指派专家处理。建议发布前完成全部复核。</p>
      </section>

      {/* 第8章 */}
      <section id="ch-8" className="rp-chapter">
        <h2 className="rp-chapter-heading"><span className="rp-chapter-no">8</span>分析结论与数据使用建议</h2>
        <SourceTag label="固定说明" type="fixed" />
        <div className="rp-conclusion-block">
          <h4 className="rp-sub-title">可用范围</h4>
          <p className="rp-body-text">当前数据集综合质量等级为"质量良"（85分），建议用于苏里格区块宏观统计分析、主力层段产能预测和区域对比研究，暂不建议直接用于单井精细化建模。</p>
          <h4 className="rp-sub-title">未解决异常</h4>
          <p className="rp-body-text">渗透率量纲问题（12条）和专家待复核记录（15条）尚未处置完毕，使用方需注意相关字段的可靠性。</p>
          <h4 className="rp-sub-title">建议处理</h4>
          <p className="rp-body-text">① 优先完成渗透率单位统一；② 对 3 条物理越界记录进行人工核查；③ 完成大模型抽取补全结果的专家审定。</p>
          <h4 className="rp-sub-title">使用限制</h4>
          <p className="rp-body-text">本报告基于数据集版本 {report.datasetVersion} 生成，后续版本更新后需重新生成或刷新数据。</p>
        </div>
      </section>

      {/* 第9章 */}
      <section id="ch-9" className="rp-chapter">
        <h2 className="rp-chapter-heading"><span className="rp-chapter-no">9</span>审计与口径说明</h2>
        <SourceTag label="固定说明" type="fixed" />
        <table className="rp-table">
          <tbody>
            <tr><td className="rp-audit-key">字段标准版本</td><td>字段标准库 v4.2</td></tr>
            <tr><td className="rp-audit-key">质检规则版本</td><td>质检规则库 v3.1</td></tr>
            <tr><td className="rp-audit-key">评分方案</td><td>综合加权评分 v2.0</td></tr>
            <tr><td className="rp-audit-key">报告模板</td><td>{report.template}</td></tr>
            <tr><td className="rp-audit-key">生成人</td><td>{report.author}</td></tr>
            <tr><td className="rp-audit-key">生成时间</td><td>{report.generatedAt}</td></tr>
            <tr><td className="rp-audit-key">操作记录</td><td>共 47 条操作日志，可查看详细审计报告</td></tr>
          </tbody>
        </table>
      </section>
    </article>
  )
}

// ─── 版本历史抽屉 ─────────────────────────────────────────
function VersionHistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const versions = [
    { ver: 'v1.2', status: '待审阅', current: true, time: '2024-07-20 14:32', author: '张工', datasetVer: 'v3.2', note: '刷新相关性章节数据' },
    { ver: 'v1.1', status: '草稿',   current: false, time: '2024-07-18 10:05', author: '张工', datasetVer: 'v3.2', note: '补充专家复核摘要' },
    { ver: 'v1.0', status: '草稿',   current: false, time: '2024-07-15 09:30', author: '张工', datasetVer: 'v3.1', note: '初始创建' },
  ]
  return (
    <div className={`rp-drawer${open ? ' rp-drawer--open' : ''}`} aria-label="版本历史">
      <div className="rp-drawer-header">
        <span className="md-typescale-title-small rp-drawer-title">版本历史</span>
        <button className="rc-icon-btn" onClick={onClose} aria-label="关闭抽屉"><md-icon>close</md-icon></button>
      </div>
      <div className="rp-drawer-body">
        {versions.map(v => (
          <div key={v.ver} className={`rp-ver-item${v.current ? ' rp-ver-item--current' : ''}`}>
            <div className="rp-ver-header">
              <span className="md-typescale-label-large rp-ver-no">{v.ver}</span>
              {v.current && <span className="rp-ver-current-tag">当前</span>}
              <span className={`rc-status-badge status-${v.status === '待审阅' ? 'review' : 'draft'}`}>{v.status}</span>
            </div>
            <div className="rp-ver-meta">
              <span><md-icon>schedule</md-icon>{v.time}</span>
              <span><md-icon>person</md-icon>{v.author}</span>
              <span><md-icon>tag</md-icon>数据集 {v.datasetVer}</span>
            </div>
            {v.note && <p className="md-typescale-body-small rp-ver-note">{v.note}</p>}
            <div className="rp-ver-actions">
              <button className="rc-btn rc-btn--ghost rc-btn--sm">查看</button>
              <button className="rc-btn rc-btn--ghost rc-btn--sm">对比</button>
              <button className="rc-btn rc-btn--ghost rc-btn--sm">下载</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 主组件：报告预览工作台 ──────────────────────────────
interface ReportPreviewProps {
  reportId: string
  onBack: () => void
}

export function ReportPreview({ reportId, onBack }: ReportPreviewProps) {
  // 模拟报告查找
  const report: ReportItem = {
    id: reportId,
    name: '苏里格区块2024年综合数据集_综合质检报告',
    reportNo: 'QCR-2024-001',
    type: '综合质检报告',
    dataset: '苏里格区块2024年综合数据集',
    datasetVersion: 'v3.2',
    score: 85,
    scoreDim: '综合',
    generatedAt: '2024-07-20 14:32',
    version: 'v1.2',
    status: '待审阅',
    author: '张工',
    template: '数据集综合质检标准模板 v2.1',
  }

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(['ch-1', 'ch-2', 'ch-3']))
  const [activeChapter, setActiveChapter] = useState('ch-cover')
  const [historyOpen, setHistoryOpen] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)
  const tocRef = useRef<HTMLDivElement>(null)
  const scrollingTo = useRef(false)

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const scrollToChapter = useCallback((id: string) => {
    const el = docRef.current?.querySelector(`#${id}`)
    if (!el) return
    scrollingTo.current = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveChapter(id)
    setTimeout(() => { scrollingTo.current = false }, 800)
  }, [])

  // 滚动监听 → 同步高亮目录
  useEffect(() => {
    const container = docRef.current
    if (!container) return
    const handler = () => {
      if (scrollingTo.current) return
      const allIds = [
        'ch-cover',
        ...CHAPTERS.flatMap(c => [c.id, ...(c.sub?.map(s => s.id) ?? [])]),
      ]
      let current = allIds[0]
      for (const id of allIds) {
        const el = container.querySelector(`#${id}`)
        if (!el) continue
        if (el.getBoundingClientRect().top <= container.getBoundingClientRect().top + 60) {
          current = id
        }
      }
      setActiveChapter(current)
    }
    container.addEventListener('scroll', handler, { passive: true })
    return () => container.removeEventListener('scroll', handler)
  }, [])

  // 活跃章节自动滚入目录可视区
  useEffect(() => {
    if (!tocRef.current) return
    const active = tocRef.current.querySelector('.rp-toc-item--active')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeChapter])

  return (
    <div className="rp-shell">
      {/* 顶部操作栏 */}
      <header className="rp-topbar">
        <div className="rp-topbar-left">
          <button className="rp-back-btn" onClick={onBack}>
            <md-icon>arrow_back</md-icon>
            返回报告中心
          </button>
          <div className="rp-topbar-divider" />
          <div className="rp-topbar-report-info">
            <span className="md-typescale-title-small rp-topbar-name" title={report.name}>{report.name}</span>
            <span className="md-typescale-label-small rp-topbar-meta">{report.template} · {report.version}</span>
          </div>
        </div>
        <div className="rp-topbar-right">
          <button className="rc-btn rc-btn--ghost rc-btn--sm rp-refresh-btn" title="刷新数据">
            <md-icon>refresh</md-icon>刷新数据
          </button>
          <button className="rc-btn rc-btn--ghost rc-btn--sm" title="保存版本">
            <md-icon>save</md-icon>保存版本
          </button>
          <div className="rp-topbar-divider" />
          <button className="rc-btn rc-btn--ghost rc-btn--sm" title="导出 Word">
            <md-icon>description</md-icon>Word
          </button>
          <button className="rc-btn rc-btn--ghost rc-btn--sm" title="导出 PDF">
            <md-icon>picture_as_pdf</md-icon>PDF
          </button>
          <div className="rp-topbar-divider" />
          <button className="rc-btn rc-btn--ghost rc-btn--sm" onClick={() => setHistoryOpen(true)}>
            <md-icon>history</md-icon>版本历史
          </button>
          <button className="rc-btn rc-btn--primary rc-btn--sm rp-publish-btn">
            <md-icon>publish</md-icon>提交审阅
          </button>
        </div>
      </header>

      {/* 主体：目录 + 文档 */}
      <div className="rp-body">
        {/* 左侧章节目录 */}
        <nav className="rp-toc" ref={tocRef} aria-label="报告章节目录">
          <div className="rp-toc-header">
            <md-icon>toc</md-icon>
            <span className="md-typescale-label-medium">目录</span>
          </div>
          <div className="rp-toc-list">
            {/* 封面 */}
            <button
              className={`rp-toc-item rp-toc-item--l1${activeChapter === 'ch-cover' ? ' rp-toc-item--active' : ''}`}
              onClick={() => scrollToChapter('ch-cover')}
            >
              封面
            </button>
            {CHAPTERS.map(ch => (
              <div key={ch.id} className="rp-toc-group">
                <div className="rp-toc-item-wrap">
                  <button
                    className={`rp-toc-item rp-toc-item--l1${activeChapter === ch.id ? ' rp-toc-item--active' : ''}`}
                    onClick={() => { scrollToChapter(ch.id); if (ch.sub) toggleChapter(ch.id) }}
                  >
                    {ch.no && <span className="rp-toc-no">{ch.no}</span>}
                    <span className="rp-toc-label">{ch.title}</span>
                    {ch.warn && <span className="rp-toc-dot rp-toc-dot--warn" title="存在待处理内容" />}
                    {ch.fail && <span className="rp-toc-dot rp-toc-dot--fail" title="生成失败" />}
                    {ch.sub && (
                      <md-icon class={`rp-toc-chevron${expandedChapters.has(ch.id) ? ' rp-toc-chevron--open' : ''}`}>
                        chevron_right
                      </md-icon>
                    )}
                  </button>
                </div>
                {ch.sub && expandedChapters.has(ch.id) && (
                  <div className="rp-toc-sub-list">
                    {ch.sub.map(s => (
                      <button
                        key={s.id}
                        className={`rp-toc-item rp-toc-item--l2${activeChapter === s.id ? ' rp-toc-item--active' : ''}`}
                        onClick={() => scrollToChapter(s.id)}
                      >
                        <span className="rp-toc-no">{s.no}</span>
                        <span className="rp-toc-label">{s.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* 中间连续文档区 */}
        <div className="rp-doc-area" ref={docRef}>
          <ReportContent report={report} />
        </div>

        {/* 版本历史抽屉 */}
        <VersionHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
      </div>
    </div>
  )
}
