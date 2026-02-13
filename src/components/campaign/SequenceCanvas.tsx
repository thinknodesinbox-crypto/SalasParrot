import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef } from 'react';
import { SEQUENCE_TEMPLATES } from './sequenceTemplates';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
export { SEQUENCE_TEMPLATES } from './sequenceTemplates';

// Types
export interface SequenceNode {
  id: string;
  type:
    | 'start'
    | 'linkedin_connect'
    | 'linkedin_message'
    | 'linkedin_inmail'
    | 'linkedin_view'
    | 'email'
    | 'delay'
    | 'condition'
    | 'enrichment'
    | 'end';
  data: NodeData;
  position?: { x: number; y: number };
  parentId?: string;
  branch?: 'true' | 'false'; // For nodes under a condition
}

interface NodeData {
  label?: string;
  message?: string;
  subject?: string;
  delayDays?: number;
  delayHours?: number;
  condition?: 'connected' | 'replied' | 'email_opened' | 'email_link_clicked';
  trueBranch?: string;
  falseBranch?: string;
}

interface SequenceCanvasProps {
  nodes: SequenceNode[];
  onNodesChange: (nodes: SequenceNode[]) => void;
  onNodeSelect: (node: SequenceNode | null) => void;
  selectedNodeId: string | null;
  hasInmailCapability?: boolean; // Whether any connected account supports InMail
}

export function SequenceCanvas({
  nodes,
  onNodesChange,
  onNodeSelect,
  selectedNodeId,
  hasInmailCapability = false,
}: SequenceCanvasProps) {
  const [zoom, setZoom] = useState(100);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.type === 'start') return; // Can't delete start
      onNodesChange(nodes.filter((n) => n.id !== nodeId));
      if (selectedNodeId === nodeId) onNodeSelect(null);
    },
    [nodes, onNodesChange, selectedNodeId, onNodeSelect]
  );

  const handleAddNode = useCallback(
    (type: SequenceNode['type'], afterId?: string, branch?: 'true' | 'false') => {
      const newNode: SequenceNode = {
        id: `node-${Date.now()}`,
        type,
        data: getDefaultNodeData(type),
        parentId: branch ? afterId : undefined, // Only set parentId for branch nodes
        branch,
      };

      if (afterId && branch) {
        // Adding to a condition branch - find last node in this branch
        const branchNodes = nodes.filter((n) => n.parentId === afterId && n.branch === branch);

        if (branchNodes.length > 0) {
          // Insert after the last node in this branch
          const lastBranchNode = branchNodes[branchNodes.length - 1];
          const lastBranchIndex = nodes.findIndex((n) => n.id === lastBranchNode.id);
          const newNodes = [...nodes];
          newNodes.splice(lastBranchIndex + 1, 0, newNode);
          onNodesChange(newNodes);
        } else {
          // No nodes in branch yet, insert after condition node
          const afterIndex = nodes.findIndex((n) => n.id === afterId);
          const newNodes = [...nodes];
          newNodes.splice(afterIndex + 1, 0, newNode);
          onNodesChange(newNodes);
        }
      } else if (afterId) {
        // Adding after a specific node in main flow (insert button)
        const afterIndex = nodes.findIndex((n) => n.id === afterId);
        const newNodes = [...nodes];
        newNodes.splice(afterIndex + 1, 0, newNode);

        // When inserting a condition, move subsequent main flow nodes into its true branch
        if (type === 'condition') {
          const conditionIndex = afterIndex + 1; // where the condition was just inserted
          for (let i = conditionIndex + 1; i < newNodes.length; i++) {
            const n = newNodes[i];
            // Only move main flow nodes (no parentId/branch), stop at end nodes
            if (!n.parentId && !n.branch && n.type !== 'end') {
              n.parentId = newNode.id;
              n.branch = 'true';
            } else {
              break;
            }
          }
        }

        onNodesChange(newNodes);
      } else {
        // Add before end or at the end
        const endIndex = nodes.findIndex((n) => n.type === 'end');
        if (endIndex !== -1) {
          const newNodes = [...nodes];
          newNodes.splice(endIndex, 0, newNode);
          onNodesChange(newNodes);
        } else {
          onNodesChange([...nodes, newNode]);
        }
      }
    },
    [nodes, onNodesChange]
  );

  // Insert a node after a specific node within a branch
  const handleInsertInBranch = useCallback(
    (type: SequenceNode['type'], afterNodeId: string) => {
      const afterNode = nodes.find((n) => n.id === afterNodeId);
      if (!afterNode || !afterNode.parentId || !afterNode.branch) return;

      const newNode: SequenceNode = {
        id: `node-${Date.now()}`,
        type,
        data: getDefaultNodeData(type),
        parentId: afterNode.parentId,
        branch: afterNode.branch,
      };

      const afterIndex = nodes.findIndex((n) => n.id === afterNodeId);
      const newNodes = [...nodes];
      newNodes.splice(afterIndex + 1, 0, newNode);

      // When inserting a condition in a branch, move subsequent same-branch nodes into its true branch
      if (type === 'condition') {
        const conditionIndex = afterIndex + 1;
        for (let i = conditionIndex + 1; i < newNodes.length; i++) {
          const n = newNodes[i];
          if (
            n.parentId === afterNode.parentId &&
            n.branch === afterNode.branch &&
            n.type !== 'end'
          ) {
            n.parentId = newNode.id;
            n.branch = 'true';
          } else if (n.parentId === afterNode.parentId && n.branch === afterNode.branch) {
            break;
          }
        }
      }

      onNodesChange(newNodes);
    },
    [nodes, onNodesChange]
  );

  // Build tree structure from flat nodes
  const buildTree = useCallback(() => {
    const mainFlow: SequenceNode[] = [];
    const conditionBranches: Map<string, { true: SequenceNode[]; false: SequenceNode[] }> =
      new Map();

    nodes.forEach((node) => {
      if (node.type === 'condition') {
        conditionBranches.set(node.id, { true: [], false: [] });
      }
    });

    nodes.forEach((node) => {
      if (node.parentId && node.branch) {
        const branches = conditionBranches.get(node.parentId);
        if (branches) {
          branches[node.branch].push(node);
        }
      } else if (node.type !== 'end') {
        mainFlow.push(node);
      }
    });

    return { mainFlow, conditionBranches };
  }, [nodes]);

  const { mainFlow, conditionBranches } = buildTree();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#FAFBFC]">
      {/* Zoom Controls */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
        <button
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="flex h-8 w-8 items-center justify-center rounded-l-lg text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B]"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <span className="min-w-[40px] px-2 text-center text-sm font-medium text-[#1E293B]">
          {zoom}
        </span>
        <button
          onClick={() => setZoom(Math.min(150, zoom + 10))}
          className="flex h-8 w-8 items-center justify-center rounded-r-lg text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B]"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8">
        <div
          className="flex min-h-full flex-col items-center pt-8"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Render tree */}
          {mainFlow.map((node, index) => {
            const isLast = index === mainFlow.length - 1;
            const prevNode = index > 0 ? mainFlow[index - 1] : null;

            return (
              <div key={node.id} className="flex flex-col items-center">
                {/* Insert button between nodes (replaces plain connector line) */}
                {index > 0 && prevNode && prevNode.type !== 'condition' && (
                  <InsertButton
                    onAdd={(type) => handleAddNode(type, prevNode.id)}
                    hasInmailCapability={hasInmailCapability}
                  />
                )}
                {/* Plain connector after condition (can't insert in middle of condition branches) */}
                {index > 0 && prevNode && prevNode.type === 'condition' && <ConnectorLine />}

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
                    onAddNodeForCondition={(type, conditionId, branch) =>
                      handleAddNode(type, conditionId, branch)
                    }
                    onInsertInBranch={handleInsertInBranch}
                    conditionBranchesMap={conditionBranches}
                    hasInmailCapability={hasInmailCapability}
                  />
                )}

                {/* Add action button at the end (only for last non-condition node) */}
                {node.type !== 'condition' && node.type !== 'start' && isLast && (
                  <>
                    <ConnectorLine />
                    <AddActionButton
                      onAdd={(type) => handleAddNode(type)}
                      hasInmailCapability={hasInmailCapability}
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* Initial add button if only start node */}
          {mainFlow.length === 1 && mainFlow[0].type === 'start' && (
            <>
              <ConnectorLine />
              <AddActionButton
                onAdd={(type) => handleAddNode(type)}
                hasInmailCapability={hasInmailCapability}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Connector Line Component
function ConnectorLine({ height = 32 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ height }}>
      <div className="h-full w-0.5 bg-[#CBD5E1]" />
    </div>
  );
}

// Insert Button Component (for inserting between nodes)
function InsertButton({
  onAdd,
  hasInmailCapability = false,
}: {
  onAdd: (type: SequenceNode['type']) => void;
  hasInmailCapability?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative flex flex-col items-center" style={{ height: 32 }}>
      {/* Connector line */}
      <div className="absolute inset-0 flex flex-col items-center">
        <div className="h-full w-0.5 bg-[#CBD5E1]" />
      </div>

      {/* Insert button - visible on hover */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-[#CBD5E1] bg-white opacity-0 shadow-sm transition-all hover:border-[#14B8A6] hover:bg-[#14B8A6] hover:text-white group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusIcon className="h-3 w-3" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute left-1/2 top-full z-50 mt-1 w-48 -translate-x-1/2 rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-lg"
            >
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">
                LinkedIn
              </p>
              <ActionMenuItem
                icon={<LinkedInIcon className="h-4 w-4" />}
                label="Connection Request"
                onClick={() => {
                  onAdd('linkedin_connect');
                  setShowMenu(false);
                }}
              />
              <ActionMenuItem
                icon={<MessageIcon className="h-4 w-4" />}
                label="Send Message"
                onClick={() => {
                  onAdd('linkedin_message');
                  setShowMenu(false);
                }}
              />
              {hasInmailCapability && (
                <ActionMenuItem
                  icon={<InMailIcon className="h-4 w-4" />}
                  label="Send InMail"
                  onClick={() => {
                    onAdd('linkedin_inmail');
                    setShowMenu(false);
                  }}
                />
              )}
              <ActionMenuItem
                icon={<EyeIcon className="h-4 w-4" />}
                label="View Profile"
                onClick={() => {
                  onAdd('linkedin_view');
                  setShowMenu(false);
                }}
              />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">Email</p>
              <ActionMenuItem
                icon={<EmailIcon className="h-4 w-4" />}
                label="Send Email"
                onClick={() => {
                  onAdd('email');
                  setShowMenu(false);
                }}
              />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">Logic</p>
              <ActionMenuItem
                icon={<ClockIcon className="h-4 w-4" />}
                label="Wait / Delay"
                onClick={() => {
                  onAdd('delay');
                  setShowMenu(false);
                }}
              />
              <ActionMenuItem
                icon={<BranchIcon className="h-4 w-4" />}
                label="If / Then"
                onClick={() => {
                  onAdd('condition');
                  setShowMenu(false);
                }}
              />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">Data</p>
              <ActionMenuItem
                icon={<SearchIcon className="h-4 w-4" />}
                label="Enrich Email"
                onClick={() => {
                  onAdd('enrichment');
                  setShowMenu(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tree Node Component (pill style)
function TreeNode({
  node,
  isSelected,
  onSelect,
  onDelete,
}: {
  node: SequenceNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const config = getNodeConfig(node.type);
  const canDelete = node.type !== 'start';

  // Special styling for start node
  if (node.type === 'start') {
    return (
      <motion.div
        className="flex items-center gap-2 text-[#1E293B]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SendIcon className="h-5 w-5 text-[#64748B]" />
        <span className="font-medium">Campaign Start</span>
      </motion.div>
    );
  }

  // Get display label
  const getDisplayLabel = () => {
    switch (node.type) {
      case 'condition': {
        const conditionLabelMap: Record<string, string> = {
          connected: 'If Connected',
          replied: 'If Replied',
          email_opened: 'If Email Opened',
          email_link_clicked: 'If Link Clicked',
        };
        return conditionLabelMap[node.data.condition || 'connected'] || 'If / Then';
      }
      case 'delay': {
        const days = node.data.delayDays || 0;
        const hours = node.data.delayHours || 0;
        if (days === 0 && hours === 0) return 'No Delay';
        if (days === 1 && hours === 0) return '1 Day';
        if (days > 1 && hours === 0) return `${days} Days`;
        if (days === 0) return `${hours}h`;
        return `${days}d ${hours}h`;
      }
      case 'linkedin_view':
        return 'View Profile';
      case 'linkedin_connect':
        return 'Connect';
      case 'linkedin_message':
        return 'Message';
      case 'linkedin_inmail':
        return 'InMail';
      case 'email':
        return 'Email';
      case 'enrichment':
        return 'Enrich';
      default:
        return config.label;
    }
  };

  return (
    <motion.button
      onClick={onSelect}
      className={`
        group inline-flex cursor-pointer items-center gap-2 rounded-full border-2 bg-white
        px-4 py-2.5 transition-all
        ${
          isSelected
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
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${config.color}15` }}
      >
        {config.icon}
      </div>
      <span className="whitespace-nowrap text-sm font-medium text-[#1E293B]">
        {getDisplayLabel()}
      </span>
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-all hover:bg-[#FEE2E2] group-hover:opacity-100"
        >
          <CloseIcon className="h-3 w-3 text-[#64748B] hover:text-[#EF4444]" />
        </button>
      )}
    </motion.button>
  );
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
  onAddNodeForCondition,
  onInsertInBranch,
  conditionBranchesMap,
  hasInmailCapability = false,
}: {
  conditionType: string;
  trueBranch: SequenceNode[];
  falseBranch: SequenceNode[];
  selectedNodeId: string | null;
  onNodeSelect: (node: SequenceNode | null) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (type: SequenceNode['type'], branch: 'true' | 'false') => void;
  onAddNodeForCondition: (
    type: SequenceNode['type'],
    conditionId: string,
    branch: 'true' | 'false'
  ) => void;
  onInsertInBranch: (type: SequenceNode['type'], afterNodeId: string) => void;
  conditionBranchesMap: Map<string, { true: SequenceNode[]; false: SequenceNode[] }>;
  hasInmailCapability?: boolean;
}) {
  const labelMap: Record<string, { trueLabel: string; falseLabel: string }> = {
    connected: { trueLabel: 'Connected', falseLabel: 'Not Connected' },
    replied: { trueLabel: 'Replied', falseLabel: 'Not Replied' },
    email_opened: { trueLabel: 'Opened', falseLabel: 'Not Opened' },
    email_link_clicked: { trueLabel: 'Clicked', falseLabel: 'Not Clicked' },
  };
  const { trueLabel, falseLabel } = labelMap[conditionType] || labelMap.connected;

  // Check if branches have end nodes or end with a condition (which handles its own branching)
  const falseBranchEnded =
    falseBranch.some((node) => node.type === 'end') ||
    (falseBranch.length > 0 && falseBranch[falseBranch.length - 1].type === 'condition');
  const trueBranchEnded =
    trueBranch.some((node) => node.type === 'end') ||
    (trueBranch.length > 0 && trueBranch[trueBranch.length - 1].type === 'condition');

  return (
    <div className="flex flex-col items-center">
      {/* Branch split connector */}
      <div className="flex flex-col items-center">
        <div className="h-6 w-0.5 bg-[#CBD5E1]" />
        <div className="relative">
          {/* Horizontal line */}
          <div className="h-0.5 w-[280px] bg-[#CBD5E1]" />
          {/* Left vertical connector */}
          <div className="absolute left-0 top-0 h-6 w-0.5 bg-[#CBD5E1]" />
          {/* Right vertical connector */}
          <div className="absolute right-0 top-0 h-6 w-0.5 bg-[#CBD5E1]" />
        </div>
      </div>

      {/* Two branches */}
      <div className="mt-6 flex gap-16">
        {/* False Branch (Not Connected) */}
        <div className="flex min-w-[140px] flex-col items-center">
          {/* Branch Label */}
          <div className="mb-4 flex items-center gap-2 text-[#64748B]">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{falseLabel}</span>
          </div>

          {/* Branch nodes */}
          {falseBranch.map((node, index) => {
            const prevNode = index > 0 ? falseBranch[index - 1] : null;
            return (
              <div key={node.id} className="flex flex-col items-center">
                {index > 0 && prevNode && prevNode.type !== 'condition' && (
                  <InsertButton
                    onAdd={(type) => onInsertInBranch(type, prevNode.id)}
                    hasInmailCapability={hasInmailCapability}
                  />
                )}
                {index > 0 && prevNode && prevNode.type === 'condition' && (
                  <ConnectorLine height={24} />
                )}
                <TreeNode
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => onNodeSelect(node)}
                  onDelete={() => onDeleteNode(node.id)}
                />
                {/* Recursively render nested condition branches */}
                {node.type === 'condition' && (
                  <ConditionBranches
                    conditionType={node.data.condition || 'connected'}
                    trueBranch={conditionBranchesMap.get(node.id)?.true || []}
                    falseBranch={conditionBranchesMap.get(node.id)?.false || []}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={onNodeSelect}
                    onDeleteNode={onDeleteNode}
                    onAddNode={(type, branch) => onAddNodeForCondition(type, node.id, branch)}
                    onAddNodeForCondition={onAddNodeForCondition}
                    onInsertInBranch={onInsertInBranch}
                    conditionBranchesMap={conditionBranchesMap}
                    hasInmailCapability={hasInmailCapability}
                  />
                )}
              </div>
            );
          })}

          {/* Add action / End for false branch (only if not ended) */}
          {!falseBranchEnded && (
            <>
              <ConnectorLine height={24} />
              <BranchEndButtons
                onAddAction={(type) => onAddNode(type, 'false')}
                onEnd={() => onAddNode('end', 'false')}
                hasInmailCapability={hasInmailCapability}
              />
            </>
          )}
        </div>

        {/* True Branch (Connected) */}
        <div className="flex min-w-[140px] flex-col items-center">
          {/* Branch Label */}
          <div className="mb-4 flex items-center gap-2 text-[#64748B]">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{trueLabel}</span>
          </div>

          {/* Branch nodes */}
          {trueBranch.map((node, index) => {
            const prevNode = index > 0 ? trueBranch[index - 1] : null;
            return (
              <div key={node.id} className="flex flex-col items-center">
                {index > 0 && prevNode && prevNode.type !== 'condition' && (
                  <InsertButton
                    onAdd={(type) => onInsertInBranch(type, prevNode.id)}
                    hasInmailCapability={hasInmailCapability}
                  />
                )}
                {index > 0 && prevNode && prevNode.type === 'condition' && (
                  <ConnectorLine height={24} />
                )}
                <TreeNode
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => onNodeSelect(node)}
                  onDelete={() => onDeleteNode(node.id)}
                />
                {/* Recursively render nested condition branches */}
                {node.type === 'condition' && (
                  <ConditionBranches
                    conditionType={node.data.condition || 'connected'}
                    trueBranch={conditionBranchesMap.get(node.id)?.true || []}
                    falseBranch={conditionBranchesMap.get(node.id)?.false || []}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={onNodeSelect}
                    onDeleteNode={onDeleteNode}
                    onAddNode={(type, branch) => onAddNodeForCondition(type, node.id, branch)}
                    onAddNodeForCondition={onAddNodeForCondition}
                    onInsertInBranch={onInsertInBranch}
                    conditionBranchesMap={conditionBranchesMap}
                    hasInmailCapability={hasInmailCapability}
                  />
                )}
              </div>
            );
          })}

          {/* Add action / End for true branch (only if not ended) */}
          {!trueBranchEnded && (
            <>
              <ConnectorLine height={24} />
              <BranchEndButtons
                onAddAction={(type) => onAddNode(type, 'true')}
                onEnd={() => onAddNode('end', 'true')}
                hasInmailCapability={hasInmailCapability}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Branch End Buttons (Add action + End)
function BranchEndButtons({
  onAddAction,
  onEnd,
  hasInmailCapability = false,
}: {
  onAddAction: (type: SequenceNode['type']) => void;
  onEnd: () => void;
  hasInmailCapability?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#14B8A6] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0D9488]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="h-4 w-4" />
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
                className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-lg"
              >
                <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">
                  LinkedIn
                </p>
                <ActionMenuItem
                  icon={<LinkedInIcon className="h-4 w-4" />}
                  label="Connection Request"
                  onClick={() => {
                    onAddAction('linkedin_connect');
                    setShowMenu(false);
                  }}
                />
                <ActionMenuItem
                  icon={<MessageIcon className="h-4 w-4" />}
                  label="Send Message"
                  onClick={() => {
                    onAddAction('linkedin_message');
                    setShowMenu(false);
                  }}
                />
                {hasInmailCapability && (
                  <ActionMenuItem
                    icon={<InMailIcon className="h-4 w-4" />}
                    label="Send InMail"
                    onClick={() => {
                      onAddAction('linkedin_inmail');
                      setShowMenu(false);
                    }}
                  />
                )}
                <ActionMenuItem
                  icon={<EyeIcon className="h-4 w-4" />}
                  label="View Profile"
                  onClick={() => {
                    onAddAction('linkedin_view');
                    setShowMenu(false);
                  }}
                />

                <div className="my-1 border-t border-[#E2E8F0]" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">
                  Email
                </p>
                <ActionMenuItem
                  icon={<EmailIcon className="h-4 w-4" />}
                  label="Send Email"
                  onClick={() => {
                    onAddAction('email');
                    setShowMenu(false);
                  }}
                />

                <div className="my-1 border-t border-[#E2E8F0]" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">
                  Logic
                </p>
                <ActionMenuItem
                  icon={<ClockIcon className="h-4 w-4" />}
                  label="Wait / Delay"
                  onClick={() => {
                    onAddAction('delay');
                    setShowMenu(false);
                  }}
                />
                <ActionMenuItem
                  icon={<BranchIcon className="h-4 w-4" />}
                  label="If / Then"
                  onClick={() => {
                    onAddAction('condition');
                    setShowMenu(false);
                  }}
                />

                <div className="my-1 border-t border-[#E2E8F0]" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">Data</p>
                <ActionMenuItem
                  icon={<SearchIcon className="h-4 w-4" />}
                  label="Enrich Email"
                  onClick={() => {
                    onAddAction('enrichment');
                    setShowMenu(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        onClick={onEnd}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#64748B] transition-colors hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <CheckCircleIcon className="h-4 w-4" />
        End
      </motion.button>
    </div>
  );
}

// Add Action Button (main flow)
function AddActionButton({
  onAdd,
  hasInmailCapability = false,
}: {
  onAdd: (type: SequenceNode['type']) => void;
  hasInmailCapability?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0D9488]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <PlusIcon className="h-4 w-4" />
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
              className="absolute left-1/2 top-full z-50 mt-2 w-52 -translate-x-1/2 rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-lg"
            >
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">
                LinkedIn
              </p>
              <ActionMenuItem
                icon={<LinkedInIcon className="h-4 w-4" />}
                label="Connection Request"
                onClick={() => {
                  onAdd('linkedin_connect');
                  setShowMenu(false);
                }}
              />
              <ActionMenuItem
                icon={<MessageIcon className="h-4 w-4" />}
                label="Send Message"
                onClick={() => {
                  onAdd('linkedin_message');
                  setShowMenu(false);
                }}
              />
              {hasInmailCapability && (
                <ActionMenuItem
                  icon={<InMailIcon className="h-4 w-4" />}
                  label="Send InMail"
                  onClick={() => {
                    onAdd('linkedin_inmail');
                    setShowMenu(false);
                  }}
                />
              )}
              <ActionMenuItem
                icon={<EyeIcon className="h-4 w-4" />}
                label="View Profile"
                onClick={() => {
                  onAdd('linkedin_view');
                  setShowMenu(false);
                }}
              />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">Email</p>
              <ActionMenuItem
                icon={<EmailIcon className="h-4 w-4" />}
                label="Send Email"
                onClick={() => {
                  onAdd('email');
                  setShowMenu(false);
                }}
              />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">Logic</p>
              <ActionMenuItem
                icon={<ClockIcon className="h-4 w-4" />}
                label="Wait / Delay"
                onClick={() => {
                  onAdd('delay');
                  setShowMenu(false);
                }}
              />
              <ActionMenuItem
                icon={<BranchIcon className="h-4 w-4" />}
                label="If / Then"
                onClick={() => {
                  onAdd('condition');
                  setShowMenu(false);
                }}
              />

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">Data</p>
              <ActionMenuItem
                icon={<SearchIcon className="h-4 w-4" />}
                label="Enrich Email"
                onClick={() => {
                  onAdd('enrichment');
                  setShowMenu(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Action Menu Item
function ActionMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#1E293B] transition-colors hover:bg-[#F8FAFC]"
    >
      <span className="text-[#64748B]">{icon}</span>
      {label}
    </button>
  );
}

// Step Palette (sidebar)
export function StepPalette({
  onAddStep,
  onApplyTemplate,
  hasInmailCapability = false,
}: {
  onAddStep: (type: SequenceNode['type']) => void;
  onApplyTemplate?: (nodes: SequenceNode[]) => void;
  hasInmailCapability?: boolean;
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const linkedInSteps: Array<{ type: SequenceNode['type']; label: string; icon: React.ReactNode }> =
    [
      {
        type: 'linkedin_connect',
        label: 'Connection Request',
        icon: <LinkedInIcon className="h-4 w-4" />,
      },
      {
        type: 'linkedin_message',
        label: 'Send Message',
        icon: <MessageIcon className="h-4 w-4" />,
      },
      ...(hasInmailCapability
        ? [
            {
              type: 'linkedin_inmail' as const,
              label: 'Send InMail',
              icon: <InMailIcon className="h-4 w-4" />,
            },
          ]
        : []),
      {
        type: 'linkedin_view',
        label: 'View Profile',
        icon: <EyeIcon className="h-4 w-4" />,
      },
    ];

  const stepCategories = [
    {
      title: 'LinkedIn',
      color: '#0A66C2',
      steps: linkedInSteps,
    },
    {
      title: 'Email',
      color: '#14B8A6',
      steps: [
        { type: 'email' as const, label: 'Send Email', icon: <EmailIcon className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Logic',
      color: '#8B5CF6',
      steps: [
        { type: 'delay' as const, label: 'Wait / Delay', icon: <ClockIcon className="h-4 w-4" /> },
        {
          type: 'condition' as const,
          label: 'If / Then',
          icon: <BranchIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Data',
      color: '#A855F7',
      steps: [
        {
          type: 'enrichment' as const,
          label: 'Enrich Email',
          icon: <SearchIcon className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <div className="flex w-64 flex-col border-r border-[#E2E8F0] bg-white">
      <div className="border-b border-[#E2E8F0] p-4">
        <h3 className="text-sm font-semibold text-[#1E293B]">Add Step</h3>
        <p className="mt-1 text-xs text-[#64748B]">Click to add to sequence</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {stepCategories.map((category) => (
          <div key={category.title}>
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              {category.title}
            </p>
            <div className="space-y-1.5">
              {category.steps.map((step) => (
                <motion.button
                  key={step.type}
                  onClick={() => onAddStep(step.type)}
                  className="group flex w-full items-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-left transition-all hover:border-[#FF6B35]/40 hover:shadow-sm"
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                    }}
                  >
                    {step.icon}
                  </div>
                  <span className="text-sm font-medium text-[#1E293B] transition-colors group-hover:text-[#FF6B35]">
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
        <div className="border-t border-[#E2E8F0] p-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Quick Start
          </p>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-[#FF6B35]/20 bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] p-2.5 text-left transition-all hover:border-[#FF6B35]/40"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/10">
              <TemplateIcon className="h-4 w-4 text-[#FF6B35]" />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-medium text-[#1E293B]">Use Template</span>
              <span className="text-[10px] text-[#64748B]">Start with proven sequences</span>
            </div>
            <ChevronIcon
              className={`h-4 w-4 text-[#64748B] transition-transform ${showTemplates ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 pt-2">
                  {Object.entries(SEQUENCE_TEMPLATES).map(([key, template]) => (
                    <motion.button
                      key={key}
                      onClick={() => {
                        onApplyTemplate(
                          template.nodes.map((n, i) => ({ ...n, id: `${n.id}-${Date.now()}-${i}` }))
                        );
                        setShowTemplates(false);
                      }}
                      className="w-full rounded-lg border border-[#E2E8F0] p-2.5 text-left transition-all hover:border-[#FF6B35]/30 hover:bg-[#FFF7ED]/50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="text-sm font-medium text-[#1E293B]">{template.name}</p>
                      <p className="text-[10px] text-[#64748B]">{template.description}</p>
                      <div className="mt-1.5 flex gap-1">
                        {template.nodes
                          .filter((n) => n.type !== 'start' && n.type !== 'end')
                          .slice(0, 4)
                          .map((n, i) => (
                            <div
                              key={i}
                              className="flex h-5 w-5 items-center justify-center rounded [&_svg]:h-3 [&_svg]:w-3"
                              style={{ backgroundColor: `${getNodeConfig(n.type).color}15` }}
                            >
                              {getNodeConfig(n.type).icon}
                            </div>
                          ))}
                        {template.nodes.filter((n) => n.type !== 'start' && n.type !== 'end')
                          .length > 4 && (
                          <span className="flex items-center text-[10px] text-[#64748B]">
                            +
                            {template.nodes.filter((n) => n.type !== 'start' && n.type !== 'end')
                              .length - 4}
                          </span>
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
  );
}

// Node Configuration Panel
export function NodeConfigPanel({
  node,
  onUpdate,
  onClose,
}: {
  node: SequenceNode;
  onUpdate: (data: Partial<NodeData>) => void;
  onClose: () => void;
}) {
  const nodeConfig = getNodeConfig(node.type);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const textarea = messageRef.current;
    const currentMessage = node.data.message || '';
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = currentMessage.slice(0, start) + variable + currentMessage.slice(end);
      onUpdate({ message: newMessage });
      // Restore cursor position after the inserted variable
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + variable.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    } else {
      onUpdate({ message: currentMessage + variable });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex w-80 flex-col border-l border-[#E2E8F0] bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${nodeConfig.color}15` }}
          >
            {nodeConfig.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1E293B]">{nodeConfig.label}</h3>
            <p className="text-[10px] text-[#64748B]">Configure this step</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#F8FAFC]">
          <CloseIcon className="h-4 w-4 text-[#64748B]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Delay Configuration */}
        {node.type === 'delay' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Wait Duration</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      value={node.data.delayDays || 0}
                      onChange={(e) => onUpdate({ delayDays: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 pr-12 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                      days
                    </span>
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
                      className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 pr-12 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                      hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] p-3">
              <p className="text-xs text-[#64748B]">
                Lead will wait up to{' '}
                {(node.data.delayDays || 0) > 0 && (
                  <>
                    <strong className="text-[#1E293B]">
                      {node.data.delayDays} day{(node.data.delayDays || 0) > 1 ? 's' : ''}
                    </strong>
                    {(node.data.delayHours || 0) > 0 ? ' and ' : ''}
                  </>
                )}
                {(node.data.delayHours || 0) > 0 && (
                  <strong className="text-[#1E293B]">{node.data.delayHours} hours</strong>
                )}
                {(node.data.delayDays || 0) === 0 && (node.data.delayHours || 0) === 0 && (
                  <strong className="text-[#1E293B]">no time</strong>
                )}{' '}
                before the next step. Skips early if they respond.
              </p>
            </div>
          </>
        )}

        {/* Message Configuration */}
        {(node.type === 'linkedin_message' || node.type === 'linkedin_connect') && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1E293B]">Message</label>
            <textarea
              ref={messageRef}
              value={node.data.message || ''}
              onChange={(e) => onUpdate({ message: e.target.value })}
              placeholder="Hi {{first_name}}, I noticed..."
              rows={4}
              className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['{{first_name}}', '{{last_name}}', '{{company}}'].map((variable) => (
                <button
                  key={variable}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertVariable(variable)}
                  className="rounded bg-[#FFF7ED] px-2 py-1 text-[10px] font-medium text-[#FF6B35] transition-colors hover:bg-[#FFEDD5]"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* InMail Configuration */}
        {node.type === 'linkedin_inmail' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Subject Line</label>
              <input
                type="text"
                value={node.data.subject || ''}
                onChange={(e) => onUpdate({ subject: e.target.value })}
                placeholder="Quick question about {{company}}"
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Message</label>
              <textarea
                ref={messageRef}
                value={node.data.message || ''}
                onChange={(e) => onUpdate({ message: e.target.value })}
                placeholder="Hi {{first_name}}..."
                rows={6}
                className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['{{first_name}}', '{{last_name}}', '{{company}}', '{{icebreaker}}'].map(
                  (variable) => (
                    <button
                      key={variable}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertVariable(variable)}
                      className="rounded bg-[#FFF7ED] px-2 py-1 text-[10px] font-medium text-[#FF6B35] transition-colors hover:bg-[#FFEDD5]"
                    >
                      {variable}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="rounded-lg bg-[#FFF7ED] p-3">
              <p className="text-xs text-[#92400E]">
                InMail messages can be sent to anyone on LinkedIn, but require a Premium, Sales
                Navigator, or Recruiter subscription.
              </p>
            </div>
          </>
        )}

        {/* Email Configuration */}
        {node.type === 'email' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Subject Line</label>
              <input
                type="text"
                value={node.data.subject || ''}
                onChange={(e) => onUpdate({ subject: e.target.value })}
                placeholder="Quick question, {{first_name}}"
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Email Body</label>
              <RichTextEditor
                content={node.data.message || ''}
                onChange={(html) => onUpdate({ message: html })}
                placeholder="Hi {{first_name}}..."
                minHeight="120px"
                variables={['{{first_name}}', '{{last_name}}', '{{company}}', '{{icebreaker}}']}
              />
            </div>
          </>
        )}

        {/* Condition Configuration */}
        {node.type === 'condition' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1E293B]">Condition</label>
            <select
              value={node.data.condition || 'connected'}
              onChange={(e) => onUpdate({ condition: e.target.value as NodeData['condition'] })}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="connected">If Connected</option>
              <option value="replied">If Replied</option>
              <option value="email_opened">If Email Opened</option>
              <option value="email_link_clicked">If Email Link Clicked</option>
            </select>
            <div className="mt-3 rounded-lg bg-[#F8FAFC] p-3">
              <p className="text-xs text-[#64748B]">
                Leads that match this condition will follow the{' '}
                <strong className="text-[#22C55E]">
                  {
                    {
                      connected: 'Connected',
                      replied: 'Replied',
                      email_opened: 'Opened',
                      email_link_clicked: 'Clicked',
                    }[node.data.condition || 'connected']
                  }
                </strong>{' '}
                branch. Others will follow the{' '}
                <strong className="text-[#EF4444]">
                  {
                    {
                      connected: 'Not Connected',
                      replied: 'Not Replied',
                      email_opened: 'Not Opened',
                      email_link_clicked: 'Not Clicked',
                    }[node.data.condition || 'connected']
                  }
                </strong>{' '}
                branch.
              </p>
            </div>
          </div>
        )}

        {/* Enrichment Configuration */}
        {node.type === 'enrichment' && (
          <div className="rounded-lg bg-[#F3E8FF] p-3">
            <p className="text-xs text-[#7C3AED]">
              This step will discover the lead's email address. Leads that already have an email
              will skip this step automatically.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#E2E8F0] p-4">
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-[#FF6B35] py-2 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A]"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}

// Utility functions
function getNodeConfig(type: SequenceNode['type']) {
  const configs = {
    start: {
      label: 'Campaign Start',
      color: '#22C55E',
      icon: <SendIcon className="h-4 w-4 text-[#22C55E]" />,
    },
    linkedin_connect: {
      label: 'Connection Request',
      color: '#0A66C2',
      icon: <LinkedInIcon className="h-4 w-4 text-[#0A66C2]" />,
    },
    linkedin_message: {
      label: 'LinkedIn Message',
      color: '#0A66C2',
      icon: <MessageIcon className="h-4 w-4 text-[#0A66C2]" />,
    },
    linkedin_inmail: {
      label: 'InMail',
      color: '#0A66C2',
      icon: <InMailIcon className="h-4 w-4 text-[#0A66C2]" />,
    },
    linkedin_view: {
      label: 'View Profile',
      color: '#0A66C2',
      icon: <EyeIcon className="h-4 w-4 text-[#0A66C2]" />,
    },
    email: {
      label: 'Send Email',
      color: '#14B8A6',
      icon: <EmailIcon className="h-4 w-4 text-[#14B8A6]" />,
    },
    delay: {
      label: 'Wait',
      color: '#F59E0B',
      icon: <ClockIcon className="h-4 w-4 text-[#F59E0B]" />,
    },
    condition: {
      label: 'Condition',
      color: '#8B5CF6',
      icon: <UserIcon className="h-4 w-4 text-[#8B5CF6]" />,
    },
    enrichment: {
      label: 'Enrich Email',
      color: '#A855F7',
      icon: <SearchIcon className="h-4 w-4 text-[#A855F7]" />,
    },
    end: {
      label: 'End',
      color: '#64748B',
      icon: <CheckCircleIcon className="h-4 w-4 text-[#64748B]" />,
    },
  };

  // Fallback for unknown types
  return (
    configs[type] ?? {
      label: 'Unknown',
      color: '#94A3B8',
      icon: <UserIcon className="h-4 w-4 text-[#94A3B8]" />,
    }
  );
}

function getDefaultNodeData(type: SequenceNode['type']): NodeData {
  switch (type) {
    case 'delay':
      return { delayDays: 0, delayHours: 0 };
    case 'condition':
      return { condition: 'connected' };
    default:
      return {};
  }
}

// Icons
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function MinusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  );
}

function EmailIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function InMailIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4m0-4l-2 2m2-2l2 2" />
    </svg>
  );
}

function MessageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function EyeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function BranchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function SendIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TemplateIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  );
}

function ChevronIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
