import type { SequenceNode } from '@/components/campaign/SequenceCanvas'
import type { StepType } from '@/lib/types'

// Map frontend node type to backend step type
export function mapNodeTypeToStepType(nodeType: SequenceNode['type']): StepType | null {
  const mapping: Record<string, StepType> = {
    linkedin_connect: 'connection_request',
    linkedin_message: 'message',
    linkedin_follow: 'follow',
    linkedin_view: 'profile_view',
    email: 'email',
    delay: 'wait',
    condition: 'condition',
  }
  return mapping[nodeType] ?? null
}

// Map backend step type to frontend node type
export function mapStepTypeToNodeType(stepType: StepType): SequenceNode['type'] | null {
  const mapping: Record<StepType, SequenceNode['type']> = {
    connection_request: 'linkedin_connect',
    message: 'linkedin_message',
    follow: 'linkedin_follow',
    profile_view: 'linkedin_view',
    email: 'email',
    wait: 'delay',
    condition: 'condition',
    inmail: 'linkedin_message',
    like_post: 'linkedin_view',
    email_followup: 'email',
  }
  return mapping[stepType] ?? null
}

// Map frontend node data to backend config
export function mapNodeDataToConfig(node: SequenceNode): Record<string, unknown> {
  const config: Record<string, unknown> = {}

  if (node.data.message !== undefined) {
    config.message = node.data.message
  }
  if (node.data.subject !== undefined) {
    config.subject = node.data.subject
  }
  if (node.data.delayDays !== undefined) {
    config.delay_days = node.data.delayDays
  }
  if (node.data.delayHours !== undefined) {
    config.delay_hours = node.data.delayHours
  }
  if (node.data.condition !== undefined) {
    config.condition_type = node.data.condition
  }

  return config
}

// Map backend config to frontend node data
export function mapConfigToNodeData(config: Record<string, unknown>): SequenceNode['data'] {
  return {
    message: config.message as string | undefined,
    subject: config.subject as string | undefined,
    delayDays: config.delay_days as number | undefined,
    delayHours: config.delay_hours as number | undefined,
    condition: config.condition_type as 'connected' | 'replied' | 'opened' | undefined,
  }
}

// Filter and prepare nodes for saving (exclude start/end)
export function prepareNodesForSave(nodes: SequenceNode[]): Array<{
  order: number
  type: StepType
  config: Record<string, unknown>
}> {
  return nodes
    .filter((node) => node.type !== 'start' && node.type !== 'end')
    .map((node, index) => {
      const stepType = mapNodeTypeToStepType(node.type)
      if (!stepType) {
        throw new Error(`Unknown node type: ${node.type}`)
      }
      return {
        order: index + 1,
        type: stepType,
        config: mapNodeDataToConfig(node),
      }
    })
}
