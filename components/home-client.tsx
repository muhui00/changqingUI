'use client'

import { useState } from 'react'
import { DatasetList, MOCK_DATASETS, type Dataset } from './dataset-list'
import { FieldTree } from './field-tree'
import { QCOverview, type QCCardType } from './qc-overview'
import { StepToolsPanel } from './step-tools-panel'
import { TopNav } from './top-nav'
import { ReportCenter, CreateReportDialog } from './report-center'
import { ReportPreview } from './report-preview'
import { ConsistencyWorkspace, type QCWorkspaceType } from './consistency-workspace'
import { CompletenessWorkspace } from './completeness-workspace'
import { DistributionWorkspace } from './distribution-workspace'
import { CorrelationWorkspace } from './correlation-workspace'
import { SampleManagement } from './sample-management'
import { VisualizationPage } from './visualization-page'
import { FieldStandardLibrary } from './field-standard-library'
import { QCRuleLibrary } from './qc-rule-library'
import { WeightedScoring } from './weighted-scoring'

type AppPage = 'overview' | 'report-center' | 'report-preview' | 'qc-workspace' | 'sample-management' | 'visualization' | 'field-standard' | 'qc-rule' | 'weighted-scoring'

export function HomeClient() {
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS)
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('1')
  // 已完成质检的数据集：初始化中 / 创建失败的数据集尚无质检数据
  const [qcedIds, setQcedIds] = useState<Set<string>>(
    () => new Set(MOCK_DATASETS.filter(d => d.status !== '初始化中' && d.status !== '创建失败').map(d => d.id)),
  )
  const [hoveredCard, setHoveredCard] = useState<QCCardType | null>(null)
  const [activeStep, setActiveStep] = useState<QCCardType | null>(null)
  const [datasetCollapsed, setDatasetCollapsed] = useState(false)
  const [fieldCollapsed, setFieldCollapsed] = useState(false)
  const [stepCollapsed, setStepCollapsed] = useState(false)
  const [page, setPage] = useState<AppPage>('overview')
  const [previewReportId, setPreviewReportId] = useState<string>('')
  const [createReportOpen, setCreateReportOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState<QCWorkspaceType>('consistency')

  // 质检流程完成：标记该数据集已质检，状态置为待复核
  const handleQCComplete = (id: string) => {
    setQcedIds(prev => { const n = new Set(prev); n.add(id); return n })
    setDatasets(prev => prev.map(d => (d.id === id ? { ...d, status: '待复核' } : d)))
  }

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
  const handleNavToFieldStandard = () => setPage('field-standard')
  const handleNavToQCRule = () => setPage('qc-rule')
  const handleNavToWeightedScoring = () => setPage('weighted-scoring')

  const handlePreviewReport = (id: string) => {
    setPreviewReportId(id)
    setPage('report-preview')
  }

  const handleBackToReportCenter = () => setPage('report-center')

  // 创建报告并直接跳转到报告预览页面
  const handleCreateReportAndPreview = () => {
    setCreateReportOpen(false)
    setPreviewReportId(String(Date.now()))
    setPage('report-preview')
  }

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
          onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
        <div className="workspace" style={{ overflow: 'hidden' }}>
          <VisualizationPage onBack={handleNavToOverview} />
        </div>
      </div>
    )
  }

  // ── 字段标准库 ──
  if (page === 'field-standard') {
    return (
      <div className="app-shell">
        <TopNav activePage="field-standard"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
        <div className="rc-page-shell">
          <FieldStandardLibrary />
        </div>
      </div>
    )
  }

  // ── 质检规则库 ──
  if (page === 'qc-rule') {
    return (
      <div className="app-shell">
        <TopNav activePage="qc-rule"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
        <div className="rc-page-shell">
          <QCRuleLibrary />
        </div>
      </div>
    )
  }

  // ── 模板配置 ──
  if (page === 'weighted-scoring') {
    return (
      <div className="app-shell">
        <TopNav activePage="weighted-scoring"
          onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
        <div className="workspace" style={{ overflow: 'hidden' }}>
          <WeightedScoring />
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
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
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
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
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
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
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
          onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
        <div className="workspace">
          <DatasetList datasets={datasets} onDatasetsChange={setDatasets}
            selectedId={selectedDatasetId} onSelect={setSelectedDatasetId}
            collapsed={datasetCollapsed} onToggleCollapse={() => setDatasetCollapsed(v => !v)}
            onViewReport={(id) => { setPreviewReportId(id); setPage('report-preview') }} />
          <FieldTree collapsed={fieldCollapsed} onToggleCollapse={() => setFieldCollapsed(v => !v)} />
          <main className="content-area" id="main-content">
            {activeWorkspace === 'consistency' && (
              <ConsistencyWorkspace onBack={handleNavToOverview} onSwitchTab={handleSwitchWorkspaceTab} />
            )}
            {activeWorkspace === 'completeness' && (
              <CompletenessWorkspace onBack={handleNavToOverview} onSwitchTab={handleSwitchWorkspaceTab} />
            )}
            {activeWorkspace === 'distribution' && (
              <DistributionWorkspace onBack={handleNavToOverview} onSwitchTab={handleSwitchWorkspaceTab} />
            )}
            {activeWorkspace === 'correlation' && (
              <CorrelationWorkspace onBack={handleNavToOverview} onSwitchTab={handleSwitchWorkspaceTab} />
            )}
          </main>
          <StepToolsPanel
            datasetId={selectedDatasetId}
            qced={qcedIds.has(selectedDatasetId)}
            onQCComplete={() => handleQCComplete(selectedDatasetId)}
            activeStep={activeWorkspace as QCCardType}
            onStepClick={(type) => handleSwitchWorkspaceTab(type as QCWorkspaceType)}
            onCreateReport={() => setCreateReportOpen(true)}
            collapsed={stepCollapsed}
            onToggleCollapse={() => setStepCollapsed(v => !v)}
          />
          <CreateReportDialog open={createReportOpen}
            onClose={() => setCreateReportOpen(false)}
            onConfirm={handleCreateReportAndPreview} />
        </div>
      </div>
    )
  }

  // ── 数据质检总览（默认首页）──
  return (
    <div className="app-shell">
      <TopNav currentDataset="苏里格区块2024年综合数据集" activePage="overview"
        onNavOverview={handleNavToOverview} onNavReportCenter={handleNavToReportCenter}
        onNavSampleManagement={handleNavToSampleManagement} onNavVisualization={handleNavToVisualization}
          onNavFieldStandard={handleNavToFieldStandard} onNavQCRule={handleNavToQCRule}
          onNavWeightedScoring={handleNavToWeightedScoring} />
      <div className="workspace">
        <DatasetList datasets={datasets} onDatasetsChange={setDatasets}
          selectedId={selectedDatasetId} onSelect={setSelectedDatasetId}
          collapsed={datasetCollapsed} onToggleCollapse={() => setDatasetCollapsed(v => !v)}
          onViewReport={(id) => { setPreviewReportId(id); setPage('report-preview') }} />
        <FieldTree collapsed={fieldCollapsed} onToggleCollapse={() => setFieldCollapsed(v => !v)} />
        <main className="content-area" id="main-content">
          <QCOverview onCardClick={handleCardClick} hoveredCard={hoveredCard}
            datasetId={selectedDatasetId} datasetMeta={datasets.find(d => d.id === selectedDatasetId)}
            qced={qcedIds.has(selectedDatasetId)} />
        </main>
        <StepToolsPanel
          datasetId={selectedDatasetId}
          qced={qcedIds.has(selectedDatasetId)}
          onQCComplete={() => handleQCComplete(selectedDatasetId)}
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
          onConfirm={handleCreateReportAndPreview} />
      </div>
    </div>
  )
}
