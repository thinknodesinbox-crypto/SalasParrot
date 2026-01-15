import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'

// Types
export interface SequenceNode {
  id: string
  type: 'start' | 'linkedin_connect' | 'linkedin_message' | 'linkedin_follow' | 'linkedin_view' | 'email' | 'delay' | 'condition' | 'end'
  data: NodeData
  position?: { x: number; y: number }
  parentId?: string
  branch?: 'true' | 'false' // For nodes under a condition
}

interface NodeData {
  label?: string
  message?: string
  subject?: string
  delayDays?: number
  delayHours?: number
  condition?: 'connected' | 'replied' | 'opened'
  trueBranch?: string
  falseBranch?: string
}

interface SequenceCanvasProps {
  nodes: SequenceNode[]
  onNodesChange: (nodes: SequenceNode[]) => void
  onNodeSelect: (node: SequenceNode | null) => void
  selectedNodeId: string | null
}

export function SequenceCanvas({ nodes, onNodesChange, onNodeSelect, selectedNodeId }: SequenceCanvasProps) {
  const [zoom, setZoom] = useState(100)

  const handleDeleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node?.type === 'start') return // Can't delete start
    onNodesChange(nodes.filter(n => n.id !== nodeId))
    if (selectedNodeId === nodeId) onNodeSelect(null)
  }, [nodes, onNodesChange, selectedNodeId, onNodeSelect])

  const handleAddNode = useCallback((type: SequenceNode['type'], afterId?: string, branch?: 'true' | 'false') => {
    const newNode: SequenceNode = {
      id: `node-${Date.now()}`,
      type,
      data: getDefaultNodeData(type),
      parentId: afterId,
      branch,
    }

    if (afterId) {
      const afterIndex = nodes.findIndex(n => n.id === afterId)
      const newNodes = [...nodes]
      newNodes.splice(afterIndex + 1, 0, newNode)
      onNodesChange(newNodes)
    } else {
      // Add before end or at the end
      const endIndex = nodes.findIndex(n => n.type === 'end')
      if (endIndex !== -1) {
        const newNodes = [...nodes]
        newNodes.splice(endIndex, 0, newNode)
        onNodesChange(newNodes)
      } else {
        onNodesChange([...nodes, newNode])
      }
    }
  }, [nodes, onNodesChange])

  // Build tree structure from flat nodes
  const buildTree = useCallback(() => {
    const mainFlow: SequenceNode[] = []
    const conditionBranches: Map<string, { true: SequenceNode[], false: SequenceNode[] }> = new Map()

    nodes.forEach(node => {
      if (node.type === 'condition') {
        conditionBranches.set(node.id, { true: [], false: [] })
      }
    })

    nodes.forEach(node => {
      if (node.parentId && node.branch) {
        const branches = conditionBranches.get(node.parentId)
        if (branches) {
          branches[node.branch].push(node)
        }
      } else if (node.type !== 'end') {
        mainFlow.push(node)
      }
    })

    return { mainFlow, conditionBranches }
  }, [nodes])

  const { mainFlow, conditionBranches } = buildTree()

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFC] overflow-hidden relative">
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white rounded-lg border border-[#E2E8F0] shadow-sm">
        <button
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-l-lg transition-colors"
        >
          <MinusIcon className="w-4 h-4" />
        </button>
        <span className="px-2 text-sm font-medium text-[#1E293B] min-w-[40px] text-center">{zoom}</span>
        <button
          onClick={() => setZoom(Math.min(150, zoom + 10))}
          className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-r-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8">
        <div
          className="min-h-full flex flex-col items-center pt-8"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Render tree */}
          {mainFlow.map((node, index) => (
            <div key={node.id} className="flex flex-col items-center">
              {/* Connector line from previous */}
              {index > 0 && <ConnectorLine />}

              {/* Node */}
              <TreeNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => onNodeSelect(node)}
                onDelete={() => handleDeleteNode(node.id)}
              />

              {/* Condition branches */}
              {node.type === 'condition' && (
                <ConditionBranches
                  conditionType={node.data.condition || 'connected'}
                  trueBranch={conditionBranches.get(node.id)?.true || []}
                  falseBranch={conditionBranches.get(node.id)?.false || []}
                  selectedNodeId={selectedNodeId}
                  onNodeSelect={onNodeSelect}
                  onDeleteNode={handleDeleteNode}
                  onAddNode={(type, branch) => handleAddNode(type, node.id, branch)}
                />
              )}

              {/* Add action button after non-condition nodes (except start) */}
              {node.type !== 'condition' && node.type !== 'start' && index === mainFlow.length - 1 && (
                <>
                  <ConnectorLine />
                  <AddActionButton onAdd={(type) => handleAddNode(type)} />
                </>
              )}
            </div>
          ))}

          {/* Initial add button if only start node */}
          {mainFlow.length === 1 && mainFlow[0].type === 'start' && (
            <>
              <ConnectorLine />
              <AddActionButton onAdd={(type) => handleAddNode(type)} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Connector Line Component
function ConnectorLine({ height = 32 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ height }}>
      <div className="w-0.5 h-full bg-[#CBD5E1]" />
    </div>
  )
}

// Tree Node Component (pill style)
function TreeNode({
  node,
  isSelected,
  onSelect,
  onDelete,
}: {
  node: SequenceNode
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const config = getNodeConfig(node.type)
  const canDelete = node.type !== 'start'

  // Special styling for start node
  if (node.type === 'start') {
    return (
      <motion.div
        className="flex items-center gap-2 text-[#1E293B]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SendIcon className="w-5 h-5 text-[#64748B]" />
        <span className="font-medium">Campaign Start</span>
      </motion.div>
    )
  }

  // Get display label
  const getDisplayLabel = () => {
    switch (node.type) {
      case 'condition':
        return `If ${node.data.condition === 'connected' ? 'Connection' : node.data.condition === 'replied' ? 'Replied' : 'Opened'}`
      case 'delay': {
        const days = node.data.delayDays || 0
        const hours = node.data.delayHours || 0
        if (days === 0 && hours === 0) return 'No Delay'
        if (days === 1 && hours === 0) return '1 Day'
        if (days > 1 && hours === 0) return `${days} Days`
        if (days === 0) return `${hours}h`
        return `${days}d ${hours}h`
      }
      case 'linkedin_view':
        return 'View Profile'
      case 'linkedin_connect':
        return 'Connect'
      case 'linkedin_message':
        return 'Message'
      case 'linkedin_follow':
        return 'Follow'
      case 'email':
        return 'Email'
      default:
        return config.label
    }
  }

  return (
    <motion.button
      onClick={onSelect}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 bg-white
        transition-all cursor-pointer group
        ${isSelected
          ? 'border-[#FF6B35] shadow-[0_0_0_4px_rgba(255,107,53,0.15)]'
          : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${config.color}15` }}
      >
        {config.icon}
      </div>
      <span className="text-sm font-medium text-[#1E293B] whitespace-nowrap">
        {getDisplayLabel()}
      </span>
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#FEE2E2] transition-all ml-1"
        >
          <CloseIcon className="w-3 h-3 text-[#64748B] hover:text-[#EF4444]" />
        </button>
      )}
    </motion.button>
  )
}

// Condition Branches Component
function ConditionBranches({
  conditionType,
  trueBranch,
  falseBranch,
  selectedNodeId,
  onNodeSelect,
  onDeleteNode,
  onAddNode,
}: {
  conditionType: string
  trueBranch: SequenceNode[]
  falseBranch: SequenceNode[]
  selectedNodeId: string | null
  onNodeSelect: (node: SequenceNode | null) => void
  onDeleteNode: (id: string) => void
  onAddNode: (type: SequenceNode['type'], branch: 'true' | 'false') => void
}) {
  const falseLabel = conditionType === 'connected' ? 'Not Connected' : conditionType === 'replied' ? 'Not Replied' : 'Not Opened'
  const trueLabel = conditionType === 'connected' ? 'Connected' : conditionType === 'replied' ? 'Replied' : 'Opened'

  // Check if branches have end nodes
  const falseBranchEnded = falseBranch.some(node => node.type === 'end')
  const trueBranchEnded = trueBranch.some(node => node.type === 'end')

  return (
    <div className="flex flex-col items-center">
      {/* Branch split connector */}
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-6 bg-[#CBD5E1]" />
        <div className="relative">
          {/* Horizontal line */}
          <div className="w-[280px] h-0.5 bg-[#CBD5E1]" />
          {/* Left vertical connector */}
          <div className="absolute left-0 top-0 w-0.5 h-6 bg-[#CBD5E1]" />
          {/* Right vertical connector */}
          <div className="absolute right-0 top-0 w-0.5 h-6 bg-[#CBD5E1]" />
        </div>
      </div>

      {/* Two branches */}
      <div className="flex gap-16 mt-6">
        {/* False Branch (Not Connected) */}
        <div className="flex flex-col items-center min-w-[140px]">
          {/* Branch Label */}
          <div className="flex items-center gap-2 text-[#64748B] mb-4">
            <UserIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{falseLabel}</span>
          </div>

          {/* Branch nodes */}
          {falseBranch.map((node, index) => (
            <div key={node.id} className="flex flex-col items-center">
              {index > 0 && <ConnectorLine height={24} />}
              <TreeNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => onNodeSelect(node)}
                onDelete={() => onDeleteNode(node.id)}
              />
            </div>
          ))}

          {/* Add action / End for false branch (only if not ended) */}
          {!falseBranchEnded && (
            <>
              <ConnectorLine height={24} />
              <BranchEndButtons
                onAddAction={(type) => onAddNode(type, 'false')}
                onEnd={() => onAddNode('end', 'false')}
              />
            </>
          )}
        </div>

        {/* True Branch (Connected) */}
        <div className="flex flex-col items-center min-w-[140px]">
          {/* Branch Label */}
          <div className="flex items-center gap-2 text-[#64748B] mb-4">
            <UserIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{trueLabel}</span>
          </div>

          {/* Branch nodes */}
          {trueBranch.map((node, index) => (
            <div key={node.id} className="flex flex-col items-center">
              {index > 0 && <ConnectorLine height={24} />}
              <TreeNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => onNodeSelect(node)}
                onDelete={() => onDeleteNode(node.id)}
              />
            </div>
          ))}

          {/* Add action / End for true branch (only if not ended) */}
          {!trueBranchEnded && (
            <>
              <ConnectorLine height={24} />
              <BranchEndButtons
                onAddAction={(type) => onAddNode(type, 'true')}
                onEnd={() => onAddNode('end', 'true')}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Branch End Buttons (Add action + End)
function BranchEndButtons({
  onAddAction,
  onEnd,
}: {
  onAddAction: (type: SequenceNode['type']) => void
  onEnd: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#14B8A6] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488] transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="w-4 h-4" />
          Add action
        </motion.button>

        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 z-50"
              >
                <p className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase">LinkedIn</p>
                <ActionMenuItem icon={<LinkedInIcon className="w-4 h-4" />} label="Connection Request" onClick={() => { onAddAction('linkedin_connect'); setShowMenu(false) }} />
                <ActionMenuItem icon={<MessageIcon className="w-4 h-4" />} label="Send Message" onClick={() => { onAddAction('linkedin_message'); setShowMenu(false) }} />
                <ActionMenuItem icon={<EyeIcon className="w-4 h-4" />} label="View Profile" onClick={() => { onAddAction('linkedin_view'); setShowMenu(false) }} />
                <ActionMenuItem icon={<FollowIcon className="w-4 h-4" />} label="Follow" onClick={() => { onAddAction('linkedin_follow'); setShowMenu(false) }} />

                <div className="my-1 border-t border-[#E2E8F0]" />
                <p className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase">Email</p>
                <ActionMenuItem icon={<EmailIcon className="w-4 h-4" />} label="Send Email" onClick={() => { onAddAction('email'); setShowMenu(false) }} />

                <div className="my-1 border-t border-[#E2E8F0]" />
                <p className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase">Logic</p>
                <ActionMenuItem icon={<ClockIcon className="w-4 h-4" />} label="Wait / Delay" onClick={() => { onAddAction('delay'); setShowMenu(false) }} />
                <ActionMenuItem icon={<BranchIcon className="w-4 h-4" />} label="If / Then" onClick={() => { onAddAction('condition'); setShowMenu(false) }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        onClick={onEnd}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2E8F0] text-[#64748B] rounded-lg text-sm font-medium hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <CheckCircleIcon className="w-4 h-4" />
        End
      </motion.button>
    </div>
  )
}

// Add Action Button (main flow)
function AddActionButton({ onAdd }: { onAdd: (type: SequenceNode['type']) => void }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#14B8A6] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488] transition-colors shadow-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <PlusIcon className="w-4 h-4" />
        Add action
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 z-50"
            >
              <p className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase">LinkedIn</p>
              <ActionMenuItem icon={<LinkedInIcon className="w-4 h-4" />} label="Connection Request" onClick={() => { onAdd('linkedin_connect'); setShowMenu(false) }} />
              <ActionMenuItem icon={<MessageIcon className="w-4 h-4" />} label="Send Message" onClick={() => { onAdd('linkedin_message'); setShowMenu(false) }} />
              <ActionMenuItem icon={<EyeIcon className="w-4 h-4" />} label="View Profile" onClick={() => { onAdd('linkedin_view'); setShowMenu(false) }} />
              <ActionMenuItem icon={<FollowIcon className="w-4 h-4" />} label="Follow" onClick={() => { onAdd('linkedin_follow'); setShowMenu(false) }} />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase">Email</p>
              <ActionMenuItem icon={<EmailIcon className="w-4 h-4" />} label="Send Email" onClick={() => { onAdd('email'); setShowMenu(false) }} />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase">Logic</p>
              <ActionMenuItem icon={<ClockIcon className="w-4 h-4" />} label="Wait / Delay" onClick={() => { onAdd('delay'); setShowMenu(false) }} />
              <ActionMenuItem icon={<BranchIcon className="w-4 h-4" />} label="If / Then" onClick={() => { onAdd('condition'); setShowMenu(false) }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Action Menu Item
function ActionMenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-[#1E293B] hover:bg-[#F8FAFC] transition-colors text-left"
    >
      <span className="text-[#64748B]">{icon}</span>
      {label}
    </button>
  )
}

// Template presets for quick start
export const SEQUENCE_TEMPLATES = {
  linkedinBasic: {
    name: 'LinkedIn Basic',
    description: 'Connect, wait, then message',
    nodes: [
      { id: 'start', type: 'start' as const, data: {} },
      { id: 't1', type: 'linkedin_connect' as const, data: { message: 'Hi {{firstName}}, I came across your profile and would love to connect!' } },
      { id: 't2', type: 'delay' as const, data: { delayDays: 2, delayHours: 0 } },
      { id: 't3', type: 'linkedin_message' as const, data: { message: 'Thanks for connecting, {{firstName}}! I wanted to reach out because...' } },
      { id: 'end', type: 'end' as const, data: {} },
    ],
  },
  multiChannel: {
    name: 'Multi-Channel',
    description: 'LinkedIn + Email follow-up',
    nodes: [
      { id: 'start', type: 'start' as const, data: {} },
      { id: 't1', type: 'linkedin_connect' as const, data: { message: 'Hi {{firstName}}, loved your insights on {{company}}!' } },
      { id: 't2', type: 'delay' as const, data: { delayDays: 3, delayHours: 0 } },
      { id: 't3', type: 'condition' as const, data: { condition: 'connected' as const } },
      { id: 't4', type: 'linkedin_message' as const, data: { message: 'Thanks for connecting! Quick question about {{company}}...' }, parentId: 't3', branch: 'true' as const },
      { id: 't5', type: 'email' as const, data: { subject: 'Quick question, {{firstName}}', message: 'Hi {{firstName}},\n\nI tried connecting on LinkedIn but wanted to make sure my message reached you...' }, parentId: 't3', branch: 'false' as const },
      { id: 'end', type: 'end' as const, data: {} },
    ],
  },
  emailOnly: {
    name: 'Email Sequence',
    description: '3-touch email campaign',
    nodes: [
      { id: 'start', type: 'start' as const, data: {} },
      { id: 't1', type: 'email' as const, data: { subject: 'Quick question for {{company}}', message: 'Hi {{firstName}},\n\nI noticed that {{company}} is...' } },
      { id: 't2', type: 'delay' as const, data: { delayDays: 3, delayHours: 0 } },
      { id: 't3', type: 'email' as const, data: { subject: 'Re: Quick question for {{company}}', message: 'Hi {{firstName}},\n\nJust wanted to follow up on my previous email...' } },
      { id: 't4', type: 'delay' as const, data: { delayDays: 4, delayHours: 0 } },
      { id: 't5', type: 'email' as const, data: { subject: 'Last attempt', message: 'Hi {{firstName}},\n\nI don\'t want to be a pest, but I\'ll close the loop here...' } },
      { id: 'end', type: 'end' as const, data: {} },
    ],
  },
}

// Step Palette (sidebar)
export function StepPalette({ onAddStep, onApplyTemplate }: { onAddStep: (type: SequenceNode['type']) => void; onApplyTemplate?: (nodes: SequenceNode[]) => void }) {
  const [showTemplates, setShowTemplates] = useState(false)
  const stepCategories = [
    {
      title: 'LinkedIn',
      color: '#0A66C2',
      steps: [
        { type: 'linkedin_connect' as const, label: 'Connection Request', icon: <LinkedInIcon className="w-4 h-4" /> },
        { type: 'linkedin_message' as const, label: 'Send Message', icon: <MessageIcon className="w-4 h-4" /> },
        { type: 'linkedin_view' as const, label: 'View Profile', icon: <EyeIcon className="w-4 h-4" /> },
        { type: 'linkedin_follow' as const, label: 'Follow', icon: <FollowIcon className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Email',
      color: '#14B8A6',
      steps: [
        { type: 'email' as const, label: 'Send Email', icon: <EmailIcon className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Logic',
      color: '#8B5CF6',
      steps: [
        { type: 'delay' as const, label: 'Wait / Delay', icon: <ClockIcon className="w-4 h-4" /> },
        { type: 'condition' as const, label: 'If / Then', icon: <BranchIcon className="w-4 h-4" /> },
      ],
    },
  ]

  return (
    <div className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col">
      <div className="p-4 border-b border-[#E2E8F0]">
        <h3 className="font-semibold text-[#1E293B] text-sm">Add Step</h3>
        <p className="text-xs text-[#64748B] mt-1">Click to add to sequence</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {stepCategories.map((category) => (
          <div key={category.title}>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 px-1">
              {category.title}
            </p>
            <div className="space-y-1.5">
              {category.steps.map((step) => (
                <motion.button
                  key={step.type}
                  onClick={() => onAddStep(step.type)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#FF6B35]/40 hover:shadow-sm transition-all text-left group"
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                    }}
                  >
                    {step.icon}
                  </div>
                  <span className="text-sm text-[#1E293B] font-medium group-hover:text-[#FF6B35] transition-colors">
                    {step.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Templates Section */}
      {onApplyTemplate && (
        <div className="p-3 border-t border-[#E2E8F0]">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 px-1">
            Quick Start
          </p>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] border border-[#FF6B35]/20 hover:border-[#FF6B35]/40 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
              <TemplateIcon className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-[#1E293B] font-medium block">Use Template</span>
              <span className="text-[10px] text-[#64748B]">Start with proven sequences</span>
            </div>
            <ChevronIcon className={`w-4 h-4 text-[#64748B] transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-1.5">
                  {Object.entries(SEQUENCE_TEMPLATES).map(([key, template]) => (
                    <motion.button
                      key={key}
                      onClick={() => {
                        onApplyTemplate(template.nodes.map((n, i) => ({ ...n, id: `${n.id}-${Date.now()}-${i}` })))
                        setShowTemplates(false)
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#FF6B35]/30 hover:bg-[#FFF7ED]/50 transition-all text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="text-sm font-medium text-[#1E293B]">{template.name}</p>
                      <p className="text-[10px] text-[#64748B]">{template.description}</p>
                      <div className="flex gap-1 mt-1.5">
                        {template.nodes
                          .filter(n => n.type !== 'start' && n.type !== 'end')
                          .slice(0, 4)
                          .map((n, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded flex items-center justify-center [&_svg]:w-3 [&_svg]:h-3"
                              style={{ backgroundColor: `${getNodeConfig(n.type).color}15` }}
                            >
                              {getNodeConfig(n.type).icon}
                            </div>
                          ))}
                        {template.nodes.filter(n => n.type !== 'start' && n.type !== 'end').length > 4 && (
                          <span className="text-[10px] text-[#64748B] flex items-center">+{template.nodes.filter(n => n.type !== 'start' && n.type !== 'end').length - 4}</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// Node Configuration Panel
export function NodeConfigPanel({
  node,
  onUpdate,
  onClose,
}: {
  node: SequenceNode
  onUpdate: (data: Partial<NodeData>) => void
  onClose: () => void
}) {
  const nodeConfig = getNodeConfig(node.type)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-80 bg-white border-l border-[#E2E8F0] flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${nodeConfig.color}15` }}
          >
            {nodeConfig.icon}
          </div>
          <div>
            <h3 className="font-semibold text-[#1E293B] text-sm">{nodeConfig.label}</h3>
            <p className="text-[10px] text-[#64748B]">Configure this step</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8FAFC]">
          <CloseIcon className="w-4 h-4 text-[#64748B]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Delay Configuration */}
        {node.type === 'delay' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">
                Wait Duration
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      value={node.data.delayDays || 0}
                      onChange={(e) => onUpdate({ delayDays: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full px-3 py-2 pr-12 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">days</span>
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      value={node.data.delayHours || 0}
                      onChange={(e) => onUpdate({ delayHours: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={23}
                      className="w-full px-3 py-2 pr-12 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">hours</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-lg p-3">
              <p className="text-xs text-[#64748B]">
                Lead will wait{' '}
                {(node.data.delayDays || 0) > 0 && (
                  <><strong className="text-[#1E293B]">{node.data.delayDays} day{(node.data.delayDays || 0) > 1 ? 's' : ''}</strong>{(node.data.delayHours || 0) > 0 ? ' and ' : ''}</>
                )}
                {(node.data.delayHours || 0) > 0 && (
                  <strong className="text-[#1E293B]">{node.data.delayHours} hours</strong>
                )}
                {(node.data.delayDays || 0) === 0 && (node.data.delayHours || 0) === 0 && (
                  <strong className="text-[#1E293B]">no time</strong>
                )}
                {' '}before the next step.
              </p>
            </div>
          </>
        )}

        {/* Message Configuration */}
        {(node.type === 'linkedin_message' || node.type === 'linkedin_connect') && (
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Message
            </label>
            <textarea
              value={node.data.message || ''}
              onChange={(e) => onUpdate({ message: e.target.value })}
              placeholder="Hi {{firstName}}, I noticed..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] text-sm resize-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['{{firstName}}', '{{company}}', '{{title}}'].map((variable) => (
                <button
                  key={variable}
                  onClick={() => onUpdate({ message: (node.data.message || '') + variable })}
                  className="px-2 py-1 text-[10px] font-medium text-[#FF6B35] bg-[#FFF7ED] rounded hover:bg-[#FFEDD5] transition-colors"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email Configuration */}
        {node.type === 'email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={node.data.subject || ''}
                onChange={(e) => onUpdate({ subject: e.target.value })}
                placeholder="Quick question, {{firstName}}"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">
                Email Body
              </label>
              <textarea
                value={node.data.message || ''}
                onChange={(e) => onUpdate({ message: e.target.value })}
                placeholder="Hi {{firstName}}..."
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] text-sm resize-none"
              />
            </div>
          </>
        )}

        {/* Condition Configuration */}
        {node.type === 'condition' && (
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Condition
            </label>
            <select
              value={node.data.condition || 'connected'}
              onChange={(e) => onUpdate({ condition: e.target.value as NodeData['condition'] })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] text-sm bg-white"
            >
              <option value="connected">If Connected</option>
              <option value="replied">If Replied</option>
              <option value="opened">If Email Opened</option>
            </select>
            <div className="mt-3 bg-[#F8FAFC] rounded-lg p-3">
              <p className="text-xs text-[#64748B]">
                Leads that match this condition will follow the <strong className="text-[#22C55E]">Connected</strong> branch.
                Others will follow the <strong className="text-[#EF4444]">Not Connected</strong> branch.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <button
          onClick={onClose}
          className="w-full py-2 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] transition-colors text-sm"
        >
          Done
        </button>
      </div>
    </motion.div>
  )
}

// Utility functions
function getNodeConfig(type: SequenceNode['type']) {
  const configs = {
    start: { label: 'Campaign Start', color: '#22C55E', icon: <SendIcon className="w-4 h-4 text-[#22C55E]" /> },
    linkedin_connect: { label: 'Connection Request', color: '#0A66C2', icon: <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" /> },
    linkedin_message: { label: 'LinkedIn Message', color: '#0A66C2', icon: <MessageIcon className="w-4 h-4 text-[#0A66C2]" /> },
    linkedin_follow: { label: 'Follow Profile', color: '#0A66C2', icon: <FollowIcon className="w-4 h-4 text-[#0A66C2]" /> },
    linkedin_view: { label: 'View Profile', color: '#0A66C2', icon: <EyeIcon className="w-4 h-4 text-[#0A66C2]" /> },
    email: { label: 'Send Email', color: '#14B8A6', icon: <EmailIcon className="w-4 h-4 text-[#14B8A6]" /> },
    delay: { label: 'Wait', color: '#F59E0B', icon: <ClockIcon className="w-4 h-4 text-[#F59E0B]" /> },
    condition: { label: 'Condition', color: '#8B5CF6', icon: <UserIcon className="w-4 h-4 text-[#8B5CF6]" /> },
    end: { label: 'End', color: '#64748B', icon: <CheckCircleIcon className="w-4 h-4 text-[#64748B]" /> },
  }
  return configs[type]
}

function getDefaultNodeData(type: SequenceNode['type']): NodeData {
  switch (type) {
    case 'delay':
      return { delayDays: 0, delayHours: 0 }
    case 'condition':
      return { condition: 'connected' }
    default:
      return {}
  }
}

// Icons
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function MinusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  )
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  )
}

function EmailIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function MessageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function EyeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function FollowIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}

function BranchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function SendIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function TemplateIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function ChevronIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
