// 新建数据集：示例目录、质检模板、字段口径与检查/计算预览逻辑
// 井、数值与检查结果均为交互设计示例，不代表真实生产数据

export type FieldCat = 'basic' | 'geology' | 'engineering' | 'production'
export type FieldKind = 'id' | 'category' | 'date' | 'numeric' | 'quantity' | 'rate' | 'production'

export interface NdField {
  id: string
  name: string
  cat: FieldCat
  kind: FieldKind
  unit?: string
  locked?: boolean // 必要关联标识，不可取消
}

export const CATEGORIES: { id: FieldCat; name: string; icon: string }[] = [
  { id: 'basic', name: '基础信息', icon: 'badge' },
  { id: 'geology', name: '地质参数', icon: 'terrain' },
  { id: 'engineering', name: '工程参数', icon: 'construction' },
  { id: 'production', name: '生产参数', icon: 'oil_barrel' },
]

export const KIND_LABEL: Record<FieldKind, string> = {
  id: '标识',
  category: '类别',
  date: '日期',
  numeric: '数值',
  quantity: '数量',
  rate: '压力/排量',
  production: '生产',
}

// 字段类型与计算方法适配，避免类别取均值、数量与速率套用同一方法
export const METHODS_BY_KIND: Record<FieldKind, string[]> = {
  id: ['原值'],
  category: ['众数', '首个有效值'],
  date: ['原值'],
  numeric: ['均值', '厚度加权均值', '中位数', '最大值', '最小值'],
  quantity: ['合计', '均值', '最大值'],
  rate: ['均值', '时间加权均值', '最大值'],
  production: ['累计', '日均'],
}

export const FIELDS: NdField[] = [
  { id: 'well_no', name: '井号', cat: 'basic', kind: 'id', locked: true },
  { id: 'well_type', name: '井型', cat: 'basic', kind: 'category' },
  { id: 'prod_date', name: '投产日期', cat: 'basic', kind: 'date' },
  { id: 'layer', name: '层位', cat: 'basic', kind: 'category' },
  { id: 'porosity', name: '孔隙度', cat: 'geology', kind: 'numeric', unit: '%' },
  { id: 'permeability', name: '渗透率', cat: 'geology', kind: 'numeric', unit: 'mD' },
  { id: 'thickness', name: '有效厚度', cat: 'geology', kind: 'numeric', unit: 'm' },
  { id: 'saturation', name: '含气饱和度', cat: 'geology', kind: 'numeric', unit: '%' },
  { id: 'lithology', name: '岩性', cat: 'geology', kind: 'category' },
  { id: 'sand', name: '加砂量', cat: 'engineering', kind: 'quantity', unit: 'm³' },
  { id: 'fluid', name: '入地液量', cat: 'engineering', kind: 'quantity', unit: 'm³' },
  { id: 'rate', name: '施工排量', cat: 'engineering', kind: 'rate', unit: 'm³/min' },
  { id: 'pressure', name: '破裂压力', cat: 'engineering', kind: 'rate', unit: 'MPa' },
  { id: 'gas', name: '产气量', cat: 'production', kind: 'production', unit: '10⁴m³' },
  { id: 'water', name: '产水量', cat: 'production', kind: 'production', unit: 'm³' },
  { id: 'wellhead', name: '井口压力', cat: 'production', kind: 'rate', unit: 'MPa' },
]

export const FIELD_MAP: Record<string, NdField> = Object.fromEntries(FIELDS.map((f) => [f.id, f]))
export const isBusiness = (id: string) => FIELD_MAP[id]?.cat !== 'basic'

export type WellStatus = '生产' | '关井' | '未投产'

export interface NdWell {
  id: string
  name: string
  block: string
  type: '水平井' | '直井'
  status: WellStatus
  prodDate: string | null
  fracEnd: string | null
  layer: string
  perfLen: number[] | null // 各段有效射孔长度（m），null 表示缺少射孔区间
  kh: number[] | null // 各段地层系数 k×h，null 表示缺少有效厚度
}

export const WELLS: NdWell[] = [
  { id: 'w1', name: '苏36-11井', block: '苏里格区块', type: '水平井', status: '生产', prodDate: '2023-05-10', fracEnd: '2023-04-22', layer: '盒8下', perfLen: [42, 38, 45, 40], kh: [31, 26, 35, 29] },
  { id: 'w2', name: '苏36-12井', block: '苏里格区块', type: '水平井', status: '生产', prodDate: '2024-03-18', fracEnd: '2024-03-02', layer: '盒8下', perfLen: [36, 41, 39, 44], kh: [22, 28, 25, 30] },
  { id: 'w3', name: '苏36-13井', block: '苏里格区块', type: '直井', status: '生产', prodDate: '2022-08-01', fracEnd: '2022-07-15', layer: '山1', perfLen: null, kh: [18, 14] },
  { id: 'w4', name: '苏36-14井', block: '苏里格区块', type: '水平井', status: '未投产', prodDate: null, fracEnd: '2026-10-08', layer: '盒8上', perfLen: [40, 37, 42, 39], kh: [24, 21, 27, 23] },
  { id: 'w5', name: '陇47-03井', block: '陇东区块', type: '直井', status: '生产', prodDate: '2025-12-20', fracEnd: '2025-12-04', layer: '长7', perfLen: [12, 15], kh: null },
  { id: 'w6', name: '陇47-05井', block: '陇东区块', type: '水平井', status: '关井', prodDate: '2026-08-15', fracEnd: '2026-07-30', layer: '长7', perfLen: [35, 33, 38, 36], kh: [19, 17, 21, 18] },
  { id: 'w7', name: '陇52-01井', block: '陇东区块', type: '直井', status: '生产', prodDate: '2021-11-02', fracEnd: '2021-10-18', layer: '长8', perfLen: [14, 16], kh: [12, 15] },
]

export const WELL_MAP: Record<string, NdWell> = Object.fromEntries(WELLS.map((w) => [w.id, w]))
export const segmentCount = (w: NdWell) => (w.type === '水平井' ? 4 : 2)

// ─── 质检模板：决定默认字段、默认方法与可配置的业务字段范围 ─────────────
export interface QcTemplate {
  id: string
  name: string
  code: string
  fields: string[] // 模板配置的业务字段
  methods: Record<string, string>
}

export const TEMPLATES: QcTemplate[] = [
  {
    id: 't1', name: '区块A水平井压裂质检模板', code: 'TPL_BLOCK_A_HZ',
    fields: ['porosity', 'permeability', 'thickness', 'sand', 'fluid', 'rate', 'gas', 'water'],
    methods: { porosity: '厚度加权均值', permeability: '厚度加权均值', thickness: '均值', sand: '合计', fluid: '合计', rate: '时间加权均值', gas: '累计', water: '累计' },
  },
  {
    id: 't2', name: '区块B直井压后质检模板', code: 'TPL_BLOCK_B_VT',
    fields: ['porosity', 'permeability', 'saturation', 'sand', 'pressure', 'gas', 'water', 'wellhead'],
    methods: { porosity: '均值', permeability: '中位数', saturation: '均值', sand: '合计', pressure: '最大值', gas: '日均', water: '日均', wellhead: '均值' },
  },
  {
    id: 't3', name: '通用地质参数质检模板', code: 'TPL_GEO_BASE',
    fields: ['porosity', 'permeability', 'thickness', 'saturation', 'lithology'],
    methods: { porosity: '均值', permeability: '均值', thickness: '均值', saturation: '均值', lithology: '众数' },
  },
]

export const TEMPLATE_MAP: Record<string, QcTemplate> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]))
export const DEFAULT_BASIC_FIELDS = ['well_no', 'well_type', 'prod_date', 'layer']

export function defaultMethod(fieldId: string, tpl?: QcTemplate | null) {
  return tpl?.methods[fieldId] ?? METHODS_BY_KIND[FIELD_MAP[fieldId].kind][0]
}

// ─── 来源覆盖 ────────────────────────────────────────────────────────────
export type Coverage = 'Y' | '—' | '未投产'

const MISSING: Record<string, string[]> = {
  w3: ['saturation', 'rate'],
  w6: ['porosity', 'permeability', 'thickness', 'sand', 'lithology'],
  w7: ['pressure'],
}

export function coverageOf(wellId: string, fieldId: string): Coverage {
  const w = WELL_MAP[wellId]
  if (FIELD_MAP[fieldId].cat === 'production' && w.status === '未投产') return '未投产'
  if (MISSING[wellId]?.includes(fieldId)) return '—'
  return 'Y'
}

export function basicValue(w: NdWell, fieldId: string): string {
  if (fieldId === 'well_no') return w.name
  if (fieldId === 'well_type') return w.type
  if (fieldId === 'prod_date') return w.prodDate ?? '未投产'
  if (fieldId === 'layer') return w.layer
  return '—'
}

// ─── 配置 ────────────────────────────────────────────────────────────────
export type Granularity = 'well' | 'segment'
export type Interval = '射孔段' | '压裂段'
export type StartFrom = '投产日期' | '压裂结束日期' | '指定日期'
export type SplitMethod = '等比例' | '有效射孔长度' | '地层系数'

export interface NdConfig {
  name: string
  templateId: string
  wellIds: string[]
  fieldIds: string[]
  methods: Record<string, string>
  granularity: Granularity
  interval: Interval
  threshold: number
  periods: number[]
  allHistory: boolean
  startFrom: StartFrom
  startDate: string
  cutoff: string
  splitEnabled: boolean
  splitMethod: SplitMethod
}

export const EMPTY_CONFIG: NdConfig = {
  name: '',
  templateId: '',
  wellIds: [],
  fieldIds: [...DEFAULT_BASIC_FIELDS],
  methods: {},
  granularity: 'well',
  interval: '射孔段',
  threshold: 70,
  periods: [3, 12],
  allHistory: false,
  startFrom: '投产日期',
  startDate: '2024-01-01',
  cutoff: '2026-11-04',
  splitEnabled: false,
  splitMethod: '等比例',
}

// 影响检查与计算的配置签名：变化后旧预览失效
export const configKey = (c: NdConfig) =>
  JSON.stringify({ ...c, wellIds: [...c.wellIds].sort(), fieldIds: [...c.fieldIds].sort() })

// ─── 日期工具：固定周期按月顺延，左闭右开；截止日期含当天 ─────────────────
function addMonths(iso: string, m: number): Date {
  const d = new Date(`${iso}T00:00:00`)
  const day = d.getDate()
  const t = new Date(d.getFullYear(), d.getMonth() + m, 1)
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  t.setDate(Math.min(day, last))
  return t
}
const dayAfter = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return d
}
const daysBetween = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))

function startOf(w: NdWell, c: NdConfig): string | null {
  if (c.startFrom === '指定日期') return w.prodDate ? c.startDate : null
  if (c.startFrom === '压裂结束日期') return w.prodDate ? w.fracEnd : null
  return w.prodDate
}

// ─── 确定性示例数值 ──────────────────────────────────────────────────────
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}
const RANGE: Record<string, [number, number, number]> = {
  porosity: [7.5, 13.8, 1], permeability: [0.32, 1.85, 2], thickness: [8, 24, 1], saturation: [55, 74, 1],
  sand: [620, 1480, 0], fluid: [8200, 19800, 0], rate: [8.2, 13.6, 1], pressure: [46, 69, 1],
  gas: [0.8, 2.6, 2], water: [4, 18, 1], wellhead: [9.5, 24, 1],
}
const METHOD_FACTOR: Record<string, number> = { 最大值: 1.16, 最小值: 0.84, 中位数: 0.98, 厚度加权均值: 1.03, 时间加权均值: 0.97 }

function baseValue(wellId: string, fieldId: string) {
  const [lo, hi] = RANGE[fieldId]
  return lo + (hi - lo) * hash(`${wellId}:${fieldId}`)
}
const fmt = (v: number, d: number) => v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d })

// ─── 预览结果 ────────────────────────────────────────────────────────────
export type CellTag = '周期未满' | '未投产' | '未启用劈分' | '劈分估算' | '缺失'
export interface Cell { text: string; tag?: CellTag }

export interface PreviewColumn {
  key: string
  label: string
  unit?: string
  method?: string
  cat: FieldCat | 'segment'
  sticky?: boolean
}

export interface PreviewRow {
  key: string
  wellName: string
  coverage: number | null
  cells: Record<string, Cell>
}

export interface ExcludedRow {
  key: string
  object: string
  coverage: number | null
  reason: string
}

export type CheckStatus = 'pass' | 'warn' | 'block'
export interface CheckItem { item: string; status: CheckStatus; detail: string }

export interface PreviewResult {
  key: string
  columns: PreviewColumn[]
  rows: PreviewRow[]
  excluded: ExcludedRow[]
  checks: CheckItem[]
  stats: { candidate: number; included: number; excluded: number; immature: number; missing: number }
  blocked: boolean
}

export const periodLabel = (m: number | 'all') => (m === 'all' ? '全部历史' : `${m}个月`)

export function buildColumns(c: NdConfig): PreviewColumn[] {
  const cols: PreviewColumn[] = [
    { key: 'idx', label: '序号', cat: 'basic', sticky: true },
    { key: 'well_no', label: '井号', cat: 'basic', sticky: true },
  ]
  if (c.granularity === 'segment') {
    cols.push(
      { key: 'batch', label: '作业批次', cat: 'segment' },
      { key: 'seg_type', label: '井段类型', cat: 'segment' },
      { key: 'seg_id', label: '段ID', cat: 'segment' },
      { key: 'top', label: '顶深', unit: 'm', cat: 'segment' },
      { key: 'bottom', label: '底深', unit: 'm', cat: 'segment' },
    )
  }
  const periods: (number | 'all')[] = [...[...c.periods].sort((a, b) => a - b), ...(c.allHistory ? ['all' as const] : [])]
  for (const cat of CATEGORIES) {
    for (const f of FIELDS) {
      if (f.cat !== cat.id || f.id === 'well_no' || !c.fieldIds.includes(f.id)) continue
      const method = c.methods[f.id] ?? METHODS_BY_KIND[f.kind][0]
      if (f.kind === 'production') {
        for (const p of periods) {
          cols.push({ key: `${f.id}@${p}`, label: `${f.name}·${periodLabel(p)}`, unit: f.unit, method, cat: f.cat })
        }
      } else {
        cols.push({ key: f.id, label: f.name, unit: f.unit, method, cat: f.cat })
      }
    }
  }
  return cols
}

export function computePreview(c: NdConfig): PreviewResult {
  const columns = buildColumns(c)
  const business = c.fieldIds.filter(isBusiness)
  const wells = WELLS.filter((w) => c.wellIds.includes(w.id))
  const periods: (number | 'all')[] = [...c.periods, ...(c.allHistory ? ['all' as const] : [])]
  const cutoffEnd = dayAfter(c.cutoff)
  const productionFields = business.filter((id) => FIELD_MAP[id].kind === 'production')

  const rows: PreviewRow[] = []
  const excluded: ExcludedRow[] = []
  let immature = 0
  let missing = 0
  const splitBlocks: string[] = []

  for (const w of wells) {
    const segs = c.granularity === 'segment' ? segmentCount(w) : 1
    // 劈分权重：先按全井全部有效产出段确定，再进行样本筛选
    let weights: number[] | null = null
    if (c.granularity === 'segment' && c.splitEnabled && productionFields.length) {
      if (c.splitMethod === '等比例') weights = Array(segs).fill(1)
      else if (c.splitMethod === '有效射孔长度') weights = w.perfLen
      else weights = w.kh
      if (!weights || weights.reduce((a, b) => a + b, 0) <= 0) {
        splitBlocks.push(`${w.name}缺少${c.splitMethod === '有效射孔长度' ? '有效射孔区间' : '有效厚度（k×h）'}`)
        weights = null
      }
    }
    const weightSum = weights?.reduce((a, b) => a + b, 0) ?? 0

    // 业务覆盖率：分母为适用业务字段（未投产等业务原因不计入），基础信息不参与
    const applicable = business.filter((id) => coverageOf(w.id, id) !== '未投产')
    const available = applicable.filter((id) => coverageOf(w.id, id) === 'Y')
    const coverage = applicable.length ? Math.round((available.length / applicable.length) * 100) : null

    for (let s = 0; s < segs; s++) {
      const segLabel = c.granularity === 'segment' ? ` / S${s + 1}` : ''
      const object = `${w.name}${segLabel}`
      if (coverage === null || coverage < c.threshold) {
        const miss = applicable.filter((id) => coverageOf(w.id, id) !== 'Y').map((id) => FIELD_MAP[id].name)
        excluded.push({
          key: `${w.id}-${s}`,
          object,
          coverage,
          reason: coverage === null
            ? '无适用业务字段（仅有基础信息或均未投产）'
            : `覆盖率低于阈值 ${c.threshold}%，缺少：${miss.join('、')}`,
        })
        continue
      }

      const cells: Record<string, Cell> = {}
      cells.idx = { text: String(rows.length + 1) }
      cells.well_no = { text: w.name }
      if (c.granularity === 'segment') {
        const base = w.type === '水平井' ? 3420 : 2860
        const top = base + s * (w.type === '水平井' ? 118 : 26)
        cells.batch = { text: 'B1' }
        cells.seg_type = { text: c.interval }
        cells.seg_id = { text: `S${s + 1}` }
        cells.top = { text: fmt(top, 1) }
        cells.bottom = { text: fmt(top + (c.interval === '射孔段' ? (w.perfLen?.[s] ?? 14) : 96), 1) }
      }

      for (const col of columns) {
        if (cells[col.key]) continue
        const [fid, pKey] = col.key.split('@')
        const f = FIELD_MAP[fid]
        if (!f) continue
        if (f.cat === 'basic') {
          cells[col.key] = { text: basicValue(w, fid) }
          continue
        }
        const cov = coverageOf(w.id, fid)
        if (cov === '未投产') { cells[col.key] = { text: '', tag: '未投产' }; continue }
        if (cov === '—') { cells[col.key] = { text: '', tag: '缺失' }; missing++; continue }

        const method = col.method ?? ''
        if (f.kind === 'production') {
          const start = startOf(w, c)
          if (!start) { cells[col.key] = { text: '', tag: '未投产' }; continue }
          const startD = new Date(`${start}T00:00:00`)
          let days: number
          if (pKey === 'all') {
            days = daysBetween(startD, cutoffEnd)
          } else {
            const end = addMonths(start, Number(pKey))
            if (end > cutoffEnd) { cells[col.key] = { text: '', tag: '周期未满' }; immature++; continue }
            days = daysBetween(startD, end)
          }
          const daily = baseValue(w.id, fid)
          let value = method === '日均' ? daily : daily * days
          if (c.granularity === 'segment') {
            if (!c.splitEnabled) { cells[col.key] = { text: '', tag: '未启用劈分' }; continue }
            if (!weights) { cells[col.key] = { text: '', tag: '缺失' }; continue }
            value = (value * weights[s]) / weightSum
            cells[col.key] = { text: fmt(value, method === '日均' ? 3 : 1), tag: '劈分估算' }
            continue
          }
          cells[col.key] = { text: fmt(value, method === '日均' ? 2 : 1) }
          continue
        }

        if (f.kind === 'category') {
          cells[col.key] = { text: hash(`${w.id}${fid}`) > 0.5 ? '中砂岩' : '细砂岩' }
          continue
        }
        const [, , d] = RANGE[fid]
        let v = baseValue(w.id, fid) * (METHOD_FACTOR[method] ?? 1)
        if (c.granularity === 'segment') {
          if (f.kind === 'quantity') v = v / segs
          v = v * (0.92 + 0.16 * hash(`${w.id}${fid}${s}`))
        } else if (f.kind === 'quantity' && method === '均值') {
          v = v / segs
        }
        cells[col.key] = { text: fmt(v, d) }
      }

      rows.push({ key: `${w.id}-${s}`, wellName: w.name, coverage, cells })
    }
  }

  const candidate = rows.length + excluded.length
  const checks: CheckItem[] = [
    { item: '名称、井及业务字段', status: 'pass', detail: `${wells.length} 口井，${business.length} 个业务字段` },
    {
      item: c.granularity === 'segment' ? '井／井段关联标识' : '井关联标识',
      status: 'pass',
      detail: c.granularity === 'segment' ? '井段身份＝井ID＋作业批次＋井段类型＋段ID，未发现冲突' : `井ID映射 ${wells.length}/${wells.length}，未发现同名或别名冲突`,
    },
    {
      item: '区间边界',
      status: 'pass',
      detail: c.granularity === 'segment' ? `${c.interval}顶底深统一为 MD 基准，未发现倒置` : '井级样本，按各字段口径汇总井内数据',
    },
    { item: '类型及单位', status: 'pass', detail: '字段类型与计算方法适配，单位可解析' },
    wells.some((w) => w.id === 'w2') && business.includes('sand')
      ? { item: '来源与关联歧义', status: 'warn', detail: '苏36-12井加砂量存在工程总表与单段实测两个来源，已按单段实测优先并留痕' }
      : { item: '来源与关联歧义', status: 'pass', detail: '未发现多来源冲突' },
    excluded.length
      ? { item: '覆盖筛选', status: 'warn', detail: `${excluded.length} 条记录低于阈值 ${c.threshold}% 已排除，可在排除记录中查看原因` }
      : { item: '覆盖筛选', status: 'pass', detail: `全部记录覆盖率达到阈值 ${c.threshold}%` },
    missing
      ? { item: '普通非关键缺失', status: 'warn', detail: `${missing} 个单元格缺失，记录已满足筛选条件，保留至后续四维质检` }
      : { item: '普通非关键缺失', status: 'pass', detail: '纳入记录无普通缺失' },
    immature
      ? { item: '周期未满', status: 'warn', detail: `${immature} 个周期指标尚未到期，已留空并标识，不计入普通缺失` }
      : { item: '周期未满', status: 'pass', detail: productionFields.length ? '所选周期均已到期' : '未选择生产字段' },
  ]
  if (c.granularity === 'segment' && productionFields.length) {
    checks.push(
      !c.splitEnabled
        ? { item: '劈分权重', status: 'warn', detail: '未启用产量劈分，段级产量留空并标识“未启用劈分”' }
        : splitBlocks.length
          ? { item: '劈分权重', status: 'block', detail: `${splitBlocks.join('；')}，无法按「${c.splitMethod}」计算，不会自动更换方法` }
          : { item: '劈分权重', status: 'pass', detail: `按「${c.splitMethod}」计算，全井分配总量与井级总量一致` },
    )
  }
  checks.push(
    rows.length
      ? { item: '纳入结果', status: 'pass', detail: `纳入 ${rows.length} 条记录` }
      : { item: '纳入结果', status: 'block', detail: '没有记录满足筛选条件，不能创建数据集' },
  )

  return {
    key: configKey(c),
    columns,
    rows,
    excluded,
    checks,
    stats: { candidate, included: rows.length, excluded: excluded.length, immature, missing },
    blocked: checks.some((x) => x.status === 'block'),
  }
}
