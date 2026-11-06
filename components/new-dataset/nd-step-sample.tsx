'use client'

import {
  FIELD_MAP, WELLS, buildColumns, configKey, segmentCount,
  type Granularity, type Interval, type NdConfig, type PreviewResult, type SplitMethod, type StartFrom,
} from './nd-model'
import { NdPreview } from './nd-preview'

interface Props {
  config: NdConfig
  update: (patch: Partial<NdConfig>) => void
  preview: PreviewResult | null
}

const SPLIT_METHODS: { id: SplitMethod; desc: string }[] = [
  { id: '等比例', desc: '全井有效产出段权重均为 1，比例 = 1／有效产出段数' },
  { id: '有效射孔长度', desc: '权重为段内有效射孔区间并集长度，重叠区间不重复计长' },
  { id: '地层系数', desc: '权重为 k×h（渗透率 × 有效厚度），按全井权重归一化' },
]

export function NdStepSample({ config, update, preview }: Props) {
  const hasProduction = config.fieldIds.some((id) => FIELD_MAP[id]?.kind === 'production')
  const splitAvailable = config.granularity === 'segment' && hasProduction
  const wells = WELLS.filter((w) => config.wellIds.includes(w.id))
  const rowCount = config.granularity === 'segment' ? wells.reduce((n, w) => n + segmentCount(w), 0) : wells.length
  const previewStale = !!preview && preview.key !== configKey(config)

  const togglePeriod = (m: number) =>
    update({ periods: config.periods.includes(m) ? config.periods.filter((x) => x !== m) : [...config.periods, m] })

  return (
    <div className="ndw-step2">
      {/* 左侧参数区 */}
      <aside className="ndw-card ndw-config" aria-label="样本粒度配置">
        <ConfigBlock title="计算方式" hint={config.granularity === 'well' ? '一行一口井，井内段级、深度或时间数据按各字段口径汇总' : '一行是一口井的一个井段，系统补齐作业批次、井段标识与区间边界'}>
          <Seg<Granularity> value={config.granularity} options={[['well', '井'], ['segment', '井段']]}
            onChange={(v) => update({ granularity: v, splitEnabled: v === 'well' ? false : config.splitEnabled })} />
        </ConfigBlock>

        <ConfigBlock title="采样间隔" hint={`以${config.interval}区间作为取数和关联范围`}>
          <Seg<Interval> value={config.interval} options={[['射孔段', '射孔段'], ['压裂段', '压裂段']]} onChange={(v) => update({ interval: v })} />
        </ConfigBlock>

        <ConfigBlock title="完整性阈值" hint="覆盖率＝有可用数据的适用业务字段数 ÷ 所选适用业务字段数；基础信息不计入。低于阈值的记录暂不纳入，并保留排除原因">
          <div className="ndw-slider-row">
            <input type="range" min={0} max={100} step={5} value={config.threshold}
              onChange={(e) => update({ threshold: Number(e.target.value) })} aria-label="完整性阈值" />
            <span className="ndw-slider-val">{config.threshold}%</span>
          </div>
        </ConfigBlock>

        <ConfigBlock title="时间周期" hint={hasProduction ? '从统计起点顺延相应月数（停产期间计入）；“全部历史”为起点到截止日期的完整范围' : '未选择生产字段，周期设置不生效'}>
          <div className={`ndw-chips${hasProduction ? '' : ' ndw-dim'}`}>
            {[1, 3, 6, 12].map((m) => (
              <button key={m} className={`ndw-chip${config.periods.includes(m) ? ' ndw-chip--on' : ''}`} disabled={!hasProduction}
                aria-pressed={config.periods.includes(m)} onClick={() => togglePeriod(m)}>{m}个月</button>
            ))}
            <button className={`ndw-chip${config.allHistory ? ' ndw-chip--on' : ''}`} disabled={!hasProduction}
              aria-pressed={config.allHistory} onClick={() => update({ allHistory: !config.allHistory })}>全部历史</button>
          </div>
        </ConfigBlock>

        <ConfigBlock title="统计起点与截止">
          <div className="ndw-form-grid">
            <label className="ndw-field">
              <span className="ndw-field-label">统计起点</span>
              <select className="ndw-input ndw-select" value={config.startFrom} disabled={!hasProduction}
                onChange={(e) => update({ startFrom: e.target.value as StartFrom })}>
                <option>投产日期</option><option>压裂结束日期</option><option>指定日期</option>
              </select>
            </label>
            {config.startFrom === '指定日期' && (
              <label className="ndw-field">
                <span className="ndw-field-label">指定日期</span>
                <input type="date" className="ndw-input" value={config.startDate} disabled={!hasProduction}
                  onChange={(e) => update({ startDate: e.target.value })} />
              </label>
            )}
            <label className="ndw-field">
              <span className="ndw-field-label">截止日期（含当天）</span>
              <input type="date" className="ndw-input" value={config.cutoff} disabled={!hasProduction}
                onChange={(e) => update({ cutoff: e.target.value })} />
            </label>
          </div>
        </ConfigBlock>

        <ConfigBlock title="产量劈分" hint={splitAvailable ? '按需启用；输出标注为劈分估算值，未启用时段级产量留空' : '仅在“井段”模式且选择了生产字段时可用'}>
          <label className={`ndw-switch-row${splitAvailable ? '' : ' ndw-dim'}`}>
            <button role="switch" aria-checked={config.splitEnabled} disabled={!splitAvailable}
              className={`ndw-switch${config.splitEnabled ? ' ndw-switch--on' : ''}`}
              onClick={() => update({ splitEnabled: !config.splitEnabled })}>
              <span className="ndw-switch-thumb" />
            </button>
            <span>启用产量劈分</span>
          </label>
          {splitAvailable && config.splitEnabled && (
            <div className="ndw-radio-list" role="radiogroup" aria-label="劈分方法">
              {SPLIT_METHODS.map((m) => (
                <label key={m.id} className={`ndw-radio-card${config.splitMethod === m.id ? ' ndw-radio-card--on' : ''}`}>
                  <input type="radio" name="split" checked={config.splitMethod === m.id} onChange={() => update({ splitMethod: m.id })} />
                  <div>
                    <div className="ndw-radio-title">{m.id}</div>
                    <div className="ndw-radio-desc">{m.desc}</div>
                  </div>
                </label>
              ))}
              <div className="ndw-formula">段产量 ＝ 井级产量 × 该段权重 ÷ 全井有效产出段权重之和</div>
            </div>
          )}
        </ConfigBlock>
      </aside>

      {/* 右侧：样本结构 / 检查与计算预览 */}
      <section className="ndw-card ndw-sample" aria-label="样本数据">
        {preview ? (
          <NdPreview preview={preview} stale={previewStale} />
        ) : (
          <SampleStructure config={config} rowCount={rowCount} />
        )}
      </section>
    </div>
  )
}

function SampleStructure({ config, rowCount }: { config: NdConfig; rowCount: number }) {
  const columns = buildColumns(config)
  const wells = WELLS.filter((w) => config.wellIds.includes(w.id))
  const rows: { well: string; seg?: number }[] = []
  for (const w of wells) {
    const n = config.granularity === 'segment' ? segmentCount(w) : 1
    for (let s = 0; s < n; s++) rows.push({ well: w.name, seg: config.granularity === 'segment' ? s + 1 : undefined })
  }
  const shown = rows.slice(0, 8)
  return (
    <>
      <div className="ndw-card-head">
        <span className="ndw-card-title">样本结构</span>
        <span className="ndw-card-sub">
          {config.granularity === 'well' ? '井级' : `井段级（${config.interval}）`} · 候选 {rowCount} 行 · {columns.length - 2} 列。点击底部「检查与计算预览」生成计算值
        </span>
      </div>
      <div className="ndw-table-wrap">
        <table className="ndw-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.key} className={`${c.sticky ? `ndw-sticky ndw-sticky-${i}` : ''} ${c.cat === 'segment' ? 'ndw-seg-th' : ''}`}>
                  <div className="ndw-th-name">{c.label}{c.unit && <span className="ndw-th-unit">（{c.unit}）</span>}</div>
                  {c.method && <div className="ndw-th-meta"><span className="ndw-th-method ndw-th-method--ro">{c.method}</span></div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={`${r.well}-${r.seg ?? 0}`}>
                {columns.map((c, ci) => {
                  if (c.key === 'idx') return <td key={c.key} className="ndw-sticky ndw-sticky-0 ndw-num">{i + 1}</td>
                  if (c.key === 'well_no') return <td key={c.key} className="ndw-sticky ndw-sticky-1 ndw-strong">{r.well}</td>
                  if (c.key === 'seg_id') return <td key={c.key}>S{r.seg}</td>
                  if (c.key === 'seg_type') return <td key={c.key}>{config.interval}</td>
                  if (c.key === 'batch') return <td key={c.key}>B1</td>
                  return <td key={c.key + ci} className="ndw-pending">待计算</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > shown.length && <div className="ndw-more">还有 {rows.length - shown.length} 行，预览后可查看全部</div>}
      </div>
    </>
  )
}

function ConfigBlock({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="ndw-config-block">
      <div className="ndw-section-title">{title}</div>
      {children}
      {hint && <p className="ndw-hint">{hint}</p>}
    </div>
  )
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="ndw-seg ndw-seg--inline" role="radiogroup">
      {options.map(([v, label]) => (
        <button key={v} role="radio" aria-checked={value === v} className={`ndw-seg-btn${value === v ? ' ndw-seg-btn--on' : ''}`} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}
