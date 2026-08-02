'use client'

import { useMemo, useState } from 'react'

// ─── 类型 ────────────────────────────────────────────────────────────────────
type RuleStatus = '草稿' | '试运行' | '待审核' | '启用' | '停用' | '已归档'
type QualityDim = '完整性' | '一致性' | '分布范围' | '相关性'
type RuleClass = '校验规则' | '处置规则'
type AnomalyLevel = '提示' | '一般' | '严重'

interface QCRule {
  id: string
  name: string
  code: string
  dim: QualityDim
  template: string
  ruleClass: RuleClass
  mainField: string
  auxCount: number
  scene: string
  logic: string
  level: AnomalyLevel
  action: string
  status: RuleStatus
  version: string
  updatedAt: string
  updatedBy: string
  owner: string
  desc: string
}

// ─── 模拟数据 ─────────────────────────────────────────────────────────────────
const MOCK_RULES: QCRule[] = [
  { id: '1', name: '加砂量合理范围检查', code: 'RANGE_PROPPANT_VOLUME', dim: '分布范围', template: '物理边界+IQR', ruleClass: '校验规则', mainField: '加砂量', auxCount: 2, scene: '陆地/致密气', logic: '0–5000 m³；IQR=1.5', level: '严重', action: '专家审查', status: '启用', version: 'V2.1', updatedAt: '2026-07-15 10:20', updatedBy: '王工', owner: '王工', desc: '检查加砂量是否超出物理边界并结合 IQR 识别离群值。' },
  { id: '2', name: '单井入地液量单位量级检查', code: 'CONSISTENCY_INJECTED_FLUID', dim: '一致性', template: '单位/量纲/量级', ruleClass: '校验规则', mainField: '单井入地液量', auxCount: 0, scene: '全部', logic: '单位转换 + 量级识别', level: '一般', action: '自动修复后复核', status: '启用', version: 'V1.2', updatedAt: '2026-07-12 14:05', updatedBy: '张工', owner: '张工', desc: '识别入地液量的单位与量级异常，并触发单位标准化处置。' },
  { id: '3', name: '油层厚度缺失值检查', code: 'COMPLETE_OIL_LAYER_THICKNESS', dim: '完整性', template: '条件必填', ruleClass: '校验规则', mainField: '油层厚度', auxCount: 1, scene: '全部', logic: '目标层已解释时不得为空', level: '严重', action: '专家审查', status: '启用', version: 'V1.0', updatedAt: '2026-07-08 09:30', updatedBy: '李工', owner: '李工', desc: '当测井解释确认目标层时，油层厚度不得为空。' },
  { id: '4', name: '孔隙度渗透率相关性检查', code: 'CORR_PORO_PERM', dim: '相关性', template: '相关系数', ruleClass: '校验规则', mainField: '孔隙度', auxCount: 1, scene: '苏里格/致密气', logic: 'Pearson ≥ 0.6', level: '一般', action: '仅标记', status: '试运行', version: 'V0.3', updatedAt: '2026-07-16 16:40', updatedBy: '赵工', owner: '赵工', desc: '校验孔隙度与渗透率的统计相关性是否符合预期。' },
  { id: '5', name: '日产气量跨源一致检查', code: 'CONSISTENCY_DAILY_GAS_XSRC', dim: '一致性', template: '跨源一致', ruleClass: '校验规则', mainField: '日产气量', auxCount: 2, scene: '全部', logic: '容差 5%；生产库优先', level: '一般', action: '提交专家审查', status: '待审核', version: 'V1.1', updatedAt: '2026-07-14 11:10', updatedBy: '王工', owner: '王工', desc: '对比生产动态库与日报库的日产气量是否一致。' },
  { id: '6', name: '入地液量单位自动转换', code: 'FIX_UNIT_INJECTED_FLUID', dim: '一致性', template: '单位转换', ruleClass: '处置规则', mainField: '单井入地液量', auxCount: 1, scene: '全部', logic: 'L→m³ / t→m³(依赖密度)', level: '提示', action: '自动标准化', status: '停用', version: 'V1.0', updatedAt: '2026-06-30 15:22', updatedBy: '张工', owner: '张工', desc: '将来源单位标准化为 m³，跨量纲转换强制复核。' },
  { id: '7', name: '完井日期格式检查', code: 'CONSISTENCY_COMPLETION_DATE_FMT', dim: '一致性', template: '类型/格式', ruleClass: '校验规则', mainField: '完井日期', auxCount: 0, scene: '全部', logic: 'YYYY-MM-DD；不晚于今日', level: '提示', action: '仅标记', status: '草稿', version: 'V0.1', updatedAt: '2026-07-17 08:15', updatedBy: '赵工', owner: '赵工', desc: '校验完井日期格式合法且不为未来日期。' },
  { id: '8', name: '日产气量缺失率检查', code: 'COMPLETE_DAILY_GAS_MISSRATE', dim: '完整性', template: '缺失率', ruleClass: '校验规则', mainField: '日产气量', auxCount: 0, scene: '生产动态', logic: '警戒 5% · 严重 15%', level: '一般', action: '提交专家审查', status: '已归档', version: 'V1.0', updatedAt: '2026-05-18 13:40', updatedBy: '李工', owner: '李工', desc: '统计日产气量在统计范围内的缺失比例。' },
]

const DIMS: QualityDim[] = ['完整性', '一致性', '分布范围', '相关性']
const STATUSES: RuleStatus[] = ['草稿', '试运行', '待审核', '启用', '停用', '已归档']
const LEVELS: AnomalyLevel[] = ['提示', '一般', '严重']

const STATUS_CLASS: Record<RuleStatus, string> = {
  '草稿': 'lib-badge--draft', '试运行': 'lib-badge--running', '待审核': 'lib-badge--review',
  '启用': 'lib-badge--enabled', '停用': 'lib-badge--disabled', '已归档': 'lib-badge--archived',
}
const DIM_CLASS: Record<QualityDim, string> = {
  '完整性': 'lib-dim--completeness', '一致性': 'lib-dim--consistency',
  '分布范围': 'lib-dim--distribution', '相关性': 'lib-dim--correlation',
}
const LEVEL_CLASS: Record<AnomalyLevel, string> = {
  '提示': 'lib-level--info', '一般': 'lib-level--warn', '严重': 'lib-level--error',
}

const TEMPLATES: Record<QualityDim, string[]> = {
  '完整性': ['必填检查', '缺失率检查', '连续缺失检查'],
  '一致性': ['类型/格式检查', '单位/量纲/量级检查', '跨源一致检查', '唯一性检查'],
  '分布范围': ['物理/业务范围', 'IQR/箱线图', 'Z-score', '孤立森林'],
  '相关性': ['跨字段逻辑', '相关系数', '回归残差'],
}

// ─── 新建/编辑弹窗 ────────────────────────────────────────────────────────────
type DialogTab = 'define' | 'apply' | 'testrun'

interface RuleDialogProps {
  rule: QCRule | null
  mode: 'create' | 'edit' | 'view'
  onClose: () => void
  onSave: (r: QCRule) => void
}

function RuleDialog({ rule, mode, onClose, onSave }: RuleDialogProps) {
  const [tab, setTab] = useState<DialogTab>('define')
  const [name, setName] = useState(rule?.name ?? '')
  const [code, setCode] = useState(rule?.code ?? '')
  const [ruleClass, setRuleClass] = useState<RuleClass>(rule?.ruleClass ?? '校验规则')
  const [dim, setDim] = useState<QualityDim>(rule?.dim ?? '分布范围')
  const [template, setTemplate] = useState(rule?.template ?? TEMPLATES['分布范围'][0])
  const [level, setLevel] = useState<AnomalyLevel>(rule?.level ?? '严重')
  const [priority, setPriority] = useState<'高' | '中' | '低'>('中')
  const [owner, setOwner] = useState(rule?.owner ?? '张工')
  const [desc, setDesc] = useState(rule?.desc ?? '')
  const [configMode, setConfigMode] = useState<'template' | 'expression'>('template')
  const [lower, setLower] = useState('0')
  const [upper, setUpper] = useState('5000')
  const [iqr, setIqr] = useState('1.5')
  const [autoFix, setAutoFix] = useState(false)
  const [testRun, setTestRun] = useState(false)
  const [nameErr, setNameErr] = useState('')

  const isEnabledEdit = mode === 'edit' && rule?.status === '启用'
  const readOnly = mode === 'view'
  const title = mode === 'create' ? '新建质控规则' : mode === 'view' ? '查看质控规则' : '编辑质控规则'

  const preview = `当 [${rule?.mainField ?? '目标字段'}] < ${lower} 或 [${rule?.mainField ?? '目标字段'}] > ${upper} 时，标记为${level}异常；在同区块同井型样本中同时执行 IQR(${iqr}) 检查。`

  const handleSave = () => {
    if (!name.trim()) { setNameErr('规则名称不能为空'); setTab('define'); return }
    const next: QCRule = {
      id: rule?.id ?? String(Date.now()),
      name: name.trim(), code: code.trim().toUpperCase(), dim, template, ruleClass,
      mainField: rule?.mainField ?? '目标字段', auxCount: rule?.auxCount ?? 0,
      scene: rule?.scene ?? '全部', logic: `${lower}–${upper}；IQR=${iqr}`,
      level, action: autoFix ? '自动修复后复核' : '专家审查',
      status: isEnabledEdit ? '草稿' : (rule?.status ?? '草稿'),
      version: isEnabledEdit ? 'V2.2' : (rule?.version ?? 'V0.1'),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16).replace(/\//g, '-'),
      updatedBy: '张工', owner, desc,
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
            当前为已启用版本 {rule?.version}，保存修改将生成新版本，不覆盖当前生效版本。
          </div>
        )}

        <div className="lib-dialog-body">
          {/* 顶部基础信息 */}
          <div className="lib-form-grid">
            <div className="lib-field">
              <label className="lib-label">规则名称<span className="lib-required">*</span></label>
              <input className={`lib-input${nameErr ? ' lib-input--error' : ''}`} value={name} disabled={readOnly}
                onChange={e => { setName(e.target.value); setNameErr('') }} placeholder="对象+问题+检查" />
              {nameErr && <span className="lib-error-msg">{nameErr}</span>}
            </div>
            <div className="lib-field">
              <label className="lib-label">规则编码<span className="lib-required">*</span></label>
              <input className="lib-input lib-input--mono" value={code} disabled={readOnly || isEnabledEdit}
                onChange={e => setCode(e.target.value.toUpperCase())} placeholder="RANGE_PROPPANT_VOLUME" />
              {isEnabledEdit && <span className="lib-hint">启用后编码不可修改</span>}
            </div>
            <div className="lib-field">
              <label className="lib-label">规则大类<span className="lib-required">*</span></label>
              <select className="lib-select" value={ruleClass} disabled={readOnly}
                onChange={e => setRuleClass(e.target.value as RuleClass)}>
                <option>校验规则</option><option>处置规则</option>
              </select>
            </div>
            <div className="lib-field">
              <label className="lib-label">质量维度<span className="lib-required">*</span></label>
              <select className="lib-select" value={dim} disabled={readOnly}
                onChange={e => { const d = e.target.value as QualityDim; setDim(d); setTemplate(TEMPLATES[d][0]) }}>
                {DIMS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="lib-field">
              <label className="lib-label">规则模板<span className="lib-required">*</span></label>
              <select className="lib-select" value={template} disabled={readOnly}
                onChange={e => setTemplate(e.target.value)}>
                {TEMPLATES[dim].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="lib-field">
              <label className="lib-label">默认异常级别<span className="lib-required">*</span></label>
              <select className="lib-select" value={level} disabled={readOnly}
                onChange={e => setLevel(e.target.value as AnomalyLevel)}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="lib-field">
              <label className="lib-label">执行优先级<span className="lib-required">*</span></label>
              <select className="lib-select" value={priority} disabled={readOnly}
                onChange={e => setPriority(e.target.value as typeof priority)}>
                <option>高</option><option>中</option><option>低</option>
              </select>
            </div>
            <div className="lib-field">
              <label className="lib-label">规则责任人<span className="lib-required">*</span></label>
              <select className="lib-select" value={owner} disabled={readOnly} onChange={e => setOwner(e.target.value)}>
                <option>张工</option><option>李工</option><option>王工</option><option>赵工</option>
              </select>
            </div>
            <div className="lib-field lib-field--full">
              <label className="lib-label">规则说明<span className="lib-required">*</span></label>
              <textarea className="lib-textarea" rows={2} value={desc} disabled={readOnly}
                onChange={e => setDesc(e.target.value)} placeholder="说明业务目的、判断口径和使用限制" />
            </div>
          </div>

          {/* 页签 */}
          <div className="lib-tabs" role="tablist">
            {([['define', '规则定义'], ['apply', '适用与处置'], ['testrun', '试运行与发布']] as const).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k}
                className={`lib-tab${tab === k ? ' lib-tab--active' : ''}`} onClick={() => setTab(k as DialogTab)}>
                {label}
              </button>
            ))}
          </div>

          {/* 页签一：规则定义 */}
          {tab === 'define' && (
            <div className="lib-tab-panel">
              <div className="lib-mode-switch" role="group" aria-label="配置模式">
                <button className={`lib-mode-btn${configMode === 'template' ? ' lib-mode-btn--active' : ''}`}
                  onClick={() => setConfigMode('template')} disabled={readOnly}>模板配置</button>
                <button className={`lib-mode-btn${configMode === 'expression' ? ' lib-mode-btn--active' : ''}`}
                  onClick={() => setConfigMode('expression')} disabled={readOnly}>高级表达式</button>
              </div>

              {configMode === 'template' ? (
                <div className="lib-form-grid">
                  <div className="lib-field">
                    <label className="lib-label">下限</label>
                    <input className="lib-input" value={lower} disabled={readOnly} onChange={e => setLower(e.target.value)} />
                  </div>
                  <div className="lib-field">
                    <label className="lib-label">上限</label>
                    <input className="lib-input" value={upper} disabled={readOnly} onChange={e => setUpper(e.target.value)} />
                  </div>
                  <div className="lib-field">
                    <label className="lib-label">IQR 系数</label>
                    <input className="lib-input" value={iqr} disabled={readOnly} onChange={e => setIqr(e.target.value)} />
                  </div>
                  <div className="lib-field">
                    <label className="lib-label">分组字段</label>
                    <input className="lib-input" disabled={readOnly} defaultValue="区块 + 井型" />
                  </div>
                  <div className="lib-field">
                    <label className="lib-label">最小样本数</label>
                    <input className="lib-input" type="number" disabled={readOnly} defaultValue={30} />
                  </div>
                  <div className="lib-field">
                    <label className="lib-label">空值处理</label>
                    <select className="lib-select" disabled={readOnly}><option>跳过</option><option>计入缺失</option></select>
                  </div>
                </div>
              ) : (
                <div className="lib-field">
                  <label className="lib-label">受控表达式</label>
                  <textarea className="lib-textarea lib-input--mono" rows={3} disabled={readOnly}
                    defaultValue="[加砂量] < 0 OR [加砂量] > 5000" />
                  <span className="lib-hint">仅支持受控字段、操作符与批准函数，不允许任意脚本。</span>
                </div>
              )}

              <div className="lib-preview">
                <div className="lib-preview-label"><md-icon>visibility</md-icon>人可读规则预览</div>
                <p className="lib-preview-text">{preview}</p>
              </div>
            </div>
          )}

          {/* 页签二：适用与处置 */}
          {tab === 'apply' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />适用范围</div>
              <div className="lib-form-grid">
                <div className="lib-field"><label className="lib-label">数据来源</label>
                  <select className="lib-select" disabled={readOnly}><option>全部来源</option><option>生产动态库</option><option>钻井库</option></select></div>
                <div className="lib-field"><label className="lib-label">井型</label>
                  <select className="lib-select" disabled={readOnly}><option>全部井型</option><option>水平井</option><option>直井</option></select></div>
                <div className="lib-field"><label className="lib-label">储层类型</label>
                  <select className="lib-select" disabled={readOnly}><option>全部类型</option><option>致密气</option><option>页岩气</option><option>煤层气</option></select></div>
                <div className="lib-field"><label className="lib-label">海/陆</label>
                  <select className="lib-select" disabled={readOnly}><option>全部</option><option>陆地</option><option>海上</option></select></div>
                <div className="lib-field"><label className="lib-label">投产状态</label>
                  <select className="lib-select" disabled={readOnly}><option>全部状态</option><option>未投产</option><option>已投产</option></select></div>
                <div className="lib-field"><label className="lib-label">生效日期</label>
                  <input className="lib-input" disabled={readOnly} defaultValue="长期" /></div>
              </div>

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--success" />字段绑定</div>
              <table className="lib-inner-table">
                <thead><tr><th>绑定角色</th><th>标准字段</th><th>是否必需</th><th>参数别名</th><th>单位要求</th></tr></thead>
                <tbody>
                  <tr><td>主校验字段</td><td>{rule?.mainField ?? '加砂量'}</td><td>必需</td><td className="lib-input--mono">x</td><td>m³</td></tr>
                  <tr><td>条件字段</td><td>井型</td><td>可选</td><td className="lib-input--mono">wtype</td><td>—</td></tr>
                </tbody>
              </table>

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--warning" />命中结果与处置</div>
              <div className="lib-form-grid">
                <div className="lib-field"><label className="lib-label">处理方式</label>
                  <select className="lib-select" disabled={readOnly}>
                    <option>仅标记</option><option>提交专家审查</option><option>自动标准化</option><option>自动补全</option><option>自动修复</option>
                  </select></div>
                <div className="lib-field"><label className="lib-label">复核策略</label>
                  <select className="lib-select" disabled={readOnly}><option>无需复核</option><option>按比例抽检</option><option>全部复核</option></select></div>
                <div className="lib-field"><label className="lib-label">低置信度回退</label>
                  <select className="lib-select" disabled={readOnly}><option>标记异常</option><option>专家审查</option><option>不处理</option></select></div>
              </div>
              <label className="lib-checkbox lib-checkbox--danger">
                <input type="checkbox" checked={autoFix} disabled={readOnly} onChange={e => setAutoFix(e.target.checked)} />
                允许自动改值（默认关闭，开启需配置复核与回退策略，并保留原始数据与审计链）
              </label>
            </div>
          )}

          {/* 页签三：试运行与发布 */}
          {tab === 'testrun' && (
            <div className="lib-tab-panel">
              <div className="lib-section-title"><span className="lib-section-bar lib-bar--primary" />试运行配置</div>
              <div className="lib-form-grid">
                <div className="lib-field"><label className="lib-label">测试数据集</label>
                  <select className="lib-select" disabled={readOnly}><option>苏里格区块2024年综合数据集 v3.2</option><option>靖边区块2024Q2数据集 v2.0</option></select></div>
                <div className="lib-field"><label className="lib-label">测试范围</label>
                  <select className="lib-select" disabled={readOnly}><option>随机抽样</option><option>全量</option><option>指定井组</option></select></div>
                <div className="lib-field"><label className="lib-label">样本上限</label>
                  <input className="lib-input" type="number" disabled={readOnly} defaultValue={5000} /></div>
              </div>
              {!readOnly && (
                <button className="lib-btn lib-btn--primary lib-btn--sm" onClick={() => setTestRun(true)}>
                  <md-icon>play_arrow</md-icon>开始试运行
                </button>
              )}

              {testRun && (
                <div className="lib-testrun-result">
                  <div className="lib-testrun-metrics">
                    <div className="lib-metric"><span className="lib-metric-value">8,640</span><span className="lib-metric-label">覆盖记录</span></div>
                    <div className="lib-metric lib-metric--warn"><span className="lib-metric-value">312</span><span className="lib-metric-label">命中异常</span></div>
                    <div className="lib-metric lib-metric--error"><span className="lib-metric-value">3.6%</span><span className="lib-metric-label">异常占比</span></div>
                    <div className="lib-metric"><span className="lib-metric-value">4</span><span className="lib-metric-label">无法解析</span></div>
                    <div className="lib-metric"><span className="lib-metric-value">1.2s</span><span className="lib-metric-label">执行耗时</span></div>
                  </div>
                  <table className="lib-inner-table">
                    <thead><tr><th>井名</th><th>字段</th><th>原值</th><th>命中条件</th><th>异常等级</th><th>建议处置</th></tr></thead>
                    <tbody>
                      <tr><td>LGPC1-14</td><td>加砂量</td><td className="lib-input--mono">6120</td><td>&gt; 5000</td><td><span className="lib-badge lib-level--error">严重</span></td><td>专家审查</td></tr>
                      <tr><td>SM2-12</td><td>加砂量</td><td className="lib-input--mono">-3</td><td>&lt; 0</td><td><span className="lib-badge lib-level--error">严重</span></td><td>专家审查</td></tr>
                      <tr><td>SMC2-49</td><td>加砂量</td><td className="lib-input--mono">4980</td><td>IQR 离群</td><td><span className="lib-badge lib-level--warn">一般</span></td><td>仅标记</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="lib-section-title"><span className="lib-section-bar lib-bar--success" />版本历史</div>
              <table className="lib-inner-table">
                <thead><tr><th>版本</th><th>状态</th><th>创建人</th><th>生效时间</th><th>变更说明</th></tr></thead>
                <tbody>
                  <tr><td>{rule?.version ?? 'V0.1'}</td><td><span className="lib-badge lib-badge--enabled">启用</span></td><td>{rule?.owner ?? '张工'}</td><td>2026-07-15</td><td>调整上限至 5000</td></tr>
                  <tr><td>V2.0</td><td><span className="lib-badge lib-badge--archived">历史</span></td><td>王工</td><td>2026-06-20</td><td>增加 IQR 检查</td></tr>
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
              <button className="lib-btn lib-btn--primary" onClick={handleSave}><md-icon>content_copy</md-icon>复制规则</button>
            </>
          ) : (
            <>
              <button className="lib-btn lib-btn--ghost" onClick={onClose}>取消</button>
              <button className="lib-btn lib-btn--tonal" onClick={handleSave}>{isEnabledEdit ? '保存为新版本' : '保存草稿'}</button>
              <button className="lib-btn lib-btn--primary" onClick={handleSave}><md-icon>science</md-icon>保存并试运行</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export function QCRuleLibrary() {
  const [rules, setRules] = useState<QCRule[]>(MOCK_RULES)
  const [search, setSearch] = useState('')
  const [fDim, setFDim] = useState<QualityDim | '全部维度'>('全部维度')
  const [fStatus, setFStatus] = useState<RuleStatus | '全部状态'>('全部状态')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit' | 'view'; rule: QCRule | null } | null>(null)

  const filtered = useMemo(() => rules.filter(r => {
    const s = search.trim().toLowerCase()
    const matchSearch = !s || r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s) || r.mainField.includes(s)
    return matchSearch && (fDim === '全部维度' || r.dim === fDim) && (fStatus === '全部状态' || r.status === fStatus)
  }), [rules, search, fDim, fStatus])

  const enabledCount = rules.filter(r => r.status === '启用').length
  const reviewCount = rules.filter(r => r.status === '待审核').length
  const runningCount = rules.filter(r => r.status === '试运行').length
  const activeFilters = (search ? 1 : 0) + (fDim !== '全部维度' ? 1 : 0) + (fStatus !== '全部状态' ? 1 : 0)

  const handleReset = () => { setSearch(''); setFDim('全部维度'); setFStatus('全部状态') }
  const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(p => p.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))
  const toggleStatus = (id: string) => setRules(p => p.map(r => r.id === id ? { ...r, status: r.status === '启用' ? '停用' : '启用' } : r))

  const handleSave = (r: QCRule) => {
    setRules(p => dialog?.mode === 'create' ? [r, ...p] : p.map(x => x.id === r.id ? r : x))
    setDialog(null)
  }

  const canToggle = (s: RuleStatus) => s === '启用' || s === '停用'

  return (
    <div className="lib-center">
      {/* 页面头部 */}
      <div className="lib-page-header">
        <div className="lib-breadcrumb md-typescale-label-medium">
          <md-icon>tune</md-icon>质控配置<md-icon class="lib-bc-sep">chevron_right</md-icon>
          <span className="lib-bc-current">质控规则库</span>
        </div>
        <div className="lib-page-header-row">
          <div>
            <h1 className="md-typescale-headline-small lib-page-title">质控规则库</h1>
            <p className="md-typescale-body-medium lib-page-subtitle">集中维护质控条件、适用场景、异常分级、处置策略与试运行版本</p>
          </div>
          <div className="lib-header-actions">
            <button className="lib-btn lib-btn--ghost"><md-icon>upload_file</md-icon>批量导入</button>
            <button className="lib-btn lib-btn--ghost"><md-icon>download</md-icon>导出规则</button>
            <button className="lib-btn lib-btn--primary" onClick={() => setDialog({ mode: 'create', rule: null })}>
              <md-icon>add</md-icon>新建规则
            </button>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="lib-filter-bar">
        <div className="lib-search-wrap">
          <md-icon>search</md-icon>
          <input className="lib-search-input" placeholder="搜索规则名称、编码、关联字段..." value={search}
            onChange={e => setSearch(e.target.value)} aria-label="搜索规则" />
          {search && <button className="lib-search-clear" onClick={() => setSearch('')} aria-label="清空"><md-icon>close</md-icon></button>}
        </div>
        <select className="lib-filter-select" value={fDim} onChange={e => setFDim(e.target.value as QualityDim | '全部维度')} aria-label="质量维度">
          <option>全部维度</option>{DIMS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="lib-filter-select" value={fStatus} onChange={e => setFStatus(e.target.value as RuleStatus | '全部状态')} aria-label="状态">
          <option>全部状态</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="lib-adv-btn"><md-icon>filter_list</md-icon>高级筛选</button>
        {activeFilters > 0 && <button className="lib-reset-btn" onClick={handleReset}><md-icon>filter_alt_off</md-icon>重置</button>}
      </div>

      {/* 列表标题 */}
      <div className="lib-result-bar">
        <span className="md-typescale-label-medium lib-result-count">
          共 <strong>{filtered.length}</strong> 条 · 启用 <strong>{enabledCount}</strong> · 待审核 <strong>{reviewCount}</strong> · 试运行 <strong>{runningCount}</strong>
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
              <th>规则</th><th>维度/类型</th><th>适用对象</th><th>逻辑摘要</th>
              <th>异常/处置</th><th>状态</th><th>版本/更新时间</th><th className="lib-th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className={selected.has(r.id) ? 'lib-row--checked' : ''}>
                <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} aria-label={`选择${r.name}`} /></td>
                <td>
                  <button className="lib-name-btn" onClick={() => setDialog({ mode: 'edit', rule: r })}>
                    <span className="lib-cell-name">{r.name}</span>
                    <span className="lib-cell-code">{r.code}</span>
                  </button>
                </td>
                <td>
                  <div className="lib-dim-cell">
                    <span className={`lib-dim-badge ${DIM_CLASS[r.dim]}`}>{r.dim}</span>
                    <span className="lib-cell-time">{r.template}</span>
                  </div>
                </td>
                <td>
                  <div className="lib-apply-cell">
                    <span className="lib-cell-sub">{r.mainField}</span>
                    <span className="lib-cell-time">{r.auxCount} 个辅助 · {r.scene}</span>
                  </div>
                </td>
                <td><span className="lib-cell-ellipsis lib-input--mono" title={r.logic}>{r.logic}</span></td>
                <td>
                  <div className="lib-action-cell">
                    <span className={`lib-badge ${LEVEL_CLASS[r.level]}`}>{r.level}</span>
                    <span className="lib-cell-time">{r.action}</span>
                  </div>
                </td>
                <td>
                  <div className="lib-status-cell">
                    <span className={`lib-badge ${STATUS_CLASS[r.status]}`}>{r.status}</span>
                    {canToggle(r.status) && (
                      <button className={`lib-switch${r.status === '启用' ? ' lib-switch--on' : ''}`} role="switch"
                        aria-checked={r.status === '启用'} onClick={() => toggleStatus(r.id)} aria-label="启停">
                        <span className="lib-switch-thumb" />
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <div className="lib-cell-version">
                    <span className="lib-version-chip">{r.version}</span>
                    <span className="lib-cell-time">{r.updatedAt} · {r.updatedBy}</span>
                  </div>
                </td>
                <td>
                  <div className="lib-row-actions">
                    <button className="lib-row-icon" title="编辑" onClick={() => setDialog({ mode: 'edit', rule: r })}><md-icon>edit</md-icon></button>
                    <button className="lib-row-icon" title="复制" onClick={() => setDialog({ mode: 'view', rule: r })}><md-icon>content_copy</md-icon></button>
                    <button className="lib-row-icon lib-row-icon--danger" title="删除" disabled={r.status !== '草稿'}
                      onClick={() => { if (window.confirm(`确定删除规则「${r.name}」吗？`)) setRules(p => p.filter(x => x.id !== r.id)) }}>
                      <md-icon>delete</md-icon>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9}><div className="lib-empty"><md-icon>search_off</md-icon>未找到符合条件的数据
                <button className="lib-btn lib-btn--ghost lib-btn--sm" onClick={handleReset}>清空筛选</button></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {dialog && <RuleDialog rule={dialog.rule} mode={dialog.mode} onClose={() => setDialog(null)} onSave={handleSave} />}
    </div>
  )
}
