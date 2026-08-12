'use client'

import { useState } from 'react'

interface TopNavProps {
  currentDataset?: string
  activePage?: 'overview' | 'report-center' | 'report-preview' | 'sample-management' | 'visualization' | 'field-standard' | 'qc-rule' | 'weighted-scoring'
  onNavOverview?: () => void
  onNavReportCenter?: () => void
  onNavSampleManagement?: () => void
  onNavVisualization?: () => void
  onNavFieldStandard?: () => void
  onNavQCRule?: () => void
  onNavWeightedScoring?: () => void
}

export function TopNav({ currentDataset, activePage = 'overview', onNavOverview, onNavReportCenter, onNavSampleManagement, onNavVisualization, onNavFieldStandard, onNavQCRule, onNavWeightedScoring }: TopNavProps) {
  const [achieveMenuOpen, setAchieveMenuOpen] = useState(false)
  const [configMenuOpen, setConfigMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="top-nav">
      {/* 左侧：平台标识 + 名称 */}
      <div className="top-nav-brand">
        <div className="top-nav-logo" aria-hidden="true">
          <md-icon>hub</md-icon>
        </div>
        <div className="top-nav-title-group">
          <span className="top-nav-platform-name md-typescale-title-medium">
            长庆油气田数据质检平台
          </span>
        </div>
      </div>

      {/* 中间：主导航 */}
      <nav className="top-nav-links" aria-label="主导航">
        <button
          className={`top-nav-link${activePage === 'overview' ? ' top-nav-link--active' : ''}`}
          aria-current={activePage === 'overview' ? 'page' : undefined}
          onClick={onNavOverview}
        >
          <md-icon>dashboard</md-icon>
          数据质检总览
        </button>

        <button
          className={`top-nav-link${activePage === 'visualization' ? ' top-nav-link--active' : ''}`}
          aria-current={activePage === 'visualization' ? 'page' : undefined}
          onClick={onNavVisualization}
        >
          <md-icon>bar_chart</md-icon>
          数据可视化
        </button>

        {/* 成果管理下拉 */}
        <div className="top-nav-dropdown-wrap" style={{ position: 'relative' }}>
          <button
            className="top-nav-link"
            id="achieve-btn"
            aria-haspopup="menu"
            aria-expanded={achieveMenuOpen}
            onClick={() => setAchieveMenuOpen(!achieveMenuOpen)}
          >
            <md-icon>inventory_2</md-icon>
            成果管理
            <md-icon class="top-nav-chevron">expand_more</md-icon>
          </button>
          <md-menu
            anchor="achieve-btn"
            open={achieveMenuOpen || undefined}
            onclosed={() => setAchieveMenuOpen(false)}
          >
            <md-menu-item onClick={() => { setAchieveMenuOpen(false); onNavSampleManagement?.() }}>
              <md-icon slot="start">biotech</md-icon>
              <div slot="headline">样本管理</div>
            </md-menu-item>
            <md-menu-item onClick={() => { setAchieveMenuOpen(false); onNavReportCenter?.() }}>
              <md-icon slot="start">description</md-icon>
              <div slot="headline">质检报告管理</div>
            </md-menu-item>
          </md-menu>
        </div>

        {/* 质检配置下拉 */}
        <div className="top-nav-dropdown-wrap" style={{ position: 'relative' }}>
          <button
            className={`top-nav-link${activePage === 'field-standard' || activePage === 'qc-rule' || activePage === 'weighted-scoring' ? ' top-nav-link--active' : ''}`}
            id="config-btn"
            aria-haspopup="menu"
            aria-expanded={configMenuOpen}
            onClick={() => setConfigMenuOpen(!configMenuOpen)}
          >
            <md-icon>tune</md-icon>
            质检配置
            <md-icon class="top-nav-chevron">expand_more</md-icon>
          </button>
          <md-menu
            anchor="config-btn"
            open={configMenuOpen || undefined}
            onclosed={() => setConfigMenuOpen(false)}
          >
            <md-menu-item onClick={() => { setConfigMenuOpen(false); onNavFieldStandard?.() }}>
              <md-icon slot="start">library_books</md-icon>
              <div slot="headline">字段标准库</div>
            </md-menu-item>
            <md-menu-item onClick={() => { setConfigMenuOpen(false); onNavQCRule?.() }}>
              <md-icon slot="start">rule</md-icon>
              <div slot="headline">质检规则库</div>
            </md-menu-item>
            <md-menu-item onClick={() => { setConfigMenuOpen(false); onNavWeightedScoring?.() }}>
              <md-icon slot="start">assessment</md-icon>
              <div slot="headline">模板配置</div>
            </md-menu-item>
          </md-menu>
        </div>
      </nav>

      {/* 右侧：消息、帮助、用户 */}
      <div className="top-nav-actions">
        <md-icon-button aria-label="消息通知">
          <md-icon>notifications</md-icon>
        </md-icon-button>
        <md-icon-button aria-label="帮助">
          <md-icon>help_outline</md-icon>
        </md-icon-button>

        <div style={{ position: 'relative' }}>
          <button
            className="top-nav-user-btn"
            id="user-btn"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="top-nav-avatar" aria-hidden="true">张</div>
            <span className="md-typescale-label-medium top-nav-username">张工</span>
            <md-icon class="top-nav-chevron">expand_more</md-icon>
          </button>
          <md-menu
            anchor="user-btn"
            open={userMenuOpen || undefined}
            onclosed={() => setUserMenuOpen(false)}
          >
            <md-menu-item>
              <md-icon slot="start">account_circle</md-icon>
              <div slot="headline">个人中心</div>
            </md-menu-item>
            <md-menu-item>
              <md-icon slot="start">settings</md-icon>
              <div slot="headline">系统设置</div>
            </md-menu-item>
            <md-divider />
            <md-menu-item>
              <md-icon slot="start">logout</md-icon>
              <div slot="headline">退出登录</div>
            </md-menu-item>
          </md-menu>
        </div>
      </div>
    </header>
  )
}
