// ============================================================
// 字段标准库 / 质控规则库 共享数据源（同一数据源、双视角）
// 依据《字段标准库与质控规则库详细设计》V2.0
// ============================================================

export type Lifecycle = '压前' | '压中' | '压后'
export type FieldCategory =
  | '基础信息' | '地质参数' | '岩石力学参数' | '工程参数' | '衍生参数' | '生产动态参数' | '压中时序'
export type RequireLevel = '必填' | '条件必填' | '可选'
export type ConfirmStatus = '可试运行' | '待业务确认' | '阻断确认'
export type DataType = '文本' | '整数' | '小数' | '日期时间' | '枚举' | '对象'
export type QualityDim = '完整性' | '一致性' | '分布范围' | '相关性'

export const LIFECYCLES: Lifecycle[] = ['压前', '压中', '压后']
export const CATEGORIES: FieldCategory[] = [
  '基础信息', '地质参数', '岩石力学参数', '工程参数', '衍生参数', '生产动态参数', '压中时序',
]
export const REQUIRE_LEVELS: RequireLevel[] = ['必填', '条件必填', '可选']
export const CONFIRM_STATUSES: ConfirmStatus[] = ['可试运行', '待业务确认', '阻断确认']
export const DIMS: QualityDim[] = ['完整性', '一致性', '分布范围', '相关性']

// ── 默认处置方案 ──────────────────────────────────────────────
export interface TreatmentProfile {
  id: string
  name: string
  scene: string
  action: string
  changesValue: string
}
export const TREATMENTS: TreatmentProfile[] = [
  { id: 'TP_MARK_EVIDENCE', name: '标记并保留证据', scene: '通用默认', action: '标记异常、保留原值、生成证据、进入复核队列', changesValue: '否' },
  { id: 'TP_UNIT_NORMALIZE', name: '单位标准化', scene: '唯一低风险单位换算', action: '保留原值并生成标准值、记录转换前后单位', changesValue: '是（仅标准层）' },
  { id: 'TP_BLOCK_IMPORT', name: '阻断导入', scene: '结构/Schema/主键/维度错误', action: '阻断当前数据集/批次进入后续环节', changesValue: '否' },
  { id: 'TP_EXPERT_REVIEW', name: '专家复核', scene: '严重业务矛盾或多规则冲突', action: '创建人工复核任务并展示证据链', changesValue: '否' },
  { id: 'TP_CANDIDATE_VALUE', name: '候选值补全', scene: '公式/模型补全', action: '生成候选值、置信度和来源，不直接采用', changesValue: '否' },
  { id: 'TP_KEEP_TRUE_EXTREME', name: '真实极值保留', scene: '经复核确认的真实极值', action: '标记为真实极值，后续同版本不重复告警', changesValue: '否' },
]

// ── 字段主数据 ────────────────────────────────────────────────
export interface FieldStd {
  code: string
  name: string
  rawName: string
  lifecycle: Lifecycle
  category: FieldCategory
  require: RequireLevel
  status: ConfirmStatus
  dataType: DataType
  unit: string
  // 四维绑定计数（系统派生，不可手填）
  integrity: number
  consistency: number
  distHard: number
  distDynamic: number
  correlation: number
  coverage: number // 已覆盖维度数 0-4
  atomicCount: number
  depFields: number // 相关性依赖字段数
  treatment: string // 默认处置方案 id
  version: string
  updatedAt: string
  updatedBy: string
  definition: string
  boundary: string // 硬边界摘要
  review: string // 专家复核条件
}

// 无动态分布的字段（文本/枚举/对象/时间/序号类）
const NO_DYNAMIC = new Set([
  'WELL_NAME', 'SWEET_SPOT_GRADE', 'FRACTURING_FLUID_SYSTEM', 'PROPPANT_TYPE',
  'PROPPANT_GRAIN_SIZE', 'PERFORATION_PARAMETERS', 'SAMPLE_TIME', 'STAGE_NO',
])

const OWNERS = ['张工', '李工', '王工', '赵工']

// 紧凑种子：[编码, 名称, 生命周期, 分类, 必填级别, 确认状态, 数据类型, 单位, 硬边界摘要]
type Seed = [string, string, Lifecycle, FieldCategory, RequireLevel, ConfirmStatus, DataType, string, string]
const SEED: Seed[] = [
  ['WELL_NAME', '井号', '压前', '基础信息', '必填', '可试运行', '文本', '—', '井号编码规范；非空'],
  ['WELLHEAD_X', '井口坐标X', '压前', '基础信息', '必填', '待业务确认', '小数', 'm', '带内投影坐标范围'],
  ['WELLHEAD_Y', '井口坐标Y', '压前', '基础信息', '必填', '待业务确认', '小数', 'm', '带内投影坐标范围'],
  ['TOTAL_DEPTH', '完钻井深', '压前', '基础信息', '必填', '可试运行', '小数', 'm', '>0；≥水平段起点；≤项目井深上限'],
  ['HORIZONTAL_SECTION_LENGTH', '水平段长', '压前', '基础信息', '必填', '待业务确认', '小数', 'm', '≥0；≤完钻井深'],
  ['SWEET_SPOT_LENGTH', '甜点段长', '压前', '地质参数', '条件必填', '待业务确认', '小数', 'm', '≥0；≤水平段长'],
  ['SWEET_SPOT_GRADE', '甜点级别', '压前', '地质参数', '条件必填', '待业务确认', '枚举', '—', 'I/II/III 受控字典'],
  ['FORMATION_CONDUCTIVITY', '电导', '压前', '地质参数', '可选', '待业务确认', '小数', 'S/m', '含义待确认，暂禁用换算'],
  ['FORMATION_RESISTIVITY', '电阻率', '压前', '地质参数', '条件必填', '待业务确认', '小数', 'Ω·m', '>0'],
  ['GAS_LOG_VALUE', '气测值', '压前', '地质参数', '条件必填', '待业务确认', '小数', '%', '0–100；口径待拆分'],
  ['SHALE_CONTENT', '泥质含量', '压前', '地质参数', '条件必填', '可试运行', '小数', '%', '0–100'],
  ['POROSITY', '孔隙度', '压前', '地质参数', '必填', '待业务确认', '小数', '%', '0–35'],
  ['PERMEABILITY', '渗透率', '压前', '地质参数', '条件必填', '待业务确认', '小数', 'mD', '≥0'],
  ['OIL_SATURATION', '含油饱和度', '压前', '地质参数', '条件必填', '可试运行', '小数', '%', '0–100'],
  ['OIL_LAYER_THICKNESS', '油层厚度', '压前', '地质参数', '条件必填', '可试运行', '小数', 'm', '≥0；≤储层厚度'],
  ['GAS_OIL_RATIO', '气油比', '压前', '地质参数', '条件必填', '待业务确认', '小数', 'm³/m³', '≥0'],
  ['NATURAL_FRACTURE_DENSITY', '天然裂缝密度', '压前', '地质参数', '条件必填', '待业务确认', '小数', '条/m', '≥0'],
  ['SONIC_TRANSIT_TIME', '声波时差', '压前', '岩石力学参数', '条件必填', '待业务确认', '小数', 'μs/m', '>0'],
  ['BULK_DENSITY', '密度', '压前', '岩石力学参数', '条件必填', '可试运行', '小数', 'g/cm³', '1.5–3.2'],
  ['POISSON_RATIO', '泊松比', '压前', '岩石力学参数', '条件必填', '可试运行', '小数', '—', '0–0.5'],
  ['YOUNG_MODULUS', '杨氏模量', '压前', '岩石力学参数', '条件必填', '待业务确认', '小数', 'GPa', '>0'],
  ['BRITTLENESS_INDEX', '脆性指数', '压前', '岩石力学参数', '条件必填', '待业务确认', '小数', '%', '0–100'],
  ['SHEAR_MODULUS', '剪切模量', '压前', '岩石力学参数', '条件必填', '可试运行', '小数', 'GPa', 'G=E/[2(1+ν)]'],
  ['BULK_COMPRESSIBILITY', '体积压缩系数', '压前', '岩石力学参数', '条件必填', '待业务确认', '小数', '1/MPa', 'Cb=3(1-2ν)/E'],
  ['MIN_PRINCIPAL_STRESS', '最小主应力', '压前', '岩石力学参数', '条件必填', '待业务确认', '小数', 'MPa', '>0'],
  ['FRACTURE_TOUGHNESS', '断裂韧性', '压前', '岩石力学参数', '条件必填', '可试运行', '小数', 'MPa·m^0.5', '>0'],
  ['STAGE_SPACING', '段间距', '压前', '工程参数', '必填', '待业务确认', '小数', 'm', '>0'],
  ['CLUSTERS_PER_STAGE', '段内簇数', '压前', '工程参数', '必填', '可试运行', '整数', '个', '≥1'],
  ['HOLES_PER_STAGE', '段内孔数', '压前', '工程参数', '必填', '可试运行', '整数', '个', '≥1；≥簇数'],
  ['FRACTURE_STAGE_LENGTH', '压裂段长', '压前', '工程参数', '必填', '可试运行', '小数', 'm', '>0'],
  ['PAD_FLUID_VOLUME', '前置液量', '压前', '工程参数', '条件必填', '可试运行', '小数', 'm³', '≥0'],
  ['SLURRY_FLUID_VOLUME', '携砂液量', '压前', '工程参数', '条件必填', '待业务确认', '小数', 'm³', '≥0'],
  ['DISPLACEMENT_FLUID_VOLUME', '顶替液量', '压前', '工程参数', '条件必填', '可试运行', '小数', 'm³', '≥0'],
  ['TOTAL_INJECTED_FLUID_VOLUME', '入地总液量', '压前', '工程参数', '必填', '可试运行', '小数', 'm³', '>0；=各阶段液量之和'],
  ['PAD_FLUID_RATIO', '前置液比例', '压前', '工程参数', '条件必填', '可试运行', '小数', '%', '0–100'],
  ['SAND_RATIO', '砂比', '压前', '工程参数', '条件必填', '待业务确认', '小数', '%', '定义待确认，暂禁用0–100硬边界'],
  ['TOTAL_PUMP_RATE', '总排量', '压前', '工程参数', '条件必填', '待业务确认', '小数', 'm³/min', '>0'],
  ['LOW_VISCOSITY_FLUID_CONCENTRATION', '低粘液浓度', '压前', '工程参数', '条件必填', '待业务确认', '小数', '%', '单位待确认'],
  ['HIGH_VISCOSITY_FLUID_CONCENTRATION', '高粘液浓度', '压前', '工程参数', '条件必填', '待业务确认', '小数', '%', '单位待确认'],
  ['FRACTURING_FLUID_SYSTEM', '压裂液体系', '压前', '工程参数', '必填', '待业务确认', '枚举', '—', '受控字典'],
  ['PROPPANT_TYPE', '支撑剂类型', '压前', '工程参数', '必填', '待业务确认', '枚举', '—', '受控字典；复合字段待拆分'],
  ['PROPPANT_GRAIN_SIZE', '支撑剂粒径', '压前', '工程参数', '条件必填', '待业务确认', '文本', '目', '受控字典'],
  ['PERFORATION_PARAMETERS', '射孔参数', '压前', '工程参数', '必填', '待业务确认', '对象', '—', '对象Schema；待原子化'],
  ['TREATED_STAGE_COUNT', '改造段数', '压前', '衍生参数', '必填', '可试运行', '整数', '段', '≥1；≤总段数'],
  ['TOTAL_STAGE_COUNT', '总段数', '压前', '衍生参数', '必填', '待业务确认', '整数', '段', '≥1'],
  ['PROPPANT_AMOUNT', '加砂量', '压前', '衍生参数', '必填', '待业务确认', '小数', 't', '≥0；质量/体积口径待确认'],
  ['PROPPANT_INTENSITY_PER_M', '每米加砂强度', '压前', '衍生参数', '条件必填', '可试运行', '小数', 't/m', '=加砂量/水平段长'],
  ['FLUID_INTENSITY_PER_M', '每米加液强度', '压前', '衍生参数', '条件必填', '可试运行', '小数', 'm³/m', '=入地总液量/水平段长'],
  ['GQ', 'GQ', '压前', '衍生参数', '可选', '阻断确认', '小数', '—', '无定义/单位/公式，仅保留原值'],
  ['ONE_YEAR_CUM_OIL', '1年累计产油', '压前', '生产动态参数', '条件必填', '待业务确认', '小数', 't', '≥0'],
  ['DYNAMIC_FLUID_LEVEL', '动液面', '压前', '生产动态参数', '条件必填', '待业务确认', '小数', 'm', '≥0；≤完钻井深'],
  ['SAMPLE_TIME', '时间', '压中', '压中时序', '必填', '可试运行', '日期时间', '—', '合法时间；单调递增'],
  ['STAGE_NO', '段号', '压中', '压中时序', '必填', '可试运行', '整数', '—', '≥1；≤总段数'],
  ['TREATING_PRESSURE', '压力', '压中', '压中时序', '必填', '待业务确认', '小数', 'MPa', '≥0；≤设备上限'],
  ['INSTANT_PUMP_RATE', '排量', '压中', '压中时序', '必填', '可试运行', '小数', 'm³/min', '≥0'],
  ['PROPPANT_CONCENTRATION', '砂浓', '压中', '压中时序', '条件必填', '待业务确认', '小数', 'kg/m³', '≥0'],
  ['CUM_PROPPANT', '总砂量', '压中', '压中时序', '条件必填', '可试运行', '小数', 't', '单调不减'],
  ['CUM_FLUID', '总液量', '压中', '压中时序', '必填', '可试运行', '小数', 'm³', '单调不减'],
]

const REVIEW_BY_CATEGORY: Record<FieldCategory, string> = {
  '基础信息': '编码/坐标基准不明或跨源差异超容差时复核',
  '地质参数': '测井解释口径不一致或超出岩性合理域时复核',
  '岩石力学参数': '力学参数互算偏差超容差时复核',
  '工程参数': '液量/砂量对账矛盾或量纲不明时复核',
  '衍生参数': '公式输入缺失或结果超设计包络时复核',
  '生产动态参数': '生产口径/基准不明或跨源差异超容差时复核',
  '压中时序': '时序突跳、平台、回退异常时复核',
}

export const FIELDS: FieldStd[] = SEED.map((s, i) => {
  const [code, name, lifecycle, category, require, status, dataType, unit, boundary] = s
  const hasDynamic = !NO_DYNAMIC.has(code)
  const hasCorrelation = code !== 'GQ'
  const integrity = 1
  const consistency = 1
  const distHard = 1
  const distDynamic = hasDynamic ? 1 : 0
  const correlation = hasCorrelation ? 1 : 0
  const coverage =
    (integrity ? 1 : 0) +
    (consistency ? 1 : 0) +
    (distHard || distDynamic ? 1 : 0) +
    (correlation ? 1 : 0)
  const atomicCount = integrity + consistency + distHard + distDynamic + correlation
  const depMap: Record<string, number> = {
    TOTAL_DEPTH: 3, HORIZONTAL_SECTION_LENGTH: 2, SHEAR_MODULUS: 2, BULK_COMPRESSIBILITY: 2,
    TOTAL_INJECTED_FLUID_VOLUME: 3, PAD_FLUID_RATIO: 2, PROPPANT_INTENSITY_PER_M: 2, FLUID_INTENSITY_PER_M: 2,
    TREATED_STAGE_COUNT: 1, CUM_PROPPANT: 1, CUM_FLUID: 1, HOLES_PER_STAGE: 1,
  }
  return {
    code, name, rawName: name, lifecycle, category, require, status, dataType, unit,
    integrity, consistency, distHard, distDynamic, correlation, coverage, atomicCount,
    depFields: hasCorrelation ? (depMap[code] ?? 1) : 0,
    treatment: 'TP_MARK_EVIDENCE',
    version: 'V0.1',
    updatedAt: `2026-07-${String((i % 27) + 1).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
    updatedBy: OWNERS[i % OWNERS.length],
    definition: `${name}（${code}）：保留来源口径，明确统计对象、时段与基准；${require}。`,
    boundary,
    review: REVIEW_BY_CATEGORY[category],
  }
})

// ── 指标（字段标准库）──────────────────────────────────────────
export const FIELD_METRICS = {
  total: FIELDS.length,
  fullCoverage: FIELDS.filter((f) => f.coverage === 4).length,
  gap: FIELDS.filter((f) => f.coverage < 4).length,
  testable: FIELDS.filter((f) => f.status === '可试运行').length,
  pending: FIELDS.filter((f) => f.status === '待业务确认').length,
  blocked: FIELDS.filter((f) => f.status === '阻断确认').length,
  ruleTotal: FIELDS.reduce((sum, f) => sum + f.atomicCount, 0),
}

// ── 原子规则（质控规则库）─────────────────────────────────────
export type RuleStatus = '草案待确认' | '建议启用' | '试运行' | '已启用' | '停用'
export type AnomalyLevel = '一般' | '严重' | '阻断'

export interface QCRule {
  code: string
  name: string
  fieldCode: string
  fieldName: string
  lifecycle: Lifecycle
  dim: QualityDim
  ruleType: string
  expr: string
  params: string
  level: AnomalyLevel
  action: string
  review: string
  status: RuleStatus
  version: string
  updatedAt: string
  updatedBy: string
}

function ruleStatusOf(f: FieldStd): RuleStatus {
  return f.status === '可试运行' ? '建议启用' : '草案待确认'
}

export const RULES: QCRule[] = FIELDS.flatMap((f) => {
  const out: QCRule[] = []
  const base = { fieldCode: f.code, fieldName: f.name, lifecycle: f.lifecycle, updatedAt: f.updatedAt, updatedBy: f.updatedBy }
  const st = ruleStatusOf(f)
  // 完整性
  out.push({
    ...base, code: `QC_C_${f.code}_REQ`, name: `${f.name}完整性检查`, dim: '完整性', ruleType: f.require,
    expr: `当${f.require === '必填' ? '记录存在' : '触发条件满足'}时，[${f.name}] 不得为空值集合（NULL/空串/NaN/哨兵）`,
    params: `缺失率阈值≥5% 数据集告警${f.require === '必填' ? '；关键字段单条命中' : ''}`,
    level: f.require === '必填' ? '严重' : '一般', action: '标记并保留证据', review: '严重100%复核',
    status: st, version: 'V0.1',
  })
  // 一致性
  out.push({
    ...base, code: `QC_I_${f.code}_TYPE_UNIT`, name: `${f.name}类型单位检查`, dim: '一致性', ruleType: '类型/单位',
    expr: `[${f.name}] 须为${f.dataType}${f.unit !== '—' ? `，标准单位 ${f.unit}` : ''}，来源量纲一致且可追溯`,
    params: f.unit !== '—' ? `允许来源单位换算，默认不自动标准化` : '格式/编码校验',
    level: '一般', action: '标记异常（唯一低风险换算可标准化）', review: '按比例抽样',
    status: st, version: 'V0.1',
  })
  // 分布范围 - 硬边界
  out.push({
    ...base, code: `QC_R_${f.code}_HARD`, name: `${f.name}硬边界检查`, dim: '分布范围', ruleType: '硬边界/Schema',
    expr: `[${f.name}] 须满足硬边界：${f.boundary}`,
    params: '越界即命中，不做截断替换',
    level: '严重', action: '标记越界；不删除', review: '严重100%复核',
    status: f.status === '阻断确认' ? '草案待确认' : st, version: 'V0.1',
  })
  // 分布范围 - 动态分布
  if (f.distDynamic) {
    out.push({
      ...base, code: `QC_R_${f.code}_DYNAMIC`, name: `${f.name}动态分布检查`, dim: '分布范围', ruleType: '动态分布',
      expr: `同组 P10–P90 正常带；IQR 1.5 预警 / 3.0 严重候选；|M|>3.5 标记候选`,
      params: `分组：区块+层系+井型${f.category === '工程参数' ? '+液体系+支撑剂' : f.category === '生产动态参数' ? '+生产年份' : ''}；n≥30`,
      level: '一般', action: '标记尾部/离群候选；转相关性验证', review: 'n<30 仅提示并转复核',
      status: st, version: 'V0.1',
    })
  }
  // 相关性
  if (f.correlation) {
    out.push({
      ...base, code: `QC_B_${f.code}_CROSS`, name: `${f.name}相关性/业务逻辑检查`, dim: '相关性', ruleType: '跨字段逻辑',
      expr: `[${f.name}] 与 ${f.depFields} 个依赖字段满足业务公式/配套/时序关系`,
      params: '容差取项目设计包络；分母>0 等适用条件',
      level: '严重', action: '标记业务矛盾；展示证据链；不自动改值', review: '严重100%复核',
      status: st, version: 'V0.1',
    })
  }
  return out
})

export const RULE_METRICS = {
  total: RULES.length,
  suggested: RULES.filter((r) => r.status === '建议启用').length,
  draft: RULES.filter((r) => r.status === '草案待确认').length,
  fullFields: FIELDS.filter((f) => f.coverage === 4).length,
  blockedFields: FIELDS.filter((f) => f.status === '阻断确认').length,
}

// ── 业务计算逻辑（20 条）──────────────────────────────────────
export interface BusinessLogic {
  code: string
  name: string
  fields: string
  formula: string
  condition: string
  standard: string
  risk: string
  status: '建议启用' | '草案待确认' | '阻断确认'
  refCount: number
}
export const BUSINESS_LOGICS: BusinessLogic[] = [
  { code: 'BL_COND_RES', name: '电导-电阻率倒数关系', fields: '电导, 电阻率', formula: '电导 = 1 / 电阻率', condition: '电阻率>0', standard: '相对误差≤5%', risk: '电导含义不明确', status: '阻断确认', refCount: 2 },
  { code: 'BL_SWEET', name: '甜点段累计长度关系', fields: '甜点段长, 水平段长', formula: 'Σ甜点段长 ≤ 水平段长', condition: '同井对象', standard: '不得超出', risk: '解释口径差异', status: '建议启用', refCount: 1 },
  { code: 'BL_FRAC_DENS', name: '天然裂缝密度关系', fields: '天然裂缝密度, 水平段长', formula: '裂缝条数 = 密度 × 段长', condition: '段长>0', standard: '相对误差≤10%', risk: '成像测井缺失', status: '草案待确认', refCount: 1 },
  { code: 'BL_GOR', name: '气油比配套关系', fields: '气油比, 日产气量, 产油量', formula: 'GOR = 产气量 / 产油量', condition: '产油量>0', standard: '相对误差≤8%', risk: '计量口径差异', status: '草案待确认', refCount: 1 },
  { code: 'BL_SHEAR', name: '剪切模量公式', fields: '剪切模量, 杨氏模量, 泊松比', formula: 'G = E / [2(1+ν)]', condition: 'ν∈(0,0.5)', standard: '相对误差≤5%', risk: '力学参数来源不一', status: '建议启用', refCount: 1 },
  { code: 'BL_CB', name: '体积压缩系数公式', fields: '体积压缩系数, 杨氏模量, 泊松比', formula: 'Cb = 3(1-2ν) / E', condition: 'E>0', standard: '相对误差≤5%', risk: '参数缺失', status: '草案待确认', refCount: 1 },
  { code: 'BL_INJ_SUM', name: '入地总液量积分', fields: '入地总液量, 排量, 时间', formula: '入地总液量 = ∫ 排量 dt', condition: '同段时序连续', standard: '相对误差≤3%', risk: '采样间隔不均', status: '建议启用', refCount: 2 },
  { code: 'BL_STAGE_BAL', name: '阶段液量平衡', fields: '入地总液量, 前置液量, 携砂液量, 顶替液量', formula: '总液量 = 前置+携砂+顶替', condition: '同段', standard: '相对误差≤2%', risk: '阶段划分不一致', status: '建议启用', refCount: 1 },
  { code: 'BL_PAD_RATIO', name: '前置液比例', fields: '前置液比例, 前置液量, 入地总液量', formula: '前置液比例 = 前置液量 / 入地总液量 ×100%', condition: '入地总液量>0', standard: '相对误差≤2%', risk: '分母为0', status: '建议启用', refCount: 1 },
  { code: 'BL_CUM_FLUID', name: '累计液量对账', fields: '总液量, 入地总液量', formula: '末值总液量 ≈ 入地总液量', condition: '同段', standard: '相对误差≤3%', risk: '时序缺测', status: '建议启用', refCount: 1 },
  { code: 'BL_CUM_SAND', name: '累计砂量对账', fields: '总砂量, 加砂量', formula: '末值总砂量 ≈ 加砂量', condition: '同段', standard: '相对误差≤3%', risk: '单位口径不一', status: '草案待确认', refCount: 1 },
  { code: 'BL_SAND_INT', name: '每米加砂强度', fields: '每米加砂强度, 加砂量, 水平段长', formula: '强度 = 加砂量 / 水平段长', condition: '段长>0', standard: '相对误差≤2%', risk: '加砂量口径不一', status: '建议启用', refCount: 1 },
  { code: 'BL_FLUID_INT', name: '每米加液强度', fields: '每米加液强度, 入地总液量, 水平段长', formula: '强度 = 入地总液量 / 水平段长', condition: '段长>0', standard: '相对误差≤2%', risk: '分母为0', status: '建议启用', refCount: 1 },
  { code: 'BL_STAGE_REL', name: '段数关系', fields: '改造段数, 总段数', formula: '改造段数 ≤ 总段数', condition: '同井', standard: '不得超出', risk: '统计口径差异', status: '建议启用', refCount: 1 },
  { code: 'BL_PERF', name: '射孔簇孔关系', fields: '段内孔数, 段内簇数', formula: '孔数 ≥ 簇数', condition: '同段', standard: '不得低于', risk: '射孔集合字段未拆分', status: '草案待确认', refCount: 1 },
  { code: 'BL_CUM_OIL', name: '1年累计产油', fields: '1年累计产油, 日产油量', formula: 'Σ 前365天日产油', condition: '连续生产记录', standard: '相对误差≤5%', risk: '生产中断', status: '草案待确认', refCount: 1 },
  { code: 'BL_PRESSURE', name: '施工压力关系', fields: '压力, 最小主应力', formula: '施工压力 > 破裂压力', condition: '同段时序', standard: '设计包络内', risk: '基准不一致', status: '草案待确认', refCount: 1 },
  { code: 'BL_GQ', name: 'GQ 计算', fields: 'GQ', formula: '待定义', condition: '待定义', standard: '待定义', risk: '无定义/单位/公式', status: '阻断确认', refCount: 1 },
  { code: 'BL_TS_MONO', name: '时序单调性', fields: '总液量, 总砂量, 时间', formula: '累计量随时间单调不减', condition: '同段', standard: '回退需说明', risk: '回退/返工', status: '建议启用', refCount: 2 },
  { code: 'BL_DFL', name: '动液面基准校验', fields: '动液面, 完钻井深', formula: '动液面 ≤ 完钻井深', condition: '基准明确', standard: '不得超出', risk: '基准/测量状态不明', status: '草案待确认', refCount: 1 },
]

// ── 口径待确认（11 项）────────────────────────────────────────
export interface IssueItem {
  code: string
  title: string
  handling: string
  impact: string
  blocking: boolean
  owner: string
  status: '待确认' | '处理中' | '已关闭'
}
export const ISSUES: IssueItem[] = [
  { code: 'I001', title: '47项与58个原子字段口径不一致', handling: '保留58字段并显示来源名称', impact: '阻断正式清单发布', blocking: true, owner: '数据标准管理员', status: '处理中' },
  { code: 'I002', title: '电导含义不明确', handling: '暂按地层电导率；关联逻辑禁用', impact: '阻断相关规则启用', blocking: true, owner: '地质专家', status: '待确认' },
  { code: 'I003', title: '气测值类型、单位、统计口径不明', handling: '通用字段待拆分', impact: '高优先确认', blocking: false, owner: '地质专家', status: '待确认' },
  { code: 'I004', title: '砂比定义不明确', handling: '不启用0—100%硬边界和换算', impact: '阻断规则启用', blocking: true, owner: '工程专家', status: '待确认' },
  { code: 'I005', title: '低/高粘浓度单位不明', handling: '拆成两个原子字段', impact: '高优先确认', blocking: false, owner: '工程专家', status: '待确认' },
  { code: 'I006', title: '支撑剂类型与粒径为复合字段', handling: '拆分并预留混配比例', impact: '高优先确认', blocking: false, owner: '工程专家', status: '待确认' },
  { code: 'I007', title: '射孔参数为集合字段', handling: '暂用对象Schema', impact: '高优先确认', blocking: false, owner: '工程专家', status: '待确认' },
  { code: 'I008', title: '加砂量质量/体积口径不一', handling: '建议标准单位t', impact: '阻断单位转换', blocking: true, owner: '工程专家', status: '待确认' },
  { code: 'I009', title: 'GQ无定义、单位和公式', handling: '仅保留原值', impact: '阻断发布、评分和自动处理', blocking: true, owner: '数据标准管理员', status: '待确认' },
  { code: 'I010', title: '动液面基准和测量状态不明', handling: '先做条件非负/井深校验', impact: '高优先确认', blocking: false, owner: '生产专家', status: '待确认' },
  { code: 'I011', title: '动态边界需要同类样本', handling: 'n<30只提示', impact: '试运行标定', blocking: false, owner: '规则设计师', status: '处理中' },
]
export const ISSUE_COUNT = ISSUES.length
export const BLOCKING_ISSUE_COUNT = ISSUES.filter((i) => i.blocking).length
