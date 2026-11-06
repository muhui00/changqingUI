'use client'

import { useEffect, useRef, useState } from 'react'
import {
  EMPTY_CONFIG, FIELD_MAP, TEMPLATE_MAP, computePreview, configKey, defaultMethod, isBusiness,
  type NdConfig, type PreviewResult,
} from './nd-model'
import { NdStepSelect } from './nd-step-select'
import { NdStepSample } from './nd-step-sample'

export type NdPhase = 'select' | 'sample' | 'building' | 'done'

export interface NdDraft {
  config: NdConfig
  phase: NdPhase
  preview: PreviewResult | null
}

export interface NdCreatedInfo {
  name: string
  wells: number
  businessFields: number
  rows: number
  excluded: number
  granularity: NdConfig['granularity']
}

interface Props {
  existingNames: string[]
  initialDraft: NdDraft | null
  onDraftChange: (draft: NdDraft | null) => void
  onBack: () => void
  onCreated: (info: NdCreatedInfo) => void
}

const BUILD_STAGES = ['冻结配置与输入快照', '关联井／井段与来源', '计算字段与周期指标', '写入数据表与版本']

export function NewDatasetWorkbench({ existingNames, initialDraft, onDraftChange, onBack, onCreated }: Props) {
  const [config, setConfig] = useState<NdConfig>(initialDraft?.config ?? EMPTY_CONFIG)
  const [phase, setPhase] = useState<NdPhase>(initialDraft?.phase === 'building' ? 'sample' : initialDraft?.phase ?? 'select')
  const [preview, setPreview] = useState<PreviewResult | null>(initialDraft?.preview ?? null)
  const [nameTouched, setNameTouched] = useState(!!initialDraft?.config.name)
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const [savedAt, setSavedAt] = useState('')
  const [tplConfirm, setTplConfirm] = useState<{ id: string; lines: string[] } | null>(null)
  const [progress, setProgress] = useState(0)
  const [created, setCreated] = useState<NdCreatedInfo | null>(null)

  const update = (patch: Partial<NdConfig>) => {
    if ('name' in patch) setNameTouched(true)
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  // 自动保存草稿（会话内保存；正式实现需服务端按用户与草稿身份隔离）
  const draftCb = useRef(onDraftChange)
  draftCb.current = onDraftChange
  useEffect(() => {
    if (phase === 'done') return
    setSaveState('saving')
    const t = setTimeout(() => {
      draftCb.current({ config, phase, preview })
      setSaveState('saved')
      setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
    }, 500)
    return () => clearTimeout(t)
  }, [config, phase, preview])

  // ── 名称校验 ──
  const trimmed = config.name.trim()
  const duplicate = existingNames.includes(trimmed)
  const nameValid = trimmed.length >= 1 && trimmed.length <= 100 && !duplicate
  const nameError = !nameTouched ? '' : trimmed.length === 0 ? '请输入数据集名称' : duplicate ? '该名称已存在，请更换' : ''

  const businessCount = config.fieldIds.filter(isBusiness).length
  const missing: string[] = []
  if (!nameValid) missing.push('有效名称')
  if (!config.templateId) missing.push('质检模板')
  if (!config.wellIds.length) missing.push('至少一口井')
  if (!businessCount) missing.push('至少一个业务字段')
  const canNext = missing.length === 0

  // ── 质检模板切换：替换用户修改前展示影响 ──
  const applyTemplate = (id: string) => {
    const tpl = TEMPLATE_MAP[id] ?? null
    const basic = config.fieldIds.filter((f) => !isBusiness(f))
    const fields = [...basic, ...(tpl?.fields ?? [])]
    const methods: Record<string, string> = {}
    for (const f of fields) methods[f] = isBusiness(f) ? defaultMethod(f, tpl) : (config.methods[f] ?? defaultMethod(f))
    update({ templateId: id, fieldIds: fields, methods })
    setTplConfirm(null)
  }

  const handleTemplateChange = (id: string) => {
    const old = TEMPLATE_MAP[config.templateId]
    if (!old) return applyTemplate(id)
    const next = TEMPLATE_MAP[id]
    const current = config.fieldIds.filter(isBusiness)
    const removedByUser = old.fields.filter((f) => !current.includes(f))
    const changedMethods = current.filter((f) => config.methods[f] && config.methods[f] !== defaultMethod(f, old))
    if (!removedByUser.length && !changedMethods.length) return applyTemplate(id)
    const dropped = current.filter((f) => !next?.fields.includes(f)).map((f) => FIELD_MAP[f].name)
    const lines: string[] = []
    if (dropped.length) lines.push(`移除不在新模板内的字段：${dropped.join('、')}`)
    if (removedByUser.length) lines.push(`恢复你在原模板中取消的 ${removedByUser.length} 个字段的默认勾选`)
    if (changedMethods.length) lines.push(`已调整的 ${changedMethods.length} 个计算方法（${changedMethods.map((f) => FIELD_MAP[f].name).join('、')}）将被新模板默认值替换`)
    setTplConfirm({ id, lines })
  }

  // ── 检查与计算预览 ──
  const previewValid = !!preview && preview.key === configKey(config)
  const runPreview = () => setPreview(computePreview(config))
  const canCreate = previewValid && !preview!.blocked && preview!.stats.included > 0

  // ── 构建 ──
  const startBuild = () => {
    if (!canCreate) return
    setProgress(0)
    setPhase('building')
  }
  useEffect(() => {
    if (phase !== 'building') return
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 6)
        if (next >= 100) clearInterval(t)
        return next
      })
    }, 140)
    return () => clearInterval(t)
  }, [phase])
  useEffect(() => {
    if (phase !== 'building' || progress < 100 || !preview) return
    const info: NdCreatedInfo = {
      name: trimmed,
      wells: config.wellIds.length,
      businessFields: businessCount,
      rows: preview.stats.included,
      excluded: preview.stats.excluded,
      granularity: config.granularity,
    }
    setCreated(info)
    setPhase('done')
    onCreated(info)
    draftCb.current(null)
  }, [phase, progress]) // eslint-disable-line react-hooks/exhaustive-deps

  const stepIndex = phase === 'select' ? 0 : 1
  const stageIndex = Math.min(BUILD_STAGES.length - 1, Math.floor(progress / (100 / BUILD_STAGES.length)))

  return (
    <div className="ndw-shell">
      {/* 面包屑 + 保存状态 */}
      <div className="ndw-topbar">
        <nav className="ndw-breadcrumb" aria-label="面包屑">
          <button className="ndw-crumb-link" onClick={onBack}>数据质检</button>
          <md-icon>chevron_right</md-icon>
          <span className="ndw-crumb-current">新建数据集</span>
        </nav>
        {phase !== 'done' && (
          <span className={`ndw-save ndw-save--${saveState}`} aria-live="polite">
            <md-icon>{saveState === 'saving' ? 'sync' : 'cloud_done'}</md-icon>
            {saveState === 'saving' ? '正在保存…' : savedAt ? `草稿已保存 ${savedAt}` : '草稿已保存'}
          </span>
        )}
      </div>

      {/* 步骤栏 */}
      <ol className="ndw-steps" aria-label="创建步骤">
        {['名称及数据选择', '定义样本粒度'].map((label, i) => {
          const state = phase === 'done' || i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo'
          return (
            <li key={label} className={`ndw-step ndw-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="ndw-step-dot">{state === 'done' ? <md-icon>check</md-icon> : i + 1}</span>
              <span className="ndw-step-label">{label}</span>
              {i === 0 && <span className="ndw-step-line" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>

      {/* 主工作区 */}
      <div className="ndw-main">
        {phase === 'select' && (
          <NdStepSelect config={config} update={update} nameError={nameError} onTemplateChange={handleTemplateChange} />
        )}
        {phase === 'sample' && <NdStepSample config={config} update={update} preview={preview} />}
        {phase === 'building' && (
          <div className="ndw-center-card ndw-card">
            <md-icon class="ndw-center-icon ndw-spin">progress_activity</md-icon>
            <h2 className="ndw-center-title">正在构建数据集</h2>
            <p className="ndw-center-desc">{trimmed} · 已冻结本次配置，构建期间请勿关闭页面</p>
            <div className="ndw-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="ndw-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <ul className="ndw-stage-list">
              {BUILD_STAGES.map((s, i) => (
                <li key={s} className={i < stageIndex || progress >= 100 ? 'is-done' : i === stageIndex ? 'is-active' : ''}>
                  <md-icon>{i < stageIndex || progress >= 100 ? 'check_circle' : i === stageIndex ? 'pending' : 'radio_button_unchecked'}</md-icon>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {phase === 'done' && created && (
          <div className="ndw-center-card ndw-card">
            <md-icon class="ndw-center-icon ndw-center-icon--ok">task_alt</md-icon>
            <h2 className="ndw-center-title">构建完成 · 待质检</h2>
            <p className="ndw-center-desc">「{created.name}」已创建，返回总览后点击「开始质检」启动四维检查，系统将检查数据集全部井及全部业务字段。</p>
            <div className="ndw-done-stats">
              <div><b>{created.wells}</b><span>口井</span></div>
              <div><b>{created.businessFields}</b><span>个业务字段</span></div>
              <div><b>{created.rows}</b><span>条纳入记录（{created.granularity === 'well' ? '井级' : '井段级'}）</span></div>
              <div><b>{created.excluded}</b><span>条排除记录</span></div>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <footer className="ndw-footer">
        {phase === 'done' ? (
          <>
            <span />
            <button className="ndw-btn ndw-btn--primary" onClick={onBack}>返回总览</button>
          </>
        ) : phase === 'building' ? (
          <span className="ndw-footer-hint">构建中，完成后可返回总览</span>
        ) : (
          <>
            <div className="ndw-footer-left">
              <button className="ndw-btn ndw-btn--ghost" onClick={onBack}>返回总览</button>
              {phase === 'select' && !canNext && <span className="ndw-footer-hint">还需：{missing.join('、')}</span>}
              {phase === 'sample' && preview && !previewValid && <span className="ndw-footer-hint ndw-footer-hint--warn">配置已修改，需重新检查</span>}
            </div>
            <div className="ndw-footer-right">
              {phase === 'select' ? (
                <button className="ndw-btn ndw-btn--primary" disabled={!canNext} onClick={() => { setNameTouched(true); if (canNext) setPhase('sample') }}>
                  下一步：定义样本粒度
                </button>
              ) : (
                <>
                  <button className="ndw-btn ndw-btn--ghost" onClick={() => setPhase('select')}>上一步</button>
                  <button className={`ndw-btn ${previewValid ? 'ndw-btn--ghost' : 'ndw-btn--primary'}`} onClick={runPreview}>
                    {preview ? '重新检查与计算' : '检查与计算预览'}
                  </button>
                  <button className="ndw-btn ndw-btn--primary" disabled={!canCreate} onClick={startBuild}>确认创建数据集</button>
                </>
              )}
            </div>
          </>
        )}
      </footer>

      {/* 模板切换影响确认 */}
      {tplConfirm && (
        <div className="ndw-modal-overlay" role="presentation" onClick={() => setTplConfirm(null)}>
          <div className="ndw-modal" role="dialog" aria-modal="true" aria-labelledby="ndw-tpl-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="ndw-tpl-title" className="ndw-modal-title">切换质检模板</h3>
            <p className="ndw-modal-desc">切换到「{TEMPLATE_MAP[tplConfirm.id]?.name ?? '未选择'}」将影响你已修改的配置：</p>
            <ul className="ndw-modal-list">
              {tplConfirm.lines.map((l) => <li key={l}>{l}</li>)}
            </ul>
            <div className="ndw-modal-actions">
              <button className="ndw-btn ndw-btn--ghost" onClick={() => setTplConfirm(null)}>取消</button>
              <button className="ndw-btn ndw-btn--primary" onClick={() => applyTemplate(tplConfirm.id)}>确认切换</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
