'use client'

import { useMemo, useState } from 'react'

// ─── 类型 ────────────────────────────────────────────────────────────────────
type FieldStatus = '草稿' | '启用' | '停用' | '已归档'
type FieldCategory = '基础信息' | '地质参数' | '工程参数' | '生产参数' | '文档资料'
type DataType = '整数' | '小数' | '文本' | '日期' | '日期时间' | '布尔' | '枚举' | '对象'

interface FieldStd {
  id: string
  name: string
  code: string
  category: FieldCategory
  subCategory: string
  dataType: DataType
  typeDetail: string
  stdValue: string
  mappingCount: number
  ruleEnabled: number
  ruleTotal: number
  status: FieldStatus
  version: string
  updatedAt: string
  updatedBy: string
  owner: string
  level: '企业级' | '油田级' | '项目级'
  definition: string
}

// ─── 模拟数据 ─────────────────────────────────────────────────────────────────
const MOCK_FIELDS: FieldStd[] = [
  { id: '1', name: '单井入地液量', code: 'INJECTED_FLUID_VOLUME', category: '工程参数', subCategory: '压裂施工', dataType: '小数', typeDetail: '小数 · 2 位', stdValue: 'm³；0–50,000', mappingCount: 5, ruleEnabled: 6, ruleTotal: 6, status: '启用', version: 'V1.3', updatedAt: '2026-07-12 16:30', updatedBy: '张工', owner: '张工', level: '油田级', definition: '单井压裂施工累计注入地层的液体总量，统计口径为整个施工周期。' },
  { id: '2', name: '油层厚度', code: 'OIL_LAYER_THICKNESS', category: '地质参数', subCategory: '储层', dataType: '小数', typeDetail: '小数 · 2 位', stdValue: 'm；0–80', mappingCount: 3, ruleEnabled: 5, ruleTotal: 5, status: '启用', version: 'V1.1', updatedAt: '2026-07-10 09:12', updatedBy: '李工', owner: '李工', level: '油田级', definition: '测井解释得到的有效油层垂直厚度。' },
  { id: '3', name: '井名', code: 'WELL_NAME', category: '基础信息', subCategory: '井', dataType: '文本', typeDetail: '文本 · 最长 64', stdValue: '井号编码规范', mappingCount: 8, ruleEnabled: 3, ruleTotal: 3, status: '启用', version: 'V2.0', updatedAt: '2026-07-08 11:40', updatedBy: '张工', owner: '张工', level: '企业级', definition: '井的唯一业务标识名称，遵循集团井号编码规范。' },
  { id: '4', name: '加砂量', code: 'PROPPANT_VOLUME', category: '工程参数', subCategory: '压裂施工', dataType: '小数', typeDetail: '小数 · 1 位', stdValue: 'm³；0–5,000', mappingCount: 4, ruleEnabled: 3, ruleTotal: 4, status: '启用', version: 'V1.0', updatedAt: '2026-07-05 15:20', updatedBy: '王工', owner: '王工', level: '油田级', definition: '压裂施工过程中加入的支撑剂总体积。' },
  { id: '5', name: '完井日期', code: 'COMPLETION_DATE', category: '基础信息', subCategory: '井', dataType: '日期', typeDetail: '日期 · YYYY-MM-DD', stdValue: '不晚于当前日期', mappingCount: 2, ruleEnabled: 0, ruleTotal: 2, status: '草稿', version: 'V0.1', updatedAt: '2026-07-14 10:05', updatedBy: '赵工', owner: '赵工', level: '项目级', definition: '井完钻并完成井筒作业的日期。' },
  { id: '6', name: '孔隙度', code: 'POROSITY', category: '地质参数', subCategory: '储层', dataType: '小数', typeDetail: '小数 · 2 位', stdValue: '%；0–35', mappingCount: 6, ruleEnabled: 4, ruleTotal: 4, status: '停用', version: 'V1.2', updatedAt: '2026-06-28 14:18', updatedBy: '李工', owner: '李工', level: '油田级', definition: '储层岩石孔隙体积占岩石总体积的百分比。' },
  { id: '7', name: '日产气量', code: 'DAILY_GAS_RATE', category: '生产参数', subCategory: '生产动态', dataType: '小数', typeDetail: '小数 · 2 位', stdValue: '10⁴m³/d；0–200', mappingCount: 7, ruleEnabled: 5, ruleTotal: 6, status: '启用', version: 'V1.4', updatedAt: '2026-07-15 08:50', updatedBy: '王工', owner: '王工', level: '油田级', definition: '单井单日天然气产量。' },
  { id: '8', name: '施工报告', code: 'FRAC_REPORT_DOC', category: '文档资料', subCategory: '施工文档', dataType: '对象', typeDetail: '对象 · 附件', stdValue: 'PDF/DOC', mappingCount: 1, ruleEnabled: 0, ruleTotal: 1, status: '已归档', version: 'V1.0', updatedAt: '2026-05-20 17:02', updatedBy: '赵工', owner: '赵工', level: '项目级', definition: '压裂施工完成后归档的施工总结报告文档。' },
]

const CATEGORIES: FieldCategory[] = ['基础信息', '地质参数', '工程参数', '生产参数', '文档资料']
const DATA_TYPES: DataType[] = ['整数', '小数', '文本', '日期', '日期时间', '布尔', '枚举', '对象']
const STATUSES: FieldStatus[] = ['草稿', '启用', '停用', '已归档']

const STATUS_CLASS: Record<FieldStatus, string> = {
  '草稿': 'lib-badge--draft',
  '启用': 'lib-badge--enabled',
  '停用': 'lib-badge--disabled',
  '已归档': 'lib-badge--archived',
}

// ─── 新建/编辑弹窗 ────────────────────────────────────────────────────────────
type DialogTab = 'define' | 'unit' | 'mapping'

interface FieldDialogProps {
  field: FieldStd | null
  mode: 'create' | 'edit' | 'view'
  onClose: () => void
  onSave: (f: FieldStd) => void
}

function FieldDialog({ field, mode, onClose, onSave }: FieldDialogProps) {
  const [tab, setTab] = useState<DialogTab>('define')
  const [name, setName] = useState(field?.name ?? '')
  const [code, setCode] = useState(field?.code ?? '')
  const [category, setCategory] = useState<FieldCategory>(field?.category ?? '工程参数')
  const [subCategory, setSubCategory] = useState(field?.subCategory ?? '')
  const [enName, setEnName] = useState('')
  const [owner, setOwner] = useState(field?.owner ?? '张工')
  const [level, setLevel] = useState(field?.level ?? '油田级')
  const [dataType, setDataType] = useState<DataType>(field?.dataType ?? '小数')
  const [definition, setDefinition] = useState(field?.definition ?? '')
  const [aliases, setAliases] = useState<string[]>(['入地液量', '单井液量'])
  const [requireLevel, setRequireLevel] = useState<'必填' | '条件必填' | '可选'>('必填')
  const [unit, setUnit] = useState('m³')
  const [dimension, setDimension] = useState('体积')
  const [lower, setLower] = useState('0')
  const [upper, setUpper] = useState('50000')
  const [nameErr, setNameErr] = useState('')

  const isEnabledEdit = mode === 'edit' && field?.status === '启用'
  const readOnly = mode === 'view'
  const title = mode === 'create' ? '新建标准字段' : mode === 'view' ? '查看标准字段' : '编辑标准字段'

  const handleSave = () => {
    if (!name.trim()) { setNameErr('字段名称不能为空'); setTab('define'); return }
    if (!code.trim()) { setNameErr(''); return }
    const next: FieldStd = {
      id: field?.id ?? String(Date.now()),
      name: name.trim(), code: code.trim().toUpperCase(), category, subCategory: subCategory || '通用',
      dataType, typeDetail: `${dataType}${dataType === '小数' ? ' · 2 位' : ''}`,
      stdValue: dataType === '小数' || dataType === '整数' ? `${unit}；${lower}–${upper}` : '—',
      mappingCount: field?.mappingCount ?? 0,
      ruleEnabled: field?.ruleEnabled ?? 0, ruleTotal: field?.ruleTotal ?? 0,
      status: isEnabledEdit ? '草稿' : (field?.status ?? '草稿'),
      version: isEnabledEdit ? 'V1.4' : (field?.version ?? 'V0.1'),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16).replace(/\//g, '-'),
      updatedBy: '张工', owner, level, definition,
    }
    onSave(next)
  }

  return (
    <div className="lib-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="lib-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="lib-dialog-header">
          <span className="md-typescale-title-medium lib-dialog-title">{title}</span>
          <button className="lib-icon-btn" onClick={onClose} aria-label="关闭"><md-icon>close</md-icon></button>
        </div>

        {isEnabledEdit && (
          <div className="lib-dialog-notice">
            <md-icon>info</md-icon>
            当前为已启用版本 {field?.version}，保存修改将生成新草稿版本 V1.4。
          </div>
        )}

        <div className="lib-dialog-body">
          {/* 顶部基础信息（三列栅格） */}
          <div className="lib-form-grid">
            <div className="lib-field">
              <label className="lib-label">标准字段名称<span className="lib-required">*</span></label>
              <input className={`lib-input${nameErr ? ' lib-input--error' : ''}`} value={name} disabled={readOnly}
                onChange={e => { setName(e.target.value); setNameErr('') }} placeholder="如：单井入地液量" />
              {nameErr && <span className="lib-error-msg">{nameErr}</span>}
            </div>
            <div className="lib-field">
              <label className="lib-label">字段编码<span className="lib-required">*</span></label>
              <input className="lib-input lib-input--mono" value={code} disabled={readOnly || isEnabledEdit}
                onChange={e => setCode(e.target.value.toUpperCase())} placeholder="INJECTED_FLUID_VOLUME" />
              {isEnabledEdit && <span className="lib-hint">启用后编码不可修改</span>}
            </div>
            <div className="lib-field">
              <label className="lib-label">字段分类<span className="lib-required">*</span></label>
              <div className="lib-cascader">
                <select className="lib-select" value={category} disabled={readOnly}
                  onChange={e => setCategory(e.target.value as FieldCategory)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="lib-input" value={subCategory} disabled={readOnly}
                  onChange={e => setSubCategory(e.target.value)} placeholder="子类，如 压裂施工" />
              </div>
            </div>
            <div className="lib-field">
              <label className="lib-label">英文名称</label>
              <input className="lib-input" value={enName} disabled={readOnly}
                onChange={e => setEnName(e.target.value)} placeholder="Injected Fluid Volume" />
            </div>
            <div className="lib-field">
              <label className="lib-label">标准责任人<span className="lib-required">*</span></label>
              <select className="lib-select" value={owner} disabled={readOnly} onChange={e => setOwner(e.target.value)}>
                <option>张工</option><option>李工</option><option>王工</option><option>赵工</option>
              </select>
            </div>
            <div className="lib-field">
              <label className="lib-label">标准级别<span className="lib-required">*</span></label>
              <select className="lib-select" value={level} disabled={readOnly}
                onChange={e => setLevel(e.target.value as FieldStd['level'])}>
                <option>企业级</option><option>油田级</option><option>项目级</option>
              </select>
            </div>
          </div>

          {/* 页签 */}
          <div className="lib-tabs" role="tablist">
            {([['define', '定义标准'], ['unit', '单位与值域'], ['mapping', '映射与规则']] as const).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k}
                className={`lib-tab${tab === k ? ' lib-tab--active' : ''}`} onClick={() => setTab(k as DialogTab)}>
                {label}
              </button>
            ))}
          </div>

          {/* 页签一：定义标准 */}
          {tab === 'define' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />业务定义</div>
              <div className="lib-field">
                <label className="lib-label">字段业务定义<span className="lib-required">*</span></label>
                <textarea className="lib-textarea" rows={3} value={definition} disabled={readOnly}
                  onChange={e => setDefinition(e.target.value)} maxLength={500}
                  placeholder="说明统计口径、时间口径和业务含义，最多 500 字" />
              </div>
              <div className="lib-field">
                <label className="lib-label">常用别名</label>
                <div className="lib-tag-input">
                  {aliases.map(a => (
                    <span key={a} className="lib-tag">{a}
                      {!readOnly && <button onClick={() => setAliases(aliases.filter(x => x !== a))} aria-label={`移除${a}`}><md-icon>close</md-icon></button>}
                    </span>
                  ))}
                  {!readOnly && <input className="lib-tag-add" placeholder="输入后回车添加"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        const v = (e.target as HTMLInputElement).value.trim()
                        if (v) { setAliases([...aliases, v]); (e.target as HTMLInputElement).value = '' }
                      }
                    }} />}
                </div>
              </div>

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--success" />类型定义</div>
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">数据类型<span className="lib-required">*</span></label>
                  <select className="lib-select" value={dataType} disabled={readOnly}
                    onChange={e => setDataType(e.target.value as DataType)}>
                    {DATA_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {(dataType === '小数' || dataType === '整数') && (
                  <div className="lib-field">
                    <label className="lib-label">长度 / 精度</label>
                    <input className="lib-input" disabled={readOnly} placeholder="总长 12 · 小数 2 位" defaultValue="12 · 2" />
                  </div>
                )}
                {(dataType === '日期' || dataType === '日期时间') && (
                  <div className="lib-field">
                    <label className="lib-label">日期格式</label>
                    <select className="lib-select" disabled={readOnly}>
                      <option>YYYY-MM-DD</option><option>YYYY-MM-DD HH:mm:ss</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--warning" />空值定义</div>
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">默认必填级别<span className="lib-required">*</span></label>
                  <select className="lib-select" value={requireLevel} disabled={readOnly}
                    onChange={e => setRequireLevel(e.target.value as typeof requireLevel)}>
                    <option>必填</option><option>条件必填</option><option>可选</option>
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">空值识别</label>
                  <input className="lib-input" disabled={readOnly} defaultValue="NULL、空字符串、-9999" />
                </div>
                <div className="lib-field">
                  <label className="lib-label">零值含义</label>
                  <select className="lib-select" disabled={readOnly}>
                    <option>有效值</option><option>等同缺失</option><option>按场景判断</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 页签二：单位与值域 */}
          {tab === 'unit' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />单位设置</div>
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">物理量纲<span className="lib-required">*</span></label>
                  <select className="lib-select" value={dimension} disabled={readOnly}
                    onChange={e => setDimension(e.target.value)}>
                    <option>长度</option><option>面积</option><option>体积</option><option>质量</option>
                    <option>压力</option><option>温度</option><option>时间</option><option>无量纲</option>
                  </select>
                </div>
                <div className="lib-field">
                  <label className="lib-label">标准单位<span className="lib-required">*</span></label>
                  <input className="lib-input" value={unit} disabled={readOnly}
                    onChange={e => setUnit(e.target.value)} placeholder="m³" />
                </div>
                <div className="lib-field">
                  <label className="lib-label">展示精度</label>
                  <input className="lib-input" type="number" disabled={readOnly} defaultValue={2} />
                </div>
              </div>

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--success" />来源单位换算表</div>
              <table className="lib-inner-table">
                <thead>
                  <tr><th>来源单位</th><th>换算方式</th><th>换算公式</th><th>自动转换</th><th>复核要求</th><th aria-label="操作" /></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>L</td><td>固定系数</td><td className="lib-input--mono">x / 1000</td>
                    <td><span className="lib-badge lib-badge--enabled">开启</span></td><td>无需复核</td>
                    <td><button className="lib-row-icon" aria-label="删除"><md-icon>delete</md-icon></button></td>
                  </tr>
                  <tr>
                    <td>t</td><td>参数公式</td><td className="lib-input--mono">x / 砂密度</td>
                    <td><span className="lib-badge lib-badge--disabled">关闭</span></td><td>全部复核</td>
                    <td><button className="lib-row-icon" aria-label="删除"><md-icon>delete</md-icon></button></td>
                  </tr>
                </tbody>
              </table>
              {!readOnly && <button className="lib-btn lib-btn--ghost lib-btn--sm"><md-icon>add</md-icon>添加换算</button>}

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--warning" />值域设置（数值型）</div>
              <div className="lib-form-grid">
                <div className="lib-field">
                  <label className="lib-label">物理下限</label>
                  <input className="lib-input" value={lower} disabled={readOnly} onChange={e => setLower(e.target.value)} />
                </div>
                <div className="lib-field">
                  <label className="lib-label">物理上限</label>
                  <input className="lib-input" value={upper} disabled={readOnly} onChange={e => setUpper(e.target.value)} />
                </div>
                <div className="lib-field">
                  <label className="lib-label">推荐业务范围</label>
                  <input className="lib-input" disabled={readOnly} placeholder="如 500–20,000" />
                </div>
              </div>
            </div>
          )}

          {/* 页签三：映射与规则 */}
          {tab === 'mapping' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />来源字段映射</div>
              <table className="lib-inner-table">
                <thead>
                  <tr><th>数据来源</th><th>来源表/对象</th><th>来源字段</th><th>转换处理</th><th>生效范围</th><th>状态</th></tr>
                </thead>
                <tbody>
                  <tr><td>钻井库</td><td>WELL_FRAC</td><td className="lib-input--mono">INJ_VOL</td><td>单位换算</td><td>全局</td><td><span className="lib-badge lib-badge--enabled">启用</span></td></tr>
                  <tr><td>生产动态库</td><td>PROD_DAILY</td><td className="lib-input--mono">FLUID_M3</td><td>无</td><td>苏里格</td><td><span className="lib-badge lib-badge--enabled">启用</span></td></tr>
                  <tr><td>施工文档库</td><td>FRAC_DOC</td><td className="lib-input--mono">liquid_vol</td><td>格式转换</td><td>全局</td><td><span className="lib-badge lib-badge--draft">草稿</span></td></tr>
                </tbody>
              </table>

              <div className="lib-section-title lib-section-title--between">
                <span><span className="lib-section-bar lib-bar--success" />关联质检规则</span>
                {!readOnly && <button className="lib-btn lib-btn--ghost lib-btn--sm"><md-icon>link</md-icon>关联规则</button>}
              </div>
              <table className="lib-inner-table">
                <thead>
                  <tr><th>规则名称/编码</th><th>质量维度</th><th>绑定角色</th><th>参数覆盖</th><th>状态</th></tr>
                </thead>
                <tbody>
                  <tr><td><div className="lib-cell-name">单井入地液量单位量级检查<span className="lib-cell-code">CONSISTENCY_INJECTED_FLUID</span></div></td><td>一致性</td><td>主校验字段</td><td>默认继承</td><td><span className="lib-badge lib-badge--enabled">启用</span></td></tr>
                  <tr><td><div className="lib-cell-name">入地液量合理范围检查<span className="lib-cell-code">RANGE_INJECTED_FLUID</span></div></td><td>分布范围</td><td>主校验字段</td><td>已覆盖 2 项</td><td><span className="lib-badge lib-badge--enabled">启用</span></td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="lib-dialog-footer">
          {readOnly ? (
            <>
              <button className="lib-btn lib-btn--ghost" onClick={onClose}>关闭</button>
              <button className="lib-btn lib-btn--primary" onClick={handleSave}><md-icon>content_copy</md-icon>复制为新字段</button>
            </>
          ) : (
            <>
              <button className="lib-btn lib-btn--ghost" onClick={onClose}>取消</button>
              <button className="lib-btn lib-btn--tonal" onClick={handleSave}>{isEnabledEdit ? '保存为新版本' : '保存草稿'}</button>
              <button className="lib-btn lib-btn--primary" onClick={handleSave}><md-icon>check</md-icon>保存并提交启用</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export function FieldStandardLibrary() {
  const [fields, setFields] = useState<FieldStd[]>(MOCK_FIELDS)
  const [search, setSearch] = useState('')
  const [fCat, setFCat] = useState<FieldCategory | '全部分类'>('全部分类')
  const [fType, setFType] = useState<DataType | '全部类型'>('全部类型')
  const [fStatus, setFStatus] = useState<FieldStatus | '全部状态'>('全部状态')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit' | 'view'; field: FieldStd | null } | null>(null)

  const filtered = useMemo(() => fields.filter(f => {
    const s = search.trim().toLowerCase()
    const matchSearch = !s || f.name.toLowerCase().includes(s) || f.code.toLowerCase().includes(s)
    return matchSearch && (fCat === '全部分类' || f.category === fCat)
      && (fType === '全部类型' || f.dataType === fType)
      && (fStatus === '全部状态' || f.status === fStatus)
  }), [fields, search, fCat, fType, fStatus])

  const enabledCount = fields.filter(f => f.status === '启用').length
  const draftCount = fields.filter(f => f.status === '草稿').length
  const activeFilters = (search ? 1 : 0) + (fCat !== '全部分类' ? 1 : 0) + (fType !== '全部类型' ? 1 : 0) + (fStatus !== '全部状态' ? 1 : 0)

  const handleReset = () => { setSearch(''); setFCat('全部分类'); setFType('全部类型'); setFStatus('全部状态') }
  const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(p => p.size === filtered.length ? new Set() : new Set(filtered.map(f => f.id)))
  const toggleStatus = (id: string) => setFields(p => p.map(f => f.id === id ? { ...f, status: f.status === '启用' ? '停用' : '启用' } : f))

  const handleSave = (f: FieldStd) => {
    setFields(p => dialog?.mode === 'create' ? [f, ...p] : p.map(x => x.id === f.id ? f : x))
    setDialog(null)
  }

  return (
    <div className="lib-center">
      {/* 页面头部 */}
      <div className="lib-page-header">
        <div className="lib-breadcrumb md-typescale-label-medium">
          <md-icon>tune</md-icon>质检配置<md-icon class="lib-bc-sep">chevron_right</md-icon>
          <span className="lib-bc-current">字段标准库</span>
        </div>
        <div className="lib-page-header-row">
          <div>
            <h1 className="md-typescale-headline-small lib-page-title">字段标准库</h1>
            <p className="md-typescale-body-medium lib-page-subtitle">统一维护字段定义、类型、单位、值域、来源映射及关联质检规则</p>
          </div>
          <div className="lib-header-actions">
            <button className="lib-btn lib-btn--ghost"><md-icon>upload_file</md-icon>批量导入</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>download</md-icon>导出标准</button>
            <button className="lib-btn lib-btn--primary" onClick={() => setDialog({ mode: 'create', field: null })}>
              <md-icon>add</md-icon>新建字段
            </button>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="lib-filter-bar">
        <div className="lib-search-wrap">
          <md-icon>search</md-icon>
          <input className="lib-search-input" placeholder="搜索字段名称、编码、别名..." value={search}
            onChange={e => setSearch(e.target.value)} aria-label="搜索字段" />
          {search && <button className="lib-search-clear" onClick={() => setSearch('')} aria-label="清空"><md-icon>close</md-icon></button>}
        </div>
        <select className="lib-filter-select" value={fCat} onChange={e => setFCat(e.target.value as FieldCategory | '全部分类')} aria-label="字段分类">
          <option>全部分类</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="lib-filter-select" value={fType} onChange={e => setFType(e.target.value as DataType | '全部类型')} aria-label="数据类型">
          <option>全部类型</option>{DATA_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="lib-filter-select" value={fStatus} onChange={e => setFStatus(e.target.value as FieldStatus | '全部状态')} aria-label="状态">
          <option>全部状态</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="lib-adv-btn"><md-icon>filter_list</md-icon>高级筛选</button>
        {activeFilters > 0 && <button className="lib-reset-btn" onClick={handleReset}><md-icon>filter_alt_off</md-icon>重置</button>}
      </div>

      {/* 列表标题 */}
      <div className="lib-result-bar">
        <span className="md-typescale-label-medium lib-result-count">
          共 <strong>{filtered.length}</strong> 条 · 启用 <strong>{enabledCount}</strong> · 草稿 <strong>{draftCount}</strong>
        </span>
        {selected.size > 0 && (
          <div className="lib-batch-actions">
            <span className="lib-batch-count">已选 {selected.size} 条</span>
            <button className="lib-btn lib-btn--ghost lib-btn--sm">批量启用</button>
            <button className="lib-btn lib-btn--ghost lib-btn--sm">批量停用</button>
            <button className="lib-btn lib-btn--ghost lib-btn--sm">批量导出</button>
          </div>
        )}
      </div>

      {/* 表格 */}
      <div className="lib-table-wrap">
        <table className="lib-table">
          <thead>
            <tr>
              <th className="lib-th-check"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} aria-label="全选" /></th>
              <th>标准字段</th><th>分类</th><th>类型</th><th>标准值</th>
              <th className="lib-th-num">映射</th><th className="lib-th-num">规则</th>
              <th>状态</th><th>版本/更新时间</th><th className="lib-th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} className={selected.has(f.id) ? 'lib-row--checked' : ''}>
                <td><input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleSelect(f.id)} aria-label={`选择${f.name}`} /></td>
                <td>
                  <button className="lib-name-btn" onClick={() => setDialog({ mode: 'edit', field: f })}>
                    <span className="lib-cell-name">{f.name}</span>
                    <span className="lib-cell-code">{f.code}</span>
                  </button>
                </td>
                <td><span className="lib-cell-sub">{f.category} / {f.subCategory}</span></td>
                <td><span className="lib-cell-sub">{f.typeDetail}</span></td>
                <td><span className="lib-cell-ellipsis" title={f.stdValue}>{f.stdValue}</span></td>
                <td className="lib-td-num">{f.mappingCount}</td>
                <td className="lib-td-num"><span className="lib-rule-count">{f.ruleEnabled}/{f.ruleTotal}</span></td>
                <td>
                  <div className="lib-status-cell">
                    <span className={`lib-badge ${STATUS_CLASS[f.status]}`}>{f.status}</span>
                    {f.status !== '草稿' && f.status !== '已归档' && (
                      <button className={`lib-switch${f.status === '启用' ? ' lib-switch--on' : ''}`} role="switch"
                        aria-checked={f.status === '启用'} onClick={() => toggleStatus(f.id)} aria-label="启停">
                        <span className="lib-switch-thumb" />
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <div className="lib-cell-version">
                    <span className="lib-version-chip">{f.version}</span>
                    <span className="lib-cell-time">{f.updatedAt} · {f.updatedBy}</span>
                  </div>
                </td>
                <td>
                  <div className="lib-row-actions">
                    <button className="lib-row-icon" title="编辑" onClick={() => setDialog({ mode: 'edit', field: f })}><md-icon>edit</md-icon></button>
                    <button className="lib-row-icon" title="复制" onClick={() => setDialog({ mode: 'view', field: f })}><md-icon>content_copy</md-icon></button>
                    <button className="lib-row-icon lib-row-icon--danger" title="删除"
                      disabled={f.status !== '草稿'}
                      onClick={() => { if (window.confirm(`确定删除字段「${f.name}」吗？`)) setFields(p => p.filter(x => x.id !== f.id)) }}>
                      <md-icon>delete</md-icon>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10}><div className="lib-empty"><md-icon>search_off</md-icon>未找到符合条件的数据
                <button className="lib-btn lib-btn--ghost lib-btn--sm" onClick={handleReset}>清空筛选</button></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {dialog && <FieldDialog field={dialog.field} mode={dialog.mode} onClose={() => setDialog(null)} onSave={handleSave} />}
    </div>
  )
}
