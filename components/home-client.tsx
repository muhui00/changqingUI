'use client'

import { useState } from 'react'
import { DatasetList } from './dataset-list'
import { FieldTree } from './field-tree'
import { QCOverview, type QCCardType } from './qc-overview'
import { StepToolsPanel } from './step-tools-panel'
import { TopNav } from './top-nav'
import { ReportCenter, CreateReportDialog } from './report-center'
import { ReportPreview } from './report-preview'
import { ConsistencyWorkspace, type QCWorkspaceType } from './consistency-workspace'
import { SampleManagement } from './sample-management'
import { VisualizationPage } from './visualization-page'

type AppPage = 'overview' | 'report-center' | 'report-preview' | 'qc-workspace' | 'sample-management' | 'visualization'

export function HomeClient() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('1')
  const [hoveredCard, setHoveredCard] = useState<QCCardType | null>(null)
  const [activeStep, setActiveStep] = useState<QCCardType | null>(null)
  const [datasetCollapsed, setDatasetCollapsed] = useState(false)
  const [fieldCollapsed, setFieldCollapsed] = useState(false)
  const [stepCollapsed, setStepCollapsed] = useState(false)
  const [page, setPage] = useState<AppPage>('overview')
  const [previewReportId, setPreviewReportId] = useState<string>('')
  const [createReportOpen, setCreateReportOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState<QCWorkspaceType>('consistency')

  const handleCardClick = (type: QCCardType) => {
    setActiveStep(type)
    // 点击卡片进入对应工作区
    setActiveWorkspace(type as QCWorkspaceType)
    setPage('qc-workspace')
  }

  const handleNavToReportCenter = () => setPage('report-center')
  const handleNavToOverview = () => setPage('overview')
  const handleNavToSampleManagement = () => setPage('sample-management')
  const handleNavToVisualization = () => setPage('visualization')

  const handlePreviewReport = (id: string) => {
    setPreviewReportId(id)
    setPage('report-preview')
  }

  const handleBackToReportCenter = () => setPage('report-center')

  const handleSwitchWorkspaceTab = (tab: QCWorkspaceType) => {
    setActiveWorkspace(tab)
    setActiveStep(tab as QCCardType)
  }

  // ── 数据可视化 ──
  if (page === 'visualization') {
    return (
      <div className="app-shell">
        <TopNav activePage="visualization"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement}
          onNavVisualization={handleNavToVisualization} />
        <div className="workspace" style={{ overflow: 'hidden' }}>
          <VisualizationPage onBack={handleNavToOverview} />
        </div>
      </div>
    )
  }

  // ── 样本管理 ──
  if (page === 'sample-management') {
    return (
      <div className="app-shell">
        <TopNav currentDataset="苏里格区块2024年综合数据集" activePage="sample-management"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization} />
        <div className="rc-page-shell">
          <SampleManagement onBack={handleNavToOverview} />
        </div>
      </div>
    )
  }

  // ── 报告中心 ──
  if (page === 'report-center') {
    return (
      <div className="app-shell">
        <TopNav currentDataset="苏里格区块2024年综合数据集" activePage="report-center"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization} />
        <div className="rc-page-shell">
          <ReportCenter onPreview={handlePreviewReport} />
        </div>
      </div>
    )
  }

  // ── 报告预览 ──
  if (page === 'report-preview') {
    return (
      <div className="app-shell">
        <TopNav currentDataset="苏里格区块2024年综合数据集" activePage="report-preview"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization} />
        <ReportPreview reportId={previewReportId} onBack={handleBackToReportCenter} />
      </div>
    )
  }

  // ── 质检工作区（共享左侧面板 + 右侧步骤面板）──
  if (page === 'qc-workspace') {
    return (
      <div className="app-shell">
        <TopNav currentDataset="苏里格区块2024年综合数据集" activePage="overview"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization} />
        <div className="workspace">
          <DatasetList selectedId={selectedDatasetId} onSelect={setSelectedDatasetId}
            collapsed={datasetCollapsed} onToggleCollapse={() => setDatasetCollapsed(v => !v)}
            onViewReport={(id) => { setPreviewReportId(id); setPage('report-preview') }} />
          <FieldTree collapsed={fieldCollapsed} onToggleCollapse={() => setFieldCollapsed(v => !v)} />
          <main className="content-area" id="main-content">
            {/* 目前只有一致性校验工作区，其他类型后续补充 */}
            <ConsistencyWorkspace
              onBack={handleNavToOverview}
              onSwitchTab={handleSwitchWorkspaceTab}
            />
          </main>
          <StepToolsPanel
            activeStep={activeWorkspace as QCCardType}
            onStepClick={(type) => handleSwitchWorkspaceTab(type as QCWorkspaceType)}
            onCreateReport={() => setCreateReportOpen(true)}
            collapsed={stepCollapsed}
            onToggleCollapse={() => setStepCollapsed(v => !v)}
          />
          <CreateReportDialog open={createReportOpen}
            onClose={() => setCreateReportOpen(false)}
            onConfirm={() => setCreateReportOpen(false)} />
        </div>
      </div>
    )
  }

  // ── 数据质控总览（默认首页）──
  return (
    <div className="app-shell">
      <TopNav currentDataset="苏里格区块2024年综合数据集" activePage="overview"
        onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
        onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization} />
      <div className="workspace">
        <DatasetList selectedId={selectedDatasetId} onSelect={setSelectedDatasetId}
          collapsed={datasetCollapsed} onToggleCollapse={() => setDatasetCollapsed(v => !v)}
          onViewReport={(id) => { setPreviewReportId(id); setPage('report-preview') }} />
        <FieldTree collapsed={fieldCollapsed} onToggleCollapse={() => setFieldCollapsed(v => !v)} />
        <main className="content-area" id="main-content">
          <QCOverview onCardClick={handleCardClick} hoveredCard={hoveredCard} datasetId={selectedDatasetId} />
        </main>
        <StepToolsPanel
          activeStep={activeStep}
          onStepClick={(type) => {
            setActiveStep(type)
            setHoveredCard(type)
            setTimeout(() => setHoveredCard(null), 1200)
          }}
          onCreateReport={() => setCreateReportOpen(true)}
          collapsed={stepCollapsed}
          onToggleCollapse={() => setStepCollapsed(v => !v)}
        />
        <CreateReportDialog open={createReportOpen}
          onClose={() => setCreateReportOpen(false)}
          onConfirm={() => setCreateReportOpen(false)} />
      </div>
    </div>
  )
}
