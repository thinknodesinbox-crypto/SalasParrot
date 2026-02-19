import type { SequenceNode } from '@/components/campaign/SequenceCanvas';

export interface SequenceWarning {
  type: 'error' | 'warning';
  code: string;
  message: string;
  suggestion?: string;
  nodeIds?: string[];
}

const MAX_BRANCH_DEPTH = 10;

export interface ValidationContext {
  hasInmailCapableSenders?: boolean; // Whether selected senders have InMail capability
  hasEmailAccountSelected?: boolean; // Whether at least one email account is selected
}

/**
 * Validates a campaign sequence and returns warnings for problematic patterns.
 * This uses soft validation - it warns but doesn't block saving.
 * Validates both main flow and all branch flows.
 */
export function validateCampaignSequence(
  nodes: SequenceNode[],
  context?: ValidationContext
): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  // Filter out start nodes for analysis (keep end nodes for branch detection)
  const actionNodes = nodes.filter((n) => n.type !== 'start');

  if (actionNodes.length === 0) {
    warnings.push({
      type: 'error',
      code: 'EMPTY_SEQUENCE',
      message: 'Campaign has no steps',
      suggestion: 'Add at least one action step to your campaign sequence.',
    });
    return warnings;
  }

  // Separate main flow and branches
  const mainFlow = actionNodes.filter((n) => !n.branch);

  // Group branch nodes by parent condition
  const branchGroups = new Map<string, { true: SequenceNode[]; false: SequenceNode[] }>();
  for (const node of actionNodes) {
    if (node.parentId && node.branch) {
      if (!branchGroups.has(node.parentId)) {
        branchGroups.set(node.parentId, { true: [], false: [] });
      }
      branchGroups.get(node.parentId)![node.branch].push(node);
    }
  }

  // Check main flow patterns
  warnings.push(...checkConditionAfterActionWithoutWait(mainFlow));
  warnings.push(...checkMessageWithoutConnection(mainFlow));
  warnings.push(...checkConditionWithoutPriorAction(mainFlow));
  warnings.push(...checkDuplicateActions(mainFlow));
  warnings.push(...checkWaitOnlySequence(mainFlow));
  warnings.push(...checkShortWaitBeforeCondition(mainFlow));

  // Check each branch flow
  for (const [conditionId, branches] of branchGroups) {
    const conditionNode = nodes.find((n) => n.id === conditionId);
    const branchLabel = conditionNode?.data.condition || 'condition';

    // Check true branch
    if (branches.true.length > 0) {
      const trueBranchWarnings = validateBranchFlow(
        branches.true,
        mainFlow,
        `"${branchLabel}" true branch`
      );
      warnings.push(...trueBranchWarnings);
    }

    // Check false branch
    if (branches.false.length > 0) {
      const falseBranchWarnings = validateBranchFlow(
        branches.false,
        mainFlow,
        `"${branchLabel}" false branch`
      );
      warnings.push(...falseBranchWarnings);
    }
  }

  // Check for empty branches (warning, not error - they fall through)
  warnings.push(...checkEmptyBranches(nodes, branchGroups));

  // Check branch depth
  warnings.push(...checkBranchDepth(nodes));

  // Check InMail usage against sender capabilities
  if (context) {
    warnings.push(...checkInmailCapability(nodes, context));
    warnings.push(...checkEmailAccountSelected(nodes, context));
  }

  // Check email steps have enrichment step before them
  warnings.push(...checkEnrichmentBeforeEmail(nodes));

  return warnings;
}

/**
 * Validate a branch flow, considering context from main flow
 */
function validateBranchFlow(
  branchNodes: SequenceNode[],
  mainFlowBefore: SequenceNode[],
  branchName: string
): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  // Check patterns within the branch
  warnings.push(...checkConditionAfterActionWithoutWait(branchNodes, branchName));
  warnings.push(...checkMessageWithoutConnectionInBranch(branchNodes, mainFlowBefore, branchName));
  warnings.push(...checkDuplicateActions(branchNodes, branchName));

  return warnings;
}

/**
 * Check for empty branches (when condition has no steps in a branch)
 */
function checkEmptyBranches(
  nodes: SequenceNode[],
  branchGroups: Map<string, { true: SequenceNode[]; false: SequenceNode[] }>
): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  for (const node of nodes) {
    if (node.type === 'condition') {
      const branches = branchGroups.get(node.id);
      const conditionType = node.data.condition || 'condition';

      if (!branches || (branches.true.length === 0 && branches.false.length === 0)) {
        warnings.push({
          type: 'warning',
          code: 'EMPTY_CONDITION_BRANCHES',
          message: `Condition "${conditionType}" has no steps in either branch`,
          suggestion:
            'Add steps to at least one branch, or remove the condition. Empty branches will fall through to the next step.',
          nodeIds: [node.id],
        });
      } else if (branches.true.length === 0) {
        warnings.push({
          type: 'warning',
          code: 'EMPTY_TRUE_BRANCH',
          message: `Condition "${conditionType}" has no steps in the "${conditionType}" (true) branch`,
          suggestion:
            'Consider adding steps to this branch. Empty branches will fall through to the next step.',
          nodeIds: [node.id],
        });
      } else if (branches.false.length === 0) {
        warnings.push({
          type: 'warning',
          code: 'EMPTY_FALSE_BRANCH',
          message: `Condition "${conditionType}" has no steps in the "Not ${conditionType}" (false) branch`,
          suggestion:
            'Consider adding steps to this branch. Empty branches will fall through to the next step.',
          nodeIds: [node.id],
        });
      }
    }
  }

  return warnings;
}

/**
 * Check branch nesting depth
 */
function checkBranchDepth(nodes: SequenceNode[]): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  // Calculate depth for each node
  const nodeDepth = new Map<string, number>();

  for (const node of nodes) {
    let depth = 0;
    let currentNode = node;

    // Traverse up the parent chain to calculate depth
    const visited = new Set<string>();
    while (currentNode.parentId && !visited.has(currentNode.id)) {
      visited.add(currentNode.id);
      depth++;
      const parentNode = nodes.find((n) => n.id === currentNode.parentId);
      if (!parentNode) break;
      currentNode = parentNode;
    }

    nodeDepth.set(node.id, depth);

    if (depth > MAX_BRANCH_DEPTH) {
      warnings.push({
        type: 'error',
        code: 'MAX_BRANCH_DEPTH_EXCEEDED',
        message: `Branch nesting exceeds maximum depth of ${MAX_BRANCH_DEPTH}`,
        suggestion: `Simplify your campaign by reducing the number of nested conditions. Current depth: ${depth}`,
        nodeIds: [node.id],
      });
      break; // Only report once
    }
  }

  return warnings;
}

/**
 * Pattern: connection_request → condition (without wait)
 * Problem: The condition will always be false because the person hasn't had time to accept
 */
function checkConditionAfterActionWithoutWait(
  nodes: SequenceNode[],
  flowName?: string
): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];
  const prefix = flowName ? `In ${flowName}: ` : '';

  for (let i = 0; i < nodes.length - 1; i++) {
    const current = nodes[i];
    const next = nodes[i + 1];

    // Check: connection_request directly followed by condition
    if (current.type === 'linkedin_connect' && next.type === 'condition') {
      const conditionType = next.data.condition || 'connected';
      warnings.push({
        type: 'warning',
        code: 'CONDITION_WITHOUT_WAIT',
        message: `${prefix}Condition "${conditionType}" immediately follows connection request`,
        suggestion:
          'Add a delay step (e.g., 2-3 days) between the connection request and the condition to give the person time to accept.',
        nodeIds: [current.id, next.id],
      });
    }

    // Check: linkedin_message directly followed by condition (message_replied or message_seen)
    if (
      current.type === 'linkedin_message' &&
      next.type === 'condition' &&
      (next.data.condition === 'message_replied' || next.data.condition === 'message_seen')
    ) {
      const label = next.data.condition === 'message_replied' ? 'message replied' : 'message seen';
      warnings.push({
        type: 'warning',
        code: 'CONDITION_WITHOUT_WAIT',
        message: `${prefix}Condition "${label}" immediately follows message`,
        suggestion:
          'Add a delay step (e.g., 1-2 days) between the message and the condition check to give the person time to respond.',
        nodeIds: [current.id, next.id],
      });
    }

    // Check: email directly followed by condition (opened, replied, or link clicked)
    if (
      current.type === 'email' &&
      next.type === 'condition' &&
      (next.data.condition === 'email_opened' ||
        next.data.condition === 'email_replied' ||
        next.data.condition === 'email_link_clicked')
    ) {
      const labelMap: Record<string, string> = {
        email_opened: 'email opened',
        email_replied: 'email replied',
        email_link_clicked: 'email link clicked',
      };
      warnings.push({
        type: 'warning',
        code: 'CONDITION_WITHOUT_WAIT',
        message: `${prefix}Condition "${labelMap[next.data.condition]}" immediately follows email`,
        suggestion:
          'Add a delay step (e.g., 1-2 days) between the email and the condition check to give the person time to interact.',
        nodeIds: [current.id, next.id],
      });
    }
  }

  return warnings;
}

/**
 * Pattern: message step without prior connection_request
 * Problem: You can only message people you're connected with
 */
function checkMessageWithoutConnection(nodes: SequenceNode[]): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  const hasConnectionRequest = nodes.some((n) => n.type === 'linkedin_connect');
  const messageNodes = nodes.filter((n) => n.type === 'linkedin_message');

  if (messageNodes.length > 0 && !hasConnectionRequest) {
    warnings.push({
      type: 'warning',
      code: 'MESSAGE_WITHOUT_CONNECTION',
      message: 'Sequence includes LinkedIn message but no connection request',
      suggestion:
        'LinkedIn messages can only be sent to connections. Consider adding a connection request step first, or ensure leads are already connected.',
      nodeIds: messageNodes.map((n) => n.id),
    });
  }

  // Also check if message comes before connection request
  const firstMessageIndex = nodes.findIndex((n) => n.type === 'linkedin_message');
  const firstConnectIndex = nodes.findIndex((n) => n.type === 'linkedin_connect');

  if (
    firstMessageIndex !== -1 &&
    firstConnectIndex !== -1 &&
    firstMessageIndex < firstConnectIndex
  ) {
    warnings.push({
      type: 'warning',
      code: 'MESSAGE_BEFORE_CONNECTION',
      message: 'LinkedIn message appears before connection request',
      suggestion:
        'Messages can only be sent to connections. Move the connection request before the message step.',
      nodeIds: [nodes[firstMessageIndex].id],
    });
  }

  return warnings;
}

/**
 * Check message without connection in a branch, considering main flow context
 */
function checkMessageWithoutConnectionInBranch(
  branchNodes: SequenceNode[],
  mainFlowBefore: SequenceNode[],
  branchName: string
): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  // Check if main flow has connection request before the condition
  const hasConnectionInMainFlow = mainFlowBefore.some((n) => n.type === 'linkedin_connect');
  const hasConnectionInBranch = branchNodes.some((n) => n.type === 'linkedin_connect');
  const messageNodes = branchNodes.filter((n) => n.type === 'linkedin_message');

  if (messageNodes.length > 0 && !hasConnectionInMainFlow && !hasConnectionInBranch) {
    warnings.push({
      type: 'warning',
      code: 'MESSAGE_WITHOUT_CONNECTION',
      message: `In ${branchName}: LinkedIn message has no prior connection request`,
      suggestion:
        'LinkedIn messages can only be sent to connections. Add a connection request step in the main flow or branch.',
      nodeIds: messageNodes.map((n) => n.id),
    });
  }

  return warnings;
}

/**
 * Pattern: condition (replied) without prior message
 * Problem: Nothing to reply to
 */
function checkConditionWithoutPriorAction(nodes: SequenceNode[]): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== 'condition') continue;

    const priorNodes = nodes.slice(0, i);
    const conditionType = node.data.condition;

    if (conditionType === 'message_replied' || conditionType === 'message_seen') {
      const hasMessage = priorNodes.some((n) => n.type === 'linkedin_message');
      if (!hasMessage) {
        const label = conditionType === 'message_replied' ? 'message replied' : 'message seen';
        warnings.push({
          type: 'warning',
          code: 'REPLY_CONDITION_WITHOUT_MESSAGE',
          message: `Condition "${label}" has no prior message step`,
          suggestion: 'Add a message step before checking for message interactions.',
          nodeIds: [node.id],
        });
      }
    }

    if (conditionType === 'connected') {
      const hasConnect = priorNodes.some((n) => n.type === 'linkedin_connect');
      if (!hasConnect) {
        warnings.push({
          type: 'warning',
          code: 'CONNECTED_CONDITION_WITHOUT_REQUEST',
          message: 'Condition "connected" has no prior connection request',
          suggestion:
            'Add a connection request step before checking connection status, or ensure leads are already connected.',
          nodeIds: [node.id],
        });
      }
    }

    if (
      conditionType === 'email_opened' ||
      conditionType === 'email_link_clicked' ||
      conditionType === 'email_replied'
    ) {
      const hasEmail = priorNodes.some((n) => n.type === 'email');
      if (!hasEmail) {
        const labelMap: Record<string, string> = {
          email_opened: 'email opened',
          email_link_clicked: 'email link clicked',
          email_replied: 'email replied',
        };
        warnings.push({
          type: 'warning',
          code: 'EMAIL_CONDITION_WITHOUT_EMAIL',
          message: `Condition "${labelMap[conditionType]}" has no prior email step`,
          suggestion: 'Add an email step before checking for email interactions.',
          nodeIds: [node.id],
        });
      }
    }
  }

  return warnings;
}

/**
 * Pattern: Multiple connection requests in sequence
 * Problem: You can only send one connection request
 */
function checkDuplicateActions(nodes: SequenceNode[], flowName?: string): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];
  const prefix = flowName ? `In ${flowName}: ` : '';

  const connectNodes = nodes.filter((n) => n.type === 'linkedin_connect');
  if (connectNodes.length > 1) {
    warnings.push({
      type: 'warning',
      code: 'DUPLICATE_CONNECTION_REQUEST',
      message: `${prefix}Multiple connection requests in sequence`,
      suggestion:
        'You can only send one connection request per person. Remove duplicate connection steps.',
      nodeIds: connectNodes.map((n) => n.id),
    });
  }

  return warnings;
}

/**
 * Pattern: Only wait steps, no actions
 * Problem: Campaign does nothing useful
 */
function checkWaitOnlySequence(nodes: SequenceNode[]): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  const actionTypes = [
    'linkedin_connect',
    'linkedin_message',
    'linkedin_inmail',
    'linkedin_view',
    'email',
  ];
  const hasActionStep = nodes.some((n) => actionTypes.includes(n.type));

  if (!hasActionStep && nodes.length > 0) {
    warnings.push({
      type: 'warning',
      code: 'NO_ACTION_STEPS',
      message: 'Sequence has no action steps',
      suggestion: 'Add action steps like profile view, connection request, or message.',
    });
  }

  return warnings;
}

/**
 * Check if InMail steps are used without InMail-capable senders
 */
function checkInmailCapability(
  nodes: SequenceNode[],
  context: ValidationContext
): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  const inmailNodes = nodes.filter((n) => n.type === 'linkedin_inmail');

  if (inmailNodes.length > 0 && context.hasInmailCapableSenders === false) {
    warnings.push({
      type: 'error',
      code: 'INMAIL_NO_CAPABLE_SENDER',
      message: 'Campaign uses InMail but no selected senders have InMail capability',
      suggestion:
        'InMail requires Premium, Sales Navigator, or Recruiter subscription. Select at least one sender with InMail capability, or remove the InMail steps.',
      nodeIds: inmailNodes.map((n) => n.id),
    });
  }

  return warnings;
}

/**
 * Check if email steps exist but no email account is selected
 */
function checkEmailAccountSelected(
  nodes: SequenceNode[],
  context: ValidationContext
): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  const emailNodes = nodes.filter((n) => n.type === 'email');

  if (emailNodes.length > 0 && context.hasEmailAccountSelected === false) {
    warnings.push({
      type: 'error',
      code: 'EMAIL_NO_ACCOUNT_SELECTED',
      message: 'Campaign has email steps but no email account selected',
      suggestion: 'Select at least one email account in the Senders step to send emails from.',
      nodeIds: emailNodes.map((n) => n.id),
    });
  }

  return warnings;
}

/**
 * Check if email steps exist without a prior enrichment step
 * Enrichment finds email addresses for leads — required before sending emails
 */
function checkEnrichmentBeforeEmail(nodes: SequenceNode[]): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  const hasEmailStep = nodes.some((n) => n.type === 'email');
  const hasEnrichmentStep = nodes.some((n) => n.type === 'enrichment');

  if (hasEmailStep && !hasEnrichmentStep) {
    const emailNodes = nodes.filter((n) => n.type === 'email');
    warnings.push({
      type: 'warning',
      code: 'EMAIL_WITHOUT_ENRICHMENT',
      message: 'No enrichment step before email steps',
      suggestion:
        "If your leads don't already have email addresses, add an enrichment step to find them. Leads without an email will be skipped during email steps.",
      nodeIds: emailNodes.map((n) => n.id),
    });
  }

  return warnings;
}

/**
 * Pattern: Very short wait (< 1 hour) before condition check
 * Problem: Might not give enough time for the action to take effect
 */
function checkShortWaitBeforeCondition(nodes: SequenceNode[]): SequenceWarning[] {
  const warnings: SequenceWarning[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const current = nodes[i];
    const next = nodes[i + 1];

    if (current.type === 'delay' && next.type === 'condition') {
      const delayDays = current.data.delayDays || 0;
      const delayHours = current.data.delayHours || 0;
      const totalHours = delayDays * 24 + delayHours;

      // Warn if wait is less than 24 hours before a "connected" condition
      if (totalHours < 24 && next.data.condition === 'connected') {
        warnings.push({
          type: 'warning',
          code: 'SHORT_WAIT_BEFORE_CONDITION',
          message: `Only ${totalHours} hour${totalHours !== 1 ? 's' : ''} wait before checking connection status`,
          suggestion:
            'Consider waiting at least 1-2 days to give the person time to accept the connection request.',
          nodeIds: [current.id, next.id],
        });
      }
    }
  }

  return warnings;
}

/**
 * Returns true if there are any errors (not just warnings)
 */
export function hasSequenceErrors(warnings: SequenceWarning[]): boolean {
  return warnings.some((w) => w.type === 'error');
}

/**
 * Returns true if there are any warnings (including errors)
 */
export function hasSequenceWarnings(warnings: SequenceWarning[]): boolean {
  return warnings.length > 0;
}

/**
 * Format warnings for display
 */
export function formatWarningsForDisplay(warnings: SequenceWarning[]): string {
  return warnings.map((w) => `• ${w.message}`).join('\n');
}
