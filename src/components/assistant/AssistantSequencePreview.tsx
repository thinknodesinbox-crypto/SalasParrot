import { useMemo } from 'react';
import { SequenceCanvas, type SequenceNode } from '@/components/campaign/SequenceCanvas';
import {
  mapConfigToNodeData,
  mapStepTypeToNodeType,
  reconstructBranchInfo,
} from '@/lib/utils/campaignStepMapper';

interface AssistantSequenceStep {
  order: number;
  type: string;
  config: Record<string, unknown>;
  next_step_order?: number | null;
  true_branch_order?: number | null;
  false_branch_order?: number | null;
}

interface AssistantSequencePreviewProps {
  steps: AssistantSequenceStep[];
}

export function AssistantSequencePreview({ steps }: AssistantSequencePreviewProps) {
  const nodes = useMemo<SequenceNode[]>(() => {
    if (!steps.length) return [];

    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    const pseudoIdByOrder = new Map(
      sortedSteps.map((step) => [step.order, `assistant-step-${step.order}`])
    );
    const backendSteps = sortedSteps.map((step) => ({
      id: pseudoIdByOrder.get(step.order) || `assistant-step-${step.order}`,
      type: step.type,
      config: step.config || {},
      order: step.order,
      true_branch_step_id:
        step.true_branch_order != null ? pseudoIdByOrder.get(step.true_branch_order) || null : null,
      false_branch_step_id:
        step.false_branch_order != null
          ? pseudoIdByOrder.get(step.false_branch_order) || null
          : null,
      next_step_id:
        step.next_step_order != null ? pseudoIdByOrder.get(step.next_step_order) || null : null,
    }));

    const branchInfo = reconstructBranchInfo(backendSteps);
    const sequenceNodes: SequenceNode[] = [{ id: 'assistant-start', type: 'start', data: {} }];

    backendSteps.forEach((step) => {
      const mappedType = mapStepTypeToNodeType(step.type as never);
      if (!mappedType) return;
      const branchData = branchInfo.get(step.id);
      sequenceNodes.push({
        id: step.id,
        type: mappedType,
        data: mapConfigToNodeData(step.config || {}),
        parentId: branchData?.parentId,
        branch: branchData?.branch,
      });
    });

    sequenceNodes.push({ id: 'assistant-end', type: 'end', data: {} });
    return sequenceNodes;
  }, [steps]);

  if (!nodes.length) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      <div className="border-b border-[#E2E8F0] px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Sequence Preview
        </div>
        <div className="mt-1 text-sm text-[#64748B]">
          Read-only campaign flow generated from this assistant action.
        </div>
      </div>
      <div className="h-[420px]">
        <SequenceCanvas
          nodes={nodes}
          onNodesChange={() => {}}
          onNodeSelect={() => {}}
          selectedNodeId={null}
          readonlyStructure
        />
      </div>
    </div>
  );
}
