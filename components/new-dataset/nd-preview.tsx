'use client'

import { useState } from 'react'
import type { CheckStatus, PreviewResult } from './nd-model'

const STATUS_META: Record<CheckStatus, { label: string; icon: string }> = {
  pass: { label: '通过', icon: 'check_circle' },
  warn: { label: '提示', icon: 'info' },
  block: { label: '阻断', icon: 'block' },
}

export function NdPreview({ preview, stale }: { preview: PreviewResult; stale: boolean }) {
  const [tab, setTab] = useState<'data' | 'excluded'>('data')
  const { stats, checks, columns, rows, excluded } = preview

  return (
    <div className="ndw-preview">
      <div className="ndw-card-head">
        <span className="ndw-card-title">检查与计算预览</span>
        <span className="ndw-card-sub">尚未创建正式数据集，也未启动四维质检</span>
      </div>

      {stale && (
        <div className="ndw-banner ndw-banner--warn" role="alert">
          <md-icon>update</md-icon>
          配置已修改，当前预览已失效。请点击底部「重新检查与计算」生成新的预览后再确认创建。
        </div>
      )}
      {!stale && preview.blocked && (
        <div className="ndw-banner ndw-banner--block" role="alert">
          <md-icon>block</md-icon>
          存在阻断问题，需修正配置后重新检查，暂不能确认创建。
        </div>
      )}

      <div className={`ndw-preview-body${stale ? ' ndw-stale' : ''}`}>
        <div className="ndw-stats">
          <Stat label="候选记录" value={stats.candidate} />
          <Stat label="纳入" value={stats.included} tone="ok" />
          <Stat label="排除" value={stats.excluded} tone={stats.excluded ? 'warn' : undefined} />
          <Stat label="周期未满" value={stats.immature} />
          <Stat label="普通缺失" value={stats.missing} />
        </div>

        <ul className="ndw-checks" aria-label="检查结论">
          {checks.map((c) => (
            <li key={c.item} className={`ndw-check ndw-check--${c.status}`}>
              <span className={`ndw-check-pill ndw-check-pill--${c.status}`}>
                <md-icon>{STATUS_META[c.status].icon}</md-icon>{STATUS_META[c.status].label}
              </span>
              <span className="ndw-check-item">{c.item}</span>
              <span className="ndw-check-detail">{c.detail}</span>
            </li>
          ))}
        </ul>

        <div className="ndw-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'data'} className={`ndw-tab${tab === 'data' ? ' ndw-tab--on' : ''}`} onClick={() => setTab('data')}>
            计算预览 <span className="ndw-tab-count">{rows.length}</span>
          </button>
          <button role="tab" aria-selected={tab === 'excluded'} className={`ndw-tab${tab === 'excluded' ? ' ndw-tab--on' : ''}`} onClick={() => setTab('excluded')}>
            排除记录 <span className="ndw-tab-count">{excluded.length}</span>
          </button>
        </div>

        {tab === 'data' ? (
          rows.length ? (
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
                  {rows.map((r) => (
                    <tr key={r.key}>
                      {columns.map((c, i) => {
                        const cell = r.cells[c.key]
                        const cls = c.sticky ? `ndw-sticky ndw-sticky-${i}${c.key === 'well_no' ? ' ndw-strong' : ' ndw-num'}` : ''
                        if (!cell) return <td key={c.key} className={cls}>—</td>
                        return (
                          <td key={c.key} className={cls}>
                            {cell.text && <span className={cell.tag === '劈分估算' ? 'ndw-est' : undefined}>{cell.text}</span>}
                            {cell.tag && <span className={`ndw-cell-tag ndw-cell-tag--${tagTone(cell.tag)}`}>{cell.tag === '劈分估算' ? '估' : cell.tag}</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ndw-empty"><md-icon>block</md-icon><span>没有记录满足筛选条件</span></div>
          )
        ) : excluded.length ? (
          <div className="ndw-table-wrap">
            <table className="ndw-table">
              <thead>
                <tr><th>对象</th><th>业务覆盖率</th><th>排除原因</th></tr>
              </thead>
              <tbody>
                {excluded.map((e) => (
                  <tr key={e.key}>
                    <td className="ndw-strong">{e.object}</td>
                    <td className="ndw-num">{e.coverage === null ? '不适用' : `${e.coverage}%`}</td>
                    <td className="ndw-reason">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ndw-empty"><md-icon>task_alt</md-icon><span>没有被排除的记录</span></div>
        )}
      </div>
    </div>
  )
}

function tagTone(tag: string) {
  if (tag === '缺失') return 'warn'
  if (tag === '劈分估算') return 'info'
  return 'muted'
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  return (
    <div className={`ndw-stat${tone ? ` ndw-stat--${tone}` : ''}`}>
      <span className="ndw-stat-num">{value}</span>
      <span className="ndw-stat-label">{label}</span>
    </div>
  )
}
