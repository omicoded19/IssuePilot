import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FlowNode, type FlowNodeType } from './FlowNode'
import { FlowDetailsPanel } from './FlowDetailsPanel'
import { useProgressStore } from '@/store/progressStore'
import type { FlowNodeData, FlowNodeStatus } from '@/types/analytics'
import type { RealRepositoryAnalysis } from '@/types/repository-analysis'

const nodeTypes = { flowNode: FlowNode }

const statusOrder: FlowNodeStatus[] = [
  'Completed',
  'In Progress',
  'Ready',
  'Warning',
  'Locked',
]

function getNextStatus(current: FlowNodeStatus): FlowNodeStatus {
  const idx = statusOrder.indexOf(current)
  if (idx <= 1) return 'Completed'
  return statusOrder[idx - 1] ?? 'Ready'
}

function enrichFlowNodes(
  flowNodes: FlowNodeData[],
  analysis?: RealRepositoryAnalysis,
): FlowNodeData[] {
  if (!analysis) return flowNodes

  const averageScore = Math.round(
    Object.values(analysis.scores).reduce((sum, score) => sum + score.value, 0) /
      Object.keys(analysis.scores).length,
  )

  return flowNodes.map((node) => {
    if (node.id === 'repository-match') {
      return {
        ...node,
        description:
          'IssuePilot fetched this repository from GitHub and calculated transparent readiness scores from repository activity, documentation, setup files, and contribution signals.',
        importantInfo: [
          `Overall contribution readiness: ${averageScore}%`,
          `Primary language: ${analysis.repository.primaryLanguage ?? 'Not detected'}`,
          `${analysis.technologies.length} technologies detected from evidence`,
        ],
      }
    }

    if (node.id === 'read-guidelines') {
      const hasGuide = analysis.contributionReadiness.hasContributingGuide
      return {
        ...node,
        status: hasGuide ? node.status : 'Warning',
        description: hasGuide
          ? `Review ${analysis.documents.contributing.path} and the README before choosing an issue.`
          : 'No contribution guide was detected. Read the README, issue templates, and recently merged pull requests before starting.',
        importantInfo: [
          `README: ${analysis.documents.readme.exists ? 'detected' : 'not detected'}`,
          `Contribution guide: ${hasGuide ? 'detected' : 'not detected'}`,
          `Pull-request template: ${analysis.documents.pullRequestTemplate.exists ? 'detected' : 'not detected'}`,
        ],
      }
    }

    if (node.id === 'prepare-environment') {
      const canInstall = Boolean(analysis.setup.installCommand)
      return {
        ...node,
        status: canInstall ? node.status : 'Warning',
        requiredActions: [
          `Clone ${analysis.repository.fullName}`,
          analysis.setup.installCommand ?? 'Find the installation command in repository documentation',
          analysis.setup.developmentCommand ?? 'Find the development command in repository documentation',
          analysis.setup.testCommand ?? 'Find and run the project test command',
        ],
        importantInfo: [
          `Package manager: ${analysis.setup.packageManager ?? 'not detected'}`,
          `Node.js version: ${analysis.setup.nodeVersion ?? 'not detected'}`,
          `Docker: ${analysis.setup.requiresDocker ? 'detected' : 'not detected'}`,
        ],
      }
    }

    if (node.id === 'understand-architecture') {
      return {
        ...node,
        description:
          'Start with the root-level map returned by GitHub. Deep source-code architecture analysis is intentionally postponed until a later phase.',
        requiredActions: [
          'Review root folders and configuration files',
          'Identify the package or service related to your selected issue',
          'Trace existing tests before editing implementation code',
        ],
        importantInfo: [
          `${analysis.rootStructure.filter((entry) => entry.type === 'dir').length} root folders detected`,
          `${analysis.rootStructure.filter((entry) => entry.type === 'file').length} root files detected`,
          'File relevance has not been AI-generated in this phase',
        ],
      }
    }

    if (node.id === 'select-issue') {
      return {
        ...node,
        status: analysis.issues.length > 0 ? node.status : 'Warning',
        description:
          analysis.issues.length > 0
            ? 'Review the real open issues retrieved from GitHub, with beginner-oriented labels ranked first.'
            : 'No suitable labelled issues were returned. Inspect the repository issue tracker manually.',
        importantInfo: [
          `${analysis.issues.length} open issue recommendations stored`,
          'Pull requests are excluded from the list',
          'Availability is an estimate and must be confirmed with maintainers',
        ],
      }
    }

    if (node.id === 'check-availability' && analysis.issues.length > 0) {
      const available = analysis.issues.filter(
        (issue) => issue.availabilityStatus === 'probably_available',
      ).length
      return {
        ...node,
        importantInfo: [
          `${available} issue(s) currently look probably available`,
          'Read discussion comments before claiming an issue',
          'Post a concise implementation plan for maintainer confirmation',
        ],
      }
    }

    return node
  })
}

interface PreparationFlowProps {
  repositoryAnalysis?: RealRepositoryAnalysis
}

export function PreparationFlow({
  repositoryAnalysis,
}: PreparationFlowProps) {
  const { flowNodes, updateNodeStatus, toggleChecklistItem } = useProgressStore()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const displayFlowNodes = useMemo(
    () => enrichFlowNodes(flowNodes, repositoryAnalysis),
    [flowNodes, repositoryAnalysis],
  )

  const graphNodes: Node[] = useMemo(
    () =>
      displayFlowNodes.map((node, i) => ({
        id: node.id,
        type: 'flowNode',
        position: {
          x: (i % 4) * 240,
          y: Math.floor(i / 4) * 120,
        },
        data: {
          label: node.label,
          status: node.status,
          description: node.description,
        } satisfies FlowNodeType,
      })),
    [displayFlowNodes],
  )

  const graphEdges: Edge[] = useMemo(
    () =>
      displayFlowNodes.slice(0, -1).map((node, i) => ({
        id: `e-${node.id}-${displayFlowNodes[i + 1]?.id ?? 'end'}`,
        source: node.id,
        target: displayFlowNodes[i + 1]?.id ?? node.id,
        animated:
          node.status === 'Completed' || node.status === 'In Progress',
        style: { stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 2 },
      })),
    [displayFlowNodes],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges)

  useEffect(() => {
    setNodes(graphNodes)
    setEdges(graphEdges)
  }, [graphEdges, graphNodes, setEdges, setNodes])

  const selectedNode =
    displayFlowNodes.find((node) => node.id === selectedNodeId) ?? null

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const handleContinue = () => {
    if (!selectedNode) return
    updateNodeStatus(selectedNode.id, getNextStatus(selectedNode.status))
    const nextIdx = flowNodes.findIndex((node) => node.id === selectedNode.id) + 1
    const nextNode = flowNodes[nextIdx]
    if (nextNode?.status === 'Locked') {
      updateNodeStatus(nextNode.id, 'Ready')
    }
  }

  return (
    <div className="relative h-[500px] overflow-hidden rounded-xl border border-white/10 bg-[#080c18] sm:h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.03)" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = (node.data as unknown as FlowNodeType).status
            if (status === 'Completed') return '#10b981'
            if (status === 'In Progress') return '#3b82f6'
            if (status === 'Ready') return '#06b6d4'
            if (status === 'Warning') return '#f59e0b'
            return '#475569'
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>

      <FlowDetailsPanel
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
        onToggleChecklist={(itemId) =>
          selectedNode && toggleChecklistItem(selectedNode.id, itemId)
        }
        onContinue={handleContinue}
      />
    </div>
  )
}
