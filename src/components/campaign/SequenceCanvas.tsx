import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useState, useCallback, useRef } from 'react'

// Types
export interface SequenceNode {
  id: string
  type: 'start' | 'linkedin_connect' | 'linkedin_message' | 'linkedin_follow' | 'linkedin_view' | 'email' | 'delay' | 'condition' | 'end'
  data: NodeData
  position?: { x: number; y: number }
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
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    const nodeType = e.dataTransfer.getData('nodeType') as SequenceNode['type']
    if (!nodeType) return

    const newNode: SequenceNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      data: getDefaultNodeData(nodeType),
    }

    // Insert before the end node
    const endIndex = nodes.findIndex(n => n.type === 'end')
    if (endIndex !== -1) {
      const newNodes = [...nodes]
      newNodes.splice(endIndex, 0, newNode)
      onNodesChange(newNodes)
    } else {
      onNodesChange([...nodes, newNode])
    }
  }, [nodes, onNodesChange])

  const handleDeleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node?.type === 'start' || node?.type === 'end') return // Can't delete start/end
    onNodesChange(nodes.filter(n => n.id !== nodeId))
    if (selectedNodeId === nodeId) onNodeSelect(null)
  }, [nodes, onNodesChange, selectedNodeId, onNodeSelect])

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeIndex = nodes.findIndex(n => n.id === nodeId)
    const node = nodes[nodeIndex]
    if (!node || node.type === 'start' || node.type === 'end') return

    const newNode: SequenceNode = {
      ...node,
      id: `node-${Date.now()}`,
      data: { ...node.data },
    }

    const newNodes = [...nodes]
    newNodes.splice(nodeIndex + 1, 0, newNode)
    onNodesChange(newNodes)
  }, [nodes, onNodesChange])

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFC] overflow-hidden">
      {/* Canvas Header */}
      <div className="px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-sm font-medium text-[#1E293B]">
            {nodes.filter(n => n.type !== 'start' && n.type !== 'end').length} steps
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition-colors">
            Undo
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition-colors">
            Redo
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`flex-1 overflow-y-auto p-6 transition-colors ${
          isDraggingOver ? 'bg-[#FFF7ED]' : ''
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        <div className="max-w-md mx-auto">
          {/* Flow visualization */}
          <Reorder.Group
            axis="y"
            values={nodes}
            onReorder={(newNodes) => {
              // Ensure start stays first and end stays last
              const startNode = newNodes.find(n => n.type === 'start')
              const endNode = newNodes.find(n => n.type === 'end')
              const middleNodes = newNodes.filter(n => n.type !== 'start' && n.type !== 'end')

              if (startNode && endNode) {
                onNodesChange([startNode, ...middleNodes, endNode])
              }
            }}
            className="space-y-0"
          >
            {nodes.map((node, index) => (
              <CanvasNode
                key={node.id}
                node={node}
                index={index}
                isSelected={selectedNodeId === node.id}
                isLast={index === nodes.length - 1}
                onSelect={() => onNodeSelect(node)}
                onDelete={() => handleDeleteNode(node.id)}
                onDuplicate={() => handleDuplicateNode(node.id)}
                canReorder={node.type !== 'start' && node.type !== 'end'}
              />
            ))}
          </Reorder.Group>

          {/* Empty state / drop zone */}
          {nodes.length <= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] flex items-center justify-center">
                <PlusIcon className="w-6 h-6 text-[#94A3B8]" />
              </div>
              <p className="text-sm text-[#64748B]">
                Drag steps from the sidebar or click to add
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// Individual Canvas Node
function CanvasNode({
  node,
  index,
  isSelected,
  isLast,
  onSelect,
  onDelete,
  onDuplicate,
  canReorder,
}: {
  node: SequenceNode
  index: number
  isSelected: boolean
  isLast: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  canReorder: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const dragControls = useDragControls()
  const nodeConfig = getNodeConfig(node.type)

  const nodeContent = (
    <div className="relative">
      {/* Connection line above (except for first) */}
      {index > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-0.5 h-6 bg-gradient-to-b from-transparent to-[#E2E8F0]" />
      )}

      {/* Node Card */}
      <motion.div
        onClick={onSelect}
        className={`relative bg-white rounded-xl border-2 transition-all cursor-pointer group ${
          isSelected
            ? 'border-[#FF6B35] shadow-[0_0_0_4px_rgba(255,107,53,0.1)]'
            : 'border-[#E2E8F0] hover:border-[#FF6B35]/40 hover:shadow-md'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Drag Handle */}
        {canReorder && (
          <div
            className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <DragHandleIcon className="w-4 h-4 text-[#94A3B8]" />
          </div>
        )}

        <div className={`p-4 ${canReorder ? 'pl-8' : ''}`}>
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${nodeConfig.color}15` }}
            >
              {nodeConfig.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#1E293B] text-sm">{nodeConfig.label}</p>
              {node.type === 'delay' && (
                <p className="text-xs text-[#64748B] mt-0.5">
                  Wait {node.data.delayDays || 1} day{(node.data.delayDays || 1) > 1 ? 's' : ''}
                  {node.data.delayHours ? ` ${node.data.delayHours}h` : ''}
                </p>
              )}
              {(node.type === 'linkedin_message' || node.type === 'email') && node.data.message && (
                <p className="text-xs text-[#64748B] mt-0.5 truncate">
                  {node.data.message.substring(0, 40)}...
                </p>
              )}
              {node.type === 'condition' && (
                <p className="text-xs text-[#64748B] mt-0.5">
                  If {node.data.condition || 'connected'}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            {canReorder && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                  className="p-1.5 rounded-lg hover:bg-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertIcon className="w-4 h-4 text-[#64748B]" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg border border-[#E2E8F0] shadow-lg py-1 z-50"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false) }}
                          className="w-full px-3 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                        >
                          <DuplicateIcon className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false) }}
                          className="w-full px-3 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Condition branches */}
          {node.type === 'condition' && (
            <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex gap-4">
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#F0FDF4] text-[#22C55E] text-[10px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  Yes
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#FEF2F2] text-[#EF4444] text-[10px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  No
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Connection line below (except for last) */}
      {!isLast && (
        <div className="flex flex-col items-center py-2">
          <div className="w-0.5 h-4 bg-[#E2E8F0]" />
          <div className="w-2 h-2 rounded-full border-2 border-[#E2E8F0] bg-white" />
          <div className="w-0.5 h-4 bg-[#E2E8F0]" />
        </div>
      )}
    </div>
  )

  if (canReorder) {
    return (
      <Reorder.Item
        value={node}
        dragListener={false}
        dragControls={dragControls}
      >
        {nodeContent}
      </Reorder.Item>
    )
  }

  return <div>{nodeContent}</div>
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
      { id: 't4', type: 'linkedin_message' as const, data: { message: 'Thanks for connecting! Quick question about {{company}}...' } },
      { id: 't5', type: 'email' as const, data: { subject: 'Quick question, {{firstName}}', message: 'Hi {{firstName}},\n\nI tried connecting on LinkedIn but wanted to make sure my message reached you...' } },
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
        <p className="text-xs text-[#64748B] mt-1">Drag or click to add</p>
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
                  draggable
                  onDragStart={(e) => {
                    (e as unknown as React.DragEvent).dataTransfer.setData('nodeType', step.type)
                  }}
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
          {showTemplates && onApplyTemplate && (
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
                      value={node.data.delayDays || 1}
                      onChange={(e) => onUpdate({ delayDays: parseInt(e.target.value) || 1 })}
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
                Lead will wait <strong className="text-[#1E293B]">{node.data.delayDays || 1} day{(node.data.delayDays || 1) > 1 ? 's' : ''}</strong>
                {node.data.delayHours ? <> and <strong className="text-[#1E293B]">{node.data.delayHours} hours</strong></> : ''} before the next step.
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
                Leads that match this condition will follow the <strong className="text-[#22C55E]">Yes</strong> branch.
                Others will follow the <strong className="text-[#EF4444]">No</strong> branch.
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
    start: { label: 'Campaign Start', color: '#22C55E', icon: <PlayIcon className="w-5 h-5 text-[#22C55E]" /> },
    linkedin_connect: { label: 'Connection Request', color: '#0A66C2', icon: <LinkedInIcon className="w-5 h-5 text-[#0A66C2]" /> },
    linkedin_message: { label: 'LinkedIn Message', color: '#0A66C2', icon: <MessageIcon className="w-5 h-5 text-[#0A66C2]" /> },
    linkedin_follow: { label: 'Follow Profile', color: '#0A66C2', icon: <FollowIcon className="w-5 h-5 text-[#0A66C2]" /> },
    linkedin_view: { label: 'View Profile', color: '#0A66C2', icon: <EyeIcon className="w-5 h-5 text-[#0A66C2]" /> },
    email: { label: 'Send Email', color: '#14B8A6', icon: <EmailIcon className="w-5 h-5 text-[#14B8A6]" /> },
    delay: { label: 'Wait', color: '#F59E0B', icon: <ClockIcon className="w-5 h-5 text-[#F59E0B]" /> },
    condition: { label: 'Condition', color: '#8B5CF6', icon: <BranchIcon className="w-5 h-5 text-[#8B5CF6]" /> },
    end: { label: 'End', color: '#64748B', icon: <StopIcon className="w-5 h-5 text-[#64748B]" /> },
  }
  return configs[type]
}

function getDefaultNodeData(type: SequenceNode['type']): NodeData {
  switch (type) {
    case 'delay':
      return { delayDays: 1, delayHours: 0 }
    case 'condition':
      return { condition: 'connected' }
    default:
      return {}
  }
}

// Icons
function PlusIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  )
}

function EmailIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function MessageIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function ClockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function EyeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function FollowIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}

function BranchIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function PlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function StopIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function MoreVertIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
}

function DragHandleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
    </svg>
  )
}

function DuplicateIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
