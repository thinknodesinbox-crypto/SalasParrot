import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import { SEQUENCE_TEMPLATES } from './sequenceTemplates';
import { SuggestedDraftsPanel } from '@/components/ai/SuggestedDraftsPanel';
import { LazyRichTextEditor } from '@/components/ui/LazyRichTextEditor';
import { useSequenceStepSuggestions } from '@/lib/hooks/queries';
import type {
  PersonalizationMode,
  PersonalizationProvider,
  SequenceTemplate,
  SequenceStepSuggestionsResponse,
  WorkspaceAgentDefaults,
} from '@/lib/types';
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
    | 'linkedin_like'
    | 'email'
    | 'delay'
    | 'condition'
    | 'enrichment'
    | 'reply_agent'
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
  postsToLike?: number;
  personalizationMode?: PersonalizationMode;
  personalizationProviders?: PersonalizationProvider[];
  condition?:
    | 'connected'
    | 'message_replied'
    | 'message_seen'
    | 'email_opened'
    | 'email_link_clicked'
    | 'email_replied';
  trueBranch?: string;
  falseBranch?: string;
  // Agent fields
  agentGoal?: string;
  agentTone?: 'professional' | 'friendly' | 'casual';
  agentCompanyName?: string;
  agentCompanyContext?: string;
  agentProductDescription?: string;
  agentSchedulingLink?: string;
  agentSenderTitle?: string;
  agentHumanInTheLoop?: boolean;
  agentCustomInstructions?: string;
}

const PERSONALIZATION_VARIABLES = [
  '{{first_name}}',
  '{{last_name}}',
  '{{company}}',
  '{{aiPersonalization}}',
] as const;

interface SequenceCanvasProps {
  nodes: SequenceNode[];
  onNodesChange: (nodes: SequenceNode[]) => void;
  onNodeSelect: (node: SequenceNode | null) => void;
  selectedNodeId: string | null;
  hasInmailCapability?: boolean; // Whether any connected account supports InMail
  readonlyStructure?: boolean; // Hides delete buttons, prevents structural changes (for active campaigns)
  agentDefaults?: WorkspaceAgentDefaults | null; // Workspace-level AI agent defaults
}

export function SequenceCanvas({
  nodes,
  onNodesChange,
  onNodeSelect,
  selectedNodeId,
  hasInmailCapability = false,
  readonlyStructure = false,
  agentDefaults,
}: SequenceCanvasProps) {
  const [zoom, setZoom] = useState(100);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.type === 'start') return; // Can't delete start

      const idsToDelete = new Set<string>([nodeId]);
      let foundChild = true;

      while (foundChild) {
        foundChild = false;
        for (const candidate of nodes) {
          if (
            candidate.parentId &&
            idsToDelete.has(candidate.parentId) &&
            !idsToDelete.has(candidate.id)
          ) {
            idsToDelete.add(candidate.id);
            foundChild = true;
          }
        }
      }

      onNodesChange(nodes.filter((n) => !idsToDelete.has(n.id)));
      if (selectedNodeId && idsToDelete.has(selectedNodeId)) onNodeSelect(null);
    },
    [nodes, onNodesChange, selectedNodeId, onNodeSelect]
  );

  const handleAddNode = useCallback(
    (type: SequenceNode['type'], afterId?: string, branch?: 'true' | 'false') => {
      const newNode: SequenceNode = {
        id: `node-${Date.now()}`,
        type,
        data: getDefaultNodeData(type, agentDefaults),
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
        // Add before the main flow end node (not a branch end)
        const endIndex = nodes.findIndex((n) => n.type === 'end' && !n.parentId && !n.branch);
        if (endIndex !== -1) {
          const newNodes = [...nodes];
          newNodes.splice(endIndex, 0, newNode);
          onNodesChange(newNodes);
        } else {
          // No main flow end — find the last main flow node and insert after it
          // (and after all its branch children)
          const mainFlowNodes = nodes.filter((n) => !n.parentId && !n.branch);
          const lastMainNode = mainFlowNodes[mainFlowNodes.length - 1];
          if (lastMainNode) {
            // Find the last index occupied by this node or any of its branch children
            let insertAfter = nodes.findIndex((n) => n.id === lastMainNode.id);
            if (lastMainNode.type === 'condition') {
              // Skip past all branch children of this condition
              for (let i = insertAfter + 1; i < nodes.length; i++) {
                if (nodes[i].parentId === lastMainNode.id || nodes[i].branch) {
                  insertAfter = i;
                } else {
                  break;
                }
              }
            }
            const newNodes = [...nodes];
            newNodes.splice(insertAfter + 1, 0, newNode);
            onNodesChange(newNodes);
          } else {
            onNodesChange([...nodes, newNode]);
          }
        }
      }
    },
    [nodes, onNodesChange, agentDefaults]
  );

  // Insert a node after a specific node within a branch
  const handleInsertInBranch = useCallback(
    (type: SequenceNode['type'], afterNodeId: string) => {
      const afterNode = nodes.find((n) => n.id === afterNodeId);
      if (!afterNode || !afterNode.parentId || !afterNode.branch) return;

      const newNode: SequenceNode = {
        id: `node-${Date.now()}`,
        type,
        data: getDefaultNodeData(type, agentDefaults),
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
          if (n.parentId === afterNode.parentId && n.branch === afterNode.branch) {
            n.parentId = newNode.id;
            n.branch = 'true';
          } else {
            break;
          }
        }
      }

      onNodesChange(newNodes);
    },
    [nodes, onNodesChange, agentDefaults]
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
          className="mx-auto flex min-h-full w-fit min-w-full flex-col items-center pt-8"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Render tree */}
          {mainFlow.map((node, index) => {
            const isLast = index === mainFlow.length - 1;
            const prevNode = index > 0 ? mainFlow[index - 1] : null;

            return (
              <div key={node.id} className="flex flex-col items-center">
                {/* Insert button between nodes (replaces plain connector line) */}
                {index > 0 &&
                  prevNode &&
                  prevNode.type !== 'condition' &&
                  (readonlyStructure ? (
                    <ConnectorLine />
                  ) : (
                    <InsertButton
                      onAdd={(type) => handleAddNode(type, prevNode.id)}
                      hasInmailCapability={hasInmailCapability}
                    />
                  ))}
                {/* Plain connector after condition (can't insert in middle of condition branches) */}
                {index > 0 && prevNode && prevNode.type === 'condition' && <ConnectorLine />}

                {/* Node */}
                <TreeNode
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => onNodeSelect(node)}
                  onDelete={() => handleDeleteNode(node.id)}
                  readonlyStructure={readonlyStructure}
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
                    readonlyStructure={readonlyStructure}
                  />
                )}

                {/* Add action button at the end (only for last non-condition node) */}
                {!readonlyStructure &&
                  node.type !== 'condition' &&
                  node.type !== 'start' &&
                  isLast && (
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
          {!readonlyStructure && mainFlow.length === 1 && mainFlow[0].type === 'start' && (
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
              <ActionMenuItem
                icon={<ThumbsUpIcon className="h-4 w-4" />}
                label="Like Post"
                onClick={() => {
                  onAdd('linkedin_like');
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

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">AI</p>
              <ActionMenuItem
                icon={<BotIcon className="h-4 w-4" />}
                label="Reply Agent"
                onClick={() => {
                  onAdd('reply_agent');
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
  readonlyStructure = false,
}: {
  node: SequenceNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  readonlyStructure?: boolean;
}) {
  const config = getNodeConfig(node.type);
  const canDelete = node.type !== 'start' && !readonlyStructure;

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
          message_replied: 'If Message Replied',
          message_seen: 'If Message Seen',
          email_opened: 'If Email Opened',
          email_link_clicked: 'If Email Link Clicked',
          email_replied: 'If Email Replied',
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
      case 'linkedin_like': {
        const n = node.data.postsToLike || 1;
        return `Like Post${n > 1 ? `s (${n})` : ''}`;
      }
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
  readonlyStructure = false,
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
  readonlyStructure?: boolean;
}) {
  const labelMap: Record<string, { trueLabel: string; falseLabel: string }> = {
    connected: { trueLabel: 'Connected', falseLabel: 'Not Connected' },
    message_replied: { trueLabel: 'Replied', falseLabel: 'Not Replied' },
    message_seen: { trueLabel: 'Seen', falseLabel: 'Not Seen' },
    email_opened: { trueLabel: 'Opened', falseLabel: 'Not Opened' },
    email_link_clicked: { trueLabel: 'Clicked', falseLabel: 'Not Clicked' },
    email_replied: { trueLabel: 'Replied', falseLabel: 'Not Replied' },
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
      {/* Vertical line from condition node down to split point */}
      <div className="h-6 w-0.5 bg-[#CBD5E1]" />

      {/* Branch container: the horizontal connector is the border-top of this flex row,
          and each column draws its own vertical drop-down. No measurement needed. */}
      <div className="flex items-start gap-0">
        {/* False Branch (left) */}
        <div className="flex min-w-[140px] flex-col items-center">
          {/* Top connector: half horizontal line to the right + vertical drop */}
          <div className="flex w-full justify-end">
            <div className="h-0.5 w-1/2 bg-[#CBD5E1]" />
          </div>
          <div className="h-6 w-0.5 bg-[#CBD5E1]" />

          {/* Branch Label */}
          <div className="mb-3 flex items-center gap-2 text-[#64748B]">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{falseLabel}</span>
          </div>

          {/* Branch nodes */}
          {falseBranch.map((node, index) => {
            const prevNode = index > 0 ? falseBranch[index - 1] : null;
            return (
              <div key={node.id} className="flex flex-col items-center">
                {index > 0 &&
                  prevNode &&
                  prevNode.type !== 'condition' &&
                  (readonlyStructure ? (
                    <ConnectorLine height={24} />
                  ) : (
                    <InsertButton
                      onAdd={(type) => onInsertInBranch(type, prevNode.id)}
                      hasInmailCapability={hasInmailCapability}
                    />
                  ))}
                {index > 0 && prevNode && prevNode.type === 'condition' && (
                  <ConnectorLine height={24} />
                )}
                <TreeNode
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => onNodeSelect(node)}
                  onDelete={() => onDeleteNode(node.id)}
                  readonlyStructure={readonlyStructure}
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
                    readonlyStructure={readonlyStructure}
                  />
                )}
              </div>
            );
          })}

          {/* Add action / End for false branch (only if not ended) */}
          {!readonlyStructure && !falseBranchEnded && (
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

        {/* Gap between branches */}
        <div className="w-16 flex-shrink-0">
          <div className="h-0.5 w-full bg-[#CBD5E1]" />
        </div>

        {/* True Branch (right) */}
        <div className="flex min-w-[140px] flex-col items-center">
          {/* Top connector: half horizontal line to the left + vertical drop */}
          <div className="flex w-full justify-start">
            <div className="h-0.5 w-1/2 bg-[#CBD5E1]" />
          </div>
          <div className="h-6 w-0.5 bg-[#CBD5E1]" />

          {/* Branch Label */}
          <div className="mb-3 flex items-center gap-2 text-[#64748B]">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{trueLabel}</span>
          </div>

          {/* Branch nodes */}
          {trueBranch.map((node, index) => {
            const prevNode = index > 0 ? trueBranch[index - 1] : null;
            return (
              <div key={node.id} className="flex flex-col items-center">
                {index > 0 &&
                  prevNode &&
                  prevNode.type !== 'condition' &&
                  (readonlyStructure ? (
                    <ConnectorLine height={24} />
                  ) : (
                    <InsertButton
                      onAdd={(type) => onInsertInBranch(type, prevNode.id)}
                      hasInmailCapability={hasInmailCapability}
                    />
                  ))}
                {index > 0 && prevNode && prevNode.type === 'condition' && (
                  <ConnectorLine height={24} />
                )}
                <TreeNode
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => onNodeSelect(node)}
                  onDelete={() => onDeleteNode(node.id)}
                  readonlyStructure={readonlyStructure}
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
                    readonlyStructure={readonlyStructure}
                  />
                )}
              </div>
            );
          })}

          {/* Add action / End for true branch (only if not ended) */}
          {!readonlyStructure && !trueBranchEnded && (
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
                <ActionMenuItem
                  icon={<ThumbsUpIcon className="h-4 w-4" />}
                  label="Like Post"
                  onClick={() => {
                    onAddAction('linkedin_like');
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

                <div className="my-1 border-t border-[#E2E8F0]" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">AI</p>
                <ActionMenuItem
                  icon={<BotIcon className="h-4 w-4" />}
                  label="Reply Agent"
                  onClick={() => {
                    onAddAction('reply_agent');
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
              <ActionMenuItem
                icon={<ThumbsUpIcon className="h-4 w-4" />}
                label="Like Post"
                onClick={() => {
                  onAdd('linkedin_like');
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

              <div className="my-1 border-t border-[#E2E8F0]" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-[#94A3B8]">AI</p>
              <ActionMenuItem
                icon={<BotIcon className="h-4 w-4" />}
                label="Reply Agent"
                onClick={() => {
                  onAdd('reply_agent');
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
  userTemplates,
  onSaveAsTemplate,
  onDeleteTemplate,
  selectedNodeId,
}: {
  onAddStep: (type: SequenceNode['type']) => void;
  onApplyTemplate?: (nodes: SequenceNode[]) => void;
  hasInmailCapability?: boolean;
  userTemplates?: SequenceTemplate[];
  onSaveAsTemplate?: (name: string, description: string) => void;
  onDeleteTemplate?: (id: string) => void;
  selectedNodeId?: string | null;
}) {
  const canAddStep = !!selectedNodeId;
  const [showStepCatalog, setShowStepCatalog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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
      {
        type: 'linkedin_like' as const,
        label: 'Like Post',
        icon: <ThumbsUpIcon className="h-4 w-4" />,
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
        <p className="mt-1 text-xs text-[#64748B]">
          {canAddStep ? 'Click to insert after selected step' : 'Select a step on the canvas first'}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          <button
            onClick={() => setShowStepCatalog((current) => !current)}
            className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#F1F5F9]"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1E293B]">Step Library</p>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {showStepCatalog ? 'Hide step options' : 'Show step options'}
              </p>
            </div>
            <ChevronIcon
              className={`h-4 w-4 text-[#64748B] transition-transform ${showStepCatalog ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {showStepCatalog && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 border-t border-[#E2E8F0] p-3">
                  {stepCategories.map((category) => (
                    <div key={category.title}>
                      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        {category.title}
                      </p>
                      <div className="space-y-1.5">
                        {category.steps.map((step) => (
                          <motion.button
                            key={step.type}
                            onClick={() => canAddStep && onAddStep(step.type)}
                            disabled={!canAddStep}
                            className={`group flex w-full items-center gap-2.5 rounded-lg border border-[#E2E8F0] p-2.5 text-left transition-all ${
                              canAddStep
                                ? 'bg-white hover:border-[#FF6B35]/40 hover:shadow-sm'
                                : 'cursor-not-allowed bg-[#F8FAFC] opacity-50'
                            }`}
                            whileHover={canAddStep ? { scale: 1.02, x: 2 } : {}}
                            whileTap={canAddStep ? { scale: 0.98 } : {}}
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
                            <span
                              className={`text-sm font-medium transition-colors ${canAddStep ? 'text-[#1E293B] group-hover:text-[#FF6B35]' : 'text-[#94A3B8]'}`}
                            >
                              {step.label}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Templates Section */}
        {onApplyTemplate && (
          <div className="border-t border-[#E2E8F0] pt-3">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Quick Start
            </p>

            {/* Save Current Sequence */}
            {onSaveAsTemplate && (
              <div className="mb-2">
                {!showSaveForm ? (
                  <button
                    onClick={() => setShowSaveForm(true)}
                    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] p-2 text-left text-sm text-[#64748B] transition-all hover:border-[#14B8A6] hover:text-[#14B8A6]"
                  >
                    <SaveIcon className="h-4 w-4" />
                    Save Current Sequence
                  </button>
                ) : (
                  <div className="rounded-lg border border-[#14B8A6]/30 bg-[#F0FDFA] p-2.5">
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Template name"
                      className="mb-1.5 w-full rounded border border-[#E2E8F0] px-2 py-1.5 text-sm focus:border-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={saveDescription}
                      onChange={(e) => setSaveDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="mb-2 w-full rounded border border-[#E2E8F0] px-2 py-1.5 text-sm focus:border-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={async () => {
                          if (!saveName.trim()) return;
                          setIsSaving(true);
                          try {
                            onSaveAsTemplate(saveName.trim(), saveDescription.trim());
                            setSaveName('');
                            setSaveDescription('');
                            setShowSaveForm(false);
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={!saveName.trim() || isSaving}
                        className="flex-1 rounded bg-[#14B8A6] px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0D9488] disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setShowSaveForm(false);
                          setSaveName('');
                          setSaveDescription('');
                        }}
                        className="rounded border border-[#E2E8F0] bg-white px-2 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                    {/* User Templates (shown first) */}
                    {userTemplates && userTemplates.length > 0 && (
                      <>
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                          My Templates
                        </p>
                        {userTemplates.map((template) => {
                          const handleApplyUserTemplate = () => {
                            const ts = Date.now();
                            const idMap: Record<string, string> = {};
                            template.nodes.forEach((n, i) => {
                              idMap[n.id] = `${n.id}-${ts}-${i}`;
                            });
                            const remapped = template.nodes.map((n, i) => ({
                              ...n,
                              id: idMap[n.id] || `${n.id}-${ts}-${i}`,
                              parentId: n.parentId ? idMap[n.parentId] || n.parentId : undefined,
                            })) as SequenceNode[];
                            onApplyTemplate(remapped);
                            setShowTemplates(false);
                          };

                          return (
                            <div key={template.id} className="group relative">
                              <motion.button
                                onClick={handleApplyUserTemplate}
                                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 text-left transition-all hover:border-[#FF6B35]/30 hover:bg-[#FFF7ED]/50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <p className="text-sm font-medium text-[#1E293B]">
                                  {template.name}
                                </p>
                                {template.description && (
                                  <p className="text-[10px] text-[#64748B]">
                                    {template.description}
                                  </p>
                                )}
                                <div className="mt-1.5 flex gap-1">
                                  {template.nodes
                                    .filter((n) => n.type !== 'start' && n.type !== 'end')
                                    .slice(0, 4)
                                    .map((n, i) => (
                                      <div
                                        key={i}
                                        className="flex h-5 w-5 items-center justify-center rounded [&_svg]:h-3 [&_svg]:w-3"
                                        style={{
                                          backgroundColor: `${getNodeConfig(n.type as SequenceNode['type']).color}15`,
                                        }}
                                      >
                                        {getNodeConfig(n.type as SequenceNode['type']).icon}
                                      </div>
                                    ))}
                                  {template.nodes.filter(
                                    (n) => n.type !== 'start' && n.type !== 'end'
                                  ).length > 4 && (
                                    <span className="flex items-center text-[10px] text-[#64748B]">
                                      +
                                      {template.nodes.filter(
                                        (n) => n.type !== 'start' && n.type !== 'end'
                                      ).length - 4}
                                    </span>
                                  )}
                                </div>
                              </motion.button>
                              {onDeleteTemplate && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTemplate(template.id);
                                  }}
                                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-all hover:bg-[#FEE2E2] group-hover:opacity-100"
                                >
                                  <CloseIcon className="h-3 w-3 text-[#64748B] hover:text-[#EF4444]" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* Empty state for user templates */}
                    {userTemplates && userTemplates.length === 0 && onSaveAsTemplate && (
                      <p className="px-1 text-center text-[10px] text-[#94A3B8]">
                        No saved templates yet
                      </p>
                    )}

                    {/* Built-in templates */}
                    <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Default Templates
                    </p>
                    {Object.entries(SEQUENCE_TEMPLATES).map(([key, template]) => (
                      <motion.button
                        key={key}
                        onClick={() => {
                          const ts = Date.now();
                          const idMap: Record<string, string> = {};
                          template.nodes.forEach((n, i) => {
                            idMap[n.id] = `${n.id}-${ts}-${i}`;
                          });
                          onApplyTemplate(
                            template.nodes.map((n, i) => {
                              const pid =
                                'parentId' in n ? (n as { parentId?: string }).parentId : undefined;
                              return {
                                ...n,
                                id: idMap[n.id] || `${n.id}-${ts}-${i}`,
                                parentId: pid ? idMap[pid] || pid : undefined,
                              };
                            })
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
    </div>
  );
}

// Node Configuration Panel
export function NodeConfigPanel({
  node,
  onUpdate,
  onClose,
  readonlyStructure = false,
  suggestionContext,
}: {
  node: SequenceNode;
  onUpdate: (data: Partial<NodeData>) => void;
  onClose: () => void;
  readonlyStructure?: boolean;
  suggestionContext?: {
    workspaceId?: string | null;
    leadListId?: string | null;
    campaignId?: string | null;
  };
}) {
  const nodeConfig = getNodeConfig(node.type);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const lastSuggestedNodeId = useRef<string | null>(null);
  const {
    mutate: requestSequenceSuggestionsMutation,
    reset: resetSequenceSuggestions,
    data: sequenceSuggestionData,
    error: sequenceSuggestionErrorValue,
    isPending: isSequenceSuggestionsPending,
  } = useSequenceStepSuggestions();
  const messageUsesAiPersonalization = (node.data.message || '').includes('{{aiPersonalization}}');
  const supportsSuggestions = [
    'linkedin_message',
    'linkedin_connect',
    'linkedin_inmail',
    'email',
  ].includes(node.type);
  const mergedVariables = Array.from(
    new Set([...PERSONALIZATION_VARIABLES, ...(sequenceSuggestionData?.suggested_variables || [])])
  );

  const updateMessage = (message: string) => {
    onUpdate({
      message,
      ...(message.includes('{{aiPersonalization}}')
        ? {
            personalizationMode:
              node.data.personalizationMode || ('first_line' as PersonalizationMode),
            personalizationProviders:
              node.data.personalizationProviders ||
              (['linkedin_profile'] as PersonalizationProvider[]),
          }
        : {}),
    });
  };

  const insertVariable = (variable: string) => {
    const textarea = messageRef.current;
    const currentMessage = node.data.message || '';
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = currentMessage.slice(0, start) + variable + currentMessage.slice(end);
      updateMessage(newMessage);
      // Restore cursor position after the inserted variable
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + variable.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    } else {
      updateMessage(currentMessage + variable);
    }
  };

  const updatePersonalizationProvider = (provider: PersonalizationProvider, checked: boolean) => {
    const current = node.data.personalizationProviders || ['linkedin_profile'];
    const next = checked
      ? Array.from(new Set([...current, provider]))
      : current.filter((p) => p !== provider);
    onUpdate({
      personalizationProviders: next.length > 0 ? next : ['linkedin_profile'],
    });
  };

  const requestSequenceSuggestions = useCallback(() => {
    if (!supportsSuggestions || !suggestionContext?.workspaceId) return;
    requestSequenceSuggestionsMutation({
      workspace_id: suggestionContext.workspaceId,
      lead_list_id: suggestionContext.leadListId || undefined,
      campaign_id: suggestionContext.campaignId || undefined,
      step_type: node.type,
      current_message: node.data.message || undefined,
      current_subject: node.data.subject || undefined,
    }).catch(() => {
      // Errors are surfaced through hook state.
    });
  }, [
    requestSequenceSuggestionsMutation,
    suggestionContext?.workspaceId,
    suggestionContext?.leadListId,
    suggestionContext?.campaignId,
    supportsSuggestions,
    node.type,
    node.data.message,
    node.data.subject,
  ]);

  useEffect(() => {
    if (!supportsSuggestions || !suggestionContext?.workspaceId) {
      lastSuggestedNodeId.current = null;
      resetSequenceSuggestions();
      return;
    }
    if (lastSuggestedNodeId.current === node.id) return;
    lastSuggestedNodeId.current = node.id;
    resetSequenceSuggestions();
    requestSequenceSuggestions();
  }, [
    node.id,
    requestSequenceSuggestions,
    resetSequenceSuggestions,
    supportsSuggestions,
    suggestionContext?.workspaceId,
  ]);

  const applySuggestedDraft = useCallback(
    (draft: { subject?: string | null; message: string }) => {
      onUpdate({
        message: draft.message,
        ...(draft.subject !== undefined ? { subject: draft.subject || '' } : {}),
      });
    },
    [onUpdate]
  );

  const suggestionError =
    sequenceSuggestionErrorValue instanceof Error ? sequenceSuggestionErrorValue.message : null;

  const renderPersonalizationControls = (channelLabel: string) => (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <div className="mb-3">
        <div>
          <p className="text-sm font-medium text-[#1E293B]">AI Personalization</p>
          <p className="mt-1 text-xs text-[#64748B]">
            Personalize the first line or the full {channelLabel.toLowerCase()} using profile and
            web research.
          </p>
        </div>
      </div>

      {messageUsesAiPersonalization && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#64748B]">
              Mode
            </label>
            <select
              value={node.data.personalizationMode || 'first_line'}
              onChange={(e) =>
                onUpdate({ personalizationMode: e.target.value as PersonalizationMode })
              }
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="first_line">Personalize first line</option>
              <option value="full_message">Personalize full message</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#64748B]">
              Research Sources
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={(node.data.personalizationProviders || ['linkedin_profile']).includes(
                    'linkedin_profile'
                  )}
                  onChange={(e) =>
                    updatePersonalizationProvider('linkedin_profile', e.target.checked)
                  }
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                LinkedIn profile
              </label>
              <label className="flex items-center gap-2 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={(node.data.personalizationProviders || []).includes('openai_web_search')}
                  onChange={(e) =>
                    updatePersonalizationProvider('openai_web_search', e.target.checked)
                  }
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                Web search
              </label>
            </div>
          </div>

          <p className="text-xs text-[#64748B]">
            Use <span className="font-medium text-[#1E293B]">{'{{aiPersonalization}}'}</span> to
            place the generated opener exactly where you want it. If no personalization is
            available, the message will still send normally.
          </p>
        </div>
      )}
    </div>
  );

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
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
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
              onChange={(e) => updateMessage(e.target.value)}
              placeholder="Hi {{first_name}}, I noticed..."
              rows={4}
              className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mergedVariables.map((variable) => (
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
            <div className="mt-3">
              <SuggestedDraftsPanel
                data={(sequenceSuggestionData as SequenceStepSuggestionsResponse | null) || null}
                isLoading={isSequenceSuggestionsPending}
                error={suggestionError}
                onApply={applySuggestedDraft}
                onRegenerate={() => requestSequenceSuggestions()}
                surface="sequence_builder"
                suggestionType={node.type}
                feedbackContext={{
                  workspaceId: suggestionContext?.workspaceId,
                  leadId: sequenceSuggestionData?.sample_lead?.lead_id || null,
                  campaignId: suggestionContext?.campaignId,
                }}
              />
            </div>
            {renderPersonalizationControls('LinkedIn message')}
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
                onChange={(e) => updateMessage(e.target.value)}
                placeholder="Hi {{first_name}}..."
                rows={6}
                className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mergedVariables.map((variable) => (
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
            <SuggestedDraftsPanel
              data={(sequenceSuggestionData as SequenceStepSuggestionsResponse | null) || null}
              isLoading={isSequenceSuggestionsPending}
              error={suggestionError}
              onApply={applySuggestedDraft}
              onRegenerate={() => requestSequenceSuggestions()}
              surface="sequence_builder"
              suggestionType={node.type}
              feedbackContext={{
                workspaceId: suggestionContext?.workspaceId,
                leadId: sequenceSuggestionData?.sample_lead?.lead_id || null,
                campaignId: suggestionContext?.campaignId,
              }}
            />
            {renderPersonalizationControls('InMail')}
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
              <LazyRichTextEditor
                content={node.data.message || ''}
                onChange={(html) => updateMessage(html)}
                placeholder="Hi {{first_name}}..."
                minHeight="120px"
                variables={mergedVariables}
              />
            </div>
            <SuggestedDraftsPanel
              data={(sequenceSuggestionData as SequenceStepSuggestionsResponse | null) || null}
              isLoading={isSequenceSuggestionsPending}
              error={suggestionError}
              onApply={applySuggestedDraft}
              onRegenerate={() => requestSequenceSuggestions()}
              surface="sequence_builder"
              suggestionType={node.type}
              feedbackContext={{
                workspaceId: suggestionContext?.workspaceId,
                leadId: sequenceSuggestionData?.sample_lead?.lead_id || null,
                campaignId: suggestionContext?.campaignId,
              }}
            />
            {renderPersonalizationControls('Email')}
          </>
        )}

        {/* Condition Configuration */}
        {node.type === 'condition' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1E293B]">Condition</label>
            <select
              value={node.data.condition || 'connected'}
              onChange={(e) => onUpdate({ condition: e.target.value as NodeData['condition'] })}
              disabled={readonlyStructure}
              className={`w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 ${readonlyStructure ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <option value="connected">If Connected</option>
              <option value="message_replied">If Message Replied</option>
              <option value="message_seen">If Message Seen</option>
              <option value="email_opened">If Email Opened</option>
              <option value="email_link_clicked">If Email Link Clicked</option>
              <option value="email_replied">If Email Replied</option>
            </select>
            <div className="mt-3 rounded-lg bg-[#F8FAFC] p-3">
              <p className="text-xs text-[#64748B]">
                Leads that match this condition will follow the{' '}
                <strong className="text-[#22C55E]">
                  {
                    {
                      connected: 'Connected',
                      message_replied: 'Replied',
                      message_seen: 'Seen',
                      email_opened: 'Opened',
                      email_link_clicked: 'Clicked',
                      email_replied: 'Replied',
                    }[node.data.condition || 'connected']
                  }
                </strong>{' '}
                branch. Others will follow the{' '}
                <strong className="text-[#EF4444]">
                  {
                    {
                      connected: 'Not Connected',
                      message_replied: 'Not Replied',
                      message_seen: 'Not Seen',
                      email_opened: 'Not Opened',
                      email_link_clicked: 'Not Clicked',
                      email_replied: 'Not Replied',
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
          <div className="space-y-2 rounded-lg bg-[#F3E8FF] p-3">
            <p className="text-xs text-[#7C3AED]">
              This step will discover the lead's email address. Leads that already have an email
              will skip this step automatically.
            </p>
            <div className="rounded-md border border-[#A855F7]/20 bg-white/70 px-3 py-2">
              <p className="text-xs text-[#6D28D9]">
                Successful email enrichments are capped at 300 per workspace each month. Only
                enrichments that return an email count toward the cap.
              </p>
            </div>
          </div>
        )}

        {/* Like Post Configuration */}
        {node.type === 'linkedin_like' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Posts to Like</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => onUpdate({ postsToLike: n })}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                      (node.data.postsToLike || 1) === n
                        ? 'border-[#0A66C2] bg-[#0A66C2] text-white'
                        : 'border-[#E2E8F0] text-[#1E293B] hover:border-[#0A66C2]/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                Likes the{' '}
                {(node.data.postsToLike || 1) === 1
                  ? 'most recent post'
                  : `${node.data.postsToLike} most recent posts`}{' '}
                from the lead's profile.
              </p>
            </div>
          </>
        )}

        {/* Reply Agent Configuration */}
        {node.type === 'reply_agent' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                Goal <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                value={node.data.agentGoal || ''}
                onChange={(e) => onUpdate({ agentGoal: e.target.value })}
                placeholder="Book a meeting with the lead"
                rows={3}
                className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              />
              <p className="mt-1 text-xs text-[#64748B]">What should the agent achieve?</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Tone</label>
              <select
                value={node.data.agentTone || 'professional'}
                onChange={(e) =>
                  onUpdate({
                    agentTone: e.target.value as 'professional' | 'friendly' | 'casual',
                  })
                }
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                Your Name / Title
              </label>
              <input
                type="text"
                value={node.data.agentSenderTitle || ''}
                onChange={(e) => onUpdate({ agentSenderTitle: e.target.value })}
                placeholder="VP of Sales"
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              />
              <p className="mt-1 text-xs text-[#64748B]">Your role/title for the agent to use</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">Company Name</label>
              <input
                type="text"
                value={node.data.agentCompanyName || ''}
                onChange={(e) => onUpdate({ agentCompanyName: e.target.value })}
                placeholder="Acme Inc."
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                Company Context
              </label>
              <textarea
                value={node.data.agentCompanyContext || ''}
                onChange={(e) => onUpdate({ agentCompanyContext: e.target.value })}
                placeholder="We help B2B companies automate their outreach..."
                rows={2}
                className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                Product Description
              </label>
              <textarea
                value={node.data.agentProductDescription || ''}
                onChange={(e) => onUpdate({ agentProductDescription: e.target.value })}
                placeholder="Our platform combines LinkedIn + Email outreach..."
                rows={2}
                className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                Scheduling Link <span className="font-normal text-[#94A3B8]">(optional)</span>
              </label>
              <input
                type="url"
                value={node.data.agentSchedulingLink || ''}
                onChange={(e) => onUpdate({ agentSchedulingLink: e.target.value })}
                placeholder="https://calendly.com/you/30min"
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                Fallback URL if calendar is not connected
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                Custom Instructions <span className="font-normal text-[#94A3B8]">(optional)</span>
              </label>
              <textarea
                value={node.data.agentCustomInstructions || ''}
                onChange={(e) => onUpdate({ agentCustomInstructions: e.target.value })}
                placeholder={`Examples:
- If asked about pricing, say "Let me loop in our team" and hand off.
- Always mention our free trial when the lead shows interest.
- Never discuss competitors by name.`}
                rows={4}
                className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                Rules for specific situations — overrides workspace defaults for this step
              </p>
            </div>

            <div className="rounded-lg bg-[#F3E8FF] p-3">
              <p className="text-xs text-[#7C3AED]">
                The AI agent will monitor this conversation and respond to incoming messages to
                achieve the goal above. Connect a calendar account to enable meeting booking.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-[#E2E8F0] bg-white/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
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
    linkedin_like: {
      label: 'Like Post',
      color: '#0A66C2',
      icon: <ThumbsUpIcon className="h-4 w-4 text-[#0A66C2]" />,
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
    reply_agent: {
      label: 'AI Reply Agent',
      color: '#8B5CF6',
      icon: <BotIcon className="h-4 w-4 text-[#8B5CF6]" />,
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

function getDefaultNodeData(
  type: SequenceNode['type'],
  agentDefaults?: WorkspaceAgentDefaults | null
): NodeData {
  switch (type) {
    case 'delay':
      return { delayDays: 0, delayHours: 0 };
    case 'condition':
      return { condition: 'connected' };
    case 'linkedin_like':
      return { postsToLike: 1 };
    case 'reply_agent':
      return {
        agentGoal: agentDefaults?.goal || '',
        agentTone: agentDefaults?.tone || 'professional',
        agentCompanyName: agentDefaults?.company_name || '',
        agentCompanyContext: agentDefaults?.company_context || '',
        agentProductDescription: agentDefaults?.product_description || '',
        agentSchedulingLink: agentDefaults?.scheduling_link || '',
        agentSenderTitle: agentDefaults?.sender_title || '',
        agentCustomInstructions: agentDefaults?.custom_instructions || '',
      };
    default:
      return {};
  }
}

// Icons
function BotIcon({ className = 'w-4 h-4' }: { className?: string }) {
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
        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5m-4.75-11.396c.251.023.501.05.75.082M12 3v5.25M8 21h8m-4-4v4m-8-8h16a1 1 0 001-1v-2a1 1 0 00-1-1H4a1 1 0 00-1 1v2a1 1 0 001 1z"
      />
    </svg>
  );
}

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

function SaveIcon({ className = 'w-4 h-4' }: { className?: string }) {
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
        d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v4h8V3M7 21v-8h10v8" />
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

function ThumbsUpIcon({ className = 'w-4 h-4' }: { className?: string }) {
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
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
      />
    </svg>
  );
}
