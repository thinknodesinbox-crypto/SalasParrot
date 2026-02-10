import type { SequenceNode } from '@/components/campaign/SequenceCanvas';
import type { StepType } from '@/lib/types';

// Map frontend node type to backend step type
export function mapNodeTypeToStepType(nodeType: SequenceNode['type']): StepType | null {
  const mapping: Record<string, StepType> = {
    linkedin_connect: 'connection_request',
    linkedin_message: 'message',
    linkedin_inmail: 'inmail',
    linkedin_view: 'profile_view',
    email: 'email',
    delay: 'wait',
    condition: 'condition',
    end: 'end',
  };
  return mapping[nodeType] ?? null;
}

// Map backend step type to frontend node type
export function mapStepTypeToNodeType(stepType: StepType): SequenceNode['type'] | null {
  const mapping: Record<string, SequenceNode['type']> = {
    connection_request: 'linkedin_connect',
    message: 'linkedin_message',
    inmail: 'linkedin_inmail',
    profile_view: 'linkedin_view',
    email: 'email',
    wait: 'delay',
    condition: 'condition',
    email_followup: 'email',
    end: 'end',
  };
  return mapping[stepType] ?? null;
}

// Map frontend node data to backend config
export function mapNodeDataToConfig(node: SequenceNode): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  if (node.data.message !== undefined) {
    config.message = node.data.message;
  }
  if (node.data.subject !== undefined) {
    config.subject = node.data.subject;
  }
  if (node.data.delayDays !== undefined) {
    config.delay_days = node.data.delayDays;
  }
  if (node.data.delayHours !== undefined) {
    config.delay_hours = node.data.delayHours;
  }
  if (node.data.condition !== undefined) {
    config.condition_type = node.data.condition;
  }

  return config;
}

// Map backend config to frontend node data
export function mapConfigToNodeData(config: Record<string, unknown>): SequenceNode['data'] {
  return {
    message: config.message as string | undefined,
    subject: config.subject as string | undefined,
    delayDays: config.delay_days as number | undefined,
    delayHours: config.delay_hours as number | undefined,
    condition: config.condition_type as
      | 'connected'
      | 'replied'
      | 'email_opened'
      | 'email_link_clicked'
      | undefined,
  };
}

// Prepared step with branch info for saving
export interface PreparedStep {
  order: number;
  type: StepType;
  config: Record<string, unknown>;
  nodeId: string; // Frontend node ID for tracking
  parentNodeId?: string; // Parent condition node ID
  branch?: 'true' | 'false'; // Which branch this belongs to
}

// Filter and prepare nodes for saving (exclude only start nodes, include end nodes)
export function prepareNodesForSave(nodes: SequenceNode[]): PreparedStep[] {
  return nodes
    .filter((node) => node.type !== 'start')
    .map((node, index) => {
      const stepType = mapNodeTypeToStepType(node.type);
      if (!stepType) {
        throw new Error(`Unknown node type: ${node.type}`);
      }
      return {
        order: index + 1,
        type: stepType,
        config: mapNodeDataToConfig(node),
        nodeId: node.id,
        parentNodeId: node.parentId,
        branch: node.branch,
      };
    });
}

// Build branch relationships for updating condition steps after creation
export function buildBranchRelationships(
  preparedSteps: PreparedStep[],
  nodeIdToStepId: Map<string, string>
): Map<string, { trueBranchStepId?: string; falseBranchStepId?: string }> {
  const relationships = new Map<
    string,
    { trueBranchStepId?: string; falseBranchStepId?: string }
  >();

  // Find the first step in each branch for each condition
  for (const step of preparedSteps) {
    if (step.parentNodeId && step.branch) {
      const conditionStepId = nodeIdToStepId.get(step.parentNodeId);
      const thisStepId = nodeIdToStepId.get(step.nodeId);

      if (conditionStepId && thisStepId) {
        if (!relationships.has(conditionStepId)) {
          relationships.set(conditionStepId, {});
        }
        const rel = relationships.get(conditionStepId)!;

        // Only set if not already set (first step in each branch)
        if (step.branch === 'true' && !rel.trueBranchStepId) {
          rel.trueBranchStepId = thisStepId;
        } else if (step.branch === 'false' && !rel.falseBranchStepId) {
          rel.falseBranchStepId = thisStepId;
        }
      }
    }
  }

  return relationships;
}

// Reconstruct branch info when loading steps from backend
// Handles nested conditions by tracing through the step chain
export function reconstructBranchInfo(
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    order: number;
    true_branch_step_id?: string | null;
    false_branch_step_id?: string | null;
    next_step_id?: string | null;
  }>
): Map<string, { parentId: string; branch: 'true' | 'false' }> {
  const branchInfo = new Map<string, { parentId: string; branch: 'true' | 'false' }>();
  const stepById = new Map(steps.map((s) => [s.id, s]));

  // Helper to trace all steps in a branch chain
  const traceBranch = (startStepId: string, conditionId: string, branch: 'true' | 'false') => {
    let currentId: string | null = startStepId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      branchInfo.set(currentId, { parentId: conditionId, branch });

      const currentStep = stepById.get(currentId);
      if (!currentStep) break;

      // If this is a nested condition, trace its branches too
      // (they inherit the parent condition's branch info for the condition itself,
      // but their own branches are separate)
      if (currentStep.type === 'condition') {
        // The nested condition belongs to the parent branch
        // Its own branches will be handled when we process this condition
      }

      // Move to next step in the branch
      currentId = currentStep.next_step_id || null;
    }
  };

  // Process all condition steps
  for (const step of steps) {
    if (step.type === 'condition') {
      if (step.true_branch_step_id) {
        traceBranch(step.true_branch_step_id, step.id, 'true');
      }
      if (step.false_branch_step_id) {
        traceBranch(step.false_branch_step_id, step.id, 'false');
      }
    }
  }

  return branchInfo;
}

// Build next_step_id relationships for all steps
// This properly links steps within branches and main flow
export function buildNextStepRelationships(
  preparedSteps: PreparedStep[],
  nodeIdToStepId: Map<string, string>
): Map<string, string | null> {
  const nextStepMap = new Map<string, string | null>();

  // Separate main flow and branch steps
  const mainFlowSteps = preparedSteps.filter((s) => !s.parentNodeId && !s.branch);

  // Group branch steps by condition and branch type
  const branchStepsMap = new Map<string, { true: PreparedStep[]; false: PreparedStep[] }>();
  for (const step of preparedSteps) {
    if (step.parentNodeId && step.branch) {
      if (!branchStepsMap.has(step.parentNodeId)) {
        branchStepsMap.set(step.parentNodeId, { true: [], false: [] });
      }
      branchStepsMap.get(step.parentNodeId)![step.branch].push(step);
    }
  }

  // Process main flow - link each step to the next
  for (let i = 0; i < mainFlowSteps.length; i++) {
    const currentStep = mainFlowSteps[i];
    const currentStepId = nodeIdToStepId.get(currentStep.nodeId);

    if (!currentStepId) continue;

    // Find next step in main flow
    const nextStep = mainFlowSteps[i + 1];
    const nextStepId = nextStep ? nodeIdToStepId.get(nextStep.nodeId) || null : null;

    // For condition steps, next_step_id is used for fall-through when branches are empty
    // For other steps, next_step_id points to the next step in sequence
    nextStepMap.set(currentStepId, nextStepId);
  }

  // Process branch steps - link each step to the next in same branch
  for (const [, branches] of branchStepsMap) {
    // Process true branch
    for (let i = 0; i < branches.true.length; i++) {
      const currentStep = branches.true[i];
      const currentStepId = nodeIdToStepId.get(currentStep.nodeId);
      if (!currentStepId) continue;

      const nextStep = branches.true[i + 1];
      if (nextStep) {
        const nextStepId = nodeIdToStepId.get(nextStep.nodeId);
        nextStepMap.set(currentStepId, nextStepId || null);
      } else {
        // Last step in true branch - null means end of sequence for this lead
        nextStepMap.set(currentStepId, null);
      }
    }

    // Process false branch
    for (let i = 0; i < branches.false.length; i++) {
      const currentStep = branches.false[i];
      const currentStepId = nodeIdToStepId.get(currentStep.nodeId);
      if (!currentStepId) continue;

      const nextStep = branches.false[i + 1];
      if (nextStep) {
        const nextStepId = nodeIdToStepId.get(nextStep.nodeId);
        nextStepMap.set(currentStepId, nextStepId || null);
      } else {
        // Last step in false branch - null means end of sequence for this lead
        nextStepMap.set(currentStepId, null);
      }
    }
  }

  return nextStepMap;
}
