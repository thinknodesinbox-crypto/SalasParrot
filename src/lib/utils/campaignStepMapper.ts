import type { SequenceNode } from '@/components/campaign/SequenceCanvas';
import type { StepType } from '@/lib/types';

// Map frontend node type to backend step type
export function mapNodeTypeToStepType(nodeType: SequenceNode['type']): StepType | null {
  const mapping: Record<string, StepType> = {
    linkedin_connect: 'connection_request',
    linkedin_message: 'message',
    linkedin_inmail: 'inmail',
    linkedin_view: 'profile_view',
    linkedin_like: 'like_post',
    email: 'email',
    delay: 'wait',
    condition: 'condition',
    reply_agent: 'reply_agent',
    enrichment: 'enrichment',
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
    like_post: 'linkedin_like',
    email: 'email',
    wait: 'delay',
    condition: 'condition',
    email_followup: 'email',
    reply_agent: 'reply_agent',
    enrichment: 'enrichment',
    end: 'end',
  };
  return mapping[stepType] ?? null;
}

// Map frontend node data to backend config
export function mapNodeDataToConfig(node: SequenceNode): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  const messageUsesAiPersonalization =
    typeof node.data.message === 'string' && node.data.message.includes('{{aiPersonalization}}');

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
  if (node.data.postsToLike !== undefined) {
    config.posts_to_like = node.data.postsToLike;
  }
  if (messageUsesAiPersonalization) {
    config.personalization = {
      enabled: true,
      mode: node.data.personalizationMode ?? 'first_line',
      providers:
        node.data.personalizationProviders && node.data.personalizationProviders.length > 0
          ? node.data.personalizationProviders
          : ['linkedin_profile'],
    };
  }

  // Agent fields
  if (node.data.agentGoal !== undefined) {
    config.goal = node.data.agentGoal;
  }
  if (node.data.agentTone !== undefined) {
    config.tone = node.data.agentTone;
  }
  if (node.data.agentCompanyName !== undefined) {
    config.company_name = node.data.agentCompanyName;
  }
  if (node.data.agentCompanyContext !== undefined) {
    config.company_context = node.data.agentCompanyContext;
  }
  if (node.data.agentProductDescription !== undefined) {
    config.product_description = node.data.agentProductDescription;
  }
  if (node.data.agentSchedulingLink !== undefined) {
    config.scheduling_link = node.data.agentSchedulingLink;
  }
  if (node.data.agentSenderTitle !== undefined) {
    config.sender_title = node.data.agentSenderTitle;
  }
  if (node.data.agentHumanInTheLoop !== undefined) {
    config.human_in_the_loop = node.data.agentHumanInTheLoop;
  }
  if (node.data.agentCustomInstructions !== undefined) {
    config.custom_instructions = node.data.agentCustomInstructions;
  }

  return config;
}

// Map backend config to frontend node data
export function mapConfigToNodeData(config: Record<string, unknown>): SequenceNode['data'] {
  // Normalize legacy condition type: backend renamed "replied" to "message_replied"
  let condition = config.condition_type as string | undefined;
  if (condition === 'replied') {
    condition = 'message_replied';
  }
  const personalization = (config.personalization as Record<string, unknown> | undefined) ?? {};

  return {
    message: config.message as string | undefined,
    subject: config.subject as string | undefined,
    delayDays: config.delay_days as number | undefined,
    delayHours: config.delay_hours as number | undefined,
    postsToLike: config.posts_to_like as number | undefined,
    personalizationMode: personalization.mode as 'none' | 'first_line' | 'full_message' | undefined,
    personalizationProviders: personalization.providers as
      | Array<'linkedin_profile' | 'openai_web_search'>
      | undefined,
    condition: condition as
      | 'connected'
      | 'message_replied'
      | 'message_seen'
      | 'email_opened'
      | 'email_link_clicked'
      | 'email_replied'
      | undefined,
    // Agent fields
    agentGoal: config.goal as string | undefined,
    agentTone: config.tone as 'professional' | 'friendly' | 'casual' | undefined,
    agentCompanyName: config.company_name as string | undefined,
    agentCompanyContext: config.company_context as string | undefined,
    agentProductDescription: config.product_description as string | undefined,
    agentSchedulingLink: config.scheduling_link as string | undefined,
    agentSenderTitle: config.sender_title as string | undefined,
    agentHumanInTheLoop: config.human_in_the_loop as boolean | undefined,
    agentCustomInstructions: config.custom_instructions as string | undefined,
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

// Reconstruct branch info when loading steps from backend.
// Uses next_step_id chains exclusively — no order-based fallback.
// Orphaned steps (no chain reference) will appear disconnected, surfacing data issues.
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

  // Set of IDs that are main-flow continuation targets (next_step_id of conditions)
  const mainFlowContinuations = new Set<string>();
  for (const step of steps) {
    if (step.type === 'condition' && step.next_step_id) {
      mainFlowContinuations.add(step.next_step_id);
    }
  }

  // Helper to trace all steps in a branch chain via next_step_id
  const traceBranch = (startStepId: string, conditionId: string, branch: 'true' | 'false') => {
    let currentId: string | null = startStepId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      // Don't follow into main flow continuation steps
      if (mainFlowContinuations.has(currentId) && currentId !== startStepId) break;

      visited.add(currentId);
      branchInfo.set(currentId, { parentId: conditionId, branch });

      const currentStep = stepById.get(currentId);
      if (!currentStep) break;

      currentId = currentStep.next_step_id || null;
    }
  };

  // Process all condition steps - trace next_step_id chains
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
