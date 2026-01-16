// Template presets for quick start
export const SEQUENCE_TEMPLATES = {
  linkedinBasic: {
    name: 'LinkedIn Basic',
    description: 'Connect, wait, then message',
    nodes: [
      { id: 'start', type: 'start' as const, data: {} },
      {
        id: 't1',
        type: 'linkedin_connect' as const,
        data: {
          message: 'Hi {{firstName}}, I came across your profile and would love to connect!',
        },
      },
      { id: 't2', type: 'delay' as const, data: { delayDays: 2, delayHours: 0 } },
      {
        id: 't3',
        type: 'linkedin_message' as const,
        data: {
          message: 'Thanks for connecting, {{firstName}}! I wanted to reach out because...',
        },
      },
      { id: 'end', type: 'end' as const, data: {} },
    ],
  },
  multiChannel: {
    name: 'Multi-Channel',
    description: 'LinkedIn + Email follow-up',
    nodes: [
      { id: 'start', type: 'start' as const, data: {} },
      {
        id: 't1',
        type: 'linkedin_connect' as const,
        data: { message: 'Hi {{firstName}}, loved your insights on {{company}}!' },
      },
      { id: 't2', type: 'delay' as const, data: { delayDays: 3, delayHours: 0 } },
      { id: 't3', type: 'condition' as const, data: { condition: 'connected' as const } },
      {
        id: 't4',
        type: 'linkedin_message' as const,
        data: { message: 'Thanks for connecting! Quick question about {{company}}...' },
        parentId: 't3',
        branch: 'true' as const,
      },
      {
        id: 't5',
        type: 'email' as const,
        data: {
          subject: 'Quick question, {{firstName}}',
          message:
            'Hi {{firstName}},\n\nI tried connecting on LinkedIn but wanted to make sure my message reached you...',
        },
        parentId: 't3',
        branch: 'false' as const,
      },
      { id: 'end', type: 'end' as const, data: {} },
    ],
  },
  emailOnly: {
    name: 'Email Sequence',
    description: '3-touch email campaign',
    nodes: [
      { id: 'start', type: 'start' as const, data: {} },
      {
        id: 't1',
        type: 'email' as const,
        data: {
          subject: 'Quick question for {{company}}',
          message: 'Hi {{firstName}},\n\nI noticed that {{company}} is...',
        },
      },
      { id: 't2', type: 'delay' as const, data: { delayDays: 3, delayHours: 0 } },
      {
        id: 't3',
        type: 'email' as const,
        data: {
          subject: 'Re: Quick question for {{company}}',
          message: 'Hi {{firstName}},\n\nJust wanted to follow up on my previous email...',
        },
      },
      { id: 't4', type: 'delay' as const, data: { delayDays: 4, delayHours: 0 } },
      {
        id: 't5',
        type: 'email' as const,
        data: {
          subject: 'Last attempt',
          message:
            "Hi {{firstName}},\n\nI don't want to be a pest, but I'll close the loop here...",
        },
      },
      { id: 'end', type: 'end' as const, data: {} },
    ],
  },
};
